"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, esUuid } from "@/lib/db";
import type { FacturaResumen } from "@/lib/cfdi/tipos";
import { armarCfdi, datosPrefactura, facturaDeComprobante, guardarFactura, type FacturaGuardada } from "@/lib/prefactura";
import { usuarioActual } from "@/lib/sesion";

/*
 * Botón "Generar pre-factura" de /subir/recibido/[id].
 * 1. Valida sesión y que el comprobante sea de la persona, esté confirmado y sea una venta (lib/prefactura.ts).
 * 2. Llama a la API REST local: POST /api/cfdi (valida y "timbra"; con CFDI_PROVIDER=mock es SIMULADO).
 * 3. Descarga el PDF y el XML con GET /api/cfdi/{id}/pdf y /xml y los guarda en SQLite (tabla facturas).
 * Errores de la API (validación 422, PAC caído 503, timeout 504…) se muestran tal cual, sin guardar nada.
 */
export type EstadoPrefactura = { errores: string[]; factura: FacturaGuardada | null };

const NOMBRES_CAMPO: Record<string, string> = {
  SubTotal: "Subtotal",
  Total: "Total",
  "Impuestos.TotalImpuestosTrasladados": "IVA",
  LugarExpedicion: "Código postal",
  FormaPago: "Forma de pago",
  "Emisor.Rfc": "RFC de tu negocio",
  "Emisor.RegimenFiscal": "Régimen de tu negocio",
};

/** URL de la API REST. CFDI_API_URL si se configuró; si no, el mismo servidor que atiende esta petición. */
async function base(): Promise<string> {
  if (process.env.CFDI_API_URL) return process.env.CFDI_API_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? `127.0.0.1:${process.env.PORT ?? "3000"}`;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function llamar(ruta: string, init: RequestInit = {}): Promise<Response> {
  const cookie = (await headers()).get("cookie") ?? ""; // proxy.ts pide sesión también en /api
  return fetch(`${await base()}${ruta}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), cookie },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
}

async function mensajeDeError(r: Response): Promise<string[]> {
  try {
    const j = (await r.json()) as {
      error?: { codigo?: string; mensaje?: string; detalles?: { errores?: { campo: string; mensaje: string }[] } };
    };
    const lista = j.error?.detalles?.errores?.map((e) => `${NOMBRES_CAMPO[e.campo] ?? e.campo}: ${e.mensaje}`) ?? [];
    return [j.error?.mensaje ?? `La API de facturas respondió ${r.status}.`, ...lista];
  } catch {
    return [`La API de facturas respondió ${r.status}.`];
  }
}

export async function generarPrefactura(_prev: EstadoPrefactura, form: FormData): Promise<EstadoPrefactura> {
  const usuario = await usuarioActual();
  if (!usuario) return { errores: ["Tu sesión terminó. Vuelve a entrar."], factura: null };
  const id = String(form.get("comprobante") ?? "");
  const lote = String(form.get("lote") ?? "");
  if (!esUuid(id)) return { errores: ["No encontramos este comprobante."], factura: null };

  const d = db();
  const ya = facturaDeComprobante(d, usuario.id, id);
  if (ya) return { errores: [], factura: ya }; // no se factura dos veces

  const datos = datosPrefactura(d, usuario.id, id);
  if (!datos) return { errores: ["No encontramos este comprobante."], factura: null };
  const armado = armarCfdi(datos, {
    codigoPostal: String(form.get("cp") ?? ""),
    formaPago: String(form.get("formaPago") ?? ""),
  });
  if (!armado.ok) return { errores: armado.errores, factura: null };

  let factura: FacturaResumen;
  let pdf: Uint8Array;
  let xml: string;
  try {
    const r = await llamar("/api/cfdi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(armado.cfdi),
    });
    if (r.status !== 201) return { errores: await mensajeDeError(r), factura: null };
    factura = ((await r.json()) as { factura: FacturaResumen }).factura;

    const [rp, rx] = await Promise.all([llamar(`/api/cfdi/${factura.id}/pdf`), llamar(`/api/cfdi/${factura.id}/xml`)]);
    if (!rp.ok || !rx.ok) {
      return { errores: ["La factura se generó, pero no pudimos descargar el PDF o el XML. Intenta de nuevo.", ...(await mensajeDeError(rp.ok ? rx : rp))], factura: null };
    }
    pdf = new Uint8Array(await rp.arrayBuffer());
    xml = await rx.text();
  } catch (e) {
    console.error("generarPrefactura:", e);
    const tiempo = e instanceof Error && e.name === "TimeoutError";
    return {
      errores: [tiempo ? "La API de facturas tardó demasiado. Intenta de nuevo." : "No pudimos conectar con la API de facturas. Intenta de nuevo."],
      factura: null,
    };
  }

  const nombre = `${factura.simulado ? "SIMULADO_" : ""}${factura.serie ?? ""}${factura.folio ?? ""}_${factura.uuid}`;
  try {
    guardarFactura(d, usuario.id, id, factura, { bytes: pdf, nombre: `${nombre}.pdf` }, { texto: xml, nombre: `${nombre}.xml` });
  } catch (e) {
    console.error("guardarFactura:", e);
    return { errores: ["Se generó la pre-factura pero no pudimos guardarla. Intenta de nuevo."], factura: null };
  }
  if (esUuid(lote)) revalidatePath(`/subir/recibido/${lote}`);
  revalidatePath("/operaciones");
  return { errores: [], factura: facturaDeComprobante(d, usuario.id, id) };
}

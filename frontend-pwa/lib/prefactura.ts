/*
 * Pre-factura (CFDI 4.0, SIMULADA con CFDI_PROVIDER=mock) a partir de un comprobante YA REVISADO.
 * Sin "server-only" para probarlo con una base en memoria: lib/prefactura.test.ts
 *
 * Reglas (CLAUDE.md sec. 0, 3d y 16):
 *  - Solo se factura lo que la persona revisó y confirmó, y solo si es una VENTA (ingreso) de su negocio.
 *  - No se calcula nada: subtotal, IVA y total se COPIAN tal como quedaron en la revisión. La API
 *    /api/cfdi (lib/cfdi/validar.ts) comprueba que cuadren y, si no, dice el valor esperado.
 *  - La tasa de IVA no se adivina: se elige la del catálogo (16 %, 8 % o 0 %) con la que el IVA leído
 *    cuadra exactamente con el subtotal leído; si ninguna cuadra, se pide corregirlo en la revisión.
 *  - Los tickets casi nunca traen claves SAT por renglón, así que la pre-factura lleva UN concepto
 *    "Venta según ticket" por el subtotal, a público en general (XAXX010101000, 616, S01).
 */
import type { DatabaseSync } from "node:sqlite";
import { FORMA_PAGO, RFC_PUBLICO_GENERAL, TASAS_IVA } from "./cfdi/catalogos.ts";
import { leer, multiplicar, redondear } from "./cfdi/decimal.ts";
import type { CfdiEntrada, FacturaResumen } from "./cfdi/tipos.ts";

export type DatosPrefactura = {
  id: string;
  estado: string;
  clasificacion: string | null;
  serie: string | null;
  folio: string | null;
  subtotal: string | null;
  total: string | null;
  total_traslados: string | null;
  forma_pago: string | null;
  lugar_expedicion: string | null;
  negocio_nombre: string | null;
  negocio_rfc: string | null;
  negocio_regimen: string | null;
};

export type FacturaGuardada = {
  id: string;
  uuid: string;
  proveedor: "mock" | "facturama";
  simulado: number;
  serie: string | null;
  folio: string | null;
  total: string;
  creado_en: string;
};

/** node:sqlite devuelve filas sin prototipo; React no las deja pasar a componentes de cliente. */
const plano = <T,>(fila: unknown): T | null => (fila ? ({ ...(fila as object) } as T) : null);

/** Lo que hace falta para la pre-factura. Solo devuelve el comprobante si es de esa persona. */
export function datosPrefactura(d: DatabaseSync, usuarioId: string, comprobanteId: string): DatosPrefactura | null {
  return plano<DatosPrefactura>(
    d
      .prepare(
        `SELECT c.id, c.estado, c.clasificacion, c.serie, c.folio, c.subtotal, c.total, c.total_traslados,
                c.forma_pago, c.lugar_expedicion,
                n.nombre AS negocio_nombre, n.rfc AS negocio_rfc, n.regimen AS negocio_regimen
           FROM comprobantes c
           LEFT JOIN negocios n ON n.usuario_id = c.usuario_id
          WHERE c.id = ? AND c.usuario_id = ?`,
      )
      .get(comprobanteId, usuarioId),
  );
}

/** Un dato pendiente para poder facturar y la pantalla donde se completa. */
export type Pendiente = { dato: string; accion: "revisar" | "configurar" };

/**
 * motivo: texto corto. accion: la pantalla del primer pendiente.
 * faltan: TODO lo que falta (para la etiqueta "Para facturar falta…").
 * noAplica: el documento nunca se factura desde aquí (compra, pago o no se leyó).
 */
export type Bloqueo = { motivo: string; accion: "revisar" | "configurar" | null; faltan: Pendiente[]; noAplica?: boolean };

/** ¿Se puede generar? Devuelve todo lo que falta (con la pantalla que lo resuelve) o null si ya está disponible. */
export function bloqueoPrefactura(c: DatosPrefactura): Bloqueo | null {
  if (c.estado === "error") return { motivo: "Este documento no se pudo leer.", accion: null, faltan: [], noAplica: true };
  if (c.clasificacion === "egreso" || c.clasificacion === "pago") {
    return { motivo: "Solo se facturan tus ventas. Este documento quedó como compra o pago.", accion: "revisar", faltan: [], noAplica: true };
  }
  const faltan: Pendiente[] = [];
  if (c.estado !== "confirmado") faltan.push({ dato: "confirmar la revisión", accion: "revisar" });
  if (c.clasificacion !== "ingreso") faltan.push({ dato: "marcarlo como venta", accion: "revisar" });
  // Se copian del ticket revisado; no se calculan (CLAUDE.md sec. 0).
  if (!c.subtotal) faltan.push({ dato: "subtotal", accion: "revisar" });
  if (!c.total_traslados) faltan.push({ dato: "IVA", accion: "revisar" });
  if (!c.total) faltan.push({ dato: "total", accion: "revisar" });
  if (!c.negocio_rfc) faltan.push({ dato: "RFC de tu negocio", accion: "configurar" });
  if (!c.negocio_regimen) faltan.push({ dato: "régimen fiscal de tu negocio", accion: "configurar" });
  if (!faltan.length) return null;
  return { motivo: `Para facturar falta: ${faltan.map((f) => f.dato).join(", ")}.`, accion: faltan[0].accion, faltan };
}

/** Tasa del catálogo con la que IVA = subtotal × tasa (a 2 decimales). null si ninguna cuadra. */
export function tasaIva(subtotal: string, iva: string): string | null {
  const s = leer(subtotal);
  const i = leer(iva);
  if (s === null || i === null) return null;
  return TASAS_IVA.find((t) => redondear(multiplicar(s, leer(t)!), 2) === redondear(i, 2)) ?? null;
}

export type Opciones = { codigoPostal: string; formaPago: string };
export type Armado = { ok: true; cfdi: CfdiEntrada } | { ok: false; errores: string[] };

/** Arma el cuerpo para POST /api/cfdi copiando los datos revisados. No calcula importes. */
export function armarCfdi(c: DatosPrefactura, op: Opciones): Armado {
  const bloqueo = bloqueoPrefactura(c);
  if (bloqueo) return { ok: false, errores: [bloqueo.motivo] };
  const errores: string[] = [];
  const cp = op.codigoPostal.trim();
  if (!/^\d{5}$/.test(cp)) errores.push("Escribe el código postal de tu negocio (5 dígitos).");
  if (!(op.formaPago in FORMA_PAGO)) errores.push("Elige la forma de pago.");
  const subtotal = c.subtotal!;
  const iva = c.total_traslados!;
  const tasa = tasaIva(subtotal, iva);
  if (!tasa) {
    errores.push(`El IVA ($${iva}) no corresponde al 16 %, 8 % ni 0 % del subtotal ($${subtotal}). Corrígelo en la revisión.`);
  }
  if (errores.length) return { ok: false, errores };

  const traslado = { Base: subtotal, Impuesto: "002", TipoFactor: "Tasa" as const, TasaOCuota: tasa!, Importe: iva };
  const ticket = [c.serie, c.folio].filter(Boolean).join("");
  return {
    ok: true,
    cfdi: {
      Version: "4.0",
      Serie: "DZ",
      Fecha: "AUTO",
      FormaPago: op.formaPago,
      MetodoPago: "PUE",
      Moneda: "MXN",
      TipoDeComprobante: "I",
      Exportacion: "01",
      LugarExpedicion: cp,
      SubTotal: subtotal,
      Total: c.total!,
      Emisor: { Rfc: c.negocio_rfc!, Nombre: (c.negocio_nombre ?? "").toUpperCase(), RegimenFiscal: c.negocio_regimen! },
      Receptor: {
        Rfc: RFC_PUBLICO_GENERAL,
        Nombre: "PUBLICO EN GENERAL",
        DomicilioFiscalReceptor: cp, // con público en general va el mismo CP que LugarExpedicion
        RegimenFiscalReceptor: "616",
        UsoCFDI: "S01",
      },
      Conceptos: [
        {
          ClaveProdServ: "01010101", // "No existe en el catálogo": el ticket no trae la clave del producto
          Cantidad: "1",
          ClaveUnidad: "ACT", // actividad
          Descripcion: ticket ? `Venta según ticket ${ticket}` : "Venta según ticket",
          ValorUnitario: subtotal,
          Importe: subtotal,
          ObjetoImp: "02",
          Impuestos: { Traslados: [traslado] },
        },
      ],
      Impuestos: { TotalImpuestosTrasladados: iva, Traslados: [traslado] },
    },
  };
}

/** Guarda la pre-factura emitida con su PDF y XML. */
export function guardarFactura(
  d: DatabaseSync,
  usuarioId: string,
  comprobanteId: string,
  f: FacturaResumen,
  pdf: { bytes: Uint8Array; nombre: string },
  xml: { texto: string; nombre: string },
) {
  d.prepare(
    `INSERT INTO facturas (id, comprobante_id, usuario_id, uuid, proveedor, simulado, serie, folio, total, pdf, pdf_nombre, xml, xml_nombre)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(f.id, comprobanteId, usuarioId, f.uuid, f.proveedor, f.simulado ? 1 : 0, f.serie, f.folio, f.total,
    pdf.bytes, pdf.nombre, xml.texto, xml.nombre);
}

export function facturaDeComprobante(d: DatabaseSync, usuarioId: string, comprobanteId: string): FacturaGuardada | null {
  return plano<FacturaGuardada>(
    d
      .prepare(
        `SELECT id, uuid, proveedor, simulado, serie, folio, total, creado_en
           FROM facturas WHERE comprobante_id = ? AND usuario_id = ?`,
      )
      .get(comprobanteId, usuarioId),
  );
}

/** El archivo guardado, solo si la factura es de esa persona. */
export function archivoFactura(
  d: DatabaseSync,
  usuarioId: string,
  facturaId: string,
  formato: "pdf" | "xml",
): { bytes: Uint8Array; nombre: string; tipo: string } | null {
  const f = d
    .prepare("SELECT pdf, pdf_nombre, xml, xml_nombre FROM facturas WHERE id = ? AND usuario_id = ?")
    .get(facturaId, usuarioId) as { pdf: Uint8Array; pdf_nombre: string; xml: string; xml_nombre: string } | undefined;
  if (!f) return null;
  return formato === "pdf"
    ? { bytes: f.pdf, nombre: f.pdf_nombre, tipo: "application/pdf" }
    : { bytes: new TextEncoder().encode(f.xml), nombre: f.xml_nombre, tipo: "application/xml; charset=utf-8" };
}

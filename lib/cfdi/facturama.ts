import "server-only";
import { MOTIVO_CANCELACION } from "./catalogos";
import type { OpcionesPrueba, ProveedorCfdi } from "./proveedor";
import { ErrorCfdi, type CfdiEntrada, type FacturaResumen } from "./tipos";

/*
 * Adaptador para Facturama (PAC), pensado para su SANDBOX (FACTURAMA_URL=https://apisandbox.facturama.mx).
 * Lo timbrado en sandbox NO tiene validez fiscal.
 *
 * ⚠️ SIN VERIFICAR: la documentación de Facturama no se pudo consultar al escribir este
 * archivo (el servidor rechazó la conexión). Rutas y nombres de campo vienen de la
 * "API Web" de Facturama tal como la conocemos; hay que probarlos contra el sandbox con
 * una cuenta real antes de presentarlo como funcional. Puntos a confirmar:
 *   - POST /3/cfdis           crear CFDI 4.0 (emisor = perfil de la cuenta)
 *   - GET  /cfdi/{id}?type=issued, GET /cfdi?type=issued
 *   - GET  /cfdi/{xml|pdf}/issued/{id}   → { Content: base64, ContentType, ... }
 *   - DELETE /cfdi/{id}?type=issued&motive=02&uuidReplacement=
 *   - Nombres: Currency, ExpeditionPlace, PaymentForm, PaymentMethod, CfdiType, Exportation,
 *     Receiver{Rfc,Name,CfdiUse,FiscalRegime,TaxZipCode},
 *     Items[{ProductCode,Description,UnitCode,Quantity,UnitPrice,Subtotal,TaxObject,Taxes[],Total}]
 * Facturama recibe su propio JSON (nombres en inglés), no el formato SAT de nuestra API;
 * aquí se traduce uno a otro.
 */
function conf() {
  const url = (process.env.FACTURAMA_URL ?? "").split("#")[0].trim().replace(/\/$/, "");
  const usuario = process.env.FACTURAMA_USUARIO?.trim();
  const password = process.env.FACTURAMA_PASSWORD?.trim();
  if (!url || !usuario || !password) {
    throw new ErrorCfdi(500, "config", "Faltan FACTURAMA_URL, FACTURAMA_USUARIO o FACTURAMA_PASSWORD en .env.");
  }
  if (!url.includes("sandbox")) {
    // Protección: la demo nunca debe timbrar en producción (CLAUDE.md: timbrado SIMULADO).
    throw new ErrorCfdi(500, "config", "FACTURAMA_URL no es el sandbox. Esta app solo permite el entorno de pruebas.");
  }
  return { url, auth: "Basic " + Buffer.from(`${usuario}:${password}`).toString("base64") };
}

const NOMBRE_IMPUESTO: Record<string, string> = { "001": "ISR", "002": "IVA", "003": "IEPS" };

/** Formato SAT (nuestra API) → JSON de Facturama. */
export function aFacturama(c: CfdiEntrada) {
  return {
    ...(c.Serie ? { Serie: c.Serie } : {}),
    ...(c.Folio ? { Folio: c.Folio } : {}),
    ...(c.Fecha !== "AUTO" ? { Date: c.Fecha } : {}),
    Currency: c.Moneda,
    ExpeditionPlace: c.LugarExpedicion,
    PaymentForm: c.FormaPago,
    PaymentMethod: c.MetodoPago,
    CfdiType: c.TipoDeComprobante,
    Exportation: c.Exportacion,
    Receiver: {
      Rfc: c.Receptor.Rfc,
      Name: c.Receptor.Nombre,
      CfdiUse: c.Receptor.UsoCFDI,
      FiscalRegime: c.Receptor.RegimenFiscalReceptor,
      TaxZipCode: c.Receptor.DomicilioFiscalReceptor,
    },
    Items: c.Conceptos.map((k) => {
      const taxes = (k.Impuestos?.Traslados ?? []).map((t) => ({
        Name: NOMBRE_IMPUESTO[t.Impuesto] ?? t.Impuesto,
        Base: Number(t.Base),
        Rate: t.TipoFactor === "Exento" ? 0 : Number(t.TasaOCuota),
        Total: Number(t.Importe ?? 0),
        IsRetention: false,
        ...(t.TipoFactor === "Exento" ? { IsExempt: true } : {}),
      }));
      return {
        ProductCode: k.ClaveProdServ,
        ...(k.NoIdentificacion ? { IdentificationNumber: k.NoIdentificacion } : {}),
        Description: k.Descripcion,
        ...(k.Unidad ? { Unit: k.Unidad } : {}),
        UnitCode: k.ClaveUnidad,
        Quantity: Number(k.Cantidad),
        UnitPrice: Number(k.ValorUnitario),
        Subtotal: Number(k.Importe),
        TaxObject: k.ObjetoImp,
        ...(taxes.length ? { Taxes: taxes } : {}),
        Total: Number((Number(k.Importe) + taxes.reduce((s, t) => s + t.Total, 0)).toFixed(2)),
      };
    }),
  };
}

async function llamar(ruta: string, init: RequestInit = {}) {
  const { url, auth } = conf();
  let r: Response;
  try {
    r = await fetch(url + ruta, {
      ...init,
      headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
  } catch (e) {
    const timeout = e instanceof Error && e.name === "TimeoutError";
    throw new ErrorCfdi(timeout ? 504 : 502, timeout ? "pac_timeout" : "pac_sin_conexion",
      timeout ? "Facturama no respondió a tiempo." : "No se pudo conectar con Facturama.");
  }
  const cuerpo = await r.text();
  const json = cuerpo ? safeJson(cuerpo) : null;
  if (!r.ok) {
    const status = r.status === 401 ? 502 : r.status >= 500 ? 502 : r.status === 404 ? 404 : 422;
    const mensaje = r.status === 401
      ? "Facturama rechazó las credenciales (revisa FACTURAMA_USUARIO / FACTURAMA_PASSWORD)."
      : (json as { Message?: string } | null)?.Message ?? `Facturama respondió ${r.status}.`;
    throw new ErrorCfdi(status, "pac_error", mensaje, { statusFacturama: r.status, respuesta: json ?? cuerpo.slice(0, 2000) });
  }
  return json;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

type RespFacturama = {
  Id: string; Serie?: string; Folio?: string; Date?: string; Status?: string;
  Issuer?: { Rfc?: string; TaxName?: string; FiscalRegime?: string };
  Receiver?: { Rfc?: string; Name?: string; CfdiUse?: string };
  Subtotal?: number; Total?: number;
  Complement?: { TaxStamp?: { Uuid?: string; Date?: string } };
};

function resumen(f: RespFacturama, respaldo?: CfdiEntrada): FacturaResumen {
  const cancelada = /cancel/i.test(f.Status ?? "");
  return {
    id: f.Id,
    uuid: f.Complement?.TaxStamp?.Uuid ?? "",
    proveedor: "facturama",
    simulado: false,
    validezFiscal: false,
    estado: cancelada ? "cancelada" : "vigente",
    serie: f.Serie ?? respaldo?.Serie ?? null,
    folio: f.Folio ?? respaldo?.Folio ?? null,
    fecha: f.Date ?? "",
    fechaTimbrado: f.Complement?.TaxStamp?.Date ?? f.Date ?? "",
    emisor: { rfc: f.Issuer?.Rfc ?? "", nombre: f.Issuer?.TaxName ?? "", regimenFiscal: f.Issuer?.FiscalRegime ?? respaldo?.Emisor.RegimenFiscal ?? "" },
    receptor: {
      rfc: f.Receiver?.Rfc ?? respaldo?.Receptor.Rfc ?? "",
      nombre: f.Receiver?.Name ?? respaldo?.Receptor.Nombre ?? "",
      usoCfdi: f.Receiver?.CfdiUse ?? respaldo?.Receptor.UsoCFDI ?? "",
    },
    subTotal: f.Subtotal !== undefined ? f.Subtotal.toFixed(2) : respaldo?.SubTotal ?? "",
    total: f.Total !== undefined ? f.Total.toFixed(2) : respaldo?.Total ?? "",
    aviso: "SANDBOX de Facturama: timbrado de prueba, sin validez fiscal.",
  };
}

export const facturama: ProveedorCfdi = {
  nombre: "facturama",
  descripcion: "Facturama sandbox (sin validez fiscal) · adaptador SIN VERIFICAR contra la documentación",

  async emitir(c: CfdiEntrada, op: OpcionesPrueba = {}) {
    if (op.simularFallo) throw new ErrorCfdi(400, "no_soportado", "x-simular-fallo solo funciona con CFDI_PROVIDER=mock.");
    const r = (await llamar("/3/cfdis", { method: "POST", body: JSON.stringify(aFacturama(c)) })) as RespFacturama;
    return resumen(r, c);
  },

  async obtener(id) {
    return resumen((await llamar(`/cfdi/${encodeURIComponent(id)}?type=issued`)) as RespFacturama);
  },

  async listar() {
    const r = await llamar("/cfdi?type=issued");
    return Array.isArray(r) ? (r as RespFacturama[]).map((f) => resumen(f)) : [];
  },

  async archivo(id, formato) {
    const r = (await llamar(`/cfdi/${formato}/issued/${encodeURIComponent(id)}`)) as { Content?: string } | null;
    if (!r?.Content) throw new ErrorCfdi(502, "pac_error", `Facturama no devolvió el ${formato.toUpperCase()}.`);
    return {
      bytes: new Uint8Array(Buffer.from(r.Content, "base64")),
      tipo: formato === "xml" ? "application/xml; charset=utf-8" : "application/pdf",
      nombre: `SANDBOX_${id}.${formato}`,
    };
  },

  async cancelar(id, motivo, uuidSustitucion) {
    if (!(motivo in MOTIVO_CANCELACION)) throw new ErrorCfdi(400, "motivo_invalido", "Motivo de cancelación no válido (01, 02, 03 o 04).");
    const q = new URLSearchParams({ type: "issued", motive: motivo, uuidReplacement: uuidSustitucion ?? "" });
    await llamar(`/cfdi/${encodeURIComponent(id)}?${q}`, { method: "DELETE" });
    return this.obtener(id);
  },
};

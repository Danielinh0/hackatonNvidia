/*
 * Lectura del JSON que entrega el modelo de visión (forma de CFDI 4.0, Anexo 20 del SAT).
 * Función pura, sin red ni base de datos, con pruebas: lib/cfdi.test.ts
 *
 * Solo ordena y valida la FORMA del dato (texto, decimal, catálogo de pocas opciones).
 * No hace cálculos fiscales: cuadrar subtotal + IVA = total va en backend-ia/reglas_fiscales.py
 * (CLAUDE.md sec. 0). Lo que no se leyó queda en null y se anota en `faltantes`
 * para que Bisie' lo pregunte y la persona lo complete en la revisión.
 */

export type Impuesto = {
  tipo: "traslado" | "retencion";
  base: string | null;
  impuesto: "001" | "002" | "003" | null;
  tipoFactor: "Tasa" | "Cuota" | "Exento" | null;
  tasaOCuota: string | null;
  importe: string | null;
};

export type Concepto = {
  claveProdServ: string | null;
  noIdentificacion: string | null;
  cantidad: string | null;
  claveUnidad: string | null;
  unidad: string | null;
  descripcion: string | null;
  valorUnitario: string | null;
  importe: string | null;
  descuento: string | null;
  objetoImp: string | null;
  impuestos: Impuesto[];
};

export type Cfdi = {
  version: string | null;
  serie: string | null;
  folio: string | null;
  fecha: string | null;
  formaPago: string | null;
  metodoPago: "PUE" | "PPD" | null;
  moneda: string | null;
  tipoDeComprobante: "I" | "E" | "T" | "N" | "P" | null;
  exportacion: string | null;
  lugarExpedicion: string | null;
  subTotal: string | null;
  descuento: string | null;
  total: string | null;
  totalTraslados: string | null;
  totalRetenciones: string | null;
  uuid: string | null;
  emisor: { rfc: string | null; nombre: string | null; regimenFiscal: string | null };
  receptor: {
    rfc: string | null;
    nombre: string | null;
    domicilioFiscal: string | null;
    regimenFiscal: string | null;
    usoCfdi: string | null;
  };
  conceptos: Concepto[];
  impuestos: Impuesto[]; // resumen del comprobante
};

export type Lectura = { ok: true; cfdi: Cfdi; faltantes: string[] } | { ok: false; motivo: string };

/** Campos sin los que no se puede confirmar una operación: si faltan, se piden en la revisión. */
const OBLIGATORIOS = ["Fecha", "Total", "Emisor.Rfc", "Emisor.Nombre"] as const;

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Texto limpio; "", "AUTO", "N/A" y "null" cuentan como "no se leyó". */
function texto(v: unknown): string | null {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" || /^(auto|n\/?a|null|none)$/i.test(t) ? null : t;
}

/** Decimal en texto ("2901.16"). Se rechaza lo que no lo sea (p. ej. "$2,901.16" sin limpiar). */
function decimal(v: unknown): string | null {
  const t = texto(v);
  return t !== null && /^-?\d+(\.\d+)?$/.test(t) ? t : null;
}

function opcion<T extends string>(v: unknown, opciones: readonly T[]): T | null {
  const t = texto(v);
  return t !== null && (opciones as readonly string[]).includes(t) ? (t as T) : null;
}

/** Fecha ISO "2026-11-20" o "2026-11-20T13:05:00". */
function fecha(v: unknown): string | null {
  const t = texto(v);
  return t !== null && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(t) ? t : null;
}

/** RFC con forma válida (12 caracteres persona moral, 13 física). No consulta al SAT. */
function rfc(v: unknown): string | null {
  const t = texto(v)?.toUpperCase() ?? null;
  return t !== null && /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(t) ? t : null;
}

const uuid = (v: unknown) => {
  const t = texto(v)?.toUpperCase() ?? null;
  return t !== null && /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(t) ? t : null;
};

function impuestosDe(nodo: unknown): Impuesto[] {
  if (!esObj(nodo)) return [];
  const lista = (v: unknown, tipo: Impuesto["tipo"]): Impuesto[] =>
    (Array.isArray(v) ? v : []).filter(esObj).map((x) => ({
      tipo,
      base: decimal(x.Base),
      impuesto: opcion(x.Impuesto, ["001", "002", "003"] as const),
      tipoFactor: opcion(x.TipoFactor, ["Tasa", "Cuota", "Exento"] as const),
      tasaOCuota: decimal(x.TasaOCuota),
      importe: decimal(x.Importe),
    }));
  return [...lista(nodo.Traslados, "traslado"), ...lista(nodo.Retenciones, "retencion")];
}

/**
 * Convierte la salida del modelo en un Cfdi ordenado. Acepta el JSON tal cual o envuelto
 * como { "cfdi": { … } }. Solo falla si no es un objeto o no trae nada útil.
 */
export function leerCfdi(entrada: unknown): Lectura {
  const raiz = esObj(entrada) && esObj(entrada.cfdi) ? entrada.cfdi : entrada;
  if (!esObj(raiz)) return { ok: false, motivo: "El modelo no devolvió un objeto JSON." };

  const em = esObj(raiz.Emisor) ? raiz.Emisor : {};
  const re = esObj(raiz.Receptor) ? raiz.Receptor : {};
  const imp = esObj(raiz.Impuestos) ? raiz.Impuestos : {};
  const comp = esObj(raiz.Complemento) ? raiz.Complemento : {};
  const timbre = esObj(comp.TimbreFiscalDigital) ? comp.TimbreFiscalDigital : {};

  const cfdi: Cfdi = {
    version: texto(raiz.Version),
    serie: texto(raiz.Serie),
    folio: texto(raiz.Folio),
    fecha: fecha(raiz.Fecha),
    formaPago: texto(raiz.FormaPago),
    metodoPago: opcion(raiz.MetodoPago, ["PUE", "PPD"] as const),
    moneda: texto(raiz.Moneda),
    tipoDeComprobante: opcion(raiz.TipoDeComprobante, ["I", "E", "T", "N", "P"] as const),
    exportacion: texto(raiz.Exportacion),
    lugarExpedicion: texto(raiz.LugarExpedicion),
    subTotal: decimal(raiz.SubTotal),
    descuento: decimal(raiz.Descuento),
    total: decimal(raiz.Total),
    totalTraslados: decimal(imp.TotalImpuestosTrasladados),
    totalRetenciones: decimal(imp.TotalImpuestosRetenidos),
    uuid: uuid(timbre.UUID ?? raiz.UUID),
    emisor: { rfc: rfc(em.Rfc), nombre: texto(em.Nombre), regimenFiscal: texto(em.RegimenFiscal) },
    receptor: {
      rfc: rfc(re.Rfc),
      nombre: texto(re.Nombre),
      domicilioFiscal: texto(re.DomicilioFiscalReceptor),
      regimenFiscal: texto(re.RegimenFiscalReceptor),
      usoCfdi: texto(re.UsoCFDI),
    },
    conceptos: (Array.isArray(raiz.Conceptos) ? raiz.Conceptos : []).filter(esObj).map((c) => ({
      claveProdServ: texto(c.ClaveProdServ),
      noIdentificacion: texto(c.NoIdentificacion),
      cantidad: decimal(c.Cantidad),
      claveUnidad: texto(c.ClaveUnidad),
      unidad: texto(c.Unidad),
      descripcion: texto(c.Descripcion),
      valorUnitario: decimal(c.ValorUnitario),
      importe: decimal(c.Importe),
      descuento: decimal(c.Descuento),
      objetoImp: texto(c.ObjetoImp),
      impuestos: impuestosDe(c.Impuestos),
    })),
    impuestos: impuestosDe(imp),
  };

  const valor: Record<(typeof OBLIGATORIOS)[number], string | null> = {
    Fecha: cfdi.fecha,
    Total: cfdi.total,
    "Emisor.Rfc": cfdi.emisor.rfc,
    "Emisor.Nombre": cfdi.emisor.nombre,
  };
  const faltantes: string[] = OBLIGATORIOS.filter((k) => valor[k] === null);
  if (cfdi.conceptos.length === 0) faltantes.push("Conceptos");

  const nadaUtil = cfdi.total === null && cfdi.subTotal === null && cfdi.emisor.rfc === null && cfdi.conceptos.length === 0;
  if (nadaUtil) return { ok: false, motivo: "No se pudo leer ningún dato del documento." };

  return { ok: true, cfdi, faltantes };
}

/** "2901.16" → 290116. Solo para sumar totales en pantalla (redondeo a centavos, mitad hacia arriba). */
export function aCentavos(v: string | null): number | null {
  if (v === null || !/^-?\d+(\.\d+)?$/.test(v)) return null;
  const negativo = v.startsWith("-");
  const [ent, dec = ""] = v.replace("-", "").split(".");
  let c = Number(ent) * 100 + Number((dec + "00").slice(0, 2));
  if (Number(dec[2] ?? "0") >= 5) c += 1;
  return negativo ? -c : c;
}

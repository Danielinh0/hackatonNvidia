/*
 * Consultas de las pantallas (Inicio, Operaciones, Mi mes, Revisión) sobre `comprobantes`.
 * Recibe la base como parámetro para poder probarlo en memoria: lib/operaciones.test.ts
 *
 * Solo cuenta y suma totales tal como se leyeron. No calcula impuestos (IVA acreditable,
 * ISR): eso va en backend-ia/reglas_fiscales.py (CLAUDE.md sec. 0). Todo lo que se muestra
 * es estimación, no determinación oficial.
 */
import type { DatabaseSync } from "node:sqlite";
import { aCentavos } from "./cfdi.ts";

export type Clasificacion = "ingreso" | "egreso" | "pago";

/*
 * Clasificación propuesta (CLAUDE.md sec. 13): la que confirmó la persona; si no, por RFC:
 * lo emitió su negocio → ingreso; lo emitió otro → egreso; no se leyó el emisor → NULL (preguntar).
 */
const CLASIFICACION = /* sql */ `
  COALESCE(c.clasificacion,
    CASE WHEN c.emisor_rfc IS NULL OR n.rfc IS NULL THEN NULL
         WHEN c.emisor_rfc = n.rfc THEN 'ingreso'
         ELSE 'egreso' END)`;

/** Fecha del movimiento: la del documento o, si no se leyó, la de subida. */
const FECHA = /* sql */ `COALESCE(c.fecha, c.creado_en)`;

export type Operacion = {
  id: string;
  estado: "por_revisar" | "confirmado";
  clasificacion: Clasificacion | null;
  contraparte: string | null; // quién cobró (egreso) o a quién se le vendió (ingreso)
  descripcion: string | null; // primer concepto
  total: string | null;
  total_centavos: number | null;
  moneda: string | null;
  fecha: string; // ISO; ver FECHA
  fecha_leida: number; // 1 si la fecha viene del documento
  tiene_cfdi: number; // 1 si se leyó UUID (indicio, no verificación ante el SAT)
  conf_global: number | null;
  origen: "camara" | "archivo";
  analisis_simulado: number;
};

const SELECT_OPERACION = /* sql */ `
  SELECT c.id, c.estado, ${CLASIFICACION} AS clasificacion,
         CASE WHEN ${CLASIFICACION} = 'ingreso' THEN COALESCE(c.receptor_nombre, c.receptor_rfc)
              ELSE COALESCE(c.emisor_nombre, c.emisor_rfc) END AS contraparte,
         (SELECT k.descripcion FROM conceptos k WHERE k.comprobante_id = c.id ORDER BY k.orden LIMIT 1) AS descripcion,
         c.total, c.total_centavos, c.moneda, ${FECHA} AS fecha, (c.fecha IS NOT NULL) AS fecha_leida,
         (c.uuid_cfdi IS NOT NULL) AS tiene_cfdi, c.conf_global, c.origen, c.analisis_simulado
    FROM comprobantes c LEFT JOIN negocios n ON n.usuario_id = c.usuario_id`;

/** Operaciones visibles (por revisar y confirmadas), de la más reciente a la más vieja. */
export function listarOperaciones(d: DatabaseSync, usuarioId: string, { mes, limite }: { mes?: string; limite?: number } = {}): Operacion[] {
  const filtroMes = mes ? `AND substr(${FECHA}, 1, 7) = ?` : "";
  const params: (string | number)[] = [usuarioId];
  if (mes) params.push(mes);
  params.push(limite ?? -1);
  return d
    .prepare(
      `${SELECT_OPERACION}
        WHERE c.usuario_id = ? AND c.estado IN ('por_revisar', 'confirmado') ${filtroMes}
        ORDER BY ${FECHA} DESC, c.creado_en DESC
        LIMIT ?`,
    )
    .all(...params) as Operacion[];
}

/** Ids por revisar, en el orden en que se subieron (el más viejo primero). */
export function pendientes(d: DatabaseSync, usuarioId: string): string[] {
  return (
    d
      .prepare("SELECT id FROM comprobantes WHERE usuario_id = ? AND estado = 'por_revisar' ORDER BY creado_en, nombre_archivo")
      .all(usuarioId) as { id: string }[]
  ).map((r) => r.id);
}

export type ResumenMes = {
  mes: string; // "2026-11"
  ingresos: number; // centavos
  egresosConCfdi: number;
  egresosSinCfdi: number;
  pagos: number;
  nIngresos: number;
  nEgresos: number;
  nConCfdi: number;
  nSinClasificar: number; // confirmadas sin clasificación (no debería pasar) + por revisar
  nPorRevisar: number;
};

/** Sumas del mes con lo CONFIRMADO. Lo que está por revisar solo se cuenta, no se suma. */
export function resumenMes(d: DatabaseSync, usuarioId: string, mes: string): ResumenMes {
  const r = d
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} = 'ingreso' THEN c.total_centavos END), 0) AS ingresos,
         COALESCE(SUM(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} = 'egreso' AND c.uuid_cfdi IS NOT NULL THEN c.total_centavos END), 0) AS egresosConCfdi,
         COALESCE(SUM(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} = 'egreso' AND c.uuid_cfdi IS NULL THEN c.total_centavos END), 0) AS egresosSinCfdi,
         COALESCE(SUM(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} = 'pago' THEN c.total_centavos END), 0) AS pagos,
         COUNT(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} = 'ingreso' THEN 1 END) AS nIngresos,
         COUNT(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} = 'egreso' THEN 1 END) AS nEgresos,
         COUNT(CASE WHEN c.estado = 'confirmado' AND c.uuid_cfdi IS NOT NULL THEN 1 END) AS nConCfdi,
         COUNT(CASE WHEN c.estado = 'confirmado' AND ${CLASIFICACION} IS NULL THEN 1 END) AS nSinClasificar,
         COUNT(CASE WHEN c.estado = 'por_revisar' THEN 1 END) AS nPorRevisar
       FROM comprobantes c LEFT JOIN negocios n ON n.usuario_id = c.usuario_id
      WHERE c.usuario_id = ? AND substr(${FECHA}, 1, 7) = ?`,
    )
    .get(usuarioId, mes) as Omit<ResumenMes, "mes">;
  return { mes, ...r };
}

/** Ingresos y egresos confirmados por semana del mes (1–7, 8–14, 15–21, 22–fin). */
export function semanasMes(d: DatabaseSync, usuarioId: string, mes: string) {
  const filas = d
    .prepare(
      `SELECT MIN((CAST(substr(${FECHA}, 9, 2) AS INTEGER) - 1) / 7, 3) AS semana,
              COALESCE(SUM(CASE WHEN ${CLASIFICACION} = 'ingreso' THEN c.total_centavos END), 0) AS ingreso,
              COALESCE(SUM(CASE WHEN ${CLASIFICACION} = 'egreso' THEN c.total_centavos END), 0) AS gasto
         FROM comprobantes c LEFT JOIN negocios n ON n.usuario_id = c.usuario_id
        WHERE c.usuario_id = ? AND c.estado = 'confirmado' AND substr(${FECHA}, 1, 7) = ?
        GROUP BY semana`,
    )
    .all(usuarioId, mes) as { semana: number; ingreso: number; gasto: number }[];
  return [0, 1, 2, 3].map((i) => filas.find((f) => f.semana === i) ?? { semana: i, ingreso: 0, gasto: 0 });
}

/*
 * Gastos confirmados pagados en efectivo (c_FormaPago 01) por más de $2,000.
 * Regla "gancho" de CLAUDE.md sec. 12, PENDIENTE de verificar en LISR/LIVA vigentes: se muestra como aviso, no como determinación.
 */
export const LIMITE_EFECTIVO_CENTAVOS = 200_000;
export function efectivoAlto(d: DatabaseSync, usuarioId: string, mes: string): { n: number; total: number } {
  return d
    .prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(c.total_centavos), 0) AS total
         FROM comprobantes c LEFT JOIN negocios n ON n.usuario_id = c.usuario_id
        WHERE c.usuario_id = ? AND c.estado = 'confirmado' AND ${CLASIFICACION} = 'egreso'
          AND c.forma_pago = '01' AND c.total_centavos > ? AND substr(${FECHA}, 1, 7) = ?`,
    )
    .get(usuarioId, LIMITE_EFECTIVO_CENTAVOS, mes) as { n: number; total: number };
}

export type Reciente = {
  id: string;
  nombre_archivo: string;
  tipo_mime: string;
  estado: "por_revisar" | "confirmado" | "error";
  error: string | null;
  total_centavos: number | null;
  contraparte: string | null;
  creado_en: string;
  analisis_simulado: number;
};

/** Lo último que se subió (incluye los que fallaron) para la pantalla "Subir". */
export function recientes(d: DatabaseSync, usuarioId: string, limite = 10): Reciente[] {
  return d
    .prepare(
      `SELECT c.id, c.nombre_archivo, c.tipo_mime, c.estado, c.error, c.total_centavos,
              COALESCE(c.emisor_nombre, c.emisor_rfc) AS contraparte, c.creado_en, c.analisis_simulado
         FROM comprobantes c
        WHERE c.usuario_id = ? AND c.estado IN ('por_revisar', 'confirmado', 'error')
        ORDER BY c.creado_en DESC, c.nombre_archivo LIMIT ?`,
    )
    .all(usuarioId, limite) as Reciente[];
}

/** Quita de la lista un archivo que no se pudo analizar (no hay foto que reintentar: no se guardó). */
export function quitarConError(d: DatabaseSync, usuarioId: string, id: string): boolean {
  return d.prepare("UPDATE comprobantes SET estado = 'descartado' WHERE id = ? AND usuario_id = ? AND estado = 'error'").run(id, usuarioId).changes > 0;
}

/** Meses con movimientos (para el selector de Mi mes), del más reciente al más viejo. */
export function mesesConDatos(d: DatabaseSync, usuarioId: string): string[] {
  return (
    d
      .prepare(
        `SELECT DISTINCT substr(${FECHA}, 1, 7) AS mes FROM comprobantes c
          WHERE c.usuario_id = ? AND c.estado IN ('por_revisar', 'confirmado') ORDER BY mes DESC`,
      )
      .all(usuarioId) as { mes: string }[]
  ).map((r) => r.mes);
}

// ─── Revisión ──────────────────────────────────────────────────────────────────

/** Campos que la persona revisa y puede corregir. La clave es la ruta del JSON del modelo. */
export const CAMPOS_REVISION = {
  "Emisor.Nombre": "emisor_nombre",
  "Emisor.Rfc": "emisor_rfc",
  "Receptor.Nombre": "receptor_nombre",
  "Receptor.Rfc": "receptor_rfc",
  Fecha: "fecha",
  Serie: "serie",
  Folio: "folio",
  SubTotal: "subtotal",
  Total: "total",
  "Impuestos.TotalImpuestosTrasladados": "total_traslados",
  FormaPago: "forma_pago",
  MetodoPago: "metodo_pago",
} as const;
export type CampoRevision = keyof typeof CAMPOS_REVISION;

export type ComprobanteRevision = {
  id: string;
  estado: string;
  origen: "camara" | "archivo";
  nombre_archivo: string;
  tipo_mime: string;
  tamano_bytes: number;
  sha256: string;
  analisis_simulado: number;
  simulado_partes: string | null;
  conf_global: number | null;
  faltantes: string[];
  clasificacion: Clasificacion | null;
  moneda: string | null;
  uuid_cfdi: string | null;
  valores: Record<CampoRevision, string | null>;
  conceptos: { descripcion: string | null; cantidad: string | null; valor_unitario: string | null; importe: string | null }[];
};

export function comprobanteParaRevision(d: DatabaseSync, usuarioId: string, id: string): ComprobanteRevision | null {
  const columnas = Object.values(CAMPOS_REVISION).map((c) => `c.${c}`).join(", ");
  const fila = d
    .prepare(
      `SELECT c.id, c.estado, c.origen, c.nombre_archivo, c.tipo_mime, c.tamano_bytes, c.sha256, c.analisis_simulado, c.simulado_partes,
              c.conf_global, c.faltantes, c.moneda, c.uuid_cfdi, ${CLASIFICACION} AS clasificacion, ${columnas}
         FROM comprobantes c LEFT JOIN negocios n ON n.usuario_id = c.usuario_id
        WHERE c.id = ? AND c.usuario_id = ? AND c.estado IN ('por_revisar', 'confirmado')`,
    )
    .get(id, usuarioId) as Record<string, unknown> | undefined;
  if (!fila) return null;
  const valores = Object.fromEntries(
    Object.entries(CAMPOS_REVISION).map(([campo, col]) => [campo, (fila[col] as string | null) ?? null]),
  ) as Record<CampoRevision, string | null>;
  const conceptos = d
    .prepare("SELECT descripcion, cantidad, valor_unitario, importe FROM conceptos WHERE comprobante_id = ? ORDER BY orden")
    .all(id)
    .map((r) => ({ ...r })) as ComprobanteRevision["conceptos"]; // objetos normales: se pasan a un componente de cliente
  return {
    id: fila.id as string,
    estado: fila.estado as string,
    origen: fila.origen as "camara" | "archivo",
    nombre_archivo: fila.nombre_archivo as string,
    tipo_mime: fila.tipo_mime as string,
    tamano_bytes: fila.tamano_bytes as number,
    sha256: fila.sha256 as string,
    analisis_simulado: fila.analisis_simulado as number,
    simulado_partes: (fila.simulado_partes as string | null) ?? null,
    conf_global: fila.conf_global as number | null,
    faltantes: JSON.parse(fila.faltantes as string) as string[],
    clasificacion: fila.clasificacion as Clasificacion | null,
    moneda: fila.moneda as string | null,
    uuid_cfdi: fila.uuid_cfdi as string | null,
    valores,
    conceptos,
  };
}

/** Campos sin los que no se puede confirmar (el botón "Confirmar" queda bloqueado, CLAUDE.md sec. 23). */
export const OBLIGATORIOS_CONFIRMAR: CampoRevision[] = ["Total", "Fecha"];

export type ResultadoConfirmar = { ok: true } | { ok: false; errores: Partial<Record<CampoRevision | "clasificacion", string>> };

const DECIMAL = /^\d+(\.\d{1,6})?$/;
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;
const RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

/** Valida la forma de lo que dejó la persona (no hace cálculos fiscales). */
export function validarRevision(
  valores: Partial<Record<CampoRevision, string>>,
  clasificacion: string | null,
): ResultadoConfirmar {
  const errores: Partial<Record<CampoRevision | "clasificacion", string>> = {};
  for (const campo of OBLIGATORIOS_CONFIRMAR) if (!valores[campo]?.trim()) errores[campo] = "Falta este dato.";
  for (const campo of ["SubTotal", "Total", "Impuestos.TotalImpuestosTrasladados"] as const) {
    const v = valores[campo]?.trim();
    if (v && !DECIMAL.test(v)) errores[campo] = "Escribe solo el número, por ejemplo 245.50";
  }
  const f = valores.Fecha?.trim();
  if (f && !FECHA_ISO.test(f)) errores.Fecha = "Fecha no válida.";
  for (const campo of ["Emisor.Rfc", "Receptor.Rfc"] as const) {
    const v = valores[campo]?.trim().toUpperCase();
    if (v && !RFC.test(v)) errores[campo] = "El RFC no tiene un formato válido.";
  }
  const m = valores.MetodoPago?.trim();
  if (m && m !== "PUE" && m !== "PPD") errores.MetodoPago = "Usa PUE o PPD.";
  if (clasificacion !== "ingreso" && clasificacion !== "egreso" && clasificacion !== "pago") {
    errores.clasificacion = "Dinos si es una venta, una compra o un pago.";
  }
  return Object.keys(errores).length ? { ok: false, errores } : { ok: true };
}

/**
 * Confirma un comprobante: guarda lo que dejó la persona, anota en `correcciones` cada campo
 * que cambió respecto a lo que leyó el modelo y pasa a 'confirmado'. Llamar dentro de una transacción.
 */
export function confirmarComprobante(
  d: DatabaseSync,
  usuarioId: string,
  id: string,
  valores: Partial<Record<CampoRevision, string>>,
  clasificacion: Clasificacion,
): boolean {
  const actual = comprobanteParaRevision(d, usuarioId, id);
  if (!actual) return false;

  const limpio = (campo: CampoRevision, v: string | undefined) => {
    const t = (v ?? "").trim();
    if (!t) return null;
    return campo.endsWith("Rfc") || campo === "MetodoPago" ? t.toUpperCase() : t;
  };

  const insCorr = d.prepare(
    "INSERT INTO correcciones (comprobante_id, campo, valor_modelo, valor_final, conf) VALUES (?, ?, ?, ?, ?)",
  );
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  for (const [campo, col] of Object.entries(CAMPOS_REVISION) as [CampoRevision, string][]) {
    if (!(campo in valores)) continue;
    const nuevo = limpio(campo, valores[campo]);
    if (nuevo === actual.valores[campo]) continue;
    insCorr.run(id, campo, actual.valores[campo], nuevo, actual.conf_global);
    sets.push(`${col} = ?`);
    params.push(nuevo);
    if (campo === "Total") {
      sets.push("total_centavos = ?");
      params.push(aCentavos(nuevo));
    }
  }
  if (clasificacion !== actual.clasificacion) insCorr.run(id, "clasificacion", actual.clasificacion, clasificacion, null);

  sets.push("clasificacion = ?", "estado = 'confirmado'", "confirmado_en = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
  params.push(clasificacion);
  d.prepare(`UPDATE comprobantes SET ${sets.join(", ")} WHERE id = ? AND usuario_id = ?`).run(...params, id, usuarioId);
  return true;
}

export function descartarComprobante(d: DatabaseSync, usuarioId: string, id: string): boolean {
  const r = d
    .prepare("UPDATE comprobantes SET estado = 'descartado' WHERE id = ? AND usuario_id = ? AND estado = 'por_revisar'")
    .run(id, usuarioId);
  return r.changes > 0;
}

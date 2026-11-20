/*
 * Guardar y leer comprobantes analizados. Recibe la base como parámetro (sin "server-only")
 * para poder probarlo con una base en memoria: lib/comprobantes.test.ts
 * Nunca recibe ni guarda los bytes de la imagen: solo sus metadatos y lo que leyó el modelo.
 */
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { aCentavos, type Cfdi } from "./cfdi.ts";

export type Archivo = {
  origen: "camara" | "archivo";
  nombre: string;
  tipo: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  tamano: number;
  sha256: string;
  huellaCliente: boolean;
};

export type Analisis =
  | { ok: true; cfdi: Cfdi; faltantes: string[]; json: unknown; confGlobal: number | null; simulado: boolean }
  | { ok: false; motivo: string };

/** Inserta un comprobante con sus conceptos e impuestos. Llamar dentro de una transacción. */
export function guardarComprobante(
  d: DatabaseSync,
  { loteId, usuarioId, archivo, analisis }: { loteId: string; usuarioId: string; archivo: Archivo; analisis: Analisis },
): string {
  const id = randomUUID();
  const base = [id, loteId, usuarioId, archivo.origen, archivo.nombre, archivo.tipo, archivo.tamano, archivo.sha256, archivo.huellaCliente ? 1 : 0];

  if (!analisis.ok) {
    d.prepare(
      `INSERT INTO comprobantes (id, lote_id, usuario_id, origen, nombre_archivo, tipo_mime, tamano_bytes, sha256, huella_cliente, estado, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'error', ?)`,
    ).run(...base, analisis.motivo);
    return id;
  }

  const c = analisis.cfdi;
  d.prepare(
    `INSERT INTO comprobantes (
       id, lote_id, usuario_id, origen, nombre_archivo, tipo_mime, tamano_bytes, sha256, huella_cliente,
       analisis_simulado, json_modelo, faltantes, conf_global,
       version, serie, folio, fecha, forma_pago, metodo_pago, moneda, tipo_comprobante, exportacion, lugar_expedicion,
       subtotal, descuento, total, total_centavos, total_traslados, total_retenciones, uuid_cfdi,
       emisor_rfc, emisor_nombre, emisor_regimen,
       receptor_rfc, receptor_nombre, receptor_cp, receptor_regimen, receptor_uso_cfdi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?,  ?, ?, ?, ?, ?)`,
  ).run(
    ...base,
    analisis.simulado ? 1 : 0,
    JSON.stringify(analisis.json),
    JSON.stringify(analisis.faltantes),
    analisis.confGlobal,
    c.version, c.serie, c.folio, c.fecha, c.formaPago, c.metodoPago, c.moneda, c.tipoDeComprobante, c.exportacion, c.lugarExpedicion,
    c.subTotal, c.descuento, c.total, aCentavos(c.total), c.totalTraslados, c.totalRetenciones, c.uuid,
    c.emisor.rfc, c.emisor.nombre, c.emisor.regimenFiscal,
    c.receptor.rfc, c.receptor.nombre, c.receptor.domicilioFiscal, c.receptor.regimenFiscal, c.receptor.usoCfdi,
  );

  const insConcepto = d.prepare(
    `INSERT INTO conceptos (comprobante_id, orden, clave_prod_serv, no_identificacion, cantidad, clave_unidad, unidad,
       descripcion, valor_unitario, importe, descuento, objeto_imp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insImpuesto = d.prepare(
    `INSERT INTO impuestos (comprobante_id, concepto_id, tipo, base, impuesto, tipo_factor, tasa_o_cuota, importe)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const impuesto = (conceptoId: number | bigint | null, i: Cfdi["impuestos"][number]) =>
    insImpuesto.run(id, conceptoId, i.tipo, i.base, i.impuesto, i.tipoFactor, i.tasaOCuota, i.importe);

  c.conceptos.forEach((k, orden) => {
    const r = insConcepto.run(id, orden, k.claveProdServ, k.noIdentificacion, k.cantidad, k.claveUnidad, k.unidad,
      k.descripcion, k.valorUnitario, k.importe, k.descuento, k.objetoImp);
    for (const i of k.impuestos) impuesto(r.lastInsertRowid, i);
  });
  for (const i of c.impuestos) impuesto(null, i);

  return id;
}

/** ¿Esta persona ya subió exactamente este archivo (misma huella) y no lo descartó? */
export function yaSubido(d: DatabaseSync, usuarioId: string, sha256: string): boolean {
  return !!d
    .prepare("SELECT 1 FROM comprobantes WHERE usuario_id = ? AND sha256 = ? AND estado IN ('por_revisar', 'confirmado')")
    .get(usuarioId, sha256);
}

export type ResumenComprobante = {
  id: string;
  origen: "camara" | "archivo";
  nombre_archivo: string;
  tipo_mime: string;
  tamano_bytes: number;
  sha256: string;
  huella_cliente: number;
  estado: "por_revisar" | "confirmado" | "descartado" | "error";
  error: string | null;
  analisis_simulado: number;
  faltantes: string;
  fecha: string | null;
  serie: string | null;
  folio: string | null;
  total: string | null;
  moneda: string | null;
  emisor_nombre: string | null;
  emisor_rfc: string | null;
  receptor_nombre: string | null;
  receptor_rfc: string | null;
  total_traslados: string | null;
  conceptos: number;
};

/** Comprobantes de un lote, solo si el lote es de esa persona. */
export function comprobantesDeLote(d: DatabaseSync, loteId: string, usuarioId: string): ResumenComprobante[] {
  return d
    .prepare(
      `SELECT c.id, c.origen, c.nombre_archivo, c.tipo_mime, c.tamano_bytes, c.sha256, c.huella_cliente, c.estado, c.error,
              c.analisis_simulado, c.faltantes, c.fecha, c.serie, c.folio, c.total, c.moneda,
              c.emisor_nombre, c.emisor_rfc, c.receptor_nombre, c.receptor_rfc, c.total_traslados,
              (SELECT count(*) FROM conceptos k WHERE k.comprobante_id = c.id) AS conceptos
         FROM comprobantes c
        WHERE c.lote_id = ? AND c.usuario_id = ?
        ORDER BY c.creado_en, c.nombre_archivo`,
    )
    .all(loteId, usuarioId) as ResumenComprobante[];
}

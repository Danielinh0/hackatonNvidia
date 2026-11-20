// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { leerCfdi } from "./cfdi.ts";
import { CFDI_EJEMPLO } from "./cfdi-ejemplo.ts";
import { comprobantesDeLote, guardarComprobante, yaSubido, type Archivo } from "./comprobantes.ts";
import { ESQUEMA } from "./esquema.ts";

function base() {
  const d = new DatabaseSync(":memory:");
  d.exec("PRAGMA foreign_keys = ON;");
  d.exec(ESQUEMA);
  d.prepare("INSERT INTO usuarios (id, email, hash_contrasena) VALUES ('u1', 'a@ejemplo.invalid', 'x'), ('u2', 'b@ejemplo.invalid', 'x')").run();
  d.prepare("INSERT INTO lotes (id, usuario_id, total_enviados) VALUES ('l1', 'u1', 2)").run();
  return d;
}

const archivo: Archivo = { origen: "archivo", nombre: "ticket.jpg", tipo: "image/jpeg", tamano: 1234, sha256: "a".repeat(64), huellaCliente: true };

test("guarda el comprobante, sus conceptos e impuestos, y ninguna imagen", () => {
  const d = base();
  const l = leerCfdi(CFDI_EJEMPLO);
  assert.ok(l.ok);
  const id = guardarComprobante(d, {
    loteId: "l1",
    usuarioId: "u1",
    archivo,
    analisis: { ok: true, cfdi: l.cfdi, faltantes: l.faltantes, json: CFDI_EJEMPLO, confGlobal: 0.8, simulado: false },
  });

  const c = d.prepare("SELECT * FROM comprobantes WHERE id = ?").get(id) as Record<string, unknown>;
  assert.equal(c.total, "2901.16");
  assert.equal(c.total_centavos, 290116);
  assert.equal(c.fecha, null);
  assert.equal(c.estado, "por_revisar");
  assert.equal(c.receptor_rfc, "XIA190128J61");
  assert.deepEqual(JSON.parse(c.faltantes as string), ["Fecha", "Emisor.Rfc", "Emisor.Nombre"]);
  assert.equal((d.prepare("SELECT count(*) n FROM conceptos").get() as { n: number }).n, 1);
  // 1 traslado del concepto + 1 del resumen
  assert.equal((d.prepare("SELECT count(*) n FROM impuestos").get() as { n: number }).n, 2);
  assert.equal((d.prepare("SELECT count(*) n FROM impuestos WHERE concepto_id IS NULL").get() as { n: number }).n, 1);

  // Ninguna columna del esquema guarda bytes.
  const blobs = d.prepare("SELECT name FROM pragma_table_info('comprobantes') WHERE type = 'BLOB'").all();
  assert.deepEqual(blobs, []);
});

test("si el análisis falla se guarda el motivo, sin datos", () => {
  const d = base();
  const id = guardarComprobante(d, { loteId: "l1", usuarioId: "u1", archivo, analisis: { ok: false, motivo: "Sin conexión" } });
  const c = d.prepare("SELECT estado, error, total FROM comprobantes WHERE id = ?").get(id) as Record<string, unknown>;
  assert.deepEqual({ ...c }, { estado: "error", error: "Sin conexión", total: null });
});

test("detecta duplicados por huella y solo muestra lotes propios", () => {
  const d = base();
  const l = leerCfdi(CFDI_EJEMPLO);
  assert.ok(l.ok);
  guardarComprobante(d, {
    loteId: "l1",
    usuarioId: "u1",
    archivo,
    analisis: { ok: true, cfdi: l.cfdi, faltantes: l.faltantes, json: CFDI_EJEMPLO, confGlobal: null, simulado: true },
  });
  assert.equal(yaSubido(d, "u1", archivo.sha256), true);
  assert.equal(yaSubido(d, "u2", archivo.sha256), false);
  assert.equal(comprobantesDeLote(d, "l1", "u1").length, 1);
  assert.equal(comprobantesDeLote(d, "l1", "u2").length, 0);
});

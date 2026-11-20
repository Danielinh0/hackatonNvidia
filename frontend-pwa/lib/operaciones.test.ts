// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { leerCfdi } from "./cfdi.ts";
import { CFDI_EJEMPLO } from "./cfdi-ejemplo.ts";
import { guardarComprobante } from "./comprobantes.ts";
import { ESQUEMA } from "./esquema.ts";
import { guardarNegocio } from "./negocio.ts";
import {
  comprobanteParaRevision, confirmarComprobante, descartarComprobante, listarOperaciones, pendientes, resumenMes,
  semanasMes, validarRevision,
} from "./operaciones.ts";

const NEGOCIO_RFC = "MARI880415HR9";

function base() {
  const d = new DatabaseSync(":memory:");
  d.exec("PRAGMA foreign_keys = ON;");
  d.exec(ESQUEMA);
  d.prepare("INSERT INTO usuarios (id, email, hash_contrasena) VALUES ('u1', 'a@ejemplo.invalid', 'x'), ('u2', 'b@ejemplo.invalid', 'x')").run();
  d.prepare("INSERT INTO lotes (id, usuario_id, total_enviados) VALUES ('l1', 'u1', 3)").run();
  guardarNegocio(d, "u1", { nombre: "Tlayudas", rfc: NEGOCIO_RFC, regimen: "626" });
  return d;
}

/** Guarda un comprobante a partir del ejemplo, cambiando emisor, total y fecha. */
function agregar(d: DatabaseSync, n: number, cambios: Record<string, unknown>) {
  const json = { ...CFDI_EJEMPLO, ...cambios };
  const l = leerCfdi(json);
  assert.ok(l.ok);
  return guardarComprobante(d, {
    loteId: "l1",
    usuarioId: "u1",
    archivo: { origen: "camara", nombre: `t${n}.jpg`, tipo: "image/jpeg", tamano: 100 + n, sha256: String(n).repeat(64).slice(0, 64), huellaCliente: true },
    analisis: { ok: true, cfdi: l.cfdi, faltantes: l.faltantes, json, confGlobal: 0.9, simulado: true },
  });
}

test("clasifica por RFC: emitido por el negocio = ingreso, por otro = egreso, sin emisor = sin clasificar", () => {
  const d = base();
  agregar(d, 1, { Emisor: { Rfc: NEGOCIO_RFC, Nombre: "Tlayudas" }, Fecha: "2026-11-03" });
  agregar(d, 2, { Emisor: { Rfc: "LOPA820412HR1", Nombre: "Abarrotes López" }, Fecha: "2026-11-10" });
  agregar(d, 3, { Fecha: "2026-11-12" }); // el ejemplo no trae emisor
  const ops = listarOperaciones(d, "u1");
  assert.deepEqual(ops.map((o) => o.clasificacion), [null, "egreso", "ingreso"]); // más reciente primero
  assert.equal(ops[1].contraparte, "Abarrotes López");
  assert.equal(ops[2].contraparte, "XENON INDUSTRIAL ARTICLES"); // en un ingreso se muestra el cliente
  assert.deepEqual(listarOperaciones(d, "u2"), []);
});

test("el resumen del mes solo suma lo confirmado", () => {
  const d = base();
  const a = agregar(d, 1, { Emisor: { Rfc: NEGOCIO_RFC }, Fecha: "2026-11-03", Total: "1000.00" });
  const b = agregar(d, 2, { Emisor: { Rfc: "LOPA820412HR1" }, Fecha: "2026-11-20", Total: "245.50" });
  agregar(d, 3, { Emisor: { Rfc: "LOPA820412HR1" }, Fecha: "2026-11-21", Total: "99.00" });

  let r = resumenMes(d, "u1", "2026-11");
  assert.equal(r.ingresos, 0);
  assert.equal(r.nPorRevisar, 3);

  confirmarComprobante(d, "u1", a, {}, "ingreso");
  confirmarComprobante(d, "u1", b, {}, "egreso");
  r = resumenMes(d, "u1", "2026-11");
  assert.equal(r.ingresos, 100000);
  assert.equal(r.egresosSinCfdi, 24550);
  assert.equal(r.egresosConCfdi, 0);
  assert.equal(r.nPorRevisar, 1);
  assert.deepEqual(semanasMes(d, "u1", "2026-11").map((s) => [s.ingreso, s.gasto]), [[100000, 0], [0, 0], [0, 24550], [0, 0]]);
  assert.equal(resumenMes(d, "u1", "2026-10").ingresos, 0);
});

test("confirmar guarda las correcciones y descartar saca de pendientes", () => {
  const d = base();
  const a = agregar(d, 1, {});
  const b = agregar(d, 2, {});
  assert.deepEqual(pendientes(d, "u1"), [a, b]);

  const ok = confirmarComprobante(d, "u1", a, { Fecha: "2026-11-14", "Emisor.Rfc": "lopa820412hr1", Total: "2901.16" }, "egreso");
  assert.equal(ok, true);
  const c = comprobanteParaRevision(d, "u1", a)!;
  assert.equal(c.estado, "confirmado");
  assert.equal(c.valores.Fecha, "2026-11-14");
  assert.equal(c.valores["Emisor.Rfc"], "LOPA820412HR1");
  const corr = d.prepare("SELECT campo, valor_modelo, valor_final FROM correcciones ORDER BY id").all().map((r) => ({ ...r }));
  // Total no cambió, así que no se anota. La clasificación no la propuso nadie (sin emisor): se anota.
  assert.deepEqual(corr, [
    { campo: "Emisor.Rfc", valor_modelo: null, valor_final: "LOPA820412HR1" },
    { campo: "Fecha", valor_modelo: null, valor_final: "2026-11-14" },
    { campo: "clasificacion", valor_modelo: null, valor_final: "egreso" },
  ]);

  assert.equal(descartarComprobante(d, "u1", b), true);
  assert.deepEqual(pendientes(d, "u1"), []);
  assert.equal(comprobanteParaRevision(d, "u2", a), null); // de otra persona: no existe
});

test("validarRevision exige total, fecha y clasificación con forma válida", () => {
  assert.equal(validarRevision({ Total: "245.50", Fecha: "2026-11-14" }, "egreso").ok, true);
  const r = validarRevision({ Total: "$245", Fecha: "", "Emisor.Rfc": "X" }, null);
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errores).sort(), ["Emisor.Rfc", "Fecha", "Total", "clasificacion"]);
});

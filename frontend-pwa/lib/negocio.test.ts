// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { ESQUEMA } from "./esquema.ts";
import { guardarNegocio, obtenerNegocio, tipoRfc, validarNegocio } from "./negocio.ts";

test("tipoRfc distingue persona física, moral e inválidos", () => {
  assert.equal(tipoRfc("MARI880415HR9"), "fisica");
  assert.equal(tipoRfc("mari880415hr9"), "fisica");
  assert.equal(tipoRfc("XIA190128J61"), "moral");
  assert.equal(tipoRfc("MARI881315HR9"), null); // mes 13
  assert.equal(tipoRfc("MARI88041"), null);
  assert.equal(tipoRfc(""), null);
});

test("validarNegocio: datos completos y normalizados", () => {
  const v = validarNegocio({ nombre: "  Tlayudas   Doña Mari ", rfc: "mari880415hr9", regimen: "626" });
  assert.deepEqual(v, { ok: true, negocio: { nombre: "Tlayudas Doña Mari", rfc: "MARI880415HR9", regimen: "626" } });
});

test("validarNegocio: avisa qué falta o está mal", () => {
  const v = validarNegocio({ nombre: "", rfc: "123", regimen: "" });
  assert.equal(v.ok, false);
  if (!v.ok) assert.deepEqual(Object.keys(v.errores).sort(), ["nombre", "regimen", "rfc"]);
  const moral = validarNegocio({ nombre: "Xenon", rfc: "XIA190128J61", regimen: "626" });
  assert.equal(moral.ok, false);
  if (!moral.ok) assert.match(moral.errores.rfc!, /persona moral/);
});

test("guardar y actualizar el negocio", () => {
  const d = new DatabaseSync(":memory:");
  d.exec(ESQUEMA);
  d.prepare("INSERT INTO usuarios (id, email, hash_contrasena) VALUES ('u1', 'a@ejemplo.invalid', 'x')").run();
  assert.equal(obtenerNegocio(d, "u1"), null);
  guardarNegocio(d, "u1", { nombre: "AB", rfc: "MARI880415HR9", regimen: "626" });
  guardarNegocio(d, "u1", { nombre: "Tlayudas", rfc: "MARI880415HR9", regimen: "612" });
  assert.deepEqual(obtenerNegocio(d, "u1"), { nombre: "Tlayudas", rfc: "MARI880415HR9", regimen: "612" });
});

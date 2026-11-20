// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { etiquetaSimulado, partesDeRespuesta } from "./simulado.ts";

test("lee simulado_partes del backend e ignora valores desconocidos", () => {
  assert.deepEqual(partesDeRespuesta({ simulado_partes: ["vision"] }), ["vision"]);
  assert.deepEqual(partesDeRespuesta({ simulado_partes: ["asistente", "otra", "vision"] }), ["vision", "asistente"]);
  assert.deepEqual(partesDeRespuesta({ simulado_partes: [] }), []);
  assert.equal(partesDeRespuesta({ simulado: true }), null); // backend anterior
  assert.equal(partesDeRespuesta(null), null);
});

test("la etiqueta dice qué parte fue simulada", () => {
  // Caso real de la prueba del 20-nov: visión simulada, asistente entrenado real.
  assert.equal(etiquetaSimulado('["vision"]'), "SIMULADO · visión: texto de ejemplo; lo leyó el asistente entrenado");
  assert.equal(etiquetaSimulado('["asistente"]'), "SIMULADO · respuesta fija del asistente");
  assert.equal(etiquetaSimulado('["vision","asistente"]'), "SIMULADO · no lo leyó el modelo");
  assert.equal(etiquetaSimulado(null), "SIMULADO"); // filas anteriores: no se adivina
  assert.equal(etiquetaSimulado("no-json"), "SIMULADO");
});

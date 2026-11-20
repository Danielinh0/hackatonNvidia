// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { detectarTipo, MAX_BYTES, sha256Hex, verificarArchivo } from "./verificacion.ts";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const pdf = new TextEncoder().encode("%PDF-1.7 ...");
const texto = new TextEncoder().encode("hola, no soy imagen");

test("detecta tipos por sus primeros bytes", () => {
  assert.equal(detectarTipo(jpeg), "image/jpeg");
  assert.equal(detectarTipo(png), "image/png");
  assert.equal(detectarTipo(webp), "image/webp");
  assert.equal(detectarTipo(pdf), "application/pdf");
  assert.equal(detectarTipo(texto), null);
});

test("caso habitual: llegó completo y la huella coincide", () => {
  const r = verificarArchivo(jpeg, jpeg.length, sha256Hex(jpeg));
  assert.deepEqual(r, { ok: true, tipo: "image/jpeg", sha256: sha256Hex(jpeg), huellaCliente: true });
});

test("sin huella del navegador (http en red local) se acepta, marcado como no verificado", () => {
  const r = verificarArchivo(png, png.length, "");
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.huellaCliente, false);
});

test("archivo vacío", () => {
  const r = verificarArchivo(new Uint8Array(), 0, "");
  assert.equal(r.ok, false);
});

test("llegó incompleto: tamaño distinto al declarado", () => {
  const r = verificarArchivo(jpeg, jpeg.length + 100, "");
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.motivo : "", /incompleto/);
});

test("huella distinta: el archivo cambió en el camino", () => {
  const r = verificarArchivo(jpeg, jpeg.length, sha256Hex(png));
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.motivo : "", /huella/);
});

test("formato no compatible aunque diga .jpg", () => {
  const r = verificarArchivo(texto, texto.length, "");
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.motivo : "", /Formato/);
});

test("más de 10 MB se rechaza", () => {
  const grande = new Uint8Array(MAX_BYTES + 1);
  grande.set(jpeg);
  const r = verificarArchivo(grande, grande.length, "");
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.motivo : "", /10 MB/);
});

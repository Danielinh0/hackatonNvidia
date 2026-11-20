import { test } from "node:test";
import assert from "node:assert/strict";
import { regresoDeChat, rutaChat } from "./rutas.ts";

test("rutaChat guarda la pantalla de origen y omite el inicio", () => {
  assert.equal(rutaChat(), "/chat");
  assert.equal(rutaChat("/"), "/chat");
  assert.equal(rutaChat("/revision/sencillo?id=abc"), "/chat?desde=%2Frevision%2Fsencillo%3Fid%3Dabc");
  assert.equal(rutaChat("/chat?desde=/mi-mes"), "/chat");
});

test("regresoDeChat solo acepta rutas internas y nunca el propio chat", () => {
  assert.equal(regresoDeChat(undefined), "/");
  assert.equal(regresoDeChat("/mi-mes?mes=2026-11"), "/mi-mes?mes=2026-11");
  assert.equal(regresoDeChat("https://malo.com"), "/");
  assert.equal(regresoDeChat("//malo.com"), "/");
  assert.equal(regresoDeChat("/chat"), "/");
  assert.equal(regresoDeChat(["/a", "/b"]), "/");
});

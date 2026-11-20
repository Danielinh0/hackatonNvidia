// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { HASH_RELLENO, hashContrasena, verificarContrasena } from "./contrasena.ts";
import { correoValido, esPublica, normalizarCorreo, rutaEntrar, siguienteSeguro } from "./rutas.ts";

test("contraseña: el hash verifica la correcta y rechaza otra", async () => {
  const h = await hashContrasena("tlayudas2026");
  assert.match(h, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verificarContrasena("tlayudas2026", h), true);
  assert.equal(await verificarContrasena("Tlayudas2026", h), false);
});

test("contraseña: dos hashes de la misma clave son distintos (sal aleatoria)", async () => {
  assert.notEqual(await hashContrasena("igual-igual"), await hashContrasena("igual-igual"));
});

test("contraseña: el hash de relleno nunca verifica y un formato raro tampoco", async () => {
  assert.equal(await verificarContrasena("lo-que-sea", HASH_RELLENO), false);
  assert.equal(await verificarContrasena("x", "md5$abc"), false);
});

test("siguiente: acepta rutas internas con parámetros", () => {
  assert.equal(siguienteSeguro("/subir"), "/subir");
  assert.equal(siguienteSeguro("/subir/recibido/abc?x=1"), "/subir/recibido/abc?x=1");
});

test("siguiente: bloquea redirecciones a otros sitios", () => {
  for (const malo of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", "/%0a//evil.com\n"]) {
    assert.equal(siguienteSeguro(malo), "/", malo);
  }
});

test("siguiente: no regresa a pantallas de acceso ni a /auth", () => {
  assert.equal(siguienteSeguro("/entrar"), "/");
  assert.equal(siguienteSeguro("/bienvenida/error"), "/");
  assert.equal(siguienteSeguro("/auth/salir"), "/");
});

test("siguiente: valores vacíos o no texto usan el valor por defecto", () => {
  assert.equal(siguienteSeguro(undefined, "/configurar"), "/configurar");
  assert.equal(siguienteSeguro(["/subir"]), "/");
});

test("rutaEntrar codifica el destino", () => {
  assert.equal(rutaEntrar("/"), "/entrar");
  assert.equal(rutaEntrar("/subir?a=1&b=2"), "/entrar?siguiente=%2Fsubir%3Fa%3D1%26b%3D2");
});

test("rutas públicas", () => {
  assert.equal(esPublica("/entrar"), true);
  assert.equal(esPublica("/bienvenida/error"), true);
  assert.equal(esPublica("/subir"), false);
  assert.equal(esPublica("/entrarx"), false);
});

test("correo: normaliza y valida", () => {
  assert.equal(normalizarCorreo("  Mari@Ejemplo.MX "), "mari@ejemplo.mx");
  assert.equal(correoValido("mari@ejemplo.mx"), true);
  assert.equal(correoValido("mari@ejemplo"), false);
  assert.equal(correoValido("sin arroba.com"), false);
});

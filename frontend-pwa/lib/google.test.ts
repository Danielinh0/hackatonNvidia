// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { decodificarIdToken, nuevoIntento, urlAutorizacion, validarClaims, type ClaimsGoogle } from "./google.ts";

const ahoraSeg = 1_800_000_000;
const esperado = { clientId: "cliente-demo.apps.googleusercontent.com", nonce: "n-123", ahoraSeg };
const buenas: ClaimsGoogle = {
  iss: "https://accounts.google.com",
  aud: esperado.clientId,
  sub: "1234567890",
  exp: ahoraSeg + 600,
  nonce: "n-123",
  email: "demo@example.com",
  email_verified: true,
  name: "Usuaria Demo",
};

test("claims correctas pasan", () => assert.equal(validarClaims(buenas, esperado), null));
test("otro emisor", () => assert.match(validarClaims({ ...buenas, iss: "https://evil.example" }, esperado) ?? "", /iss/));
test("token para otra app (aud)", () => assert.match(validarClaims({ ...buenas, aud: "otra-app" }, esperado) ?? "", /aud/));
test("token vencido", () => assert.match(validarClaims({ ...buenas, exp: ahoraSeg - 1 }, esperado) ?? "", /vencido/));
test("nonce distinto (repetición)", () => assert.match(validarClaims({ ...buenas, nonce: "otro" }, esperado) ?? "", /nonce/));
test("correo sin verificar", () =>
  assert.match(validarClaims({ ...buenas, email_verified: false }, esperado) ?? "", /correo/));

test("PKCE: el reto es sha256(verificador) en base64url", () => {
  const i = nuevoIntento();
  assert.equal(i.reto, createHash("sha256").update(i.verificador).digest("base64url"));
  assert.notEqual(nuevoIntento().state, i.state);
});

test("URL de autorización lleva state, nonce y PKCE S256", () => {
  const u = new URL(urlAutorizacion({ clientId: "c", redirectUri: "http://localhost:3000/auth/google/callback", state: "s", nonce: "n", reto: "r" }));
  assert.equal(u.searchParams.get("code_challenge_method"), "S256");
  assert.equal(u.searchParams.get("scope"), "openid email profile");
  assert.equal(u.searchParams.get("state"), "s");
});

test("decodifica la parte central del id_token", () => {
  const payload = Buffer.from(JSON.stringify(buenas)).toString("base64url");
  assert.equal(decodificarIdToken(`x.${payload}.y`).sub, "1234567890");
  assert.throws(() => decodificarIdToken("no-es-jwt"));
});

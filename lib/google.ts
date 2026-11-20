/*
 * Login con Google (OpenID Connect, flujo "authorization code" + PKCE), sin librerías.
 * Credenciales en .env.local: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET (ver docs/login.md).
 *
 * Sobre la verificación del id_token: lo recibimos directamente del endpoint de tokens de
 * Google por HTTPS, a cambio del código y del secreto. OpenID Connect Core 1.0 §3.1.3.7
 * permite en ese caso validar por TLS en lugar de la firma; aun así revisamos iss, aud,
 * exp, nonce y que el correo esté verificado (validarClaims, con pruebas).
 */
import { createHash, randomBytes } from "node:crypto";

export const COOKIE_OAUTH = "dzuun_oauth";

export type ClaimsGoogle = {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};

export function credenciales() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Origen público de la app. AUTH_URL permite fijarlo detrás de un túnel (https://...). */
export function origen(reqUrl: string): string {
  return (process.env.AUTH_URL ?? new URL(reqUrl).origin).replace(/\/$/, "");
}

const b64url = (b: Buffer) => b.toString("base64url");

/** Valores de un solo uso para un intento de login: state (CSRF), nonce y verificador PKCE. */
export function nuevoIntento() {
  const verificador = b64url(randomBytes(32));
  return {
    state: b64url(randomBytes(16)),
    nonce: b64url(randomBytes(16)),
    verificador,
    reto: b64url(createHash("sha256").update(verificador).digest()),
  };
}

export function urlAutorizacion(p: { clientId: string; redirectUri: string; state: string; nonce: string; reto: string }) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: p.state,
    nonce: p.nonce,
    code_challenge: p.reto,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return u.toString();
}

/** Cambia el código por el id_token. Lanza error si Google responde mal. */
export async function canjearCodigo(p: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  verificador: string;
}): Promise<ClaimsGoogle> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: p.code,
      client_id: p.clientId,
      client_secret: p.clientSecret,
      redirect_uri: p.redirectUri,
      grant_type: "authorization_code",
      code_verifier: p.verificador,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`Google respondió ${r.status}: ${await r.text()}`);
  const { id_token } = (await r.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google no devolvió id_token");
  return decodificarIdToken(id_token);
}

export function decodificarIdToken(jwt: string): ClaimsGoogle {
  const partes = jwt.split(".");
  if (partes.length !== 3) throw new Error("id_token mal formado");
  return JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")) as ClaimsGoogle;
}

/** Devuelve null si todo está bien, o el motivo del rechazo. Función pura (con pruebas). */
export function validarClaims(c: ClaimsGoogle, esperado: { clientId: string; nonce: string; ahoraSeg: number }): string | null {
  if (c.iss !== "https://accounts.google.com" && c.iss !== "accounts.google.com") return "emisor (iss) inválido";
  if (c.aud !== esperado.clientId) return "audiencia (aud) inválida";
  if (!c.exp || c.exp < esperado.ahoraSeg) return "token vencido";
  if (!c.nonce || c.nonce !== esperado.nonce) return "nonce no coincide";
  if (!c.sub) return "falta sub";
  if (!c.email || c.email_verified !== true) return "correo no verificado";
  return null;
}

import { NextResponse } from "next/server";
import { COOKIE_OAUTH, credenciales, nuevoIntento, origen, urlAutorizacion } from "@/lib/google";

/* Paso 1 del login: guarda state/nonce/PKCE en una cookie corta y manda a Google. */
export async function GET(req: Request) {
  const base = origen(req.url);
  const cred = credenciales();
  if (!cred) {
    console.error("Login: faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en .env.local (ver docs/login.md)");
    return NextResponse.redirect(`${base}/bienvenida/error?motivo=config`);
  }

  const intento = nuevoIntento();
  const res = NextResponse.redirect(
    urlAutorizacion({ clientId: cred.clientId, redirectUri: `${base}/auth/google/callback`, ...intento }),
  );
  res.cookies.set(COOKIE_OAUTH, JSON.stringify({ s: intento.state, n: intento.nonce, v: intento.verificador }), {
    httpOnly: true,
    sameSite: "lax",
    secure: base.startsWith("https://"),
    path: "/auth",
    maxAge: 600, // 10 minutos para completar el login
  });
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { canjearCodigo, COOKIE_OAUTH, credenciales, origen, validarClaims } from "@/lib/google";
import { abrirSesion, COOKIE_SESION, guardarUsuario, opcionesCookieSesion } from "@/lib/sesion";

/*
 * Paso 2 del login: Google regresa aquí con ?code&state.
 * Comprueba state, canjea el código, valida el id_token, guarda a la persona en SQLite,
 * abre sesión y redirige: primera vez → /configurar; si ya tenía cuenta → inicio.
 */
export async function GET(req: NextRequest) {
  const base = origen(req.url);
  const fallo = (motivo: string, detalle?: unknown) => {
    console.error(`Login con Google falló (${motivo})`, detalle ?? "");
    const r = NextResponse.redirect(`${base}/bienvenida/error?motivo=${motivo}`);
    r.cookies.delete({ name: COOKIE_OAUTH, path: "/auth" });
    return r;
  };

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fallo("cancelado", params.get("error")); // p. ej. la persona cerró la ventana
  const cred = credenciales();
  if (!cred) return fallo("config");

  let intento: { s: string; n: string; v: string };
  try {
    intento = JSON.parse(req.cookies.get(COOKIE_OAUTH)?.value ?? "");
  } catch {
    return fallo("expirado"); // cookie vencida (más de 10 min) o login iniciado en otro navegador
  }
  const code = params.get("code");
  if (!code || params.get("state") !== intento.s) return fallo("state");

  let usuario: { id: string; nuevo: boolean };
  try {
    const claims = await canjearCodigo({
      code,
      clientId: cred.clientId,
      clientSecret: cred.clientSecret,
      redirectUri: `${base}/auth/google/callback`,
      verificador: intento.v,
    });
    const problema = validarClaims(claims, { clientId: cred.clientId, nonce: intento.n, ahoraSeg: Date.now() / 1000 });
    if (problema) return fallo("token", problema);
    usuario = guardarUsuario(claims);
  } catch (e) {
    return fallo("google", e);
  }

  const res = NextResponse.redirect(`${base}${usuario.nuevo ? "/configurar" : "/"}`);
  res.cookies.delete({ name: COOKIE_OAUTH, path: "/auth" });
  res.cookies.set(COOKIE_SESION, abrirSesion(usuario.id), opcionesCookieSesion(base.startsWith("https://")));
  return res;
}

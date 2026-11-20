import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import type { ClaimsGoogle } from "./google";

/*
 * Sesiones propias guardadas en SQLite. La cookie lleva un token aleatorio; en la base
 * solo queda su sha256. La cookie es httpOnly y SameSite=Lax (no la leen scripts ni
 * viaja en POST desde otros sitios).
 */
export const COOKIE_SESION = "dzuun_sesion";
export const DURACION_SEG = 30 * 24 * 60 * 60; // 30 días

export type Usuario = { id: string; email: string; nombre: string | null; foto_url: string | null };

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Opciones de la cookie de sesión. `secure` solo cuando la app se sirve por https. */
export const opcionesCookieSesion = (https: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: https,
  path: "/",
  maxAge: DURACION_SEG,
});

/** Crea o actualiza a la persona a partir de las claims de Google (login con Google, desactivado por ahora). */
export function guardarUsuario(c: ClaimsGoogle): { id: string; nuevo: boolean } {
  const d = db();
  // Por google_sub o, si no, por correo (Google ya verificó el correo: se vincula a la cuenta local).
  const existente = d
    .prepare("SELECT id FROM usuarios WHERE google_sub = ? OR (google_sub IS NULL AND email = ?)")
    .get(c.sub, c.email ?? "") as { id: string } | undefined;
  if (existente) {
    d.prepare(
      `UPDATE usuarios SET google_sub = ?, nombre = coalesce(nombre, ?), foto_url = ?,
              ultimo_acceso = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    ).run(c.sub, c.name ?? null, c.picture ?? null, existente.id);
    return { id: existente.id, nuevo: false };
  }
  const id = randomUUID();
  d.prepare("INSERT INTO usuarios (id, google_sub, email, nombre, foto_url) VALUES (?, ?, ?, ?, ?)").run(
    id,
    c.sub,
    c.email ?? "",
    c.name ?? null,
    c.picture ?? null,
  );
  return { id, nuevo: true };
}

/** Abre una sesión y devuelve el token que va en la cookie. */
export function abrirSesion(usuarioId: string): string {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACION_SEG * 1000).toISOString();
  const d = db();
  d.prepare("DELETE FROM sesiones WHERE expira_en <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')").run(); // limpieza
  d.prepare("INSERT INTO sesiones (token_sha256, usuario_id, expira_en) VALUES (?, ?, ?)").run(hash(token), usuarioId, expira);
  return token;
}

export function cerrarSesion(token: string | undefined) {
  if (token) db().prepare("DELETE FROM sesiones WHERE token_sha256 = ?").run(hash(token));
}

/** Usuario de la petición actual, o null. Se memoriza por petición con cache(). */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;
  const fila = db()
    .prepare(
      `SELECT u.id, u.email, u.nombre, u.foto_url
         FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token_sha256 = ? AND s.expira_en > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    )
    .get(hash(token)) as Usuario | undefined;
  return fila ?? null;
});

export const primerNombre = (u: Usuario) => (u.nombre ?? u.email).split(/[\s@]/)[0];

/** Para páginas: si la sesión no es válida, borra la cookie (vía /auth/caducada) y manda a la bienvenida. */
export async function requerirUsuario(): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) redirect("/auth/caducada"); // borra la cookie y manda a /entrar
  return u;
}

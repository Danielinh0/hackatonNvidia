"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { HASH_RELLENO, hashContrasena, MIN_CONTRASENA, verificarContrasena } from "@/lib/contrasena";
import { db } from "@/lib/db";
import { correoValido, normalizarCorreo, siguienteSeguro } from "@/lib/rutas";
import { abrirSesion, COOKIE_SESION, opcionesCookieSesion } from "@/lib/sesion";

/*
 * Acceso local con correo y contraseña guardados en SQLite (temporal, en lugar de Google).
 * Ambas acciones validan el parámetro ?siguiente= con siguienteSeguro() antes de redirigir.
 */

export type EstadoCuenta = {
  error: string | null;
  campos: Partial<Record<"nombre" | "email" | "contrasena", string>>;
  valores: { nombre?: string; email?: string };
};

async function iniciarSesion(usuarioId: string, destino: string): Promise<never> {
  const h = await headers();
  const https = h.get("x-forwarded-proto") === "https" || (process.env.AUTH_URL ?? "").startsWith("https://");
  (await cookies()).set(COOKIE_SESION, abrirSesion(usuarioId), opcionesCookieSesion(https));
  redirect(destino);
}

export async function entrar(_prev: EstadoCuenta, form: FormData): Promise<EstadoCuenta> {
  const email = normalizarCorreo(String(form.get("email") ?? ""));
  const contrasena = String(form.get("contrasena") ?? "");
  const siguiente = siguienteSeguro(form.get("siguiente"));
  const valores = { email };

  const campos: EstadoCuenta["campos"] = {};
  if (!correoValido(email)) campos.email = "Escribe un correo válido, por ejemplo mari@ejemplo.mx.";
  if (!contrasena) campos.contrasena = "Escribe tu contraseña.";
  if (Object.keys(campos).length) return { error: null, campos, valores };

  const u = db().prepare("SELECT id, hash_contrasena FROM usuarios WHERE email = ?").get(email) as
    | { id: string; hash_contrasena: string | null }
    | undefined;
  // Siempre se calcula un scrypt (aunque el correo no exista) para no revelar qué correos tienen cuenta.
  const ok = await verificarContrasena(contrasena, u?.hash_contrasena ?? HASH_RELLENO);
  if (!u || !ok) return { error: "El correo o la contraseña no coinciden.", campos: {}, valores };

  db().prepare("UPDATE usuarios SET ultimo_acceso = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(u.id);
  return iniciarSesion(u.id, siguiente);
}

export async function registrarse(_prev: EstadoCuenta, form: FormData): Promise<EstadoCuenta> {
  const nombre = String(form.get("nombre") ?? "").trim();
  const email = normalizarCorreo(String(form.get("email") ?? ""));
  const contrasena = String(form.get("contrasena") ?? "");
  // Cuenta nueva: si no venía de otra página, primero va a configurar su negocio.
  const siguiente = siguienteSeguro(form.get("siguiente"), "/configurar");
  const valores = { nombre, email };

  const campos: EstadoCuenta["campos"] = {};
  if (nombre.length < 2 || nombre.length > 80) campos.nombre = "Escribe tu nombre (2 a 80 letras).";
  if (!correoValido(email)) campos.email = "Escribe un correo válido, por ejemplo mari@ejemplo.mx.";
  if (contrasena.length < MIN_CONTRASENA) campos.contrasena = `Usa al menos ${MIN_CONTRASENA} caracteres.`;
  else if (contrasena.length > 128) campos.contrasena = "Máximo 128 caracteres.";
  if (Object.keys(campos).length) return { error: null, campos, valores };

  const id = randomUUID();
  const hash = await hashContrasena(contrasena);
  try {
    db().prepare("INSERT INTO usuarios (id, email, nombre, hash_contrasena) VALUES (?, ?, ?, ?)").run(id, email, nombre, hash);
  } catch (e) {
    if (String(e).includes("UNIQUE")) {
      return { error: null, campos: { email: "Ya hay una cuenta con este correo. Entra con tu contraseña." }, valores };
    }
    console.error("registrarse:", e);
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo.", campos: {}, valores };
  }
  return iniciarSesion(id, siguiente);
}

"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { guardarNegocio, validarNegocio, type Negocio } from "@/lib/negocio";
import { usuarioActual } from "@/lib/sesion";

export type EstadoNegocio = { errores: Partial<Record<keyof Negocio, string>>; error: string | null };

/** Guarda nombre, RFC y régimen del negocio. Se valida otra vez aquí: el cliente no es confiable. */
export async function guardarConfiguracion(_prev: EstadoNegocio, form: FormData): Promise<EstadoNegocio> {
  const usuario = await usuarioActual();
  if (!usuario) return { errores: {}, error: "Tu sesión terminó. Vuelve a entrar." };

  const v = validarNegocio({ nombre: form.get("nombre"), rfc: form.get("rfc"), regimen: form.get("regimen") });
  if (!v.ok) return { errores: v.errores, error: null };

  try {
    guardarNegocio(db(), usuario.id, v.negocio);
  } catch (e) {
    console.error("guardarConfiguracion:", e);
    return { errores: {}, error: "No pudimos guardar tus datos. Intenta de nuevo." };
  }
  redirect("/");
}

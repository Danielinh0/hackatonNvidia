"use server";

import { redirect } from "next/navigation";
import { db, esUuid } from "@/lib/db";
import {
  CAMPOS_REVISION, confirmarComprobante, descartarComprobante, pendientes, validarRevision,
  type CampoRevision, type Clasificacion,
} from "@/lib/operaciones";
import { usuarioActual } from "@/lib/sesion";

/*
 * Revisión humana obligatoria (CLAUDE.md sec. 3d): la persona confirma o corrige lo que leyó el modelo.
 * Cada cambio queda en `correcciones`. Después se pasa al siguiente pendiente.
 */
export type EstadoRevision = { errores: Partial<Record<CampoRevision | "clasificacion", string>>; error: string | null };

function siguiente(usuarioId: string, modo: string) {
  const [proximo] = pendientes(db(), usuarioId);
  const ruta = modo === "detalle" ? "/revision/detalle" : "/revision/sencillo";
  return proximo ? `${ruta}?id=${proximo}` : "/operaciones";
}

export async function confirmar(_prev: EstadoRevision, form: FormData): Promise<EstadoRevision> {
  const usuario = await usuarioActual();
  if (!usuario) return { errores: {}, error: "Tu sesión terminó. Vuelve a entrar." };
  const id = String(form.get("id") ?? "");
  if (!esUuid(id)) return { errores: {}, error: "No encontramos este comprobante." };

  // Solo los campos que venían en el formulario (el modo sencillo no muestra todos).
  const valores: Partial<Record<CampoRevision, string>> = {};
  for (const campo of Object.keys(CAMPOS_REVISION) as CampoRevision[]) {
    const v = form.get(campo);
    if (typeof v === "string") valores[campo] = v;
  }
  const clasificacion = String(form.get("clasificacion") ?? "") || null;
  const v = validarRevision(valores, clasificacion);
  if (!v.ok) return { errores: v.errores, error: null };

  const d = db();
  try {
    d.exec("BEGIN IMMEDIATE");
    const ok = confirmarComprobante(d, usuario.id, id, valores, clasificacion as Clasificacion);
    if (!ok) throw new Error("no encontrado");
    d.exec("COMMIT");
  } catch (e) {
    if (d.isTransaction) d.exec("ROLLBACK");
    console.error("confirmar:", e);
    return { errores: {}, error: "No pudimos guardar tu revisión. No se cambió nada; intenta de nuevo." };
  }
  redirect(siguiente(usuario.id, String(form.get("modo"))));
}

export async function descartar(form: FormData) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/entrar");
  const id = String(form.get("id") ?? "");
  if (esUuid(id)) descartarComprobante(db(), usuario.id, id);
  redirect(siguiente(usuario.id, String(form.get("modo"))));
}

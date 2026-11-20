import { db, esUuid } from "@/lib/db";
import { usuarioActual } from "@/lib/sesion";

/*
 * Devuelve los bytes de una imagen guardada, solo a la persona dueña del lote.
 * Si es de otra persona responde 404 (no revela que existe).
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/imagenes/[id]">) {
  const { id } = await ctx.params;
  if (!esUuid(id)) return new Response("No encontrada", { status: 404 });

  const usuario = await usuarioActual();
  if (!usuario) return new Response("Inicia sesión", { status: 401 });

  try {
    const fila = db()
      .prepare(
        `SELECT i.tipo_mime, i.datos FROM imagenes i JOIN lotes l ON l.id = i.lote_id
          WHERE i.id = ? AND l.usuario_id = ?`,
      )
      .get(id, usuario.id) as
      | { tipo_mime: string; datos: Uint8Array }
      | undefined;
    if (!fila) return new Response("No encontrada", { status: 404 });
    return new Response(new Uint8Array(fila.datos), {
      headers: {
        "Content-Type": fila.tipo_mime,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("GET /api/imagenes:", e);
    return new Response("Error al leer la imagen", { status: 503 });
  }
}

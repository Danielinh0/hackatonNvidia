import { db, esUuid } from "@/lib/db";

/*
 * Devuelve los bytes de una imagen guardada.
 * Pendiente: exigir el ID token de Firebase y comprobar que la imagen es del usuario.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/imagenes/[id]">) {
  const { id } = await ctx.params;
  if (!esUuid(id)) return new Response("No encontrada", { status: 404 });

  try {
    const fila = db().prepare("SELECT tipo_mime, datos FROM imagenes WHERE id = ?").get(id) as
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

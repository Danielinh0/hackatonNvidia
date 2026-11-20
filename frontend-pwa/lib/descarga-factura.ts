import "server-only";
import { db, esUuid } from "./db";
import { archivoFactura } from "./prefactura";
import { usuarioActual } from "./sesion";

/* Sirve el PDF o XML guardado de una pre-factura, solo a su dueña o dueño. Si no es suya → 404. */
export async function responderArchivoFactura(req: Request, id: string, formato: "pdf" | "xml"): Promise<Response> {
  const usuario = await usuarioActual();
  if (!usuario) return new Response("Inicia sesión", { status: 401 });
  const a = esUuid(id) ? archivoFactura(db(), usuario.id, id, formato) : null;
  if (!a) return new Response("No encontrada", { status: 404 });
  const disp = new URL(req.url).searchParams.has("descargar") ? "attachment" : "inline";
  return new Response(new Uint8Array(a.bytes), {
    headers: {
      "Content-Type": a.tipo,
      "Content-Disposition": `${disp}; filename="${a.nombre}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

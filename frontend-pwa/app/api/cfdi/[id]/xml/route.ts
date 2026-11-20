import { responderError } from "@/lib/cfdi/http";
import { proveedor } from "@/lib/cfdi/proveedor";

/* GET /api/cfdi/{id}/xml → el XML de la factura (con mock: SIMULADO, sin validez fiscal). ?descargar=1 fuerza la descarga. */
export async function GET(req: Request, ctx: RouteContext<"/api/cfdi/[id]/xml">) {
  try {
    const { id } = await ctx.params;
    const a = await proveedor().archivo(id, "xml");
    const disp = new URL(req.url).searchParams.has("descargar") ? "attachment" : "inline";
    return new Response(new Uint8Array(a.bytes), {
      headers: {
        "Content-Type": a.tipo,
        "Content-Disposition": `${disp}; filename="${a.nombre}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return responderError(e);
  }
}

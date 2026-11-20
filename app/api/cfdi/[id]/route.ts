import { enlaces, responderError } from "@/lib/cfdi/http";
import { proveedor } from "@/lib/cfdi/proveedor";

/*
 * GET    /api/cfdi/{id}                                  → detalle de una factura
 * DELETE /api/cfdi/{id}?motivo=02[&uuidSustitucion=...]  → cancelar (SIMULADO con mock)
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/cfdi/[id]">) {
  try {
    const { id } = await ctx.params;
    const factura = await proveedor().obtener(id);
    return Response.json({ factura, enlaces: enlaces(factura.id) });
  } catch (e) {
    return responderError(e);
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/cfdi/[id]">) {
  try {
    const { id } = await ctx.params;
    const q = new URL(req.url).searchParams;
    const factura = await proveedor().cancelar(id, q.get("motivo") ?? "02", q.get("uuidSustitucion") ?? undefined);
    return Response.json({ factura, enlaces: enlaces(factura.id) });
  } catch (e) {
    return responderError(e);
  }
}

import { responderArchivoFactura } from "@/lib/descarga-factura";

/* GET /facturas/{id}/pdf → PDF guardado de la pre-factura (SIMULADO con CFDI_PROVIDER=mock). ?descargar=1 lo baja. */
export async function GET(req: Request, ctx: RouteContext<"/facturas/[id]/pdf">) {
  return responderArchivoFactura(req, (await ctx.params).id, "pdf");
}

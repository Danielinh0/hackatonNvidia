import { connection } from "next/server";
import { enlaces, falloSimulado, leerJson, responderError } from "@/lib/cfdi/http";
import { proveedor } from "@/lib/cfdi/proveedor";
import type { CfdiEntrada } from "@/lib/cfdi/tipos";
import { validarCfdi } from "@/lib/cfdi/validar";

/*
 * POST /api/cfdi  → valida y emite (timbra) una factura con el proveedor de CFDI_PROVIDER.
 * GET  /api/cfdi  → lista las facturas emitidas.
 * Con CFDI_PROVIDER=mock todo es SIMULADO, sin validez fiscal.
 * Pendiente: exigir el ID token de Firebase (CLAUDE.md sec. 16) y separar facturas por uid.
 */
export async function POST(req: Request) {
  try {
    const cuerpo = await leerJson(req);
    // El código valida antes de mandar nada al PAC: el PAC nunca recibe un CFDI que no cuadra.
    const v = validarCfdi(cuerpo);
    if (!v.ok) {
      return Response.json(
        { error: { codigo: "validacion", mensaje: "El CFDI tiene errores. Corrígelos y vuelve a intentar.", detalles: v } },
        { status: 422 },
      );
    }
    const factura = await proveedor().emitir(cuerpo as CfdiEntrada, { simularFallo: falloSimulado(req) });
    return Response.json(
      { factura, advertencias: v.advertencias, enlaces: enlaces(factura.id) },
      { status: 201, headers: { Location: `/api/cfdi/${factura.id}` } },
    );
  } catch (e) {
    return responderError(e);
  }
}

export async function GET() {
  await connection(); // siempre en tiempo de ejecución, nunca prerenderizada en el build
  try {
    const facturas = await proveedor().listar();
    return Response.json({ total: facturas.length, facturas: facturas.map((f) => ({ ...f, enlaces: enlaces(f.id) })) });
  } catch (e) {
    return responderError(e);
  }
}

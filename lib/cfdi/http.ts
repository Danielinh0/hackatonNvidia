import "server-only";
import { ErrorCfdi } from "./tipos";

/* Utilidades compartidas por las rutas /api/cfdi. */

const MAX_CUERPO = 256 * 1024; // 256 KB es de sobra para un CFDI de hasta 50 conceptos

export async function leerJson(req: Request): Promise<unknown> {
  const texto = await req.text();
  if (texto.length > MAX_CUERPO) throw new ErrorCfdi(413, "muy_grande", "El cuerpo supera 256 KB.");
  if (!texto.trim()) throw new ErrorCfdi(400, "sin_cuerpo", "Falta el cuerpo JSON.");
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorCfdi(400, "json_invalido", "El cuerpo no es JSON válido.");
  }
}

/** Convierte cualquier error en una respuesta JSON { error: { codigo, mensaje, detalles } }. */
export function responderError(e: unknown): Response {
  if (e instanceof ErrorCfdi) {
    return Response.json({ error: { codigo: e.codigo, mensaje: e.message, detalles: e.detalles } }, { status: e.status });
  }
  console.error("/api/cfdi:", e);
  return Response.json({ error: { codigo: "interno", mensaje: "Error interno al procesar la factura." } }, { status: 500 });
}

const FALLOS = ["pac-caido", "timeout", "rechazo"] as const;
/** Cabecera de pruebas `x-simular-fallo` (solo PAC simulado). */
export function falloSimulado(req: Request) {
  const v = req.headers.get("x-simular-fallo");
  return (FALLOS as readonly string[]).includes(v ?? "") ? (v as (typeof FALLOS)[number]) : undefined;
}

export const enlaces = (id: string) => ({
  self: `/api/cfdi/${id}`,
  xml: `/api/cfdi/${id}/xml`,
  pdf: `/api/cfdi/${id}/pdf`,
});

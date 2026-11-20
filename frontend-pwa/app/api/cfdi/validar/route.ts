import { leerJson, responderError } from "@/lib/cfdi/http";
import { validarCfdi } from "@/lib/cfdi/validar";

/*
 * POST /api/cfdi/validar → revisa un CFDI SIN emitirlo. Devuelve errores por campo,
 * advertencias y los totales que calculó el código. Pensado para la pantalla de revisión.
 * Siempre responde 200 si el JSON es legible; mira `ok` en la respuesta.
 */
export async function POST(req: Request) {
  try {
    return Response.json(validarCfdi(await leerJson(req)));
  } catch (e) {
    return responderError(e);
  }
}

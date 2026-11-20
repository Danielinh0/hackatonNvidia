import "server-only";
import { CFDI_EJEMPLO } from "./cfdi-ejemplo";
import { leerCfdi } from "./cfdi";
import type { Analisis } from "./comprobantes";

/*
 * Manda la imagen (en memoria) al servicio de visión del equipo y lee su respuesta.
 * La imagen no se escribe en disco aquí: al terminar la petición se descarta.
 * El teléfono nunca llama a FastAPI directo; va por aquí con el secreto compartido (CLAUDE.md sec. 16).
 *
 *   BACKEND_URL        p. ej. https://<tunel>.trycloudflare.com  (sin / final)
 *   BACKEND_TOKEN      secreto compartido con FastAPI
 *   ANALISIS_SIMULADO  "1" = sin servicio, devuelve lib/cfdi-ejemplo.ts marcado SIMULADO
 */
const ESPERA_MS = 60_000;

export async function analizarDocumento(bytes: Uint8Array, tipo: string, nombre: string): Promise<Analisis> {
  if (process.env.ANALISIS_SIMULADO === "1") {
    const l = leerCfdi(CFDI_EJEMPLO);
    if (!l.ok) return l;
    return { ok: true, cfdi: l.cfdi, faltantes: l.faltantes, json: CFDI_EJEMPLO, confGlobal: null, simulado: true };
  }

  const url = process.env.BACKEND_URL;
  const token = process.env.BACKEND_TOKEN;
  if (!url || !token) return { ok: false, motivo: "El servicio de análisis no está conectado. Intenta más tarde." };

  const fd = new FormData();
  fd.append("imagen", new Blob([new Uint8Array(bytes)], { type: tipo }), nombre);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${url}/vision/analizar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
      signal: AbortSignal.timeout(ESPERA_MS),
      cache: "no-store",
    });
  } catch (e) {
    console.error("analizarDocumento:", e);
    const tiempo = e instanceof Error && e.name === "TimeoutError";
    return { ok: false, motivo: tiempo ? "El análisis tardó demasiado. Intenta de nuevo." : "No pudimos conectar con el servicio de análisis." };
  }
  if (!respuesta.ok) {
    console.error("analizarDocumento: HTTP", respuesta.status);
    return { ok: false, motivo: "El servicio de análisis no pudo procesar esta imagen." };
  }

  let json: unknown;
  try {
    json = await respuesta.json();
  } catch {
    return { ok: false, motivo: "El servicio de análisis respondió algo que no se pudo leer." };
  }
  const l = leerCfdi(json);
  if (!l.ok) return l;
  const conf = (json as { conf_global?: unknown }).conf_global;
  const confGlobal = typeof conf === "number" && conf >= 0 && conf <= 1 ? conf : null;
  return { ok: true, cfdi: l.cfdi, faltantes: l.faltantes, json, confGlobal, simulado: false };
}

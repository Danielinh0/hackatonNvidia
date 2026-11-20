import "server-only";

/*
 * Voz → texto para el chat con Bisie'. Mismo camino que la visión (lib/analisis.ts):
 * el teléfono graba, la Server Action recibe el audio EN MEMORIA y lo reenvía a FastAPI
 * con el secreto compartido. El audio no se guarda en disco ni en la base.
 *
 * Contrato (pendiente en el backend):
 *   POST {BACKEND_URL}/asistente/transcribir   multipart: audio   Authorization: Bearer <BACKEND_TOKEN>
 *   → { "texto": "..." }
 * Si el servicio no está conectado se informa; NUNCA se inventa un texto.
 */
const ESPERA_MS = 30_000;

export type Transcripcion = { ok: true; texto: string } | { ok: false; motivo: string };

export async function transcribirAudio(bytes: Uint8Array, tipo: string): Promise<Transcripcion> {
  const url = process.env.BACKEND_URL;
  const token = process.env.BACKEND_TOKEN;
  if (!url || !token) {
    return { ok: false, motivo: "Ya grabé tu voz, pero la transcripción todavía no está conectada. Escríbelo por ahora." };
  }

  const fd = new FormData();
  const ext = tipo.includes("mp4") ? "m4a" : tipo.includes("ogg") ? "ogg" : "webm";
  fd.append("audio", new Blob([new Uint8Array(bytes)], { type: tipo }), `voz.${ext}`);

  let r: Response;
  try {
    r = await fetch(`${url}/asistente/transcribir`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
      signal: AbortSignal.timeout(ESPERA_MS),
      cache: "no-store",
    });
  } catch (e) {
    console.error("transcribirAudio:", e);
    const tiempo = e instanceof Error && e.name === "TimeoutError";
    return { ok: false, motivo: tiempo ? "La transcripción tardó demasiado. Intenta de nuevo." : "No pudimos conectar con el servicio de voz." };
  }
  if (r.status === 404) return { ok: false, motivo: "El servicio de voz aún no está disponible. Escríbelo por ahora." };
  if (!r.ok) {
    console.error("transcribirAudio: HTTP", r.status);
    return { ok: false, motivo: "No pude entender el audio. Intenta de nuevo o escríbelo." };
  }

  let json: unknown;
  try {
    json = await r.json();
  } catch {
    return { ok: false, motivo: "El servicio de voz respondió algo que no se pudo leer." };
  }
  const texto = (json as { texto?: unknown })?.texto;
  if (typeof texto !== "string" || !texto.trim()) return { ok: false, motivo: "No escuché nada claro. Intenta hablar más cerca del teléfono." };
  return { ok: true, texto: texto.trim().slice(0, 1000) };
}

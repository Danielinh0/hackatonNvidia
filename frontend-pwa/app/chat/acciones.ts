"use server";

import { usuarioActual } from "@/lib/sesion";
import { transcribirAudio, type Transcripcion } from "@/lib/transcripcion";

/* Límites de la grabación (el teléfono corta a los 60 s; aquí se vuelve a comprobar). */
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const TIPOS = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/aac"];

/** Recibe la grabación del micrófono y devuelve el texto para que la persona lo revise antes de enviarlo. */
export async function transcribirVoz(form: FormData): Promise<Transcripcion> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, motivo: "Tu sesión terminó. Vuelve a entrar." };

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return { ok: false, motivo: "No se recibió audio. Intenta grabar de nuevo." };
  if (audio.size > MAX_AUDIO_BYTES) return { ok: false, motivo: "La grabación es muy larga. Máximo 1 minuto." };
  const tipo = audio.type.split(";")[0].trim().toLowerCase();
  if (!TIPOS.includes(tipo)) return { ok: false, motivo: "Formato de audio no compatible." };

  return transcribirAudio(new Uint8Array(await audio.arrayBuffer()), tipo);
}

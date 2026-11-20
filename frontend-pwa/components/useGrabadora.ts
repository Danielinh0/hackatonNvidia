"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Graba audio del micrófono con MediaRecorder (sin librerías ni servicios externos).
 * Requiere https o localhost: en http://<IP> el navegador no da `mediaDevices` (CLAUDE.md sec. 16).
 * Corta solo a los `maxSegundos`. Al terminar entrega el Blob y apaga el micrófono.
 */
export type EstadoGrabadora = "listo" | "pidiendo" | "grabando";

const TIPOS = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function useGrabadora({
  maxSegundos = 60,
  alTerminar,
  alFallar,
}: {
  maxSegundos?: number;
  alTerminar: (audio: Blob) => void;
  alFallar: (motivo: string) => void;
}) {
  const [estado, setEstado] = useState<EstadoGrabadora>("listo");
  const [segundos, setSegundos] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelado = useRef(false);

  const limpiar = useCallback(() => {
    if (reloj.current) clearInterval(reloj.current);
    reloj.current = null;
    rec.current?.stream.getTracks().forEach((t) => t.stop());
    rec.current = null;
  }, []);

  useEffect(() => () => {
    cancelado.current = true;
    if (rec.current?.state === "recording") rec.current.stop();
    limpiar();
  }, [limpiar]);

  const detener = useCallback(() => {
    if (rec.current?.state === "recording") rec.current.stop();
  }, []);

  const iniciar = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      alFallar("Tu navegador no permite grabar aquí. Abre Dzuun con https o escribe tu mensaje.");
      return;
    }
    setEstado("pidiendo");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setEstado("listo");
      const nombre = e instanceof DOMException ? e.name : "";
      alFallar(
        nombre === "NotAllowedError"
          ? "No me diste permiso de usar el micrófono. Puedes activarlo en los ajustes del navegador."
          : nombre === "NotFoundError"
            ? "No encontré un micrófono en este dispositivo."
            : "No pude abrir el micrófono. Intenta de nuevo.",
      );
      return;
    }

    const tipo = TIPOS.find((t) => MediaRecorder.isTypeSupported(t));
    const r = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    const partes: Blob[] = [];
    r.ondataavailable = (ev) => ev.data.size > 0 && partes.push(ev.data);
    r.onstop = () => {
      const mime = r.mimeType || tipo || "audio/webm";
      limpiar();
      setEstado("listo");
      setSegundos(0);
      if (cancelado.current) return;
      const audio = new Blob(partes, { type: mime });
      if (audio.size === 0) alFallar("No se grabó nada. Intenta de nuevo.");
      else alTerminar(audio);
    };
    r.onerror = () => {
      limpiar();
      setEstado("listo");
      alFallar("La grabación se interrumpió. Intenta de nuevo.");
    };

    rec.current = r;
    r.start();
    setEstado("grabando");
    setSegundos(0);
    const inicio = Date.now();
    reloj.current = setInterval(() => {
      const s = Math.floor((Date.now() - inicio) / 1000);
      setSegundos(s);
      if (s >= maxSegundos) detener();
    }, 250);
  }, [alFallar, alTerminar, detener, limpiar, maxSegundos]);

  return { estado, segundos, iniciar, detener };
}

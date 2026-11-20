"use client";

import { useState } from "react";
import { Ico } from "./ui";

/**
 * Lee un texto en voz alta con la Web Speech API (es-MX), CLAUDE.md sec. 15.
 * Si el navegador no la soporta, lo avisa en lugar de fallar en silencio.
 */
export function BotonVoz({ texto }: { texto: string }) {
  const [estado, setEstado] = useState<"listo" | "hablando" | "sin-soporte">("listo");

  function hablar() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setEstado("sin-soporte");
      return;
    }
    const synth = window.speechSynthesis;
    if (estado === "hablando") {
      synth.cancel();
      setEstado("listo");
      return;
    }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-MX";
    u.onend = () => setEstado("listo");
    u.onerror = () => setEstado("listo");
    synth.cancel();
    synth.speak(u);
    setEstado("hablando");
  }

  return (
    <>
      <button
        type="button"
        onClick={hablar}
        aria-pressed={estado === "hablando"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#80a3fd] px-4 py-3 text-[15px] leading-[22.5px] font-bold text-azul-tinta drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
      >
        <Ico src="/figma/sencillo/bocina.svg" w={18} h={17.5} />
        {estado === "hablando" ? "Detener lectura" : "🔊 Escuchar en voz alta"}
      </button>
      {estado === "sin-soporte" && (
        <p role="alert" className="text-xs leading-4 font-bold text-white">
          Tu navegador no puede leer en voz alta.
        </p>
      )}
    </>
  );
}

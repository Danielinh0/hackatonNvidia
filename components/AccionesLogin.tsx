"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Ico } from "./ui";

/*
 * Botón principal de la Bienvenida (Figma 1:3016). Por ahora el acceso es local:
 * "Crear mi cuenta" → /registro. Si hay credenciales de Google (docs/login.md) se muestra
 * además "Continuar con Google" con su estado de carga (Figma 1:2691).
 */
const B = "/figma/bienvenida";

export function Privacidad() {
  return (
    <p className="flex items-center gap-1.5 pt-1 text-xs leading-4 font-bold text-tinta-suave/80">
      <Ico src={`${B}/candado.svg`} w={10.667} h={14} />
      Usamos tus fotos solo para leer tus tickets
    </p>
  );
}

export function AccionesLogin({ google = false }: { google?: boolean }) {
  const [cargando, setCargando] = useState(false);

  // Si la persona regresa con "atrás" desde Google, el navegador restaura la página tal cual:
  // quitamos el estado de carga para que pueda volver a intentarlo.
  useEffect(() => {
    const alVolver = (e: PageTransitionEvent) => e.persisted && setCargando(false);
    window.addEventListener("pageshow", alVolver);
    return () => window.removeEventListener("pageshow", alVolver);
  }, []);

  if (cargando) {
    return (
      <div className="flex w-full max-w-[384px] flex-col items-center gap-2" aria-live="polite">
        <button
          disabled
          className="flex h-[52px] w-full items-center justify-center gap-3 overflow-clip rounded-full bg-white px-4 opacity-95 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
        >
          <Ico src={`${B}/spinner.svg`} w={20} h={20} className="animate-spin" />
          <span className="text-[19px] leading-6 font-bold text-tinta">Conectando con Google...</span>
        </button>
        <p className="flex w-full items-center gap-2 bg-azul-150/50 p-2 text-xs leading-[15px] font-bold text-azul-tinta shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul">
            <Ico src={`${B}/sync.svg`} w={12} h={12} />
          </span>
          Espera un momento mientras verificamos tu cuenta...
        </p>
        <Privacidad />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[320px] flex-col items-center gap-2">
      <Link
        href="/registro"
        className="flex h-14 w-full items-center justify-center rounded-full bg-marca-brillante text-[19px] leading-6 font-bold tracking-[-0.475px] text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
      >
        Crear mi cuenta
      </Link>
      {google && (
        <a
          href="/auth/google"
          onClick={() => setCargando(true)}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-white text-base leading-6 font-semibold text-azul drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <Ico src={`${B}/google.svg`} w={18} h={18} />
          Continuar con Google
        </a>
      )}
      <Privacidad />
    </div>
  );
}

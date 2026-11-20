"use client";

import { useState } from "react";

/**
 * Selector de modo Sencillo / Detalle (CLAUDE.md sec. 15).
 * Por ahora solo es visual: guarda el estado localmente.
 */
export function ModoToggle() {
  const [modo, setModo] = useState<"sencillo" | "detalle">("sencillo");

  return (
    <div
      role="radiogroup"
      aria-label="Modo de vista"
      className="flex items-center rounded-full bg-azul-50 p-1 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]"
    >
      {(["sencillo", "detalle"] as const).map((m) => {
        const activo = modo === m;
        return (
          <button
            key={m}
            role="radio"
            aria-checked={activo}
            onClick={() => setModo(m)}
            className={`flex min-h-8 min-w-11 items-center justify-center rounded-full px-2 text-xs leading-4 font-bold capitalize ${
              activo
                ? "bg-azul text-white drop-shadow-[0px_1px_2px_rgba(0,15,42,0.12)]"
                : "text-tinta-suave"
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

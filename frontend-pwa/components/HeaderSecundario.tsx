import Link from "next/link";
import type { ReactNode } from "react";
import { Ico, Logo } from "./ui";

/**
 * Encabezado de pantallas de flujo (con botón Regresar), p. ej. Figma 1:615.
 * `titulo` por defecto muestra la marca Dzuun.
 */
export function HeaderSecundario({
  atras = "/",
  titulo,
  derecha,
}: {
  atras?: string;
  titulo?: ReactNode;
  derecha?: ReactNode;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] bg-fondo/85 shadow-[0px_1px_8px_0px_rgba(0,15,42,0.04)] backdrop-blur-[24px]">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Link href={atras} aria-label="Regresar" className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full">
            <Ico src="/figma/configurar/atras.svg" w={16} h={16} />
          </Link>
          {titulo ?? (
            <span className="flex items-center gap-1">
              <Logo alto={26} className="text-tinta" />
              <span className="text-[19px] leading-6 font-bold tracking-[-0.475px] text-tinta">Dzuun</span>
            </span>
          )}
        </div>
        {derecha && <div className="flex shrink-0 items-center gap-2">{derecha}</div>}
      </div>
    </header>
  );
}

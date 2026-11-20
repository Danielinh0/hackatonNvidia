import Link from "next/link";

/** Encabezado con marca + chip RESICO + "Modo Rápido" (Figma 1:827 y 1:1673). */
export function HeaderResico({ seccion }: { seccion: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] bg-fondo/80 shadow-[0px_1px_8px_0px_rgba(0,0,0,0.04)] backdrop-blur-[24px]">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-marca text-[22px] leading-7 font-bold text-white">
            D
          </span>
          <span className="flex flex-col">
            <span className="flex items-center gap-1">
              <span className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-tinta">Dzuun</span>
              <span className="rounded-full bg-lima px-1 py-0.5 text-xs leading-4 font-bold text-lima-tinta">RESICO</span>
            </span>
            <span className="text-xs leading-3 font-bold text-tinta-suave">{seccion}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex min-h-11 items-center gap-1 rounded-full bg-azul-50 px-2 text-xs leading-4 font-bold text-azul">
            <span className="size-2 rounded-full bg-oliva-viva" />
            Modo Rápido
          </span>
          <span className="size-8 rounded-full bg-azul-150" />
        </div>
      </div>
    </header>
  );
}

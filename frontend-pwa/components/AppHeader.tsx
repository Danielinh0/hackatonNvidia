import Link from "next/link";
import { ModoToggle } from "./ModoToggle";

/** Encabezado fijo de las pantallas principales (Figma 1:190). */
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] bg-fondo/90 shadow-[0px_1px_8px_0px_rgba(0,0,0,0.04)] backdrop-blur-[24px]">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-[19px] leading-6 font-bold text-tinta">
          Dzuun
        </Link>
        <div className="flex items-center gap-1">
          <ModoToggle />
          <Link
            href="/chat"
            aria-label="Perfil de Bisie'"
            className="relative flex size-11 items-center justify-center rounded-full"
          >
            {/* Avatar: en Figma el nodo "Profile" está vacío (sin imagen aún). */}
            <span className="size-8 rounded-full bg-azul-150" />
            <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-lima shadow-[0px_0px_0px_2px_#f9f9ff]" />
          </Link>
        </div>
      </div>
    </header>
  );
}

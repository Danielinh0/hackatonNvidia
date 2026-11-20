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
        {/* La cuenta ahora vive en la barra inferior (BottomNav). */}
        <ModoToggle />
      </div>
    </header>
  );
}

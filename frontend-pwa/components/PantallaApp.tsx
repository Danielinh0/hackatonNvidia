import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNav, type Pestana } from "./BottomNav";

/** Marco móvil: encabezado fijo + contenido + navegación inferior. */
export function PantallaApp({ activa, children }: { activa?: Pestana; children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 pt-16 pb-24">
        {children}
      </main>
      <BottomNav activa={activa} />
    </>
  );
}

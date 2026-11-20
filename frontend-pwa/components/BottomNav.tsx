import { Suspense } from "react";
import { AvatarUsuario, AvatarVacio } from "./AvatarUsuario";
import { BarraNav, type Pestana } from "./BarraNav";

export type { Pestana };

/**
 * Barra de navegación inferior (Figma 1:206, rediseñada con la referencia de Dribbble).
 * Parte de servidor: renderiza el avatar de la cuenta (lee la sesión) y se lo pasa a la barra de cliente,
 * que deduce la pestaña activa de la ruta. `activa` solo la fuerza si se pasa.
 */
export function BottomNav({ activa }: { activa?: Pestana }) {
  return (
    <BarraNav
      activa={activa}
      cuenta={
        <Suspense fallback={<AvatarVacio size={26} />}>
          <AvatarUsuario size={26} enlace={false} />
        </Suspense>
      }
    />
  );
}

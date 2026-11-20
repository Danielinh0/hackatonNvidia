import Link from "next/link";

export type Pestana = "inicio" | "subir" | "operaciones" | "bisie";

const items: { id: Pestana; label: string; href: string; w: number; h: number }[] = [
  { id: "inicio", label: "Inicio", href: "/", w: 16, h: 18 },
  { id: "subir", label: "Subir", href: "/subir", w: 18.333, h: 16.5 },
  { id: "operaciones", label: "Operaciones", href: "/operaciones", w: 18, h: 20 },
  { id: "bisie", label: "Bisie'", href: "/chat", w: 22, h: 19 },
];

function Icono({ id, w, h }: { id: Pestana; w: number; h: number }) {
  return (
    <span
      aria-hidden
      className="icono-mascara block"
      style={{ width: w, height: h, maskImage: `url(/figma/nav/${id}.svg)` }}
    />
  );
}

/**
 * Barra de navegación inferior (Figma 1:206).
 * Recibe la pestaña activa por prop para no depender de usePathname.
 */
export function BottomNav({ activa }: { activa?: Pestana }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0px_-4px_20px_0px_rgba(0,15,42,0.06)] backdrop-blur-[24px]"
    >
      <ul className="flex h-20 items-center justify-around px-1">
        {items.map((it) => {
          const activo = activa === it.id;
          const color = activo ? "text-marca" : "text-tinta-suave";
          return (
            <li key={it.id}>
              <Link
                href={it.href}
                aria-current={activo ? "page" : undefined}
                className={`flex min-h-12 min-w-14 flex-col items-center justify-center rounded-full px-1 ${color}`}
              >
                {it.id === "subir" ? (
                  <span className="relative h-8 w-11">
                    <span className="absolute -top-3 left-0 flex size-11 items-center justify-center rounded-full bg-marca text-white drop-shadow-[0px_4px_6px_rgba(186,11,0,0.35)]">
                      <Icono id={it.id} w={it.w} h={it.h} />
                    </span>
                  </span>
                ) : (
                  <span className="relative">
                    <Icono id={it.id} w={it.w} h={it.h} />
                    {it.id === "bisie" && (
                      <span className="absolute -top-1 -right-1 size-2 rounded-full bg-lima" />
                    )}
                  </span>
                )}
                <span className="pt-0.5 text-xs leading-4 font-bold">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

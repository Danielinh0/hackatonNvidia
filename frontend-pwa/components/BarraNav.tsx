"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type Pestana = "inicio" | "operaciones" | "subir" | "bisie" | "cuenta";

type Item = { id: Pestana; label: string; href: string; w: number; h: number };

/* Orden de la referencia: dos pestañas, acción central elevada, dos pestañas (la última es la cuenta). */
const items: Item[] = [
  { id: "inicio", label: "Inicio", href: "/", w: 16, h: 18 },
  { id: "operaciones", label: "Operaciones", href: "/operaciones", w: 18, h: 20 },
  { id: "subir", label: "Subir", href: "/subir", w: 18.333, h: 16.5 },
  { id: "bisie", label: "Bisie'", href: "/chat", w: 22, h: 19 },
  { id: "cuenta", label: "Cuenta", href: "/configurar", w: 0, h: 0 },
];

/** Pestaña que corresponde a la ruta: "/" exacta, las demás por prefijo (p. ej. /subir/recibido/… → subir). */
function pestanaDeRuta(ruta: string | null): Pestana | undefined {
  if (!ruta) return undefined;
  if (ruta === "/") return "inicio";
  return items.find((it) => it.href !== "/" && (ruta === it.href || ruta.startsWith(`${it.href}/`)))?.id;
}

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
 * Barra inferior (parte de cliente). Recibe el avatar ya renderizado en el servidor (`cuenta`),
 * porque leer la sesión solo se puede hacer del lado del servidor.
 */
export function BarraNav({ activa, cuenta }: { activa?: Pestana; cuenta: ReactNode }) {
  const ruta = usePathname();
  const actual = activa ?? pestanaDeRuta(ruta);

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0px_-4px_20px_0px_rgba(0,15,42,0.08)]"
    >
      <ul className="grid h-16 grid-cols-5 items-stretch px-2">
        {items.map((it) => {
          const activo = actual === it.id;

          /* Acción principal: cuadro rojo elevado sobre la barra. */
          if (it.id === "subir") {
            return (
              <li key={it.id} className="flex justify-center">
                <Link
                  href={it.href}
                  aria-current={activo ? "page" : undefined}
                  aria-label={it.label}
                  className="group flex w-full items-center justify-center focus-visible:outline-none"
                >
                  {/* Caja del mismo alto que los demás iconos; el cuadro sobresale hacia arriba. */}
                  <span className="relative h-9 w-12">
                    <span
                      className={`absolute bottom-2 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-marca text-white shadow-[0px_6px_14px_0px_rgba(186,11,0,0.35)] transition-transform duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-marca ${
                        activo ? "ring-4 ring-marca/20" : ""
                      }`}
                    >
                      <Icono id={it.id} w={it.w * 1.2} h={it.h * 1.2} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={it.id} className="relative flex justify-center">
              {/* Indicador superior de la pestaña activa */}
              <span
                aria-hidden
                className={`absolute top-0 h-1 rounded-b-full bg-marca transition-all duration-200 ease-out ${
                  activo ? "w-8 opacity-100" : "w-0 opacity-0"
                }`}
              />
              <Link
                href={it.href}
                aria-current={activo ? "page" : undefined}
                aria-label={it.label}
                className={`group flex w-full items-center justify-center transition-colors focus-visible:outline-none ${
                  activo ? "text-marca" : "text-tinta-suave hover:text-tinta"
                }`}
              >
                <span
                  className={`relative flex h-9 w-12 items-center justify-center rounded-xl transition-colors group-focus-visible:outline-2 group-focus-visible:outline-marca ${
                    activo ? "" : "group-hover:bg-marca/10"
                  }`}
                >
                  {it.id === "cuenta" ? (
                    <span className={`rounded-full ${activo ? "ring-2 ring-marca ring-offset-2" : ""}`}>{cuenta}</span>
                  ) : (
                    <Icono id={it.id} w={it.w} h={it.h} />
                  )}
                  {it.id === "bisie" && !activo && (
                    <span className="absolute top-1 right-2.5 size-2 rounded-full bg-lima" />
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

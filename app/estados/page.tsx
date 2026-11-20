import Link from "next/link";
import { CatalogoEstados } from "@/components/CatalogoEstados";
import { Ico } from "@/components/ui";

/*
 * Pantalla 11 · Errores y estados (Figma 1:2375). Catálogo de mensajes de error y recuperación.
 * Ajustes respecto al boceto: se quitó el chip "Soporte Humano" (no existe ese servicio) y
 * la afirmación "WCAG AAA" del banner, que no está medida para todas las combinaciones.
 */
const E = "/figma/estados";

export default function Estados() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] bg-fondo/90 shadow-[0px_1px_8px_0px_rgba(11,27,54,0.04)] backdrop-blur-[24px]">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" aria-label="Volver" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f1f3ff]">
              <Ico src={`${E}/atras.svg`} w={10.794} h={18.333} />
            </Link>
            <div className="min-w-0">
              <p className="flex items-center gap-1">
                <span className="truncate text-[19px] leading-[23.75px] font-bold tracking-[-0.475px] text-tinta">Estados del sistema</span>
                <span className="shrink-0 rounded-full bg-lima px-2 py-0.5 text-xs leading-4 font-bold text-lima-tinta">RESICO</span>
              </p>
              <p className="flex items-center gap-1 text-xs leading-4 font-bold text-tinta-suave">
                <span className="size-1.5 rounded-full bg-oliva-viva" />
                Bisie&apos; en tiempo real
              </p>
            </div>
          </div>
          <Link href="/" aria-label="Cerrar vista" className="flex size-11 shrink-0 items-center justify-center rounded-full">
            <Ico src={`${E}/cerrar.svg`} w={14} h={14} />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 bg-fondo px-5 pt-[72px] pb-10">
        <div className="flex flex-col gap-1">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-azul-100 px-2.5 py-1 text-xs leading-4 font-bold text-azul">
            <Ico src={`${E}/catalogo.svg`} w={13.333} h={13.333} />
            Catálogo de Experiencia
          </span>
          <h1 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-tinta">Guía de estados del sistema</h1>
          <p className="text-base leading-[26px] text-tinta-suave">
            Mensajes de ayuda y recuperación ante imprevistos técnicos o de captura en Dzuun. Diseñados con calidez y claridad fiscal.
          </p>
        </div>

        <CatalogoEstados />

        <aside className="flex flex-col gap-1 rounded-2xl bg-noche p-4 drop-shadow-[0px_8px_12px_rgba(0,15,42,0.18)]">
          <p className="flex items-center gap-2 text-base leading-6 text-noche-tinta">
            <Ico src={`${E}/accesible.svg`} w={24} h={24} />
            Compromiso de Accesibilidad Dzuun
          </p>
          <p className="text-base leading-[26px] text-azul-100/90">
            Todos los estados respetan la paleta semántica de Dzuun: advertencias en ámbar #F2A900 y errores en rojo oscuro
            #B3261E, siempre con icono y palabra, para no depender solo del color.
          </p>
        </aside>

        <Link
          href="/"
          className="flex h-[52px] w-full max-w-[384px] items-center justify-center gap-2 self-center rounded-full bg-azul-100 text-base leading-6 text-tinta"
        >
          <Ico src={`${E}/check.svg`} w={16.667} h={16.667} />
          Entendido, volver a la app
        </Link>
      </main>
    </>
  );
}

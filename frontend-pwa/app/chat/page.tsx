import Image from "next/image";
import { Suspense } from "react";
import { AvatarUsuario, AvatarVacio } from "@/components/AvatarUsuario";
import Link from "next/link";
import { ChatBisie } from "@/components/ChatBisie";
import { Ico } from "@/components/ui";
import miniatura from "@/public/figma/chat/ticket-miniatura.jpg";

/* Pantalla 7 · Chat con Bisie' sobre un ticket (Figma 1:1998). Vista de diseño. */
const C = "/figma/chat";

export default function Chat() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] bg-fondo/90 shadow-[0px_1px_8px_0px_rgba(0,0,0,0.04)] backdrop-blur-[24px]">
        <div className="flex h-16 items-center justify-between px-2">
          <div className="flex items-center gap-1">
            <Link href="/revision/sencillo" aria-label="Regresar a revisión de tickets" className="flex size-11 items-center justify-center rounded-full">
              <Ico src={`${C}/atras.svg`} w={11.775} h={20} />
            </Link>
            <div>
              <h1 className="text-[19px] leading-[23.75px] font-bold text-tinta">Asistente Bisie&apos;</h1>
              <p className="text-xs leading-4 font-bold text-azul">Ticket #0842</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button aria-label="Ayuda y opciones" className="flex size-11 items-center justify-center rounded-full">
              <Ico src={`${C}/ayuda.svg`} w={20} h={20} />
            </button>
            <Suspense fallback={<AvatarVacio />}>
              <AvatarUsuario />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-fondo pt-16 pb-[72px]">
        {/* Contexto del ticket, anclado */}
        <div className="sticky top-16 z-20 bg-fondo/95 px-4 py-2 backdrop-blur-[12px]">
          <div className="flex items-center gap-4 bg-white p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
            <div className="relative h-20 w-16 shrink-0 overflow-clip bg-azul-50 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <Image src={miniatura} alt="Foto del ticket #0842" fill sizes="64px" className="object-cover opacity-90" />
              <span className="absolute inset-0 bg-gradient-to-t from-tinta/40 via-transparent to-transparent" />
              <Ico src={`${C}/lupa.svg`} w={13} h={22} className="absolute right-1 bottom-1" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between gap-1">
                <p className="flex min-w-0 items-center gap-1 text-xs leading-4 font-bold">
                  <span className="truncate tracking-[0.6px] text-azul uppercase">Folio #0842</span>
                  <span className="text-base text-tinta-suave/40">•</span>
                  <span className="truncate text-tinta-suave">12 nov 2024</span>
                </p>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#ffdad6] px-2 py-0.5 text-[11px] leading-[16.5px] font-bold tracking-[-0.275px] text-[#93000a]">
                  <Ico src={`${C}/falta.svg`} w={9.75} h={9.75} />
                  Falta dato
                </span>
              </div>
              <p className="tracking-[-0.5px]">
                <span className="text-xl leading-[26px] font-extrabold text-tinta">$245.00 </span>
                <span className="text-sm leading-5 text-tinta-suave">MXN</span>
              </p>
              <p className="flex items-center gap-1 pt-0.5 text-xs leading-[18px] font-bold text-marca">
                <Ico src={`${C}/pendiente.svg`} w={10.5} h={9.333} />
                Pendiente: Emisor / Negocio
              </p>
            </div>
          </div>
        </div>

        <ChatBisie />
      </main>
    </>
  );
}

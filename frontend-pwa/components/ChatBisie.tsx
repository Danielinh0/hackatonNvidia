"use client";

import { useCallback, useState, useTransition, type FormEvent } from "react";
import { transcribirVoz } from "@/app/chat/acciones";
import { Ico } from "./ui";
import { useGrabadora } from "./useGrabadora";

/*
 * Conversación con Bisie' (Figma 1:2001 y 1:2131).
 * VISTA DE DISEÑO: los mensajes iniciales son del boceto y el envío aún NO llama a
 * POST /asistente/chat. Al enviar, se muestra un aviso honesto en lugar de una respuesta inventada.
 * Voz: el micrófono graba (useGrabadora) y manda el audio a app/chat/acciones.ts → FastAPI
 * /asistente/transcribir. El texto reconocido se pone en la caja para que la persona lo revise
 * antes de enviarlo; si la transcripción no está conectada o falla, se avisa.
 */
const C = "/figma/chat";

type Msg = { id: number; de: "usuario" | "aviso"; texto: string };

function Avatar({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="block shrink-0 rounded-full bg-lima shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
      style={{ width: size, height: size }}
    />
  );
}

function BurbujaBisie({ hora, insignia, children }: { hora: string; insignia?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex max-w-[358px] items-start gap-1">
      <Avatar />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex items-center gap-1 pl-2 text-xs leading-4 font-bold text-tinta-suave">
          Bisie&apos;
          {insignia ?? <span className="size-1.5 rounded-full bg-oliva" />}
        </p>
        <div className="flex flex-col gap-2.5 bg-white p-4 text-base leading-[22px] text-tinta drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          {children}
        </div>
        <p className="pl-2 text-[11px] leading-[16.5px] text-tinta-suave/70">{hora}</p>
      </div>
    </div>
  );
}

function BurbujaUsuario({ texto, hora }: { texto: string; hora?: string }) {
  return (
    <div className="flex flex-col items-end gap-1 self-end">
      <p className="max-w-[335px] bg-azul px-4 py-4 text-base leading-[22px] text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        {texto}
      </p>
      {hora && (
        <p className="flex items-center gap-1 pr-1 text-[11px] leading-[16.5px] text-tinta-suave/70">
          {hora}
          <Ico src={`${C}/leido.svg`} w={13.694} h={8.415} />
        </p>
      )}
    </div>
  );
}

export function ChatBisie() {
  const [extra, setExtra] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");

  function enviar(t: string) {
    const limpio = t.trim();
    if (!limpio) return;
    setExtra((m) => [
      ...m,
      { id: Date.now(), de: "usuario", texto: limpio },
      {
        id: Date.now() + 1,
        de: "aviso",
        texto: "Vista de diseño: Bisie' todavía no está conectada al servidor, así que no puede responder aún.",
      },
    ]);
    setTexto("");
  }

  const avisar = useCallback((t: string) => setExtra((m) => [...m, { id: Date.now(), de: "aviso", texto: t }]), []);
  const [transcribiendo, iniciarTransicion] = useTransition();

  const alTerminar = useCallback(
    (audio: Blob) => {
      iniciarTransicion(async () => {
        const fd = new FormData();
        fd.append("audio", new File([audio], "voz", { type: audio.type }));
        try {
          const r = await transcribirVoz(fd);
          if (r.ok) setTexto((t) => (t.trim() ? `${t.trim()} ${r.texto}` : r.texto));
          else avisar(r.motivo);
        } catch {
          avisar("No pudimos conectar con el servidor. Revisa tu conexión.");
        }
      });
    },
    [avisar],
  );
  const grabadora = useGrabadora({ alTerminar, alFallar: avisar });
  const grabando = grabadora.estado === "grabando";
  const ocupado = grabadora.estado === "pidiendo" || transcribiendo;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  return (
    <>
      <div className="flex flex-col gap-4 px-4 pt-1 pb-8" aria-live="polite">
        <BurbujaBisie hora="10:42 AM">
          <p>No pude leer quién emitió este ticket. ¿Me dices el nombre del negocio?</p>
        </BurbujaBisie>

        <div className="-mx-4 flex gap-1 overflow-x-auto py-1 pr-4 pl-[60px] [scrollbar-width:none]">
          {["Es de un proveedor", "Es mío", "No sé"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => enviar(r)}
              className="shrink-0 rounded-full bg-lima px-3.5 py-1.5 text-sm leading-5 font-bold text-lima-tinta drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
            >
              {r}
            </button>
          ))}
        </div>

        <BurbujaUsuario
          hora="10:43 AM"
          texto="Creo que fue en una papelería pero no me dieron factura con RFC, ¿puedo deducirlo igual en mi RESICO?"
        />

        <BurbujaBisie hora="10:43 AM" insignia={<Ico src={`${C}/escudo.svg`} w={9.333} h={11.667} />}>
          <p className="flex items-center gap-1.5 text-sm leading-5 font-bold text-marca">
            <Ico src={`${C}/balanza.svg`} w={15} h={14.25} />
            Aviso de cumplimiento SAT
          </p>
          <p>Eso no lo puedo decidir yo; confírmalo con tu contador o en el portal del SAT.</p>
          <p className="bg-[#f1f3ff] p-3 text-sm leading-[22.75px] font-semibold text-tinta-suave">
            En <b className="text-tinta">RESICO</b> necesitas que el gasto esté amparado con{" "}
            <b className="text-tinta">CFDI (factura electrónica)</b> y pagado con medios electrónicos si supera $2,000 para
            acreditar IVA.
          </p>
        </BurbujaBisie>

        <div className="pl-11">
          <div className="flex flex-col gap-2.5 bg-azul-100 p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-start gap-2">
              <Ico src={`${C}/tienda.svg`} w={16.745} h={17} />
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-xs leading-4 font-bold tracking-[0.6px] text-azul uppercase">Propuesta rápida</p>
                <p className="text-[19px] leading-[26px] font-bold text-tinta">
                  ¿Quieres que lo guardemos como{" "}
                  <span className="text-marca underline decoration-marca/40">&ldquo;Papelería La Moderna&rdquo;</span> de forma
                  preliminar?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-azul px-3 py-2 text-sm leading-5 font-bold text-white"
              >
                <Ico src={`${C}/check.svg`} w={10.867} h={8.017} />
                Sí, usar ese nombre
              </button>
              <button type="button" className="rounded-full bg-azul-50 px-3 py-2 text-sm leading-5 text-tinta">
                Editar
              </button>
            </div>
          </div>
        </div>

        {extra.map((m) =>
          m.de === "usuario" ? (
            <BurbujaUsuario key={m.id} texto={m.texto} />
          ) : (
            <p key={m.id} role="status" className="rounded-2xl bg-[#ffdad6] p-3 text-sm leading-5 font-semibold text-[#93000a]">
              {m.texto}
            </p>
          ),
        )}

        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-marca px-6 py-3 text-[19px] leading-6 font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <Ico src={`${C}/aplicar.svg`} w={18.083} h={18.083} />
            Aplicar al ticket
          </button>
          <p className="flex items-center gap-1 text-[11px] leading-[16.5px] text-tinta-suave/75">
            <Ico src={`${C}/info.svg`} w={10.833} h={10.833} />
            Estimación y asistencia no oficial SAT
          </p>
        </div>
      </div>

      {/* Encima de la barra inferior; mientras se escribe (foco dentro) baja y ocupa su lugar (ver globals.css). */}
      <form
        id="chat-entrada"
        onSubmit={onSubmit}
        className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[480px] items-center gap-1 bg-fondo/95 px-4 py-2 has-[:focus]:bottom-0 has-[:focus]:z-40 has-[:focus]:pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0px_-4px_16px_0px_rgba(0,15,42,0.06)] backdrop-blur-[24px]"
      >
        <button
          type="button"
          onClick={grabando ? grabadora.detener : grabadora.iniciar}
          disabled={ocupado}
          aria-pressed={grabando}
          aria-label={grabando ? "Detener grabación" : "Dictar por voz"}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
            grabando ? "animate-pulse bg-[#B3261E]" : "bg-azul-50"
          }`}
        >
          {grabando ? <span aria-hidden className="size-3.5 rounded-sm bg-white" /> : <Ico src={`${C}/microfono.svg`} w={14} h={19} />}
        </button>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          readOnly={grabando || transcribiendo}
          placeholder={
            grabando
              ? `Grabando… 0:${String(grabadora.segundos).padStart(2, "0")} · toca ■ para terminar`
              : transcribiendo
                ? "Convirtiendo tu voz en texto…"
                : grabadora.estado === "pidiendo"
                  ? "Pidiendo permiso del micrófono…"
                  : "Escribe tu respuesta o duda..."
          }
          aria-label="Mensaje para Bisie'"
          className="h-[50px] min-w-0 flex-1 rounded-full bg-white px-4 text-base text-tinta outline-none placeholder:text-tinta-suave/60 focus:ring-2 focus:ring-azul"
        />
        <button
          type="submit"
          aria-label="Enviar mensaje"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-marca drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <Ico src={`${C}/enviar.svg`} w={13.333} h={13.333} />
        </button>
      </form>
    </>
  );
}

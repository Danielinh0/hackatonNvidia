"use client";

import { startTransition, useActionState, useState, type ChangeEvent } from "react";
import { subirLote, type EstadoSubida } from "@/app/subir/acciones";
import { huella, recordarFoto } from "@/lib/fotos-locales";
import { Ico } from "./ui";

/*
 * Botones "Tomar foto" y "Elegir de la galería" (Figma 1:651) conectados a la subida real.
 * Antes de enviar calcula el sha256 de cada archivo para que el servidor compruebe
 * que llegó idéntico. El servidor lo analiza y NO guarda la imagen; la vista previa
 * queda solo en la memoria de este navegador (lib/fotos-locales.ts).
 * Si todo sale bien, el servidor redirige a /subir/recibido/[id].
 */
const S = "/figma/subir";
const MAX_BYTES = 10 * 1024 * 1024;
const inicial: EstadoSubida = { error: null, rechazados: [] };

export function FormularioSubida() {
  const [estado, enviar, enviando] = useActionState(subirLote, inicial);
  const [preparando, setPreparando] = useState(false);
  const [avisoLocal, setAvisoLocal] = useState<string | null>(null);
  const ocupado = preparando || enviando;

  async function alElegir(e: ChangeEvent<HTMLInputElement>, origen: "camara" | "archivo") {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite volver a elegir la misma foto
    if (archivos.length === 0) return;

    const grandes = archivos.filter((a) => a.size > MAX_BYTES);
    if (grandes.length === archivos.length) {
      setAvisoLocal("Imagen muy pesada, máximo 10 MB.");
      return;
    }
    setAvisoLocal(grandes.length ? `${grandes.length} archivo(s) pasan de 10 MB y no se enviaron.` : null);

    setPreparando(true);
    const fd = new FormData();
    fd.append("origen", origen);
    for (const a of archivos.filter((a) => a.size <= MAX_BYTES)) {
      // crypto.subtle solo existe en https o localhost; en http por red local va vacío
      // y el servidor marca la huella como "no verificada".
      const h = await huella(a);
      recordarFoto(a, h);
      fd.append("archivos", a);
      fd.append("tamano", String(a.size));
      fd.append("sha256", h);
    }
    setPreparando(false);
    startTransition(() => enviar(fd));
  }

  const tarjeta =
    "relative flex min-h-24 cursor-pointer flex-col items-center justify-center overflow-clip rounded-2xl bg-white px-2 py-4 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] has-disabled:cursor-wait has-disabled:opacity-60";

  return (
    <section className="flex flex-col gap-2 py-2">
      <div className="grid grid-cols-2 gap-3">
        <label className={tarjeta}>
          <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={ocupado} onChange={(e) => alElegir(e, "camara")} />
          <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-durazno shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
            <Ico src={`${S}/camara.svg`} w={23.333} h={21} />
          </span>
          <span className="text-base leading-5 font-semibold text-tinta">Tomar foto</span>
          <span className="pt-0.5 text-xs leading-4 font-bold text-tinta-suave">Cámara directa</span>
        </label>
        <label className={tarjeta}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            className="sr-only"
            disabled={ocupado}
            onChange={(e) => alElegir(e, "archivo")}
          />
          <span className="absolute top-2 right-2 rounded-full bg-azul-150 px-2 py-0.5 text-[10px] leading-[15px] font-bold text-[#001947]">
            Varias a la vez
          </span>
          <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-azul-150 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
            <Ico src={`${S}/galeria.svg`} w={23.333} h={23.333} />
          </span>
          <span className="text-base leading-5 font-semibold text-tinta">Elegir de la galería</span>
          <span className="pt-0.5 text-xs leading-4 font-bold text-tinta-suave">PDF o imágenes</span>
        </label>
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {ocupado && (
          <p role="status" className="flex items-center gap-2 rounded-2xl bg-lima px-4 py-3 text-sm leading-5 font-bold text-lima-tinta">
            <Ico src={`${S}/sync.svg`} w={10} h={10} className="animate-spin" />
            {preparando ? "Preparando tus fotos…" : "Leyendo tus tickets con IA…"}
          </p>
        )}
        {avisoLocal && !ocupado && (
          <p role="alert" className="rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm leading-5 font-semibold text-[#93000a]">
            {avisoLocal}
          </p>
        )}
        {estado.error && !ocupado && (
          <div role="alert" className="flex flex-col gap-1 rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm leading-5 text-[#93000a]">
            <p className="flex items-center gap-1.5 font-bold">
              <Ico src={`${S}/aviso.svg`} w={11.917} h={10.292} />
              {estado.error}
            </p>
            {estado.rechazados.map((r) => (
              <p key={r.nombre} className="text-xs leading-4">
                <b>{r.nombre}:</b> {r.motivo}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

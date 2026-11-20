"use client";

import { useState, useSyncExternalStore, type ChangeEvent } from "react";
import { buscarFoto, huella, recordarFoto, suscribir } from "@/lib/fotos-locales";

/*
 * Muestra la foto de un comprobante SOLO si este navegador todavía la tiene en memoria
 * (la persona la acaba de elegir o tomar). El servidor nunca la guardó.
 * Si ya no está (recargó, otro teléfono, la borró de su galería), se explica por qué no se ve
 * y, si venía de un archivo, se puede volver a elegir para verla: se compara su huella y no se sube.
 */
export function FotoLocal({
  sha256,
  nombre,
  tamano,
  tipo,
  origen,
}: {
  sha256: string;
  nombre: string;
  tamano: number;
  tipo: string;
  origen: "camara" | "archivo";
}) {
  const foto = useSyncExternalStore(
    suscribir,
    () => buscarFoto(sha256, nombre, tamano),
    () => null, // en el servidor nunca hay foto
  );
  const [aviso, setAviso] = useState<string | null>(null);

  async function volverAElegir(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const h = await huella(f);
    const coincide = h ? h === sha256 : f.name === nombre && f.size === tamano;
    if (coincide) {
      recordarFoto(f, h);
      setAviso(null);
    } else {
      setAviso("Ese archivo no es el mismo que se analizó.");
    }
  }

  if (foto) {
    return tipo === "application/pdf" ? (
      <a href={foto.url} target="_blank" rel="noopener" className="flex h-32 items-center justify-center rounded-2xl bg-azul-50 text-base font-bold text-azul">
        📄 Ver PDF (desde tu teléfono)
      </a>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={foto.url} alt={`Vista previa local: ${nombre}`} className="max-h-[360px] w-full rounded-2xl bg-azul-50 object-contain" />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-azul-50 px-4 py-5 text-center">
      <span aria-hidden className="text-3xl">🔒</span>
      <p className="text-sm leading-5 font-bold text-tinta">Por tu privacidad, Dzuun no guarda la foto</p>
      <p className="text-xs leading-4 font-semibold text-tinta-suave">
        Solo guardamos los datos que leímos. La imagen se queda en tu teléfono.
      </p>
      {origen === "archivo" && (
        <label className="mt-1 cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-bold text-azul shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={volverAElegir} />
          Volver a elegir el archivo para verlo
        </label>
      )}
      {aviso && (
        <p role="alert" className="text-xs font-bold text-[#93000a]">
          {aviso}
        </p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Ico } from "./ui";

/* Tarjetas de estados del sistema con filtro (Figma 1:2391 y 1:2410). */
const E = "/figma/estados";

type Accion = { texto: string; icono: [string, number, number]; estilo: "primario" | "secundario" | "azul" | "suave"; href?: string };
type Estado = {
  n: number;
  tipo: "advertencia" | "error";
  etiqueta: string;
  badge: [string, number, number];
  mini: [string, number, number];
  miniBg: string;
  titulo: string;
  cita: string;
  texto: string;
  pie: React.ReactNode;
  acciones: Accion[];
};

const estados: Estado[] = [
  {
    n: 1, tipo: "advertencia", etiqueta: "Advertencia de red",
    badge: [`${E}/b1.svg`, 16, 13.2], mini: [`${E}/m1.svg`, 10.5, 11.083], miniBg: "bg-[#fef3c7]",
    titulo: "Sin conexión a internet",
    cita: "Sin conexión: tus fotos se suben al volver la señal",
    texto: "Tus fotos se guardaron de forma segura en tu teléfono. No perderás ningún ticket.",
    pie: (
      <span className="flex items-center gap-1 text-xs leading-4 font-bold text-tinta-suave">
        <Ico src={`${E}/cola.svg`} w={13.333} h={10.667} />
        En cola local (offline)
      </span>
    ),
    acciones: [{ texto: "Reintentar conexión", icono: [`${E}/reintentar.svg`, 12, 12], estilo: "secundario" }],
  },
  {
    n: 2, tipo: "advertencia", etiqueta: "Lectura incompleta",
    badge: [`${E}/b2.svg`, 14.667, 10], mini: [`${E}/m2.svg`, 10.5, 10.5], miniBg: "bg-[#fef3c7]",
    titulo: "Lectura no concluyente",
    cita: "No pude leer esta foto: prueba con más luz y el ticket completo",
    texto: "Evita sombras sobre el papel y asegúrate de enfocar bien el importe total y la fecha.",
    pie: (
      <span className="flex items-center gap-1 rounded-md bg-lima px-2.5 py-1 text-[11px] leading-6 text-lima-tinta">
        <Ico src={`${E}/foco.svg`} w={8.75} h={11.667} />
        Tip de luz
      </span>
    ),
    acciones: [{ texto: "Tomar otra foto", icono: [`${E}/camara.svg`, 15, 13.5], estilo: "primario", href: "/subir" }],
  },
  {
    n: 3, tipo: "advertencia", etiqueta: "Datos pendientes",
    badge: [`${E}/b3.svg`, 12, 10.667], mini: [`${E}/m3.svg`, 11.083, 10.5], miniBg: "bg-[#fef3c7]",
    titulo: "Comprobante incompleto",
    cita: "Faltan datos: total y fecha",
    texto: "Identificamos el negocio pero necesitamos que verifiques el importe final y cuándo se pagó.",
    pie: (
      <span className="flex items-center gap-1.5 text-xs leading-6 text-tinta-suave">
        <span className="size-1.5 rounded-full bg-[#f59e0b]" />
        RFC detectado con éxito
      </span>
    ),
    acciones: [{ texto: "Completar datos", icono: [`${E}/completar.svg`, 13.5, 13.5], estilo: "azul", href: "/revision/detalle" }],
  },
  {
    n: 4, tipo: "error", etiqueta: "Error de servicio",
    badge: [`${E}/b4.svg`, 14.667, 13.2], mini: [`${E}/m4.svg`, 10.5, 10.5], miniBg: "bg-[#fee2e2]",
    titulo: "Interrupción en el motor de IA",
    cita: "El servidor de IA no responde",
    texto: "Estamos restableciendo la conexión con el modelo de lectura. Puedes esperar o ingresar los valores ahora.",
    pie: null,
    acciones: [
      { texto: "Capturar a mano", icono: [`${E}/teclado.svg`, 14.167, 9.917], estilo: "suave", href: "/revision/detalle" },
      { texto: "Reintentar", icono: [`${E}/reintentar-blanco.svg`, 11.333, 11.333], estilo: "primario" },
    ],
  },
  {
    n: 5, tipo: "advertencia", etiqueta: "Límite de asistencia",
    badge: [`${E}/b5.svg`, 11.333, 13.333], mini: [`${E}/m5.svg`, 11.09, 11.667], miniBg: "bg-lima",
    titulo: "Consulta fuera de mi alcance",
    cita: "Bisie' no sabe responder eso",
    texto:
      "Recuerda que Bisie' te orienta con tus tickets y cálculos estimados, pero no puede sustituir la opinión de tu contador o criterios específicos del SAT.",
    pie: (
      <span className="flex items-center gap-1 text-xs leading-4 font-bold text-azul">
        <Ico src={`${E}/criterio.svg`} w={13.333} h={12.667} />
        Criterio RESICO
      </span>
    ),
    acciones: [{ texto: "Reformular pregunta", icono: [`${E}/reformular.svg`, 15, 15], estilo: "secundario", href: "/chat" }],
  },
  {
    n: 6, tipo: "error", etiqueta: "Límite de tamaño",
    badge: [`${E}/b6.svg`, 13.333, 13.333], mini: [`${E}/m6.svg`, 11.667, 7.292], miniBg: "bg-[#fee2e2]",
    titulo: "Archivo excede el límite permitido",
    cita: "Imagen muy pesada, máximo 10 MB",
    texto: "Para agilizar la lectura de tus comprobantes, el archivo debe pesar menos de 10 MB.",
    pie: (
      <span className="flex items-center gap-1 text-xs leading-4 font-bold text-tinta-suave">
        <Ico src={`${E}/peso.svg`} w={14.667} h={12.667} />
        Límite máximo 10 MB
      </span>
    ),
    acciones: [{ texto: "Elegir otra imagen", icono: [`${E}/galeria.svg`, 13.5, 13.5], estilo: "primario", href: "/subir" }],
  },
];

const estiloAccion: Record<Accion["estilo"], string> = {
  primario: "bg-marca text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]",
  secundario: "bg-azul-50 text-azul",
  azul: "bg-azul text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]",
  suave: "bg-[#f1f3ff] text-tinta",
};

function BotonAccion({ a }: { a: Accion }) {
  const clase = `flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm leading-5 ${estiloAccion[a.estilo]}`;
  const contenido = (
    <>
      <Ico src={a.icono[0]} w={a.icono[1]} h={a.icono[2]} />
      {a.texto}
    </>
  );
  return a.href ? (
    <Link href={a.href} className={clase}>
      {contenido}
    </Link>
  ) : (
    <button type="button" className={clase}>
      {contenido}
    </button>
  );
}

function Tarjeta({ e }: { e: Estado }) {
  const error = e.tipo === "error";
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-4 drop-shadow-[0px_4px_8px_rgba(11,27,54,0.06)]">
      <div className="flex items-start justify-between">
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs leading-4 font-bold uppercase ${
            error ? "bg-[#fef2f2] text-error" : "bg-[#fffbeb] text-[#92400e]"
          }`}
        >
          <Ico src={e.badge[0]} w={e.badge[1]} h={e.badge[2]} />
          {e.etiqueta}
        </span>
        <span className="flex items-center gap-1.5 text-xs leading-4 font-bold text-tinta-suave">
          <span className={`size-2 rounded-full ${error ? "bg-error" : "bg-[#f59e0b]"}`} />
          Estado {String(e.n).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-start gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-clip rounded-2xl bg-[#f1f3ff]">
          {/* Ilustración contextual de Bisie' pendiente en Figma */}
          <span className="size-16 rounded-full bg-azul-150/60" />
          <span className={`absolute right-1 bottom-1 flex size-6 items-center justify-center rounded-full ${e.miniBg}`}>
            <Ico src={e.mini[0]} w={e.mini[1]} h={e.mini[2]} />
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-[19px] leading-[23.75px] font-bold text-tinta">{e.titulo}</h3>
          <p
            className={`rounded-[32px] px-2.5 py-1 text-[13px] leading-[17.88px] ${
              error ? "bg-[rgba(255,218,214,0.4)] text-[#93000a]" : "bg-[#f1f3ff] text-tinta"
            }`}
          >
            &ldquo;{e.cita}&rdquo;
          </p>
          <p className="pt-1 text-base leading-[26px] text-tinta-suave">{e.texto}</p>
        </div>
      </div>
      <div className={`flex items-center gap-2.5 pt-2 ${e.pie ? "justify-between" : "justify-end"}`}>
        {e.pie}
        <div className="flex gap-2.5">
          {e.acciones.map((a) => (
            <BotonAccion key={a.texto} a={a} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function CatalogoEstados() {
  const [filtro, setFiltro] = useState<"todos" | "advertencia" | "error">("todos");
  const visibles = estados.filter((e) => filtro === "todos" || e.tipo === filtro);
  const tabs = [
    { id: "todos" as const, label: "Todos", punto: null, n: estados.length },
    { id: "advertencia" as const, label: "Advertencias", punto: "bg-[#f59e0b]", n: estados.filter((e) => e.tipo === "advertencia").length },
    { id: "error" as const, label: "Errores y fallas", punto: "bg-error", n: estados.filter((e) => e.tipo === "error").length },
  ];

  return (
    <>
      <div role="tablist" aria-label="Filtrar estados" className="flex gap-1 overflow-x-auto rounded-2xl bg-[#f1f3ff] p-1.5 [scrollbar-width:none]">
        {tabs.map((t) => {
          const activo = filtro === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={activo}
              onClick={() => setFiltro(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-[48px] px-3.5 py-2 text-sm leading-5 font-semibold ${
                activo ? "bg-white text-tinta drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]" : "text-tinta-suave"
              }`}
            >
              {t.punto && <span className={`size-2 rounded-full ${t.punto}`} />}
              {t.label}
              <span className="rounded-full bg-azul-50 px-1.5 text-[11px] leading-5 font-bold text-tinta-suave">{t.n}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-6">
        {visibles.map((e) => (
          <Tarjeta key={e.n} e={e} />
        ))}
      </div>
    </>
  );
}

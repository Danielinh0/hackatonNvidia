"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Ico } from "./ui";

/* Búsqueda y filtros de Operaciones (Figma 1:1425). Filtra en el cliente sobre los datos que manda el servidor (SQLite). */
const O = "/figma/operaciones";

export type Operacion = {
  id: string;
  grupo: string;
  emisor: string;
  detalle: string;
  monto: number | null; // centavos con signo (venta +, compra -); null si no se leyó
  tipo: "gasto" | "ingreso" | "spei" | "otro";
  tieneCfdi: boolean;
  conf: number | null;
  porRevisar?: boolean;
  simulado?: boolean;
  href: string;
  icono: { src: string; w: number; h: number; bg: string };
};

type Filtro = "todos" | "gasto" | "ingreso" | "spei" | "revisar";

const fmt = (centavos: number | null, conSigno: boolean) => {
  if (centavos === null) return "—";
  const t = `$${(Math.abs(centavos) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return conSigno ? `${centavos >= 0 ? "+" : "-"}${t}` : t;
};

function Fila({ op }: { op: Operacion }) {
  const ingreso = op.tipo === "ingreso";
  const media = op.conf !== null && op.conf < 0.85;
  return (
    <Link href={op.href} className="flex flex-col gap-2 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${op.icono.bg}`}>
            <Ico src={op.icono.src} w={op.icono.w} h={op.icono.h} />
          </span>
          <div className="flex min-w-0 flex-col">
            <h3 className="truncate text-base leading-6 font-semibold text-tinta">{op.emisor}</h3>
            <p className="truncate text-xs leading-4 font-bold text-tinta-suave">{op.detalle}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <p className={`text-[19px] leading-6 font-bold ${ingreso ? "text-oliva" : "text-tinta"}`}>{fmt(op.monto, op.tipo === "ingreso" || op.tipo === "gasto")}</p>
          <p className={`text-[11px] leading-[16.5px] ${ingreso ? "font-semibold text-oliva" : "text-tinta-suave"}`}>MXN</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs leading-4">
          {op.tieneCfdi ? (
            <span className="flex items-center gap-1 rounded-full bg-lima/40 px-2.5 py-0.5 font-bold text-lima-tinta">
              <Ico src={`${O}/con-cfdi.svg`} w={12.833} h={12.25} />
              Con CFDI
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-azul-150 px-2.5 py-0.5 font-semibold text-[#001947]">
              <Ico src={`${O}/sin-cfdi.svg`} w={10.5} h={11.667} />
              Sin CFDI
            </span>
          )}
          {op.simulado && <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 font-bold text-[#92400e]">SIMULADO</span>}
          {op.porRevisar ? (
            <span className="flex items-center gap-1 rounded-full bg-durazno px-2.5 py-0.5 font-bold text-[#400100]">
              <Ico src={`${O}/campana.svg`} w={9.333} h={11.667} />
              Por revisar
            </span>
          ) : op.conf === null ? null : (
            <span className="flex items-center gap-1 rounded-full bg-azul-50 px-2 py-0.5 font-bold text-tinta-suave">
              <span className={`size-1.5 rounded-full ${media ? "bg-azul" : "bg-oliva-viva"}`} />
              {media ? "Media" : "Alta"} ({Math.round(op.conf * 100)}%)
            </span>
          )}
        </div>
        {op.porRevisar ? (
          <Ico src={`${O}/alerta.svg`} w={18.333} h={15.833} />
        ) : (
          <Ico src={`${O}/chevron.svg`} w={6.167} h={10} />
        )}
      </div>
    </Link>
  );
}

export function ListaOperaciones({ operaciones, resumen }: { operaciones: Operacion[]; resumen?: ReactNode }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const conteo = useMemo(
    () => ({
      todos: operaciones.length,
      gasto: operaciones.filter((o) => o.tipo === "gasto").length,
      ingreso: operaciones.filter((o) => o.tipo === "ingreso").length,
      spei: operaciones.filter((o) => o.tipo === "spei").length,
      revisar: operaciones.filter((o) => o.porRevisar).length,
    }),
    [operaciones],
  );

  const visibles = operaciones.filter((o) => {
    if (filtro === "revisar" ? !o.porRevisar : filtro !== "todos" && o.tipo !== filtro) return false;
    const t = q.trim().toLowerCase();
    return !t || `${o.emisor} ${o.detalle}`.toLowerCase().includes(t);
  });

  const grupos = visibles.reduce<Record<string, Operacion[]>>((acc, o) => {
    (acc[o.grupo] ??= []).push(o);
    return acc;
  }, {});

  const chips: { id: Filtro; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "gasto", label: "Gastos" },
    { id: "ingreso", label: "Ingresos" },
    { id: "spei", label: "Pagos" },
    { id: "revisar", label: "Por revisar" },
  ];

  return (
    <>
      <div className="relative pt-1">
        <Ico src={`${O}/buscar.svg`} w={16.5} h={16.5} className="pointer-events-none absolute top-[19px] left-3.5" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por emisor, concepto o RFC..."
          aria-label="Buscar operaciones"
          className="h-[52px] w-full rounded-full bg-white pr-4 pl-11 text-base text-tinta shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none placeholder:text-tinta-suave/70 focus:ring-2 focus:ring-azul"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]" role="tablist" aria-label="Filtrar">
        {chips.map((c) => {
          const activo = filtro === c.id;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={activo}
              onClick={() => setFiltro(c.id)}
              className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm leading-5 font-semibold ${
                activo ? "bg-tinta text-fondo" : "bg-azul-50 text-tinta"
              }`}
            >
              {c.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs leading-4 font-bold ${
                  activo
                    ? "bg-fondo/20 text-fondo"
                    : c.id === "revisar"
                      ? "bg-marca px-2 text-white drop-shadow-[0px_0px_4px_rgba(186,11,0,0.35)]"
                      : "bg-azul-200 text-tinta-suave"
                }`}
              >
                {conteo[c.id]}
              </span>
            </button>
          );
        })}
      </div>

      {resumen}

      <section className="flex flex-col gap-6" aria-live="polite">
        {Object.keys(grupos).length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm leading-5 font-semibold text-tinta-suave">
            {operaciones.length === 0 ? "Aún no tienes operaciones. Sube tus tickets para empezar." : "No hay operaciones con ese filtro."}
          </p>
        )}
        {Object.entries(grupos).map(([grupo, ops]) => (
          <div key={grupo} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm leading-5 font-bold tracking-[0.35px] text-tinta-suave uppercase">{grupo}</h2>
              <span className="text-xs leading-4 font-bold text-tinta-suave">
                {ops.length} {ops.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {ops.map((o) => (
              <Fila key={o.id} op={o} />
            ))}
          </div>
        ))}
      </section>
    </>
  );
}

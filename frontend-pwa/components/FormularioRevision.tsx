"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { confirmar, descartar, type EstadoRevision } from "@/app/revision/acciones";
import type { CampoRevision, Clasificacion, ComprobanteRevision } from "@/lib/operaciones";
import { rutaChat } from "@/lib/rutas";
import { etiquetaSimulado } from "@/lib/simulado";
import { BotonVoz } from "./BotonVoz";
import { ChipConfianza } from "./Confianza";
import { FotoLocal } from "./FotoLocal";
import { Ico, MascotaBisie } from "./ui";

/*
 * Revisión de un comprobante (pantallas 5 y 6). Mismos datos, dos vistas (CLAUDE.md sec. 15):
 *  - sencillo: un ticket a la vez, texto grande, Bisie' lo lee en voz alta.
 *  - detalle: todos los campos del CFDI y los conceptos.
 * "Confirmar" queda bloqueado mientras falte el total, la fecha o el tipo de movimiento.
 */
const S = "/figma/sencillo";
const inicial: EstadoRevision = { errores: {}, error: null };

type Def = { campo: CampoRevision; etiqueta: string; placeholder: string; tipo?: "dinero" | "fecha" | "rfc" };

const CAMPOS_SENCILLO: Def[] = [
  { campo: "Emisor.Nombre", etiqueta: "¿Quién cobró?", placeholder: "Ej. Abarrotes López" },
  { campo: "Total", etiqueta: "¿Cuánto fue en total?", placeholder: "Ej. 245.00", tipo: "dinero" },
  { campo: "Fecha", etiqueta: "¿Cuándo se pagó?", placeholder: "", tipo: "fecha" },
];

const CAMPOS_DETALLE: Def[] = [
  { campo: "Emisor.Nombre", etiqueta: "Nombre del emisor", placeholder: "Ej. Abarrotes López" },
  { campo: "Emisor.Rfc", etiqueta: "RFC del emisor", placeholder: "Ej. LOPA820412HR1", tipo: "rfc" },
  { campo: "Receptor.Nombre", etiqueta: "Nombre del receptor", placeholder: "Ej. Tlayudas Doña Mari" },
  { campo: "Receptor.Rfc", etiqueta: "RFC del receptor", placeholder: "Ej. MARI880415HR9", tipo: "rfc" },
  { campo: "Fecha", etiqueta: "Fecha de emisión", placeholder: "", tipo: "fecha" },
  { campo: "Serie", etiqueta: "Serie", placeholder: "Ej. A" },
  { campo: "Folio", etiqueta: "Folio", placeholder: "Ej. 1084" },
  { campo: "SubTotal", etiqueta: "Subtotal", placeholder: "Ej. 211.21", tipo: "dinero" },
  { campo: "Impuestos.TotalImpuestosTrasladados", etiqueta: "IVA trasladado", placeholder: "Ej. 33.79", tipo: "dinero" },
  { campo: "Total", etiqueta: "Total", placeholder: "Ej. 245.00", tipo: "dinero" },
  { campo: "FormaPago", etiqueta: "Forma de pago (clave SAT)", placeholder: "Ej. 01 efectivo, 03 transferencia" },
  { campo: "MetodoPago", etiqueta: "Método de pago", placeholder: "PUE o PPD" },
];

const TIPOS: { id: Clasificacion; titulo: string; nota: string }[] = [
  { id: "egreso", titulo: "Compra o gasto", nota: "Le pagaste a alguien" },
  { id: "ingreso", titulo: "Venta", nota: "Alguien te pagó a ti" },
  { id: "pago", titulo: "Pago o transferencia", nota: "SPEI, CoDi o depósito" },
];

const OBLIGATORIOS: CampoRevision[] = ["Total", "Fecha"];

const dineroTexto = (v: string) => (/^\d+(\.\d+)?$/.test(v) ? `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : v);
const fechaTexto = (v: string) =>
  /^\d{4}-\d{2}-\d{2}/.test(v)
    ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${v.slice(0, 10)}T12:00:00Z`))
    : v;

export function FormularioRevision({
  c,
  modo,
  posicion,
}: {
  c: ComprobanteRevision;
  modo: "sencillo" | "detalle";
  posicion: { n: number; total: number } | null;
}) {
  const [estado, enviar, enviando] = useActionState(confirmar, inicial);
  const defs = modo === "sencillo" ? CAMPOS_SENCILLO : CAMPOS_DETALLE;
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(defs.map((d) => [d.campo, c.valores[d.campo] ?? ""])),
  );
  const [clasificacion, setClasificacion] = useState<Clasificacion | null>(c.clasificacion);

  const faltan = [
    ...OBLIGATORIOS.filter((k) => !valores[k]?.trim()).map((k) => (k === "Total" ? "el total" : "la fecha")),
    ...(clasificacion ? [] : ["el tipo de movimiento"]),
  ];
  const confirmado = c.estado === "confirmado";
  const quien = valores["Emisor.Nombre"]?.trim();
  const total = valores.Total?.trim();
  const fecha = valores.Fecha?.trim();
  const voz = [
    "Este ticket",
    quien ? `es de ${quien}` : "no tiene claro quién cobró",
    total ? `por ${dineroTexto(total)} pesos` : "y no se leyó el total",
    fecha ? `del ${fechaTexto(fecha)}` : "y no se leyó la fecha",
  ].join(" ") + (faltan.length ? `. Me falta ${faltan.join(" y ")}.` : ". ¿Es correcto?");

  const otroModo = modo === "sencillo" ? "detalle" : "sencillo";

  return (
    <>
      {/* Progreso y modo */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="flex items-center gap-1 rounded-full bg-azul-50 px-4 py-1 text-sm leading-5 font-extrabold tracking-[0.35px] text-tinta">
          <Ico src={`${S}/ticket.svg`} w={16.708} h={18.417} />
          {confirmado ? "Confirmado" : posicion ? `Ticket ${posicion.n} de ${posicion.total}` : "Ticket"}
        </p>
        <div className="flex items-center rounded-full bg-azul-100 p-1 text-sm">
          {(["sencillo", "detalle"] as const).map((m) =>
            m === modo ? (
              <span key={m} className="flex items-center gap-1 rounded-full bg-tinta px-3 py-1.5 font-bold text-white">
                {m === "sencillo" && <Ico src={`${S}/ojo.svg`} w={14.667} h={10} />}
                {m === "sencillo" ? "Sencillo" : "Detallado"}
              </span>
            ) : (
              <Link key={m} href={`/revision/${otroModo}?id=${c.id}`} className="px-3 py-1.5 font-semibold text-tinta-suave">
                {m === "sencillo" ? "Sencillo" : "Detallado"}
              </Link>
            ),
          )}
        </div>
      </div>

      {/* Foto (solo si sigue en este teléfono) */}
      <section className="flex flex-col gap-3 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <FotoLocal sha256={c.sha256} nombre={c.nombre_archivo} tamano={c.tamano_bytes} tipo={c.tipo_mime} origen={c.origen} />
        <div className="flex flex-wrap items-center gap-1.5 text-xs leading-4 font-bold">
          <span className="truncate text-tinta-suave">{c.nombre_archivo}</span>
          {c.conf_global !== null && <ChipConfianza conf={c.conf_global} />}
          {c.analisis_simulado === 1 && <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[#92400e]">{etiquetaSimulado(c.simulado_partes)}</span>}
          <span className={`rounded-full px-2.5 py-0.5 ${c.uuid_cfdi ? "bg-lima/40 text-lima-tinta" : "bg-azul-100 text-tinta-suave"}`}>
            {c.uuid_cfdi ? "Con CFDI (indicio)" : "Sin CFDI detectado"}
          </span>
        </div>
      </section>

      {/* Bisie' */}
      {modo === "sencillo" && (
        <section className="flex items-start gap-2 rounded-[32px] bg-noche p-4">
          <div className="flex shrink-0 flex-col items-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white p-1">
              <MascotaBisie size={56} fondo="bg-white" />
            </span>
            <span className="mt-1 rounded-full bg-lima px-2 py-0.5 text-[10px] leading-[15px] font-extrabold tracking-[0.5px] text-lima-tinta uppercase">
              Bisie&apos;
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p aria-live="polite" className="rounded-tl-[2px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-lima-neon p-3.5 text-[17px] leading-[23.38px] font-bold text-noche-profunda">
              &ldquo;{voz}&rdquo;
            </p>
            <BotonVoz texto={voz} />
            <Link
              href={rutaChat(`/revision/${modo}?id=${c.id}`)}
              className="self-start rounded-full bg-white/10 px-3 py-1.5 text-sm leading-5 font-bold text-white underline-offset-2 hover:underline"
            >
              ¿Dudas? Pregúntale a Bisie&apos;
            </Link>
          </div>
        </section>
      )}

      <form action={enviar} className="flex flex-col gap-2" noValidate>
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="modo" value={modo} />

        {defs.map((d) => (
          <Campo
            key={d.campo}
            def={d}
            grande={modo === "sencillo"}
            valor={valores[d.campo] ?? ""}
            onChange={(v) => setValores((x) => ({ ...x, [d.campo]: v }))}
            falta={(c.faltantes.includes(d.campo) || OBLIGATORIOS.includes(d.campo)) && !valores[d.campo]?.trim()}
            error={estado.errores[d.campo]}
            moneda={c.moneda}
          />
        ))}

        {/* Tipo de movimiento */}
        <fieldset className="flex flex-col gap-2 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <legend className="contents">
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-base leading-6 font-bold tracking-[0.4px] text-azul uppercase">
                <Ico src={`${S}/tipo.svg`} w={14.25} h={15} />
                ¿Qué tipo de movimiento es?
              </span>
              {!clasificacion && <Falta />}
            </span>
          </legend>
          {c.clasificacion && !confirmado && (
            <p className="text-xs font-semibold text-tinta-suave">Bisie&apos; lo propone según el RFC de tu negocio. Cámbialo si no es así.</p>
          )}
          <div className="grid gap-2">
            {TIPOS.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl p-3 has-focus-visible:ring-2 has-focus-visible:ring-azul ${
                  clasificacion === t.id ? "bg-[#f1f3ff] ring-2 ring-azul" : "bg-fondo"
                }`}
              >
                <input type="radio" name="clasificacion" value={t.id} checked={clasificacion === t.id} onChange={() => setClasificacion(t.id)} className="sr-only" />
                <span>
                  <span className={`block font-extrabold text-tinta ${modo === "sencillo" ? "text-[20px] leading-7" : "text-base"}`}>{t.titulo}</span>
                  <span className="text-sm text-tinta-suave">{t.nota}</span>
                </span>
                <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-full ${clasificacion === t.id ? "bg-azul text-white" : "border-2 border-azul-200 bg-white"}`}>
                  {clasificacion === t.id && "✓"}
                </span>
              </label>
            ))}
          </div>
          {estado.errores.clasificacion && <p className="text-sm font-bold text-error">{estado.errores.clasificacion}</p>}
        </fieldset>

        {modo === "detalle" && c.conceptos.length > 0 && (
          <section className="flex flex-col gap-2 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-sm font-bold tracking-[0.4px] text-azul uppercase">Conceptos leídos</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-tinta-suave">
                <tr>
                  <th className="pb-1 font-bold">Descripción</th>
                  <th className="pb-1 text-right font-bold">Cant.</th>
                  <th className="pb-1 text-right font-bold">Importe</th>
                </tr>
              </thead>
              <tbody>
                {c.conceptos.map((k, i) => (
                  <tr key={i} className="border-t border-azul-100">
                    <td className="py-1.5 pr-2 font-semibold text-tinta">{k.descripcion ?? "—"}</td>
                    <td className="py-1.5 text-right text-tinta-suave">{k.cantidad ?? "—"}</td>
                    <td className="py-1.5 text-right font-semibold text-tinta">{k.importe ? dineroTexto(k.importe) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-tinta-suave">Los conceptos todavía no se pueden editar aquí.</p>
          </section>
        )}

        <p className="flex items-center justify-center gap-1.5 rounded-[32px] bg-azul-50 p-3 text-center text-sm leading-5 font-bold text-tinta-suave">
          <Ico src={`${S}/balanza.svg`} w={13.5} h={14.25} />
          Estimación, no es una determinación oficial del SAT
        </p>

        {estado.error && (
          <p role="alert" className="rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">{estado.error}</p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            disabled={faltan.length > 0 || enviando}
            className="flex min-h-[62px] items-center justify-center gap-3 rounded-full bg-[#1e8e4e] px-6 text-[21px] leading-8 font-extrabold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] disabled:bg-azul-200 disabled:text-tinta-suave disabled:shadow-none"
          >
            {enviando ? "Guardando…" : confirmado ? "Guardar cambios ✓" : "Sí, es correcto ✓"}
          </button>
          {faltan.length > 0 && (
            <p aria-live="polite" className="text-center text-sm font-bold text-tinta-suave">
              Para confirmar falta {faltan.join(", ")}.
            </p>
          )}
        </div>
      </form>

      {!confirmado && (
        <form action={descartar} className="flex justify-center">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="modo" value={modo} />
          <button className="flex min-h-11 items-center gap-1 px-4 text-base leading-6 font-bold text-error">
            <Ico src={`${S}/basura.svg`} w={12} h={13.5} />
            Descartar este ticket
          </button>
        </form>
      )}
    </>
  );
}

function Falta() {
  return <span className="shrink-0 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-xs font-extrabold text-[#92400e]">Falta</span>;
}

function Campo({
  def,
  grande,
  valor,
  onChange,
  falta,
  error,
  moneda,
}: {
  def: Def;
  grande: boolean;
  valor: string;
  onChange: (v: string) => void;
  falta: boolean;
  error?: string;
  moneda: string | null;
}) {
  const id = `campo-${def.campo.replace(/\W/g, "-")}`;
  const clase = `w-full rounded-2xl bg-fondo px-3 font-extrabold text-tinta outline-none placeholder:font-medium placeholder:text-tinta-suave/50 focus:ring-2 focus:ring-azul aria-invalid:ring-2 aria-invalid:ring-error ${
    grande ? "h-14 text-[22px]" : "h-11 text-base"
  }`;
  let control: ReactNode;
  if (def.tipo === "fecha") {
    // El input de fecha usa AAAA-MM-DD; si el documento traía hora y el día no cambia, se conserva.
    control = (
      <>
        <input
          id={id}
          type="date"
          value={valor.slice(0, 10)}
          onChange={(e) => onChange(e.target.value && e.target.value === valor.slice(0, 10) ? valor : e.target.value)}
          aria-invalid={!!error || undefined}
          className={clase}
        />
        <input type="hidden" name={def.campo} value={valor} />
      </>
    );
  } else {
    control = (
      <div className="relative">
        {def.tipo === "dinero" && <span className={`absolute top-1/2 left-3 -translate-y-1/2 font-extrabold text-tinta-suave ${grande ? "text-[22px]" : ""}`}>$</span>}
        <input
          id={id}
          name={def.campo}
          value={valor}
          onChange={(e) => onChange(def.tipo === "rfc" ? e.target.value.toUpperCase().replace(/\s/g, "") : def.tipo === "dinero" ? e.target.value.replace(/[^\d.]/g, "") : e.target.value)}
          placeholder={def.placeholder}
          inputMode={def.tipo === "dinero" ? "decimal" : undefined}
          autoCapitalize={def.tipo === "rfc" ? "characters" : undefined}
          maxLength={def.tipo === "rfc" ? 13 : 200}
          aria-invalid={!!error || undefined}
          className={`${clase} ${def.tipo === "dinero" ? (grande ? "pl-8" : "pl-6") : ""} ${def.tipo === "dinero" && moneda ? "pr-14" : ""}`}
        />
        {def.tipo === "dinero" && moneda && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-bold text-tinta-suave">{moneda}</span>
        )}
      </div>
    );
  }
  return (
    <section className="flex flex-col gap-1.5 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className={`font-bold tracking-[0.4px] text-azul uppercase ${grande ? "text-base" : "text-xs"}`}>
          {def.etiqueta}
        </label>
        {falta && <Falta />}
      </div>
      {control}
      {error && <p className="text-sm font-bold text-error">{error}</p>}
    </section>
  );
}

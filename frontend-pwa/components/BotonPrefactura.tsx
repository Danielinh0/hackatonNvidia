"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { generarPrefactura, type EstadoPrefactura } from "@/app/facturas/acciones";
import { FORMA_PAGO } from "@/lib/cfdi/catalogos";
import type { Bloqueo, FacturaGuardada } from "@/lib/prefactura";

/*
 * Pre-factura de un comprobante en /subir/recibido/[id]. Llama a la API REST /api/cfdi (vía la acción
 * del servidor), guarda el PDF y el XML en SQLite y deja verlos o descargarlos.
 * Con CFDI_PROVIDER=mock todo es SIMULADO (sin validez fiscal) y así se rotula.
 */
type Props = {
  comprobanteId: string;
  loteId?: string;
  /** En listas (Operaciones): muestra solo un botón y el formulario se despliega al tocarlo. */
  compacto?: boolean;
  bloqueo: Bloqueo | null;
  factura: FacturaGuardada | null;
  cpSugerido: string | null;
  formaPagoSugerida: string | null;
};

const FORMAS = ["01", "03", "04", "28", "05", "06", "02", "99"].map((k) => [k, FORMA_PAGO[k]] as const);

function Descargas({ f }: { f: FacturaGuardada }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-azul-50 p-3">
      <p className="flex flex-wrap items-center gap-1.5 text-sm leading-5 font-bold text-tinta">
        Pre-factura {f.serie}
        {f.folio} guardada
        {f.simulado === 1 && <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-xs text-[#92400e]">SIMULADO · sin validez fiscal</span>}
      </p>
      <p className="text-xs leading-4 break-all text-tinta-suave">UUID {f.uuid}</p>
      <div className="flex gap-2">
        <a href={`/facturas/${f.id}/pdf`} target="_blank" rel="noopener noreferrer"
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-azul text-sm font-bold text-white">
          Ver PDF
        </a>
        <a href={`/facturas/${f.id}/xml?descargar=1`}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-white text-sm font-bold text-azul">
          Descargar XML
        </a>
      </div>
    </div>
  );
}

/** Etiqueta de estado (color + icono + palabra, CLAUDE.md sec. 22): la pre-factura ya se puede generar. */
function Disponible() {
  return (
    <p role="status" className="flex items-center gap-1.5 self-start rounded-full bg-[#1e8e4e] px-3 py-1 text-xs leading-4 font-bold text-white">
      <span aria-hidden>✓</span> Factura disponible
    </p>
  );
}

/** Etiqueta de lo que falta para facturar, con el enlace a la pantalla donde se completa. */
function Faltantes({ bloqueo, comprobanteId }: { bloqueo: Bloqueo; comprobanteId: string }) {
  const revisar = bloqueo.faltan.some((f) => f.accion === "revisar");
  const configurar = bloqueo.faltan.some((f) => f.accion === "configurar");
  return (
    <div role="status" className="flex flex-col gap-2 rounded-2xl bg-[#fef3c7] p-3 text-xs leading-4 text-[#92400e]">
      <p className="flex items-center gap-1.5 font-bold">
        <span aria-hidden className="flex size-4 items-center justify-center rounded-full bg-[#f2a900] text-[10px] text-tinta">!</span>
        Para facturar falta:
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {bloqueo.faltan.map((f) => (
          <li key={f.dato} className="rounded-full bg-white px-2.5 py-0.5 font-bold text-tinta">{f.dato}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {revisar && <Link href={`/revision/sencillo?id=${comprobanteId}`} className="font-bold text-azul underline">Revisar este ticket</Link>}
        {configurar && <Link href="/configurar" className="font-bold text-azul underline">Configurar mi negocio</Link>}
      </div>
    </div>
  );
}

export function BotonPrefactura({ comprobanteId, loteId, compacto = false, bloqueo, factura, cpSugerido, formaPagoSugerida }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoPrefactura, FormData>(generarPrefactura, { errores: [], factura });
  const [abierto, setAbierto] = useState(!compacto);

  if (estado.factura) return <Descargas f={estado.factura} />;

  if (bloqueo?.noAplica) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-fondo p-3 text-xs leading-4 text-tinta-suave">
        <p><b className="text-tinta">Pre-factura (SIMULADO):</b> {bloqueo.motivo}</p>
        {bloqueo.accion === "revisar" && (
          <Link href={`/revision/sencillo?id=${comprobanteId}`} className="font-bold text-azul underline">Revisar este ticket</Link>
        )}
      </div>
    );
  }

  if (bloqueo) return <Faltantes bloqueo={bloqueo} comprobanteId={comprobanteId} />;

  if (!abierto) {
    return (
      <div className="flex flex-col gap-2">
        <Disponible />
        <button type="button" onClick={() => setAbierto(true)}
          className="flex h-11 items-center justify-center rounded-full bg-azul-50 text-sm font-bold text-azul">
          Generar pre-factura PDF (SIMULADO)
        </button>
      </div>
    );
  }

  const forma = formaPagoSugerida && formaPagoSugerida in FORMA_PAGO ? formaPagoSugerida : "";
  return (
    <form action={accion} className="flex flex-col gap-2 rounded-2xl bg-fondo p-3">
      <Disponible />
      <input type="hidden" name="comprobante" value={comprobanteId} />
      {loteId && <input type="hidden" name="lote" value={loteId} />}
      <p className="text-xs leading-4 text-tinta-suave">
        Se factura a <b>público en general</b> con el subtotal, IVA y total que revisaste. Es una <b>pre-factura SIMULADA</b>: no se envía al SAT.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold tracking-[0.4px] text-tinta-suave uppercase">
          C.P. de tu negocio
          <input name="cp" inputMode="numeric" pattern="\d{5}" maxLength={5} required defaultValue={cpSugerido ?? ""}
            placeholder="Ej. 68000" className="h-11 rounded-xl border border-tinta-suave/30 bg-white px-3 text-base font-semibold text-tinta normal-case" />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold tracking-[0.4px] text-tinta-suave uppercase">
          Forma de pago
          <select name="formaPago" required defaultValue={forma}
            className="h-11 rounded-xl border border-tinta-suave/30 bg-white px-2 text-sm font-semibold text-tinta normal-case">
            <option value="" disabled>Elige…</option>
            {FORMAS.map(([k, n]) => <option key={k} value={k}>{k} · {n}</option>)}
          </select>
        </label>
      </div>
      {estado.errores.length > 0 && (
        <div role="alert" className="flex flex-col gap-0.5 rounded-xl bg-[#ffdad6] px-3 py-2 text-xs leading-4 text-[#93000a]">
          {estado.errores.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}
      <button type="submit" disabled={enviando} aria-busy={enviando}
        className="flex h-12 items-center justify-center rounded-full bg-azul text-base font-bold text-white disabled:opacity-60">
        {enviando ? "Generando pre-factura…" : "Generar pre-factura PDF (SIMULADO)"}
      </button>
    </form>
  );
}

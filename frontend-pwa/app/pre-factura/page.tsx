import Link from "next/link";
import { Ico, MascotaBisie } from "@/components/ui";

/*
 * Pantalla 10 · Pre-factura CFDI 4.0 — SIMULADO (Figma 1:2158).
 * Nada se envía al SAT ni a un PAC. UUID, QR y sello son de muestra.
 * Cambio respecto al boceto: el emisor era "S.A. de C.V." con régimen 626, que es
 * de persona física; se usa el negocio de ejemplo de Configuración (Tlayudas Doña Mari).
 */
const P = "/figma/prefactura";

function Paso({ ok, titulo, estado }: { ok: boolean; titulo: string; estado: React.ReactNode }) {
  return (
    <li className={`relative flex flex-col items-center gap-1 ${ok ? "" : "opacity-75"}`}>
      <span className={`flex size-8 items-center justify-center rounded-full ${ok ? "bg-oliva-viva" : "bg-azul-50"}`}>
        {ok ? <Ico src={`${P}/check.svg`} w={12.225} h={9.019} /> : <Ico src={`${P}/nube-off.svg`} w={16.5} h={14.85} />}
      </span>
      <span className={`text-center text-xs leading-4 font-bold ${ok ? "text-tinta" : "text-tinta-suave"}`}>{titulo}</span>
      {estado}
    </li>
  );
}

export default function PreFactura() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 mx-auto max-w-[480px] bg-fondo/90 shadow-[0px_1px_8px_0px_rgba(0,0,0,0.04)] backdrop-blur-[24px]">
        <div className="flex h-16 items-center justify-between px-2">
          <div className="flex items-center gap-1">
            <Link href="/operaciones" aria-label="Regresar" className="flex size-11 items-center justify-center rounded-full">
              <Ico src="/figma/chat/atras.svg" w={11.775} h={20} />
            </Link>
            <div>
              <p className="text-[19px] leading-[23.75px] font-bold text-tinta">Pre-factura</p>
              <p className="text-xs leading-4 font-bold text-azul">Ticket #0842</p>
            </div>
          </div>
          <button aria-label="Ayuda y opciones" className="flex size-11 items-center justify-center rounded-full">
            <Ico src="/figma/chat/ayuda.svg" w={20} h={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-fondo pt-16 pb-8">
        <div className="flex flex-col gap-1 px-4 pt-2 pb-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1">
              <span className="rounded-full bg-marca px-2.5 py-0.5 text-xs leading-4 font-bold tracking-[0.6px] text-white">SIMULADO</span>
              <span className="text-sm leading-5 font-bold text-azul">CFDI 4.0</span>
            </p>
            <span className="rounded-md bg-azul-100 px-2 py-0.5 text-xs leading-4 font-bold text-tinta-suave">Pre-folio #DZ-2024-0089</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <h1 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-tinta">Pre-factura Borrador</h1>
            <Link href="/operaciones" aria-label="Cerrar simulación" className="flex size-9 items-center justify-center rounded-full bg-azul-50">
              <Ico src={`${P}/cerrar.svg`} w={11.667} h={11.667} />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4">
          <aside role="note" className="flex items-start gap-2 bg-[#f1f3ff] p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[rgba(128,163,253,0.3)]">
              <Ico src={`${P}/info.svg`} w={13.333} h={16.667} />
            </span>
            <div>
              <p className="text-sm leading-5 font-bold text-tinta">Demostración interactiva</p>
              <p className="pt-0.5 text-xs leading-[19.5px] font-bold text-tinta-suave">
                No se envía nada al SAT ni ante el PAC. Este comprobante no genera obligaciones fiscales ni deducciones reales.
              </p>
            </div>
          </aside>

          <ol className="relative flex items-start justify-between bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <span className="absolute top-8 right-10 left-10 h-0.5 bg-azul-50" />
            <Paso ok titulo="Datos OK" estado={<span className="text-[10px] leading-[15px] font-bold text-oliva">Revisado</span>} />
            <Paso ok titulo="XML & PDF" estado={<span className="text-[10px] leading-[15px] font-bold text-oliva">Generado</span>} />
            <Paso
              ok={false}
              titulo="PAC Timbrado"
              estado={<span className="rounded-full bg-azul-150 px-1.5 text-[10px] leading-[15px] font-bold text-[#001947]">Simulación</span>}
            />
          </ol>

          {/* Vista previa CFDI */}
          <article className="relative flex flex-col gap-2 overflow-clip rounded-[32px] bg-white p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
            <header className="-mx-4 -mt-4 flex items-start justify-between bg-[#f1f3ff]/50 px-4 pt-4 pb-2">
              <div className="flex flex-col gap-0.5">
                <p className="flex items-center gap-1.5">
                  <span className="flex size-6 items-center justify-center rounded-md bg-marca">
                    <Ico src={`${P}/doc.svg`} w={10} h={12.5} />
                  </span>
                  <span className="text-[19px] leading-6 font-extrabold tracking-[-0.475px] text-tinta">Dzuun CFDI</span>
                </p>
                <p className="text-xs leading-4 font-bold text-azul">Versión 4.0 CFDI Exprés</p>
              </div>
              <div className="flex flex-col items-end gap-1 pt-1">
                <span className="rounded-full bg-azul-50 px-2 py-0.5 text-xs leading-4 font-bold text-tinta">Ingreso (I)</span>
                <span className="text-xs leading-4 font-bold text-tinta-suave">14/11/2024 · 16:45 hrs</span>
              </div>
            </header>

            <section className="flex flex-col gap-1 bg-[#f1f3ff] p-2.5">
              <p className="flex items-center justify-between text-xs leading-4 font-bold">
                <span className="text-tinta-suave">Folio Fiscal (UUID):</span>
                <span className="text-marca">SIMULACIÓN</span>
              </p>
              <p className="font-mono text-[11px] leading-[16.5px] font-bold tracking-[-0.55px] text-tinta">
                4A9F2B81-XXXX-XXXX-XXXX-98C302B6D4F1
              </p>
              <dl className="mt-1 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 px-1.5 pt-1 pb-1.5 text-xs leading-4 font-bold">
                <div>
                  <dt className="inline text-tinta">Lugar Exp:</dt> <dd className="inline text-tinta-suave">68000 (Oaxaca)</dd>
                </div>
                <div>
                  <dt className="inline text-tinta">Uso CFDI:</dt> <dd className="inline text-tinta-suave">G03 Gastos</dd>
                </div>
                <div>
                  <dt className="inline text-tinta">Moneda:</dt> <dd className="inline text-tinta-suave">MXN ($)</dd>
                </div>
                <div>
                  <dt className="inline text-tinta">Forma:</dt> <dd className="inline text-tinta-suave">01 Efectivo</dd>
                </div>
              </dl>
            </section>

            <section className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col gap-0.5 bg-[#f1f3ff] p-2.5">
                <p className="flex items-center justify-between">
                  <span className="text-xs leading-4 font-bold tracking-[0.6px] text-azul uppercase">Emisor</span>
                  <span className="rounded-full bg-lima px-2 text-xs leading-4 font-bold text-lima-tinta">RESICO 626</span>
                </p>
                <p className="text-base leading-6 font-semibold text-tinta uppercase">Tlayudas Doña Mari</p>
                <p className="font-mono text-xs leading-4 font-bold text-tinta-suave">
                  RFC: <span className="text-tinta">MARI880415HR9</span>
                </p>
              </div>
              <div className="flex flex-col gap-0.5 bg-[#f1f3ff] p-2.5">
                <p className="flex items-center justify-between">
                  <span className="text-xs leading-4 font-bold tracking-[0.6px] text-azul uppercase">Receptor</span>
                  <span className="rounded-full bg-azul-100 px-2 text-xs leading-4 font-bold text-tinta-suave">Régimen 616</span>
                </p>
                <p className="text-base leading-6 font-semibold text-tinta">CLIENTE MOSTRADOR PÚBLICO GENERAL</p>
                <p className="flex flex-wrap justify-between gap-x-2 font-mono text-xs leading-4 font-bold text-tinta-suave">
                  <span>
                    RFC: <span className="text-tinta">XAXX010101000</span>
                  </span>
                  <span>C.P. Domicilio: 68000</span>
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-1.5 pt-1">
              <h2 className="text-xs leading-4 font-bold tracking-[0.6px] text-tinta uppercase">Detalle del concepto</h2>
              <div className="flex flex-col gap-1.5 bg-[#f1f3ff] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm leading-5 font-bold text-tinta">Suministros y abarrotes generales</p>
                    <p className="text-xs leading-4 font-bold text-tinta-suave">Clave SAT: 50202306 · Cant: 1 (H87)</p>
                  </div>
                  <p className="text-base leading-6 font-semibold text-tinta">$211.21</p>
                </div>
                <p className="flex items-center justify-between rounded-2xl bg-white p-1.5 text-[11px] leading-[16.5px]">
                  <span className="text-tinta-suave">P. Unitario: $211.21</span>
                  <span className="font-bold text-azul">IVA Trasladado 16% ($33.79)</span>
                </p>
              </div>
            </section>

            <section className="mt-1 flex flex-col gap-1.5 bg-azul-100/60 p-3">
              <p className="flex justify-between text-sm leading-5">
                <span className="font-semibold text-tinta-suave">Subtotal</span>
                <span className="font-mono font-bold text-tinta">$211.21 MXN</span>
              </p>
              <p className="flex justify-between text-sm leading-5">
                <span className="font-semibold text-tinta-suave">IVA Trasladado (16.0%)</span>
                <span className="font-mono font-bold text-tinta">$33.79 MXN</span>
              </p>
              <hr className="my-0.5 border-azul-50" />
              <p className="flex items-center justify-between text-[19px] leading-6 font-extrabold">
                <span className="text-tinta">Total</span>
                <span className="text-marca">$245.00 MXN</span>
              </p>
            </section>

            <section className="mt-1 grid grid-cols-4 gap-2 bg-[#f1f3ff]/40 p-2">
              <div className="flex flex-col items-center justify-center rounded-md bg-azul-50 px-1 py-4">
                <Ico src={`${P}/qr.svg`} w={19.5} h={19.5} />
                <span className="pt-1 text-center text-[9px] leading-[9px] font-bold text-tinta-suave">QR simulado</span>
              </div>
              <div className="col-span-3 flex flex-col justify-center gap-1 overflow-clip">
                <p className="text-[10px] leading-[15px] font-bold tracking-[0.5px] text-tinta-suave uppercase">Sello digital (muestra)</p>
                <p className="font-mono text-[9px] leading-[11.25px] break-all text-tinta-suave opacity-70">
                  ||1.1|4A9F2B81-SIMULADO-40-DZUUN|2024-11-14T16:45:00|kJ79zQxP3Wk092k...SIMULATED_SIGNATURE...88==||
                </p>
              </div>
            </section>

            {/* Marca de agua */}
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex -rotate-[28deg] flex-col items-center gap-1 text-marca opacity-[0.14]">
                <span className="text-4xl leading-9 font-extrabold tracking-[3.6px] uppercase">Simulado</span>
                <span className="text-xl leading-[26px] font-bold tracking-[1px] uppercase">Sin validez fiscal</span>
              </div>
            </div>
          </article>

          <aside className="flex items-center gap-2 bg-azul-50 p-4">
            <MascotaBisie size={56} fondo="bg-white" />
            <div>
              <p className="flex items-center gap-1.5">
                <span className="text-base leading-6 font-semibold text-tinta">Consejo de Bisie&apos;</span>
                <span className="rounded-2xl bg-lima px-1.5 text-xs leading-4 font-bold text-lima-tinta">Tip RESICO</span>
              </p>
              <p className="pt-px text-xs leading-[16.5px] font-bold text-tinta-suave">
                Recuerda que en modo simulación puedes probar cómo se verán tus comprobantes antes de conectar un timbrador oficial.
              </p>
            </div>
          </aside>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="flex h-12 items-center justify-center gap-2 bg-white text-base leading-6 font-semibold text-marca drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <Ico src={`${P}/pdf.svg`} w={16.667} h={16.667} />
              Ver PDF muestra
            </button>
            <button className="flex h-12 items-center justify-center gap-2 bg-white text-base leading-6 font-semibold text-azul drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <Ico src={`${P}/xml.svg`} w={16.667} h={10} />
              Ver XML demo
            </button>
          </div>

          <Link
            href="/operaciones"
            className="mt-1 flex h-[52px] items-center justify-center gap-2 rounded-full bg-marca text-[19px] leading-6 font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <Ico src={`${P}/volver.svg`} w={14.667} h={14.667} />
            Volver a operaciones
          </Link>
          <p className="px-2 pb-2 text-center text-xs leading-[19.5px] font-bold text-tinta-suave opacity-80">
            Dzuun es una herramienta de organización interna. Para timbrar facturas válidas, vincula tu certificado de sello
            digital (CSD) o consulta a tu PAC certificado.
          </p>
        </div>
      </main>
    </>
  );
}

import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { HeaderResico } from "@/components/HeaderResico";
import { Ico, MascotaBisie } from "@/components/ui";

/*
 * Pantalla 9 · Mi mes (Figma 1:1714). Todos los montos son DATOS DE EJEMPLO del boceto.
 * Ajustes respecto al boceto para cumplir CLAUDE.md (sec. 0 y 12):
 *  - Se omitió "Base gravable ISR RESICO": no se calcula ISR.
 *  - "Comprobados directamente del portal SAT" y "XML OK" se cambiaron: no hay
 *    conexión con el SAT; el CFDI solo se infiere por indicios en la foto.
 *  - La regla de efectivo > $2,000 está pendiente de verificar en LISR/LIVA vigentes.
 */
const M = "/figma/mi-mes";

const semanas = [
  { label: "Sem 1", rango: "1-7 Nov", ingreso: 8200, gasto: 3100 },
  { label: "Sem 2", rango: "8-14 Nov", ingreso: 12450, gasto: 5820 },
  { label: "Sem 3", rango: "15-21 Nov", ingreso: 10120, gasto: 4950 },
  { label: "Sem 4", rango: "22-30 Nov", ingreso: 7650, gasto: 4400 },
];
const maxSemana = Math.max(...semanas.map((s) => s.ingreso));
const miles = (n: number) => `$${n.toLocaleString("es-MX")}`;

function TarjetaResumen({
  icono,
  iconoBg,
  titulo,
  subtitulo,
  chip,
  monto,
  montoClase = "text-tinta",
  children,
}: {
  icono: React.ReactNode;
  iconoBg: string;
  titulo: string;
  subtitulo: string;
  chip: React.ReactNode;
  monto: string;
  montoClase?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 overflow-clip rounded-[32px] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${iconoBg}`}>{icono}</span>
          <div className="flex flex-col gap-[5.5px] pb-[2.5px]">
            <h3 className="text-[19px] leading-6 font-bold text-tinta">{titulo}</h3>
            <p className="text-xs leading-4 font-bold text-tinta-suave">{subtitulo}</p>
          </div>
        </div>
        {chip}
      </div>
      <p className={`pt-1 ${montoClase}`}>
        <span className="text-2xl leading-8 font-bold">{monto} </span>
        <span className="text-sm leading-5 font-semibold text-tinta-suave">MXN</span>
      </p>
      {children}
    </section>
  );
}

export default function MiMes() {
  return (
    <>
      <HeaderResico seccion="Mi mes" />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 pt-16 pb-[128px]">
        {/* Selector de mes */}
        <section className="flex flex-col gap-2 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button aria-label="Mes anterior" className="flex size-10 items-center justify-center rounded-full bg-azul-50">
                <Ico src={`${M}/anterior.svg`} w={6.167} h={10} />
              </button>
              <div className="px-1 text-center">
                <h1 className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-tinta">Noviembre 2024</h1>
                <p className="text-xs leading-4 font-bold text-tinta-suave">Régimen Simplificado</p>
              </div>
              <button aria-label="Mes siguiente" className="flex size-10 items-center justify-center rounded-full bg-azul-50">
                <Ico src={`${M}/siguiente.svg`} w={6.167} h={10} />
              </button>
            </div>
            <button aria-label="Descargar reporte" className="flex min-h-11 items-center rounded-full bg-azul-100 px-3">
              <Ico src={`${M}/descargar.svg`} w={12} h={12} />
            </button>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 rounded-full bg-lima px-2 py-1 text-xs leading-4 font-bold text-lima-tinta drop-shadow-[0px_0px_6px_rgba(200,243,12,0.35)]">
              <span className="size-2 rounded-full bg-oliva-viva" />
              Periodo en curso • Al día
            </span>
            <Link href="/operaciones" className="flex items-center gap-0.5 text-xs leading-4 font-bold text-azul">
              Historial
              <Ico src={`${M}/historial.svg`} w={12} h={13.333} />
            </Link>
          </div>
        </section>

        {/* Aviso legal */}
        <aside className="flex items-start gap-2 rounded-[32px] bg-azul-100 p-4">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-azul">
            <Ico src={`${M}/balanza.svg`} w={15} h={14.25} />
          </span>
          <div className="flex flex-col gap-0.5 text-xs font-bold">
            <p className="leading-[15px] text-tinta">Estimación de uso interno</p>
            <p className="leading-4 text-tinta-suave">
              No es una determinación oficial del SAT. Consulta siempre a tu contador público certificado antes de declarar.
            </p>
          </div>
        </aside>

        {/* Flujo neto */}
        <section className="relative flex flex-col gap-4 overflow-clip rounded-[32px] bg-noche p-6 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]">
          <span className="absolute top-0 right-0 size-32 rounded-full bg-marca/10 blur-[40px]" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="flex flex-col gap-[6.5px] pt-[5.5px]">
              <p className="text-xs leading-4 font-bold tracking-[0.6px] text-noche-tinta/70 uppercase">Flujo neto operativo</p>
              <p className="tracking-[-0.7px]">
                <span className="text-[28px] leading-9 font-extrabold text-noche-tinta">+$20,150.00 </span>
                <span className="text-sm leading-5 font-semibold text-noche-tinta/60">MXN</span>
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-lima px-3 py-1 text-xs leading-4 font-bold text-lima-tinta">Margen 52%</span>
          </div>
          <div className="relative flex flex-col gap-1 pt-2 text-xs leading-4 font-bold">
            <div className="flex items-start justify-between gap-4 pb-0.5">
              <span className="text-noche-tinta/75">Tope anual RESICO acumulado</span>
              <span className="text-right text-noche-tinta">$461,040 / $3,500,000 MXN</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={13.1}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tope anual RESICO utilizado"
              className="h-2.5 overflow-clip rounded-full bg-azul/40"
            >
              <span className="block h-full w-[13.1%] rounded-full bg-lima" />
            </div>
            <span className="text-noche-tinta/60">13.1% utilizado • Restan 11 meses</span>
          </div>
        </section>

        {/* Tres tarjetas */}
        <div className="flex flex-col gap-4">
          <TarjetaResumen
            icono={<Ico src={`${M}/tendencia.svg`} w={18.333} h={11} />}
            iconoBg="bg-oliva-viva/15"
            titulo="Ingresos"
            subtitulo="14 facturas / ventas de mostrador"
            chip={<span className="rounded-full bg-azul-50 px-2.5 py-1 text-xs leading-4 font-bold text-azul">Emitidas</span>}
            monto="+$38,420.00"
          />

          <TarjetaResumen
            icono={<Ico src={`${M}/cfdi.svg`} w={16.5} h={18.333} />}
            iconoBg="bg-[rgba(128,163,253,0.2)]"
            titulo="Gastos con CFDI"
            subtitulo="Compras & insumos validados"
            chip={<span className="rounded-full bg-lima px-2.5 py-0.5 text-xs leading-4 font-bold text-lima-tinta">Con CFDI</span>}
            monto="-$14,850.00"
          >
            <p className="flex items-center justify-between bg-[#f1f3ff] p-2">
              <span className="flex items-center gap-1.5 text-xs leading-4 font-bold text-tinta">
                <span className="size-2 rounded-full bg-oliva-viva" />
                IVA acreditable estimado
              </span>
              <span className="text-base leading-6 font-semibold text-oliva">+$2,048.28 MXN</span>
            </p>
            <p className="pl-1 text-xs leading-4 font-bold text-tinta-suave">
              CFDI detectado por indicios en el ticket (UUID o QR). Confírmalo con tu factura.
            </p>
          </TarjetaResumen>

          <TarjetaResumen
            icono={<Ico src={`${M}/recibo.svg`} w={14.667} h={18.333} />}
            iconoBg="bg-durazno"
            titulo="Gastos sin CFDI"
            subtitulo="8 tickets o notas de remisión"
            chip={<span className="rounded-full bg-azul-200 px-2.5 py-0.5 text-xs leading-4 font-bold text-tinta-suave">Pendientes</span>}
            monto="-$3,420.00"
            montoClase="text-tinta-suave"
          >
            <p className="flex items-center justify-between bg-[rgba(255,218,214,0.4)] p-2">
              <span className="flex items-center gap-1.5 text-xs leading-4 font-semibold text-[#93000a]">
                <Ico src={`${M}/aviso.svg`} w={13.333} h={13.333} />
                IVA no acreditable
              </span>
              <span className="text-base leading-6 font-semibold text-error">~$471.72 MXN</span>
            </p>
            <p className="pl-1 text-xs leading-4 font-bold text-tinta-suave">
              Tickets de mostrador sin timbrar. Conviértelos a factura antes de fin de mes para acreditarlos.
            </p>
          </TarjetaResumen>
        </div>

        {/* Advertencia efectivo > $2,000 (regla por verificar, CLAUDE.md sec. 12) */}
        <section
          role="alert"
          className="flex flex-col gap-2 rounded-[32px] bg-azul-100 p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-azul-200">
              <Ico src={`${M}/alerta.svg`} w={18.333} h={15.833} />
            </span>
            <div>
              <h4 className="text-[19px] leading-[23.75px] font-bold text-tinta">3 gastos en efectivo superan los $2,000 MXN</h4>
              <p className="pt-0.5 text-sm leading-[19.25px] font-semibold text-tinta-suave">
                Regla fiscal SAT: Todo gasto mayor a $2,000.00 MXN debe pagarse con tarjeta, transferencia electrónica o
                cheque para poder deducirse.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs leading-4 font-bold">
              <span className="text-tinta">Total en riesgo: </span>
              <span className="text-tinta-suave">$7,350.00 MXN</span>
            </p>
            <Link
              href="/operaciones"
              className="flex min-h-11 items-center gap-1 rounded-full bg-azul-200 px-4 text-sm leading-5 font-bold text-tinta drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
            >
              Ver cuáles
              <Ico src={`${M}/flecha.svg`} w={12} h={12} />
            </Link>
          </div>
        </section>

        {/* Evolución semanal */}
        <section className="flex flex-col gap-4 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xl leading-[26px] font-bold text-tinta">Evolución semanal</h3>
              <p className="text-xs leading-4 font-bold text-tinta-suave">Noviembre 2024</p>
            </div>
            <div className="flex items-center gap-2 text-xs leading-4 font-bold text-tinta-suave">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-azul" />
                Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-marca" />
                Gastos
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-4 pt-2 pb-1">
            {semanas.map((s) => (
              <li key={s.label} className="flex flex-col gap-1">
                <div className="flex items-start justify-between text-xs leading-4">
                  <span className="font-bold text-tinta">
                    {s.label} <span className="font-normal text-tinta-suave">({s.rango})</span>
                  </span>
                  <span className="font-semibold">
                    <span className="text-azul">+{miles(s.ingreso)}</span>
                    <span className="font-normal text-tinta-suave"> / </span>
                    <span className="text-marca">-{miles(s.gasto)}</span>
                  </span>
                </div>
                <div className="flex h-3.5 justify-between rounded-full bg-[#f1f3ff] p-0.5">
                  <span className="h-full rounded-full bg-azul" style={{ width: `${(s.ingreso / maxSemana) * 50}%` }} />
                  <span className="h-full rounded-full bg-marca" style={{ width: `${(s.gasto / maxSemana) * 50}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="flex items-center justify-between gap-4 bg-azul-50 p-2">
            <span className="text-xs leading-4 font-bold text-tinta">Total del mes</span>
            <span className="text-right text-base leading-6 font-semibold text-tinta">
              Ingresos: $38,420 • Egresos: $18,270
            </span>
          </p>
        </section>

        {/* Bisie' */}
        <section className="flex flex-col gap-4 overflow-clip rounded-[32px] bg-white p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <MascotaBisie size={64} />
              <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-lima drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                <Ico src={`${M}/chispa.svg`} w={10.442} h={7.963} />
              </span>
            </div>
            <p className="relative flex-1 rounded-2xl bg-lima p-4 text-base leading-5 font-semibold text-lima-tinta drop-shadow-[0px_0px_6px_rgba(200,243,12,0.35)]">
              <span className="absolute top-5 -left-2 size-4 rotate-45 bg-lima" />
              <span className="relative">
                &ldquo;Tienes hasta el 17 del próximo mes para tu declaración RESICO. ¡Vas súper bien!&rdquo;
              </span>
            </p>
          </div>
          <Link
            href="/chat"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-marca py-3.5 text-[19px] leading-6 font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            Pregúntale a Bisie&apos;
            <Ico src={`${M}/bisie.svg`} w={18.333} h={15.833} />
          </Link>
        </section>
      </main>
      <BottomNav />
    </>
  );
}

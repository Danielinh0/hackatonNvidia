import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { rutaChat } from "@/lib/rutas";
import { HeaderResico } from "@/components/HeaderResico";
import { Ico, MascotaBisie } from "@/components/ui";
import { db } from "@/lib/db";
import { dinero, mesActual, nombreMes } from "@/lib/formato";
import { obtenerNegocio, REGIMENES } from "@/lib/negocio";
import { efectivoAlto, resumenMes, semanasMes } from "@/lib/operaciones";
import { requerirUsuario } from "@/lib/sesion";

/*
 * Pantalla 9 · Mi mes (Figma 1:1714) con datos reales de SQLite: solo suma lo CONFIRMADO del mes.
 * Ajustes respecto al boceto para cumplir CLAUDE.md (sec. 0 y 12):
 *  - No se muestran ISR, tope anual RESICO, IVA acreditable ni fechas de declaración: esos cálculos
 *    van en backend-ia/reglas_fiscales.py y aún no están verificados.
 *  - El CFDI se infiere por indicios (UUID leído), no hay conexión con el SAT.
 *  - La regla de efectivo > $2,000 está pendiente de verificar en LISR/LIVA vigentes.
 */
const M = "/figma/mi-mes";

const RANGOS = ["1–7", "8–14", "15–21", "22–fin"];

function mover(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, "0")}`;
}

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

export default function MiMes({ searchParams }: PageProps<"/mi-mes">) {
  return (
    <>
      <HeaderResico seccion="Mi mes" />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 pt-16 pb-[128px]">
        <Suspense fallback={<p className="rounded-[32px] bg-white p-6 text-center font-semibold text-tinta-suave">Cargando tu mes…</p>}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNav />
    </>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/mi-mes">["searchParams"] }) {
  await connection();
  const u = await requerirUsuario();
  const d = db();
  const actual = mesActual();
  const pedido = (await searchParams).mes;
  const mes = typeof pedido === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) && pedido <= actual ? pedido : actual;
  const r = resumenMes(d, u.id, mes);
  const semanas = semanasMes(d, u.id, mes);
  const efectivo = efectivoAlto(d, u.id, mes);
  const negocio = obtenerNegocio(d, u.id);
  const regimen = negocio ? REGIMENES.find((x) => x.clave === negocio.regimen) : null;
  const gastos = r.egresosConCfdi + r.egresosSinCfdi;
  const neto = r.ingresos - gastos;
  const maxSemana = Math.max(1, ...semanas.flatMap((s) => [s.ingreso, s.gasto]));
  const vacio = r.nIngresos + r.nEgresos === 0;

  return (
    <>
        {/* Selector de mes */}
        <section className="flex flex-col gap-2 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <Link href={`/mi-mes?mes=${mover(mes, -1)}`} aria-label="Mes anterior" className="flex size-11 items-center justify-center rounded-full bg-azul-50">
              <Ico src={`${M}/anterior.svg`} w={6.167} h={10} />
            </Link>
            <div className="px-1 text-center">
              <h1 className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-tinta first-letter:uppercase">{nombreMes(mes)}</h1>
              <p className="text-xs leading-4 font-bold text-tinta-suave">{regimen ? `${regimen.nombre} (${regimen.clave})` : "Sin régimen configurado"}</p>
            </div>
            {mes < actual ? (
              <Link href={`/mi-mes?mes=${mover(mes, 1)}`} aria-label="Mes siguiente" className="flex size-11 items-center justify-center rounded-full bg-azul-50">
                <Ico src={`${M}/siguiente.svg`} w={6.167} h={10} />
              </Link>
            ) : (
              <span aria-hidden className="size-11" />
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            {mes === actual ? (
              <span className="flex items-center gap-1 rounded-full bg-lima px-2 py-1 text-xs leading-4 font-bold text-lima-tinta">
                <span className="size-2 rounded-full bg-oliva-viva" />
                Periodo en curso{r.nPorRevisar === 0 ? " • Al día" : ` • ${r.nPorRevisar} por revisar`}
              </span>
            ) : (
              <span className="rounded-full bg-azul-50 px-2 py-1 text-xs leading-4 font-bold text-tinta-suave">Mes cerrado</span>
            )}
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
              Solo suma lo que confirmaste. No es una determinación oficial del SAT; consulta a tu contador antes de declarar.
            </p>
          </div>
        </aside>

        {/* Flujo neto */}
        <section className="relative flex flex-col gap-2 overflow-clip rounded-[32px] bg-noche p-6">
          <span className="absolute top-0 right-0 size-32 rounded-full bg-marca/10 blur-[40px]" />
          <p className="relative text-xs leading-4 font-bold tracking-[0.6px] text-noche-tinta/70 uppercase">Ventas menos compras</p>
          <p className="relative tracking-[-0.7px]">
            <span className="text-[28px] leading-9 font-extrabold text-noche-tinta">{dinero(neto, { signo: true })} </span>
            <span className="text-sm leading-5 font-semibold text-noche-tinta/60">MXN</span>
          </p>
          {vacio && (
            <p className="relative text-xs font-bold text-noche-tinta/70">
              {r.nPorRevisar > 0 ? `Tienes ${r.nPorRevisar} por revisar; confírmalos para verlos aquí.` : "Aún no hay movimientos confirmados en este mes."}
            </p>
          )}
        </section>

        {/* Tres tarjetas */}
        <div className="flex flex-col gap-4">
          <TarjetaResumen
            icono={<Ico src={`${M}/tendencia.svg`} w={18.333} h={11} />}
            iconoBg="bg-oliva-viva/15"
            titulo="Ventas"
            subtitulo={`${r.nIngresos} ${r.nIngresos === 1 ? "venta confirmada" : "ventas confirmadas"}`}
            chip={<span className="rounded-full bg-azul-50 px-2.5 py-1 text-xs leading-4 font-bold text-azul">Ingresos</span>}
            monto={dinero(r.ingresos, { signo: true })}
          />
          <TarjetaResumen
            icono={<Ico src={`${M}/cfdi.svg`} w={16.5} h={18.333} />}
            iconoBg="bg-[rgba(128,163,253,0.2)]"
            titulo="Gastos con CFDI"
            subtitulo="Compras con indicio de factura"
            chip={<span className="rounded-full bg-lima px-2.5 py-0.5 text-xs leading-4 font-bold text-lima-tinta">Con CFDI</span>}
            monto={dinero(-r.egresosConCfdi, { signo: true })}
          >
            <p className="pl-1 text-xs leading-4 font-bold text-tinta-suave">
              CFDI detectado por indicios en el documento (UUID). Confírmalo con tu factura.
            </p>
          </TarjetaResumen>
          <TarjetaResumen
            icono={<Ico src={`${M}/recibo.svg`} w={14.667} h={18.333} />}
            iconoBg="bg-durazno"
            titulo="Gastos sin CFDI"
            subtitulo="Tickets o notas sin factura detectada"
            chip={<span className="rounded-full bg-azul-200 px-2.5 py-0.5 text-xs leading-4 font-bold text-tinta-suave">Pide factura</span>}
            monto={dinero(-r.egresosSinCfdi, { signo: true })}
            montoClase="text-tinta-suave"
          >
            <p className="pl-1 text-xs leading-4 font-bold text-tinta-suave">
              Probablemente no te sirvan fiscalmente si no pides su factura.
            </p>
          </TarjetaResumen>
        </div>

        {/* Advertencia efectivo > $2,000 (regla por verificar, CLAUDE.md sec. 12) */}
        {efectivo.n > 0 && (
          <section role="alert" className="flex flex-col gap-2 rounded-[32px] bg-azul-100 p-4">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-azul-200">
                <Ico src={`${M}/alerta.svg`} w={18.333} h={15.833} />
              </span>
              <div>
                <h4 className="text-[19px] leading-[23.75px] font-bold text-tinta">
                  {efectivo.n} {efectivo.n === 1 ? "gasto en efectivo supera" : "gastos en efectivo superan"} los $2,000
                </h4>
                <p className="pt-0.5 text-sm leading-[19.25px] font-semibold text-tinta-suave">
                  Los pagos grandes en efectivo podrían no servirte fiscalmente. Regla por verificar con tu contador.
                </p>
              </div>
            </div>
            <p className="text-xs leading-4 font-bold">
              <span className="text-tinta">Suman: </span>
              <span className="text-tinta-suave">{dinero(efectivo.total)} MXN</span>
            </p>
          </section>
        )}

        {/* Evolución semanal */}
        <section className="flex flex-col gap-4 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl leading-[26px] font-bold text-tinta">Por semana</h3>
            <div className="flex items-center gap-2 text-xs leading-4 font-bold text-tinta-suave">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-azul" />
                Ventas
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-marca" />
                Compras
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-4 pt-1 pb-1">
            {semanas.map((s, i) => (
              <li key={i} className="flex flex-col gap-1">
                <div className="flex items-start justify-between text-xs leading-4">
                  <span className="font-bold text-tinta">
                    Sem {i + 1} <span className="font-normal text-tinta-suave">(días {RANGOS[i]})</span>
                  </span>
                  <span className="font-semibold">
                    <span className="text-azul">{dinero(s.ingreso, { signo: true })}</span>
                    <span className="font-normal text-tinta-suave"> / </span>
                    <span className="text-marca">{dinero(-s.gasto, { signo: true })}</span>
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
            <span className="text-right text-sm leading-6 font-semibold text-tinta">
              Ventas: {dinero(r.ingresos)} • Compras: {dinero(gastos)}
            </span>
          </p>
        </section>

        {/* Bisie' */}
        <section className="flex flex-col gap-4 overflow-clip rounded-[32px] bg-white p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <MascotaBisie size={64} />
              <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-lima">
                <Ico src={`${M}/chispa.svg`} w={10.442} h={7.963} />
              </span>
            </div>
            <p className="relative flex-1 rounded-2xl bg-lima p-4 text-base leading-5 font-semibold text-lima-tinta">
              <span className="absolute top-5 -left-2 size-4 rotate-45 bg-lima" />
              <span className="relative">
                &ldquo;
                {r.nPorRevisar > 0
                  ? `Te faltan ${r.nPorRevisar} ${r.nPorRevisar === 1 ? "ticket" : "tickets"} por revisar este mes. ¡Vamos!`
                  : r.egresosSinCfdi > 0
                    ? "Tienes compras sin factura. Pide tu CFDI en la tienda para que te sirvan."
                    : vacio
                      ? "Cuando confirmes tus tickets te muestro aquí cómo va tu mes."
                      : "¡Vas muy bien! Todo lo de este mes está revisado."}
                &rdquo;
              </span>
            </p>
          </div>
          <Link
            href={r.nPorRevisar > 0 ? "/revision/sencillo" : rutaChat(`/mi-mes?mes=${mes}`)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-marca py-3.5 text-[19px] leading-6 font-bold text-white"
          >
            {r.nPorRevisar > 0 ? "Revisar ahora" : "Pregúntale a Bisie'"}
            <Ico src={`${M}/bisie.svg`} w={18.333} h={15.833} />
          </Link>
        </section>
    </>
  );
}

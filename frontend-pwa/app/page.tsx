import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PantallaApp } from "@/components/PantallaApp";
import { Ico, MascotaBisie } from "@/components/ui";
import { db } from "@/lib/db";
import { dinero, fechaCorta, mesActual, nombreMes } from "@/lib/formato";
import { obtenerNegocio, REGIMENES } from "@/lib/negocio";
import { listarOperaciones, resumenMes, type Operacion } from "@/lib/operaciones";
import { primerNombre, requerirUsuario } from "@/lib/sesion";

/*
 * Pantalla 1 · Inicio (Figma 1:2) con datos reales de SQLite: pendientes de revisar,
 * resumen del mes (solo lo confirmado) y últimos movimientos.
 * Las sumas son ESTIMACIONES con los totales leídos; no se calcula ISR ni IVA (CLAUDE.md sec. 12).
 */
const I = "/figma/inicio";

export default function Inicio() {
  return (
    <PantallaApp activa="inicio">
      <Suspense fallback={<p className="rounded-[32px] bg-white p-6 text-center font-semibold text-tinta-suave shadow-tarjeta">Cargando tu resumen…</p>}>
        <ContenidoInicio />
      </Suspense>
    </PantallaApp>
  );
}

async function ContenidoInicio() {
  await connection();
  const u = await requerirUsuario();
  const d = db();
  const negocio = obtenerNegocio(d, u.id);
  const mes = mesActual();
  const r = resumenMes(d, u.id, mes);
  const pendientesTotal = (d.prepare("SELECT count(*) AS n FROM comprobantes WHERE usuario_id = ? AND estado = 'por_revisar'").get(u.id) as { n: number }).n;
  const ultimos = listarOperaciones(d, u.id, { limite: 3 });
  const gastos = r.egresosConCfdi + r.egresosSinCfdi;
  const pct = gastos > 0 ? Math.round((r.egresosConCfdi / gastos) * 100) : 0;
  const regimen = negocio ? REGIMENES.find((x) => x.clave === negocio.regimen) : null;

  return (
    <>
      {!negocio && (
        <Link href="/configurar" className="flex items-center gap-3 rounded-[32px] bg-durazno/50 p-4 text-sm leading-5 font-semibold text-tinta">
          <span aria-hidden className="text-2xl">🏪</span>
          <span className="flex-1">
            <b className="block text-base">Configura tu negocio</b>
            Con tu RFC Bisie&apos; separa tus ventas de tus compras.
          </span>
          <Ico src={`${I}/chevron.svg`} w={4.933} h={8} />
        </Link>
      )}

      {/* 1 · Saludo de Bisie' */}
      <section className="overflow-clip rounded-[32px] bg-white p-4 shadow-tarjeta">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0 pt-0.5">
            <MascotaBisie size={64} />
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-marca">
              <Ico src={`${I}/badge-bisie.svg`} w={10.833} h={10.86} />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="flex w-fit items-center gap-1.5 rounded-full bg-lima px-3 py-1 text-xs leading-4 font-bold text-lima-tinta drop-shadow-[0px_2px_4px_rgba(200,243,12,0.4)]">
              <Ico src={`${I}/chip-hola.svg`} w={12} h={13.333} />
              ¡Hola, {primerNombre(u)}!{" "}
              {pendientesTotal === 0 ? "Todo al día ✨" : `Tienes ${pendientesTotal} por revisar 📋`}
            </p>
            <p className="pt-2 text-base leading-[22px] text-tinta">
              {pendientesTotal === 0
                ? ultimos.length === 0
                  ? "Sube la foto de tu primer ticket y yo lo leo por ti."
                  : "No tienes tickets pendientes. ¡Buen trabajo!"
                : "Revisémoslos en un minuto para que nada se te escape del cajón."}
            </p>
            {pendientesTotal > 0 && (
              <Link href="/revision/sencillo" className="flex items-center gap-2 pt-2.5">
                <span className="flex items-center gap-1.5 rounded-full bg-azul-100 px-2.5 py-1 text-xs leading-4 font-bold text-tinta-suave">
                  <span className="h-2 w-[7px] rounded-full bg-marca-viva" />
                  {pendientesTotal} pendiente{pendientesTotal === 1 ? "" : "s"} de validar
                </span>
                <span className="text-xs leading-4 font-semibold text-azul">Toca para abrir →</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2 · Resumen del mes */}
      <section className="relative overflow-clip rounded-[32px] bg-noche p-6 shadow-[0px_12px_32px_0px_rgba(0,15,42,0.32)]">
        <span className="absolute -top-16 -right-16 size-44 rounded-full bg-azul/25 blur-[64px]" />
        <span className="absolute -bottom-16 -left-16 size-36 rounded-full bg-lima/10 blur-[40px]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[19px] leading-6 font-bold text-noche-tinta">
              <Link href="/mi-mes" className="flex items-center gap-2">
                <Ico src={`${I}/resumen.svg`} w={15} h={15} />
                <span className="first-letter:uppercase">{nombreMes(mes)}</span>
              </Link>
            </h2>
            {regimen && (
              <span className="shrink-0 rounded-full bg-lima px-3 py-1 text-xs leading-4 font-bold text-lima-tinta drop-shadow-[0px_0px_6px_rgba(200,243,12,0.35)]">
                {regimen.clave === "626" ? "RESICO" : `Régimen ${regimen.clave}`}
              </span>
            )}
          </div>

          <p className="flex items-center gap-2 rounded-full bg-noche/80 px-3 py-1.5 text-xs leading-4 font-bold text-noche-tinta/90">
            <Ico src={`${I}/alerta.svg`} w={15.583} h={13.458} />
            <span className="truncate">Estimación, no es una determinación oficial del SAT</span>
          </p>

          <div className="flex flex-col gap-3">
            <div className="rounded-[48px] bg-noche p-3.5">
              <p className="text-sm leading-5 font-semibold text-noche-tinta/80">Ventas confirmadas</p>
              <p className="pt-1 text-[28px] leading-9 font-extrabold tracking-[-0.7px] text-lima">{dinero(r.ingresos)}</p>
            </div>
            <div className="flex gap-2.5">
              <Metrica
                icono={<Ico src={`${I}/con-factura.svg`} w={13.75} h={13.125} />}
                etiqueta="Con factura"
                color="text-lima"
                monto={dinero(r.egresosConCfdi)}
                pie="Gastos con CFDI"
              />
              <Metrica
                icono={<Ico src={`${I}/por-solicitar.svg`} w={11.875} h={13.125} />}
                etiqueta="Sin factura"
                color="text-salmon"
                monto={dinero(r.egresosSinCfdi)}
                pie="Pide tu factura"
              />
            </div>
          </div>

          {gastos > 0 ? (
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs leading-4 font-bold">
                <span className="text-noche-tinta/85">{pct}% de tus gastos con CFDI</span>
                <span className="text-lima">{dinero(gastos)} en gastos</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Gastos con CFDI"
                className="flex h-3 overflow-clip rounded-full bg-[rgba(232,237,255,0.2)] p-0.5"
              >
                <span className="h-full rounded-full bg-lima" style={{ width: `${pct}%` }} />
                <span className="h-full rounded-full bg-salmon/70" style={{ width: `${100 - pct}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-xs leading-4 font-bold text-noche-tinta/70">
              {r.nPorRevisar > 0 ? "Confirma tus tickets para verlos aquí." : "Aún no hay gastos confirmados este mes."}
            </p>
          )}
        </div>
      </section>

      {/* 3 · CTA principal */}
      <Link
        href="/subir"
        className="flex min-h-16 items-center justify-between rounded-[48px] bg-marca px-5 py-3 drop-shadow-[0px_8px_12px_rgba(186,11,0,0.35)]"
      >
        <span className="flex items-center gap-3.5">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/15">
            <Ico src={`${I}/camara.svg`} w={23.333} h={21} />
          </span>
          <span className="flex flex-col">
            <span className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-white">📸 Subir tickets</span>
            <span className="text-xs leading-4 font-bold text-white/85">Cámara o galería • Detección automática</span>
          </span>
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Ico src={`${I}/flecha.svg`} w={14.667} h={14.667} />
        </span>
      </Link>

      {/* 4 · Últimos movimientos */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="flex items-center gap-1.5 text-[19px] leading-6 font-bold text-tinta">
            <Ico src={`${I}/historial.svg`} w={15} h={15} />
            Últimos movimientos
          </h3>
          {ultimos.length > 0 && (
            <Link href="/operaciones" className="flex items-center gap-0.5 text-sm leading-5 font-bold text-azul">
              Ver todos
              <Ico src={`${I}/chevron.svg`} w={4.933} h={8} />
            </Link>
          )}
        </div>

        {ultimos.length === 0 ? (
          <p className="rounded-[32px] bg-white p-5 text-center text-sm leading-5 font-semibold text-tinta-suave">
            Aquí verás tus ventas y compras en cuanto subas tus tickets.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {ultimos.map((m) => (
              <Movimiento key={m.id} m={m} />
            ))}
          </ul>
        )}
      </section>

      {/* Consejo de Bisie' */}
      <aside className="flex items-center gap-3 rounded-[48px] bg-azul-100/60 p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <Ico src={`${I}/foco.svg`} w={18.75} h={18.333} />
        </span>
        <p className="text-xs leading-[16.5px] font-bold text-tinta-suave">
          <span className="font-extrabold text-tinta">Consejo de Bisie&apos;:</span> Si compras en tienditas de barrio,
          pide que anoten su RFC en el ticket para que puedas solicitar tu factura.
        </p>
      </aside>
    </>
  );
}

const ICONO = {
  ingreso: { src: `${I}/tienda.svg`, w: 18.419, h: 16.5, bg: "bg-lima/50" },
  egreso: { src: `${I}/carrito.svg`, w: 18.316, h: 18.333, bg: "bg-azul-100" },
  otro: { src: `${I}/archivo.svg`, w: 18.333, h: 18.333, bg: "bg-azul-200" },
};

function Movimiento({ m }: { m: Operacion }) {
  const icono = m.clasificacion === "ingreso" ? ICONO.ingreso : m.clasificacion === "egreso" ? ICONO.egreso : ICONO.otro;
  const signo = m.clasificacion === "ingreso" ? 1 : m.clasificacion === "egreso" ? -1 : 1;
  const tipo = m.clasificacion === "ingreso" ? "Venta" : m.clasificacion === "egreso" ? "Compra" : m.clasificacion === "pago" ? "Pago" : "Sin clasificar";
  const href = m.estado === "por_revisar" ? `/revision/sencillo?id=${m.id}` : "/operaciones";
  return (
    <li>
      <Link href={href} className="flex flex-col gap-2 rounded-[32px] bg-white p-4 drop-shadow-[0px_2px_5px_rgba(0,15,42,0.04)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${icono.bg}`}>
              <Ico src={icono.src} w={icono.w} h={icono.h} />
            </span>
            <div className="flex min-w-0 flex-col">
              <h4 className="truncate text-base leading-6 font-semibold text-tinta">{m.contraparte ?? "Sin nombre leído"}</h4>
              <p className="truncate text-xs leading-4 font-bold text-tinta-suave">
                {tipo} • {fechaCorta(m.fecha)}{m.fecha_leida ? "" : " (subido)"}
              </p>
            </div>
          </div>
          <p className={`shrink-0 text-[19px] leading-6 font-bold ${m.clasificacion === "ingreso" ? "text-oliva" : "text-tinta"}`}>
            {m.total_centavos === null ? "—" : m.clasificacion ? dinero(signo * m.total_centavos, { signo: true }) : dinero(m.total_centavos)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1 text-xs leading-4 font-bold">
          {m.estado === "confirmado" ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-azul-50 px-2.5 py-0.5 text-oliva">
              <Ico src={`${I}/check.svg`} w={12.5} h={12.5} />
              Confirmado
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-azul-100 px-2.5 py-0.5 text-tinta">
              <Ico src={`${I}/reloj.svg`} w={12.5} h={12.5} />
              Por revisar
            </span>
          )}
          <span className="flex items-center gap-1.5">
            {m.analisis_simulado === 1 && <span className="rounded-md bg-[#fef3c7] px-2 py-0.5 text-[#92400e]">SIMULADO</span>}
            <span className={`rounded-md px-2 py-0.5 ${m.tiene_cfdi ? "bg-lima/40 text-lima-tinta" : "bg-azul-100 text-tinta-suave/80"}`}>
              {m.tiene_cfdi ? "Con CFDI (indicio)" : "Sin CFDI detectado"}
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

function Metrica(props: { icono: React.ReactNode; etiqueta: string; color: string; monto: string; pie: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between rounded-[48px] bg-noche p-3">
      <div className="flex flex-col gap-1.5">
        <p className={`flex items-center gap-1 text-xs leading-4 font-bold ${props.color}`}>
          {props.icono}
          {props.etiqueta}
        </p>
        <p className="text-[19px] leading-6 font-bold text-noche-tinta">{props.monto}</p>
      </div>
      <p className="pt-2 text-xs leading-4 font-bold text-noche-tinta/70">{props.pie}</p>
    </div>
  );
}

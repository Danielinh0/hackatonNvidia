import { connection } from "next/server";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HeaderResico } from "@/components/HeaderResico";
import { ListaOperaciones, type Operacion } from "@/components/ListaOperaciones";
import { Ico } from "@/components/ui";
import { db } from "@/lib/db";
import { diaDe, dinero, fechaLarga, mesActual, nombreMes } from "@/lib/formato";
import { listarOperaciones, resumenMes, type Operacion as Fila, type ResumenMes } from "@/lib/operaciones";
import { requerirUsuario } from "@/lib/sesion";

/*
 * Pantalla 8 · Operaciones (Figma 1:1421) con los comprobantes reales de SQLite (por revisar y confirmados).
 * El balance solo suma lo confirmado del mes. No se calcula ISR (CLAUDE.md sec. 12).
 */
const O = "/figma/operaciones";

const ICONOS = {
  ingreso: { src: `${O}/billete.svg`, w: 22, h: 16, bg: "bg-lima/60" },
  gasto: { src: `${O}/tienda.svg`, w: 20.094, h: 18, bg: "bg-marca/10" },
  spei: { src: `${O}/banco.svg`, w: 20, h: 20, bg: "bg-azul-150" },
  otro: { src: `${O}/herramienta.svg`, w: 18.525, h: 18.025, bg: "bg-[#ffdad6]" },
};

function grupo(fecha: string, hoy: string, ayer: string) {
  const dia = diaDe(fecha);
  if (dia === hoy) return `Hoy • ${fechaLarga(fecha)}`;
  if (dia === ayer) return `Ayer • ${fechaLarga(fecha)}`;
  return fechaLarga(fecha);
}

function aVista(f: Fila, hoy: string, ayer: string): Operacion {
  const tipo = f.clasificacion === "ingreso" ? "ingreso" : f.clasificacion === "egreso" ? "gasto" : f.clasificacion === "pago" ? "spei" : "otro";
  const signo = tipo === "gasto" ? -1 : 1;
  const que = f.clasificacion === "ingreso" ? "Venta" : f.clasificacion === "egreso" ? "Compra" : f.clasificacion === "pago" ? "Pago" : "Sin clasificar";
  return {
    id: f.id,
    grupo: grupo(f.fecha, hoy, ayer),
    emisor: f.contraparte ?? "Sin nombre leído",
    detalle: [que, f.descripcion, f.origen === "camara" ? "Foto" : "Archivo"].filter(Boolean).join(" • "),
    monto: f.total_centavos === null ? null : signo * f.total_centavos,
    tipo,
    tieneCfdi: f.tiene_cfdi === 1,
    conf: f.conf_global,
    porRevisar: f.estado === "por_revisar" || f.clasificacion === null,
    simulado: f.analisis_simulado === 1,
    icono: ICONOS[tipo],
    href: f.estado === "por_revisar" ? `/revision/sencillo?id=${f.id}` : `/revision/detalle?id=${f.id}`,
  };
}

export default function Operaciones() {
  return (
    <>
      <HeaderResico seccion="Operaciones" />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-2 bg-fondo px-4 pt-16 pb-[136px]">
        <Suspense fallback={<p className="rounded-2xl bg-white p-6 text-center font-semibold text-tinta-suave">Cargando tus operaciones…</p>}>
          <Contenido />
        </Suspense>
      </main>
      <BottomNav activa="operaciones" />
    </>
  );
}

async function Contenido() {
  await connection();
  const u = await requerirUsuario();
  const d = db();
  const mes = mesActual();
  const ahora = new Date();
  const hoy = diaDe(ahora.toISOString());
  const ayer = diaDe(new Date(ahora.getTime() - 86_400_000).toISOString());
  const ops = listarOperaciones(d, u.id).map((f) => aVista(f, hoy, ayer));
  const r = resumenMes(d, u.id, mes);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-tinta">Operaciones</h1>
          <p className="flex items-center gap-1.5 text-sm leading-5 font-semibold text-tinta-suave">
            <span className="size-2 rounded-full bg-oliva" />
            {ops.length} {ops.length === 1 ? "movimiento" : "movimientos"} en total
          </p>
        </div>
      </div>

      <ListaOperaciones operaciones={ops} resumen={<BalanceMensual r={r} />} />
    </>
  );
}

function BalanceMensual({ r }: { r: ResumenMes }) {
  return (
    <section className="relative my-2 overflow-clip rounded-[32px] bg-tinta p-4 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
      <span className="absolute -top-8 -right-8 size-32 rounded-full bg-lima/15 blur-[40px]" />
      <span className="absolute -bottom-8 -left-8 size-28 rounded-full bg-marca/20 blur-[40px]" />
      <div className="relative flex flex-col gap-2">
        <p className="flex items-center gap-1 text-xs leading-4 font-bold text-azul-200">
          <Ico src={`${O}/tendencia.svg`} w={14.667} h={11.333} />
          <span className="first-letter:uppercase">Balance de {nombreMes(r.mes)}</span>
        </p>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 rounded-md bg-noche/70 p-2">
            <p className="text-xs leading-4 font-bold text-azul-200/80">Ventas</p>
            <p className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-lima">{dinero(r.ingresos, { signo: true })}</p>
            <p className="pt-0.5 text-xs leading-4 font-bold text-azul-200/70">{r.nIngresos} confirmadas</p>
          </div>
          <div className="flex-1 rounded-md bg-noche/70 p-2">
            <p className="text-xs leading-4 font-bold text-azul-200/80">Compras</p>
            <p className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-fondo">
              {dinero(-(r.egresosConCfdi + r.egresosSinCfdi), { signo: true })}
            </p>
            <p className="pt-0.5 text-xs leading-4 font-bold text-durazno">{r.nEgresos} confirmadas</p>
          </div>
        </div>
        {r.nPorRevisar > 0 && (
          <p className="text-xs leading-4 font-bold text-azul-200">{r.nPorRevisar} por revisar no se suman todavía.</p>
        )}
        <p className="flex items-center gap-1 pt-1 text-[10px] leading-[15px] text-azul-200/60 italic">
          <Ico src={`${O}/info.svg`} w={12.5} h={12.5} />
          Estimación informativa, no oficial SAT. Dzuun no calcula ISR.
        </p>
      </div>
    </section>
  );
}

import { BottomNav } from "@/components/BottomNav";
import { HeaderResico } from "@/components/HeaderResico";
import { ListaOperaciones, type Operacion } from "@/components/ListaOperaciones";
import { Ico } from "@/components/ui";

/*
 * Pantalla 8 · Operaciones (Figma 1:1421).
 * Datos de ejemplo del boceto (el boceto dice "14 movimientos" pero solo dibuja 5).
 * Se omitió la fila "ISR estimado a pagar" del boceto: CLAUDE.md sec. 12 indica que no se calcula ISR.
 */
const O = "/figma/operaciones";

const operaciones: Operacion[] = [
  {
    id: "1", grupo: "Hoy • 14 de noviembre", emisor: "Cadena Comercial OXXO", detalle: "Gasolina magna • 18:32 hrs",
    monto: -650, tipo: "gasto", tieneCfdi: true, conf: 0.98,
    icono: { src: `${O}/gasolina.svg`, w: 16.5, h: 18, bg: "bg-marca/10" },
  },
  {
    id: "2", grupo: "Hoy • 14 de noviembre", emisor: "Abarrotes López", detalle: "Artículos de limpieza • 14:30 hrs",
    monto: -245, tipo: "gasto", tieneCfdi: false, conf: 0.95,
    icono: { src: `${O}/tienda.svg`, w: 20.094, h: 18, bg: "bg-marca/10" },
  },
  {
    id: "3", grupo: "Ayer • 13 de noviembre", emisor: "Venta mostrador - Folio #108", detalle: "Cobro con terminal Clip • 16:15 hrs",
    monto: 1850, tipo: "ingreso", tieneCfdi: true, conf: 0.99,
    icono: { src: `${O}/billete.svg`, w: 22, h: 16, bg: "bg-lima/60" },
  },
  {
    id: "4", grupo: "Ayer • 13 de noviembre", emisor: "Transferencia renta local", detalle: "BBVA • Comprobante SPEI • 11:00 hrs",
    monto: -4500, tipo: "spei", tieneCfdi: true, conf: 0.82,
    icono: { src: `${O}/banco.svg`, w: 20, h: 20, bg: "bg-azul-150" },
  },
  {
    id: "5", grupo: "10 de noviembre", emisor: "Ferretería El Tlaco", detalle: "Material de reparación • 09:15 hrs",
    monto: -1180, tipo: "gasto", tieneCfdi: false, conf: 0.5, porRevisar: true,
    icono: { src: `${O}/herramienta.svg`, w: 18.525, h: 18.025, bg: "bg-[#ffdad6]" },
  },
];

export default function Operaciones() {
  return (
    <>
      <HeaderResico seccion="Operaciones" />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-2 bg-fondo px-4 pt-16 pb-[136px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-tinta">Operaciones</h1>
            <p className="flex items-center gap-1.5 text-sm leading-5 font-semibold text-tinta-suave">
              <span className="size-2 rounded-full bg-oliva" />
              Noviembre 2024 • {operaciones.length} movimientos
            </p>
          </div>
          <button
            aria-label="Exportar reporte contable"
            className="flex size-12 items-center justify-center rounded-full bg-azul-50 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Ico src={`${O}/exportar.svg`} w={16} h={20} />
          </button>
        </div>

        <ListaOperaciones operaciones={operaciones} resumen={<BalanceMensual />} />

      </main>
      <BottomNav activa="operaciones" />
    </>
  );
}

function BalanceMensual() {
  return (
    <section className="relative my-2 overflow-clip rounded-[32px] bg-tinta p-4 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
      <span className="absolute -top-8 -right-8 size-32 rounded-full bg-lima/15 blur-[40px]" />
      <span className="absolute -bottom-8 -left-8 size-28 rounded-full bg-marca/20 blur-[40px]" />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-xs leading-4 font-bold text-azul-200">
            <Ico src={`${O}/tendencia.svg`} w={14.667} h={11.333} />
            Balance Mensual RESICO
          </p>
          <span className="rounded-full bg-lima px-2 py-0.5 text-xs leading-4 font-bold text-lima-tinta drop-shadow-[0px_0px_5px_rgba(200,243,12,0.3)]">
            Tasa 1.0%
          </span>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="flex-1 rounded-md bg-noche/70 p-2">
            <p className="text-xs leading-4 font-bold text-azul-200/80">Ingresos brutos</p>
            <p className="font-bold tracking-[-0.5px] text-lima">
              <span className="text-xl leading-[26px]">+$38,420</span>
              <span className="text-xs leading-4">.00</span>
            </p>
            <p className="pt-0.5 text-xs leading-4 font-bold text-azul-200/70">3 facturados</p>
          </div>
          <div className="flex-1 rounded-md bg-noche/70 p-2">
            <p className="text-xs leading-4 font-bold text-azul-200/80">Gastos deducibles</p>
            <p className="font-bold tracking-[-0.5px] text-fondo">
              <span className="text-xl leading-[26px]">-$6,575</span>
              <span className="text-xs leading-4">.00</span>
            </p>
            <p className="pt-0.5 text-xs leading-4 font-bold text-durazno">11 registrados</p>
          </div>
        </div>
        <p className="flex items-center gap-1 pt-1 text-[10px] leading-[15px] text-azul-200/60 italic">
          <Ico src={`${O}/info.svg`} w={12.5} h={12.5} />
          Estimación informativa, no oficial SAT. Dzuun no calcula ISR.
        </p>
      </div>
    </section>
  );
}

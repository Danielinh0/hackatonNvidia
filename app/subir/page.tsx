import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { FormularioSubida } from "@/components/FormularioSubida";
import { HeaderResico } from "@/components/HeaderResico";
import { Ico, MascotaBisie } from "@/components/ui";

/*
 * Pantalla 4 · Subir lote (Figma 1:632).
 * Los botones de cámara y galería SÍ suben: verifican y guardan en PostgreSQL y
 * redirigen a /subir/recibido/[lote]. La "Cola de tickets" de abajo sigue siendo
 * el ejemplo del boceto (aún no se llama a /vision/analizar).
 */
const S = "/figma/subir";

type Item =
  | { tipo: "listo"; archivo: string; monto: string; hora: string; icono: [string, number, number] }
  | { tipo: "leyendo"; archivo: string; hora: string; icono: [string, number, number] }
  | { tipo: "subiendo"; archivo: string; pct: number; detalle: string; icono: [string, number, number] }
  | { tipo: "error"; archivo: string; motivo: string };

const cola: Item[] = [
  { tipo: "listo", archivo: "ticket_oxxo_gasolina_14mar.jpg", monto: "$650.00", hora: "14 mar • 09:24 hrs", icono: [`${S}/gasolina.svg`, 17.875, 19.5] },
  { tipo: "listo", archivo: "factura_papeleria_san_juan.pdf", monto: "$420.50", hora: "14 mar • 10:12 hrs", icono: [`${S}/pdf.svg`, 21.667, 21.667] },
  { tipo: "leyendo", archivo: "comprobante_spei_renta.png", hora: "14 mar • 11:05 hrs", icono: [`${S}/recibo.svg`, 19.5, 21.667] },
  { tipo: "subiendo", archivo: "foto_ticket_super_arrugado.jpg", pct: 45, detalle: "1.8 MB de 3.2 MB • Subiendo", icono: [`${S}/nube.svg`, 23.833, 17.333] },
  { tipo: "error", archivo: "recibo_borroso_noche.jpg", motivo: "Foto desenfocada o con reflejo sobre el total." },
  { tipo: "listo", archivo: "ticket_ferreteria_tlaco.jpg", monto: "$1,180.00", hora: "14 mar • 11:30 hrs", icono: [`${S}/maletin.svg`, 21.667, 17.333] },
];

function IconoCola({ icono }: { icono: [string, number, number] }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-[48px] bg-azul-50">
      <Ico src={icono[0]} w={icono[1]} h={icono[2]} />
    </span>
  );
}

function Tarjeta({ item }: { item: Item }) {
  const base = "flex rounded-2xl p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]";

  if (item.tipo === "error") {
    return (
      <article role="alert" className={`${base} flex-col gap-2.5 bg-[#ffdad6]`}>
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[48px] bg-white">
            <Ico src={`${S}/alerta.svg`} w={21.667} h={21.667} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm leading-[21px] text-[#93000a]">{item.archivo}</p>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-error px-2 py-0.5 text-[11px] leading-[16.5px] font-bold text-white">
                <Ico src={`${S}/aviso.svg`} w={11.917} h={10.292} />
                No se pudo leer
              </span>
            </div>
            <p className="text-xs leading-[18px] text-[#93000a]">{item.motivo}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button className="flex min-h-[38px] items-center gap-1 rounded-full bg-white px-3 text-xs leading-4 font-bold text-tinta-suave">
            <Ico src={`${S}/basura.svg`} w={10.667} h={12} />
            Quitar
          </button>
          <button className="flex min-h-[38px] items-center gap-1 rounded-full bg-error px-3.5 text-xs leading-4 font-bold text-white">
            <Ico src={`${S}/reintentar.svg`} w={12} h={14} />
            Reintentar
          </button>
        </div>
      </article>
    );
  }

  if (item.tipo === "subiendo") {
    return (
      <article className={`${base} flex-col gap-2 bg-white`}>
        <div className="flex items-center gap-3">
          <IconoCola icono={item.icono} />
          <div className="flex min-w-0 flex-1 flex-col gap-[5px] pb-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm leading-[21px] text-tinta">{item.archivo}</p>
              <span className="shrink-0 text-xs leading-4 font-bold text-azul">{item.pct} %</span>
            </div>
            <p className="text-[11px] leading-[16.5px] text-tinta-suave">{item.detalle}</p>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={item.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Subiendo ${item.archivo}`}
          className="mt-1 h-2 w-full overflow-clip rounded-full bg-azul-100"
        >
          <span className="block h-2 rounded-full bg-azul" style={{ width: `${item.pct}%` }} />
        </div>
      </article>
    );
  }

  return (
    <article className={`${base} items-center gap-3 bg-white`}>
      <IconoCola icono={item.icono} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm leading-[21px] text-tinta">{item.archivo}</p>
          {item.tipo === "listo" ? (
            <span className="shrink-0 text-[15px] leading-[22.5px] font-bold text-tinta">{item.monto}</span>
          ) : (
            <span className="shrink-0 text-xs leading-[18px] text-tinta-suave">Calculando...</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] leading-[16.5px] text-tinta-suave">{item.hora}</span>
          {item.tipo === "listo" ? (
            <span className="flex items-center gap-1 rounded-full bg-azul-100 px-2.5 py-0.5 text-xs leading-4 font-bold text-oliva">
              <Ico src={`${S}/check.svg`} w={12.5} h={12.5} />
              Listo para revisar
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-lima px-2.5 py-0.5 text-xs leading-4 font-bold text-lima-tinta">
              <Ico src={`${S}/sync.svg`} w={10} h={10} className="animate-spin" />
              Leyendo con IA…
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Subir() {
  return (
    <>
      <HeaderResico seccion="Subir" />

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-fondo px-4 pt-16 pb-[208px]">
        {/* Bisie' te ayuda */}
        <section className="flex items-start gap-2 pt-1 pb-2">
          <div className="relative shrink-0">
            <MascotaBisie size={56} />
            <span className="absolute -right-1 -bottom-1 size-4 rounded-full bg-[#afd500]">
              <span className="absolute inset-0 animate-ping rounded-full bg-lima opacity-75" />
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-[1.25px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-lima p-3 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
            <p className="flex items-center gap-1 text-xs leading-4 font-extrabold tracking-[0.6px] text-lima-tinta uppercase">
              Bisie&apos; te ayuda
              <Ico src={`${S}/chispas.svg`} w={14.719} h={14.656} />
            </p>
            <p className="text-sm leading-[17.5px] text-lima-tinta">
              ¡Toma la foto donde haya buena luz! Yo detecto los totales y RFC en segundos.
            </p>
          </div>
        </section>

        {/* Acciones rápidas: suben y verifican de verdad (ver app/subir/acciones.ts) */}
        <FormularioSubida />

        {/* Cola */}
        <section className="flex flex-col gap-1.5 pt-2 pb-4">
          <div className="flex items-center justify-between py-1">
            <h2 className="flex items-center gap-2 text-xl leading-[26px] font-bold text-tinta">
              Cola de tickets
              <span className="rounded-full bg-azul-50 px-2 py-0.5 text-[10px] leading-4 font-bold text-tinta-suave uppercase">Ejemplo</span>
              <span className="rounded-full bg-azul-100 px-2.5 py-0.5 text-xs leading-4 font-bold text-tinta">
                {cola.length} archivos
              </span>
            </h2>
            <button className="text-xs leading-4 font-bold text-azul">Limpiar lista</button>
          </div>
          <p className="flex items-center gap-2.5 rounded-[48px] bg-[#f1f3ff] p-3 text-[13px] leading-[17.88px] text-tinta-suave">
            <Ico src={`${S}/escudo.svg`} w={14.667} h={18.333} />
            Si una foto falla, las demás siguen procesándose sin detenerse.
          </p>
        </section>

        <ul className="flex flex-col gap-2" aria-live="polite">
          {cola.map((it) => (
            <li key={it.archivo}>
              <Tarjeta item={it} />
            </li>
          ))}
        </ul>

        <details className="group mt-6 overflow-clip rounded-2xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between p-4">
            <span className="flex items-center gap-2 text-[15px] leading-[22.5px] text-tinta">
              <Ico src={`${S}/foco.svg`} w={13.75} h={18.333} />
              Consejos para una buena foto
            </span>
            <Ico src={`${S}/chevron.svg`} w={11} h={6.783} className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="list-disc px-10 pb-4 text-sm leading-5 text-tinta-suave">
            <li>Busca buena luz y evita reflejos sobre el total.</li>
            <li>Apoya el ticket en una superficie plana.</li>
            <li>Que se vea completo, de borde a borde.</li>
          </ul>
        </details>
      </main>

      {/* CTA flotante */}
      <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-[480px] px-4 pb-2">
        <Link
          href="/revision/detalle"
          className="flex min-h-[58px] items-center justify-between rounded-full bg-marca px-6 py-2.5 drop-shadow-[0px_12px_14px_rgba(186,11,0,0.36)]"
        >
          <span className="flex flex-col">
            <span className="text-xl leading-5 font-extrabold tracking-[-0.5px] text-white">Revisar 4 listos →</span>
            <span className="pt-1 text-xs leading-[15px] text-white/90">4 de 6 procesados</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs leading-4 font-extrabold text-marca shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
            <Ico src={`${S}/total.svg`} w={15} h={15} />
            $2,250.50
          </span>
        </Link>
      </div>

      <BottomNav activa="subir" />
    </>
  );
}

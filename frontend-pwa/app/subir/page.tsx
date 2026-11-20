import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { quitarFallido } from "@/app/subir/acciones";
import { BottomNav } from "@/components/BottomNav";
import { FormularioSubida } from "@/components/FormularioSubida";
import { HeaderResico } from "@/components/HeaderResico";
import { Ico, MascotaBisie } from "@/components/ui";
import { db } from "@/lib/db";
import { dinero, fechaCorta } from "@/lib/formato";
import { recientes, type Reciente } from "@/lib/operaciones";
import { requerirUsuario } from "@/lib/sesion";

/*
 * Pantalla 4 · Subir lote (Figma 1:632).
 * Los botones de cámara y galería suben, verifican y analizan de verdad (app/subir/acciones.ts)
 * y redirigen a /subir/recibido/[id]. Abajo se listan los últimos documentos de SQLite.
 * Como la foto no se guarda, un archivo que falló no se puede "reintentar": hay que volver a subirlo.
 */
const S = "/figma/subir";

function hora(iso: string) {
  return `${fechaCorta(iso)} • ${new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }).format(new Date(iso))} hrs`;
}

function Tarjeta({ item }: { item: Reciente }) {
  const base = "flex rounded-2xl p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]";
  const icono = item.tipo_mime === "application/pdf" ? ([`${S}/pdf.svg`, 21.667, 21.667] as const) : ([`${S}/recibo.svg`, 19.5, 21.667] as const);

  if (item.estado === "error") {
    return (
      <article role="alert" className={`${base} flex-col gap-2.5 bg-[#ffdad6]`}>
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[48px] bg-white">
            <Ico src={`${S}/alerta.svg`} w={21.667} h={21.667} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm leading-[21px] text-[#93000a]">{item.nombre_archivo}</p>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-error px-2 py-0.5 text-[11px] leading-[16.5px] font-bold text-white">
                <Ico src={`${S}/aviso.svg`} w={11.917} h={10.292} />
                No se pudo leer
              </span>
            </div>
            <p className="text-xs leading-[18px] text-[#93000a]">{item.error}</p>
            <p className="text-xs leading-[18px] text-[#93000a]/80">Vuelve a subir la foto: por tu privacidad no la guardamos.</p>
          </div>
        </div>
        <form action={quitarFallido} className="flex items-center justify-end gap-2 pt-1">
          <input type="hidden" name="id" value={item.id} />
          <button className="flex min-h-[38px] items-center gap-1 rounded-full bg-white px-3 text-xs leading-4 font-bold text-tinta-suave">
            <Ico src={`${S}/basura.svg`} w={10.667} h={12} />
            Quitar
          </button>
        </form>
      </article>
    );
  }

  const href = item.estado === "por_revisar" ? `/revision/sencillo?id=${item.id}` : `/revision/detalle?id=${item.id}`;
  return (
    <Link href={href} className={`${base} items-center gap-3 bg-white`}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[48px] bg-azul-50">
        <Ico src={icono[0]} w={icono[1]} h={icono[2]} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm leading-[21px] text-tinta">{item.contraparte ?? item.nombre_archivo}</p>
          <span className="shrink-0 text-[15px] leading-[22.5px] font-bold text-tinta">{dinero(item.total_centavos)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] leading-[16.5px] text-tinta-suave">{hora(item.creado_en)}</span>
          <span className="flex items-center gap-1">
            {item.analisis_simulado === 1 && <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">SIMULADO</span>}
            {item.estado === "por_revisar" ? (
              <span className="flex items-center gap-1 rounded-full bg-lima px-2.5 py-0.5 text-xs leading-4 font-bold text-lima-tinta">Listo para revisar</span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-azul-100 px-2.5 py-0.5 text-xs leading-4 font-bold text-oliva">
                <Ico src={`${S}/check.svg`} w={12.5} h={12.5} />
                Confirmado
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

async function Cola() {
  await connection();
  const u = await requerirUsuario();
  const lista = recientes(db(), u.id);
  const listos = lista.filter((x) => x.estado === "por_revisar");
  const totalListos = listos.reduce((s, x) => s + (x.total_centavos ?? 0), 0);

  return (
    <>
      <section className="flex flex-col gap-1.5 pt-2 pb-4">
        <div className="flex items-center justify-between py-1">
          <h2 className="flex items-center gap-2 text-xl leading-[26px] font-bold text-tinta">
            Lo último que subiste
            <span className="rounded-full bg-azul-100 px-2.5 py-0.5 text-xs leading-4 font-bold text-tinta">{lista.length}</span>
          </h2>
        </div>
        <p className="flex items-center gap-2.5 rounded-[48px] bg-[#f1f3ff] p-3 text-[13px] leading-[17.88px] text-tinta-suave">
          <Ico src={`${S}/escudo.svg`} w={14.667} h={18.333} />
          Si una foto falla, las demás siguen. Las fotos no se guardan, solo los datos leídos.
        </p>
      </section>

      {lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-tinta-suave">Todavía no has subido nada.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {lista.map((it) => (
            <li key={it.id}>
              <Tarjeta item={it} />
            </li>
          ))}
        </ul>
      )}

      {listos.length > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-[480px] px-4 pb-2">
          <Link
            href="/revision/sencillo"
            className="flex min-h-[58px] items-center justify-between rounded-full bg-marca px-6 py-2.5 drop-shadow-[0px_12px_14px_rgba(186,11,0,0.36)]"
          >
            <span className="text-xl leading-5 font-extrabold tracking-[-0.5px] text-white">
              Revisar {listos.length} {listos.length === 1 ? "listo" : "listos"} →
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs leading-4 font-extrabold text-marca">
              <Ico src={`${S}/total.svg`} w={15} h={15} />
              {dinero(totalListos)}
            </span>
          </Link>
        </div>
      )}
    </>
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
              ¡Toma la foto donde haya buena luz! Yo leo el total, la fecha y el RFC por ti.
            </p>
          </div>
        </section>

        {/* Suben, verifican y analizan de verdad (app/subir/acciones.ts) */}
        <FormularioSubida />

        <Suspense fallback={<p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-tinta-suave">Cargando lo último que subiste…</p>}>
          <Cola />
        </Suspense>

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

      <BottomNav activa="subir" />
    </>
  );
}

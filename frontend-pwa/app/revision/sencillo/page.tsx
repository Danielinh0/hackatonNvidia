import Link from "next/link";
import { BotonVoz } from "@/components/BotonVoz";
import { HeaderSecundario } from "@/components/HeaderSecundario";
import { Ico, MascotaBisie } from "@/components/ui";

/*
 * Pantalla 6 · Revisión de ticket, modo sencillo / accesibilidad (Figma 1:1243).
 * Un ticket a la vez, texto grande y lectura en voz alta (speechSynthesis es-MX).
 * Datos de ejemplo; "Sí, es correcto" todavía no guarda en Firestore.
 */
const S = "/figma/sencillo";

const resumenVoz =
  "Este ticket es de Abarrotes López por 245 pesos del 12 de noviembre. Es un gasto de tu negocio. ¿Es correcto?";

function Tarjeta({
  icono,
  titulo,
  accion,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1 text-base leading-6 font-bold tracking-[0.4px] text-azul uppercase">
          {icono}
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

function Editar({ label }: { label: string }) {
  return (
    <button aria-label={label} className="flex items-center gap-0.5 rounded-full p-1 text-base leading-6 font-bold text-azul">
      Editar
      <Ico src={`${S}/lapiz.svg`} w={12} h={12} />
    </button>
  );
}

export default function RevisionSencillo() {
  return (
    <>
      <HeaderSecundario
        atras="/subir"
        derecha={
          <>
            <button aria-label="Ayuda" className="flex size-11 items-center justify-center rounded-full">
              <Ico src="/figma/configurar/ayuda.svg" w={18.333} h={18.333} />
            </button>
            <span className="size-8 rounded-full bg-azul-150 drop-shadow-[0px_2px_3px_rgba(0,15,42,0.12)]" />
          </>
        }
      />

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 pt-16 pb-8">
        {/* Progreso y modo */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="flex items-center gap-1 rounded-full bg-azul-50 px-4 py-1 text-sm leading-5 font-extrabold tracking-[0.35px] text-tinta">
            <Ico src={`${S}/ticket.svg`} w={16.708} h={18.417} />
            Ticket 2 de 5
          </p>
          <div className="flex items-center rounded-full bg-azul-100 p-1">
            <span className="flex items-center gap-1 rounded-full bg-tinta px-3 py-1.5 text-base leading-6 text-white">
              <Ico src={`${S}/ojo.svg`} w={14.667} h={10} />
              Modo Sencillo
            </span>
            <Link href="/revision/detalle" className="px-3 py-1.5 text-base leading-6 text-tinta-suave">
              Detallado
            </Link>
          </div>
        </div>

        {/* Miniatura del ticket */}
        <section className="flex items-center gap-4 rounded-[32px] bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="relative flex h-24 w-20 shrink-0 overflow-clip rounded-[32px] bg-azul-50 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
            <div className="flex flex-1 flex-col justify-between bg-white p-2 font-mono">
              <p className="text-center text-[8px] leading-2 font-bold text-tinta">
                ABARROTES
                <br />
                LÓPEZ
              </p>
              <div className="flex flex-col gap-1">
                <span className="h-1 w-full rounded-full bg-azul-100" />
                <span className="h-1 w-[51px] rounded-full bg-azul-100" />
                <span className="h-1 w-12 rounded-full bg-azul-100" />
              </div>
              <p className="text-right text-[9px] leading-[9px] font-bold text-marca">$245.00</p>
            </div>
            <Ico src={`${S}/lupa-mini.svg`} w={19.667} h={28.5} className="absolute right-[2px] bottom-[1px]" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-base leading-6 tracking-[0.8px] text-azul uppercase">Comprobante físico</p>
            <h1 className="text-[19px] leading-6 font-extrabold text-tinta">Ticket #0842</h1>
            <button className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-azul-50 px-4 text-sm leading-5 font-bold text-tinta">
              <Ico src={`${S}/lupa.svg`} w={16.5} h={16.5} />
              Tocar para ampliar foto
            </button>
          </div>
        </section>

        {/* Bisie' pregunta */}
        <section className="flex items-start gap-2 rounded-[32px] bg-noche p-4 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <div className="flex shrink-0 flex-col items-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white p-1 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]">
              <MascotaBisie size={56} fondo="bg-white" />
            </span>
            <span className="mt-1 rounded-full bg-lima px-2 py-0.5 text-[10px] leading-[15px] font-extrabold tracking-[0.5px] text-lima-tinta uppercase">
              Bisie&apos;
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p
              aria-live="polite"
              className="rounded-tl-[2px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-lima-neon p-3.5 text-[17px] leading-[23.38px] font-bold text-noche-profunda"
            >
              &ldquo;Este ticket es de <u className="font-extrabold decoration-2">Abarrotes López</u> por{" "}
              <u className="font-extrabold decoration-2">$245.00</u> del <u className="font-extrabold decoration-2">12 de noviembre</u>.
              ¿Es correcto?&rdquo;
            </p>
            <BotonVoz texto={resumenVoz} />
          </div>
        </section>

        {/* Desglose */}
        <div className="flex flex-col gap-2">
          <Tarjeta icono={<Ico src={`${S}/tienda.svg`} w={15.07} h={13.5} />} titulo="¿Quién cobró?" accion={<Editar label="Editar quién cobró" />}>
            <p className="text-[26px] leading-[32.5px] font-extrabold tracking-[-0.65px] text-tinta">Abarrotes López</p>
            <p className="flex flex-wrap items-center gap-2 pt-[3px]">
              <span className="text-sm leading-5 font-bold text-tinta-suave">RFC: LOPA820412HR1</span>
              <span className="rounded-2xl bg-azul-50 px-2 py-0.5 text-[11px] leading-[16.5px] font-extrabold tracking-[0.55px] text-tinta-suave uppercase">
                Simulado
              </span>
            </p>
          </Tarjeta>

          <Tarjeta
            icono={<Ico src={`${S}/billete.svg`} w={16.5} h={12} />}
            titulo="¿Cuánto fue en total?"
            accion={
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f1f3ff] px-2 py-0.5 text-base leading-6 font-extrabold text-oliva">
                <Ico src={`${S}/comprobado.svg`} w={11.667} h={11.667} />
                Comprobado
              </span>
            }
          >
            <p className="flex items-baseline gap-2">
              <span className="text-[34px] leading-[34px] font-extrabold tracking-[-0.85px] text-tinta">$245.00</span>
              <span className="text-[19px] leading-6 font-bold text-tinta-suave">MXN</span>
            </p>
            <p className="text-base leading-6 text-tinta-suave">Total pagado en efectivo o tarjeta con IVA incluido</p>
          </Tarjeta>

          <Tarjeta icono={<Ico src={`${S}/calendario.svg`} w={13.5} h={15} />} titulo="¿Cuándo se pagó?" accion={<Editar label="Editar fecha de pago" />}>
            <p className="text-2xl leading-[30px] font-extrabold text-tinta">12 de noviembre</p>
            <p className="flex items-center gap-1 text-sm leading-5 font-bold text-tinta-suave">
              <Ico src={`${S}/reloj.svg`} w={13.333} h={13.333} />
              Registrado a las 14:30 hrs
            </p>
          </Tarjeta>

          <Tarjeta
            icono={<Ico src={`${S}/tipo.svg`} w={14.25} h={15} />}
            titulo="¿Qué tipo de movimiento es?"
            accion={
              <span className="shrink-0 rounded-2xl bg-azul-50 px-2 py-0.5 text-[11px] leading-[16.5px] font-extrabold tracking-[0.55px] text-tinta-suave uppercase">
                RESICO
              </span>
            }
          >
            <div className="flex items-center gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-azul-50">
                <Ico src={`${S}/bolsa.svg`} w={16} h={20} />
              </span>
              <div>
                <p className="text-[22px] leading-[27.5px] font-extrabold text-tinta">Gasto de tu negocio</p>
                <p className="text-base leading-6 text-tinta-suave">Egreso deducible para tu control del mes</p>
              </div>
            </div>
          </Tarjeta>
        </div>

        <p className="flex items-center justify-center gap-1.5 rounded-[32px] bg-azul-50 p-3 text-center text-base leading-6 font-bold text-tinta-suave drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <Ico src={`${S}/balanza.svg`} w={13.5} h={14.25} />
          ⚖️ Estimación, no es una determinación oficial del SAT
        </p>

        {/* Decisión */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/operaciones"
            className="flex min-h-[62px] items-center justify-center gap-3 rounded-full bg-[#1e8e4e] px-6 text-[23px] leading-[34.5px] font-extrabold tracking-[0.575px] text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <Ico src={`${S}/check.svg`} w={28.933} h={28.933} />
            Sí, es correcto ✓
          </Link>
          <Link
            href="/revision/detalle"
            className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-white p-4 text-[19px] leading-6 font-bold text-tinta drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Ico src={`${S}/corregir.svg`} w={18} h={16} />
            Corregir un dato ✏️
          </Link>
          <button className="mx-auto mt-2 flex min-h-11 items-center gap-1 px-4 text-base leading-6 font-bold text-error">
            <Ico src={`${S}/basura.svg`} w={12} h={13.5} />
            Descartar este ticket
          </button>
        </div>
      </main>
    </>
  );
}

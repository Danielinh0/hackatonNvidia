import Link from "next/link";
import { HeaderSecundario } from "@/components/HeaderSecundario";
import { Ico, MascotaBisie } from "@/components/ui";

/*
 * Pantalla 3 · Configuración inicial (Figma 1:475).
 * Vista estática con valores de ejemplo; aún no guarda en Firestore.
 * La clave 626 (RESICO PF) está pendiente de verificar en c_RegimenFiscal (CLAUDE.md sec. 12).
 */
const C = "/figma/configurar";

const input =
  "h-[52px] w-full rounded-[48px] bg-fondo text-base font-semibold text-tinta shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] outline-none focus:ring-2 focus:ring-azul";

export default function Configurar() {
  return (
    <>
      <HeaderSecundario
        atras="/bienvenida"
        derecha={
          <>
            <button aria-label="Ayuda de configuración" className="flex size-11 items-center justify-center rounded-full">
              <Ico src={`${C}/ayuda.svg`} w={18.333} h={18.333} />
            </button>
            <span className="size-8 rounded-full bg-azul-150 drop-shadow-[0px_2px_3px_rgba(0,15,42,0.12)]" />
          </>
        }
      />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-5 bg-fondo px-4 pt-16 pb-8">
        {/* Progreso */}
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-xs leading-4 font-bold tracking-[0.6px] text-azul uppercase">Configuración inicial</p>
            <p className="flex items-center gap-1 rounded-full bg-durazno/40 px-2.5 py-0.5 text-sm leading-5 font-bold text-marca">
              <Ico src={`${C}/paso.svg`} w={10.667} h={13.333} />
              Paso 1 de 2
            </p>
          </div>
          <ol className="flex gap-2 pt-1">
            <li className="flex flex-1 flex-col gap-1.5">
              <span className="h-2 w-full rounded-full bg-marca-viva" />
              <span className="flex items-center gap-1 text-xs leading-4 font-bold text-tinta">
                <Ico src={`${C}/radio-on.svg`} w={12.5} h={12.5} />
                1. Negocio y RFC
              </span>
            </li>
            <li className="flex flex-1 flex-col gap-1.5">
              <span className="h-2 w-full rounded-full bg-azul-200" />
              <span className="flex items-center gap-1 text-xs leading-4 font-bold text-tinta-suave">
                <Ico src={`${C}/radio-off.svg`} w={12.5} h={12.5} />
                2. Régimen fiscal
              </span>
            </li>
          </ol>
        </section>

        {/* Consejo de Bisie' */}
        <aside className="flex items-start gap-3 rounded-2xl bg-[#f1f3ff] p-3.5 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="relative shrink-0">
            <span className="flex size-14 items-center justify-center overflow-clip rounded-2xl bg-white p-1 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <MascotaBisie size={48} />
            </span>
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-lima">
              <Ico src={`${C}/chispa.svg`} w={12.756} h={12.702} />
            </span>
          </div>
          <p className="flex-1 rounded-tl-[2px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl bg-lima px-3 py-3 text-sm leading-[19.25px] font-semibold text-lima-tinta drop-shadow-[0px_2px_5px_rgba(212,255,36,0.35)]">
            &ldquo;Con tu RFC sé qué tickets son tus{" "}
            <b className="underline decoration-marca decoration-2">ventas</b> y cuáles son tus{" "}
            <b className="underline decoration-azul decoration-2">compras</b>. ¡Cero confusión!&rdquo;
          </p>
        </aside>

        {/* Paso 1: negocio y RFC */}
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-start gap-2">
              <span className="mt-1 flex h-6 w-[20.67px] shrink-0 items-center justify-center rounded-full bg-marca text-xs leading-4 font-bold text-white">
                1
              </span>
              <h1 className="text-2xl leading-8 font-bold text-tinta">¿Cómo se llama tu negocio?</h1>
            </div>
            <p className="pl-8 text-base leading-6 text-tinta-suave">
              Personaliza tus reportes y la organización de tus facturas.
            </p>
          </div>

          <form className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="negocio" className="text-sm leading-5 font-semibold text-tinta">
                  Nombre de tu negocio o actividad
                </label>
                <span className="shrink-0 text-xs leading-4 font-bold text-[#926f69]">Visible en tu app</span>
              </div>
              <div className="relative">
                <Ico src={`${C}/tienda.svg`} w={16.745} h={15} className="absolute top-4 left-3.5" />
                <input id="negocio" defaultValue="Tlayudas Doña Mari" className={`${input} pr-4 pl-11`} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="rfc" className="text-sm leading-5 font-semibold text-tinta">
                  RFC con homoclave
                </label>
                <span className="text-xs leading-4 font-bold tracking-[0.3px] text-azul uppercase">13 caracteres</span>
              </div>
              <div className="relative">
                <Ico src={`${C}/rfc.svg`} w={16.667} h={16.667} className="absolute top-4 left-3.5" />
                <input
                  id="rfc"
                  defaultValue="MARI880415HR9"
                  maxLength={13}
                  autoCapitalize="characters"
                  className={`${input} px-11 tracking-[0.8px] uppercase`}
                />
                <Ico src={`${C}/ok.svg`} w={18.333} h={18.333} className="absolute top-[15px] right-3" />
              </div>
              <p className="flex w-fit items-center gap-1.5 rounded-[32px] bg-azul-100 px-3 py-1.5 text-xs leading-4 font-bold text-tinta">
                <Ico src={`${C}/valido.svg`} w={16.133} h={15.433} />
                Formato de RFC válido (Persona Física)
              </p>
              <p className="flex items-start gap-1.5 pt-1 text-sm leading-[22.75px] font-semibold text-tinta-suave">
                <Ico src={`${C}/foco.svg`} w={11.25} h={17} className="mt-0.5" />
                <span>
                  Lo encuentras en tu constancia de situación fiscal.{" "}
                  <button type="button" className="inline-flex items-center gap-0.5 font-bold text-azul underline">
                    Ver ejemplo
                    <Ico src={`${C}/externo.svg`} w={10.5} h={10.5} />
                  </button>
                </span>
              </p>
            </div>
          </form>
        </section>

        {/* Paso 2: régimen */}
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-6 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl leading-8 font-bold text-tinta">
              <span className="flex size-6 items-center justify-center rounded-full bg-azul text-xs leading-4 font-bold text-white">
                2
              </span>
              Tu régimen fiscal
            </h2>
            <span className="rounded-full bg-azul-50 px-2.5 py-1 text-xs leading-4 font-bold text-azul">SAT 2024</span>
          </div>
          {/* Copy ajustado respecto al boceto ("calcula tus impuestos automáticamente"):
              CLAUDE.md sec. 12 indica que solo se muestran estimaciones y no se calcula ISR. */}
          <p className="text-base leading-6 text-tinta-suave">
            Dzuun te muestra estimaciones según las reglas de tu régimen. No es una determinación oficial del SAT.
          </p>

          <div
            role="radio"
            aria-checked
            className="flex flex-col gap-3 rounded-[48px] bg-[#f1f3ff] p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-[48px] bg-lima">
                  <Ico src={`${C}/alcancia.svg`} w={16.667} h={15.833} />
                </span>
                <span className="mt-1 rounded-full bg-lima px-2 py-0.5 text-xs leading-4 font-bold text-lima-tinta">Recomendado</span>
              </div>
              <span className="flex size-6 items-center justify-center rounded-full bg-azul">
                <Ico src={`${C}/check.svg`} w={11.933} h={9.1} />
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[19px] leading-6 font-bold text-tinta">RESICO persona física (626)</h3>
              <p className="text-sm leading-[22.75px] font-semibold text-tinta-suave">
                Régimen Simplificado de Confianza para personas físicas con actividad empresarial o profesional. Tasa
                preferencial del 1.0% al 2.5% de ISR.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="flex items-center gap-1 text-xs leading-4 font-bold text-oliva">
                <Ico src={`${C}/porcentaje.svg`} w={10.667} h={10.667} />
                Tasa ISR: 1.0% actual
              </span>
              <button type="button" className="flex h-10 items-center gap-1 rounded-[48px] bg-azul-100 px-4 text-sm leading-5 font-bold text-azul">
                Cambiar de régimen
                <Ico src={`${C}/ajustes.svg`} w={12} h={12} />
              </button>
            </div>
          </div>
        </section>

        {/* Guardar */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/"
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-marca-viva text-[19px] leading-6 font-bold text-[#fffbff] shadow-[0px_10px_15px_-3px_rgba(227,36,17,0.25),0px_4px_6px_-4px_rgba(227,36,17,0.25)]"
          >
            Guardar y empezar
            <Ico src={`${C}/flecha.svg`} w={16.225} h={16.225} />
          </Link>
          <p className="flex items-center justify-center gap-1.5 px-4 text-center text-xs leading-4 font-bold text-tinta-suave">
            <Ico src={`${C}/escudo.svg`} w={10.667} h={13.333} />
            Podrás modificar estos datos en cualquier momento desde tu perfil.
          </p>
        </div>
      </main>
    </>
  );
}

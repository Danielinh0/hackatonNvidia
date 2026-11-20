import Link from "next/link";
import { Ico, MascotaBisie } from "./ui";

/*
 * Pantalla 2 · Bienvenida y login (Figma 1:2985), con sus variantes
 * "Cargando Google" (1:2662) y "Error de conexión" (1:2819).
 * Vista estática: el botón de Google solo navega a la variante de carga;
 * todavía no llama a Firebase Auth.
 */
const B = "/figma/bienvenida";

export type EstadoLogin = "inicial" | "cargando" | "error";

const pasosApp = [
  {
    n: 1,
    etiqueta: "Captura",
    color: "text-azul",
    titulo: "Toma foto de tus tickets",
    texto: "Sin formatos ni datos manuales",
    icono: { src: `${B}/paso-camara.svg`, w: 21.667, h: 19.5, bg: "bg-azul-100" },
    mini: "bg-durazno/30",
  },
  {
    n: 2,
    etiqueta: "Procesamiento",
    color: "text-oliva",
    titulo: "Bisie' los lee y los ordena",
    texto: "Detecta RFC, total e impuestos",
    icono: { src: `${B}/paso-magia.svg`, w: 23.833, h: 23.833, bg: "bg-lima/30" },
    mini: "bg-lima/40",
  },
  {
    n: 3,
    etiqueta: "Validación",
    color: "text-marca",
    titulo: "Tú revisas y guardas",
    texto: "Control total con un solo toque",
    icono: { src: `${B}/paso-check.svg`, w: 21.667, h: 21.667, bg: "bg-durazno" },
    mini: "bg-durazno/40",
  },
];

// Guía informativa (CLAUDE.md sec. 10/21: verificar contra la ficha vigente del SAT).
const pasosSat = [
  "Consulta si ya tienes RFC con tu CURP",
  "Inscríbete en el RFC en línea o con cita en una oficina del SAT",
  "Crea tu Contraseña y tramita tu e.firma (lleva una memoria USB a tu cita)",
  "Elige tu régimen, por ejemplo RESICO, y tu actividad",
  "Descarga tu Constancia de Situación Fiscal",
];

function Eslogan() {
  return (
    <h1 className="max-w-[320px] text-center text-[28px] leading-[35px] font-extrabold text-noche-profunda">
      Con Dzuun trabajas menos, facturas{" "}
      <span className="inline-block -rotate-1 rounded-[32px] bg-lima-neon px-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        más
      </span>
    </h1>
  );
}

function Privacidad() {
  return (
    <p className="flex items-center gap-1.5 pt-1 text-xs leading-4 font-bold text-tinta-suave/80">
      <Ico src={`${B}/candado.svg`} w={10.667} h={14} />
      Usamos tus fotos solo para leer tus tickets
    </p>
  );
}

function BotonGoogle() {
  return (
    <Link
      href="/bienvenida/cargando"
      className="flex h-14 w-full items-center justify-center gap-4 rounded-full bg-marca-brillante shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-white">
        <Ico src={`${B}/google.svg`} w={16} h={16} />
      </span>
      <span className="text-[19px] leading-6 font-bold tracking-[-0.475px] text-white">Continuar con Google</span>
    </Link>
  );
}

function HeroInicial({ cargando }: { cargando: boolean }) {
  return (
    <>
      <div className="flex items-center gap-1 pb-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-noche-profunda">
          <Ico src={`${B}/logo.svg`} w={16.995} h={16.992} />
        </span>
        <span className="text-2xl leading-8 font-extrabold tracking-[-0.6px] text-noche-profunda">Dzuun</span>
      </div>
      <p className="mb-4 flex items-center gap-1 rounded-full bg-lima px-4 py-1 text-xs leading-4 font-bold tracking-[0.6px] text-noche-profunda uppercase">
        <Ico src={`${B}/pildora.svg`} w={16.538} h={16.538} />
        ¡Hola! Soy Bisie&apos;
      </p>
      {/* Ilustración de Bisie' pendiente en Figma */}
      <MascotaBisie size={176} className="mb-4" />
      <div className="pb-2">
        <Eslogan />
      </div>
      <p className="pb-8 text-center text-base leading-6 text-tinta-suave">
        Toma fotos, Bisie&apos; las ordena y tú confirmas
      </p>

      {cargando ? (
        <div className="flex w-full max-w-[384px] flex-col items-center gap-2" aria-live="polite">
          <button
            disabled
            className="flex h-[52px] w-full items-center justify-center gap-3 overflow-clip rounded-full bg-white px-4 opacity-95 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <Ico src={`${B}/spinner.svg`} w={20} h={20} className="animate-spin" />
            <span className="text-[19px] leading-6 font-bold text-tinta">Conectando con Google...</span>
          </button>
          <p className="flex w-full items-center gap-2 bg-azul-150/50 p-2 text-xs leading-[15px] font-bold text-azul-tinta shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul">
              <Ico src={`${B}/sync.svg`} w={12} h={12} />
            </span>
            Espera un momento mientras verificamos tu cuenta...
          </p>
          <Privacidad />
        </div>
      ) : (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-2">
          <BotonGoogle />
          <Privacidad />
        </div>
      )}
    </>
  );
}

function HeroError() {
  return (
    <>
      <div className="flex flex-col items-center pt-1 pb-2">
        <p className="relative mb-2 flex items-center gap-1 rounded-full bg-lima px-4 py-1 text-sm leading-5 font-bold text-lima-tinta">
          <Ico src={`${B}/nube-error.svg`} w={16.5} h={14.85} />
          ¡Ups! Ocurrió un pequeño problema de conexión.
          <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-lima" />
        </p>
        <MascotaBisie size={112} />
      </div>
      <div className="flex flex-col items-center gap-1 pb-4">
        <Eslogan />
        <p className="text-center text-base leading-6 text-tinta-suave">Toma fotos, Bisie&apos; las ordena y tú confirmas.</p>
      </div>
      <div
        role="alert"
        className="mb-4 flex w-full max-w-[384px] flex-col gap-4 overflow-clip rounded-[48px] bg-[rgba(255,218,214,0.6)] p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
      >
        <div className="flex items-start gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error">
            <Ico src={`${B}/sin-wifi.svg`} w={22} h={18.15} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-[19px] leading-[26px] font-bold text-error">No pudimos conectar con Google</h2>
            <p className="text-base leading-6 text-tinta">
              Revisa tu conexión a internet o intenta nuevamente en unos segundos.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/bienvenida/cargando"
            className="flex min-h-[52px] items-center justify-center gap-1 rounded-full bg-marca py-3.5 text-[19px] leading-6 font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <Ico src={`${B}/reintentar.svg`} w={16} h={16} />
            Reintentar
          </Link>
          <Link
            href="/bienvenida/cargando"
            className="flex min-h-12 items-center justify-center gap-1 rounded-full bg-white py-3 text-base leading-6 font-semibold text-azul drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Ico src={`${B}/google.svg`} w={20} h={20} />
            O continuar con Google de nuevo
          </Link>
        </div>
      </div>
      <Privacidad />
    </>
  );
}

export function Bienvenida({ estado }: { estado: EstadoLogin }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-fondo">
      {/* 1 · Héroe */}
      <section className="relative flex flex-col items-center overflow-clip bg-crema px-5 py-8">
        <span className="absolute -top-12 -right-12 size-48 rounded-full bg-lima/25 blur-[40px]" />
        <span className="absolute top-1/3 -left-16 h-56 w-56 rounded-full bg-durazno/20 blur-[64px]" />
        <div className="relative flex w-full flex-col items-center">
          {estado === "error" ? <HeroError /> : <HeroInicial cargando={estado === "cargando"} />}
        </div>
      </section>

      {/* 2 · Cómo funciona */}
      <section className="flex flex-col items-center bg-crema-clara px-5 py-8">
        <div className="flex flex-col items-center gap-1 pb-6 text-center">
          <h2 className="text-2xl leading-8 font-bold text-noche-profunda">Así de fácil</h2>
          <p className="text-base leading-6 text-tinta-suave">Organiza tus gastos en tres pasos simples</p>
        </div>
        <ol className="relative flex w-full max-w-[384px] flex-col gap-4">
          <span className="absolute top-10 bottom-10 left-8 border-l-2 border-dashed border-azul/30" />
          {pasosApp.map((p) => (
            <li key={p.n} className="relative flex items-center gap-4 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-[48px] ${p.icono.bg}`}>
                <Ico src={p.icono.src} w={p.icono.w} h={p.icono.h} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-noche-profunda px-2 text-[10px] leading-6 font-bold text-white">{p.n}</span>
                  <span className={`text-xs leading-4 font-bold uppercase ${p.color}`}>{p.etiqueta}</span>
                </div>
                <h3 className="pt-0.5 text-[19px] leading-6 font-bold text-noche-profunda">{p.titulo}</h3>
                <p className="text-sm leading-5 font-semibold text-tinta-suave/80">{p.texto}</p>
              </div>
              {/* Mini ilustración de Bisie' pendiente en Figma */}
              <span className={`size-8 shrink-0 rounded-full ${p.mini}`} />
            </li>
          ))}
        </ol>
      </section>

      {/* 3 · Alta en el SAT (guía informativa) */}
      <section className="flex flex-col items-center bg-crema px-5 py-8">
        <div className="relative flex w-full max-w-[384px] flex-col overflow-clip rounded-3xl bg-noche-profunda p-6 shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]">
          <span className="absolute -right-8 -bottom-8 size-32 rounded-full bg-lima-neon/10 blur-[24px]" />
          <h3 className="pb-2 text-2xl leading-[30px] font-bold text-lima-neon">¿Aún no te has dado de alta en el SAT?</h3>
          <p className="pb-6 text-base leading-6 text-white/80">Recuerda que con Dzuun facturar nunca había sido tan fácil</p>
          <ol className="flex flex-col gap-4 pb-6">
            {[...pasosSat, null].map((txt, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-lima-neon text-xs leading-4 font-extrabold text-noche-profunda">
                  {i + 1}
                </span>
                {txt ? (
                  <span className="text-base leading-[22px] text-white/95">{txt}</span>
                ) : (
                  <span className="text-base leading-[22px] font-bold text-lima-neon">Regístrala en Dzuun y empieza</span>
                )}
              </li>
            ))}
          </ol>
          <p className="mb-6 flex items-center gap-1 rounded-[48px] bg-white/10 p-2 text-xs leading-[15px] font-bold text-white/75">
            <Ico src={`${B}/info.svg`} w={15} h={15} />
            Guía informativa. Los requisitos pueden cambiar; confírmalos en el SAT.
          </p>
          <a
            href="https://www.sat.gob.mx"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-1.5 text-sm leading-5 font-semibold text-lima-neon underline decoration-1"
          >
            Para más información ingresa al portal del SAT
            <Ico src={`${B}/externo.svg`} w={12} h={12} />
          </a>
        </div>
      </section>

      {/* 4 · Pie */}
      <footer className="flex flex-col items-center bg-crema-clara px-5 py-8">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
          <Link
            href="/"
            aria-disabled={estado === "cargando"}
            className={`flex h-12 w-full items-center justify-center gap-1 rounded-full bg-azul-marca text-[19px] leading-6 font-bold text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] ${
              estado === "cargando" ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Ya tengo cuenta, entrar
            <Ico src={`${B}/flecha.svg`} w={13.333} h={13.333} />
          </Link>
          <p className="text-center text-xs leading-[19.5px] font-bold text-tinta-suave/70">
            Dzuun es una herramienta de organización interna. Para timbrar facturas válidas, vincula tu certificado de
            sello digital (CSD) o consulta a tu PAC certificado. Términos y Aviso de privacidad.
          </p>
          <p className="flex items-center gap-1 text-[11px] leading-6 text-tinta-suave/50">
            <span>© 2025 Dzuun México</span>
            <span>•</span>
            <span>Hecho con alegría</span>
          </p>
        </div>
      </footer>
    </main>
  );
}

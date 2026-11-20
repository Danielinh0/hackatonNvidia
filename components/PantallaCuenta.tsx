import Link from "next/link";
import { Suspense } from "react";
import { siguienteSeguro } from "@/lib/rutas";
import { FormularioCuenta } from "./FormularioCuenta";
import { Ico, MascotaBisie } from "./ui";

/*
 * Marco de /entrar y /registro con la identidad de "Bienvenida" (Figma 1:2985):
 * marca Dzuun, Bisie' con globo lima y fondo crema.
 * Los parámetros de la URL (?siguiente=, ?motivo=) se leen dentro de <Suspense>.
 */
type Params = Promise<{ siguiente?: string | string[]; motivo?: string | string[] }>;

const AVISOS: Record<string, string> = {
  caducada: "Tu sesión terminó. Vuelve a entrar para continuar.",
  salida: "Cerraste sesión. ¡Hasta pronto!",
};

async function Contenido({ modo, searchParams }: { modo: "entrar" | "registro"; searchParams: Params }) {
  const p = await searchParams;
  const siguiente = siguienteSeguro(p.siguiente, modo === "registro" ? "/configurar" : "/");
  const aviso = typeof p.motivo === "string" ? AVISOS[p.motivo] : undefined;
  return (
    <>
      {aviso && (
        <p role="status" className="rounded-2xl bg-azul-100 px-4 py-3 text-sm leading-5 font-bold text-tinta">
          {aviso}
        </p>
      )}
      {siguiente !== "/" && siguiente !== "/configurar" && (
        <p className="px-1 text-xs leading-4 font-bold text-tinta-suave">
          Al entrar te llevamos a <span className="font-mono text-azul">{siguiente}</span>
        </p>
      )}
      <FormularioCuenta modo={modo} siguiente={siguiente} />
    </>
  );
}

export function PantallaCuenta({ modo, searchParams }: { modo: "entrar" | "registro"; searchParams: Params }) {
  const titulo = modo === "entrar" ? "Qué gusto verte de nuevo" : "Crea tu cuenta";
  const globo = modo === "entrar" ? "¡Hola otra vez! Soy Bisie'" : "¡Hola! Soy Bisie'";

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-clip bg-crema px-5 pt-4 pb-10">
      <span className="absolute -top-12 -right-12 size-48 rounded-full bg-lima/25 blur-[40px]" />
      <span className="absolute top-1/3 -left-16 size-56 rounded-full bg-durazno/20 blur-[64px]" />

      <div className="relative flex items-center justify-between">
        <Link href="/bienvenida" aria-label="Regresar" className="-ml-2 flex size-11 items-center justify-center rounded-full">
          <Ico src="/figma/configurar/atras.svg" w={16} h={16} />
        </Link>
        <span className="flex items-center gap-1">
          <span className="flex size-8 items-center justify-center rounded-full bg-noche-profunda">
            <Ico src="/figma/bienvenida/logo.svg" w={13.6} h={13.6} />
          </span>
          <span className="text-xl leading-7 font-extrabold tracking-[-0.5px] text-noche-profunda">Dzuun</span>
        </span>
        <span className="size-11" />
      </div>

      <div className="relative flex flex-col items-center gap-3 pt-6 pb-6">
        <p className="flex items-center gap-1 rounded-full bg-lima px-4 py-1 text-xs leading-4 font-bold tracking-[0.6px] text-noche-profunda uppercase">
          <Ico src="/figma/bienvenida/pildora.svg" w={16.538} h={16.538} />
          {globo}
        </p>
        <MascotaBisie size={96} />
        <h1 className="text-center text-[28px] leading-[35px] font-extrabold text-noche-profunda">{titulo}</h1>
        <p className="text-center text-base leading-6 text-tinta-suave">
          {modo === "entrar" ? "Entra con tu correo y contraseña." : "Toma fotos, Bisie' las ordena y tú confirmas."}
        </p>
      </div>

      <section className="relative flex flex-col gap-4 rounded-[32px] bg-white p-5 shadow-tarjeta">
        <Suspense fallback={<p className="py-8 text-center text-sm font-semibold text-tinta-suave">Cargando…</p>}>
          <Contenido modo={modo} searchParams={searchParams} />
        </Suspense>
      </section>

      <p className="relative flex items-center justify-center gap-1.5 pt-5 text-xs leading-4 font-bold text-tinta-suave/80">
        <Ico src="/figma/bienvenida/candado.svg" w={10.667} h={14} />
        Tu cuenta y tus fotos se guardan solo en el servidor de Dzuun
      </p>
    </main>
  );
}

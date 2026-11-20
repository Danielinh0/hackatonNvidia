import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { obtenerNegocio } from "@/lib/negocio";
import { requerirUsuario } from "@/lib/sesion";
import { FormularioNegocio } from "@/components/FormularioNegocio";
import { HeaderSecundario } from "@/components/HeaderSecundario";

/*
 * Pantalla 3 · Configuración inicial (Figma 1:475). Guarda el negocio en SQLite (tabla `negocios`).
 * La clave 626 (RESICO PF) está pendiente de verificar en c_RegimenFiscal (CLAUDE.md sec. 12).
 */

async function Formulario() {
  await connection();
  const u = await requerirUsuario();
  return <FormularioNegocio guardado={obtenerNegocio(db(), u.id)} />;
}

export default function Configurar() {
  return (
    <>
      <HeaderSecundario atras="/" />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-5 bg-fondo px-4 pt-16 pb-8">
        <Suspense fallback={<p className="rounded-2xl bg-white p-6 text-center font-semibold text-tinta-suave">Cargando tus datos…</p>}>
          <Formulario />
        </Suspense>

        {/* Cuenta conectada (no está en el boceto; necesaria para poder salir) */}
        <section className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <Suspense fallback={<span className="text-sm text-tinta-suave">Cargando cuenta…</span>}>
            <CuentaConectada />
          </Suspense>
          <form action="/auth/salir" method="post">
            <button className="min-h-11 shrink-0 rounded-full bg-azul-50 px-4 text-sm leading-5 font-bold text-azul">
              Cerrar sesión
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

async function CuentaConectada() {
  const u = await requerirUsuario();
  return (
    <p className="flex min-w-0 flex-col text-sm leading-5">
      <span className="font-bold text-tinta">Tu cuenta</span>
      <span className="truncate text-tinta-suave">{u.email}</span>
    </p>
  );
}

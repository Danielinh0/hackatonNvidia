"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { entrar, registrarse, type EstadoCuenta } from "@/app/entrar/acciones";
import { Ico } from "./ui";

/*
 * Formulario de acceso local (entrar / crear cuenta), con el estilo de los campos de
 * "Configuración inicial" (Figma 1:521) y los botones de "Bienvenida" (Figma 1:3016).
 */
const C = "/figma/configurar";
const inicial: EstadoCuenta = { error: null, campos: {}, valores: {} };

const claseInput =
  "h-[52px] w-full rounded-[48px] bg-fondo pr-4 pl-11 text-base font-semibold text-tinta shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] outline-none placeholder:font-normal placeholder:text-tinta-suave/60 focus:ring-2 focus:ring-azul aria-invalid:ring-2 aria-invalid:ring-error";

function Campo(props: {
  id: "nombre" | "email" | "contrasena";
  etiqueta: string;
  icono: [string, number, number];
  error?: string;
  children: (attrs: { id: string; name: string; "aria-invalid"?: true; "aria-describedby"?: string; className: string }) => React.ReactNode;
  ayuda?: string;
}) {
  const errorId = `${props.id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="text-sm leading-5 font-semibold text-tinta">
        {props.etiqueta}
      </label>
      <div className="relative">
        <Ico src={props.icono[0]} w={props.icono[1]} h={props.icono[2]} className="pointer-events-none absolute top-4 left-3.5" />
        {props.children({
          id: props.id,
          name: props.id,
          className: claseInput,
          ...(props.error ? { "aria-invalid": true as const, "aria-describedby": errorId } : {}),
        })}
      </div>
      {props.error ? (
        <p id={errorId} className="flex items-center gap-1 px-2 text-xs leading-4 font-bold text-error">
          <Ico src="/figma/subir/aviso.svg" w={11.917} h={10.292} />
          {props.error}
        </p>
      ) : (
        props.ayuda && <p className="px-2 text-xs leading-4 font-bold text-tinta-suave">{props.ayuda}</p>
      )}
    </div>
  );
}

export function FormularioCuenta({ modo, siguiente }: { modo: "entrar" | "registro"; siguiente: string }) {
  const [estado, accion, enviando] = useActionState(modo === "entrar" ? entrar : registrarse, inicial);
  const [ver, setVer] = useState(false);
  const qs = siguiente !== "/" ? `?siguiente=${encodeURIComponent(siguiente)}` : "";

  return (
    <form action={accion} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="siguiente" value={siguiente} />

      {estado.error && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm leading-5 font-bold text-[#93000a]">
          <Ico src="/figma/subir/aviso.svg" w={11.917} h={10.292} />
          {estado.error}
        </p>
      )}

      {modo === "registro" && (
        <Campo id="nombre" etiqueta="¿Cómo te llamas?" icono={[`${C}/tienda.svg`, 16.745, 15]} error={estado.campos.nombre}>
          {(a) => <input {...a} key={estado.valores.nombre} defaultValue={estado.valores.nombre} autoComplete="name" placeholder="Mari López" required />}
        </Campo>
      )}

      <Campo id="email" etiqueta="Correo" icono={[`${C}/rfc.svg`, 16.667, 16.667]} error={estado.campos.email}>
        {(a) => (
          <input
            {...a}
            key={estado.valores.email}
            defaultValue={estado.valores.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="mari@ejemplo.mx"
            required
          />
        )}
      </Campo>

      <Campo
        id="contrasena"
        etiqueta="Contraseña"
        icono={[`${C}/escudo.svg`, 10.667, 13.333]}
        error={estado.campos.contrasena}
        ayuda={modo === "registro" ? "Al menos 8 caracteres." : undefined}
      >
        {(a) => (
          <>
            <input
              {...a}
              className={`${a.className} pr-24`}
              type={ver ? "text" : "password"}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              minLength={modo === "registro" ? 8 : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              aria-pressed={ver}
              className="absolute top-1.5 right-1.5 h-10 rounded-full bg-azul-50 px-3 text-xs leading-4 font-bold text-azul"
            >
              {ver ? "Ocultar" : "Mostrar"}
            </button>
          </>
        )}
      </Campo>

      <button
        disabled={enviando}
        className="mt-2 flex h-14 items-center justify-center gap-2 rounded-full bg-marca-brillante text-[19px] leading-6 font-bold tracking-[-0.475px] text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] disabled:opacity-70"
      >
        {enviando ? (
          <>
            <Ico src="/figma/bienvenida/spinner.svg" w={20} h={20} className="animate-spin rounded-full bg-white" />
            {modo === "entrar" ? "Entrando…" : "Creando tu cuenta…"}
          </>
        ) : modo === "entrar" ? (
          "Entrar"
        ) : (
          "Crear mi cuenta"
        )}
      </button>

      <p className="text-center text-sm leading-5 font-semibold text-tinta-suave">
        {modo === "entrar" ? (
          <>
            ¿Aún no tienes cuenta?{" "}
            <Link href={`/registro${qs}`} className="font-bold text-azul underline">
              Crear cuenta
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href={`/entrar${qs}`} className="font-bold text-azul underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

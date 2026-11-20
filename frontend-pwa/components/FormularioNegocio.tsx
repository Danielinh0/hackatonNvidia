"use client";

import { useActionState, useState } from "react";
import { guardarConfiguracion, type EstadoNegocio } from "@/app/configurar/acciones";
import { REGIMENES, tipoRfc, type Negocio } from "@/lib/negocio";
import { Ico, MascotaBisie } from "./ui";

/*
 * Pantalla 3 · Configuración inicial (Figma 1:475) conectada a SQLite (tabla `negocios`).
 * Campos vacíos con ejemplos en el placeholder; si ya hay negocio guardado se precargan sus datos reales.
 * El progreso de arriba es fijo (sticky) y se actualiza mientras se escribe: dice qué falta.
 */
const C = "/figma/configurar";
const inicial: EstadoNegocio = { errores: {}, error: null };

const input =
  "h-[52px] w-full rounded-[48px] bg-fondo text-base font-semibold text-tinta shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] outline-none placeholder:font-medium placeholder:text-tinta-suave/50 focus:ring-2 focus:ring-azul aria-invalid:ring-2 aria-invalid:ring-error";

export function FormularioNegocio({ guardado }: { guardado: Negocio | null }) {
  const [estado, enviar, enviando] = useActionState(guardarConfiguracion, inicial);
  const [nombre, setNombre] = useState(guardado?.nombre ?? "");
  const [rfc, setRfc] = useState(guardado?.rfc ?? "");
  const [regimen, setRegimen] = useState<string>(guardado?.regimen ?? "");

  const tipo = tipoRfc(rfc);
  const nombreOk = nombre.trim().length >= 2;
  const rfcOk = tipo === "fisica";
  const regimenOk = regimen !== "";
  const paso1 = nombreOk && rfcOk;
  const listo = paso1 && regimenOk;

  const faltan = [!nombreOk && "nombre del negocio", !rfcOk && "RFC", !regimenOk && "régimen fiscal"].filter(Boolean) as string[];
  const avance1 = (Number(nombreOk) + Number(rfcOk)) * 50;

  // Mensaje del RFC mientras se escribe (sin regañar antes de tiempo).
  const rfcLargo = rfc.trim().length;
  const avisoRfc =
    rfcLargo === 0 ? null
    : tipo === "fisica" ? null
    : tipo === "moral" ? "Es un RFC de persona moral (12). Para estos regímenes usa el de persona física (13)."
    : rfcLargo >= 12 ? "El formato no parece válido: 4 letras, 6 números de tu fecha y 3 de homoclave."
    : null;

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      {/* Progreso fijo arriba */}
      <section
        aria-label="Progreso de la configuración"
        className="sticky top-16 z-20 -mx-4 flex flex-col gap-2 bg-fondo/95 px-4 pt-2 pb-3 backdrop-blur-[12px]"
      >
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <p className="text-xs leading-4 font-bold tracking-[0.6px] text-azul uppercase">Configuración inicial</p>
            {listo ? (
              <p className="flex items-center gap-1 rounded-full bg-[#1e8e4e]/10 px-2.5 py-0.5 text-sm leading-5 font-bold text-[#1e8e4e]">
                ✓ Todo listo
              </p>
            ) : (
              <p className="flex items-center gap-1 rounded-full bg-durazno/40 px-2.5 py-0.5 text-sm leading-5 font-bold text-marca">
                <Ico src={`${C}/paso.svg`} w={10.667} h={13.333} />
                Paso {paso1 ? 2 : 1} de 2
              </p>
            )}
          </div>
          <ol className="flex gap-2">
            {[
              { n: 1, label: "Negocio y RFC", avance: avance1, hecho: paso1 },
              { n: 2, label: "Régimen fiscal", avance: regimenOk ? 100 : 0, hecho: regimenOk },
            ].map((p) => (
              <li key={p.n} className="flex flex-1 flex-col gap-1.5">
                <span className="h-2 w-full overflow-hidden rounded-full bg-azul-200">
                  <span
                    className={`block h-full rounded-full transition-[width] duration-300 ${p.hecho ? "bg-[#1e8e4e]" : "bg-marca-viva"}`}
                    style={{ width: `${p.avance}%` }}
                  />
                </span>
                <span className={`flex items-center gap-1 text-xs leading-4 font-bold ${p.hecho ? "text-[#1e8e4e]" : "text-tinta"}`}>
                  {p.hecho ? "✓" : <Ico src={`${C}/${p.avance > 0 || (p.n === 1 && !paso1) || (p.n === 2 && paso1) ? "radio-on" : "radio-off"}.svg`} w={12.5} h={12.5} />}
                  {p.n}. {p.label}
                </span>
              </li>
            ))}
          </ol>
          <p aria-live="polite" className="text-xs leading-4 font-semibold text-tinta-suave">
            {listo ? "Revisa tus datos y toca “Guardar y empezar”." : `Falta: ${faltan.join(" · ")}`}
          </p>
        </div>
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
          &ldquo;Con tu RFC sé qué tickets son tus <b className="underline decoration-marca decoration-2">ventas</b> y cuáles son tus{" "}
          <b className="underline decoration-azul decoration-2">compras</b>. ¡Cero confusión!&rdquo;
        </p>
      </aside>

      {/* Paso 1: negocio y RFC */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-start gap-2">
            <span className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full text-xs leading-4 font-bold text-white ${paso1 ? "bg-[#1e8e4e]" : "bg-marca"}`}>
              {paso1 ? "✓" : 1}
            </span>
            <h1 className="text-2xl leading-8 font-bold text-tinta">¿Cómo se llama tu negocio?</h1>
          </div>
          <p className="pl-8 text-base leading-6 text-tinta-suave">Personaliza tus reportes y la organización de tus facturas.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="nombre" className="text-sm leading-5 font-semibold text-tinta">
              Nombre de tu negocio o actividad
            </label>
            <span className="shrink-0 text-xs leading-4 font-bold text-[#926f69]">Visible en tu app</span>
          </div>
          <div className="relative">
            <Ico src={`${C}/tienda.svg`} w={16.745} h={15} className="absolute top-4 left-3.5" />
            <input
              id="nombre"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Tlayudas Doña Mari"
              autoComplete="organization"
              maxLength={120}
              aria-invalid={!!estado.errores.nombre || undefined}
              aria-describedby={estado.errores.nombre ? "error-nombre" : undefined}
              className={`${input} pr-4 pl-11`}
            />
          </div>
          {estado.errores.nombre && (
            <p id="error-nombre" className="text-xs font-bold text-error">{estado.errores.nombre}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="rfc" className="text-sm leading-5 font-semibold text-tinta">
              RFC con homoclave
            </label>
            <span className="text-xs leading-4 font-bold tracking-[0.3px] text-azul uppercase">{rfcLargo}/13 caracteres</span>
          </div>
          <div className="relative">
            <Ico src={`${C}/rfc.svg`} w={16.667} h={16.667} className="absolute top-4 left-3.5" />
            <input
              id="rfc"
              name="rfc"
              value={rfc}
              onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="Ej. MARI880415HR9"
              maxLength={13}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!(estado.errores.rfc || avisoRfc) || undefined}
              aria-describedby="ayuda-rfc"
              className={`${input} px-11 tracking-[0.8px] uppercase placeholder:normal-case placeholder:tracking-normal`}
            />
            {rfcOk && <Ico src={`${C}/ok.svg`} w={18.333} h={18.333} className="absolute top-[15px] right-3" />}
          </div>
          <div id="ayuda-rfc" aria-live="polite">
            {rfcOk ? (
              <p className="flex w-fit items-center gap-1.5 rounded-[32px] bg-azul-100 px-3 py-1.5 text-xs leading-4 font-bold text-tinta">
                <Ico src={`${C}/valido.svg`} w={16.133} h={15.433} />
                Formato de RFC válido (Persona Física)
              </p>
            ) : (avisoRfc || estado.errores.rfc) && (
              <p className="text-xs font-bold text-error">{avisoRfc ?? estado.errores.rfc}</p>
            )}
          </div>
          <p className="flex items-start gap-1.5 pt-1 text-sm leading-[22.75px] font-semibold text-tinta-suave">
            <Ico src={`${C}/foco.svg`} w={11.25} h={17} className="mt-0.5" />
            <span>Lo encuentras en tu Constancia de Situación Fiscal, arriba a la derecha.</span>
          </p>
        </div>
      </section>

      {/* Paso 2: régimen */}
      <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-6 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <legend className="contents">
            <span className="flex items-center gap-2 text-2xl leading-8 font-bold text-tinta">
              <span className={`flex size-6 items-center justify-center rounded-full text-xs leading-4 font-bold text-white ${regimenOk ? "bg-[#1e8e4e]" : "bg-azul"}`}>
                {regimenOk ? "✓" : 2}
              </span>
              Tu régimen fiscal
            </span>
          </legend>
        </div>
        <p className="text-base leading-6 text-tinta-suave">
          Dzuun te muestra estimaciones según las reglas de tu régimen. No es una determinación oficial del SAT.
        </p>

        {REGIMENES.map((r) => {
          const elegido = regimen === r.clave;
          return (
            <label
              key={r.clave}
              className={`flex cursor-pointer flex-col gap-2 rounded-[32px] p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-azul ${
                elegido ? "bg-[#f1f3ff] ring-2 ring-azul" : "bg-fondo"
              }`}
            >
              <input
                type="radio"
                name="regimen"
                value={r.clave}
                checked={elegido}
                onChange={() => setRegimen(r.clave)}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-2">
                <span className="flex flex-col gap-1">
                  {r.recomendado && (
                    <span className="w-fit rounded-full bg-lima px-2 py-0.5 text-xs leading-4 font-bold text-lima-tinta">Recomendado</span>
                  )}
                  <span className="text-[19px] leading-6 font-bold text-tinta">
                    {r.nombre} ({r.clave})
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full ${elegido ? "bg-azul" : "border-2 border-azul-200 bg-white"}`}
                >
                  {elegido && <Ico src={`${C}/check.svg`} w={11.933} h={9.1} />}
                </span>
              </span>
              <span className="text-sm leading-5 font-semibold text-tinta-suave">{r.descripcion}</span>
            </label>
          );
        })}
        {estado.errores.regimen && <p className="text-xs font-bold text-error">{estado.errores.regimen}</p>}
        <p className="text-xs leading-4 font-semibold text-tinta-suave/80">
          Por ahora las estimaciones de Dzuun están pensadas para RESICO (626).
        </p>
      </fieldset>

      {/* Guardar */}
      <div className="flex flex-col gap-3 pt-2">
        {estado.error && (
          <p role="alert" className="rounded-2xl bg-[#ffdad6] px-4 py-3 text-sm font-semibold text-[#93000a]">
            {estado.error}
          </p>
        )}
        <button
          type="submit"
          disabled={!listo || enviando}
          className="flex h-14 items-center justify-center gap-2 rounded-full bg-marca-viva text-[19px] leading-6 font-bold text-[#fffbff] shadow-[0px_10px_15px_-3px_rgba(227,36,17,0.25),0px_4px_6px_-4px_rgba(227,36,17,0.25)] disabled:bg-azul-200 disabled:text-tinta-suave disabled:shadow-none"
        >
          {enviando ? "Guardando…" : guardado ? "Guardar cambios" : "Guardar y empezar"}
          {!enviando && listo && <Ico src={`${C}/flecha.svg`} w={16.225} h={16.225} />}
        </button>
        <p className="flex items-center justify-center gap-1.5 px-4 text-center text-xs leading-4 font-bold text-tinta-suave">
          <Ico src={`${C}/escudo.svg`} w={10.667} h={13.333} />
          Podrás modificar estos datos en cualquier momento desde tu cuenta.
        </p>
      </div>
    </form>
  );
}

/*
 * Negocio de la persona (pantalla "Configurar"). Validación pura + acceso a SQLite.
 * Sin "server-only" para poder probarlo con una base en memoria: lib/negocio.test.ts
 */
import type { DatabaseSync } from "node:sqlite";

/*
 * Regímenes que ofrece la pantalla. Claves y nombres del catálogo c_RegimenFiscal del SAT.
 * PENDIENTE (CLAUDE.md sec. 21): verificar claves y vigencia en el catálogo oficial.
 * Las estimaciones de Dzuun solo están pensadas para RESICO PF (626), sec. 12.
 */
export const REGIMENES = [
  {
    clave: "626",
    nombre: "RESICO persona física",
    descripcion: "Régimen Simplificado de Confianza. Para personas físicas con actividad empresarial o profesional.",
    recomendado: true,
  },
  {
    clave: "612",
    nombre: "Actividades empresariales y profesionales",
    descripcion: "Personas físicas con negocio o servicios profesionales fuera de RESICO.",
    recomendado: false,
  },
  {
    clave: "625",
    nombre: "Plataformas tecnológicas",
    descripcion: "Personas físicas que venden o dan servicios a través de apps o plataformas digitales.",
    recomendado: false,
  },
] as const;

export type ClaveRegimen = (typeof REGIMENES)[number]["clave"];
export type Negocio = { nombre: string; rfc: string; regimen: ClaveRegimen };

/** Forma del RFC (no consulta al SAT): 4 letras + fecha + homoclave = persona física; 3 letras = moral. */
export function tipoRfc(rfc: string): "fisica" | "moral" | null {
  const r = rfc.trim().toUpperCase();
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(r)) return null;
  const [aa, mm, dd] = [r.slice(-9, -7), Number(r.slice(-7, -5)), Number(r.slice(-5, -3))];
  if (!/^\d\d$/.test(aa) || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return r.length === 13 ? "fisica" : "moral";
}

export type Validacion = { ok: true; negocio: Negocio } | { ok: false; errores: Partial<Record<keyof Negocio, string>> };

export function validarNegocio(entrada: { nombre?: unknown; rfc?: unknown; regimen?: unknown }): Validacion {
  const nombre = typeof entrada.nombre === "string" ? entrada.nombre.trim().replace(/\s+/g, " ") : "";
  const rfc = typeof entrada.rfc === "string" ? entrada.rfc.trim().toUpperCase() : "";
  const regimen = typeof entrada.regimen === "string" ? entrada.regimen : "";
  const errores: Partial<Record<keyof Negocio, string>> = {};

  if (nombre.length < 2) errores.nombre = "Escribe el nombre de tu negocio.";
  else if (nombre.length > 120) errores.nombre = "Máximo 120 caracteres.";

  const tipo = tipoRfc(rfc);
  if (!rfc) errores.rfc = "Escribe tu RFC con homoclave.";
  else if (!tipo) errores.rfc = "El RFC no tiene un formato válido.";

  if (!REGIMENES.some((r) => r.clave === regimen)) errores.regimen = "Elige tu régimen fiscal.";
  // Los tres regímenes de la pantalla son de persona física.
  else if (tipo === "moral") errores.rfc = "Ese RFC es de persona moral; estos regímenes son para persona física (13 caracteres).";

  if (Object.keys(errores).length) return { ok: false, errores };
  return { ok: true, negocio: { nombre, rfc, regimen: regimen as ClaveRegimen } };
}

export function obtenerNegocio(d: DatabaseSync, usuarioId: string): Negocio | null {
  const fila = d.prepare("SELECT nombre, rfc, regimen FROM negocios WHERE usuario_id = ?").get(usuarioId) as Negocio | undefined;
  // node:sqlite devuelve objetos sin prototipo; Next no los deja pasar a componentes de cliente.
  return fila ? { nombre: fila.nombre, rfc: fila.rfc, regimen: fila.regimen } : null;
}

export function guardarNegocio(d: DatabaseSync, usuarioId: string, n: Negocio) {
  d.prepare(
    `INSERT INTO negocios (usuario_id, nombre, rfc, regimen) VALUES (?, ?, ?, ?)
     ON CONFLICT (usuario_id) DO UPDATE SET nombre = excluded.nombre, rfc = excluded.rfc, regimen = excluded.regimen,
       actualizado_en = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
  ).run(usuarioId, n.nombre, n.rfc, n.regimen);
}

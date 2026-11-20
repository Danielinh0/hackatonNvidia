/* Formatos para pantalla (es-MX, hora de la Ciudad de México). Sin dependencias de servidor. */
const ZONA = "America/Mexico_City";

/** Mes actual "2026-11" en hora de México. */
export function mesActual(ahora = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit" }).formatToParts(ahora);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}`;
}

/** "2026-11" → "noviembre 2026". */
export function nombreMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 15)));
}

/** Centavos → "$1,234.56". Con signo opcional. */
export function dinero(centavos: number | null, { signo = false }: { signo?: boolean } = {}): string {
  if (centavos === null) return "—";
  const t = `$${(Math.abs(centavos) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (!signo) return centavos < 0 ? `-${t}` : t;
  return `${centavos < 0 ? "-" : "+"}${t}`;
}

/**
 * Fecha ISO → "14 nov" / "14 nov 2025". Las fechas solo de día ("2026-11-14") se leen tal cual;
 * las de subida (UTC con Z) se pasan a hora de México.
 */
export function fechaCorta(iso: string, { conAnio = false } = {}): string {
  const soloDia = /^\d{4}-\d{2}-\d{2}$/.test(iso) || !/Z$/.test(iso);
  const d = soloDia ? new Date(`${iso.slice(0, 10)}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    ...(conAnio ? { year: "numeric" } : {}),
    timeZone: soloDia ? "UTC" : ZONA,
  }).format(d).replace(".", "");
}

/** Fecha ISO → "14 de noviembre" (para grupos y la voz de Bisie'). */
export function fechaLarga(iso: string): string {
  const soloDia = !/Z$/.test(iso);
  const d = soloDia ? new Date(`${iso.slice(0, 10)}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: soloDia ? "UTC" : ZONA }).format(d);
}

/** Día (YYYY-MM-DD) en hora de México, para agrupar. */
export function diaDe(iso: string): string {
  if (!/Z$/.test(iso)) return iso.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

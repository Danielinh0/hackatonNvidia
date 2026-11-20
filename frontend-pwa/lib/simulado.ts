/*
 * Qué parte del análisis fue SIMULADA y cómo decirlo sin exagerar ni esconder nada.
 * backend-ia manda `simulado_partes` (subconjunto de ["vision", "asistente"]); se guarda en
 * comprobantes.simulado_partes como JSON. Sin dependencias: lo usan componentes de cliente.
 */
export type ParteSimulada = "vision" | "asistente";

/** Lee `simulado_partes` de la respuesta del backend. null = el backend no lo dijo (versión anterior). */
export function partesDeRespuesta(json: unknown): ParteSimulada[] | null {
  const p = (json as { simulado_partes?: unknown } | null)?.simulado_partes;
  if (!Array.isArray(p)) return null;
  return (["vision", "asistente"] as const).filter((x) => p.includes(x));
}

/** Texto de la etiqueta. `partes` es el JSON guardado en la base (o null en filas anteriores). */
export function etiquetaSimulado(partes: string | null): string {
  let lista: unknown = null;
  try {
    lista = partes ? JSON.parse(partes) : null;
  } catch {}
  if (!Array.isArray(lista)) return "SIMULADO"; // filas anteriores: no sabemos qué parte, no adivinamos
  const vision = lista.includes("vision");
  const asistente = lista.includes("asistente");
  if (vision && asistente) return "SIMULADO · no lo leyó el modelo";
  if (vision) return "SIMULADO · visión: texto de ejemplo; lo leyó el asistente entrenado";
  if (asistente) return "SIMULADO · respuesta fija del asistente";
  return "SIMULADO";
}

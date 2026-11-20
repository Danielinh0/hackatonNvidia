/*
 * Vista previa de fotos SOLO en el teléfono. Guarda en memoria del navegador un enlace
 * blob: a cada archivo que la persona eligió o fotografió. No se sube, no se escribe en
 * localStorage ni en IndexedDB: al recargar o cerrar la pestaña desaparece, y la pantalla
 * muestra solo los datos leídos (que sí están en el servidor).
 *
 * Clave: el sha256 del archivo (si el navegador puede calcularlo: https o localhost) y,
 * además, nombre|tamaño para conexiones http en la red local.
 */
const MAX = 30;
const fotos = new Map<string, { url: string; tipo: string }>();
const orden: string[] = [];
const oyentes = new Set<() => void>();

export const claveNombre = (nombre: string, tamano: number) => `${nombre}|${tamano}`;

export function recordarFoto(archivo: File, sha256: string) {
  const url = URL.createObjectURL(archivo);
  const valor = { url, tipo: archivo.type };
  for (const k of [sha256, claveNombre(archivo.name, archivo.size)]) {
    if (!k) continue;
    fotos.set(k, valor);
    orden.push(k);
  }
  // Libera las más viejas para no acumular memoria.
  while (orden.length > MAX * 2) {
    const k = orden.shift()!;
    const v = fotos.get(k);
    fotos.delete(k);
    if (v && ![...fotos.values()].includes(v)) URL.revokeObjectURL(v.url);
  }
  oyentes.forEach((f) => f());
}

export function buscarFoto(sha256: string, nombre: string, tamano: number) {
  return fotos.get(sha256) ?? fotos.get(claveNombre(nombre, tamano)) ?? null;
}

export function suscribir(f: () => void) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

/** sha256 en el navegador; "" si no hay crypto.subtle (http fuera de localhost). */
export async function huella(archivo: Blob): Promise<string> {
  if (!globalThis.crypto?.subtle) return "";
  const digest = await crypto.subtle.digest("SHA-256", await archivo.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

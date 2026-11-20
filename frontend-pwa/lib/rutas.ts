/*
 * Manejo de parámetros de ruta compartido por proxy, páginas y acciones.
 */

/** Rutas que se pueden ver sin sesión. */
export const RUTAS_PUBLICAS = ["/bienvenida", "/entrar", "/registro", "/auth", "/manifest.webmanifest", "/pantallas"];
/** Rutas de acceso: con sesión no tienen caso y se salta al destino. */
export const RUTAS_ACCESO = ["/bienvenida", "/entrar", "/registro"];

export const esPublica = (ruta: string) => RUTAS_PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));

/**
 * Valida el parámetro ?siguiente= para regresar a la página pedida después de entrar.
 * Solo acepta rutas internas ("/subir", "/subir/recibido/abc?x=1"); cualquier otra cosa
 * (URLs absolutas, "//sitio.com", "/\\sitio.com", rutas de acceso) devuelve el valor por defecto.
 * Así nadie puede usar el login para mandar a la persona a otro sitio (open redirect).
 */
export function siguienteSeguro(valor: unknown, porDefecto = "/"): string {
  if (typeof valor !== "string" || valor.length === 0 || valor.length > 512) return porDefecto;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return porDefecto;
  if (/[\u0000-\u001f\\]/.test(valor)) return porDefecto;
  let url: URL;
  try {
    url = new URL(valor, "http://dzuun.local");
  } catch {
    return porDefecto;
  }
  if (url.origin !== "http://dzuun.local") return porDefecto;
  if (RUTAS_ACCESO.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)) || url.pathname.startsWith("/auth")) {
    return porDefecto;
  }
  return url.pathname + url.search;
}

/** Construye /entrar?siguiente=... (omite el parámetro si el destino es el inicio). */
export function rutaEntrar(siguiente: string): string {
  const s = siguienteSeguro(siguiente);
  return s === "/" ? "/entrar" : `/entrar?siguiente=${encodeURIComponent(s)}`;
}

export const normalizarCorreo = (c: string) => c.trim().toLowerCase();
export const correoValido = (c: string) => c.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);

/**
 * Enlace al chat con Bisie' desde una pantalla que pide ayuda: guarda la página de origen en ?desde=
 * para que "Regresar" vuelva ahí (continuidad). Desde la barra inferior se usa "/chat" sin origen → regresa al inicio.
 */
export function rutaChat(desde?: string): string {
  const d = desde ? siguienteSeguro(desde) : "/";
  return d === "/" || d.startsWith("/chat") ? "/chat" : `/chat?desde=${encodeURIComponent(d)}`;
}

/** Destino de "Regresar" en el chat: la página de origen validada, o el inicio. Nunca el propio chat. */
export function regresoDeChat(desde: unknown): string {
  const d = siguienteSeguro(desde);
  return d.startsWith("/chat") ? "/" : d;
}

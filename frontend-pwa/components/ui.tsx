/* Piezas pequeñas reutilizadas entre pantallas. */

/** Ícono SVG exportado de Figma; respeta su tamaño original. */
export function Ico({ src, w, h, className = "" }: { src: string; w: number; h: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={w} height={h} className={`block shrink-0 ${className}`} style={{ width: w, height: h }} />;
}

/**
 * Logo de Dzuun: tintero con pluma (public/logo.svg, proporción ~1:2).
 * Se pinta con máscara, así que toma el color del texto (`text-tinta`, `text-marca`, `text-white`…).
 * `alto` en px; el ancho sale de la proporción del dibujo.
 */
export function Logo({ alto = 28, className = "" }: { alto?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Dzuun"
      className={`icono-mascara block shrink-0 ${className}`}
      style={{ width: Math.round(alto * 0.4956 * 10) / 10, height: alto, maskImage: "url(/logo.svg)" }}
    />
  );
}

/**
 * Mascota Bisie'. En Figma el nodo "Mascota Bisie'" aún no tiene ilustración,
 * así que se deja el círculo de fondo como espacio reservado.
 */
export function MascotaBisie({
  size = 64,
  fondo = "bg-azul-150",
  className = "",
}: {
  size?: number;
  fondo?: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Bisie', tu asistente"
      className={`block shrink-0 rounded-full ${fondo} drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Etiqueta obligatoria para lo que no es real (CLAUDE.md sec. 0). */
export function Simulado({ className = "" }: { className?: string }) {
  return <span className={`font-extrabold text-marca-viva ${className}`}>(SIMULADO)</span>;
}

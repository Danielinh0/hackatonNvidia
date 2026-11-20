import type { MetadataRoute } from "next";

/* Manifest de la PWA. Íconos: logo del tintero sobre crema de marca (public/iconos/). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dzuun",
    short_name: "Dzuun",
    description: "Organiza tus tickets, SPEI y facturas con Bisie'. Estimaciones, no determinación oficial del SAT.",
    lang: "es-MX",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9f9ff",
    theme_color: "#f9f9ff",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/iconos/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

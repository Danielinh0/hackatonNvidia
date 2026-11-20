import type { MetadataRoute } from "next";

/* Manifest de la PWA. Faltan íconos 192/512 de marca (pendientes de diseño). */
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
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}

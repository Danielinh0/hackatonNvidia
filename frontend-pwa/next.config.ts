import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo afecta a `next dev`: permite abrir el servidor de desarrollo desde otros
  // dispositivos de la red local (teléfonos de prueba). Sin esto, Next responde 403
  // a los chunks de /_next que el navegador pide con Origin = IP de la LAN.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
  experimental: {
    agentFeedback: true,
    // Lotes de fotos: hasta 10 archivos / 40 MB (ver lib/verificacion.ts) + margen multipart.
    serverActions: { bodySizeLimit: "41mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

/*
 * Verificación de un archivo recibido. Función pura (sin red ni base de datos)
 * para poder probarla con casos de resultado esperado: lib/verificacion.test.ts
 */
import { createHash } from "node:crypto";

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por archivo (pantalla "Errores y estados")
export const MAX_ARCHIVOS = 10;
export const MAX_LOTE_BYTES = 40 * 1024 * 1024;

export type TipoPermitido = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

export type Resultado =
  | { ok: true; tipo: TipoPermitido; sha256: string; huellaCliente: boolean }
  | { ok: false; motivo: string };

/** Detecta el tipo por los primeros bytes ("números mágicos"), no por la extensión ni el MIME del navegador. */
export function detectarTipo(b: Uint8Array): TipoPermitido | null {
  const empieza = (...firma: number[]) => firma.every((v, i) => b[i] === v);
  if (empieza(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (empieza(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  // RIFF....WEBP
  if (empieza(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (empieza(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf"; // %PDF-
  return null;
}

export function sha256Hex(b: Uint8Array): string {
  return createHash("sha256").update(b).digest("hex");
}

/**
 * Comprueba que el archivo llegó completo y es de un tipo aceptado.
 * @param bytes          lo que recibió el servidor
 * @param tamanoCliente  tamaño que el navegador dijo enviar
 * @param huellaCliente  sha256 calculado en el navegador ("" si no pudo calcularlo)
 */
export function verificarArchivo(bytes: Uint8Array, tamanoCliente: number, huellaCliente: string): Resultado {
  if (bytes.length === 0) return { ok: false, motivo: "El archivo llegó vacío." };
  if (bytes.length > MAX_BYTES) return { ok: false, motivo: "Imagen muy pesada, máximo 10 MB." };
  if (Number.isFinite(tamanoCliente) && tamanoCliente > 0 && tamanoCliente !== bytes.length) {
    return { ok: false, motivo: `Llegó incompleto (${bytes.length} de ${tamanoCliente} bytes). Vuelve a intentarlo.` };
  }

  const tipo = detectarTipo(bytes);
  if (!tipo) return { ok: false, motivo: "Formato no compatible. Usa JPG, PNG, WEBP o PDF." };

  const sha256 = sha256Hex(bytes);
  const esperado = huellaCliente.trim().toLowerCase();
  if (esperado && esperado !== sha256) {
    return { ok: false, motivo: "El archivo cambió en el camino (la huella no coincide). Vuelve a intentarlo." };
  }

  return { ok: true, tipo, sha256, huellaCliente: esperado !== "" };
}

import "server-only";
import { facturama } from "./facturama";
import { mock } from "./mock";
import type { CfdiEntrada, FacturaResumen } from "./tipos";
import { ErrorCfdi } from "./tipos";

/*
 * Un "proveedor" es quien timbra: el PAC simulado local (mock) o Facturama (sandbox).
 * Se elige con CFDI_PROVIDER en .env. Las rutas de /api/cfdi solo hablan con esta interfaz,
 * así que cambiar de proveedor no cambia la API que consume la PWA.
 */
export type OpcionesPrueba = { simularFallo?: "pac-caido" | "timeout" | "rechazo" };

export interface ProveedorCfdi {
  nombre: "mock" | "facturama";
  descripcion: string;
  emitir(cfdi: CfdiEntrada, op?: OpcionesPrueba): Promise<FacturaResumen>;
  obtener(id: string): Promise<FacturaResumen>;
  listar(): Promise<FacturaResumen[]>;
  archivo(id: string, formato: "xml" | "pdf"): Promise<{ bytes: Uint8Array; tipo: string; nombre: string }>;
  cancelar(id: string, motivo: string, uuidSustitucion?: string): Promise<FacturaResumen>;
}

export function proveedor(): ProveedorCfdi {
  // parseo tolerante: el .env del equipo tiene comentarios al final de la línea
  const p = (process.env.CFDI_PROVIDER ?? "mock").split("#")[0].trim();
  if (p === "mock") return mock;
  if (p === "facturama") return facturama;
  throw new ErrorCfdi(500, "config", `CFDI_PROVIDER="${p}" no es válido. Usa mock o facturama.`);
}

/*
 * Forma de entrada de la API local de facturas. Usa los nombres de atributo del XML
 * CFDI 4.0 del SAT (Anexo 20), igual que el ejemplo que se le pasó al equipo.
 * Los importes van como texto ("2501.00") para no perder decimales.
 */
export type Traslado = {
  Base: string;
  Impuesto: string; // 002 = IVA
  TipoFactor: "Tasa" | "Cuota" | "Exento";
  TasaOCuota?: string; // "0.160000"; no va si TipoFactor = Exento
  Importe?: string; // no va si TipoFactor = Exento
};

export type Concepto = {
  ClaveProdServ: string;
  NoIdentificacion?: string;
  Cantidad: string;
  ClaveUnidad: string;
  Unidad?: string;
  Descripcion: string;
  ValorUnitario: string;
  Importe: string;
  ObjetoImp: string;
  Impuestos?: { Traslados?: Traslado[]; Retenciones?: unknown[] };
};

export type CfdiEntrada = {
  Version: "4.0";
  Serie?: string;
  Folio?: string; // si falta, el PAC simulado asigna el siguiente de la serie
  Fecha: string; // "AUTO" o "AAAA-MM-DDThh:mm:ss" (hora local)
  FormaPago: string;
  MetodoPago: "PUE" | "PPD";
  Moneda: "MXN";
  TipoDeComprobante: "I" | "E";
  Exportacion: string;
  LugarExpedicion: string;
  SubTotal: string;
  Descuento?: string;
  Total: string;
  Emisor: { RegimenFiscal: string; Rfc?: string; Nombre?: string };
  Receptor: {
    Rfc: string;
    Nombre: string;
    DomicilioFiscalReceptor: string;
    RegimenFiscalReceptor: string;
    UsoCFDI: string;
  };
  Conceptos: Concepto[];
  Impuestos?: { TotalImpuestosTrasladados?: string; Traslados?: Traslado[]; TotalImpuestosRetenidos?: string };
};

/** Lo que devuelve la API para cualquier proveedor (mock o Facturama). */
export type FacturaResumen = {
  id: string;
  uuid: string;
  proveedor: "mock" | "facturama";
  /** true en el PAC simulado: UUID, sello y timbre son ficticios. */
  simulado: boolean;
  /** Siempre false en esta app: ni el mock ni el sandbox de Facturama tienen validez ante el SAT. */
  validezFiscal: false;
  estado: "vigente" | "cancelada";
  serie: string | null;
  folio: string | null;
  fecha: string;
  fechaTimbrado: string;
  emisor: { rfc: string; nombre: string; regimenFiscal: string };
  receptor: { rfc: string; nombre: string; usoCfdi: string };
  subTotal: string;
  total: string;
  motivoCancelacion?: string;
  aviso: string;
};

export type Problema = { campo: string; mensaje: string };

export class ErrorCfdi extends Error {
  status: number;
  codigo: string;
  detalles?: unknown;
  constructor(status: number, codigo: string, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

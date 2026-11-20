/*
 * Ejemplo de salida del modelo (forma CFDI 4.0). Datos SINTÉTICOS: el RFC del receptor
 * (XIA190128J61) es uno de los RFC de prueba que publica el SAT. Se usa en las pruebas y,
 * con ANALISIS_SIMULADO=1, como análisis SIMULADO mientras no hay servicio de visión.
 */
export const CFDI_EJEMPLO = {
  Version: "4.0",
  Serie: "A",
  Folio: "1",
  Fecha: "AUTO",
  FormaPago: "03",
  MetodoPago: "PUE",
  Moneda: "MXN",
  TipoDeComprobante: "I",
  Exportacion: "01",
  LugarExpedicion: "64000",
  SubTotal: "2501.00",
  Total: "2901.16",
  Emisor: { RegimenFiscal: "601" },
  Receptor: {
    Rfc: "XIA190128J61",
    Nombre: "XENON INDUSTRIAL ARTICLES",
    DomicilioFiscalReceptor: "76343",
    RegimenFiscalReceptor: "601",
    UsoCFDI: "G03",
  },
  Conceptos: [
    {
      ClaveProdServ: "01010101",
      Cantidad: "2",
      ClaveUnidad: "H87",
      Descripcion: "Producto de prueba",
      ValorUnitario: "1250.50",
      Importe: "2501.00",
      ObjetoImp: "02",
      Impuestos: {
        Traslados: [{ Base: "2501.00", Impuesto: "002", TipoFactor: "Tasa", TasaOCuota: "0.160000", Importe: "400.16" }],
      },
    },
  ],
  Impuestos: {
    TotalImpuestosTrasladados: "400.16",
    Traslados: [{ Base: "2501.00", Impuesto: "002", TipoFactor: "Tasa", TasaOCuota: "0.160000", Importe: "400.16" }],
  },
};

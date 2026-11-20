/*
 * Subconjunto de catálogos del SAT para CFDI 4.0 que usa el simulador.
 * Fuente: Anexo 20, catálogos c_FormaPago, c_MetodoPago, c_UsoCFDI, c_RegimenFiscal,
 * c_Impuesto, c_TipoFactor, c_ObjetoImp, c_Exportacion (sat.gob.mx).
 * PENDIENTE: verificar contra la versión vigente del catálogo antes de la entrega.
 * No es el catálogo completo: ClaveProdServ y ClaveUnidad solo se validan por formato.
 */
export const FORMA_PAGO: Record<string, string> = {
  "01": "Efectivo", "02": "Cheque nominativo", "03": "Transferencia electrónica de fondos",
  "04": "Tarjeta de crédito", "05": "Monedero electrónico", "06": "Dinero electrónico",
  "08": "Vales de despensa", "12": "Dación en pago", "13": "Pago por subrogación",
  "14": "Pago por consignación", "15": "Condonación", "17": "Compensación", "23": "Novación",
  "24": "Confusión", "25": "Remisión de deuda", "26": "Prescripción o caducidad",
  "27": "A satisfacción del acreedor", "28": "Tarjeta de débito", "29": "Tarjeta de servicios",
  "30": "Aplicación de anticipos", "31": "Intermediario pagos", "99": "Por definir",
};

export const METODO_PAGO: Record<string, string> = {
  PUE: "Pago en una sola exhibición",
  PPD: "Pago en parcialidades o diferido",
};

export const USO_CFDI: Record<string, string> = {
  G01: "Adquisición de mercancías", G02: "Devoluciones, descuentos o bonificaciones", G03: "Gastos en general",
  I01: "Construcciones", I02: "Mobiliario y equipo de oficina por inversiones", I03: "Equipo de transporte",
  I04: "Equipo de cómputo y accesorios", I05: "Dados, troqueles, moldes, matrices y herramental",
  I06: "Comunicaciones telefónicas", I07: "Comunicaciones satelitales", I08: "Otra maquinaria y equipo",
  D01: "Honorarios médicos, dentales y gastos hospitalarios", D02: "Gastos médicos por incapacidad o discapacidad",
  D03: "Gastos funerales", D04: "Donativos", D05: "Intereses reales por créditos hipotecarios",
  D06: "Aportaciones voluntarias al SAR", D07: "Primas por seguros de gastos médicos",
  D08: "Gastos de transportación escolar obligatoria", D09: "Depósitos en cuentas para el ahorro",
  D10: "Pagos por servicios educativos (colegiaturas)", S01: "Sin efectos fiscales", CP01: "Pagos", CN01: "Nómina",
};

export const REGIMEN_FISCAL: Record<string, string> = {
  "601": "General de Ley Personas Morales", "603": "Personas Morales con Fines no Lucrativos",
  "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios", "606": "Arrendamiento",
  "607": "Régimen de Enajenación o Adquisición de Bienes", "608": "Demás ingresos",
  "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
  "611": "Ingresos por Dividendos (socios y accionistas)",
  "612": "Personas Físicas con Actividades Empresariales y Profesionales", "614": "Ingresos por intereses",
  "615": "Régimen de los ingresos por obtención de premios", "616": "Sin obligaciones fiscales",
  "620": "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  "621": "Incorporación Fiscal", "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  "623": "Opcional para Grupos de Sociedades", "624": "Coordinados",
  "625": "Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  "626": "Régimen Simplificado de Confianza",
};

export const TIPO_COMPROBANTE_SOPORTADO = ["I", "E"] as const; // Ingreso, Egreso (T, N, P fuera de alcance)
export const EXPORTACION = ["01", "02", "03", "04"];
export const OBJETO_IMP = ["01", "02", "03", "04", "05", "06", "07", "08"];
export const IMPUESTO: Record<string, string> = { "001": "ISR", "002": "IVA", "003": "IEPS" };
export const TIPO_FACTOR = ["Tasa", "Cuota", "Exento"];
/** Tasas de IVA trasladado que acepta el simulador (16 % general, 8 % frontera, 0 %). */
export const TASAS_IVA = ["0.160000", "0.080000", "0.000000"];
export const MOTIVO_CANCELACION: Record<string, string> = {
  "01": "Comprobante emitido con errores con relación",
  "02": "Comprobante emitido con errores sin relación",
  "03": "No se llevó a cabo la operación",
  "04": "Operación nominativa relacionada en una factura global",
};

/** RFC genérico de público en general. */
export const RFC_PUBLICO_GENERAL = "XAXX010101000";
export const RE_RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;

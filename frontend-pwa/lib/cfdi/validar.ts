/*
 * Validación de un CFDI 4.0 antes de "timbrarlo". Función pura: sin red ni disco,
 * con pruebas de resultado esperado en lib/cfdi/validar.test.ts.
 *
 * Qué revisa: estructura, catálogos (subconjunto, ver catalogos.ts), formato de RFC y
 * códigos postales, y que la aritmética cuadre:
 *   Importe = Cantidad × ValorUnitario           (redondeado a 2 decimales)
 *   Traslado.Importe = Base × TasaOCuota          (redondeado a 2 decimales)
 *   SubTotal = Σ Importe de conceptos
 *   Total = SubTotal + Σ traslados
 * Se exige coincidencia exacta a 2 decimales (el SAT tolera pequeñas diferencias de
 * redondeo; aquí somos más estrictos a propósito y el error dice el valor esperado).
 *
 * Fuera de alcance (se rechazan con mensaje claro): retenciones, descuentos, moneda
 * distinta de MXN, tipos de comprobante T, N y P.
 */
import * as cat from "./catalogos.ts";
import { formatear, leer, multiplicar, redondear, suma } from "./decimal.ts";
import type { Problema } from "./tipos.ts";

export type ResultadoValidacion = {
  ok: boolean;
  errores: Problema[];
  advertencias: Problema[];
  /** Valores que calculó el código (para mostrarlos en la pantalla de revisión). */
  calculado: { SubTotal: string; TotalImpuestosTrasladados: string; Total: string } | null;
};

const esObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validarCfdi(entrada: unknown): ResultadoValidacion {
  const errores: Problema[] = [];
  const advertencias: Problema[] = [];
  const err = (campo: string, mensaje: string) => errores.push({ campo, mensaje });

  if (!esObj(entrada)) {
    return { ok: false, errores: [{ campo: "", mensaje: "El cuerpo debe ser un objeto JSON." }], advertencias, calculado: null };
  }
  const c = entrada;

  // ---- Comprobante ----
  if (c.Version !== "4.0") err("Version", 'Solo se acepta "4.0".');
  const fecha = texto(c.Fecha);
  if (fecha !== "AUTO" && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(fecha)) {
    err("Fecha", 'Usa "AUTO" o el formato AAAA-MM-DDThh:mm:ss.');
  }
  if (c.Serie !== undefined && !/^[^|]{1,25}$/.test(texto(c.Serie))) err("Serie", "Máximo 25 caracteres, sin '|'.");
  if (c.Folio !== undefined && !/^[^|]{1,40}$/.test(texto(c.Folio))) err("Folio", "Máximo 40 caracteres, sin '|'.");
  const tipo = texto(c.TipoDeComprobante);
  if (!(cat.TIPO_COMPROBANTE_SOPORTADO as readonly string[]).includes(tipo)) {
    err("TipoDeComprobante", "Solo se soportan I (ingreso) y E (egreso).");
  }
  if (c.Moneda !== "MXN") err("Moneda", "Solo se soporta MXN.");
  if (!cat.EXPORTACION.includes(texto(c.Exportacion))) err("Exportacion", "Clave no válida (c_Exportacion: 01–04).");
  if (!/^\d{5}$/.test(texto(c.LugarExpedicion))) err("LugarExpedicion", "Debe ser un código postal de 5 dígitos.");

  const forma = texto(c.FormaPago);
  const metodo = texto(c.MetodoPago);
  if (!(forma in cat.FORMA_PAGO)) err("FormaPago", "Clave no está en c_FormaPago.");
  if (!(metodo in cat.METODO_PAGO)) err("MetodoPago", "Usa PUE o PPD.");
  if (metodo === "PPD" && forma !== "99") err("FormaPago", 'Con MetodoPago PPD la FormaPago debe ser "99" (Por definir).');
  if (c.Descuento !== undefined && leer(c.Descuento) !== 0n) err("Descuento", "Los descuentos aún no están soportados.");

  // ---- Emisor ----
  const emisor = esObj(c.Emisor) ? c.Emisor : null;
  if (!emisor) err("Emisor", "Falta el emisor.");
  else {
    if (!(texto(emisor.RegimenFiscal) in cat.REGIMEN_FISCAL)) err("Emisor.RegimenFiscal", "Clave no está en c_RegimenFiscal.");
    if (emisor.Rfc !== undefined && !cat.RE_RFC.test(texto(emisor.Rfc))) err("Emisor.Rfc", "RFC con formato no válido.");
  }

  // ---- Receptor ----
  const rec = esObj(c.Receptor) ? c.Receptor : null;
  if (!rec) err("Receptor", "Falta el receptor.");
  else {
    const rfc = texto(rec.Rfc).toUpperCase();
    if (!cat.RE_RFC.test(rfc)) err("Receptor.Rfc", "RFC con formato no válido (12 caracteres persona moral, 13 física).");
    if (!texto(rec.Nombre)) err("Receptor.Nombre", "Falta el nombre o razón social (como aparece en la Constancia).");
    if (!/^\d{5}$/.test(texto(rec.DomicilioFiscalReceptor))) err("Receptor.DomicilioFiscalReceptor", "Debe ser un código postal de 5 dígitos.");
    if (!(texto(rec.RegimenFiscalReceptor) in cat.REGIMEN_FISCAL)) err("Receptor.RegimenFiscalReceptor", "Clave no está en c_RegimenFiscal.");
    if (!(texto(rec.UsoCFDI) in cat.USO_CFDI)) err("Receptor.UsoCFDI", "Clave no está en c_UsoCFDI.");
    if (rfc === cat.RFC_PUBLICO_GENERAL) {
      if (texto(rec.UsoCFDI) !== "S01") err("Receptor.UsoCFDI", "Con RFC de público en general el uso debe ser S01.");
      if (texto(rec.RegimenFiscalReceptor) !== "616") err("Receptor.RegimenFiscalReceptor", "Con RFC de público en general el régimen debe ser 616.");
    }
  }

  // ---- Conceptos y aritmética ----
  const conceptos = Array.isArray(c.Conceptos) ? c.Conceptos : [];
  if (conceptos.length === 0) err("Conceptos", "Agrega al menos un concepto.");
  if (conceptos.length > 50) err("Conceptos", "Máximo 50 conceptos en el simulador.");

  const importes: bigint[] = [];
  // Resumen de traslados agrupado por Impuesto|TipoFactor|TasaOCuota.
  const resumen = new Map<string, { base: bigint; importe: bigint }>();

  conceptos.slice(0, 50).forEach((raw, i) => {
    const p = `Conceptos[${i}]`;
    if (!esObj(raw)) return err(p, "Cada concepto debe ser un objeto.");
    if (!/^\d{8}$/.test(texto(raw.ClaveProdServ))) err(`${p}.ClaveProdServ`, "Deben ser 8 dígitos (c_ClaveProdServ).");
    if (!/^[A-Z0-9]{1,3}$/.test(texto(raw.ClaveUnidad))) err(`${p}.ClaveUnidad`, "Clave de unidad no válida (p. ej. H87 pieza, E48 servicio).");
    if (!texto(raw.Descripcion)) err(`${p}.Descripcion`, "Falta la descripción.");
    const cant = leer(raw.Cantidad);
    const vu = leer(raw.ValorUnitario);
    const imp = leer(raw.Importe);
    if (cant === null || cant === 0n) err(`${p}.Cantidad`, "Debe ser un número mayor que 0.");
    if (vu === null) err(`${p}.ValorUnitario`, "Debe ser un número (hasta 6 decimales).");
    if (imp === null) err(`${p}.Importe`, "Debe ser un número.");
    if (cant !== null && vu !== null && imp !== null) {
      const esperado = redondear(multiplicar(cant, vu), 2);
      if (redondear(imp, 2) !== esperado) err(`${p}.Importe`, `No cuadra: Cantidad × ValorUnitario = ${formatear(esperado, 2)}.`);
      importes.push(esperado);
    }

    const objeto = texto(raw.ObjetoImp);
    if (!cat.OBJETO_IMP.includes(objeto)) err(`${p}.ObjetoImp`, "Clave no está en c_ObjetoImp.");
    const imps = esObj(raw.Impuestos) ? raw.Impuestos : null;
    if (imps?.Retenciones !== undefined) err(`${p}.Impuestos.Retenciones`, "Las retenciones aún no están soportadas.");
    const traslados = imps && Array.isArray(imps.Traslados) ? imps.Traslados : [];
    if (objeto === "02" && traslados.length === 0) err(`${p}.Impuestos`, 'Con ObjetoImp "02" el concepto debe llevar impuestos.');
    if (objeto === "01" && imps) err(`${p}.Impuestos`, 'Con ObjetoImp "01" (no objeto de impuesto) no van impuestos.');

    traslados.forEach((t, j) => {
      const q = `${p}.Impuestos.Traslados[${j}]`;
      if (!esObj(t)) return err(q, "Cada traslado debe ser un objeto.");
      const impuesto = texto(t.Impuesto);
      const factor = texto(t.TipoFactor);
      const tasa = texto(t.TasaOCuota);
      if (impuesto !== "002") err(`${q}.Impuesto`, "El simulador solo soporta IVA trasladado (002).");
      if (!cat.TIPO_FACTOR.includes(factor) || factor === "Cuota") err(`${q}.TipoFactor`, "Usa Tasa o Exento.");
      const base = leer(t.Base);
      if (base === null) return err(`${q}.Base`, "Debe ser un número.");
      if (imp !== null && redondear(base, 2) !== redondear(imp, 2)) err(`${q}.Base`, "La base debe ser igual al Importe del concepto.");
      if (factor === "Exento") {
        if (t.TasaOCuota !== undefined || t.Importe !== undefined) err(q, "Un traslado Exento no lleva TasaOCuota ni Importe.");
        acumular(resumen, `${impuesto}|Exento|`, base, 0n);
        return;
      }
      if (!cat.TASAS_IVA.includes(tasa)) err(`${q}.TasaOCuota`, `Tasa de IVA no soportada. Usa ${cat.TASAS_IVA.join(", ")}.`);
      const tasaV = leer(tasa);
      const impT = leer(t.Importe);
      if (impT === null) return err(`${q}.Importe`, "Debe ser un número.");
      if (tasaV !== null) {
        const esperado = redondear(multiplicar(base, tasaV), 2);
        if (redondear(impT, 2) !== esperado) err(`${q}.Importe`, `No cuadra: Base × Tasa = ${formatear(esperado, 2)}.`);
        acumular(resumen, `${impuesto}|${factor}|${tasa}`, redondear(base, 2), esperado);
      }
    });
  });

  // ---- Totales ----
  const subTotal = suma(importes);
  const totalTrasl = suma([...resumen.values()].map((r) => r.importe));
  const total = subTotal + totalTrasl;
  const calculado = {
    SubTotal: formatear(subTotal, 2),
    TotalImpuestosTrasladados: formatear(totalTrasl, 2),
    Total: formatear(total, 2),
  };

  const comparar = (campo: string, declarado: unknown, esperado: bigint) => {
    const v = leer(declarado);
    if (v === null) err(campo, "Debe ser un número.");
    else if (redondear(v, 2) !== esperado) err(campo, `No cuadra: debería ser ${formatear(esperado, 2)}.`);
  };
  comparar("SubTotal", c.SubTotal, subTotal);
  comparar("Total", c.Total, total);

  const impGlobal = esObj(c.Impuestos) ? c.Impuestos : null;
  if (resumen.size > 0) {
    if (!impGlobal) err("Impuestos", "Falta el resumen de impuestos del comprobante.");
    else {
      if ([...resumen.keys()].some((k) => !k.includes("Exento"))) {
        comparar("Impuestos.TotalImpuestosTrasladados", impGlobal.TotalImpuestosTrasladados, totalTrasl);
      }
      const declarados = Array.isArray(impGlobal.Traslados) ? impGlobal.Traslados.filter(esObj) : [];
      for (const [clave, r] of resumen) {
        const [impuesto, factor, tasa] = clave.split("|");
        const d = declarados.find((t) => texto(t.Impuesto) === impuesto && texto(t.TipoFactor) === factor && texto(t.TasaOCuota) === tasa);
        const etiqueta = `Impuestos.Traslados (${factor}${tasa ? " " + tasa : ""})`;
        if (!d) err(etiqueta, "Falta este grupo en el resumen de traslados.");
        else {
          comparar(`${etiqueta}.Base`, d.Base, r.base);
          if (factor !== "Exento") comparar(`${etiqueta}.Importe`, d.Importe, r.importe);
        }
      }
      if (declarados.length > resumen.size) err("Impuestos.Traslados", "Hay grupos en el resumen que no vienen de ningún concepto.");
    }
  }
  if (impGlobal?.TotalImpuestosRetenidos !== undefined) err("Impuestos.TotalImpuestosRetenidos", "Las retenciones aún no están soportadas.");

  // ---- Advertencias (no bloquean) ----
  // Regla "gancho" de CLAUDE.md sec. 12: efectivo > 2,000 MXN. PENDIENTE verificar su aplicación en LISR/LIVA.
  if (forma === "01" && total > leer("2000")!) {
    advertencias.push({ campo: "FormaPago", mensaje: "Pago en efectivo mayor a $2,000: para quien recibe la factura podría no ser deducible. Estimación, verifica con tu contador." });
  }

  return { ok: errores.length === 0, errores, advertencias, calculado };
}

function acumular(m: Map<string, { base: bigint; importe: bigint }>, clave: string, base: bigint, importe: bigint) {
  const r = m.get(clave) ?? { base: 0n, importe: 0n };
  m.set(clave, { base: r.base + base, importe: r.importe + importe });
}

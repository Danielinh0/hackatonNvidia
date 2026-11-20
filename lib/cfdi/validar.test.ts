// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { formatear, leer, multiplicar, redondear } from "./decimal.ts";
import { generarPdf, generarXml } from "./documentos.ts";
import { validarCfdi } from "./validar.ts";

const ejemplo = (n: string) => JSON.parse(readFileSync(new URL(`../../docs/ejemplos-cfdi/${n}.json`, import.meta.url), "utf8"));
const campos = (r: ReturnType<typeof validarCfdi>) => r.errores.map((e) => e.campo);

test("decimal: aritmética exacta y redondeo half-up", () => {
  assert.equal(formatear(leer("0.1")! + leer("0.2")!, 2), "0.30");
  assert.equal(formatear(redondear(multiplicar(leer("2501.00")!, leer("0.160000")!), 2), 2), "400.16");
  assert.equal(formatear(redondear(leer("0.125")!, 2), 2), "0.13");
  assert.equal(leer("-5"), null);
  assert.equal(leer("1.1234567"), null);
});

test("caso habitual: el ejemplo de Facturama cuadra", () => {
  const r = validarCfdi(ejemplo("ingreso-valido"));
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.calculado, { SubTotal: "2501.00", TotalImpuestosTrasladados: "400.16", Total: "2901.16" });
});

test("RESICO a público en general en efectivo > $2,000: válido con advertencia", () => {
  const r = validarCfdi(ejemplo("resico-publico-general-efectivo"));
  assert.equal(r.ok, true);
  assert.equal(r.calculado?.Total, "2494.00");
  assert.deepEqual(r.advertencias.map((a) => a.campo), ["FormaPago"]);
});

test("datos inválidos: señala cada campo y el valor esperado", () => {
  const r = validarCfdi(ejemplo("invalido"));
  assert.equal(r.ok, false);
  const c = campos(r);
  for (const esperado of ["Receptor.Rfc", "Receptor.UsoCFDI", "Conceptos[0].Importe", "Total"]) assert.ok(c.includes(esperado), esperado);
  assert.match(r.errores.find((e) => e.campo === "Conceptos[0].Importe")!.mensaje, /2501\.00/);
});

test("datos incompletos: cuerpo vacío o sin conceptos", () => {
  assert.equal(validarCfdi(null).ok, false);
  const r = validarCfdi({ Version: "4.0" });
  assert.ok(campos(r).includes("Conceptos"));
  assert.ok(campos(r).includes("Receptor"));
});

test("PPD exige forma de pago 99", () => {
  const c = ejemplo("ingreso-valido");
  c.MetodoPago = "PPD";
  assert.ok(campos(validarCfdi(c)).includes("FormaPago"));
  c.FormaPago = "99";
  assert.equal(validarCfdi(c).ok, true);
});

test("público en general exige S01 y régimen 616", () => {
  const c = ejemplo("ingreso-valido");
  c.Receptor.Rfc = "XAXX010101000";
  const r = validarCfdi(c);
  assert.ok(campos(r).includes("Receptor.UsoCFDI"));
  assert.ok(campos(r).includes("Receptor.RegimenFiscalReceptor"));
});

test("IVA exento: sin tasa ni importe, total = subtotal", () => {
  const c = ejemplo("ingreso-valido");
  const ex = { Base: "2501.00", Impuesto: "002", TipoFactor: "Exento" };
  c.Conceptos[0].Impuestos.Traslados = [ex];
  c.Impuestos = { Traslados: [ex] };
  c.Total = "2501.00";
  assert.deepEqual(validarCfdi(c).errores, []);
});

test("XML y PDF simulados se generan y están rotulados", () => {
  const c = { ...ejemplo("ingreso-valido"), Folio: "1", Fecha: "2026-11-20T10:00:00", Emisor: { RegimenFiscal: "601", Rfc: "EKU9003173C9", Nombre: "ESCUELA KEMPER URGATE" } };
  const t = { uuid: "00000000-0000-4000-8000-000000000000", fechaTimbrado: "2026-11-20T10:00:01" };
  const xml = generarXml(c, t);
  assert.match(xml, /SIN VALIDEZ FISCAL/);
  assert.match(xml, /RfcProvCertif="SIMULADO"/);
  assert.match(xml, /Total="2901.16"/);
  const pdf = Buffer.from(generarPdf(c, t, "vigente")).toString("latin1");
  assert.ok(pdf.startsWith("%PDF-1.4"));
  assert.match(pdf, /SIN VALIDEZ FISCAL/);
  // la tabla xref debe apuntar al inicio real de cada objeto
  const xref = Number(pdf.match(/startxref\n(\d+)/)![1]);
  assert.ok(pdf.slice(xref).startsWith("xref"));
  const off = Number(pdf.slice(xref).split("\n")[3].slice(0, 10));
  assert.ok(pdf.slice(off).startsWith("1 0 obj"));
});

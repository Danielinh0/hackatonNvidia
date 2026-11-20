// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { aCentavos, leerCfdi } from "./cfdi.ts";
import { CFDI_EJEMPLO } from "./cfdi-ejemplo.ts";

test("lee el JSON de ejemplo del modelo", () => {
  const l = leerCfdi(CFDI_EJEMPLO);
  assert.ok(l.ok);
  assert.equal(l.cfdi.total, "2901.16");
  assert.equal(l.cfdi.subTotal, "2501.00");
  assert.equal(l.cfdi.tipoDeComprobante, "I");
  assert.equal(l.cfdi.metodoPago, "PUE");
  assert.equal(l.cfdi.receptor.rfc, "XIA190128J61");
  assert.equal(l.cfdi.receptor.usoCfdi, "G03");
  assert.equal(l.cfdi.totalTraslados, "400.16");
  assert.equal(l.cfdi.conceptos.length, 1);
  assert.equal(l.cfdi.conceptos[0].cantidad, "2");
  assert.deepEqual(l.cfdi.conceptos[0].impuestos, [
    { tipo: "traslado", base: "2501.00", impuesto: "002", tipoFactor: "Tasa", tasaOCuota: "0.160000", importe: "400.16" },
  ]);
  assert.equal(l.cfdi.impuestos.length, 1);
});

test('"AUTO" y lo que no se leyó quedan en null y se anotan como faltantes', () => {
  const l = leerCfdi(CFDI_EJEMPLO);
  assert.ok(l.ok);
  assert.equal(l.cfdi.fecha, null);
  assert.equal(l.cfdi.emisor.rfc, null);
  assert.equal(l.cfdi.emisor.regimenFiscal, "601");
  assert.deepEqual(l.faltantes, ["Fecha", "Emisor.Rfc", "Emisor.Nombre"]);
});

test("acepta el JSON envuelto en { cfdi } y fechas ISO", () => {
  const l = leerCfdi({ cfdi: { ...CFDI_EJEMPLO, Fecha: "2026-11-20T13:05:00", Emisor: { Rfc: "eku9003173c9", Nombre: "Tienda" } } });
  assert.ok(l.ok);
  assert.equal(l.cfdi.fecha, "2026-11-20T13:05:00");
  assert.equal(l.cfdi.emisor.rfc, "EKU9003173C9"); // se normaliza a mayúsculas
  assert.deepEqual(l.faltantes, []);
});

test("descarta valores con forma inválida en lugar de guardarlos", () => {
  const l = leerCfdi({ ...CFDI_EJEMPLO, Total: "$2,901.16", MetodoPago: "XYZ", Receptor: { Rfc: "NO-ES-RFC" } });
  assert.ok(l.ok);
  assert.equal(l.cfdi.total, null);
  assert.equal(l.cfdi.metodoPago, null);
  assert.equal(l.cfdi.receptor.rfc, null);
  assert.ok(l.faltantes.includes("Total"));
});

test("falla si no es objeto o no trae nada útil", () => {
  assert.equal(leerCfdi(null).ok, false);
  assert.equal(leerCfdi("texto").ok, false);
  assert.equal(leerCfdi([1, 2]).ok, false);
  assert.equal(leerCfdi({ Version: "4.0", Fecha: "AUTO" }).ok, false);
});

test("aCentavos convierte sin pasar por flotantes", () => {
  assert.equal(aCentavos("2901.16"), 290116);
  assert.equal(aCentavos("0.1"), 10);
  assert.equal(aCentavos("12"), 1200);
  assert.equal(aCentavos("1250.505"), 125051);
  assert.equal(aCentavos("-5.50"), -550);
  assert.equal(aCentavos("abc"), null);
  assert.equal(aCentavos(null), null);
});

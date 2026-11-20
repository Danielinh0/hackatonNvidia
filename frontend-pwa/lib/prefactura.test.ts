// Ejecutar: pnpm test
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { validarCfdi } from "./cfdi/validar.ts";
import { ESQUEMA } from "./esquema.ts";
import { guardarNegocio } from "./negocio.ts";
import {
  archivoFactura, armarCfdi, bloqueoPrefactura, datosPrefactura, facturaDeComprobante, guardarFactura, tasaIva,
  type DatosPrefactura,
} from "./prefactura.ts";

/* Datos ficticios: RFC con forma válida, sin relación con personas reales. */
const LISTO: DatosPrefactura = {
  id: "c1", estado: "confirmado", clasificacion: "ingreso", serie: "A", folio: "77",
  subtotal: "2150.00", total: "2494.00", total_traslados: "344.00", forma_pago: null, lugar_expedicion: null,
  negocio_nombre: "Tlayudas Doña Mari", negocio_rfc: "MARI880415HR9", negocio_regimen: "626",
};
const OP = { codigoPostal: "68000", formaPago: "01" };

test("solo se factura lo confirmado, y solo si es venta", () => {
  assert.equal(bloqueoPrefactura({ ...LISTO, estado: "por_revisar" })?.accion, "revisar");
  assert.equal(bloqueoPrefactura({ ...LISTO, clasificacion: "egreso" })?.accion, "revisar");
  assert.equal(bloqueoPrefactura({ ...LISTO, negocio_rfc: null })?.accion, "configurar");
  assert.match(bloqueoPrefactura({ ...LISTO, total_traslados: null })!.motivo, /IVA/);
  assert.equal(bloqueoPrefactura(LISTO), null);
});

test("la etiqueta lista todo lo que falta, no solo lo primero", () => {
  const b = bloqueoPrefactura({ ...LISTO, estado: "por_revisar", total_traslados: null, negocio_rfc: null, negocio_regimen: null })!;
  assert.deepEqual(b.faltan.map((f) => f.dato), ["confirmar la revisión", "IVA", "RFC de tu negocio", "régimen fiscal de tu negocio"]);
  assert.equal(b.accion, "revisar");
  assert.equal(b.noAplica, undefined);
  // Compras, pagos y documentos ilegibles no se facturan aquí: no hay "faltantes" que completar.
  assert.equal(bloqueoPrefactura({ ...LISTO, clasificacion: "pago" })!.noAplica, true);
  assert.equal(bloqueoPrefactura({ ...LISTO, estado: "error" })!.noAplica, true);
  assert.deepEqual(bloqueoPrefactura({ ...LISTO, clasificacion: null })!.faltan.map((f) => f.dato), ["marcarlo como venta"]);
});

test("tasa de IVA: la del catálogo que cuadra exacto, o null", () => {
  assert.equal(tasaIva("2150.00", "344.00"), "0.160000");
  assert.equal(tasaIva("100.00", "8.00"), "0.080000");
  assert.equal(tasaIva("100.00", "0.00"), "0.000000");
  assert.equal(tasaIva("100.00", "15.00"), null);
});

test("el CFDI armado copia los importes revisados y pasa la validación de /api/cfdi", () => {
  const r = armarCfdi(LISTO, OP);
  assert.ok(r.ok);
  assert.equal(r.cfdi.SubTotal, "2150.00");
  assert.equal(r.cfdi.Total, "2494.00");
  assert.equal(r.cfdi.Emisor.Rfc, "MARI880415HR9");
  assert.equal(r.cfdi.Receptor.Rfc, "XAXX010101000");
  assert.equal(r.cfdi.Receptor.DomicilioFiscalReceptor, "68000");
  assert.equal(r.cfdi.Conceptos[0].Descripcion, "Venta según ticket A77");
  const v = validarCfdi(r.cfdi);
  assert.deepEqual(v.errores, []);
});

test("si el total revisado no cuadra, la validación lo dice (no se corrige solo)", () => {
  const r = armarCfdi({ ...LISTO, total: "2500.00" }, OP);
  assert.ok(r.ok); // armar no calcula ni corrige
  const v = validarCfdi(r.cfdi);
  assert.ok(v.errores.some((e) => e.campo === "Total" && e.mensaje.includes("2494.00")));
});

test("pide CP, forma de pago e IVA coherente", () => {
  const r = armarCfdi({ ...LISTO, total_traslados: "300.00" }, { codigoPostal: "680", formaPago: "XX" });
  assert.equal(r.ok, false);
  assert.equal(r.ok ? 0 : r.errores.length, 3);
});

test("guarda PDF y XML, uno por comprobante, y solo los ve su dueño", () => {
  const d = new DatabaseSync(":memory:");
  d.exec("PRAGMA foreign_keys = ON;");
  d.exec(ESQUEMA);
  d.prepare("INSERT INTO usuarios (id, email, hash_contrasena) VALUES ('u1', 'a@ejemplo.invalid', 'x'), ('u2', 'b@ejemplo.invalid', 'x')").run();
  d.prepare("INSERT INTO lotes (id, usuario_id, total_enviados) VALUES ('l1', 'u1', 1)").run();
  guardarNegocio(d, "u1", { nombre: "Tlayudas", rfc: "MARI880415HR9", regimen: "626" });
  d.prepare(
    `INSERT INTO comprobantes (id, lote_id, usuario_id, origen, nombre_archivo, tipo_mime, tamano_bytes, sha256, huella_cliente,
       estado, clasificacion, subtotal, total, total_traslados)
     VALUES ('c1', 'l1', 'u1', 'camara', 't.jpg', 'image/jpeg', 10, ?, 1, 'confirmado', 'ingreso', '2150.00', '2494.00', '344.00')`,
  ).run("a".repeat(64));

  const datos = datosPrefactura(d, "u1", "c1");
  assert.equal(datos?.negocio_rfc, "MARI880415HR9");
  assert.equal(datosPrefactura(d, "u2", "c1"), null);

  const f = {
    id: "f1", uuid: "UUID-SIMULADO", proveedor: "mock" as const, simulado: true, validezFiscal: false as const,
    estado: "vigente" as const, serie: "DZ", folio: "1", fecha: "", fechaTimbrado: "",
    emisor: { rfc: "", nombre: "", regimenFiscal: "" }, receptor: { rfc: "", nombre: "", usoCfdi: "" },
    subTotal: "2150.00", total: "2494.00", aviso: "SIMULADO",
  };
  guardarFactura(d, "u1", "c1", f, { bytes: new Uint8Array([37, 80, 68, 70]), nombre: "x.pdf" }, { texto: "<cfdi/>", nombre: "x.xml" });
  assert.equal(facturaDeComprobante(d, "u1", "c1")?.uuid, "UUID-SIMULADO");
  assert.deepEqual([...archivoFactura(d, "u1", "f1", "pdf")!.bytes], [37, 80, 68, 70]);
  assert.equal(archivoFactura(d, "u2", "f1", "pdf"), null);
  assert.throws(() => guardarFactura(d, "u1", "c1", { ...f, id: "f2" }, { bytes: new Uint8Array([1]), nombre: "y.pdf" }, { texto: "", nombre: "y.xml" }));
});

/*
 * Generación del XML y del PDF del PAC SIMULADO. Funciones puras.
 *
 * SIMULADO: el XML tiene la forma de un CFDI 4.0 pero Sello, Certificado y el
 * TimbreFiscalDigital son ficticios (RfcProvCertif="SIMULADO"), así que ningún
 * validador del SAT lo aceptaría. El PDF lleva una marca de agua "SIMULADO" y no
 * incluye el QR de verificación (CLAUDE.md sec. 11).
 */
import { FORMA_PAGO, METODO_PAGO, REGIMEN_FISCAL, USO_CFDI } from "./catalogos.ts";
import type { CfdiEntrada, Traslado } from "./tipos.ts";

export type Timbre = { uuid: string; fechaTimbrado: string };
/** CFDI ya completado por el PAC simulado: Fecha resuelta, Folio asignado, Emisor con RFC y nombre. */
export type CfdiCompleto = CfdiEntrada & { Folio: string; Emisor: { RegimenFiscal: string; Rfc: string; Nombre: string } };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function attrs(o: Record<string, string | undefined>) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => ` ${k}="${esc(String(v))}"`)
    .join("");
}

export function generarXml(c: CfdiCompleto, t: Timbre): string {
  const traslado = (x: Traslado) =>
    `<cfdi:Traslado${attrs({ Base: x.Base, Impuesto: x.Impuesto, TipoFactor: x.TipoFactor, TasaOCuota: x.TasaOCuota, Importe: x.Importe })}/>`;

  const conceptos = c.Conceptos.map((k) => {
    const tr = k.Impuestos?.Traslados ?? [];
    const imp = tr.length ? `<cfdi:Impuestos><cfdi:Traslados>${tr.map(traslado).join("")}</cfdi:Traslados></cfdi:Impuestos>` : "";
    return `\n    <cfdi:Concepto${attrs({
      ClaveProdServ: k.ClaveProdServ, NoIdentificacion: k.NoIdentificacion, Cantidad: k.Cantidad, ClaveUnidad: k.ClaveUnidad,
      Unidad: k.Unidad, Descripcion: k.Descripcion, ValorUnitario: k.ValorUnitario, Importe: k.Importe, ObjetoImp: k.ObjetoImp,
    })}>${imp}</cfdi:Concepto>`;
  }).join("");

  const tg = c.Impuestos?.Traslados ?? [];
  const impuestos = tg.length
    ? `\n  <cfdi:Impuestos${attrs({ TotalImpuestosTrasladados: c.Impuestos?.TotalImpuestosTrasladados })}><cfdi:Traslados>${tg.map(traslado).join("")}</cfdi:Traslados></cfdi:Impuestos>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- SIMULADO · Generado por el PAC simulado de Dzuun. SIN VALIDEZ FISCAL. Sello, certificado y timbre son ficticios. -->
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"${attrs({
    Version: "4.0", Serie: c.Serie, Folio: c.Folio, Fecha: c.Fecha, Sello: "SIMULADO", FormaPago: c.FormaPago,
    NoCertificado: "00000000000000000000", Certificado: "SIMULADO", SubTotal: c.SubTotal, Descuento: c.Descuento,
    Moneda: c.Moneda, Total: c.Total, TipoDeComprobante: c.TipoDeComprobante, Exportacion: c.Exportacion,
    MetodoPago: c.MetodoPago, LugarExpedicion: c.LugarExpedicion,
  })}>
  <cfdi:Emisor${attrs({ Rfc: c.Emisor.Rfc, Nombre: c.Emisor.Nombre, RegimenFiscal: c.Emisor.RegimenFiscal })}/>
  <cfdi:Receptor${attrs({
    Rfc: c.Receptor.Rfc, Nombre: c.Receptor.Nombre, DomicilioFiscalReceptor: c.Receptor.DomicilioFiscalReceptor,
    RegimenFiscalReceptor: c.Receptor.RegimenFiscalReceptor, UsoCFDI: c.Receptor.UsoCFDI,
  })}/>
  <cfdi:Conceptos>${conceptos}
  </cfdi:Conceptos>${impuestos}
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"${attrs({
      Version: "1.1", UUID: t.uuid, FechaTimbrado: t.fechaTimbrado, RfcProvCertif: "SIMULADO",
      SelloCFD: "SIMULADO", NoCertificadoSAT: "00000000000000000000", SelloSAT: "SIMULADO",
    })}/>
  </cfdi:Complemento>
</cfdi:Comprobante>
`;
}

// ---------------------------------------------------------------- PDF mínimo

/** Texto → bytes Latin-1 (WinAnsi) para las fuentes estándar del PDF; escapa ( ) \ */
const pdfTexto = (s: string) =>
  s.normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const dinero = (s: string) => "$" + Number(s).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const recortar = (s: string, n: number) => (s.length > n ? s.slice(0, n - 3) + "..." : s);

/** PDF de una página (A4) escrito a mano, sin dependencias. */
export function generarPdf(c: CfdiCompleto, t: Timbre, estado: "vigente" | "cancelada"): Uint8Array {
  type Linea = { txt: string; bold?: boolean; size?: number; gap?: number };
  const L: Linea[] = [
    { txt: "PRE-FACTURA SIMULADA - SIN VALIDEZ FISCAL", bold: true, size: 14 },
    { txt: "Generada por el PAC simulado de Dzuun. No se envio al SAT ni a un PAC real.", size: 9 },
    { txt: `CFDI ${c.Version} - Tipo ${c.TipoDeComprobante} - Estado: ${estado.toUpperCase()}`, size: 9, gap: 10 },
    { txt: `Serie y folio: ${c.Serie ?? ""}${c.Serie ? "-" : ""}${c.Folio}`, bold: true },
    { txt: `Folio fiscal (UUID SIMULADO): ${t.uuid}` },
    { txt: `Fecha de emision: ${c.Fecha}    Fecha de timbrado (SIMULADO): ${t.fechaTimbrado}` },
    { txt: `Lugar de expedicion: ${c.LugarExpedicion}`, gap: 10 },
    { txt: "EMISOR", bold: true },
    { txt: `${c.Emisor.Nombre} - RFC ${c.Emisor.Rfc}` },
    { txt: `Regimen: ${c.Emisor.RegimenFiscal} ${REGIMEN_FISCAL[c.Emisor.RegimenFiscal] ?? ""}`, gap: 10 },
    { txt: "RECEPTOR", bold: true },
    { txt: `${c.Receptor.Nombre} - RFC ${c.Receptor.Rfc} - C.P. ${c.Receptor.DomicilioFiscalReceptor}` },
    { txt: `Regimen: ${c.Receptor.RegimenFiscalReceptor} ${REGIMEN_FISCAL[c.Receptor.RegimenFiscalReceptor] ?? ""}` },
    { txt: `Uso CFDI: ${c.Receptor.UsoCFDI} ${USO_CFDI[c.Receptor.UsoCFDI] ?? ""}`, gap: 10 },
    { txt: "CONCEPTOS", bold: true },
  ];
  for (const k of c.Conceptos.slice(0, 20)) {
    L.push({ txt: `${k.Cantidad} x ${k.ClaveUnidad}  ${recortar(k.Descripcion, 55)}  (${k.ClaveProdServ})` });
    L.push({ txt: `      P. unitario ${dinero(k.ValorUnitario)}   Importe ${dinero(k.Importe)}   ObjetoImp ${k.ObjetoImp}`, size: 9 });
  }
  if (c.Conceptos.length > 20) L.push({ txt: `... y ${c.Conceptos.length - 20} conceptos mas (ver XML)`, size: 9 });
  L[L.length - 1].gap = 10;
  L.push({ txt: `Subtotal: ${dinero(c.SubTotal)}` });
  for (const tr of c.Impuestos?.Traslados ?? []) {
    L.push({ txt: tr.TipoFactor === "Exento" ? "IVA exento" : `IVA ${Number(tr.TasaOCuota) * 100}%: ${dinero(tr.Importe ?? "0")}` });
  }
  L.push({ txt: `TOTAL: ${dinero(c.Total)} MXN`, bold: true, size: 13 });
  L.push({ txt: `Forma de pago: ${c.FormaPago} ${FORMA_PAGO[c.FormaPago] ?? ""}  -  Metodo: ${c.MetodoPago} ${METODO_PAGO[c.MetodoPago] ?? ""}`, gap: 14 });
  L.push({ txt: "Sello digital: SIMULADO    Certificado: SIMULADO    QR de verificacion: no incluido (SIMULADO)", size: 8 });
  L.push({ txt: "Este documento es una representacion de prueba y no ampara ninguna operacion ante el SAT.", size: 8 });

  let y = 800;
  const ops: string[] = [];
  for (const l of L) {
    const size = l.size ?? 10;
    ops.push(`BT /${l.bold ? "F2" : "F1"} ${size} Tf 40 ${y} Td (${pdfTexto(l.txt)}) Tj ET`);
    y -= size + 5 + (l.gap ?? 0);
  }
  // Marca de agua diagonal en gris claro, dibujada antes del texto.
  const marca = `q 0.88 g BT /F2 54 Tf 0.7071 0.7071 -0.7071 0.7071 110 230 Tm (SIMULADO) Tj ET Q`;
  const contenido = [marca, ...ops].join("\n");

  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(contenido, "latin1")} >>\nstream\n${contenido}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  objetos.forEach((o, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, "latin1"));
}

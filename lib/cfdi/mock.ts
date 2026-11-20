import "server-only";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MOTIVO_CANCELACION } from "./catalogos";
import { generarPdf, generarXml, type CfdiCompleto, type Timbre } from "./documentos";
import type { OpcionesPrueba, ProveedorCfdi } from "./proveedor";
import { ErrorCfdi, type CfdiEntrada, type FacturaResumen } from "./tipos";

/*
 * PAC SIMULADO local. Imita lo que hace un PAC (asignar folio, "timbrar" con un UUID,
 * devolver XML y PDF, cancelar) sin enviar nada a nadie. Todo lo que produce está
 * rotulado SIMULADO y sin validez fiscal.
 *
 * Variables (.env, opcionales):
 *   MOCK_PAC_EMISOR_RFC / MOCK_PAC_EMISOR_NOMBRE  emisor si el CFDI no lo trae
 *   MOCK_PAC_LATENCIA_MS   retraso artificial por llamada (default 300)
 *   MOCK_PAC_TASA_FALLO    0–1, fracción de emisiones que responden 503 (default 0)
 *   MOCK_PAC_PERSISTIR     true = guarda en .mock-pac/facturas.json (default: solo memoria)
 */
const num = (v: string | undefined, d: number) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : d;
};
const conf = () => ({
  rfc: (process.env.MOCK_PAC_EMISOR_RFC ?? "EKU9003173C9").split("#")[0].trim(),
  nombre: (process.env.MOCK_PAC_EMISOR_NOMBRE ?? "ESCUELA KEMPER URGATE").split("#")[0].trim(),
  latencia: num(process.env.MOCK_PAC_LATENCIA_MS, 300),
  tasaFallo: num(process.env.MOCK_PAC_TASA_FALLO, 0),
  persistir: (process.env.MOCK_PAC_PERSISTIR ?? "").trim().startsWith("true"),
});

type Guardada = { id: string; timbre: Timbre; cfdi: CfdiCompleto; estado: "vigente" | "cancelada"; motivoCancelacion?: string };

const ARCHIVO = path.join(process.cwd(), ".mock-pac", "facturas.json");
const g = globalThis as unknown as { __mockPac?: Map<string, Guardada> };

function almacen(): Map<string, Guardada> {
  if (!g.__mockPac) {
    g.__mockPac = new Map();
    if (conf().persistir) {
      try {
        for (const f of JSON.parse(readFileSync(ARCHIVO, "utf8")) as Guardada[]) g.__mockPac.set(f.id, f);
      } catch {
        /* primera vez: no existe el archivo */
      }
    }
  }
  return g.__mockPac;
}

function guardar() {
  if (!conf().persistir) return;
  mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  const tmp = ARCHIVO + ".tmp";
  writeFileSync(tmp, JSON.stringify([...almacen().values()], null, 2));
  renameSync(tmp, ARCHIVO); // escritura atómica: no queda un JSON a medias si se corta
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hora local de Ciudad de México en formato CFDI (AAAA-MM-DDThh:mm:ss). */
function ahoraCdmx(): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

function resumen(f: Guardada): FacturaResumen {
  return {
    id: f.id,
    uuid: f.timbre.uuid,
    proveedor: "mock",
    simulado: true,
    validezFiscal: false,
    estado: f.estado,
    serie: f.cfdi.Serie ?? null,
    folio: f.cfdi.Folio,
    fecha: f.cfdi.Fecha,
    fechaTimbrado: f.timbre.fechaTimbrado,
    emisor: { rfc: f.cfdi.Emisor.Rfc, nombre: f.cfdi.Emisor.Nombre, regimenFiscal: f.cfdi.Emisor.RegimenFiscal },
    receptor: { rfc: f.cfdi.Receptor.Rfc, nombre: f.cfdi.Receptor.Nombre, usoCfdi: f.cfdi.Receptor.UsoCFDI },
    subTotal: f.cfdi.SubTotal,
    total: f.cfdi.Total,
    ...(f.motivoCancelacion ? { motivoCancelacion: f.motivoCancelacion } : {}),
    aviso: "SIMULADO: timbrado por el PAC simulado de Dzuun. UUID, sello y timbre son ficticios; sin validez fiscal.",
  };
}

function buscar(id: string): Guardada {
  const f = almacen().get(id);
  if (!f) throw new ErrorCfdi(404, "no_encontrada", "No existe una factura con ese id.");
  return f;
}

/** Siguiente folio numérico de la serie (1 si es la primera). */
function siguienteFolio(serie: string | undefined): string {
  const usados = [...almacen().values()].filter((f) => (f.cfdi.Serie ?? "") === (serie ?? "")).map((f) => parseInt(f.cfdi.Folio, 10) || 0);
  return String(Math.max(0, ...usados) + 1);
}

export const mock: ProveedorCfdi = {
  nombre: "mock",
  descripcion: "PAC simulado local (SIMULADO, sin validez fiscal)",

  async emitir(entrada: CfdiEntrada, op: OpcionesPrueba = {}) {
    const c = conf();
    if (op.simularFallo === "timeout") {
      await esperar(5000);
      throw new ErrorCfdi(504, "pac_timeout", "El PAC simulado no respondió a tiempo. Intenta de nuevo.");
    }
    await esperar(c.latencia);
    if (op.simularFallo === "pac-caido" || Math.random() < c.tasaFallo) {
      throw new ErrorCfdi(503, "pac_no_disponible", "El PAC simulado no está disponible (fallo provocado para pruebas). Intenta de nuevo.");
    }
    if (op.simularFallo === "rechazo") {
      throw new ErrorCfdi(422, "pac_rechazo", "El PAC simulado rechazó el comprobante (CFDI40999 SIMULADO: rechazo provocado para pruebas).");
    }

    const folio = entrada.Folio?.trim() || siguienteFolio(entrada.Serie);
    const duplicado = [...almacen().values()].find((f) => (f.cfdi.Serie ?? "") === (entrada.Serie ?? "") && f.cfdi.Folio === folio);
    if (duplicado) {
      throw new ErrorCfdi(409, "folio_duplicado", `Ya existe la factura ${entrada.Serie ?? ""}${folio} (id ${duplicado.id}). Omite "Folio" para asignar el siguiente.`);
    }

    const cfdi: CfdiCompleto = {
      ...entrada,
      Fecha: entrada.Fecha === "AUTO" ? ahoraCdmx() : entrada.Fecha,
      Folio: folio,
      Receptor: { ...entrada.Receptor, Rfc: entrada.Receptor.Rfc.toUpperCase() },
      Emisor: { RegimenFiscal: entrada.Emisor.RegimenFiscal, Rfc: entrada.Emisor.Rfc ?? c.rfc, Nombre: entrada.Emisor.Nombre ?? c.nombre },
    };
    const f: Guardada = { id: randomUUID(), timbre: { uuid: randomUUID().toUpperCase(), fechaTimbrado: ahoraCdmx() }, cfdi, estado: "vigente" };
    almacen().set(f.id, f);
    guardar();
    return resumen(f);
  },

  async obtener(id) {
    return resumen(buscar(id));
  },

  async listar() {
    return [...almacen().values()].map(resumen).sort((a, b) => b.fechaTimbrado.localeCompare(a.fechaTimbrado));
  },

  async archivo(id, formato) {
    const f = buscar(id);
    const base = `SIMULADO_${f.cfdi.Serie ?? ""}${f.cfdi.Folio}_${f.timbre.uuid}`;
    if (formato === "xml") {
      return { bytes: new TextEncoder().encode(generarXml(f.cfdi, f.timbre)), tipo: "application/xml; charset=utf-8", nombre: `${base}.xml` };
    }
    return { bytes: generarPdf(f.cfdi, f.timbre, f.estado), tipo: "application/pdf", nombre: `${base}.pdf` };
  },

  async cancelar(id, motivo, uuidSustitucion) {
    const f = buscar(id);
    if (!(motivo in MOTIVO_CANCELACION)) throw new ErrorCfdi(400, "motivo_invalido", "Motivo de cancelación no válido (01, 02, 03 o 04).");
    if (motivo === "01" && !uuidSustitucion) throw new ErrorCfdi(400, "falta_sustitucion", "Con motivo 01 indica el UUID de la factura que la sustituye (uuidSustitucion).");
    if (f.estado === "cancelada") throw new ErrorCfdi(409, "ya_cancelada", "Esta factura ya estaba cancelada.");
    await esperar(conf().latencia);
    f.estado = "cancelada";
    f.motivoCancelacion = `${motivo} ${MOTIVO_CANCELACION[motivo]}`;
    guardar();
    return resumen(f);
  },
};

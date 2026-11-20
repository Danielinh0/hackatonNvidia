"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MAX_ARCHIVOS, MAX_LOTE_BYTES, sha256Hex, verificarArchivo, type TipoPermitido } from "@/lib/verificacion";

/*
 * Recibe un lote de fotos, comprueba cada archivo, guarda los válidos en SQLite,
 * relee los bytes guardados para confirmar que quedaron íntegros y redirige a la
 * pantalla de confirmación.
 * Pendiente: verificar el ID token de Firebase cuando exista el login (CLAUDE.md sec. 16).
 */

export type EstadoSubida = { error: string | null; rechazados: { nombre: string; motivo: string }[] };

type Aceptado = { nombre: string; tipo: TipoPermitido; sha256: string; huellaCliente: boolean; bytes: Uint8Array };

export async function subirLote(_prev: EstadoSubida, form: FormData): Promise<EstadoSubida> {
  const archivos = form.getAll("archivos").filter((a): a is File => a instanceof File && a.name !== "");
  const huellas = form.getAll("sha256").map(String);
  const tamanos = form.getAll("tamano").map(Number);

  if (archivos.length === 0) return { error: "No llegó ninguna foto. Vuelve a elegirla.", rechazados: [] };
  if (archivos.length > MAX_ARCHIVOS) return { error: `Máximo ${MAX_ARCHIVOS} archivos por envío.`, rechazados: [] };
  if (archivos.reduce((s, a) => s + a.size, 0) > MAX_LOTE_BYTES) {
    return { error: "El lote pesa más de 40 MB. Envíalo en partes.", rechazados: [] };
  }

  // 1 · Verificar cada archivo. Un fallo no bloquea a los demás.
  const aceptados: Aceptado[] = [];
  const rechazados: EstadoSubida["rechazados"] = [];
  for (const [i, archivo] of archivos.entries()) {
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const r = verificarArchivo(bytes, tamanos[i] ?? NaN, huellas[i] ?? "");
    if (r.ok) aceptados.push({ nombre: archivo.name, tipo: r.tipo, sha256: r.sha256, huellaCliente: r.huellaCliente, bytes });
    else rechazados.push({ nombre: archivo.name, motivo: r.motivo });
  }
  if (aceptados.length === 0) return { error: "Ninguna foto pasó la verificación.", rechazados };

  // 2 · Guardar en una sola transacción y 3 · releer lo guardado para comprobarlo.
  const loteId = randomUUID();
  let d;
  try {
    d = db();
  } catch (e) {
    console.error("subirLote: no se pudo abrir la base", e);
    return { error: "No pudimos abrir la base de datos. Intenta de nuevo.", rechazados };
  }

  try {
    d.exec("BEGIN IMMEDIATE");
    d.prepare("INSERT INTO lotes (id, total_enviados, rechazados) VALUES (?, ?, ?)").run(
      loteId,
      archivos.length,
      JSON.stringify(rechazados),
    );
    const insertar = d.prepare(
      `INSERT INTO imagenes (id, lote_id, nombre_original, tipo_mime, tamano_bytes, sha256, huella_cliente, datos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const a of aceptados) {
      insertar.run(randomUUID(), loteId, a.nombre, a.tipo, a.bytes.length, a.sha256, a.huellaCliente ? 1 : 0, a.bytes);
    }

    const guardadas = d.prepare("SELECT sha256, datos FROM imagenes WHERE lote_id = ?").all(loteId) as {
      sha256: string;
      datos: Uint8Array;
    }[];
    const integro =
      guardadas.length === aceptados.length && guardadas.every((g) => sha256Hex(g.datos) === g.sha256);
    if (!integro) throw new Error("La huella guardada no coincide");

    d.exec("COMMIT");
  } catch (e) {
    if (d.isTransaction) d.exec("ROLLBACK");
    console.error("subirLote:", e);
    return { error: "No pudimos guardar tus fotos. No se guardó nada; intenta de nuevo.", rechazados };
  }

  // redirect() lanza una excepción especial: va fuera del try/catch.
  redirect(`/subir/recibido/${loteId}`);
}

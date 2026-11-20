"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { analizarDocumento } from "@/lib/analisis";
import { guardarComprobante, yaSubido, type Analisis, type Archivo } from "@/lib/comprobantes";
import { db, esUuid } from "@/lib/db";
import { quitarConError } from "@/lib/operaciones";
import { usuarioActual } from "@/lib/sesion";
import { MAX_ARCHIVOS, MAX_LOTE_BYTES, verificarArchivo } from "@/lib/verificacion";

/*
 * Recibe un lote de fotos o PDFs, comprueba cada archivo, lo manda EN MEMORIA al servicio
 * de visión y guarda en SQLite solo los datos leídos (tabla `comprobantes`).
 * PRIVACIDAD: los bytes nunca se escriben en la base ni en disco; al terminar esta función se
 * descartan. La vista previa la arma el teléfono con su propia copia (lib/fotos-locales.ts).
 * Exige sesión válida: el lote queda a nombre de la persona (CLAUDE.md sec. 16).
 */

export type EstadoSubida = { error: string | null; rechazados: { nombre: string; motivo: string }[] };

export async function subirLote(_prev: EstadoSubida, form: FormData): Promise<EstadoSubida> {
  // Se valida aquí (no basta el proxy): las Server Actions se pueden llamar directamente.
  const usuario = await usuarioActual();
  if (!usuario) return { error: "Tu sesión terminó. Vuelve a entrar.", rechazados: [] };

  const archivos = form.getAll("archivos").filter((a): a is File => a instanceof File && a.name !== "");
  const huellas = form.getAll("sha256").map(String);
  const tamanos = form.getAll("tamano").map(Number);
  const origen: Archivo["origen"] = form.get("origen") === "camara" ? "camara" : "archivo";

  if (archivos.length === 0) return { error: "No llegó ninguna foto. Vuelve a elegirla.", rechazados: [] };
  if (archivos.length > MAX_ARCHIVOS) return { error: `Máximo ${MAX_ARCHIVOS} archivos por envío.`, rechazados: [] };
  if (archivos.reduce((s, a) => s + a.size, 0) > MAX_LOTE_BYTES) {
    return { error: "El lote pesa más de 40 MB. Envíalo en partes.", rechazados: [] };
  }

  let d;
  try {
    d = db();
  } catch (e) {
    console.error("subirLote: no se pudo abrir la base", e);
    return { error: "No pudimos abrir la base de datos. Intenta de nuevo.", rechazados: [] };
  }

  // 1 · Verificar cada archivo. Un fallo no bloquea a los demás.
  const verificados: { archivo: Archivo; bytes: Uint8Array }[] = [];
  const rechazados: EstadoSubida["rechazados"] = [];
  for (const [i, f] of archivos.entries()) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const r = verificarArchivo(bytes, tamanos[i] ?? NaN, huellas[i] ?? "");
    if (!r.ok) rechazados.push({ nombre: f.name, motivo: r.motivo });
    else if (yaSubido(d, usuario.id, r.sha256)) rechazados.push({ nombre: f.name, motivo: "Ya habías subido este mismo archivo." });
    else {
      const archivo = { origen, nombre: f.name, tipo: r.tipo, tamano: bytes.length, sha256: r.sha256, huellaCliente: r.huellaCliente };
      verificados.push({ archivo, bytes });
    }
  }
  if (verificados.length === 0) return { error: "Ninguna foto se pudo procesar.", rechazados };

  // 2 · Analizar en memoria (en paralelo). Si el servicio falla, se guarda el error, no la foto.
  const metadatos = verificados.map((v) => v.archivo);
  const analisis: Analisis[] = await Promise.all(
    verificados.map(({ archivo, bytes }) => analizarDocumento(bytes, archivo.tipo, archivo.nombre)),
  );
  verificados.length = 0; // suelta las referencias a los bytes

  // 3 · Guardar los datos leídos en una sola transacción.
  const loteId = randomUUID();
  try {
    d.exec("BEGIN IMMEDIATE");
    d.prepare("INSERT INTO lotes (id, usuario_id, total_enviados, rechazados) VALUES (?, ?, ?, ?)").run(
      loteId,
      usuario.id,
      archivos.length,
      JSON.stringify(rechazados),
    );
    analisis.forEach((a, i) => guardarComprobante(d, { loteId, usuarioId: usuario.id, archivo: metadatos[i], analisis: a }));
    d.exec("COMMIT");
  } catch (e) {
    if (d.isTransaction) d.exec("ROLLBACK");
    console.error("subirLote:", e);
    return { error: "No pudimos guardar los datos leídos. No se guardó nada; intenta de nuevo.", rechazados };
  }

  // redirect() lanza una excepción especial: va fuera del try/catch.
  redirect(`/subir/recibido/${loteId}`);
}

/** Quita de "Subir" un archivo que falló al analizarse. */
export async function quitarFallido(form: FormData) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/entrar");
  const id = String(form.get("id") ?? "");
  if (esUuid(id)) quitarConError(db(), usuario.id, id);
  redirect("/subir");
}

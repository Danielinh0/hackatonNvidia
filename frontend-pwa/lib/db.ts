import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ESQUEMA } from "./esquema";

/*
 * Base de datos SQLite con el módulo integrado de Node (node:sqlite): sin servidor,
 * sin dependencias nativas. Es un solo archivo: data/dzuun.sqlite (ignorado por git).
 * Se puede cambiar la ruta con la variable DZUUN_DB.
 * Se guarda en globalThis para no reabrirla en cada recarga de `next dev`.
 */
const RUTA = process.env.DZUUN_DB ?? path.join(process.cwd(), "data", "dzuun.sqlite");
const global = globalThis as unknown as { __dzuunDb?: DatabaseSync; __dzuunEsquema?: string };

export function db(): DatabaseSync {
  // En `next dev` la conexión sobrevive a las recargas, pero el código del esquema puede haber
  // cambiado (p. ej. una tabla nueva). ESQUEMA es idempotente: si cambió, se vuelve a aplicar.
  if (global.__dzuunDb && global.__dzuunEsquema !== ESQUEMA) {
    global.__dzuunDb.exec(ESQUEMA);
    global.__dzuunEsquema = ESQUEMA;
  }
  if (!global.__dzuunDb) {
    mkdirSync(path.dirname(RUTA), { recursive: true });
    const d = new DatabaseSync(RUTA);
    // secure_delete: al borrar, SQLite sobrescribe con ceros en lugar de solo marcar libre.
    d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA secure_delete = ON;");
    // Versiones anteriores guardaban las fotos (tabla `imagenes`, columna BLOB). Ya no se guardan:
    // se borra la tabla y se compacta el archivo para que los bytes no queden en disco.
    // Las cuentas, sesiones y lotes se conservan.
    if (d.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'imagenes'").get()) {
      d.exec("DROP TABLE imagenes; PRAGMA wal_checkpoint(TRUNCATE); VACUUM;");
      console.info("dzuun: se borró la tabla `imagenes` (fotos guardadas por versiones anteriores).");
    }
    d.exec(ESQUEMA);
    // CREATE TABLE IF NOT EXISTS no modifica tablas viejas: si la base es de una versión
    // anterior del esquema, avisamos claro en lugar de fallar con errores raros al insertar.
    const columnas = (d.prepare("PRAGMA table_info(usuarios)").all() as { name: string }[]).map((c) => c.name);
    if (!columnas.includes("hash_contrasena")) {
      d.close();
      throw new Error(`La base ${RUTA} es de un esquema anterior. En desarrollo, borra la carpeta data/ y reinicia.`);
    }
    // Columna agregada el 20-nov-2026: qué parte del análisis fue simulada (lib/simulado.ts).
    const colsComp = (d.prepare("PRAGMA table_info(comprobantes)").all() as { name: string }[]).map((c) => c.name);
    if (!colsComp.includes("simulado_partes")) d.exec("ALTER TABLE comprobantes ADD COLUMN simulado_partes TEXT");
    global.__dzuunDb = d;
    global.__dzuunEsquema = ESQUEMA;
  }
  return global.__dzuunDb;
}

export const esUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

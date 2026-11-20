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
const global = globalThis as unknown as { __dzuunDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!global.__dzuunDb) {
    mkdirSync(path.dirname(RUTA), { recursive: true });
    const d = new DatabaseSync(RUTA);
    d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    d.exec(ESQUEMA);
    // CREATE TABLE IF NOT EXISTS no modifica tablas viejas: si la base es de una versión
    // anterior del esquema, avisamos claro en lugar de fallar con errores raros al insertar.
    const columnas = (d.prepare("PRAGMA table_info(usuarios)").all() as { name: string }[]).map((c) => c.name);
    if (!columnas.includes("hash_contrasena")) {
      d.close();
      throw new Error(`La base ${RUTA} es de un esquema anterior. En desarrollo, borra la carpeta data/ y reinicia.`);
    }
    global.__dzuunDb = d;
  }
  return global.__dzuunDb;
}

export const esUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

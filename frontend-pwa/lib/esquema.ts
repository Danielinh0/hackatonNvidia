/*
 * Esquema SQLite de Dzuun. Se aplica solo al abrir la base (lib/db.ts) y es
 * idempotente: se puede volver a correr sin borrar datos.
 */
export const ESQUEMA = /* sql */ `
-- Personas con cuenta. Por ahora el acceso es local (correo + contraseña);
-- google_sub queda para cuando se active "Continuar con Google" (docs/login.md).
CREATE TABLE IF NOT EXISTS usuarios (
  id              TEXT PRIMARY KEY,                  -- UUID v4
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nombre          TEXT,
  hash_contrasena TEXT,                              -- scrypt (lib/contrasena.ts); NULL si solo usa Google
  google_sub      TEXT UNIQUE,
  foto_url        TEXT,
  creado_en       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ultimo_acceso   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (hash_contrasena IS NOT NULL OR google_sub IS NOT NULL)
) STRICT;

-- Sesiones abiertas. Solo se guarda el sha256 del token: si alguien copia la base,
-- no puede usar las sesiones. El token real vive únicamente en la cookie del teléfono.
CREATE TABLE IF NOT EXISTS sesiones (
  token_sha256 TEXT PRIMARY KEY CHECK (length(token_sha256) = 64),
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_en    TEXT NOT NULL,                        -- ISO 8601 UTC
  creado_en    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;
CREATE INDEX IF NOT EXISTS sesiones_usuario_idx ON sesiones (usuario_id);

-- Un lote = un envío desde la pantalla "Subir" (una o varias fotos).
CREATE TABLE IF NOT EXISTS lotes (
  id             TEXT    PRIMARY KEY,                -- UUID v4
  usuario_id     TEXT    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  total_enviados INTEGER NOT NULL CHECK (total_enviados > 0),
  -- Archivos que no pasaron la verificación: [{"nombre": "...", "motivo": "..."}].
  -- Un fallo no bloquea el lote (CLAUDE.md sec. 13).
  rechazados     TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(rechazados)),
  creado_en      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

-- Cada archivo aceptado, con sus bytes tal cual llegaron para poder volver a
-- comprobar su huella (sha256) en cualquier momento.
CREATE TABLE IF NOT EXISTS imagenes (
  id              TEXT    PRIMARY KEY,
  lote_id         TEXT    NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  nombre_original TEXT    NOT NULL,
  tipo_mime       TEXT    NOT NULL CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  tamano_bytes    INTEGER NOT NULL CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),  -- máx. 10 MB
  sha256          TEXT    NOT NULL CHECK (length(sha256) = 64),
  huella_cliente  INTEGER NOT NULL CHECK (huella_cliente IN (0, 1)),  -- 1 = el teléfono mandó su huella y coincidió
  datos           BLOB    NOT NULL,
  -- Estado para el flujo siguiente (visión + OCR, revisión humana).
  estado          TEXT    NOT NULL DEFAULT 'recibida'
                  CHECK (estado IN ('recibida', 'procesando', 'lista', 'error')),
  creado_en       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX IF NOT EXISTS imagenes_lote_idx ON imagenes (lote_id);
`;

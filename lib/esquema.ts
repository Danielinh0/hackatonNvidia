/*
 * Esquema SQLite de Dzuun. Se aplica solo al abrir la base (lib/db.ts) y es
 * idempotente: se puede volver a correr sin borrar datos.
 */
export const ESQUEMA = /* sql */ `
-- Un lote = un envío desde la pantalla "Subir" (una o varias fotos).
CREATE TABLE IF NOT EXISTS lotes (
  id             TEXT    PRIMARY KEY,                -- UUID v4
  usuario_uid    TEXT,                               -- uid de Firebase cuando exista login; NULL en la demo
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

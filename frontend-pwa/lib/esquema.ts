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

-- ─── Documentos analizados ──────────────────────────────────────────────────────
-- PRIVACIDAD: la foto o el PDF NUNCA se guarda. Viaja en memoria al servicio de
-- visión, se analiza y se descarta. Aquí solo quedan los datos leídos y la huella
-- (sha256) para detectar duplicados y reconocer el archivo si la persona lo vuelve
-- a elegir en su teléfono (la vista previa se arma ahí, no en el servidor).
--
-- Los campos siguen el JSON del modelo, que imita el CFDI 4.0 (Anexo 20 del SAT).
-- Importes y tasas se guardan como TEXTO decimal tal cual vienen ("2901.16",
-- "0.160000"): así no se pierde precisión ni se redondea en la base. Las
-- comprobaciones fiscales (subtotal + IVA = total, etc.) van en
-- backend-ia/reglas_fiscales.py, no aquí (CLAUDE.md sec. 0).
CREATE TABLE IF NOT EXISTS comprobantes (
  id                 TEXT    PRIMARY KEY,           -- UUID v4
  lote_id            TEXT    NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  usuario_id         TEXT    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Archivo de origen (solo metadatos, sin bytes)
  origen             TEXT    NOT NULL CHECK (origen IN ('camara', 'archivo')),
  nombre_archivo     TEXT    NOT NULL,
  tipo_mime          TEXT    NOT NULL CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  tamano_bytes       INTEGER NOT NULL CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  sha256             TEXT    NOT NULL CHECK (length(sha256) = 64),
  huella_cliente     INTEGER NOT NULL CHECK (huella_cliente IN (0, 1)),  -- 1 = coincidió con la del teléfono

  -- Flujo: el modelo lee → la persona revisa y corrige → confirma (CLAUDE.md sec. 3d)
  estado             TEXT    NOT NULL DEFAULT 'por_revisar'
                     CHECK (estado IN ('por_revisar', 'confirmado', 'descartado', 'error')),
  error              TEXT,                           -- por qué no se pudo analizar (estado = 'error')
  analisis_simulado  INTEGER NOT NULL DEFAULT 0 CHECK (analisis_simulado IN (0, 1)),  -- 1 = SIMULADO, no lo leyó el modelo
  json_modelo        TEXT    CHECK (json_modelo IS NULL OR json_valid(json_modelo)), -- salida cruda del modelo (evidencia)
  faltantes          TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(faltantes)),    -- campos que el modelo no leyó, p. ej. ["Fecha","Emisor.Rfc"]
  conf_global        REAL    CHECK (conf_global IS NULL OR conf_global BETWEEN 0 AND 1),

  -- Nodo Comprobante (CFDI 4.0). NULL = no se leyó.
  version            TEXT,
  serie              TEXT,
  folio              TEXT,
  fecha              TEXT,                           -- ISO 8601; el modelo manda "AUTO" cuando no la leyó → NULL
  forma_pago         TEXT,                           -- c_FormaPago (03 = transferencia)
  metodo_pago        TEXT    CHECK (metodo_pago IS NULL OR metodo_pago IN ('PUE', 'PPD')),
  moneda             TEXT,
  tipo_comprobante   TEXT    CHECK (tipo_comprobante IS NULL OR tipo_comprobante IN ('I', 'E', 'T', 'N', 'P')),
  exportacion        TEXT,
  lugar_expedicion   TEXT,                           -- código postal
  subtotal           TEXT,
  descuento          TEXT,
  total              TEXT,
  total_centavos     INTEGER,                        -- copia de total en centavos, solo para sumar en "Mi mes"
  total_traslados    TEXT,                           -- Impuestos/TotalImpuestosTrasladados
  total_retenciones  TEXT,                           -- Impuestos/TotalImpuestosRetenidos
  uuid_cfdi          TEXT,                           -- Complemento/TimbreFiscalDigital/UUID si se leyó

  -- Emisor y receptor
  emisor_rfc         TEXT,
  emisor_nombre      TEXT,
  emisor_regimen     TEXT,                           -- c_RegimenFiscal
  receptor_rfc       TEXT,
  receptor_nombre    TEXT,
  receptor_cp        TEXT,                           -- DomicilioFiscalReceptor
  receptor_regimen   TEXT,
  receptor_uso_cfdi  TEXT,                           -- c_UsoCFDI

  -- Interpretación para el negocio (CLAUDE.md sec. 13). La propone el código/IA; la confirma la persona.
  clasificacion      TEXT    CHECK (clasificacion IS NULL OR clasificacion IN ('ingreso', 'egreso', 'pago')),
  categoria          TEXT,

  creado_en          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  confirmado_en      TEXT,
  CHECK (estado <> 'error' OR error IS NOT NULL)
) STRICT;
CREATE INDEX IF NOT EXISTS comprobantes_lote_idx ON comprobantes (lote_id);
CREATE INDEX IF NOT EXISTS comprobantes_usuario_idx ON comprobantes (usuario_id, fecha);
CREATE INDEX IF NOT EXISTS comprobantes_huella_idx ON comprobantes (usuario_id, sha256);

-- Conceptos (renglones) del comprobante.
CREATE TABLE IF NOT EXISTS conceptos (
  id                 INTEGER PRIMARY KEY,
  comprobante_id     TEXT    NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  orden              INTEGER NOT NULL,               -- posición en el documento (0, 1, …)
  clave_prod_serv    TEXT,                           -- c_ClaveProdServ
  no_identificacion  TEXT,
  cantidad           TEXT,
  clave_unidad       TEXT,                           -- c_ClaveUnidad (H87 = pieza)
  unidad             TEXT,
  descripcion        TEXT,
  valor_unitario     TEXT,
  importe            TEXT,
  descuento          TEXT,
  objeto_imp         TEXT,                           -- c_ObjetoImp (02 = sí objeto de impuesto)
  UNIQUE (comprobante_id, orden)
) STRICT;

-- Impuestos trasladados (IVA, IEPS) y retenidos (ISR, IVA).
-- concepto_id NULL = resumen del comprobante (nodo Impuestos general).
CREATE TABLE IF NOT EXISTS impuestos (
  id                 INTEGER PRIMARY KEY,
  comprobante_id     TEXT    NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  concepto_id        INTEGER REFERENCES conceptos(id) ON DELETE CASCADE,
  tipo               TEXT    NOT NULL CHECK (tipo IN ('traslado', 'retencion')),
  base               TEXT,
  impuesto           TEXT    CHECK (impuesto IS NULL OR impuesto IN ('001', '002', '003')),  -- ISR, IVA, IEPS
  tipo_factor        TEXT    CHECK (tipo_factor IS NULL OR tipo_factor IN ('Tasa', 'Cuota', 'Exento')),
  tasa_o_cuota       TEXT,
  importe            TEXT
) STRICT;
CREATE INDEX IF NOT EXISTS impuestos_comprobante_idx ON impuestos (comprobante_id);

-- Cada corrección que hace la persona en la revisión: qué leyó el modelo y qué quedó.
-- Sirve para medir errores del modelo y para la evaluación de HCI (CLAUDE.md sec. 5).
CREATE TABLE IF NOT EXISTS correcciones (
  id                 INTEGER PRIMARY KEY,
  comprobante_id     TEXT    NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  campo              TEXT    NOT NULL,               -- ruta del JSON: "Receptor.Rfc", "Conceptos[0].Cantidad"
  valor_modelo       TEXT,
  valor_final        TEXT,
  conf               REAL    CHECK (conf IS NULL OR conf BETWEEN 0 AND 1),
  creado_en          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;
`;

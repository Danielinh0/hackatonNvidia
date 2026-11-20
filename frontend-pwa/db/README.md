# Base de datos local (SQLite)

Guarda las cuentas (acceso local con correo y contraseña), sus sesiones y **los datos leídos** de los tickets y facturas que suben desde `/subir`.

> **Privacidad:** la foto o el PDF **no se guarda** en ningún lado del servidor. Viaja en memoria al servicio de visión, se analiza y se descarta. La vista previa vive solo en la memoria del navegador del teléfono (`lib/fotos-locales.ts`): si la persona recarga, cambia de teléfono o borra el archivo, ve los datos pero no la foto, con un aviso de por qué.

- **Sin instalación:** usa `node:sqlite`, que viene integrado en Node.js (probado con v26). No hay servidor ni dependencias nativas.
- **Un solo archivo:** `data/dzuun.sqlite`. Se crea solo, con sus tablas, la primera vez que se usa. Está en `.gitignore` porque contiene datos personales y fiscales.
- **Otra ubicación:** `DZUUN_DB=/ruta/a/otra.sqlite pnpm dev`.
- **Empezar de cero:** borra la carpeta `data/`.
- **Esquema:** `lib/esquema.ts`.

## Tablas

| Tabla | Para qué |
|---|---|
| `usuarios` | Cuentas: correo (único, sin distinguir mayúsculas), nombre, `hash_contrasena` (scrypt) y, si se activa Google, `google_sub` y foto |
| `sesiones` | Sesiones abiertas: solo el sha256 del token, a quién pertenece y cuándo vence |
| `lotes` | Un envío desde "Subir" (de un `usuario_id`): cuántos archivos llegaron y cuáles se rechazaron (`rechazados`, JSON) |
| `negocios` | Uno por cuenta (pantalla Configurar): nombre, RFC (12 o 13) y régimen (`626`, `612` o `625`). Con su RFC se propone si un comprobante es venta o compra |
| `comprobantes` | Un documento analizado: metadatos del archivo (origen cámara/archivo, nombre, tipo, tamaño, `sha256`, **sin bytes**), `estado` (`por_revisar` → `confirmado`/`descartado`, o `error` con su motivo), salida cruda del modelo (`json_modelo`), campos que faltan (`faltantes`), atributos del CFDI 4.0 (serie, folio, fecha, forma/método de pago, moneda, tipo, subtotal, total…), emisor, receptor y la clasificación para el negocio (ingreso/egreso/pago, categoría) |
| `conceptos` | Renglones del comprobante (clave SAT, cantidad, unidad, descripción, valor unitario, importe, objeto de impuesto) |
| `impuestos` | Traslados (IVA, IEPS) y retenciones; `concepto_id` NULL = resumen del comprobante |
| `correcciones` | Qué leyó el modelo y qué dejó la persona en la revisión, campo por campo (medición de errores y evidencia de HCI) |

### Del JSON del modelo a las tablas

| JSON (forma CFDI 4.0) | Columna |
|---|---|
| `Version`, `Serie`, `Folio`, `FormaPago`, `MetodoPago`, `Moneda`, `TipoDeComprobante`, `Exportacion`, `LugarExpedicion` | `comprobantes.version`, `serie`, `folio`, `forma_pago`, `metodo_pago`, `moneda`, `tipo_comprobante`, `exportacion`, `lugar_expedicion` |
| `Fecha` (`"AUTO"` = no se leyó → NULL y va a `faltantes`) | `comprobantes.fecha` |
| `SubTotal`, `Descuento`, `Total` | `subtotal`, `descuento`, `total` (texto decimal) y `total_centavos` (solo para sumar) |
| `Emisor.{Rfc, Nombre, RegimenFiscal}` | `emisor_rfc`, `emisor_nombre`, `emisor_regimen` |
| `Receptor.{Rfc, Nombre, DomicilioFiscalReceptor, RegimenFiscalReceptor, UsoCFDI}` | `receptor_rfc`, `receptor_nombre`, `receptor_cp`, `receptor_regimen`, `receptor_uso_cfdi` |
| `Conceptos[i]` | una fila en `conceptos` (`orden` = i) |
| `Conceptos[i].Impuestos.Traslados/Retenciones[]` | filas en `impuestos` con `concepto_id` |
| `Impuestos.TotalImpuestosTrasladados/Retenidos` | `total_traslados`, `total_retenciones` |
| `Impuestos.Traslados/Retenciones[]` | filas en `impuestos` con `concepto_id` NULL |
| `Complemento.TimbreFiscalDigital.UUID` | `uuid_cfdi` |

Las consultas de las pantallas (operaciones, resumen del mes, semanas, revisión y correcciones) están en `lib/operaciones.ts`; el negocio en `lib/negocio.ts`. Las sumas usan solo lo **confirmado** y no calculan impuestos.

La lectura y validación de forma está en `lib/cfdi.ts` (RFC, decimales, fechas, catálogos cortos; lo inválido queda en NULL). **No** cuadra montos: eso va en `backend-ia/reglas_fiscales.py`. El guardado está en `lib/comprobantes.ts`.

Para revisarla a mano (si tienes la herramienta `sqlite3`):

```bash
sqlite3 data/dzuun.sqlite "SELECT nombre_archivo, estado, emisor_nombre, total, faltantes FROM comprobantes;"
```

## Cómo se procesa una subida (`app/subir/acciones.ts`)

1. El teléfono calcula el `sha256` de cada archivo (solo en https o localhost) y guarda una vista previa **en su memoria**.
2. El servidor (`lib/verificacion.ts`) revisa tamaño, tipo real por los primeros bytes y que el `sha256` coincida.
   Si esa persona ya subió el mismo archivo, se avisa y no se vuelve a analizar.
3. Los bytes se mandan en memoria a `POST {BACKEND_URL}/vision/analizar` con `BACKEND_TOKEN` (`lib/analisis.ts`).
4. En una transacción se guardan el lote y, por archivo, sus datos leídos o el motivo del error. Los bytes se descartan.
5. Se redirige a `/subir/recibido/[id]`, que muestra los datos y la foto solo si el teléfono aún la tiene.

Variables (`.env.local`): `BACKEND_URL`, `BACKEND_TOKEN`. Sin servicio de visión, `ANALISIS_SIMULADO=1` usa
`lib/cfdi-ejemplo.ts` y lo marca **SIMULADO** en la base (`analisis_simulado = 1`) y en pantalla.

Pruebas: `pnpm test` (`lib/*.test.ts`: cfdi, comprobantes, negocio, operaciones, verificacion, cuenta, google).

**Migración:** si la base es de una versión que guardaba fotos (tabla `imagenes`), al abrirla se borra esa tabla y se
compacta el archivo (`VACUUM`, con `secure_delete`). Cuentas, sesiones y lotes se conservan.

## Límites y pendientes

- **Vercel:** el disco de sus funciones es temporal, así que la base se perdería. Para la demo, corre la app con
  `pnpm build && pnpm start` en una computadora o en el servidor del equipo.
- Cada persona solo ve sus lotes y comprobantes: las consultas filtran por `usuario_id` (login en `docs/login.md`).
- **Cambios de esquema:** las tablas se crean con `CREATE TABLE IF NOT EXISTS`, así que agregar columnas a una tabla
  existente requiere borrar `data/` (en desarrollo) o escribir una migración.

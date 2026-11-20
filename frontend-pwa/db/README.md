# Base de datos local (SQLite)

Guarda los lotes de fotos que se suben desde `/subir`.

- **Sin instalación:** usa `node:sqlite`, que viene integrado en Node.js (probado con v26). No hay servidor ni dependencias nativas.
- **Un solo archivo:** `data/dzuun.sqlite`. Se crea solo, con sus tablas, la primera vez que se usa. Está en `.gitignore` porque contiene las fotos.
- **Otra ubicación:** `DZUUN_DB=/ruta/a/otra.sqlite pnpm dev`.
- **Empezar de cero:** borra la carpeta `data/`.
- **Esquema:** `lib/esquema.ts`.

## Tablas

| Tabla | Para qué |
|---|---|
| `lotes` | Un envío desde "Subir": cuántos archivos llegaron y cuáles se rechazaron (`rechazados`, JSON) |
| `imagenes` | Cada archivo aceptado: nombre, tipo real, tamaño, `sha256`, bytes (`datos`, BLOB) y `estado` para el flujo de visión |

Para revisarla a mano (si tienes la herramienta `sqlite3`):

```bash
sqlite3 data/dzuun.sqlite "SELECT id, nombre_original, tamano_bytes, huella_cliente, estado FROM imagenes;"
```

## Cómo se comprueba que llegó bien

1. El teléfono calcula el `sha256` de cada foto antes de enviarla (solo en https o localhost).
2. El servidor (`lib/verificacion.ts`) revisa que el tamaño coincida, que el tipo real sea JPG, PNG, WEBP o PDF
   (por los primeros bytes) y que su `sha256` sea igual al del teléfono.
3. Se guarda en una transacción, se releen los bytes guardados y se recalcula su `sha256`. Si no coincide, se deshace todo.
4. Solo entonces se redirige a `/subir/recibido/[lote]` ("¡Todo bien!").

Pruebas de la verificación: `pnpm test`.

## Límites y pendientes

- **Vercel:** el disco de sus funciones es temporal, así que la base se perdería. Para la demo, corre la app con
  `pnpm build && pnpm start` en una computadora o en el servidor del equipo.
- **CLAUDE.md sec. 16** contempla Firestore + Cloud Storage. Si se mantiene SQLite, hay que actualizar esa sección.
- **Sin login:** `usuario_uid` queda en NULL y `/api/imagenes/[id]` no pide token. Hay que protegerlo con el
  ID token de Firebase antes de usar datos reales.

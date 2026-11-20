# Base de datos local (SQLite)

Guarda las cuentas (acceso local con correo y contraseña), sus sesiones y los lotes de fotos que suben desde `/subir`.

- **Sin instalación:** usa `node:sqlite`, que viene integrado en Node.js (probado con v26). No hay servidor ni dependencias nativas.
- **Un solo archivo:** `data/dzuun.sqlite`. Se crea solo, con sus tablas, la primera vez que se usa. Está en `.gitignore` porque contiene las fotos.
- **Otra ubicación:** `DZUUN_DB=/ruta/a/otra.sqlite pnpm dev`.
- **Empezar de cero:** borra la carpeta `data/`.
- **Esquema:** `lib/esquema.ts`.

## Tablas

| Tabla | Para qué |
|---|---|
| `usuarios` | Cuentas: correo (único, sin distinguir mayúsculas), nombre, `hash_contrasena` (scrypt) y, si se activa Google, `google_sub` y foto |
| `sesiones` | Sesiones abiertas: solo el sha256 del token, a quién pertenece y cuándo vence |
| `lotes` | Un envío desde "Subir" (de un `usuario_id`): cuántos archivos llegaron y cuáles se rechazaron (`rechazados`, JSON) |
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
- Cada persona solo ve sus lotes e imágenes: las consultas filtran por `usuario_id` (login en `docs/login.md`).
- **Cambios de esquema:** las tablas se crean con `CREATE TABLE IF NOT EXISTS`, así que agregar columnas a una tabla
  existente requiere borrar `data/` (en desarrollo) o escribir una migración.

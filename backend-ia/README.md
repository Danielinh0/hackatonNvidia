# backend-ia: servicio de IA de Dzuun (FastAPI)

Lo llama **solo el servidor Next.js** (`frontend-pwa/lib/analisis.ts`) con un secreto compartido. El teléfono nunca llega aquí directo (CLAUDE.md sec. 16).

```
foto → Next.js ──Bearer BACKEND_TOKEN──> POST /vision/analizar
                                          ├─ vision_pipeline.extraer_texto()   Tesseract hoy · YOLO + OCR (PENDIENTE: equipo de visión)
                                          └─ llm_service.Asistente.leer()      Qwen2.5-7B + adaptador LoRA → JSON CFDI validado
```

| Archivo | Qué hace |
|---|---|
| `app.py` | Rutas `/salud`, `/asistente/leer`, `/vision/analizar`; límite de 10 MB; sin CORS ni `/docs` |
| `llm_service.py` | Carga base + adaptador (`ADAPTADOR`), genera y **valida** que la respuesta tenga las claves del contrato. Si no, responde error; nunca la "arregla" |
| `prompt_lector.txt` | Prompt de sistema, idéntico al del entrenamiento (al arrancar se compara con `dataset/test.jsonl`) |
| `vision_pipeline.py` | Imagen → texto OCR: Tesseract de respaldo hoy; **aquí se conecta YOLO** (`_texto_yolo`, contrato en el archivo) |
| `auth_backend.py` | Revisa `Authorization: Bearer <BACKEND_TOKEN>` |

## Variables de entorno
| Variable | Valor |
|---|---|
| `BACKEND_TOKEN` | Obligatoria, ≥ 16 caracteres; **la misma** en `frontend-pwa/.env.local` |
| `ADAPTADOR` | Carpeta del adaptador, p. ej. `../training/asistente/adapters/prueba` (luego `epoca1`). Vacía = modelo base (solo para comparar) |
| `MODO_MEMORIA` | `auto` (por defecto): `bajo` si la GPU tiene < 10 GB (RTX 4050), si no `normal`. `bajo` = doble cuantización + embeddings en RAM |
| `VISION_MODO` | `tesseract` (por defecto, OCR preentrenado de respaldo) · `simulada` (texto de ejemplo, SIMULADO) · `yolo` (PENDIENTE, modelo del equipo) |
| `LLM_SIMULADO=1` | No carga el modelo; salida fija real de `prueba`, marcada **SIMULADO**. Solo para probar sin GPU |

Con `LLM_SIMULADO=1` o `VISION_MODO=simulada` la respuesta trae `"simulado": true` y la app la guarda y la muestra como SIMULADO. **En la demo, ninguno de los dos.**
**Tesseract no es un modelo entrenado por el equipo:** es un complemento declarado (CLAUDE.md sec. 17). El modelo de visión que acredita el requisito es YOLO (`VISION_MODO=yolo`, pendiente).

## Correr los dos servicios en la laptop con la RTX 4050

Se necesitan **dos terminales**: una para FastAPI (IA, puerto 8000) y otra para la app Next.js (puerto 3000).

### 0. Una sola vez: instalar
```bash
# Tesseract con español (programa del sistema). Según la distro:
sudo dnf install tesseract tesseract-langpack-spa          # Fedora
sudo apt install tesseract-ocr tesseract-ocr-spa           # Ubuntu/Debian
sudo pacman -S tesseract tesseract-data-spa                # Arch
tesseract --list-langs                                     # debe aparecer "spa"

cd ~/Documentos/git/hackatonNvidia/backend-ia
source .venv/bin/activate             # fish: source .venv/bin/activate.fish  (Python 3.12, ya creado)
uv pip install -r requirements.txt

python -c "import secrets; print(secrets.token_urlsafe(32))"   # copia el secreto
```

### 1. Terminal 1: FastAPI con el modelo entrenado
```bash
cd ~/Documentos/git/hackatonNvidia/backend-ia
source .venv/bin/activate             # fish: .venv/bin/activate.fish
export BACKEND_TOKEN="<el secreto>"   # fish: set -x BACKEND_TOKEN "<el secreto>"
export ADAPTADOR=../training/asistente/adapters/prueba
uvicorn app:app --host 127.0.0.1 --port 8000
```
Espera `Asistente listo en NVIDIA GeForce RTX 4050 ...` (~1 min). Debe decir `modo de memoria bajo`.

### 2. Probar FastAPI solo (otra terminal)
```bash
curl http://127.0.0.1:8000/salud      # asistente.cargado=true, vision.conectado=true

# Asistente con texto (sin foto)
curl -X POST http://127.0.0.1:8000/asistente/leer \
  -H "Authorization: Bearer <el secreto>" -H "Content-Type: application/json" \
  -d '{"texto": "TLAPALERIA EL SOL\nNota de venta 14199\nFecha: 2026-07-02 08:42:47\nTotal $ 3156.00\nForma pago: EFECTIVO"}'

# Foto completa: OCR + asistente
curl -X POST http://127.0.0.1:8000/vision/analizar \
  -H "Authorization: Bearer <el secreto>" -F "imagen=@/ruta/a/foto_ticket.jpg"
```
En `/vision/analizar` revisa `texto_ocr`, que muestra lo que leyó Tesseract. Si el JSON sale mal, primero mira si el OCR leyó bien.

### 3. Terminal 2: la app
```bash
cd ~/Documentos/git/hackatonNvidia/frontend-pwa
```
Crear o editar `.env.local`, **sin** `ANALISIS_SIMULADO`:
```
BACKEND_URL=http://127.0.0.1:8000
BACKEND_TOKEN=<el mismo secreto>
```
```bash
pnpm install        # solo la primera vez
pnpm dev
```
Abre http://localhost:3000, crea una cuenta y entra a **Subir**. Sube la foto de un ticket y revisa los datos en **Revisión**. Si el backend responde 422 o 503, la app muestra el motivo (foto sin texto, OCR no instalado, etc.).

### Desde el teléfono
La red UsaLab aísla los equipos. Usa un hotspot con la laptop y el teléfono conectados, arranca la app con `pnpm dev -H 0.0.0.0` y abre `http://<IP-de-la-laptop>:3000`. FastAPI puede quedarse en `127.0.0.1`: solo Next.js le habla.

### Sin GPU (solo para conectar la app)
```bash
LLM_SIMULADO=1 VISION_MODO=simulada uvicorn app:app --host 127.0.0.1 --port 8000
```

## Respuestas
- `200`: `{"cfdi": {...}, "conf_global": null, "simulado": bool, "adaptador": "...", "segundos": n}`; `/vision/analizar` agrega `"vision"` y `"texto_ocr"`.
- `400`: falta la imagen o el texto.
- `401`: sin token.
- `413`: la imagen pesa más de 10 MB.
- `422`: el modelo no devolvió un JSON válido o no se encontró un ticket.
- `503`: el OCR no está conectado.

La imagen no se escribe en disco.

## Pendiente
- `_texto_yolo` con YOLO11 + OCR (hoy: Tesseract de respaldo). **Ojo:** el asistente se entrenó con el texto del ticket completo, línea por línea. Mandarle recortes sueltos puede bajar la calidad.
- Confianza por campo (`conf_global`, CLAUDE.md sec. 14).
- `/asistente/chat` (conversación de Bisie', con prompt) y `/asistente/transcribir`.
- `reglas_fiscales.py`.
- Tiempo por ticket: `lib/analisis.ts` corta a los 60 s. Si la 4050 tarda más, subir `ESPERA_MS`.

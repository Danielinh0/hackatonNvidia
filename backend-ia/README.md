# backend-ia: servicio de IA de Dzuun (FastAPI)

Lo llama **solo el servidor Next.js** (`frontend-pwa/lib/analisis.ts`) con un secreto compartido. El teléfono nunca llega aquí directo (CLAUDE.md sec. 16).

```
foto → Next.js ──Bearer BACKEND_TOKEN──> POST /vision/analizar
                                          ├─ vision_pipeline.extraer_texto()   YOLO + OCR (PENDIENTE: equipo de visión)
                                          └─ llm_service.Asistente.leer()      Qwen2.5-7B + adaptador LoRA → JSON CFDI validado
```

| Archivo | Qué hace |
|---|---|
| `app.py` | Rutas `/salud`, `/asistente/leer`, `/vision/analizar`; límite de 10 MB; sin CORS ni `/docs` |
| `llm_service.py` | Carga base + adaptador (`ADAPTADOR`), genera y **valida** que la respuesta tenga las claves del contrato. Si no, responde error; nunca la "arregla" |
| `prompt_lector.txt` | Prompt de sistema, idéntico al del entrenamiento (al arrancar se compara con `dataset/test.jsonl`) |
| `vision_pipeline.py` | Imagen → texto OCR. **Aquí se conecta YOLO + OCR** (contrato en el archivo) |
| `auth_backend.py` | Revisa `Authorization: Bearer <BACKEND_TOKEN>` |

## Variables de entorno
| Variable | Valor |
|---|---|
| `BACKEND_TOKEN` | Obligatoria, ≥ 16 caracteres; **la misma** en `frontend-pwa/.env.local`. Generar con `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `ADAPTADOR` | Carpeta del adaptador, p. ej. `../training/asistente/adapters/epoca1`. Vacía = modelo base (solo para comparar) |
| `LLM_SIMULADO=1` | No carga el modelo; responde siempre la salida real de `prueba` para test-00000, marcada **SIMULADO**. Para conectar la app sin GPU |
| `VISION_SIMULADA=1` | Sin YOLO/OCR: usa el texto de `training/asistente/ejemplos/ticket_ejemplo.txt`, marcado **SIMULADO** |

Con cualquier `*_SIMULADO` la respuesta trae `"simulado": true` y la app lo guarda y lo muestra como SIMULADO. **En la demo, ninguno de los dos.**

## Arrancar
Python **3.12** (con 3.14 no instala `tokenizers`).

```bash
cd backend-ia
uv venv --python 3.12 && source .venv/bin/activate      # (pip install uv si no lo tienes)
uv pip install -r requirements.txt

export BACKEND_TOKEN="<el secreto>"

# a) Sin GPU, para conectar la app
LLM_SIMULADO=1 VISION_SIMULADA=1 uvicorn app:app --host 0.0.0.0 --port 8000

# b) Con el modelo entrenado (laptop RTX 4050). Tarda ~1 min en cargar
ADAPTADOR=../training/asistente/adapters/prueba uvicorn app:app --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` permite que otra laptop de la misma red (hotspot) llegue al puerto 8000. Si Next.js corre en la misma laptop, puedes usar `--host 127.0.0.1`.

## Probar
```bash
curl http://localhost:8000/salud
curl -X POST http://localhost:8000/asistente/leer \
  -H "Authorization: Bearer $BACKEND_TOKEN" -H "Content-Type: application/json" \
  -d "{\"texto\": $(python -c 'import json;print(json.dumps(open("../training/asistente/ejemplos/ticket_ejemplo.txt").read()))')}"
```

## Conectar la app
En `frontend-pwa/.env.local` (sin `ANALISIS_SIMULADO`):
```
BACKEND_URL=http://localhost:8000          # o http://<IP-de-la-laptop>:8000
BACKEND_TOKEN=<el mismo secreto>
```

## Respuestas
- `200`: `{"cfdi": {...}, "conf_global": null, "simulado": bool, "adaptador": "...", "segundos": n}`.
- `400`: falta la imagen o el texto.
- `401`: sin token.
- `413`: la imagen pesa más de 10 MB.
- `422`: el modelo no devolvió un JSON válido o no se encontró un ticket.
- `503`: el OCR no está conectado.

La imagen no se escribe en disco.

## Pendiente
- `vision_pipeline.extraer_texto` con YOLO11 + OCR. **Ojo:** el asistente se entrenó con el texto del ticket completo, línea por línea. Mandarle recortes sueltos puede bajar la calidad.
- Confianza por campo (`conf_global`, CLAUDE.md sec. 14).
- `/asistente/chat` (conversación de Bisie', con prompt) y `/asistente/transcribir`.
- `reglas_fiscales.py`.
- Tiempo por ticket: `lib/analisis.ts` corta a los 60 s. Si la 4050 tarda más, subir `ESPERA_MS`.

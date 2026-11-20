# Visión de Dzuun: cómo integrarla (para el backend)

Modelos entrenados por el equipo en el lab NVIDIA DLI (TAO Toolkit 5.5, Tesla T4):
- `modelos/model_best.pth`: OCDNet (detecta palabras), ajustado desde `nvidia/tao/ocdnet:trainable_resnet18_v1.0`.
- `modelos/ocrnet.onnx` + `modelos/character_list`: OCRNet (lee cada palabra), ajustado desde `nvidia/tao/ocrnet:trainable_v1.0`.
- `modelos/SHA256SUMS`: huellas. El endpoint `/salud` las devuelve para acreditar ante el jurado qué pesos se usan.

## 1. Código
Rama `vision-tao` del repo: `git fetch && git checkout vision-tao`. Todo está en `backend-ia/`.

## 2. Pesos (no van en git: pesan ~380 MB)
Copia la carpeta `modelos/` de esta entrega a `backend-ia/modelos/`.

## 3. Instalar y levantar (Python 3.10+, sin GPU)
```bash
cd backend-ia
python3 -m venv .venv
.venv/bin/pip install -r requirements-vision.txt --extra-index-url https://download.pytorch.org/whl/cpu
DZUUN_ORIGENES=http://localhost:3000 .venv/bin/uvicorn app_vision:app --host 0.0.0.0 --port 8000
```
Comprueba: `curl http://localhost:8000/salud`

## 4. Usarlo
```bash
curl -F "imagen=@ticket.jpg" http://localhost:8000/vision/leer
```
Responde (tarda ~13 s en CPU; muestra un "procesando" en la PWA):
- `palabras`: cada palabra con `texto`, `poligono` (4 puntos en píxeles de la foto), `conf_caja`, `conf_ocr`.
- `segmentos`: palabras agrupadas por fila (`id`, `texto`, `poligono`, `linea`, confianzas, `palabras`).
- `texto_para_llm`: una fila por línea del ticket, p. ej. `[22] TOTAL A PAGAR | [23] $1351.40`. Esto es lo que se manda al LLM;
  el LLM responde qué segmento es cada campo (`"total": {"valor": "1351.40", "seg": [23]}`), y con `seg` se recupera la caja.
- `modelos`: archivo y sha256 de los pesos usados.
- `errores`: `IMAGEN_INVALIDA` o `SIN_TEXTO`, con `mensaje` listo para mostrar.
HTTP 413 si la foto pesa más de 10 MB, 400 si llega vacía.

Después del LLM, valida con `reglas_fiscales.validar_ticket({"rfc", "fecha_hora", "subtotal", "iva", "total", "forma_pago"})`.
El contrato final de `/vision/analizar` y ejemplos SIMULADOS están en `backend-ia/fixtures/` y CLAUDE.md sec. 16.

## Pendiente del backend
- Verificar el ID token de Firebase en cada petición (CLAUDE.md sec. 16).
- `llm_service.py`: texto_para_llm -> campos JSON.

## Resultados medidos (datos sintéticos; las fotos reales se evalúan aparte)
- OCRNet solo, 3,511 palabras de test: 97.41 % exactas, 99.23 % de caracteres.
- De punta a punta (detección + lectura), 6 fotos de val: 94.5 % de palabras correctas con unclip_ratio 2.5.

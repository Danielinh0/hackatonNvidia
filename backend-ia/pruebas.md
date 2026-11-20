# Pruebas unitarias del backend (FastAPI)

> Ejecución real del 20-nov-2026 · Python 3.12.16 · pytest 8.3.4 · **71 pruebas: 71 pasaron, 0 fallaron (0.71 s)**.
> Salida completa: `docs/evidencias/pruebas_backend.txt`.

## 1. Alcance

Estas pruebas revisan **el servicio**: rutas HTTP, autenticación, validación del JSON CFDI, manejo de errores y que lo simulado se marque como SIMULADO.

**No evalúan la calidad de los modelos.** No usan GPU ni cargan Qwen2.5-7B, YOLO u OCR. El asistente corre con `LLM_SIMULADO=1` o con un tokenizador y un modelo **falsos** (`tests/falsos.py`), que no imitan a Qwen: solo tienen la misma forma de llamarse y devuelven un texto fijo. La evaluación de visión y del asistente (≥ 10 casos, base contra ajustado) se hace aparte, con el modelo real en la GPU.

Tampoco cubren `reglas_fiscales.py`, porque todavía no existe.

## 2. Cómo ejecutarlas

```bash
cd backend-ia
source .venv/bin/activate
uv pip install -r requirements-dev.txt   # pytest==8.3.4, httpx==0.28.1
python -m pytest
```

La configuración está en `pytest.ini` (`testpaths = tests`, `pythonpath = .`).

## 3. Archivos

| Archivo | Contenido |
|---|---|
| `tests/conftest.py` | Fija `BACKEND_TOKEN` de prueba y `LLM_SIMULADO=1` antes de importar `app.py`; carga los datos del repo y crea el `TestClient` (ejecuta el arranque del servicio) |
| `tests/falsos.py` | Tokenizador, modelo y `torch` falsos para probar `Asistente.leer` sin GPU |
| `tests/test_auth.py` | `auth_backend.py`: secreto compartido |
| `tests/test_validar.py` | `llm_service.validar`: forma del JSON CFDI |
| `tests/test_asistente.py` | `llm_service.Asistente`: entrada, modo simulado y generación |
| `tests/test_vision.py` | `vision_pipeline.py`: visión simulada o no conectada |
| `tests/test_app.py` | `app.py`: rutas `/salud`, `/asistente/leer` y `/vision/analizar` |

## 4. Datos utilizados

Ningún dato se inventó para simular un resultado: los de prueba salen del repo. Los únicos valores escritos a mano son entradas inválidas o de relleno (punto 4.4).

### 4.1 Texto OCR de ejemplo
Viene de `training/asistente/ejemplos/ticket_ejemplo.txt`. Es **sintético** y corresponde al caso `test-00000` del dataset.

```
TLAPALERIA EL SOL
Nota  de venta  14199
Fecha:  2026-07-02   08:42:47
Subtotal   $ 2720.69
Iva $   435.31
Total  $ 3156.00
Forma pago: TARJETA   DEBITO
TARJ ****  3457    AUT 968708
MONEDA: MXN
Gracias por su visita
```

### 4.2 Respuesta correcta de `test-00000`
Viene de `training/asistente/dataset/test.jsonl`, mensaje `assistant`.

```json
{"Version":"AUTO","Serie":"AUTO","Folio":"14199","Fecha":"2026-07-02T08:42:47","FormaPago":"AUTO",
 "FormaPagoLeida":"TARJETA DEBITO","MetodoPago":"AUTO","Moneda":"MXN","TipoDeComprobante":"AUTO",
 "Exportacion":"AUTO","LugarExpedicion":"AUTO","SubTotal":"2720.69","Total":"3156.00",
 "Emisor":{"Rfc":"AUTO","Nombre":"TLAPALERIA EL SOL","RegimenFiscal":"AUTO"},
 "Receptor":{"Rfc":"AUTO","Nombre":"AUTO","DomicilioFiscalReceptor":"AUTO","RegimenFiscalReceptor":"AUTO","UsoCFDI":"AUTO"},
 "Conceptos":[],"Impuestos":{"TotalImpuestosTrasladados":"435.31"},
 "Complemento":{"TimbreFiscalDigital":{"UUID":"AUTO"}}}
```

Coincide con `SALIDA_SIMULADA` de `llm_service.py` (la salida real del adaptador `prueba` para este caso). Una prueba lo comprueba.

### 4.3 Dataset de prueba completo
Las **200** líneas de `training/asistente/dataset/test.jsonl` (sintético). Se usan para dos cosas:
- comprobar que `validar()` acepta todas las respuestas correctas sin cambiarlas;
- comprobar que el prompt de sistema de los 200 casos es idéntico a `prompt_lector.txt`.

### 4.4 Entradas de prueba escritas a mano
| Dato | Uso |
|---|---|
| `token-de-prueba-0123456789` | `BACKEND_TOKEN` solo para las pruebas (no es un secreto real) |
| `\x89PNG\r\n\x1a\n` + 100 bytes en cero | "Imagen" de relleno; la visión todavía no la lee |
| Archivo de 0 bytes | Imagen vacía |
| 10 MB exactos y 10 MB + 1 byte | Límite de tamaño de imagen |
| `"x"` × 8000 y × 8001 | Límite de texto (`MAX_TEXTO`) |
| `""`, `"   "`, `"\n\n"`, `None` | Texto vacío |
| `"Claro, el total es 3156"`, `"hola"`, `"{\"Total\": "`, `"Aquí está tu JSON: {}"` | Respuestas del modelo que no son JSON |
| `"[]"`, `"\"AUTO\""`, `"42"`, `"null"` | Respuestas que son JSON pero no objeto |
| Respuesta de 4.2 con claves borradas, tipos cambiados o una clave `Inventado` | Validación de la forma |

## 5. Casos y resultados

Todos los casos de las tablas siguientes dieron **PASSED**.

### 5.1 `test_auth.py` — secreto compartido (11)
| Caso | Entrada | Esperado |
|---|---|---|
| Token configurado | `BACKEND_TOKEN` de prueba | Lo devuelve |
| Token ausente o corto (×3) | `""`, `"corto"`, 15 caracteres | `RuntimeError`: el servicio no arranca |
| Token de 16 caracteres | `"a"×16` | Aceptado (es el mínimo) |
| Bearer correcto | `Bearer <token>` | Pasa |
| Cabecera incorrecta (×5) | vacía, `Bearer `, otro token, token + `x`, `Basic <token>` | 401 "No autorizado." |

### 5.2 `test_validar.py` — forma del JSON CFDI (20)
| Caso | Entrada | Esperado |
|---|---|---|
| Dataset completo | 200 respuestas de `test.jsonl` | Todas válidas e idénticas a la original |
| Orden | Respuesta 4.2 | Claves en el orden del contrato (`CLAVES`) |
| No modifica valores | Respuesta 4.2 | `Total` 3156.00, `SubTotal` 2720.69; `FormaPago` sigue en `AUTO` (no convierte "TARJETA DEBITO" a clave SAT) |
| Bloque markdown | ` ```json … ``` ` | Lo quita y acepta el JSON |
| Clave extra | `"Inventado": "x"` | Se descarta |
| No es JSON (×4) | ver 4.4 | `ErrorLectura` "no devolvió un JSON válido" |
| No es objeto (×4) | `[]`, `"AUTO"`, `42`, `null` | `ErrorLectura` "no devolvió un objeto JSON" |
| Faltan claves | Sin `Total` ni `Emisor` | `ErrorLectura` que dice "Total, Emisor" |
| Tipo incorrecto (×4) | `Emisor` texto, `Receptor` lista, `Conceptos` objeto, `Impuestos` texto | `ErrorLectura` "tipo inesperado" |

### 5.3 `test_asistente.py` — clase `Asistente` (17)
| Caso | Entrada | Esperado |
|---|---|---|
| Prompt = entrenamiento | 200 casos de `test.jsonl` | Mismo prompt de sistema |
| Texto vacío (×4) | `""`, `"   "`, `"\n\n"`, `None` | `EntradaInvalida` "No llegó texto" |
| Texto largo | 8001 caracteres | `EntradaInvalida` "demasiado largo" |
| Texto en el límite | 8000 caracteres | Aceptado |
| Modo simulado | Ticket 4.1 | No carga el modelo; `simulado: true`; adaptador dice "SIMULADO" |
| Salida simulada | Ticket 4.1 | Igual a la respuesta correcta 4.2 |
| Copia independiente | Modificar la respuesta | `SALIDA_SIMULADA` no cambia |
| Modelo sin cargar | `simulado=False`, `cargado=False` | `ErrorLectura` "todavía no está listo" |
| Estado | — | `simulado`, `cargado`, `modelo_base` = Qwen/Qwen2.5-7B-Instruct |
| Formato de mensajes | Ticket 4.1, modelo falso | Sistema + usuario idénticos a `test-00000` del dataset |
| Respuesta válida | Modelo falso responde 4.2 | `simulado: false`, CFDI correcto, una sola generación |
| Respuesta inválida | Modelo falso responde texto | `ErrorLectura`; no se "arregla" |
| Variables de entorno (×2) | `LLM_SIMULADO=0`, `ADAPTADOR=""` | No simulado; sin adaptador |

### 5.4 `test_vision.py` — visión (6)
| Caso | Entrada | Esperado |
|---|---|---|
| Visión no conectada | Sin `VISION_SIMULADA` | `OCRNoDisponible`; estado `conectado: false` |
| Visión simulada | `VISION_SIMULADA=1` | Devuelve el ticket 4.1 |
| Solo `"1"` activa la simulación (×4) | `"0"`, `"true"`, `"si"`, `""` | No simulado |

### 5.5 `test_app.py` — rutas HTTP (17)
| Caso | Petición | Esperado |
|---|---|---|
| Salud | `GET /salud` sin token | 200, `ok: true` |
| Sin documentación pública | `/docs`, `/redoc`, `/openapi.json` | 404 |
| Sin token o con token equivocado (×2) | `POST /asistente/leer` y `/vision/analizar` | 401 |
| Arranque sin secreto | Sin `BACKEND_TOKEN` | `RuntimeError`: no arranca |
| Leer ticket | `POST /asistente/leer` con 4.1 | 200, CFDI = 4.2, `simulado: true`, `conf_global: null` |
| Texto vacío | `{"texto": "  "}` | 400 "No llegó texto para leer." |
| Falta el campo | `{}` | 422 |
| El modelo responde mal | Modelo falso: `"no es json"` | 422 "JSON válido" |
| Modelo no simulado | Modelo falso responde 4.2 | 200, `simulado: false` |
| Visión no conectada | `POST /vision/analizar` | 503 "no está conectado" |
| Visión simulada | Con `VISION_SIMULADA=1` | 200, `simulado: true`, CFDI = 4.2 |
| Visión simulada + modelo no simulado | Las dos cosas juntas | Toda la respuesta sigue marcada `simulado: true` |
| Sin imagen | Sin archivo | 422 |
| Imagen vacía | 0 bytes | 400 "No llegó la imagen." |
| Imagen grande | 10 MB + 1 byte | 413 |
| Imagen en el límite | 10 MB exactos | 200 |
| Foto sin ticket | `ImagenIlegible` | 422 "No encontramos un ticket en la foto." |
| Privacidad | Análisis en una carpeta temporal | No se escribe ningún archivo en disco |

## 6. Resultado

```
platform linux -- Python 3.12.16, pytest-8.3.4, pluggy-1.7.0
collected 71 items

tests/test_app.py ........ 17 passed
tests/test_asistente.py .. 17 passed
tests/test_auth.py ....... 11 passed
tests/test_validar.py .... 20 passed
tests/test_vision.py .....  6 passed
======================== 71 passed, 1 warning in 0.71s =========================
```

El aviso (`DeprecationWarning`) viene de la librería starlette, por un nombre de anyio que dejará de usarse. No viene del código del equipo.

## 7. Observaciones y límites

- **El token se acepta sin el prefijo `Bearer `.** `auth_backend.py` usa `removeprefix("Bearer ")`, así que `Authorization: <token>` también pasa. El secreto sigue siendo obligatorio; si se quiere exigir el formato exacto, hay que cambiar esa línea.
- **Lo simulado sigue marcado en las pruebas.** Con `LLM_SIMULADO=1` o `VISION_SIMULADA=1`, las respuestas salen con `simulado: true`. En la demo no se usa ninguna de las dos variables.
- **La visión (YOLO + OCR) está pendiente.** Sin simulación, `/vision/analizar` responde 503, y así se prueba.
- **Falta:** pruebas de `reglas_fiscales.py` (cuando exista), de `/asistente/chat` y de `/asistente/transcribir`, y de `Asistente.cargar()` con GPU real.
- **Uso de IA:** las pruebas se escribieron con apoyo de Claude Code (Anthropic). Hay que registrarlo en `docs/declaracion_ia.md`.

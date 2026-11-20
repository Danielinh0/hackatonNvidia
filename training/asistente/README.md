# Entrenamiento del asistente de Dzuun (paquete C · asistente)

> Todo número de este archivo sale de una ejecución real (archivo o log indicado al lado).
> Lo marcado **PENDIENTE** se llena al terminar la corrida, copiando de `logs/<corrida>/registro.json`. No se estima ni se redondea a mano.

## 1. Objetivo del asistente
El asistente lee el **texto que entrega el OCR** de un ticket, una factura impresa u otro papel y responde **solo un JSON con forma CFDI 4.0** (el contrato de `frontend-pwa/lib/cfdi.ts`, CLAUDE.md sec. 16). Es la tarea (a) de la sec. 17.

Reglas que aprende (prompt de sistema en cada ejemplo del dataset):
1. Copiar solo lo escrito; lo que no aparece o no se lee → `"AUTO"`.
2. No calcular subtotal, IVA ni total si no están impresos (los cálculos van en `backend-ia/reglas_fiscales.py`).
3. No convertir palabras a claves SAT; la forma de pago en palabras va en `FormaPagoLeida`.
4. Formato fijo: importes `"1160.00"`, fechas ISO, RFC en mayúsculas.
5. Corregir solo confusiones de OCR dentro de importes (O→0, l→1, S→5, B→8); con otros símbolos → `"AUTO"`.
6. Efectivo recibido y cambio no son el total.
7. Si no es comprobante o no se entiende → todo `"AUTO"` y `Conceptos` vacío.

**Fuera de este ajuste:** la conversación de Bisie' (datos faltantes, explicaciones, fuera de alcance). El dataset no la cubre; si el chat se integra, usa el modelo base con prompt y se declara así.

## 2. Modelo base
| Campo | Valor |
|---|---|
| Nombre | `Qwen/Qwen2.5-7B-Instruct` (Hugging Face) |
| Procedencia | Equipo Qwen, Alibaba Cloud |
| Licencia | Apache-2.0 |
| Parámetros | 7,655,986,688 (impreso por `train_qlora.py`) |
| Carga | 4 bits NF4 + doble cuantización, cómputo fp16 (bitsandbytes) |

## 3. Datos
- **100 % SINTÉTICOS**, generados por `generar_dataset_ocr.py` (semilla 2026, sha256 del generador en `dataset/resumen.json`). Negocios y personas ficticios; RFC aleatorios con forma válida (no se consultan al SAT); receptor genérico `XAXX010101000`.
- Formato JSONL de chat: `system` (reglas) · `user` (texto OCR) · `assistant` (JSON esperado), más `meta` (tipo, plantilla, giro, nivel de ruido).
- **División por plantilla y por grupo de nombres**, no por ejemplo (CLAUDE.md sec. 18). Sin textos idénticos ni casi iguales entre splits (`dataset/reporte_revision.json` → `fugas`: 0 y 0).

| Split | Total | ticket | cfdi | ilegible | no_comprobante | Plantillas |
|---|---|---|---|---|---|---|
| train | 1600 | 1162 | 303 | 61 | 74 | T1–T6, C1–C2, X1, N1–N3 |
| val | 200 | 146 | 44 | 5 | 5 | T7, C3, X1, N4 |
| test | 200 | 145 | 32 | 13 | 10 | T8, C4, X1, N5 |

Fuente: `dataset/resumen.json`. Ruido de OCR en 4 niveles (0.0, 0.1, 0.2, 0.35); 8 giros (abarrotes, farmacia, ferretería, gasolinera, mayoreo, papelería, restaurante, servicios).

Tokens (medido por `train_qlora.py` con el tokenizador de Qwen, corrida `epoca1`):

| Split | Ejemplos | Descartados por largo | Mediana | Máximo | Total |
|---|---|---|---|---|---|
| train | 1600 | 0 | 982 | 1699 | 1,624,561 |
| val | 200 | 0 | 967 | 1752 | 209,526 |

Limitaciones conocidas de los datos:
- Las tasas de IVA de los tickets sintéticos son siempre 16 %; no representan la tasa real de cada producto.
- Las claves de catálogo impresas en los CFDI sintéticos están **por verificar** contra el Anexo 20 vigente (CLAUDE.md sec. 21).
- La plantilla `X1` (ilegible) aparece en los tres splits.
- `dataset/revision_manual.csv` (muestra de 40 para revisión humana) está **PENDIENTE de llenar** por el equipo.

## 4. Configuración del entrenamiento (`train_qlora.py`)
| Parámetro | Valor |
|---|---|
| Método | QLoRA (NF4, doble cuantización), fp16 (la T4 no tiene bf16) |
| LoRA | r=16, alpha=32, dropout 0.05, sin bias |
| Módulos | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj |
| Parámetros entrenables | 40,370,176 (0.53 %) |
| Lote | 1 × acumulación 16 = 16 efectivo |
| LR | 2e-4, coseno, warmup 3 % |
| Optimizador | paged_adamw_8bit |
| Longitud máx. | 2048 tokens (ningún ejemplo se descartó) |
| Pérdida | solo sobre la respuesta del asistente (system y user enmascarados con -100) |
| Gradient checkpointing | sí (no reentrante) |
| Evaluación / guardado | cada 25 pasos con val; se conservan los 2 últimos checkpoints |
| Semilla | 2026 |

## 5. Entorno NVIDIA
- **Servidor:** entorno DLI de NVIDIA, Tesla T4 (15,360 MiB), driver 545, CUDA 12.3.
- **Contenedor NGC:** `nvcr.io/nvidia/pytorch:23.12-py3`, lanzado con `correr_en_servidor.sh` (`docker run --gpus all`). Función: entorno PyTorch + CUDA listo para la GPU del servidor, donde se ejecutó el ajuste.
- **Versiones pip:** transformers 4.46.3, peft 0.13.2, bitsandbytes 0.44.1, accelerate 1.1.1, datasets 3.1.0. Lista completa en `logs/entorno_pip.txt` y GPU en `logs/nvidia_smi.txt` (servidor).

## 6. Cómo reproducir
```bash
# En el servidor DLI, carpeta training/asistente (desde JupyterLab: /dli/task/asistente)
bash correr_en_servidor.sh                 # abre el contenedor NGC e instala dependencias

# Dentro del contenedor (/workspace/asistente)
python3 train_qlora.py --max-pasos 20 --nombre prueba            # prueba de velocidad
nohup python3 train_qlora.py --epocas 1 --nombre epoca1 > logs/epoca1.out 2>&1 &
tail -f logs/epoca1.out

# Prueba de humo (base vs. adaptador, mismos casos de test.jsonl)
python3 probar.py                          # modelo base
python3 probar.py adapters/epoca1 10       # base + adaptador, 10 casos
```
Para regenerar el dataset: `python3 generar_dataset_ocr.py` y `python3 revisar_dataset.py`.

## 7. Corridas
### `prueba` (20 pasos, solo para medir velocidad y probar la integración)
- 20 pasos de 100 de una época (`--max-pasos 20`, sin evaluación con val). **No es el modelo final.**
- Prueba de humo con `probar.py` en 3 casos de test (20-nov-2026, salida de terminal):

| Caso | Base | `prueba` |
|---|---|---|
| test-00000 (ticket) | ✗ — claves fuera del contrato (`ClaveUnica`, `Totales`) | ✓ igual al esperado |
| test-00001 (no comprobante / ilegible) | ✗ — inventa estructura de conceptos e impuestos | ✓ igual al esperado |
| test-00002 (ticket con conceptos) | ✗ — inventa claves SAT (`01010101`, `PP01`, `TipoDeComprobante "N"`) | ✗ — no idéntico (por revisar qué campo) |

Lectura honesta: con 3 casos solo se ve que el adaptador aprendió el formato; no sirve como métrica. Esta corrida se imprimió en terminal; las siguientes quedan en `logs/probar/*.jsonl`.

### `epoca1` (corrida final, 1 época)
| Campo | Valor |
|---|---|
| Inicio | 20-nov-2026 (hora exacta: **PENDIENTE**, `registro.json` → `inicio_utc`) |
| Pasos | 100 (1600 ejemplos / lote 16) |
| Velocidad | ~62 s/paso en el primer paso (`logs/epoca1.out`); promedio final **PENDIENTE** (`segundos_por_paso`) |
| Duración | **PENDIENTE** (`duracion_s`) |
| Memoria GPU máx. | **PENDIENTE** (`memoria_gpu_max_gb`) |
| Pérdida train final | **PENDIENTE** (`metricas_entrenamiento.train_loss`) |
| Pérdida val | **PENDIENTE** (`metricas_val.eval_loss`; también cada 25 pasos en `historial`) |
| Artefacto | `adapters/epoca1/` (`adapter_config.json`, `adapter_model.safetensors`, tokenizador) + modelo base de la sec. 2 |

Se eligió 1 época (no 2–3 como en el plan inicial) por el tiempo que quedaba en la competencia (~5 h 45 min al lanzarla).

## 8. Evaluación (PENDIENTE)
- **Extracción:** base vs. `epoca1` con los mismos casos de `test.jsonl` y la misma configuración de generación (greedy, `max_new_tokens=1200`). Métricas: JSON válido, igual al esperado y aciertos por campo (Total, Fecha, Emisor.Rfc, etc.).
- **10 casos reservados de la sec. 5** (habituales, información incompleta, fuera de alcance, pedir confirmación): **PENDIENTE**, en `test_10_casos.py`.
- Ejemplos de aciertos y errores: **PENDIENTE**.

## 9. Inferencia en la laptop del equipo (RTX 4050, 6 GB)
El **entrenamiento** se hace en el servidor DLI (sec. 5). La **inferencia** (servir el modelo a la app) se va a correr en la laptop de un integrante para no competir con la GPU del servidor y trabajar en red local.

| Campo | Valor |
|---|---|
| GPU | NVIDIA GeForce RTX 4050 Laptop, 6 GB VRAM (CUDA) |
| RAM | 16 GB |
| Sistema | **PENDIENTE** (Windows / Linux) |
| Estado | **PENDIENTE**: probar si cabe |

**Ojo con la memoria:** el 7B en NF4 ocupa ~5.5 GB (las capas cuantizadas más `embed_tokens` y `lm_head` en fp16) más ~0.5 GB de contexto CUDA. En 6 GB va muy justo. Es una estimación, no una medición: la cifra real la imprime `probar.py`.

### Pasos
1. **Código:** `git pull` (trae `probar.py`, este README y el dataset de test).
2. **Adaptador:** descargar `prueba_adaptador.tgz` del servidor (JupyterLab → `/dli/task/asistente` → clic derecho → Download), pasarlo por USB o Drive y descomprimirlo dentro de `training/asistente/` con `tar xzf prueba_adaptador.tgz`. Queda en `adapters/prueba/`. Al terminar la época, hacer lo mismo con `adapters/epoca1` (`tar czf epoca1_adaptador.tgz adapters/epoca1`).
3. **Dependencias:** las mismas versiones que en el servidor, para que el resultado sea comparable:
   ```bash
   pip install torch transformers==4.46.3 peft==0.13.2 bitsandbytes accelerate
   ```
   La primera corrida descarga el modelo base de Hugging Face (~15 GB).
4. **Prueba:**
   ```bash
   cd training/asistente
   python probar.py adapters/prueba        # 3 casos
   ```
5. **Qué anotar aquí** (de la salida real de `probar.py` y de `logs/probar/*.jsonl`): memoria máx. usada, segundos por caso y si da el **mismo resultado que en el servidor** en los mismos 3 casos.

### Si no cabe (`CUDA out of memory`)
- No mandar capas a la CPU con transformers: de minutos por ticket.
- **Plan B:** llama.cpp. Base `Qwen/Qwen2.5-7B-Instruct-GGUF` (Q4_K_M, ~4.7 GB) más el adaptador convertido con `convert_lora_to_gguf.py`, servido con `llama-server -m base.gguf --lora prueba.gguf -ngl 99`.
- **Hay que declararlo:** el adaptador se entrenó sobre NF4 y se aplica sobre Q4_K_M. Verificar con los mismos casos que el resultado coincide con el del servidor y anotar cualquier diferencia.

### Conexión con la app
FastAPI (`backend-ia/`) corre en esta laptop con `ADAPTADOR=adapters/<corrida>`. La PWA apunta a ella con `BACKEND_URL` en `frontend-pwa/.env.local`:
- `http://localhost:8000` si Next.js corre en la misma laptop;
- `http://<IP-de-la-laptop>:8000` si corre en otra.

La red UsaLab aísla los equipos (CLAUDE.md sec. 16): usar un hotspot con las laptops y el teléfono conectados.

## 10. Integración con la app
`foto → frontend-pwa (lib/analisis.ts) → FastAPI /vision/analizar → YOLO + OCR → Qwen + adaptador → JSON CFDI → validación en código → pantalla de revisión`.
Corre en la laptop con la RTX 4050 (sec. 9). El adaptador se elige con la variable `ADAPTADOR` (p. ej. `adapters/epoca1`): así el modelo en uso se puede rastrear hasta esta corrida. Detalle en `backend-ia/` (**PENDIENTE**).

## 11. Uso de IA en esta carpeta
Ver `docs/declaracion_ia.md`: generador del dataset, script de revisión, `train_qlora.py`, `probar.py` y este README se escribieron con apoyo de Claude Code (Anthropic) y los revisa el equipo.

# Specs de TAO 5.5.0

| Archivo | Acciones de TAO |
|---|---|
| `ocdnet.yaml` | `train`, `evaluate`, `inference`, `export` |
| `ocrnet.yaml` | `dataset_convert`, `train`, `evaluate`, `inference`, `export`, `gen_trt_engine` |

Las rutas son las de **dentro del contenedor**: `/data` (datos), `/models` (preentrenados de NGC), `/results` (salidas).
`run_lab.sh` (Etapa 5) las monta con `~/.tao_mounts.json` y sobrescribe por línea de comandos lo que cambia por corrida
(por ejemplo `train.num_epochs=2` en la corrida corta o el split de `dataset_convert`).

## Cómo se verificaron

`docs.nvidia.com` no respondió desde la máquina local, así que todo se verificó contra el código fuente oficial,
rama `tao_5.5_release` de `NVIDIA/tao_pytorch_backend`:

```bash
cd training && .venv/bin/python scripts/verificar_specs.py   # cada clave existe en el esquema de TAO 5.5
```

El verificador lee las dataclasses de `default_config.py` y `core/common_config.py` y falla si una clave no existe
(probado con una clave inventada). No valida los valores ni el contenido libre de `pre_processes`; ese se tomó del spec de ejemplo de TAO.

## Decisiones

| Clave | Valor | Por qué | Verificado |
|---|---|---|---|
| `ocdnet train.precision` | `fp16` | La T4 no soporta bf16. `scripts/train.py` lo traduce a `16-mixed` | Código |
| OCRNet precisión | fp32 | OCRNet de TAO 5.5 **no tiene** clave de precisión ni la pasa al `Trainer`. El fp16 se usa en el motor TensorRT (`gen_trt_engine.tensorrt.data_type: fp16`) | Código |
| `ocdnet train_dataset` aumentos | sin `Fliplr` | El texto en espejo no ocurre en tickets; el resto es el ejemplo de TAO | Ejemplo TAO |
| `ocdnet Resize2D.short_size` | `[1152, 1536]` | Es `[ancho, alto]`. El ejemplo `[1280, 736]` es horizontal y aplastaría fotos verticales 3:4. A 1152 de ancho solo ~1 % de palabras queda bajo los 8 px de `min_text_size` | Código + medición |
| `ocdnet warmup_epoch` | 3 | `train.py` exige `num_epochs != warmup_epoch` | Código |
| Checkpoints | OCDNet `train/model_best.pth`, OCRNet `train/best_accuracy.pth` | Nombres que escribe el código al validar | Código |
| `ocrnet character_list_file` | 50 caracteres en minúsculas, sin espacio, `-` al final | `strip()` borra el espacio; el filtro usa `label.lower()`; la lista arma una regex | Código |
| `ocrnet max_label_length` | 25 | Valor por defecto; nuestra palabra más larga tiene 16 | Código + datos |
| `ocrnet` datos | LMDB vía `dataset_convert` | La ruta sin LMDB parte con `split()` y no aplica los filtros | Código |
| `encryption_key` | `nvidia_tao` | Clave pública del spec de ejemplo para leer los `.pth` de TAO; no es una credencial | Ejemplo TAO |

## Pendiente de validar en el lab

- **Arquitectura de OCRNet** (`TPS`, `backbone`, `input_width/height`): debe coincidir con el preentrenado de NGC para que cargue
  el backbone. Se usó la del spec de ejemplo (ResNet, BiLSTM, CTC, 100×32, gris). Revisar la ficha del modelo al descargarlo.
- **Nombres de archivo** de los preentrenados (`pretrained_model_path`): `run_lab.sh` los sobrescribe con el archivo real.
- **Épocas, batch y lr**: valores de partida. La corrida corta mide memoria y tiempo por época en la T4 para ajustarlos al presupuesto.
- **Línea base de OCRNet**: el preentrenado usa su propia lista de caracteres; para evaluarlo sin ajustar hay que usar esa lista, no la nuestra.

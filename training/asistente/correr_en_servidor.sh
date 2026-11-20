#!/usr/bin/env bash
# Abre el contenedor NGC de PyTorch con la GPU y la carpeta del asistente montada.
# Correr en el servidor DLI, desde la carpeta training/asistente:
#     bash correr_en_servidor.sh
#
# Herramienta NVIDIA usada: contenedor NGC nvcr.io/nvidia/pytorch (CUDA 12.3,
# igual que el driver 545 del servidor). La caché de Hugging Face queda en ./cache
# para no volver a bajar el modelo si se reinicia el contenedor.
# --dns 8.8.8.8: el DNS del laboratorio DLI no responde dentro del contenedor (probado 20-nov-2026).
# PIP_CONFIG_FILE=/dev/null: ignora el espejo pypi.ngc.nvidia.com de la imagen (no resuelve) y usa pypi.org.
set -euo pipefail

IMAGEN="nvcr.io/nvidia/pytorch:23.12-py3"
AQUI="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$AQUI/cache" "$AQUI/logs" "$AQUI/adapters"

docker run --rm -it --gpus all --dns 8.8.8.8 \
  --shm-size=8g --ulimit memlock=-1 \
  -v "$AQUI":/workspace/asistente \
  -e HF_HOME=/workspace/asistente/cache \
  -e PIP_CONFIG_FILE=/dev/null \
  -w /workspace/asistente \
  "$IMAGEN" \
  bash -c '
    pip install -q "transformers==4.46.3" "peft==0.13.2" "bitsandbytes==0.44.1" \
                   "accelerate==1.1.1" "datasets==3.1.0" &&
    pip freeze > logs/entorno_pip.txt &&
    nvidia-smi > logs/nvidia_smi.txt &&
    echo "Entorno listo. Ahora corre: python3 train_qlora.py --max-pasos 20 --nombre prueba" &&
    exec bash'

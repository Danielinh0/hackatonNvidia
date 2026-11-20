#!/usr/bin/env bash
# Entrenamiento de visión (OCDNet + OCRNet) en el lab NVIDIA DLI con TAO 5.5.
# Uso: bash scripts/run_lab.sh <paso>   (sin paso: muestra la ayuda)
# La NGC API key NUNCA va en este archivo: se configura antes con `ngc config set` y `docker login nvcr.io`.

set -euo pipefail

TRAINING="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB="${LAB:-$TRAINING/lab}"
MODELOS="$LAB/models"
RESULTADOS="$LAB/results"
LOGS="$RESULTADOS/logs"
REGISTRO="$RESULTADOS/registro_entrenamiento.md"
NGC="${NGC:-/dli/task/ngc_assets/ngc-cli/ngc}"
PY="${PY:-python3}"
# El lab corre dentro de un contenedor y Docker es el del host: si las rutas del host son otras, ponlas aquí.
HOST_TRAINING="${HOST_TRAINING:-$TRAINING}"
HOST_LAB="${HOST_LAB:-$LAB}"

EPOCAS_PRUEBA_OCD=2
EPOCAS_PRUEBA_OCR=1

rojo() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
paso() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
falla() { rojo "ERROR: $*"; exit 1; }

ayuda() {
  cat <<'EOF'
Pasos, en orden:
  verificar   GPU, Docker, TAO, credenciales de NGC y espacio en disco
  datos       genera los datos sintéticos aquí mismo (misma semilla que en local) y compara huellas
  montajes    escribe ~/.tao_mounts.json
  modelos     descarga los preentrenados de NGC (requiere OCDNET_VERSION y OCRNET_VERSION)
  convertir   OCRNet: train/val/test a LMDB (también prueba que los montajes funcionan)
  prueba      corrida corta (OCDNet 2 épocas, OCRNet 1) para validar specs, memoria y tiempo
  entrenar    entrenamiento completo: `entrenar ocdnet`, `entrenar ocrnet` o `entrenar` (ambos)
  evaluar     evalúa en test: ajustado y, para OCDNet, el preentrenado sin ajustar (línea base)
  exportar    ONNX de ambos; `exportar --trt` además genera el motor TensorRT fp16 de OCRNet
  empaquetar  junta pesos, logs, specs, huellas y registro en un .tar.gz para descargar
  todo        verificar + datos + montajes + modelos + convertir + prueba (se detiene antes del entrenamiento largo)

Variables: OCDNET_VERSION, OCRNET_VERSION (versiones de NGC), LAB, NGC, HOST_TRAINING, HOST_LAB.
EOF
}

registrar() {
  mkdir -p "$RESULTADOS"
  [ -f "$REGISTRO" ] || printf '# Registro de entrenamiento (generado por run_lab.sh)\n\n' > "$REGISTRO"
  printf -- '- %s · %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$*" >> "$REGISTRO"
}

tao_cmd() {
  # `tao info --verbose` en el lab (TAO 5.5.0): entrenar/evaluar/exportar están en el grupo `model`
  # (imagen 5.5.0-pyt) y gen_trt_engine de ocdnet/ocrnet en `deploy` (imagen 5.5.0-deploy).
  echo "tao ${GRUPO:-model}"
}

monitor_gpu() {
  nvidia-smi --query-gpu=timestamp,name,memory.used,memory.total,utilization.gpu --format=csv -l 15 > "$1" 2>/dev/null &
  echo $!
}

correr() {
  # correr <nombre_log> <tarea> <acción> [overrides...]: corre TAO con log, monitor de GPU y registro de duración.
  local nombre="$1" tarea="$2" accion="$3"; shift 3
  # El launcher de TAO lanza Docker con TTY ("Printing tty value True"): sin terminal, Docker responde
  # "the input device is not a TTY" y no corre nada. Pasa con nohup o con '&'. Visto en el lab (20-nov-2026).
  [ -t 0 ] || falla "TAO necesita una terminal interactiva. Corre este paso en primer plano en una terminal de JupyterLab, sin nohup ni '&' (la terminal sigue viva aunque cierres la pestaña)."
  mkdir -p "$LOGS"
  local log="$LOGS/${nombre}_$(date +%Y%m%d_%H%M%S).log"
  local gpu_log="${log%.log}_gpu.csv"
  local pid inicio fin estado
  pid=$(monitor_gpu "$gpu_log")
  inicio=$(date +%s)
  echo "Log: $log"
  set +e
  $(tao_cmd) "$tarea" "$accion" -e "/specs/$tarea.yaml" "$@" 2>&1 | tee "$log"
  estado=${PIPESTATUS[0]}
  set -e
  kill "$pid" 2>/dev/null || true
  fin=$(date +%s)
  registrar "$tarea $accion ($nombre): estado $estado, $(( (fin - inicio) / 60 )) min $(( (fin - inicio) % 60 )) s, log $(basename "$log"), args: $*"
  if [ "$estado" -ne 0 ]; then
    if [ "${TOLERAR:-0}" = 1 ]; then rojo "Aviso: $tarea $accion falló (código $estado); se continúa. Revisa $log"; return 0; fi
    falla "$tarea $accion terminó con código $estado. Revisa $log"
  fi
  echo "$(( fin - inicio ))" > "${log%.log}.segundos"
}

preentrenado() {
  local archivo
  archivo=$(find "$MODELOS/$1" -name '*.pth' 2>/dev/null | head -n 1)
  [ -n "$archivo" ] || falla "No hay .pth en $MODELOS/$1. Corre primero: bash scripts/run_lab.sh modelos"
  echo "/models/${archivo#"$MODELOS/"}"
}

verificar() {
  paso "Verificar entorno"
  command -v nvidia-smi >/dev/null || falla "No existe nvidia-smi: este entorno no ve la GPU."
  nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader || falla "nvidia-smi no responde."
  command -v docker >/dev/null || falla "No existe docker."
  docker info >/dev/null 2>&1 || falla "Docker no responde (¿está montado /var/run/docker.sock?)."
  command -v tao >/dev/null || falla "No existe el comando tao (pip install nvidia-tao)."
  echo "TAO: $(tao_cmd)"; tao info --verbose 2>/dev/null | sed -n '1,20p' || rojo "Aviso: 'tao info --verbose' falló."
  [ -x "$NGC" ] || falla "No encuentro la NGC CLI en $NGC (ajusta la variable NGC)."
  # El formato de `ngc config current` no está verificado: solo avisa. Si falta la key, `modelos` falla.
  if ! "$NGC" config current 2>/dev/null | grep -qi 'key'; then
    rojo "Aviso: no veo API key en 'ngc config current'. Si no la has puesto: $NGC config set"
  fi
  if ! grep -q 'nvcr.io' "$HOME/.docker/config.json" 2>/dev/null; then
    falla "Docker no tiene sesión en nvcr.io. Corre: docker login nvcr.io -u '\$oauthtoken' --password-stdin"
  fi
  local libre
  libre=$(df -BG --output=avail "$TRAINING" | tail -n 1 | tr -dc '0-9')
  [ "$libre" -ge 20 ] || falla "Solo hay ${libre} GB libres; se necesitan al menos 20."
  verde "Entorno OK (${libre} GB libres)."
  registrar "verificar: $(nvidia-smi --query-gpu=name,driver_version --format=csv,noheader), $(tao_cmd)"
}

datos() {
  paso "Generar datos sintéticos"
  cd "$TRAINING"
  local py
  if [ -x .venv/bin/pip ] || { "$PY" -m venv .venv >/dev/null 2>&1 && [ -x .venv/bin/pip ]; }; then
    py=.venv/bin/python
    .venv/bin/pip install -q -r requirements.txt
  else
    # El contenedor del lab no trae python3-venv: las dependencias van a una carpeta propia, sin tocar el sistema.
    rm -rf "$TRAINING/.venv"
    "$PY" -m pip install -q --target "$TRAINING/.pydeps" -r requirements.txt || falla "pip no pudo instalar requirements.txt"
    export PYTHONPATH="$TRAINING/.pydeps"
    py="$PY"
  fi
  "$py" scripts/main.py --cantidad 500 --semilla 42
  "$py" scripts/aumentar.py
  "$py" scripts/prep_mod.py --origen data/augmented
  "$py" scripts/prep_ocrnet.py
  if (cd data && sha256sum -c --quiet ../huella_datos.sha256); then
    verde "Los datos son idénticos byte a byte a los generados en local."
    registrar "datos: regenerados, huellas idénticas a huella_datos.sha256"
  else
    rojo "Aviso: las huellas no coinciden con las de local (otra versión de fuentes o librerías). Los datos son válidos pero no idénticos; se registra."
    registrar "datos: regenerados, huellas DISTINTAS a las de local"
  fi
}

montajes() {
  paso "Escribir ~/.tao_mounts.json"
  mkdir -p "$MODELOS" "$RESULTADOS"
  [ -f "$HOME/.tao_mounts.json" ] && cp "$HOME/.tao_mounts.json" "$HOME/.tao_mounts.json.bak"
  # Formato del launcher de TAO (Mounts + DockerOptions). PENDIENTE de confirmar contra la doc de TAO 5.5;
  # el paso `convertir` lo comprueba en la práctica.
  cat > "$HOME/.tao_mounts.json" <<EOF
{
  "Mounts": [
    {"source": "$HOST_TRAINING/data", "destination": "/data"},
    {"source": "$HOST_TRAINING/specs", "destination": "/specs"},
    {"source": "$HOST_LAB/models", "destination": "/models"},
    {"source": "$HOST_LAB/results", "destination": "/results"}
  ],
  "DockerOptions": {
    "shm_size": "16G",
    "ulimits": {"memlock": -1, "stack": 67108864}
  }
}
EOF
  cat "$HOME/.tao_mounts.json"
  verde "Montajes escritos (respaldo del anterior en ~/.tao_mounts.json.bak si existía)."
}

modelos() {
  paso "Descargar preentrenados de NGC"
  local faltan=0
  for m in ocdnet ocrnet; do
    local var; var="$(echo "$m" | tr a-z A-Z)_VERSION"
    if [ -z "${!var:-}" ]; then
      rojo "Falta $var. Versiones disponibles de nvidia/tao/$m:"
      "$NGC" registry model list "nvidia/tao/$m:*" || rojo "No se pudo listar nvidia/tao/$m."
      faltan=1
    fi
  done
  [ "$faltan" -eq 0 ] || falla "Elige las versiones (las 'trainable' en .pth) y vuelve a correr, p. ej.: OCDNET_VERSION=<v> OCRNET_VERSION=<v> bash scripts/run_lab.sh modelos"
  for m in ocdnet ocrnet; do
    local var; var="$(echo "$m" | tr a-z A-Z)_VERSION"
    mkdir -p "$MODELOS/$m"
    "$NGC" registry model download-version "nvidia/tao/$m:${!var}" --dest "$MODELOS/$m"
    echo "$m: $(preentrenado "$m")"
    registrar "modelos: nvidia/tao/$m:${!var} -> $(preentrenado "$m")"
  done
  (cd "$MODELOS" && find . -name '*.pth' -exec sha256sum {} +) | tee "$RESULTADOS/preentrenados.sha256"
}

convertir() {
  paso "OCRNet: convertir a LMDB"
  for s in val train test; do
    correr "ocrnet_convert_$s" ocrnet dataset_convert \
      "dataset_convert.input_img_dir=/data/ocrnet/$s/images" \
      "dataset_convert.gt_file=/data/ocrnet/$s/gt_list.txt" \
      "dataset_convert.results_dir=/results/ocrnet/lmdb/$s"
    if [ ! -f "$LAB/results/ocrnet/lmdb/$s/data.mdb" ]; then
      falla "TAO terminó pero no apareció $LAB/results/ocrnet/lmdb/$s/data.mdb. Revisa el log: si dice 'the input device is not a TTY', corre en primer plano; si TAO sí convirtió sin errores, los montajes apuntan a rutas que el Docker del host no ve (ajusta HOST_TRAINING y HOST_LAB y repite 'montajes')."
    fi
    verde "LMDB $s listo."
  done
}

estimar() {
  local seg epocas total
  seg=$(cat "$(ls -t "$LOGS"/"$1"_*.segundos | head -n 1)")
  epocas="$2"; total="$3"
  echo "$1: ${seg}s para $epocas época(s) => ~$(( seg / epocas / 60 )) min por época => ~$(( seg * total / epocas / 60 )) min para $total épocas (cota alta: incluye arranque y validación)."
}

prueba() {
  paso "Corrida corta"
  correr prueba_ocdnet ocdnet train \
    "model.pretrained_model_path=$(preentrenado ocdnet)" \
    "train.num_epochs=$EPOCAS_PRUEBA_OCD" train.lr_scheduler.args.warmup_epoch=1 \
    train.checkpoint_interval=1 train.validation_interval=1 \
    train.results_dir=/results/prueba/ocdnet
  correr prueba_ocrnet ocrnet train \
    "train.pretrained_model_path=$(preentrenado ocrnet)" \
    "train.num_epochs=$EPOCAS_PRUEBA_OCR" train.results_dir=/results/prueba/ocrnet
  paso "Estimación para el entrenamiento completo"
  estimar prueba_ocdnet "$EPOCAS_PRUEBA_OCD" "$(grep -m1 'num_epochs' "$TRAINING/specs/ocdnet.yaml" | tr -dc '0-9')" | tee -a "$REGISTRO"
  estimar prueba_ocrnet "$EPOCAS_PRUEBA_OCR" "$(grep -m1 'num_epochs' "$TRAINING/specs/ocrnet.yaml" | tr -dc '0-9')" | tee -a "$REGISTRO"
  echo "Memoria máxima de GPU (MiB):"
  for f in "$LOGS"/prueba_*_gpu.csv; do
    printf '  %s: ' "$(basename "$f")"; tail -n +2 "$f" | awk -F', ' '{gsub(/ MiB/,"",$3); if ($3>m) m=$3} END {print m}'
  done
  verde "Corrida corta OK. Si el tiempo cabe en el presupuesto: bash scripts/run_lab.sh entrenar"
}

entrenar() {
  local cual="${1:-ambos}"
  if [ "$cual" = ocdnet ] || [ "$cual" = ambos ]; then
    paso "Entrenar OCDNet"
    correr train_ocdnet ocdnet train "model.pretrained_model_path=$(preentrenado ocdnet)"
  fi
  if [ "$cual" = ocrnet ] || [ "$cual" = ambos ]; then
    paso "Entrenar OCRNet"
    correr train_ocrnet ocrnet train "train.pretrained_model_path=$(preentrenado ocrnet)"
  fi
}

evaluar() {
  paso "Evaluar en test"
  [ -f "$RESULTADOS/ocdnet/train/model_best.pth" ] || falla "No existe el OCDNet ajustado (results/ocdnet/train/model_best.pth)."
  correr eval_ocdnet_ajustado ocdnet evaluate \
    "dataset.validate_dataset.data_path=[/data/ocdnet/test]" evaluate.results_dir=/results/ocdnet/evaluate_ajustado
  # Línea base: el mismo test con el preentrenado sin ajustar. Si el formato del .pth de NGC no lo admite, queda en el log.
  TOLERAR=1 correr eval_ocdnet_base ocdnet evaluate \
    "dataset.validate_dataset.data_path=[/data/ocdnet/test]" "evaluate.checkpoint=$(preentrenado ocdnet)" \
    evaluate.results_dir=/results/ocdnet/evaluate_base
  [ -f "$RESULTADOS/ocrnet/train/best_accuracy.pth" ] || falla "No existe el OCRNet ajustado (results/ocrnet/train/best_accuracy.pth)."
  correr eval_ocrnet_ajustado ocrnet evaluate evaluate.results_dir=/results/ocrnet/evaluate_ajustado
  rojo "Nota: la línea base de OCRNet requiere la lista de caracteres original del preentrenado; se hace en la Etapa 7."
}

exportar() {
  paso "Exportar"
  correr export_ocdnet ocdnet export
  correr export_ocrnet ocrnet export
  if [ "${1:-}" = "--trt" ]; then
    # Las claves de gen_trt_engine vienen del esquema de tao_pytorch_backend; el contenedor deploy podría
    # pedir otras. Si falla, no afecta a los pesos ya exportados.
    GRUPO=deploy TOLERAR=1 correr trt_ocrnet ocrnet gen_trt_engine
  fi
}

empaquetar() {
  paso "Empaquetar resultados"
  local fecha destino
  fecha=$(date +%Y%m%d_%H%M)
  destino="$LAB/entrega_vision_$fecha.tar.gz"
  (cd "$RESULTADOS" && find . \( -name '*.pth' -o -name '*.onnx' -o -name '*.engine' \) -not -path './prueba/*' -exec sha256sum {} + > pesos.sha256)
  cp "$TRAINING/huella_datos.sha256" "$RESULTADOS/" 2>/dev/null || true
  [ -f "$TRAINING/data/synthetic/manifiesto.json" ] && cp "$TRAINING/data/synthetic/manifiesto.json" "$RESULTADOS/"
  tar czf "$destino" -C "$TRAINING" specs -C "$LAB" --exclude='results/ocrnet/lmdb' --exclude='results/prueba' results
  registrar "empaquetar: $(basename "$destino") ($(du -h "$destino" | cut -f1))"
  verde "Listo: $destino"
  echo "Descárgalo desde el explorador de JupyterLab (clic derecho > Download) ANTES de que cierre la sesión."
}

case "${1:-}" in
  verificar) verificar ;;
  datos) datos ;;
  montajes) montajes ;;
  modelos) modelos ;;
  convertir) convertir ;;
  prueba) prueba ;;
  entrenar) entrenar "${2:-ambos}" ;;
  evaluar) evaluar ;;
  exportar) exportar "${2:-}" ;;
  empaquetar) empaquetar ;;
  todo) verificar; datos; montajes; modelos; convertir; prueba ;;
  *) ayuda ;;
esac

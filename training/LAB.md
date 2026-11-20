# Entrenar visión en el lab (paso a paso)

Todo se corre en una **terminal** de JupyterLab (File → New → Terminal), no en celdas del notebook.
Nunca pegues la NGC API key en archivos, notebooks ni chats.

## 0. Llevar el código al lab (sin los datos: se regeneran allá)

**Opción A, con git** (si la rama `vision-tao` ya está en GitHub):
```bash
cd /dli/task && git clone -b vision-tao https://github.com/Danielinh0/hackatonNvidia.git dzuun && cd dzuun/training
```
**Opción B, subiendo un archivo**: en tu máquina, `git archive --format=tar.gz -o dzuun_training.tar.gz HEAD training`;
súbelo con el botón de subir de JupyterLab a `/dli/task` y en la terminal:
```bash
cd /dli/task && mkdir -p dzuun && tar xzf dzuun_training.tar.gz -C dzuun && cd dzuun/training
```

## 1. Credenciales (una vez por sesión)
```bash
/dli/task/ngc_assets/ngc-cli/ngc config set          # pega la API key; formato ascii; elige tu org
read -s NGC_KEY && echo "$NGC_KEY" | docker login nvcr.io -u '$oauthtoken' --password-stdin && unset NGC_KEY
```

## 2. Preparar y corrida corta
```bash
bash scripts/run_lab.sh verificar     # GPU, Docker, TAO, sesión en nvcr.io, disco
bash scripts/run_lab.sh datos         # ~15-30 min; compara huellas con las de local
bash scripts/run_lab.sh montajes
bash scripts/run_lab.sh modelos       # sin versiones, lista las disponibles y se detiene
OCDNET_VERSION=<versión> OCRNET_VERSION=<versión> bash scripts/run_lab.sh modelos
bash scripts/run_lab.sh convertir     # si falla diciendo que no aparece data.mdb, ver "Rutas del host"
bash scripts/run_lab.sh prueba        # imprime minutos por época y memoria de GPU
```
**Pégale a Claude** la salida de `tao info --verbose`, la lista de versiones de `modelos` y el final de `prueba`
para ajustar épocas al presupuesto antes del entrenamiento largo.

## 3. Entrenamiento completo, evaluación y entrega
```bash
bash scripts/run_lab.sh entrenar      # o: entrenar ocdnet / entrenar ocrnet
bash scripts/run_lab.sh evaluar
bash scripts/run_lab.sh exportar --trt
bash scripts/run_lab.sh empaquetar    # descarga lab/entrega_vision_*.tar.gz ANTES de que cierre la sesión
```
Para no perder el entrenamiento si se cierra la pestaña: `nohup bash scripts/run_lab.sh entrenar > entrenar.out 2>&1 &`
y revisar con `tail -f entrenar.out`.

## Rutas del host
El lab corre dentro de un contenedor y TAO lanza otros contenedores con el Docker del host. Si el host ve
`/dli/task` en otra ruta, los montajes apuntan a carpetas vacías y `convertir` lo detecta. Solución:
`HOST_TRAINING=<ruta en el host>/training HOST_LAB=<ruta en el host>/training/lab bash scripts/run_lab.sh montajes`
(la ruta del host se puede ver con `docker inspect $(hostname) | grep -A3 Mounts`).

## Qué queda guardado (`lab/results/`)
- `registro_entrenamiento.md`: fecha, duración, estado y argumentos de cada paso (evidencia de entrenamiento en la competencia).
- `logs/*.log` y `logs/*_gpu.csv` (uso de memoria y GPU cada 15 s).
- Pesos: `ocdnet/train/model_best.pth`, `ocrnet/train/best_accuracy.pth`, ONNX y motor TensorRT; `pesos.sha256` y `preentrenados.sha256`.
- `huella_datos.sha256` y `manifiesto.json`: qué datos y qué split se usaron.

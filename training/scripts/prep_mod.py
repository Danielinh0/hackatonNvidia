import argparse
import json
import shutil
from collections import Counter
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[1]
SPLITS = ("train", "val", "test")
ETIQUETA_IGNORAR = "###"


def texto_para_icdar(texto):
    # El lector ICDAR separa por comas y toma las 8 primeras como coordenadas; OCDNet solo usa la
    # transcripción para saber si la región se ignora. Quitar las comas evita cualquier ambigüedad.
    # Pendiente de validar en el lab contra el cargador de OCDNet de TAO 5.5.0.
    if texto == ETIQUETA_IGNORAR:
        return texto
    limpio = " ".join(texto.replace(",", " ").split())
    return limpio or ETIQUETA_IGNORAR


def poligono_a_icdar(poligono):
    return ",".join(str(int(round(v))) for punto in poligono for v in punto)


def exportar_para_ocdnet(origen, destino):
    ruta_json = origen / "anotaciones.json"
    if not ruta_json.exists():
        raise FileNotFoundError(f"No se encontró {ruta_json}. Ejecuta primero main.py.")

    with open(ruta_json, encoding="utf-8") as f:
        registros = json.load(f)

    faltan = [r["archivo"] for r in registros if not (origen / "images" / r["archivo"]).exists()]
    if faltan:
        raise FileNotFoundError(f"Faltan {len(faltan)} imágenes en {origen / 'images'}, p. ej. {faltan[:3]}")

    conteo = Counter()
    for split in SPLITS:
        # Se borra la salida previa del split para que no se mezclen tickets de una generación anterior.
        dir_split = destino / split
        if dir_split.exists():
            shutil.rmtree(dir_split)
        (dir_split / "img").mkdir(parents=True)
        (dir_split / "gt").mkdir(parents=True)

    for reg in registros:
        split = reg["split"]
        nombre_base = Path(reg["archivo"]).stem
        with Image.open(origen / "images" / reg["archivo"]) as im:
            # Calidad 95 para no degradar los bordes del texto.
            im.convert("RGB").save(destino / split / "img" / f"{nombre_base}.jpg", "JPEG", quality=95)

        lineas_gt = [
            f"{poligono_a_icdar(seg['poligono'])},{texto_para_icdar(seg['texto'])}" for seg in reg["segmentos"]
        ]
        (destino / split / "gt" / f"gt_{nombre_base}.txt").write_text("\n".join(lineas_gt) + "\n", encoding="utf-8")
        conteo[split] += 1

    for split in SPLITS:
        print(f"Split '{split}': {conteo[split]} imágenes en '{destino / split}'")


def leer_args():
    p = argparse.ArgumentParser(description="Convierte los tickets sintéticos al formato ICDAR que usa OCDNet.")
    p.add_argument("--origen", type=Path, default=RAIZ / "data" / "synthetic")
    p.add_argument("--destino", type=Path, default=RAIZ / "data" / "ocdnet")
    return p.parse_args()


if __name__ == "__main__":
    args = leer_args()
    exportar_para_ocdnet(args.origen, args.destino)

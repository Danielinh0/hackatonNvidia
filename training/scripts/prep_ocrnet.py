import argparse
import json
import random
import shutil
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

from aumentar import homografia

RAIZ = Path(__file__).resolve().parents[1]
SPLITS = ("train", "val", "test")
# El "-" va al final: TAO arma la expresión regular [^<caracteres>] con esta lista y en medio formaría un rango.
CARACTERES = "0123456789abcdefghijklmnopqrstuvwxyz$.,:/#%*()&+'-"
# Valor por defecto de dataset.max_label_length en TAO 5.5; las etiquetas más largas se descartan al entrenar.
MAX_LARGO = 25
MIN_ALTO_PX = 6


def rectificar(img, poligono, margen_rel):
    p = np.asarray(poligono, np.float64)
    ancho = (np.linalg.norm(p[1] - p[0]) + np.linalg.norm(p[2] - p[3])) / 2
    alto = (np.linalg.norm(p[3] - p[0]) + np.linalg.norm(p[2] - p[1])) / 2
    if alto < MIN_ALTO_PX or ancho < 2:
        return None
    # Margen alrededor de la palabra: el detector en inferencia devuelve cajas algo más holgadas (unclip_ratio).
    u = (p[1] - p[0]) / max(np.linalg.norm(p[1] - p[0]), 1e-6)
    v = (p[3] - p[0]) / max(np.linalg.norm(p[3] - p[0]), 1e-6)
    m = alto * margen_rel
    ampliado = np.array([p[0] - u * m - v * m, p[1] + u * m - v * m, p[2] + u * m + v * m, p[3] - u * m + v * m])
    w_out, h_out = int(round(ancho + 2 * m)), int(round(alto + 2 * m))
    destino = [[0, 0], [w_out, 0], [w_out, h_out], [0, h_out]]
    inversa = homografia(destino, ampliado)
    return img.transform((w_out, h_out), Image.PERSPECTIVE, tuple(inversa.flatten()[:8]), resample=Image.BICUBIC)


def exportar(origen, destino, semilla):
    rng = random.Random(semilla)
    registros = json.loads((origen / "anotaciones.json").read_text(encoding="utf-8"))
    permitidos = set(CARACTERES)

    for split in SPLITS:
        if (destino / split).exists():
            shutil.rmtree(destino / split)
        (destino / split / "images").mkdir(parents=True)

    lineas = {s: [] for s in SPLITS}
    descartes = Counter()
    fuera_de_lista = Counter()
    largos = Counter()

    for reg in registros:
        split = reg["split"]
        with Image.open(origen / "images" / reg["archivo"]) as im:
            img = im.convert("RGB")
        for seg in reg["segmentos"]:
            for k, pal in enumerate(seg["palabras"]):
                etiqueta = pal["texto"].lower()
                raros = set(etiqueta) - permitidos
                if raros:
                    fuera_de_lista.update(raros)
                    descartes["caracter_fuera_de_lista"] += 1
                    continue
                if len(etiqueta) > MAX_LARGO:
                    descartes["mas_de_25_caracteres"] += 1
                    continue
                recorte = rectificar(img, pal["poligono"], rng.uniform(0.08, 0.3))
                if recorte is None:
                    descartes["demasiado_chica"] += 1
                    continue
                nombre = f"{Path(reg['archivo']).stem}_l{seg['linea']:02d}_{len(lineas[split]):06d}_{k}.png"
                recorte.save(destino / split / "images" / nombre)
                lineas[split].append(f"{nombre}\t{etiqueta}")
                largos[len(etiqueta)] += 1

    for split in SPLITS:
        (destino / split / "gt_list.txt").write_text("\n".join(lineas[split]) + "\n", encoding="utf-8")
    (destino / "character_list").write_text("\n".join(CARACTERES) + "\n", encoding="utf-8")

    for split in SPLITS:
        print(f"Split '{split}': {len(lineas[split])} recortes en '{destino / split}'")
    print(f"Lista de caracteres: {len(CARACTERES)} en '{destino / 'character_list'}'")
    print(f"Descartados: {dict(descartes) or 'ninguno'}")
    if fuera_de_lista:
        print(f"Caracteres fuera de la lista: {dict(fuera_de_lista)}")
    print(f"Largo máximo de etiqueta: {max(largos)}")


def leer_args():
    p = argparse.ArgumentParser(description="Recorta cada palabra y escribe gt_list.txt y character_list para OCRNet de TAO.")
    p.add_argument("--origen", type=Path, default=RAIZ / "data" / "augmented")
    p.add_argument("--destino", type=Path, default=RAIZ / "data" / "ocrnet")
    p.add_argument("--semilla", type=int, default=42)
    return p.parse_args()


if __name__ == "__main__":
    args = leer_args()
    exportar(args.origen, args.destino, args.semilla)

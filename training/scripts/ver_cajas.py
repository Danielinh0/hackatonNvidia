import argparse
import random
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parents[1]
COLOR_TEXTO = (0, 170, 0)
COLOR_IGNORAR = (220, 0, 0)


def leer_gt(ruta):
    regiones = []
    for num, linea in enumerate(ruta.read_text(encoding="utf-8").splitlines(), start=1):
        if not linea.strip():
            continue
        partes = linea.split(",")
        if len(partes) < 9:
            raise ValueError(f"{ruta.name}:{num} tiene {len(partes)} campos separados por coma, se esperaban al menos 9")
        coords = [int(v) for v in partes[:8]]
        regiones.append((list(zip(coords[0::2], coords[1::2])), ",".join(partes[8:])))
    return regiones


def revisar(dir_split, n, salida, semilla):
    imagenes = sorted((dir_split / "img").glob("*.jpg"))
    if not imagenes:
        raise FileNotFoundError(f"No hay imágenes en {dir_split / 'img'}. Ejecuta primero prep_mod.py.")

    total_regiones = total_ignoradas = fuera = 0
    for ruta_img in imagenes:
        ruta_gt = dir_split / "gt" / f"gt_{ruta_img.stem}.txt"
        if not ruta_gt.exists():
            raise FileNotFoundError(f"Falta {ruta_gt}")
        with Image.open(ruta_img) as im:
            ancho, alto = im.size
        for puntos, texto in leer_gt(ruta_gt):
            total_regiones += 1
            total_ignoradas += texto == "###"
            if any(x < 0 or y < 0 or x > ancho or y > alto for x, y in puntos):
                fuera += 1

    print(f"{dir_split.name}: {len(imagenes)} imágenes, {total_regiones} regiones "
          f"({total_ignoradas} ignoradas con ###), {fuera} con puntos fuera de la imagen")

    salida.mkdir(parents=True, exist_ok=True)
    for ruta_img in random.Random(semilla).sample(imagenes, min(n, len(imagenes))):
        with Image.open(ruta_img) as im:
            lienzo = im.convert("RGB")
        draw = ImageDraw.Draw(lienzo)
        for puntos, texto in leer_gt(dir_split / "gt" / f"gt_{ruta_img.stem}.txt"):
            color = COLOR_IGNORAR if texto == "###" else COLOR_TEXTO
            draw.polygon(puntos, outline=color, width=1)
        destino = salida / f"{dir_split.name}_{ruta_img.stem}.png"
        lienzo.save(destino)
        print(f"  {destino}")
    return fuera


def leer_args():
    p = argparse.ArgumentParser(description="Dibuja las cajas del formato OCDNet sobre muestras para revisarlas a ojo.")
    p.add_argument("--ocdnet", type=Path, default=RAIZ / "data" / "ocdnet")
    p.add_argument("--splits", nargs="+", default=["train", "val", "test"])
    p.add_argument("-n", type=int, default=4, help="Muestras por split")
    p.add_argument("--salida", type=Path, default=RAIZ / "data" / "revision_cajas")
    p.add_argument("--semilla", type=int, default=0)
    return p.parse_args()


if __name__ == "__main__":
    args = leer_args()
    fuera = sum(revisar(args.ocdnet / s, args.n, args.salida, args.semilla) for s in args.splits)
    if fuera:
        raise SystemExit(f"Hay {fuera} regiones con puntos fuera de la imagen.")

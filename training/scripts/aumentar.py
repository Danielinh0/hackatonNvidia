import argparse
import io
import json
import math
import multiprocessing
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parents[1]
# main.py rellena con este gris las esquinas que deja la rotación; aquí se vuelven transparentes.
GRIS_RELLENO = (225, 225, 225)


def homografia(origen, destino):
    filas, valores = [], []
    for (x, y), (u, v) in zip(origen, destino):
        filas.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        filas.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        valores += [u, v]
    h = np.linalg.solve(np.array(filas, dtype=np.float64), np.array(valores, dtype=np.float64))
    return np.append(h, 1.0).reshape(3, 3)


def aplicar_h(h, puntos):
    pts = np.hstack([np.asarray(puntos, dtype=np.float64), np.ones((len(puntos), 1))])
    res = pts @ h.T
    return res[:, :2] / res[:, 2:3]


def fondo_aleatorio(ancho, alto):
    tipo = random.choice(["madera", "mesa", "tela", "kraft", "oscuro"])
    if tipo == "madera":
        base = np.array([random.randint(110, 160), random.randint(75, 105), random.randint(40, 65)], np.float32)
        y = np.arange(alto, dtype=np.float32)[:, None]
        x = np.arange(ancho, dtype=np.float32)[None, :]
        vetas = np.sin(x / random.uniform(6, 14) + 3 * np.sin(y / random.uniform(60, 140))) * random.uniform(8, 18)
        arr = base[None, None, :] + vetas[:, :, None]
    elif tipo == "tela":
        base = np.array([random.randint(30, 90)] * 3, np.float32) + np.random.uniform(-15, 15, 3)
        y = np.arange(alto)[:, None]
        x = np.arange(ancho)[None, :]
        trama = (((x // 3) + (y // 3)) % 2).astype(np.float32) * random.uniform(4, 10)
        arr = base[None, None, :] + trama[:, :, None]
    elif tipo == "kraft":
        arr = np.array([random.randint(170, 200), random.randint(140, 165), random.randint(100, 125)], np.float32)[None, None, :]
        arr = np.repeat(np.repeat(arr, alto, 0), ancho, 1)
    elif tipo == "oscuro":
        arr = np.full((alto, ancho, 3), random.randint(15, 50), np.float32)
    else:
        tono = random.randint(150, 215)
        arr = np.full((alto, ancho, 3), tono, np.float32) + np.random.uniform(-12, 12, 3)
    arr = arr + np.random.normal(0, random.uniform(2, 7), (alto, ancho, 1))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB"), tipo


def arrugas(ticket):
    # Solo fotométricas (pliegues claros/oscuros): no mueven el texto, así que las cajas siguen valiendo.
    w, h = ticket.size
    capa = Image.new("L", (w, h), 128)
    draw = ImageDraw.Draw(capa)
    for _ in range(random.randint(1, 4)):
        if random.random() < 0.6:
            y = random.uniform(0, h)
            p1, p2 = (0, y), (w, y + random.uniform(-0.3, 0.3) * w)
        else:
            x = random.uniform(0, w)
            p1, p2 = (x, 0), (x + random.uniform(-0.2, 0.2) * h, h)
        draw.line([p1, p2], fill=random.choice([90, 165]), width=random.randint(2, 6))
    capa = capa.filter(ImageFilter.GaussianBlur(random.uniform(2, 5)))
    factor = 1 + (np.asarray(capa, np.float32)[:, :, None] - 128) / 128 * random.uniform(0.15, 0.35)
    arr = np.asarray(ticket, np.float32)
    arr[:, :, :3] = np.clip(arr[:, :, :3] * factor, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), ticket.mode)


def sombra(img):
    w, h = img.size
    mascara = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mascara)
    borde = random.choice(["izq", "der", "arr", "aba"])
    profundidad = random.uniform(0.2, 0.55)
    if borde == "izq":
        x = w * profundidad
        poli = [(0, 0), (x + random.uniform(-0.2, 0.2) * w, 0), (x + random.uniform(-0.2, 0.2) * w, h), (0, h)]
    elif borde == "der":
        x = w * (1 - profundidad)
        poli = [(x + random.uniform(-0.2, 0.2) * w, 0), (w, 0), (w, h), (x + random.uniform(-0.2, 0.2) * w, h)]
    elif borde == "arr":
        y = h * profundidad
        poli = [(0, 0), (w, 0), (w, y + random.uniform(-0.15, 0.15) * h), (0, y + random.uniform(-0.15, 0.15) * h)]
    else:
        y = h * (1 - profundidad)
        poli = [(0, y + random.uniform(-0.15, 0.15) * h), (w, y + random.uniform(-0.15, 0.15) * h), (w, h), (0, h)]
    draw.polygon(poli, fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(random.uniform(15, 45)))
    oscurecer = 1 - (np.asarray(mascara, np.float32)[:, :, None] / 255) * random.uniform(0.25, 0.55)
    return Image.fromarray(np.clip(np.asarray(img, np.float32) * oscurecer, 0, 255).astype(np.uint8), "RGB")


def iluminacion(img):
    w, h = img.size
    arr = np.asarray(img, np.float32)
    angulo = random.uniform(0, 2 * math.pi)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    gradiente = ((xx / w - 0.5) * math.cos(angulo) + (yy / h - 0.5) * math.sin(angulo))
    arr *= (1 + gradiente * random.uniform(0.1, 0.35))[:, :, None]
    arr *= np.array([1 + random.uniform(-0.08, 0.08) for _ in range(3)], np.float32)
    arr = (arr - 128) * random.uniform(0.8, 1.15) + 128 + random.uniform(-20, 20)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def desenfoque(img):
    if random.random() < 0.5:
        return img.filter(ImageFilter.GaussianBlur(random.uniform(0.3, 1.4)))
    n = random.choice([3, 5])
    k = np.zeros((n, n), np.float32)
    if random.random() < 0.5:
        k[n // 2, :] = 1
    else:
        np.fill_diagonal(k, 1)
        if random.random() < 0.5:
            k = np.fliplr(k)
    return img.filter(ImageFilter.Kernel((n, n), k.flatten().tolist(), scale=float(k.sum())))


def ruido_y_jpeg(img):
    arr = np.asarray(img, np.float32) + np.random.normal(0, random.uniform(2, 9), (img.size[1], img.size[0], 1))
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    calidad = random.randint(35, 90)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=calidad)
    buf.seek(0)
    return Image.open(buf).convert("RGB"), calidad


def aumentar(ruta_img, segmentos):
    ticket = Image.open(ruta_img).convert("RGBA")
    arr = np.asarray(ticket).copy()
    relleno = np.all(arr[:, :, :3] == GRIS_RELLENO, axis=2)
    arr[relleno, 3] = 0
    ticket = arrugas(Image.fromarray(arr, "RGBA"))
    tw, th = ticket.size

    # El ticket ocupa entre 55 % y 85 % del alto de la foto, en un lienzo 3:4 como el de un celular.
    alto_lienzo = int(th / random.uniform(0.55, 0.85))
    ancho_lienzo = int(alto_lienzo * 0.75)
    if ancho_lienzo < tw * 1.15:
        ancho_lienzo = int(tw * 1.15)
        alto_lienzo = int(ancho_lienzo / 0.75)
    fondo, tipo_fondo = fondo_aleatorio(ancho_lienzo, alto_lienzo)

    cx = ancho_lienzo / 2 + random.uniform(-0.05, 0.05) * ancho_lienzo
    cy = alto_lienzo / 2 + random.uniform(-0.05, 0.05) * alto_lienzo
    angulo = math.radians(random.uniform(-8, 8))
    esquinas = np.array([[0, 0], [tw, 0], [tw, th], [0, th]], np.float64)
    centradas = esquinas - [tw / 2, th / 2]
    rot = np.array([[math.cos(angulo), -math.sin(angulo)], [math.sin(angulo), math.cos(angulo)]])
    destino = centradas @ rot.T + [cx, cy]
    # Inclinación de la cámara: cada esquina se mueve hasta 6 % del lado más corto.
    jitter = min(tw, th) * random.uniform(0.0, 0.06)
    destino += np.random.uniform(-jitter, jitter, destino.shape)
    margen = 4
    destino[:, 0] = np.clip(destino[:, 0], margen, ancho_lienzo - margen)
    destino[:, 1] = np.clip(destino[:, 1], margen, alto_lienzo - margen)

    h = homografia(esquinas, destino)
    inversa = np.linalg.inv(h)
    inversa /= inversa[2, 2]
    warp = ticket.transform(
        (ancho_lienzo, alto_lienzo), Image.PERSPECTIVE, tuple(inversa.flatten()[:8]), resample=Image.BICUBIC
    )
    lienzo = fondo.convert("RGBA")
    lienzo.alpha_composite(warp)
    img = lienzo.convert("RGB")

    if random.random() < 0.6:
        img = sombra(img)
    img = iluminacion(img)
    img = desenfoque(img)

    # Con main.py a escala de render 2, este rango deja el texto chico entre ~13 y ~22 px de alto.
    escala = random.uniform(0.7, 1.1)
    img = img.resize((round(ancho_lienzo * escala), round(alto_lienzo * escala)), Image.LANCZOS)
    escala_x, escala_y = img.size[0] / ancho_lienzo, img.size[1] / alto_lienzo
    img, calidad = ruido_y_jpeg(img)
    w, hh = img.size

    def mover(poligono):
        pts = aplicar_h(h, poligono) * [escala_x, escala_y]
        pts[:, 0] = np.clip(pts[:, 0], 0, w)
        pts[:, 1] = np.clip(pts[:, 1], 0, hh)
        return [[round(float(x), 1), round(float(y), 1)] for x, y in pts]

    nuevos = [
        {**seg, "poligono": mover(seg["poligono"]),
         "palabras": [{**p, "poligono": mover(p["poligono"])} for p in seg["palabras"]]}
        for seg in segmentos
    ]

    params = {
        "fondo": tipo_fondo, "angulo": round(math.degrees(angulo), 2), "jitter_px": round(jitter, 1),
        "escala": round(escala, 3), "jpeg": calidad,
    }
    return img, nuevos, params


def procesar(tarea):
    reg, origen, dir_img, copias_train, semilla_base = tarea
    semilla = (semilla_base * 1_000_003 + reg["id"]) % 2**32
    random.seed(semilla)
    np.random.seed(semilla)
    salida = []
    if reg["split"] == "train":
        shutil.copy2(origen / "images" / reg["archivo"], dir_img / reg["archivo"])
        salida.append({**reg, "origen": reg["archivo"], "aumento": None})
        copias = copias_train
    else:
        # val y test: una sola versión tipo foto que reemplaza al original, para que se parezcan al uso real.
        copias = 1
    for c in range(1, copias + 1):
        img, segmentos, params = aumentar(origen / "images" / reg["archivo"], reg["segmentos"])
        nombre = f"{Path(reg['archivo']).stem}_a{c}.jpg"
        img.save(dir_img / nombre, "JPEG", quality=95)
        salida.append({
            **reg, "archivo": nombre, "ancho": img.size[0], "alto": img.size[1],
            "segmentos": segmentos, "origen": reg["archivo"], "aumento": params,
        })
    return salida


def main(args):
    registros = json.loads((args.origen / "anotaciones.json").read_text(encoding="utf-8"))

    dir_img = args.destino / "images"
    if dir_img.exists():
        shutil.rmtree(dir_img)
    dir_img.mkdir(parents=True)

    tareas = [(reg, args.origen, dir_img, args.copias, args.semilla) for reg in registros]
    salida = []
    with multiprocessing.Pool(args.procesos) as pool:
        for n, parte in enumerate(pool.imap(procesar, tareas, chunksize=2), start=1):
            salida += parte
            if n % 50 == 0 or n == len(registros):
                print(f"Procesados {n}/{len(registros)} tickets...")

    (args.destino / "anotaciones.json").write_text(json.dumps(salida, indent=1, ensure_ascii=False), encoding="utf-8")
    conteo = {s: sum(r["split"] == s for r in salida) for s in ("train", "val", "test")}
    print(f"\nListo: {len(salida)} imágenes en '{dir_img}'. Por split: {conteo}")


def leer_args():
    p = argparse.ArgumentParser(description="Simula fotos de celular sobre los tickets sintéticos sin romper las cajas.")
    p.add_argument("--origen", type=Path, default=RAIZ / "data" / "synthetic")
    p.add_argument("--destino", type=Path, default=RAIZ / "data" / "augmented")
    # train: original + N copias. val/test: solo 1 versión tipo foto (CLAUDE.md sec. 18).
    # Todas las versiones de un ticket quedan en su mismo split.
    p.add_argument("--copias", type=int, default=2, help="Copias aumentadas por ticket de train")
    p.add_argument("--semilla", type=int, default=42)
    p.add_argument("--procesos", type=int, default=max(1, multiprocessing.cpu_count() - 1))
    return p.parse_args()


if __name__ == "__main__":
    main(leer_args())

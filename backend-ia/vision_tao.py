"""Visión de Dzuun con los modelos que entrenó el equipo en el lab NVIDIA DLI (TAO Toolkit 5.5, Tesla T4).

    OCDNet  modelos/model_best.pth   detecta cada palabra (DBNet: ResNet18 deformable + FPN + DBHead).
                                     Ajustado desde nvidia/tao/ocdnet:trainable_resnet18_v1.0.
    OCRNet  modelos/ocrnet.onnx      lee cada palabra recortada (TPS + ResNet + BiLSTM + CTC), exportado por TAO.
            modelos/character_list   alfabeto con el que se entrenó (minúsculas, cifras y signos).

Por qué se reescribe la red de OCDNet aquí: el .pth de TAO guarda solo pesos (state_dict) y TAO no corre
en CPU. Las capas de abajo reproducen la arquitectura de TAO/DBNet con los MISMOS nombres de parámetros,
así que `load_state_dict(strict=True)` falla si algo no coincide (no hay pesos "aproximados").
La convolución deformable (DCNv2) se implementa con `grid_sample` para no depender de torchvision.

Todo corre en CPU (~10-15 s por foto). La imagen solo vive en memoria; no se escribe en disco (CLAUDE.md sec. 16).
"""
from __future__ import annotations

import hashlib
import math
import os
import threading
import time
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from torch import nn

AQUI = Path(__file__).resolve().parent

# Parámetros de inferencia. Los de post-proceso vienen del spec de TAO (inference.post_processing),
# salvo unclip_ratio = 2.5, que dio 94.5 % de palabras correctas de punta a punta en val (INSTRUCCIONES.md).
LADO_MAX = 1536            # TAO evaluó con 1152 x 1536; se conserva la proporción de la foto
LADO_SONDEO = 640          # pasada rápida para medir el tamaño de la letra
ALTO_OBJETIVO = 32         # alto (px, ya con unclip) de palabra con el que mejor detecta; medido con tickets sintéticos
LADO_FIJO = int(os.environ.get("VISION_LADO", "0"))  # >0 desactiva la escala adaptativa
UMBRAL_PIXEL = 0.3         # thresh
UMBRAL_CAJA = 0.55         # box_thresh
MAX_CANDIDATOS = 1000      # max_candidates
UNCLIP = float(os.environ.get("VISION_UNCLIP", "2.5"))
LADO_MIN = 3               # cajas más chicas se descartan (igual que DBNet)
OCR_ANCHO, OCR_ALTO = 100, 32
MEDIA = np.array([0.485, 0.456, 0.406], dtype=np.float32)  # Normalize de TAO/DBNet (aplicado sobre BGR)
DESV = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def carpeta_modelos() -> Path:
    """VISION_MODELOS, o backend-ia/modelos/ (INSTRUCCIONES.md), o modelos/ en la raíz del repo."""
    if os.environ.get("VISION_MODELOS"):
        return Path(os.environ["VISION_MODELOS"])
    for c in (AQUI / "modelos", AQUI.parent / "modelos"):
        if (c / "model_best.pth").exists():
            return c
    return AQUI / "modelos"


# ---------------------------------------------------------------- OCDNet (arquitectura de TAO/DBNet)

def _deform_conv(x, offset, mask, weight):
    """Convolución deformable modulada (DCNv2) 3x3, stride 1, padding 1, sin sesgo, un grupo de offsets.
    offset: [B, 18, H, W] con pares (dy, dx) por posición del kernel (fila mayor), como mmcv/torchvision.
    mask:   [B, 9, H, W] ya con sigmoide."""
    b, c, h, w = x.shape
    ys = torch.arange(h, dtype=x.dtype, device=x.device).view(1, h, 1)
    xs = torch.arange(w, dtype=x.dtype, device=x.device).view(1, 1, w)
    muestras = []
    for k in range(9):
        ki, kj = divmod(k, 3)
        py = ys + (ki - 1) + offset[:, 2 * k]      # [B, H, W]
        px = xs + (kj - 1) + offset[:, 2 * k + 1]
        grid = torch.stack((2 * px / max(w - 1, 1) - 1, 2 * py / max(h - 1, 1) - 1), dim=-1)
        s = F.grid_sample(x, grid, mode="bilinear", padding_mode="zeros", align_corners=True)
        muestras.append(s * mask[:, k:k + 1])
    col = torch.stack(muestras, dim=2)                          # [B, C, 9, H, W]
    return torch.einsum("bckhw,ock->bohw", col, weight.view(weight.shape[0], c, 9))


class DeformConv(nn.Module):
    def __init__(self, cin, cout):
        super().__init__()
        self.weight = nn.Parameter(torch.empty(cout, cin, 3, 3))

    def forward(self, x, offset, mask):
        return _deform_conv(x, offset, mask, self.weight)


class Bloque(nn.Module):
    """BasicBlock de ResNet18; con dcn, conv2 es deformable y conv2_offset predice offsets (18) + máscara (9)."""

    def __init__(self, cin, cout, stride=1, dcn=False):
        super().__init__()
        self.conv1 = nn.Conv2d(cin, cout, 3, stride, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(cout)
        self.relu = nn.ReLU(inplace=True)
        self.dcn = dcn
        if dcn:
            self.conv2_offset = nn.Conv2d(cout, 27, 3, padding=1)
            self.conv2 = DeformConv(cout, cout)
        else:
            self.conv2 = nn.Conv2d(cout, cout, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(cout)
        self.downsample = None
        if stride != 1 or cin != cout:
            self.downsample = nn.Sequential(nn.Conv2d(cin, cout, 1, stride, bias=False), nn.BatchNorm2d(cout))

    def forward(self, x):
        out = self.relu(self.bn1(self.conv1(x)))
        if self.dcn:
            om = self.conv2_offset(out)
            out = self.conv2(out, om[:, :18], om[:, -9:].sigmoid())
        else:
            out = self.conv2(out)
        out = self.bn2(out)
        return self.relu(out + (self.downsample(x) if self.downsample is not None else x))


class ResNet18Deformable(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, 7, 2, 3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(3, 2, 1)
        self.layer1 = nn.Sequential(Bloque(64, 64), Bloque(64, 64))
        self.layer2 = nn.Sequential(Bloque(64, 128, 2, True), Bloque(128, 128, 1, True))
        self.layer3 = nn.Sequential(Bloque(128, 256, 2, True), Bloque(256, 256, 1, True))
        self.layer4 = nn.Sequential(Bloque(256, 512, 2, True), Bloque(512, 512, 1, True))

    def forward(self, x):
        x = self.maxpool(self.relu(self.bn1(self.conv1(x))))
        c2 = self.layer1(x)
        c3 = self.layer2(c2)
        c4 = self.layer3(c3)
        return c2, c3, c4, self.layer4(c4)


class FPN(nn.Module):
    """Cuello de DBNet: reduce a 256 canales, suma de arriba abajo y concatena 4 mapas de 64 canales a 1/4."""

    def __init__(self, inner=256):
        super().__init__()
        q = inner // 4
        self.in5, self.in4 = nn.Conv2d(512, inner, 1, bias=False), nn.Conv2d(256, inner, 1, bias=False)
        self.in3, self.in2 = nn.Conv2d(128, inner, 1, bias=False), nn.Conv2d(64, inner, 1, bias=False)
        self.out5 = nn.Sequential(nn.Conv2d(inner, q, 3, padding=1, bias=False), nn.Upsample(scale_factor=8))
        self.out4 = nn.Sequential(nn.Conv2d(inner, q, 3, padding=1, bias=False), nn.Upsample(scale_factor=4))
        self.out3 = nn.Sequential(nn.Conv2d(inner, q, 3, padding=1, bias=False), nn.Upsample(scale_factor=2))
        self.out2 = nn.Conv2d(inner, q, 3, padding=1, bias=False)

    def forward(self, feats):
        c2, c3, c4, c5 = feats
        in5, in4, in3, in2 = self.in5(c5), self.in4(c4), self.in3(c3), self.in2(c2)
        out4 = F.interpolate(in5, size=in4.shape[2:]) + in4
        out3 = F.interpolate(out4, size=in3.shape[2:]) + in3
        out2 = F.interpolate(out3, size=in2.shape[2:]) + in2
        return torch.cat((self.out5(in5), self.out4(out4), self.out3(out3), self.out2(out2)), 1)


def _rama(inner=256):
    q = inner // 4
    return nn.Sequential(
        nn.Conv2d(inner, q, 3, padding=1, bias=False), nn.BatchNorm2d(q), nn.ReLU(inplace=True),
        nn.ConvTranspose2d(q, q, 2, 2), nn.BatchNorm2d(q), nn.ReLU(inplace=True),
        nn.ConvTranspose2d(q, 1, 2, 2), nn.Sigmoid())


class DBHead(nn.Module):
    def __init__(self):
        super().__init__()
        self.binarize = _rama()
        self.thresh = _rama()  # solo se usa al entrenar; se carga para que strict=True verifique todo el archivo

    def forward(self, x):
        return self.binarize(x)  # mapa de probabilidad de texto, a la resolución de la entrada


class OCDNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = ResNet18Deformable()
        self.neck = FPN()
        self.head = DBHead()

    def forward(self, x):
        return self.head(self.neck(self.backbone(x)))


# ---------------------------------------------------------------- post-proceso (SegDetectorRepresenter, cajas)

def _puntaje_caja(mapa, caja):
    h, w = mapa.shape
    xmin, xmax = np.clip(np.floor(caja[:, 0].min()), 0, w - 1).astype(int), np.clip(np.ceil(caja[:, 0].max()), 0, w - 1).astype(int)
    ymin, ymax = np.clip(np.floor(caja[:, 1].min()), 0, h - 1).astype(int), np.clip(np.ceil(caja[:, 1].max()), 0, h - 1).astype(int)
    m = np.zeros((ymax - ymin + 1, xmax - xmin + 1), dtype=np.uint8)
    c = caja.copy()
    c[:, 0] -= xmin
    c[:, 1] -= ymin
    cv2.fillPoly(m, c.reshape(1, -1, 2).astype(np.int32), 1)
    return float(cv2.mean(mapa[ymin:ymax + 1, xmin:xmax + 1], m)[0])


def _ordenar(pts):
    """4 puntos en orden: arriba-izq, arriba-der, abajo-der, abajo-izq."""
    pts = sorted(pts.tolist(), key=lambda p: p[0])
    izq, der = sorted(pts[:2], key=lambda p: p[1]), sorted(pts[2:], key=lambda p: p[1])
    return np.array([izq[0], der[0], der[1], izq[1]], dtype=np.float32)


def _unclip(rect, ratio):
    """Expande el rectángulo la distancia d = área * ratio / perímetro por cada lado. Es lo que hace DBNet
    con pyclipper; en un rectángulo da el mismo resultado tras volver a ajustar minAreaRect."""
    (cx, cy), (w, h), ang = rect
    d = (w * h) * ratio / max(2 * (w + h), 1e-6)
    return (cx, cy), (w + 2 * d, h + 2 * d), ang


def cajas_desde_mapa(prob, ancho, alto):
    """prob: mapa [H, W] en [0, 1]. Devuelve [(poligono 4x2 en píxeles de la foto original, puntaje)]."""
    h, w = prob.shape
    binario = (prob > UMBRAL_PIXEL).astype(np.uint8)
    contornos, _ = cv2.findContours(binario, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    salida = []
    for cont in contornos[:MAX_CANDIDATOS]:
        rect = cv2.minAreaRect(cont)
        if min(rect[1]) < LADO_MIN:
            continue
        caja = _ordenar(cv2.boxPoints(rect))
        puntaje = _puntaje_caja(prob, caja)
        if puntaje < UMBRAL_CAJA:
            continue
        rect = _unclip(cv2.minAreaRect(caja), UNCLIP)
        if min(rect[1]) < LADO_MIN + 2:
            continue
        caja = _ordenar(cv2.boxPoints(rect))
        caja[:, 0] = np.clip(np.round(caja[:, 0] / w * ancho), 0, ancho)
        caja[:, 1] = np.clip(np.round(caja[:, 1] / h * alto), 0, alto)
        salida.append((caja, puntaje))
    return salida


# ---------------------------------------------------------------- OCRNet

def recortar(gris, poligono):
    """Endereza el cuadrilátero de la palabra con una transformación de perspectiva."""
    p = poligono.astype(np.float32)
    ancho = int(max(np.linalg.norm(p[0] - p[1]), np.linalg.norm(p[3] - p[2])))
    alto = int(max(np.linalg.norm(p[0] - p[3]), np.linalg.norm(p[1] - p[2])))
    ancho, alto = max(ancho, 1), max(alto, 1)
    destino = np.array([[0, 0], [ancho, 0], [ancho, alto], [0, alto]], dtype=np.float32)
    m = cv2.getPerspectiveTransform(p, destino)
    rec = cv2.warpPerspective(gris, m, (ancho, alto), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    if alto > ancho * 1.5:  # palabra vertical: girar para leerla
        rec = np.rot90(rec)
    return rec


def preparar_ocr(recorte):
    """Igual que OCRNet de TAO: gris, 100x32 sin conservar proporción, (x/255 - 0.5) / 0.5."""
    r = cv2.resize(recorte, (OCR_ANCHO, OCR_ALTO), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    return ((r / 255.0 - 0.5) / 0.5)[None]


def decodificar_ctc(ids, probs, alfabeto):
    """ids/probs por paso de tiempo (salida del ONNX). 0 = blanco de CTC; i -> alfabeto[i-1].
    Confianza = producto de las probabilidades de todos los pasos (como la inferencia de TAO)."""
    texto, previo = [], -1
    for i in ids:
        i = int(i)
        if i != previo and 0 < i <= len(alfabeto):
            texto.append(alfabeto[i - 1])
        previo = i
    return "".join(texto), float(np.prod(probs.astype(np.float64)))


# ---------------------------------------------------------------- agrupar en renglones y segmentos

SOLAPE_MIN = 0.5   # fracción de altura que dos palabras deben compartir para ir en el mismo renglón
HUECO_SEGMENTO = 1.5  # hueco horizontal (en alturas de renglón) que separa dos segmentos del mismo renglón


def _inclinacion(palabras):
    """Ángulo mediano (rad) del borde superior de las palabras alargadas: corrige fotos ligeramente giradas."""
    angulos = []
    for p in palabras:
        q = p["_q"]
        dx, dy = q[1] - q[0]
        if np.hypot(dx, dy) > 2 * p["_alto"]:
            angulos.append(math.atan2(dy, dx))
    return float(np.median(angulos)) if angulos else 0.0


def agrupar_renglones(palabras):
    """Agrupa palabras en renglones del ticket y las ordena de izquierda a derecha.
    Se endereza por la inclinación mediana y una palabra entra al renglón con el que más se solapa en
    vertical (>= SOLAPE_MIN de su altura) sin encimarse en horizontal con otra palabra de ese renglón.
    Así el importe alineado a la derecha, que suele quedar un poco más arriba, cae con su etiqueta."""
    if not palabras:
        return []
    a = _inclinacion(palabras)
    c, s = math.cos(-a), math.sin(-a)
    for p in palabras:
        q = p["_q"] @ np.array([[c, s], [-s, c]], dtype=np.float64)  # rotar -a
        p["_x0"], p["_x1"] = float(q[:, 0].min()), float(q[:, 0].max())
        p["_y0"], p["_y1"] = float(q[:, 1].min()), float(q[:, 1].max())
    renglones = []  # cada uno: {"y0", "y1", "palabras"}
    for p in sorted(palabras, key=lambda p: (p["_y0"] + p["_y1"]) / 2):
        mejor, mejor_solape = None, SOLAPE_MIN
        for r in renglones:
            solape = min(p["_y1"], r["y1"]) - max(p["_y0"], r["y0"])
            solape /= max(1e-6, min(p["_y1"] - p["_y0"], r["y1"] - r["y0"]))
            enciman = any(min(p["_x1"], o["_x1"]) - max(p["_x0"], o["_x0"]) > 0.3 * min(p["_x1"] - p["_x0"], o["_x1"] - o["_x0"])
                          for o in r["palabras"])
            if solape >= mejor_solape and not enciman:
                mejor, mejor_solape = r, solape
        if mejor is None:
            renglones.append({"y0": p["_y0"], "y1": p["_y1"], "palabras": [p]})
        else:
            mejor["palabras"].append(p)
            mejor["y0"] = float(np.mean([o["_y0"] for o in mejor["palabras"]]))
            mejor["y1"] = float(np.mean([o["_y1"] for o in mejor["palabras"]]))
    renglones.sort(key=lambda r: r["y0"] + r["y1"])
    for r in renglones:
        r["palabras"].sort(key=lambda p: p["_x0"])
    return [r["palabras"] for r in renglones]


def partir_segmentos(fila):
    """Separa un renglón en segmentos donde hay un hueco grande (p. ej. "TOTAL A PAGAR" | "$1351.40")."""
    alto = float(np.median([p["_y1"] - p["_y0"] for p in fila]))
    segs = [[fila[0]]]
    for p in fila[1:]:
        if p["_x0"] - segs[-1][-1]["_x1"] > HUECO_SEGMENTO * alto:
            segs.append([p])
        else:
            segs[-1].append(p)
    return segs


def _sha256(ruta: Path) -> str:
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def _publica(p):
    return {k: v for k, v in p.items() if not k.startswith("_")}


class ImagenInvalida(Exception):
    pass


class Lector:
    """Carga OCDNet + OCRNet una vez y lee fotos de tickets. Seguro para usar desde varios hilos."""

    ARCHIVOS = ("model_best.pth", "ocrnet.onnx", "character_list")

    def __init__(self, carpeta: Path | None = None):
        self.carpeta = Path(carpeta) if carpeta else carpeta_modelos()
        self.cargado = False
        self.error = None
        self.modelos = []
        self._candado = threading.Lock()

    def disponible(self) -> bool:
        return all((self.carpeta / a).exists() for a in self.ARCHIVOS)

    def cargar(self):
        import onnxruntime as ort

        if self.cargado:
            return
        faltan = [a for a in self.ARCHIVOS if not (self.carpeta / a).exists()]
        if faltan:
            raise FileNotFoundError(f"Faltan pesos de visión en {self.carpeta}: {', '.join(faltan)}")
        # Huellas: se comparan con SHA256SUMS (si está) para acreditar qué pesos se usan.
        esperadas = {}
        sumas = self.carpeta / "SHA256SUMS"
        if sumas.exists():
            for linea in sumas.read_text().splitlines():
                if linea.strip():
                    h, nombre = linea.split(maxsplit=1)
                    esperadas[nombre.strip().lstrip("*")] = h
        self.modelos = []
        for a in self.ARCHIVOS:
            h = _sha256(self.carpeta / a)
            if a in esperadas and esperadas[a] != h:
                raise ValueError(f"{a} no coincide con SHA256SUMS: no son los pesos entregados.")
            self.modelos.append({"archivo": a, "sha256": h, "verificado": a in esperadas})

        ck = torch.load(self.carpeta / "model_best.pth", map_location="cpu", weights_only=False)
        if ck.get("config", {}).get("model", {}).get("backbone") != "deformable_resnet18":
            raise ValueError("model_best.pth no es el OCDNet deformable_resnet18 esperado.")
        red = OCDNet()
        red.load_state_dict(ck["state_dict"], strict=True)  # falla si la arquitectura no coincide
        self.metricas_val = {k: float(v) for k, v in ck.get("metrics", {}).items()
                             if k in ("precision", "recall", "hmean")}
        self.epoca = ck.get("epoch")
        del ck
        self.ocdnet = red.eval()

        self.alfabeto = [l.strip() for l in (self.carpeta / "character_list").read_text().splitlines() if l.strip()]
        opciones = ort.SessionOptions()
        opciones.log_severity_level = 3
        self.ocrnet = ort.InferenceSession(str(self.carpeta / "ocrnet.onnx"), opciones,
                                           providers=["CPUExecutionProvider"])
        self.cargado = True

    def estado(self) -> dict:
        return {"cargado": self.cargado, "carpeta": str(self.carpeta), "modelos": self.modelos,
                "ocdnet_val": getattr(self, "metricas_val", None), "error": self.error}

    # -- pasos
    def _mapa(self, bgr, lado):
        alto, ancho = bgr.shape[:2]
        escala = lado / max(alto, ancho)
        nh = max(32, int(round(alto * escala / 32)) * 32)
        nw = max(32, int(round(ancho * escala / 32)) * 32)
        img = cv2.resize(bgr, (nw, nh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        img = (img - MEDIA) / DESV
        x = torch.from_numpy(img.transpose(2, 0, 1)).unsqueeze(0)
        with torch.inference_mode():
            return self.ocdnet(x)[0, 0].numpy()

    def elegir_lado(self, bgr):
        """Escala adaptativa: OCDNet deja de detectar si la letra queda demasiado grande (foto muy de cerca).
        Una pasada a 640 px mide el alto mediano de las palabras y se elige el lado para que midan
        ~ALTO_OBJETIVO px. Si en el sondeo casi no hay texto (letra chica), se usa LADO_MAX."""
        if LADO_FIJO > 0:
            return LADO_FIJO
        alto, ancho = bgr.shape[:2]
        cajas = cajas_desde_mapa(self._mapa(bgr, LADO_SONDEO), LADO_SONDEO, LADO_SONDEO)
        if len(cajas) < 5:
            return LADO_MAX
        h = float(np.median([np.linalg.norm(c[0] - c[3]) for c, _ in cajas]))
        return int(np.clip(LADO_SONDEO * ALTO_OBJETIVO / max(h, 1), LADO_SONDEO, LADO_MAX))

    def detectar(self, bgr):
        alto, ancho = bgr.shape[:2]
        self.ultimo_lado = self.elegir_lado(bgr)
        return cajas_desde_mapa(self._mapa(bgr, self.ultimo_lado), ancho, alto)

    def leer_palabras(self, gris, cajas, lote=64):
        recortes = [preparar_ocr(recortar(gris, c)) for c, _ in cajas]
        resultados = []
        for i in range(0, len(recortes), lote):
            ids, probs = self.ocrnet.run(None, {"input": np.stack(recortes[i:i + lote])})
            resultados += [decodificar_ctc(a, b, self.alfabeto) for a, b in zip(ids, probs)]
        return resultados

    def leer(self, imagen: bytes) -> dict:
        """bytes de la foto -> palabras, segmentos (renglones), texto. Lanza ImagenInvalida."""
        if not self.cargado:
            self.cargar()
        inicio = time.time()
        bgr = cv2.imdecode(np.frombuffer(imagen, np.uint8), cv2.IMREAD_COLOR)
        if bgr is None or min(bgr.shape[:2]) < 32:
            raise ImagenInvalida("No pudimos abrir la imagen. Prueba con una foto JPG o PNG.")
        gris = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        with self._candado:  # una inferencia a la vez: en CPU no gana nada paralelizar y cuida la memoria
            cajas = self.detectar(bgr)
            lecturas = self.leer_palabras(gris, cajas) if cajas else []
        palabras = []
        for (caja, conf_caja), (texto, conf_ocr) in zip(cajas, lecturas):
            if not texto:
                continue
            palabras.append({
                "texto": texto.upper(),  # OCRNet se entrenó sin distinguir mayúsculas; los tickets van en mayúsculas
                "poligono": caja.astype(int).tolist(),
                "conf_caja": round(conf_caja, 4),
                "conf_ocr": round(conf_ocr, 4),
                "_q": caja.astype(np.float64),
                "_alto": float(np.linalg.norm(caja[0] - caja[3])),
            })
        segmentos, lineas, lineas_llm = [], [], []
        for n, fila in enumerate(agrupar_renglones(palabras)):
            ids = []
            for seg in partir_segmentos(fila):
                pts = np.concatenate([p["_q"] for p in seg])
                x0, y0 = pts.min(0).round().astype(int).tolist()
                x1, y1 = pts.max(0).round().astype(int).tolist()
                ids.append(len(segmentos))
                segmentos.append({
                    "id": len(segmentos),
                    "texto": " ".join(p["texto"] for p in seg),
                    "poligono": [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
                    "linea": n,
                    "conf_caja": min(p["conf_caja"] for p in seg),
                    "conf_ocr": min(p["conf_ocr"] for p in seg),
                    "palabras": [_publica(p) for p in seg],
                })
            # Texto plano (formato con el que se entrenó el asistente): segmentos separados por dos espacios.
            lineas.append("  ".join(segmentos[i]["texto"] for i in ids))
            lineas_llm.append(" | ".join(f"[{i}] {segmentos[i]['texto']}" for i in ids))
        return {
            "palabras": [_publica(p) for p in palabras],
            "segmentos": segmentos,
            "texto": "\n".join(lineas),
            "texto_para_llm": "\n".join(lineas_llm),
            "ancho": int(bgr.shape[1]), "alto": int(bgr.shape[0]), "lado_red": self.ultimo_lado,
            "segundos": round(time.time() - inicio, 2),
        }

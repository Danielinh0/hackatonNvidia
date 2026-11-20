"""Imagen -> texto OCR para el asistente.

VISION_MODO (variable de entorno):
    tesseract  (por defecto) OCR de la foto completa con Tesseract en español. Es un OCR
               PREENTRENADO, NO entrenado por el equipo: complemento declarado (CLAUDE.md sec. 17).
               Sirve para probar el recorrido completo mientras se integra YOLO.
    simulada   sin OCR: devuelve training/asistente/ejemplos/ticket_ejemplo.txt (sintético) y la
               respuesta se marca SIMULADO. Nunca en la demo. (También VISION_SIMULADA=1.)
    yolo       PENDIENTE (equipo de visión): YOLO11 entrenado detecta el ticket/regiones y el OCR
               lee en orden. Implementar en `_texto_yolo`.

Contrato: el texto va **línea por línea, de arriba a abajo**, como ticket_ejemplo.txt. Así se
entrenó el asistente; recortes sueltos sin orden pueden empeorar la lectura.
La imagen solo vive en memoria: no se escribe en disco (CLAUDE.md sec. 16).
"""
import io
import os
import shutil

AQUI = os.path.dirname(os.path.abspath(__file__))
EJEMPLO = os.path.join(AQUI, "..", "training", "asistente", "ejemplos", "ticket_ejemplo.txt")
MIN_CARACTERES = 15  # menos que esto = no hay texto útil en la foto


class OCRNoDisponible(Exception):
    pass


class ImagenIlegible(Exception):
    pass


def modo() -> str:
    if os.environ.get("VISION_SIMULADA") == "1":
        return "simulada"
    return os.environ.get("VISION_MODO", "tesseract")


def simulada() -> bool:
    return modo() == "simulada"


def estado() -> dict:
    m = modo()
    listo = m == "simulada" or (m == "tesseract" and shutil.which("tesseract") is not None)
    return {"modo": m, "simulado": m == "simulada", "conectado": listo,
            "entrenado_por_equipo": False if m in ("tesseract", "simulada") else None}


def extraer_texto(imagen: bytes) -> str:
    m = modo()
    if m == "simulada":
        with open(EJEMPLO, encoding="utf-8") as f:
            return f.read()
    if m == "tesseract":
        return _texto_tesseract(imagen)
    if m == "yolo":
        return _texto_yolo(imagen)
    raise OCRNoDisponible(f"VISION_MODO desconocido: {m}")


def _abrir(imagen: bytes):
    from PIL import Image, ImageOps, UnidentifiedImageError
    try:
        img = Image.open(io.BytesIO(imagen))
        img.load()
    except (UnidentifiedImageError, OSError):
        raise ImagenIlegible("No pudimos abrir la imagen. Prueba con una foto JPG o PNG.")
    img = ImageOps.exif_transpose(img)  # fotos de teléfono vienen giradas por EXIF
    return img.convert("L")              # escala de grises: el OCR lee mejor


def _texto_tesseract(imagen: bytes) -> str:
    if shutil.which("tesseract") is None:
        raise OCRNoDisponible("El lector de texto (Tesseract) no está instalado en el servidor.")
    import pytesseract

    img = _abrir(imagen)
    if max(img.size) < 1200:  # tickets fotografiados de lejos: agrandar ayuda al OCR
        f = 1200 / max(img.size)
        img = img.resize((round(img.width * f), round(img.height * f)))
    try:
        # psm 4: una columna de texto de tamaños variables (lo típico de un ticket)
        texto = pytesseract.image_to_string(img, lang="spa", config="--psm 4")
    except pytesseract.TesseractError as e:
        if "spa" in str(e):
            raise OCRNoDisponible("Falta el idioma español de Tesseract (paquete tesseract-spa / tesseract-ocr-spa).")
        raise ImagenIlegible("No pudimos leer el texto de la foto.")
    lineas = [l.rstrip() for l in texto.splitlines() if l.strip()]
    texto = "\n".join(lineas)
    if len(texto) < MIN_CARACTERES:
        raise ImagenIlegible("No encontramos texto en la foto. Acércate al ticket y que tenga buena luz.")
    return texto


def _texto_yolo(imagen: bytes) -> str:
    # TODO (visión): cargar los pesos entrenados (training/vision/weights/...), detectar el ticket y
    # sus regiones, recortar y pasar a OCR en orden de lectura. Si no hay detección:
    #   raise ImagenIlegible("No encontramos un ticket en la foto.")
    raise OCRNoDisponible("El detector YOLO todavía no está conectado (VISION_MODO=yolo).")

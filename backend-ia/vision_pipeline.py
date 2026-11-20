"""Imagen -> texto OCR para el asistente.

VISION_MODO (variable de entorno):
    tao        (por defecto) OCDNet + OCRNet ajustados por el equipo con TAO, en CPU (vision_tao.py).
               Pesos en VISION_MODELOS (por defecto modelos/). Sin pesos: OCRNoDisponible -> 503.
    tesseract  respaldo: OCR de la foto completa con Tesseract en español. Es un OCR PREENTRENADO,
               NO entrenado por el equipo: complemento declarado (CLAUDE.md sec. 17).
    simulada   sin OCR: devuelve training/asistente/ejemplos/ticket_ejemplo.txt (sintético) y la
               respuesta se marca SIMULADO. Nunca en la demo. (También VISION_SIMULADA=1.)

Contrato: el texto va **línea por línea, de arriba a abajo**, como ticket_ejemplo.txt. Así se
entrenó el asistente; recortes sueltos sin orden pueden empeorar la lectura.
La imagen solo vive en memoria: no se escribe en disco (CLAUDE.md sec. 16).
"""
import io
import logging
import os
import shutil
import threading

log = logging.getLogger("vision")

AQUI = os.path.dirname(os.path.abspath(__file__))
EJEMPLO = os.path.join(AQUI, "..", "training", "asistente", "ejemplos", "ticket_ejemplo.txt")
MIN_CARACTERES = 15  # menos que esto = no hay texto útil en la foto


class OCRNoDisponible(Exception):
    pass


class ImagenIlegible(Exception):
    def __init__(self, mensaje, codigo="SIN_TEXTO"):
        super().__init__(mensaje)
        self.codigo = codigo  # IMAGEN_INVALIDA o SIN_TEXTO


_lector = None
_error = None
_candado = threading.Lock()


def modo() -> str:
    if os.environ.get("VISION_SIMULADA") == "1":
        return "simulada"
    return os.environ.get("VISION_MODO", "tao")


def simulada() -> bool:
    return modo() == "simulada"


def _obtener_lector():
    """Crea y carga el lector una sola vez. Si faltan pesos o dependencias, guarda el error."""
    global _lector, _error
    with _candado:
        if _lector is not None:
            return _lector
        try:
            import vision_tao
            lector = vision_tao.Lector()
            if not lector.disponible():
                raise FileNotFoundError(f"No están los pesos de visión en {lector.carpeta}.")
            lector.cargar()
        except Exception as e:  # sin pesos, sin torch/cv2/onnxruntime, o pesos que no coinciden
            _error = str(e)
            log.warning("Visión no disponible: %s", e)
            return None
        _lector, _error = lector, None
        return _lector


def cargar():
    """Se llama al arrancar el servicio. No es fatal: sin visión, /vision/* responde 503."""
    if modo() == "tao":
        _obtener_lector()


def estado() -> dict:
    m = modo()
    e = {"modo": m, "simulado": m == "simulada", "entrenado_por_equipo": m == "tao"}
    if m == "simulada":
        e["conectado"] = True
    elif m == "tesseract":
        e["conectado"] = shutil.which("tesseract") is not None
    elif m == "tao":
        e["conectado"] = _lector is not None
        e["error"] = _error
        if _lector is not None:
            e.update({k: v for k, v in _lector.estado().items() if k in ("modelos", "ocdnet_val", "carpeta")})
    else:
        e["conectado"], e["error"] = False, f"VISION_MODO desconocido: {m}"
    return e


def _leer_simulado() -> dict:
    with open(EJEMPLO, encoding="utf-8") as f:
        texto = f.read().rstrip("\n")
    return {"palabras": [], "segmentos": [], "texto": texto, "texto_para_llm": texto,
            "modelos": [], "simulado": True}


def leer(imagen: bytes) -> dict:
    """Solo visión (OCDNet + OCRNet): palabras, segmentos con polígono y confianzas, texto.
    Lanza OCRNoDisponible (sin pesos) o ImagenIlegible (IMAGEN_INVALIDA / SIN_TEXTO)."""
    if simulada():
        return _leer_simulado()
    lector = _obtener_lector()
    if lector is None:
        raise OCRNoDisponible(f"El modelo de visión no está conectado: {_error}")
    import vision_tao
    try:
        r = lector.leer(imagen)
    except vision_tao.ImagenInvalida as e:
        raise ImagenIlegible(str(e), codigo="IMAGEN_INVALIDA")
    if len(r["texto"].strip()) < MIN_CARACTERES:
        raise ImagenIlegible("No encontramos texto en la foto. Acércate al ticket y que tenga buena luz.")
    r["modelos"] = lector.modelos  # sha256 de los pesos en uso (acredita el modelo entrenado)
    r["simulado"] = False
    return r


def extraer_texto(imagen: bytes) -> str:
    m = modo()
    if m == "simulada":
        return _leer_simulado()["texto"]
    if m == "tao":
        return leer(imagen)["texto"]
    if m == "tesseract":
        return _texto_tesseract(imagen)
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


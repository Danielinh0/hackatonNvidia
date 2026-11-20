"""Imagen -> texto OCR. AQUÍ SE CONECTA EL MODELO DE VISIÓN (YOLO11 del equipo) + OCR.

Contrato para quien integre visión: implementar `extraer_texto(imagen: bytes) -> str`
que devuelva el texto del ticket **línea por línea, de arriba a abajo**, como en
training/asistente/ejemplos/ticket_ejemplo.txt. Ese es el formato con el que se entrenó
el asistente: si se le manda otra cosa (p. ej. solo recortes sueltos sin orden) puede leer peor.

Mientras no esté conectado:
    VISION_SIMULADA=1  devuelve el texto de ticket_ejemplo.txt (sintético, test-00000) y la
                       respuesta se marca SIMULADO. Nunca usar en la demo.
La imagen solo vive en memoria: no se escribe en disco (CLAUDE.md sec. 16).
"""
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
EJEMPLO = os.path.join(AQUI, "..", "training", "asistente", "ejemplos", "ticket_ejemplo.txt")


class OCRNoDisponible(Exception):
    pass


class ImagenIlegible(Exception):
    pass


def simulada() -> bool:
    return os.environ.get("VISION_SIMULADA") == "1"


def estado() -> dict:
    return {"simulado": simulada(), "conectado": simulada()}  # cambiar cuando se conecte YOLO + OCR


def extraer_texto(imagen: bytes) -> str:
    if simulada():
        with open(EJEMPLO, encoding="utf-8") as f:
            return f.read()
    # TODO (visión): YOLO11 detecta el ticket/regiones -> OCR -> texto en orden de lectura.
    # Si no se detecta ningún comprobante: raise ImagenIlegible("No encontramos un ticket en la foto.")
    raise OCRNoDisponible("El lector de imágenes todavía no está conectado.")

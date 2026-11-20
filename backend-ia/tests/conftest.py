"""Configuración común de las pruebas del backend.

Las pruebas NO cargan el modelo ni usan GPU: el asistente corre con LLM_SIMULADO=1 o con un
modelo falso (FakeModelo en test_asistente.py). Los datos vienen del repo, no se inventan:
  - training/asistente/ejemplos/ticket_ejemplo.txt  (texto OCR sintético de test-00000)
  - training/asistente/dataset/test.jsonl           (200 pares OCR -> JSON CFDI, sintéticos)
"""
import json
import os

import pytest

# Deben fijarse ANTES de importar app.py (el Asistente lee LLM_SIMULADO al crearse).
TOKEN = "token-de-prueba-0123456789"  # solo para pruebas, no es un secreto real
os.environ["BACKEND_TOKEN"] = TOKEN
os.environ["LLM_SIMULADO"] = "1"
os.environ.pop("VISION_SIMULADA", None)
# Las pruebas de rutas no cargan los pesos de visión (~400 MB); test_vision.py los prueba aparte si existen.
os.environ["VISION_MODELOS"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sin-modelos")

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, "..", ".."))
TICKET_EJEMPLO = os.path.join(RAIZ, "training", "asistente", "ejemplos", "ticket_ejemplo.txt")
DATASET_TEST = os.path.join(RAIZ, "training", "asistente", "dataset", "test.jsonl")


def leer_dataset_test():
    with open(DATASET_TEST, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


@pytest.fixture(scope="session")
def ejemplos_test():
    return leer_dataset_test()


@pytest.fixture(scope="session")
def texto_ticket():
    with open(TICKET_EJEMPLO, encoding="utf-8") as f:
        return f.read()


@pytest.fixture(scope="session")
def respuesta_referencia(ejemplos_test):
    """Respuesta esperada (etiqueta del dataset) para test-00000, como texto JSON."""
    return ejemplos_test[0]["messages"][2]["content"]


@pytest.fixture
def auth():
    return {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
def cliente():
    from fastapi.testclient import TestClient

    import app as modulo_app
    with TestClient(modulo_app.app) as c:  # `with` ejecuta el lifespan (token + cargar)
        yield c

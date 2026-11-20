"""Servicio SOLO de visión (sin el LLM): para probar OCDNet + OCRNet en una computadora sin GPU.

    GET  /salud          estado y sha256 de los pesos en uso
    POST /vision/leer    multipart "imagen" -> palabras, segmentos y texto (mismo contrato que app.py)

Mismo secreto compartido que app.py (BACKEND_TOKEN). En la app completa usa `uvicorn app:app`.
Arranque: ver README.md de esta carpeta.
"""
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, UploadFile

import vision_pipeline as vision
from app import vision_leer
from auth_backend import requerir_token, token_configurado


@asynccontextmanager
async def ciclo(_app):
    token_configurado()
    vision.cargar()
    yield


app = FastAPI(title="Dzuun visión", lifespan=ciclo, docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/salud")
def salud():
    return {"ok": True, "vision": vision.estado()}


@app.post("/vision/leer", dependencies=[Depends(requerir_token)])
def leer(imagen: UploadFile = File(...)):
    return vision_leer(imagen)

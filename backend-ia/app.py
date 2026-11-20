"""Servicio de IA de Dzuun (FastAPI). Lo llama solo el servidor Next.js (lib/analisis.ts).

    GET  /salud               estado (sin datos); sirve para probar la conexión
    POST /asistente/leer      {"texto": "..."} -> JSON CFDI     (prueba directa del asistente)
    POST /vision/analizar     multipart "imagen" -> JSON CFDI  (contrato de CLAUDE.md sec. 16)

Arranque: ver README.md de esta carpeta.
"""
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

import vision_pipeline as vision
from auth_backend import requerir_token, token_configurado
from llm_service import Asistente, EntradaInvalida, ErrorLectura

MAX_IMAGEN = 10 * 1024 * 1024  # 10 MB, igual que la app
asistente = Asistente()


@asynccontextmanager
async def ciclo(_app):
    token_configurado()  # sin secreto no arranca
    asistente.cargar()   # el modelo se carga una vez al iniciar (~1 min)
    yield


# Sin CORS: el navegador no debe llamar aquí; solo el servidor Next.js. Sin /docs públicos.
app = FastAPI(title="Dzuun IA", lifespan=ciclo, docs_url=None, redoc_url=None, openapi_url=None)


class Texto(BaseModel):
    texto: str


def _leer(texto: str) -> dict:
    try:
        return asistente.leer(texto)
    except EntradaInvalida as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ErrorLectura as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.get("/salud")
def salud():
    return {"ok": True, "asistente": asistente.estado(), "vision": vision.estado()}


# `def` (no async): FastAPI lo corre en otro hilo y la generación no bloquea /salud.
@app.post("/asistente/leer", dependencies=[Depends(requerir_token)])
def asistente_leer(cuerpo: Texto):
    r = _leer(cuerpo.texto)
    return {"cfdi": r["cfdi"], "conf_global": None, "simulado": r["simulado"],
            "adaptador": r["adaptador"], "segundos": r["segundos"]}


@app.post("/vision/analizar", dependencies=[Depends(requerir_token)])
def vision_analizar(imagen: UploadFile = File(...)):
    datos = imagen.file.read(MAX_IMAGEN + 1)  # solo en memoria; no se guarda
    if not datos:
        raise HTTPException(status_code=400, detail="No llegó la imagen.")
    if len(datos) > MAX_IMAGEN:
        raise HTTPException(status_code=413, detail="La imagen pesa más de 10 MB.")
    try:
        texto = vision.extraer_texto(datos)
    except vision.OCRNoDisponible as e:
        raise HTTPException(status_code=503, detail=str(e))
    except vision.ImagenIlegible as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        del datos
    r = _leer(texto)
    return {
        "cfdi": r["cfdi"],
        "conf_global": None,  # PENDIENTE: confianza por campo (CLAUDE.md sec. 14)
        "simulado": r["simulado"] or vision.simulada(),
        "adaptador": r["adaptador"],
        "segundos": r["segundos"],
    }

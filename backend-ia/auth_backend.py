"""Secreto compartido entre el servidor Next.js y FastAPI (CLAUDE.md sec. 16).

El teléfono nunca llama aquí directo: Next.js reenvía con `Authorization: Bearer <BACKEND_TOKEN>`.
Sin BACKEND_TOKEN configurado, el servicio no arranca (ver app.py).
"""
import hmac
import os

from fastapi import Header, HTTPException


def token_configurado() -> str:
    t = os.environ.get("BACKEND_TOKEN", "")
    if len(t) < 16:
        raise RuntimeError("Falta BACKEND_TOKEN (mínimo 16 caracteres). Genera uno con: "
                           "python -c \"import secrets; print(secrets.token_urlsafe(32))\"")
    return t


def requerir_token(authorization: str = Header(default="")):
    esperado = token_configurado()
    recibido = authorization.removeprefix("Bearer ").strip()
    # compare_digest: tarda lo mismo acierte o no (no revela el secreto por tiempos)
    if not hmac.compare_digest(recibido.encode(), esperado.encode()):
        raise HTTPException(status_code=401, detail="No autorizado.")

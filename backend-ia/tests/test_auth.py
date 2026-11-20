"""auth_backend.py: secreto compartido Next.js -> FastAPI (CLAUDE.md sec. 16)."""
import pytest
from fastapi import HTTPException

import auth_backend
from conftest import TOKEN


def test_token_configurado_devuelve_el_secreto():
    assert auth_backend.token_configurado() == TOKEN


@pytest.mark.parametrize("valor", ["", "corto", "a" * 15])
def test_token_ausente_o_corto_impide_arrancar(monkeypatch, valor):
    monkeypatch.setenv("BACKEND_TOKEN", valor)
    with pytest.raises(RuntimeError, match="BACKEND_TOKEN"):
        auth_backend.token_configurado()


def test_token_de_16_caracteres_es_suficiente(monkeypatch):
    monkeypatch.setenv("BACKEND_TOKEN", "a" * 16)
    assert auth_backend.token_configurado() == "a" * 16


def test_bearer_correcto_pasa():
    assert auth_backend.requerir_token(f"Bearer {TOKEN}") is None


@pytest.mark.parametrize("cabecera", ["", "Bearer ", "Bearer otro-token-0123456789",
                                      f"Bearer {TOKEN}x", f"Basic {TOKEN}"])
def test_bearer_incorrecto_da_401(cabecera):
    with pytest.raises(HTTPException) as e:
        auth_backend.requerir_token(cabecera)
    assert e.value.status_code == 401
    assert e.value.detail == "No autorizado."

"""app.py: rutas HTTP con TestClient (sin servidor ni GPU)."""
import json

import pytest
from fastapi.testclient import TestClient

import app as modulo_app
import vision_pipeline as vision
from falsos import conectar

PNG_FALSO = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # bytes cualquiera; la visión aún no los lee


# ---------- /salud ----------
def test_salud_sin_token(cliente):
    r = cliente.get("/salud")
    assert r.status_code == 200
    d = r.json()
    assert d["ok"] is True
    assert d["asistente"]["simulado"] is True
    assert {"simulado", "conectado"} <= set(d["vision"])


def test_sin_docs_publicos(cliente):
    for ruta in ("/docs", "/redoc", "/openapi.json"):
        assert cliente.get(ruta).status_code == 404


# ---------- autenticación ----------
@pytest.mark.parametrize("cabeceras", [{}, {"Authorization": "Bearer equivocado-0123456789"}])
def test_rutas_protegidas_sin_token_valido(cliente, cabeceras):
    assert cliente.post("/asistente/leer", json={"texto": "x"}, headers=cabeceras).status_code == 401
    assert cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO)},
                        headers=cabeceras).status_code == 401


def test_no_arranca_sin_backend_token(monkeypatch):
    monkeypatch.delenv("BACKEND_TOKEN")
    with pytest.raises(RuntimeError, match="BACKEND_TOKEN"):
        with TestClient(modulo_app.app):
            pass


# ---------- /asistente/leer ----------
def test_leer_ticket_simulado(cliente, auth, texto_ticket, respuesta_referencia):
    r = cliente.post("/asistente/leer", json={"texto": texto_ticket}, headers=auth)
    assert r.status_code == 200
    d = r.json()
    assert set(d) == {"cfdi", "conf_global", "simulado", "simulado_partes", "adaptador", "segundos"}
    assert d["simulado_partes"] == ["asistente"]
    assert d["simulado"] is True
    assert d["conf_global"] is None
    assert d["cfdi"] == json.loads(respuesta_referencia)


def test_leer_texto_vacio_400(cliente, auth):
    r = cliente.post("/asistente/leer", json={"texto": "  "}, headers=auth)
    assert r.status_code == 400
    assert r.json()["detail"] == "No llegó texto para leer."


def test_leer_sin_campo_texto_422(cliente, auth):
    assert cliente.post("/asistente/leer", json={}, headers=auth).status_code == 422


def test_leer_modelo_responde_mal_422(cliente, auth, monkeypatch, texto_ticket):
    a = modulo_app.asistente
    for attr in ("simulado", "cargado", "adaptador"):
        monkeypatch.setattr(a, attr, getattr(a, attr))
    conectar(a, "no es json")
    r = cliente.post("/asistente/leer", json={"texto": texto_ticket}, headers=auth)
    assert r.status_code == 422
    assert "JSON válido" in r.json()["detail"]


def test_leer_con_modelo_falso_no_simulado(cliente, auth, monkeypatch, texto_ticket, respuesta_referencia):
    a = modulo_app.asistente
    for attr in ("simulado", "cargado", "adaptador"):
        monkeypatch.setattr(a, attr, getattr(a, attr))
    conectar(a, respuesta_referencia)
    d = cliente.post("/asistente/leer", json={"texto": texto_ticket}, headers=auth).json()
    assert d["simulado"] is False
    assert d["simulado_partes"] == []
    assert d["adaptador"] == "adaptador-falso"


# ---------- /vision/analizar ----------
def test_analizar_sin_vision_conectada_503(cliente, auth, monkeypatch):
    monkeypatch.delenv("VISION_SIMULADA", raising=False)
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO, "image/png")}, headers=auth)
    assert r.status_code == 503
    assert "no está conectado" in r.json()["detail"]


def test_analizar_simulado_marca_simulado(cliente, auth, monkeypatch, respuesta_referencia):
    monkeypatch.setenv("VISION_SIMULADA", "1")
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO, "image/png")}, headers=auth)
    assert r.status_code == 200
    d = r.json()
    assert d["simulado"] is True
    assert d["cfdi"] == json.loads(respuesta_referencia)


def test_analizar_vision_simulada_y_llm_real_sigue_marcado_simulado(cliente, auth, monkeypatch,
                                                                     respuesta_referencia):
    """Si cualquiera de las dos partes es simulada, la respuesta completa se marca SIMULADO."""
    monkeypatch.setenv("VISION_SIMULADA", "1")
    a = modulo_app.asistente
    for attr in ("simulado", "cargado", "adaptador"):
        monkeypatch.setattr(a, attr, getattr(a, attr))
    conectar(a, respuesta_referencia)
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO)}, headers=auth)
    assert r.json()["simulado"] is True
    assert r.json()["simulado_partes"] == ["vision"]  # el asistente sí leyó: solo la visión es simulada


def test_analizar_ambos_simulados_lo_dice(cliente, auth, monkeypatch):
    monkeypatch.setenv("VISION_SIMULADA", "1")
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO, "image/png")}, headers=auth)
    assert r.json()["simulado_partes"] == ["vision", "asistente"]


def test_analizar_sin_imagen_422(cliente, auth):
    assert cliente.post("/vision/analizar", headers=auth).status_code == 422


def test_analizar_archivo_vacio_400(cliente, auth):
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", b"", "image/png")}, headers=auth)
    assert r.status_code == 400
    assert r.json()["detail"] == "No llegó la imagen."


def test_analizar_imagen_de_mas_de_10_mb_413(cliente, auth, monkeypatch):
    monkeypatch.setenv("VISION_SIMULADA", "1")
    grande = b"\x00" * (modulo_app.MAX_IMAGEN + 1)
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", grande)}, headers=auth)
    assert r.status_code == 413


def test_analizar_imagen_de_10_mb_exactos_se_acepta(cliente, auth, monkeypatch):
    monkeypatch.setenv("VISION_SIMULADA", "1")
    justa = b"\x00" * modulo_app.MAX_IMAGEN
    assert cliente.post("/vision/analizar", files={"imagen": ("t.png", justa)}, headers=auth).status_code == 200


def test_analizar_foto_sin_ticket_422(cliente, auth, monkeypatch):
    def ilegible(_):
        raise vision.ImagenIlegible("No encontramos un ticket en la foto.")
    monkeypatch.setattr(vision, "extraer_texto", ilegible)
    r = cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO)}, headers=auth)
    assert r.status_code == 422
    assert r.json()["detail"] == "No encontramos un ticket en la foto."


def test_analizar_no_escribe_la_imagen_en_disco(cliente, auth, monkeypatch, tmp_path):
    """Privacidad (CLAUDE.md sec. 16): la foto solo vive en memoria."""
    monkeypatch.setenv("VISION_SIMULADA", "1")
    monkeypatch.chdir(tmp_path)
    cliente.post("/vision/analizar", files={"imagen": ("t.png", PNG_FALSO)}, headers=auth)
    assert list(tmp_path.iterdir()) == []


# ---------- /vision/leer (solo visión) ----------
def test_leer_sin_token_401(cliente):
    assert cliente.post("/vision/leer", files={"imagen": ("t.png", PNG_FALSO)}).status_code == 401


def test_leer_sin_pesos_503(cliente, auth, monkeypatch):
    monkeypatch.delenv("VISION_SIMULADA", raising=False)
    r = cliente.post("/vision/leer", files={"imagen": ("t.png", PNG_FALSO)}, headers=auth)
    assert r.status_code == 503


def test_leer_foto_sin_texto_avisa_en_errores(cliente, auth, monkeypatch):
    def sin_texto(_):
        raise vision.ImagenIlegible("No encontramos texto en la foto.", "SIN_TEXTO")
    monkeypatch.setattr(vision, "leer", sin_texto)
    r = cliente.post("/vision/leer", files={"imagen": ("t.png", PNG_FALSO)}, headers=auth)
    assert r.status_code == 200
    assert r.json()["errores"] == [{"codigo": "SIN_TEXTO", "mensaje": "No encontramos texto en la foto."}]
    assert r.json()["palabras"] == []


def test_leer_simulado_lo_marca(cliente, auth, monkeypatch, texto_ticket):
    monkeypatch.setenv("VISION_SIMULADA", "1")
    r = cliente.post("/vision/leer", files={"imagen": ("t.png", PNG_FALSO)}, headers=auth)
    assert r.json()["simulado"] is True
    assert r.json()["texto"] == texto_ticket.rstrip("\n")

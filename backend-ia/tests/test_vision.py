"""vision_pipeline.py + vision_tao.py: imagen -> texto con OCDNet + OCRNet (modelos del equipo).

Las pruebas de piezas (CTC, renglones, cajas) no necesitan pesos. La prueba de punta a punta usa los
pesos reales de modelos/ y se salta si no están (pesan ~400 MB y no van en git). La imagen de esa
prueba se dibuja aquí con OpenCV: es SINTÉTICA y no salió del generador de entrenamiento.
"""
import os
from pathlib import Path

import numpy as np
import pytest

import vision_pipeline as vision

cv2 = pytest.importorskip("cv2")
vt = pytest.importorskip("vision_tao")

RAIZ = Path(__file__).resolve().parents[2]
PESOS = next((c for c in (RAIZ / "backend-ia" / "modelos", RAIZ / "modelos") if (c / "model_best.pth").exists()), None)


@pytest.fixture(autouse=True)
def lector_limpio(monkeypatch):
    """Cada prueba empieza sin lector cargado (vision_pipeline lo guarda en el módulo)."""
    monkeypatch.setattr(vision, "_lector", None)
    monkeypatch.setattr(vision, "_error", None)


# ---------- modo sin pesos / simulado ----------
def test_sin_pesos_avisa_que_no_hay_ocr(monkeypatch, tmp_path):
    monkeypatch.delenv("VISION_SIMULADA", raising=False)
    monkeypatch.setenv("VISION_MODELOS", str(tmp_path))
    with pytest.raises(vision.OCRNoDisponible, match="no está conectado"):
        vision.extraer_texto(b"\x89PNG...")
    e = vision.estado()
    assert e["simulado"] is False and e["conectado"] is False
    assert "pesos" in e["error"]


def test_vision_simulada_devuelve_el_ticket_de_ejemplo(monkeypatch, texto_ticket):
    monkeypatch.setenv("VISION_SIMULADA", "1")
    assert vision.simulada() is True
    assert vision.extraer_texto(b"cualquier cosa") == texto_ticket.rstrip("\n")
    assert vision.leer(b"x")["simulado"] is True


@pytest.mark.parametrize("valor", ["0", "true", "si", ""])
def test_solo_el_valor_1_activa_la_simulacion(monkeypatch, valor):
    monkeypatch.setenv("VISION_SIMULADA", valor)
    assert vision.simulada() is False


# ---------- piezas de vision_tao ----------
def test_ctc_quita_blancos_y_repetidos():
    alfabeto = list("0123456789abcdefghijklmnopqrstuvwxyz$.,:/#%*()&+'-")
    t = alfabeto.index("t") + 1
    o = alfabeto.index("o") + 1
    # "t t _ o _ o" -> "too": repetidos seguidos se juntan; un blanco (0) separa letras iguales
    ids = np.array([t, t, 0, o, 0, o, 0, 0])
    texto, conf = vt.decodificar_ctc(ids, np.full(8, 0.9, dtype=np.float32), alfabeto)
    assert texto == "too"
    assert conf == pytest.approx(0.9 ** 8, rel=1e-5)


def _palabra(texto, x0, y0, x1, y1):
    q = np.array([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], dtype=np.float64)
    return {"texto": texto, "_q": q, "_alto": float(y1 - y0)}


def test_importe_a_la_derecha_un_poco_mas_arriba_queda_con_su_etiqueta():
    """Caso visto en tickets: el importe alineado a la derecha sale ~1/3 de renglón más arriba."""
    palabras = [
        _palabra("$4331.00", 650, 722, 777, 761), _palabra("SUB-TOTAL", 56, 737, 194, 770),
        _palabra("$692.96", 666, 759, 777, 794), _palabra("IVA", 55, 773, 112, 808),
        _palabra("16%", 114, 772, 169, 805), _palabra("$5023.96", 596, 796, 781, 843),
        _palabra("TOTAL:", 55, 806, 198, 857),
    ]
    filas = [[p["texto"] for p in f] for f in vt.agrupar_renglones(palabras)]
    assert filas == [["SUB-TOTAL", "$4331.00"], ["IVA", "16%", "$692.96"], ["TOTAL:", "$5023.96"]]
    segs = [[p["texto"] for p in s] for s in vt.partir_segmentos(vt.agrupar_renglones(palabras)[1])]
    assert segs == [["IVA", "16%"], ["$692.96"]]


def test_unclip_agranda_el_rectangulo_lo_mismo_por_cada_lado():
    (_, _), (w, h), _ = vt._unclip(((50, 10), (100, 20), 0), 1.5)
    d = 100 * 20 * 1.5 / (2 * 120)  # área * ratio / perímetro
    assert (w, h) == pytest.approx((100 + 2 * d, 20 + 2 * d))


def test_cajas_desde_mapa_escala_a_la_foto_original():
    prob = np.zeros((100, 200), dtype=np.float32)
    prob[40:60, 20:120] = 0.9  # una "palabra" de 100 x 20 en el mapa
    cajas = vt.cajas_desde_mapa(prob, ancho=400, alto=200)  # foto al doble
    assert len(cajas) == 1
    caja, puntaje = cajas[0]
    assert puntaje == pytest.approx(0.9, abs=0.01)
    assert caja[:, 0].min() < 40 and caja[:, 0].max() > 240  # x escalado x2 y expandido por unclip


def test_mapa_vacio_no_da_cajas():
    assert vt.cajas_desde_mapa(np.zeros((64, 64), dtype=np.float32), 64, 64) == []


# ---------- punta a punta con los pesos del equipo ----------
def _ticket_dibujado() -> bytes:
    lineas = ["ABARROTES LA ESPERANZA", "SUBTOTAL          $72.84", "IVA 16%           $11.66",
              "TOTAL             $84.50", "EFECTIVO          $100.00", "GRACIAS POR SU COMPRA"]
    img = np.full((60 * len(lineas) + 80, 900, 3), 245, np.uint8)
    for i, l in enumerate(lineas):
        cv2.putText(img, l, (40, 70 + 60 * i), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (30, 30, 30), 2, cv2.LINE_AA)
    ok, buf = cv2.imencode(".jpg", cv2.GaussianBlur(img, (3, 3), 0))
    return buf.tobytes()


@pytest.mark.skipif(PESOS is None, reason="sin pesos de visión en modelos/")
def test_lee_un_ticket_con_los_modelos_entrenados(monkeypatch):
    monkeypatch.delenv("VISION_SIMULADA", raising=False)
    monkeypatch.setenv("VISION_MODELOS", str(PESOS))
    r = vision.leer(_ticket_dibujado())
    assert r["simulado"] is False
    assert "TOTAL  $84.50" in r["texto"].splitlines()
    assert any(l.startswith("[") and " | [" in l for l in r["texto_para_llm"].splitlines())
    for p in r["palabras"]:
        assert len(p["poligono"]) == 4 and 0 <= p["conf_caja"] <= 1 and 0 <= p["conf_ocr"] <= 1
    # Acreditación: los pesos en uso son los de SHA256SUMS
    assert {m["archivo"] for m in r["modelos"]} == {"model_best.pth", "ocrnet.onnx", "character_list"}
    assert all(m["verificado"] for m in r["modelos"])


@pytest.mark.skipif(PESOS is None, reason="sin pesos de visión en modelos/")
def test_imagen_que_no_es_foto_da_imagen_invalida(monkeypatch):
    monkeypatch.delenv("VISION_SIMULADA", raising=False)
    monkeypatch.setenv("VISION_MODELOS", str(PESOS))
    with pytest.raises(vision.ImagenIlegible) as e:
        vision.leer(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)
    assert e.value.codigo == "IMAGEN_INVALIDA"


@pytest.mark.skipif(PESOS is None, reason="sin pesos de visión en modelos/")
def test_hoja_en_blanco_da_sin_texto(monkeypatch):
    monkeypatch.delenv("VISION_SIMULADA", raising=False)
    monkeypatch.setenv("VISION_MODELOS", str(PESOS))
    ok, buf = cv2.imencode(".png", np.full((800, 600, 3), 250, np.uint8))
    with pytest.raises(vision.ImagenIlegible) as e:
        vision.leer(buf.tobytes())
    assert e.value.codigo == "SIN_TEXTO"

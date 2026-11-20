"""llm_service.Asistente: entrada, modo simulado y flujo de generación (con modelo falso)."""
import json

import pytest

import llm_service
from falsos import conectar
from llm_service import Asistente, EntradaInvalida, ErrorLectura


@pytest.fixture
def asistente():
    return Asistente()  # LLM_SIMULADO=1 viene de conftest


def test_prompt_de_servicio_igual_al_del_entrenamiento(ejemplos_test):
    """Si prompt_lector.txt se desvía del dataset, el modelo ajustado responde peor."""
    assert all(ej["messages"][0]["content"] == llm_service.PROMPT for ej in ejemplos_test)


@pytest.mark.parametrize("texto", ["", "   ", "\n\n", None])
def test_texto_vacio(asistente, texto):
    with pytest.raises(EntradaInvalida, match="No llegó texto"):
        asistente.leer(texto)


def test_texto_demasiado_largo(asistente):
    with pytest.raises(EntradaInvalida, match="demasiado largo"):
        asistente.leer("x" * (llm_service.MAX_TEXTO + 1))


def test_texto_en_el_limite_se_acepta(asistente):
    assert asistente.leer("x" * llm_service.MAX_TEXTO)["simulado"] is True


def test_modo_simulado_marca_simulado_y_no_carga_modelo(asistente, texto_ticket):
    asistente.cargar()
    assert asistente.cargado is False
    r = asistente.leer(texto_ticket)
    assert r["simulado"] is True
    assert "SIMULADO" in r["adaptador"]
    assert list(r["cfdi"]) == llm_service.CLAVES


def test_salida_simulada_coincide_con_la_etiqueta_de_test_00000(asistente, texto_ticket, respuesta_referencia):
    """La salida fija del modo simulado es la real del adaptador 'prueba' para test-00000."""
    assert asistente.leer(texto_ticket)["cfdi"] == json.loads(respuesta_referencia)


def test_modo_simulado_devuelve_copia(asistente, texto_ticket):
    r = asistente.leer(texto_ticket)
    r["cfdi"]["Emisor"]["Nombre"] = "CAMBIADO"
    assert llm_service.SALIDA_SIMULADA["Emisor"]["Nombre"] == "TLAPALERIA EL SOL"


def test_sin_modelo_cargado_avisa(asistente, texto_ticket):
    asistente.simulado = False
    with pytest.raises(ErrorLectura, match="todavía no está listo"):
        asistente.leer(texto_ticket)


def test_estado(asistente):
    e = asistente.estado()
    assert e["simulado"] is True and e["cargado"] is False
    assert e["modelo_base"] == "Qwen/Qwen2.5-7B-Instruct"


def test_mensajes_al_modelo_tienen_el_formato_del_dataset(asistente, ejemplos_test, texto_ticket,
                                                         respuesta_referencia):
    conectar(asistente, respuesta_referencia)
    asistente.leer(texto_ticket)
    assert asistente.tok.mensajes == ejemplos_test[0]["messages"][:2]


def test_respuesta_valida_del_modelo(asistente, texto_ticket, respuesta_referencia):
    conectar(asistente, respuesta_referencia)
    r = asistente.leer(texto_ticket)
    assert r["simulado"] is False
    assert r["adaptador"] == "adaptador-falso"
    assert r["cfdi"] == json.loads(respuesta_referencia)
    assert isinstance(r["segundos"], float)
    assert asistente.modelo.llamadas == 1


def test_respuesta_invalida_del_modelo_no_se_arregla(asistente, texto_ticket):
    conectar(asistente, "Claro, el total es 3156")
    with pytest.raises(ErrorLectura, match="JSON válido"):
        asistente.leer(texto_ticket)


@pytest.mark.parametrize("variable,valor,esperado", [("LLM_SIMULADO", "0", False), ("ADAPTADOR", "", None)])
def test_variables_de_entorno(monkeypatch, variable, valor, esperado):
    monkeypatch.setenv(variable, valor)
    a = Asistente()
    assert (a.simulado if variable == "LLM_SIMULADO" else a.adaptador) == esperado

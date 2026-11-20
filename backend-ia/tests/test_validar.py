"""llm_service.validar: revisa la forma del JSON que devuelve el modelo, sin corregir valores."""
import json

import pytest

from llm_service import CLAVES, ErrorLectura, validar


def test_las_200_etiquetas_del_dataset_de_prueba_pasan_la_validacion(ejemplos_test):
    """Contrato = dataset: toda respuesta de referencia de test.jsonl debe aceptarse tal cual."""
    assert len(ejemplos_test) == 200
    for ej in ejemplos_test:
        referencia = json.loads(ej["messages"][2]["content"])
        assert validar(ej["messages"][2]["content"]) == referencia, ej["id"]


def test_respeta_el_orden_de_claves_del_contrato(respuesta_referencia):
    assert list(validar(respuesta_referencia)) == CLAVES


def test_no_modifica_valores(respuesta_referencia):
    d = validar(respuesta_referencia)
    assert d["Total"] == "3156.00"
    assert d["SubTotal"] == "2720.69"
    assert d["FormaPago"] == "AUTO"  # no convierte "TARJETA DEBITO" a clave SAT
    assert d["FormaPagoLeida"] == "TARJETA DEBITO"


def test_acepta_bloque_de_codigo_markdown(respuesta_referencia):
    envuelto = f"```json\n{respuesta_referencia}\n```"
    assert validar(envuelto) == json.loads(respuesta_referencia)


def test_descarta_claves_extra(respuesta_referencia):
    d = json.loads(respuesta_referencia)
    d["Inventado"] = "x"
    assert "Inventado" not in validar(json.dumps(d))


@pytest.mark.parametrize("texto", ["", "hola", "{\"Total\": ", "Aquí está tu JSON: {}"])
def test_texto_que_no_es_json(texto):
    with pytest.raises(ErrorLectura, match="JSON válido"):
        validar(texto)


@pytest.mark.parametrize("texto", ["[]", "\"AUTO\"", "42", "null"])
def test_json_que_no_es_objeto(texto):
    with pytest.raises(ErrorLectura, match="objeto JSON"):
        validar(texto)


def test_faltan_claves_se_nombran(respuesta_referencia):
    d = json.loads(respuesta_referencia)
    del d["Total"], d["Emisor"]
    with pytest.raises(ErrorLectura, match="Total, Emisor"):
        validar(json.dumps(d))


@pytest.mark.parametrize("clave,valor", [("Emisor", "AUTO"), ("Receptor", []),
                                         ("Conceptos", {}), ("Impuestos", "AUTO")])
def test_tipos_incorrectos(respuesta_referencia, clave, valor):
    d = json.loads(respuesta_referencia)
    d[clave] = valor
    with pytest.raises(ErrorLectura, match="tipo inesperado"):
        validar(json.dumps(d))

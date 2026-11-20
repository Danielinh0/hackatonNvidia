"""Tokenizador y modelo FALSOS para probar Asistente.leer sin GPU ni pesos.

No imitan a Qwen: solo cumplen la interfaz que usa llm_service (apply_chat_template,
generate, decode, torch.no_grad) y devuelven el texto que la prueba indique.
"""
import contextlib


class _Forma:
    def __init__(self, n):
        self.shape = (1, n)


class _Entrada(dict):
    def to(self, _dispositivo):
        return self


class FakeTokenizer:
    def __init__(self):
        self.mensajes = None

    def apply_chat_template(self, msgs, **_kw):
        self.mensajes = msgs
        return _Entrada(input_ids=_Forma(3))

    def decode(self, ids, skip_special_tokens=True):
        return ids  # FakeModelo ya entrega el texto como "ids"


class FakeModelo:
    def __init__(self, respuesta: str):
        self.respuesta = respuesta
        self.llamadas = 0

    def generate(self, **_kw):
        self.llamadas += 1
        return [_Salida(self.respuesta)]  # out[0][n_prompt:] -> texto que recibe decode


class _Salida:
    def __init__(self, texto):
        self.texto = texto

    def __getitem__(self, corte):
        return self.texto  # el corte del prompt no aplica al texto falso


class FakeTorch:
    @staticmethod
    def no_grad():
        return contextlib.nullcontext()


def conectar(asistente, respuesta: str):
    """Deja un Asistente como si hubiera cargado el modelo, con respuestas fijas."""
    asistente.simulado = False
    asistente.cargado = True
    asistente.tok = FakeTokenizer()
    asistente.modelo = FakeModelo(respuesta)
    asistente.torch = FakeTorch()
    asistente.adaptador = "adaptador-falso"
    return asistente

"""Asistente de Dzuun: texto OCR -> JSON CFDI con Qwen2.5-7B-Instruct + adaptador LoRA del equipo.

Variables de entorno:
    ADAPTADOR      carpeta del adaptador entrenado (p. ej. ../training/asistente/adapters/epoca1).
                   Vacía = modelo base sin ajuste (solo para comparar; no usar en la demo).
    MODELO_BASE    por defecto Qwen/Qwen2.5-7B-Instruct
    LLM_SIMULADO   "1" = no carga el modelo; responde una salida fija (ver SALIDA_SIMULADA) marcada SIMULADO.
                   Sirve para conectar la app sin GPU. Nunca usar en la demo.

El LLM solo copia y ordena lo que el OCR leyó; no calcula ni convierte a claves SAT
(CLAUDE.md sec. 0). Lo que devuelve se valida aquí y luego la persona lo revisa en la app.
"""
import json
import os
import threading
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
# Prompt de sistema idéntico al del entrenamiento (copiado de training/asistente/dataset/test.jsonl).
PROMPT = open(os.path.join(AQUI, "prompt_lector.txt"), encoding="utf-8").read().rstrip("\n")
DATASET_TEST = os.path.join(AQUI, "..", "training", "asistente", "dataset", "test.jsonl")

# Claves de primer nivel del contrato (CLAUDE.md sec. 16), iguales en los 2000 ejemplos del dataset.
CLAVES = ["Version", "Serie", "Folio", "Fecha", "FormaPago", "FormaPagoLeida", "MetodoPago", "Moneda",
          "TipoDeComprobante", "Exportacion", "LugarExpedicion", "SubTotal", "Total", "Emisor",
          "Receptor", "Conceptos", "Impuestos", "Complemento"]
MAX_TEXTO = 8000  # caracteres; el ejemplo más largo del dataset tiene ~4000

# Salida REAL del adaptador "prueba" (20 pasos) para test-00000, copiada de la terminal del
# servidor DLI el 20-nov-2026 (ver training/asistente/README.md sec. 7). En modo simulado se
# devuelve siempre esta misma, sin importar el texto, y se marca simulado=True.
SALIDA_SIMULADA = {
    "Version": "AUTO", "Serie": "AUTO", "Folio": "14199", "Fecha": "2026-07-02T08:42:47",
    "FormaPago": "AUTO", "FormaPagoLeida": "TARJETA DEBITO", "MetodoPago": "AUTO", "Moneda": "MXN",
    "TipoDeComprobante": "AUTO", "Exportacion": "AUTO", "LugarExpedicion": "AUTO",
    "SubTotal": "2720.69", "Total": "3156.00",
    "Emisor": {"Rfc": "AUTO", "Nombre": "TLAPALERIA EL SOL", "RegimenFiscal": "AUTO"},
    "Receptor": {"Rfc": "AUTO", "Nombre": "AUTO", "DomicilioFiscalReceptor": "AUTO",
                 "RegimenFiscalReceptor": "AUTO", "UsoCFDI": "AUTO"},
    "Conceptos": [],
    "Impuestos": {"TotalImpuestosTrasladados": "435.31"},
    "Complemento": {"TimbreFiscalDigital": {"UUID": "AUTO"}},
}


class ErrorLectura(Exception):
    """El modelo respondió algo que no cumple el contrato. El mensaje se puede mostrar a la persona."""


class EntradaInvalida(Exception):
    """El texto recibido no se puede mandar al modelo."""


def validar(texto: str) -> dict:
    """Convierte la respuesta del modelo en dict y revisa la forma. No corrige ni inventa valores."""
    t = texto.strip()
    if t.startswith("```"):  # por si el modelo envuelve en bloque de código
        t = t.strip("`").removeprefix("json").strip()
    try:
        d = json.loads(t)
    except json.JSONDecodeError:
        raise ErrorLectura("El asistente no devolvió un JSON válido.")
    if not isinstance(d, dict):
        raise ErrorLectura("El asistente no devolvió un objeto JSON.")
    faltan = [k for k in CLAVES if k not in d]
    if faltan:
        raise ErrorLectura(f"La respuesta del asistente no tiene la forma esperada (faltan: {', '.join(faltan)}).")
    if not isinstance(d["Emisor"], dict) or not isinstance(d["Receptor"], dict) \
            or not isinstance(d["Conceptos"], list) or not isinstance(d["Impuestos"], dict):
        raise ErrorLectura("La respuesta del asistente tiene campos con un tipo inesperado.")
    return {k: d[k] for k in CLAVES}  # solo las claves del contrato, en orden


class Asistente:
    def __init__(self):
        self.simulado = os.environ.get("LLM_SIMULADO") == "1"
        self.base = os.environ.get("MODELO_BASE", "Qwen/Qwen2.5-7B-Instruct")
        self.adaptador = os.environ.get("ADAPTADOR") or None
        self.cargado = False
        self.gpu = None
        self._candado = threading.Lock()  # una sola GPU: una generación a la vez

    def estado(self) -> dict:
        return {"simulado": self.simulado, "modelo_base": self.base, "adaptador": self.adaptador,
                "cargado": self.cargado, "gpu": self.gpu}

    def cargar(self):
        if self.simulado:
            print("⚠ LLM_SIMULADO=1: el asistente NO se carga; respuestas fijas marcadas SIMULADO.")
            return
        self._revisar_prompt()
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

        if not torch.cuda.is_available():
            raise RuntimeError("PyTorch no ve la GPU. Para probar sin GPU usa LLM_SIMULADO=1.")
        if self.adaptador and not os.path.isfile(os.path.join(self.adaptador, "adapter_config.json")):
            raise RuntimeError(f"No encuentro {self.adaptador}/adapter_config.json")
        print(f"Cargando {self.base}" + (f" + {self.adaptador}" if self.adaptador else " (SIN adaptador)") + " ...")
        self.torch = torch
        self.tok = AutoTokenizer.from_pretrained(self.base)
        q = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
        m = AutoModelForCausalLM.from_pretrained(self.base, quantization_config=q, device_map={"": 0})
        if self.adaptador:
            from peft import PeftModel
            m = PeftModel.from_pretrained(m, self.adaptador)
        m.eval()
        self.modelo = m
        self.cargado = True
        self.gpu = torch.cuda.get_device_name(0)
        print(f"Asistente listo en {self.gpu} · memoria {torch.cuda.memory_allocated() / 2**30:.2f} GB")

    def _revisar_prompt(self):
        """Avisa si el prompt de prompt_lector.txt ya no coincide con el del dataset de entrenamiento."""
        if os.path.isfile(DATASET_TEST):
            with open(DATASET_TEST, encoding="utf-8") as f:
                if json.loads(f.readline())["messages"][0]["content"] != PROMPT:
                    print("⚠ prompt_lector.txt es distinto al prompt del dataset: el modelo puede responder peor.")

    def leer(self, texto_ocr: str) -> dict:
        """Devuelve {"cfdi", "simulado", "adaptador", "segundos"}. Lanza EntradaInvalida o ErrorLectura."""
        texto_ocr = (texto_ocr or "").strip()
        if not texto_ocr:
            raise EntradaInvalida("No llegó texto para leer.")
        if len(texto_ocr) > MAX_TEXTO:
            raise EntradaInvalida("El texto es demasiado largo para un solo comprobante.")
        if self.simulado:
            return {"cfdi": json.loads(json.dumps(SALIDA_SIMULADA)), "simulado": True,
                    "adaptador": "SIMULADO (salida fija del adaptador prueba)", "segundos": 0.0}
        if not self.cargado:
            raise ErrorLectura("El asistente todavía no está listo.")

        msgs = [{"role": "system", "content": PROMPT},
                {"role": "user", "content": f"Texto OCR:\n-----\n{texto_ocr}"}]  # mismo formato que el dataset
        t0 = time.time()
        with self._candado:
            ent = self.tok.apply_chat_template(msgs, add_generation_prompt=True,
                                               return_tensors="pt", return_dict=True).to(0)
            with self.torch.no_grad():
                out = self.modelo.generate(**ent, max_new_tokens=1200, do_sample=False,
                                           temperature=None, top_p=None, top_k=None)
        respuesta = self.tok.decode(out[0][ent["input_ids"].shape[1]:], skip_special_tokens=True)
        segundos = round(time.time() - t0, 2)
        try:
            cfdi = validar(respuesta)
        except ErrorLectura:
            print(f"Respuesta inválida del modelo ({segundos} s):\n{respuesta[:500]}")
            raise
        return {"cfdi": cfdi, "simulado": False, "adaptador": self.adaptador, "segundos": segundos}

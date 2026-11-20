"""Corre el asistente: texto OCR -> JSON CFDI, con el adaptador entrenado.

Uso:
    python leer.py adapters/prueba ejemplos/ticket_ejemplo.txt   # uno o varios archivos .txt
    python leer.py adapters/prueba                               # modo interactivo
    python leer.py base ejemplos/ticket_ejemplo.txt              # modelo base, sin ajuste (para comparar)

Modo interactivo: pega el texto del ticket, escribe FIN en una línea sola y Enter.
Ctrl+D (Ctrl+Z en Windows) para salir. El modelo se carga una sola vez (~1 min).

El prompt de sistema se toma de dataset/test.jsonl para que sea idéntico al del entrenamiento.
"""
import json, os, sys, time
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

BASE = "Qwen/Qwen2.5-7B-Instruct"
AQUI = os.path.dirname(os.path.abspath(__file__))

if len(sys.argv) < 2:
    sys.exit(__doc__)
adaptador = None if sys.argv[1] == "base" else sys.argv[1]
archivos = sys.argv[2:]
if adaptador and not os.path.isfile(os.path.join(adaptador, "adapter_config.json")):
    sys.exit(f"No encuentro {adaptador}/adapter_config.json. ¿Descomprimiste el .tgz dentro de training/asistente?")
if not torch.cuda.is_available():
    sys.exit("PyTorch no ve la GPU. Revisa: python -c \"import torch; print(torch.cuda.is_available())\"")

with open(os.path.join(AQUI, "dataset", "test.jsonl"), encoding="utf-8") as f:
    SISTEMA = json.loads(f.readline())["messages"][0]["content"]

print(f"Cargando {BASE}" + (f" + {adaptador}" if adaptador else " (sin adaptador)") + " ...")
tok = AutoTokenizer.from_pretrained(BASE)
gpu_gb = torch.cuda.get_device_properties(0).total_memory / 2**30
if gpu_gb >= 10:
    # Servidor (T4 15 GB): todo en la GPU, igual que en el entrenamiento.
    q = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
    mapa = {"": 0}
else:
    # GPU chica (p. ej. RTX 4050 laptop, 6 GB): el 7B en NF4 no cabe completo.
    # - double quant comprime también las escalas de NF4 (~0.4 GB menos).
    # - embed_tokens (~1 GB, no se cuantiza) va a la RAM: solo es una búsqueda por token, casi no frena.
    # Solo cambia dónde vive cada parte del modelo; el adaptador entrenado es el mismo.
    print(f"GPU de {gpu_gb:.1f} GB: modo memoria baja (double quant + embeddings en CPU).")
    q = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16,
                           bnb_4bit_use_double_quant=True, llm_int8_enable_fp32_cpu_offload=True)
    mapa = {"model.embed_tokens": "cpu", "model.layers": 0, "model.norm": 0, "model.rotary_emb": 0, "lm_head": 0}
m = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=q, device_map=mapa, torch_dtype=torch.float16)
if gpu_gb < 10:
    # accelerate deja embed_tokens "descargado" (pesos en meta, se suben a la GPU en cada paso).
    # Se quita ese gancho y se pone una copia real en RAM que devuelve el resultado en la GPU.
    from accelerate.hooks import remove_hook_from_module
    from huggingface_hub import hf_hub_download
    from safetensors import safe_open

    class EmbeddingEnCPU(torch.nn.Module):
        def __init__(self, peso):
            super().__init__()
            self.peso = peso  # tensor normal (no Parameter) para que no lo muevan

        def forward(self, ids):
            return torch.nn.functional.embedding(ids.cpu(), self.peso).to(0)

    clave = "model.embed_tokens.weight"
    indice = json.load(open(hf_hub_download(BASE, "model.safetensors.index.json")))
    with safe_open(hf_hub_download(BASE, indice["weight_map"][clave]), framework="pt") as f:
        peso = f.get_tensor(clave).to(torch.float16)
    remove_hook_from_module(m.model.embed_tokens)
    m.model.embed_tokens = EmbeddingEnCPU(peso)
    m.model.rotary_emb.to(0)  # su buffer inv_freq se queda en CPU con este mapa
    # Si el mapa dice "cpu", PeftModel vuelve a repartir el modelo (dispatch_model) y lo deja todo en CPU.
    m.hf_device_map = {"": 0}
if adaptador:
    m = PeftModel.from_pretrained(m, adaptador)
m.eval()
print(f"Listo. GPU: {torch.cuda.get_device_name(0)} · memoria usada: {torch.cuda.memory_allocated() / 2**30:.2f} GB")


def leer(texto_ocr):
    msgs = [{"role": "system", "content": SISTEMA},
            {"role": "user", "content": f"Texto OCR:\n-----\n{texto_ocr.strip()}"}]
    ent = tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt", return_dict=True).to(0)
    t0 = time.time()
    with torch.no_grad():
        out = m.generate(**ent, max_new_tokens=1200, do_sample=False, temperature=None, top_p=None, top_k=None)
    texto = tok.decode(out[0][ent["input_ids"].shape[1]:], skip_special_tokens=True)
    try:
        print(json.dumps(json.loads(texto), ensure_ascii=False, indent=2))
    except json.JSONDecodeError:
        print("⚠ El modelo no devolvió un JSON válido. Respuesta tal cual:\n" + texto)
    print(f"({time.time() - t0:.1f} s · memoria máx.: {torch.cuda.max_memory_allocated() / 2**30:.2f} GB)\n")


if archivos:
    for a in archivos:
        print(f"=== {a}")
        with open(a, encoding="utf-8") as f:
            leer(f.read())
else:
    print("Pega el texto del ticket y escribe FIN en una línea sola. Ctrl+D para salir.")
    lineas = []
    try:
        while True:
            l = input()
            if l.strip() == "FIN":
                if lineas:
                    leer("\n".join(lineas))
                lineas = []
                print("Siguiente ticket (o Ctrl+D para salir):")
            else:
                lineas.append(l)
    except (EOFError, KeyboardInterrupt):
        print("\nAdiós.")

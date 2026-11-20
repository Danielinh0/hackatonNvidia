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
q = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
m = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=q, device_map={"": 0})
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

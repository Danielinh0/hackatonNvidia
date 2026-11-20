"""Prueba rápida del asistente: texto OCR -> JSON CFDI, con o sin adaptador.

Uso:
    python probar.py                     # modelo base (sin ajuste)
    python probar.py adapters/prueba     # base + adaptador LoRA
    python probar.py adapters/prueba 10  # primeros 10 casos de dataset/test.jsonl

Guarda cada corrida en logs/probar/<adaptador|base>_<fecha>.jsonl (registro real, no se edita a mano).
Esto es una prueba de humo, no la evaluación final (esa va en test_10_casos.py).
"""
import json, os, sys, time, datetime
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

BASE = "Qwen/Qwen2.5-7B-Instruct"
AQUI = os.path.dirname(os.path.abspath(__file__))
adaptador = sys.argv[1] if len(sys.argv) > 1 else None
n = int(sys.argv[2]) if len(sys.argv) > 2 else 3

tok = AutoTokenizer.from_pretrained(BASE)
q = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
m = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=q, device_map={"": 0})
if adaptador:
    m = PeftModel.from_pretrained(m, adaptador)
m.eval()

etiqueta = os.path.basename(os.path.normpath(adaptador)) if adaptador else "base"
os.makedirs(os.path.join(AQUI, "logs", "probar"), exist_ok=True)
salida = os.path.join(AQUI, "logs", "probar", f"{etiqueta}_{datetime.datetime.now():%Y%m%d_%H%M%S}.jsonl")

casos = [json.loads(l) for l in open(os.path.join(AQUI, "dataset", "test.jsonl"), encoding="utf-8")][:n]
with open(salida, "w", encoding="utf-8") as f:
    for c in casos:
        msgs = c["messages"][:-1]
        esperado = json.loads(c["messages"][-1]["content"])
        ent = tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt", return_dict=True).to(0)
        t0 = time.time()
        with torch.no_grad():
            out = m.generate(**ent, max_new_tokens=1200, do_sample=False, temperature=None, top_p=None, top_k=None)
        seg = time.time() - t0
        nuevos = out[0][ent["input_ids"].shape[1]:]
        texto = tok.decode(nuevos, skip_special_tokens=True)
        try:
            ok = json.loads(texto) == esperado
        except Exception:
            ok = "JSON inválido"
        print(f"\n=== {c['id']}  ¿igual al esperado? {ok}  ({seg:.1f} s, {len(nuevos)} tokens)\n{texto[:800]}")
        f.write(json.dumps({"id": c["id"], "modelo": BASE, "adaptador": adaptador, "igual": ok,
                            "segundos": round(seg, 2), "tokens": len(nuevos), "salida": texto},
                           ensure_ascii=False) + "\n")

print(f"\nGPU: {torch.cuda.get_device_name(0)} · memoria máx. usada: {torch.cuda.max_memory_allocated() / 2**30:.2f} GB")
print(f"Registro en {salida}")

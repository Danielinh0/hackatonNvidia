"""Ajuste QLoRA del asistente de Dzuun (CLAUDE.md sec. 17).

Pensado para la Tesla T4 del servidor DLI: fp16 (la T4 no tiene bf16),
modelo base cargado en 4 bits NF4 y gradient checkpointing para que quepa en 15 GB.

Uso dentro del contenedor NGC (ver correr_en_servidor.sh):
    # 1) Prueba corta: mide cuánto tarda cada paso (no sirve como modelo final)
    python3 train_qlora.py --max-pasos 20 --nombre prueba
    # 2) Entrenamiento completo
    python3 train_qlora.py --epocas 2 --nombre qwen7b-v1

Qué hace, en orden:
  1. Lee dataset/{train,val}.jsonl (formato chat: system / user / assistant).
  2. Convierte cada ejemplo con la plantilla de chat de Qwen y enmascara
     todo menos la respuesta del asistente (solo se aprende a responder).
  3. Carga Qwen en 4 bits y le pega adaptadores LoRA.
  4. Entrena, evalúa con val y guarda el adaptador + un registro de la corrida
     (fecha, duración, GPU, pasos, pérdidas) en logs/. Todos los números del
     registro salen de la ejecución real.
"""

import argparse
import json
import os
import platform
import time
from datetime import datetime, timezone

import torch
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    Trainer,
    TrainingArguments,
)

AQUI = os.path.dirname(os.path.abspath(__file__))
IGNORAR = -100  # etiqueta que la pérdida no toma en cuenta


def argumentos():
    p = argparse.ArgumentParser()
    p.add_argument("--modelo", default="Qwen/Qwen2.5-7B-Instruct")
    p.add_argument("--nombre", required=True, help="nombre de la corrida (carpeta del adaptador y del log)")
    p.add_argument("--epocas", type=float, default=2)
    p.add_argument("--max-pasos", type=int, default=-1, help="si es > 0 corta ahí (para medir velocidad)")
    p.add_argument("--max-len", type=int, default=2048, help="tokens por ejemplo; los más largos se descartan")
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--rango", type=int, default=16)
    p.add_argument("--alpha", type=int, default=32)
    p.add_argument("--acumular", type=int, default=16, help="lote efectivo = 1 × acumular")
    p.add_argument("--semilla", type=int, default=2026)
    return p.parse_args()


def tokenizar(ejemplo, tok, max_len):
    """Devuelve input_ids y labels; labels = -100 en todo lo que no es la respuesta."""
    mensajes = ejemplo["messages"]
    assert mensajes[-1]["role"] == "assistant", ejemplo["id"]
    completo = tok.apply_chat_template(mensajes, tokenize=False)
    # Prefijo = conversación hasta el turno del asistente, con su encabezado.
    prefijo = tok.apply_chat_template(mensajes[:-1], tokenize=False, add_generation_prompt=True)
    assert completo.startswith(prefijo), "la plantilla de chat no es prefijo de sí misma"
    ids_prefijo = tok(prefijo, add_special_tokens=False)["input_ids"]
    ids = tok(completo, add_special_tokens=False)["input_ids"]
    labels = [IGNORAR] * len(ids_prefijo) + ids[len(ids_prefijo):]
    return {"input_ids": ids, "labels": labels, "largo": len(ids), "cabe": len(ids) <= max_len}


def juntar(lote, pad_id):
    """Rellena a la longitud del más largo del lote."""
    largo = max(len(x["input_ids"]) for x in lote)
    ids, labels, mascara = [], [], []
    for x in lote:
        falta = largo - len(x["input_ids"])
        ids.append(x["input_ids"] + [pad_id] * falta)
        labels.append(x["labels"] + [IGNORAR] * falta)
        mascara.append([1] * len(x["input_ids"]) + [0] * falta)
    return {
        "input_ids": torch.tensor(ids),
        "labels": torch.tensor(labels),
        "attention_mask": torch.tensor(mascara),
    }


def main():
    a = argumentos()
    torch.manual_seed(a.semilla)
    if not torch.cuda.is_available():
        raise SystemExit("No hay GPU visible. ¿Corriste el contenedor con --gpus all?")

    inicio = time.time()
    salida_adaptador = os.path.join(AQUI, "adapters", a.nombre)
    carpeta_logs = os.path.join(AQUI, "logs", a.nombre)
    os.makedirs(carpeta_logs, exist_ok=True)

    # ---- Datos ----
    tok = AutoTokenizer.from_pretrained(a.modelo)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    datos = load_dataset(
        "json",
        data_files={
            "train": os.path.join(AQUI, "dataset", "train.jsonl"),
            "val": os.path.join(AQUI, "dataset", "val.jsonl"),
        },
    )
    datos = datos.map(lambda e: tokenizar(e, tok, a.max_len), remove_columns=["messages", "meta"])
    estadisticas = {}
    for parte in ("train", "val"):
        largos = sorted(datos[parte]["largo"])
        descartados = sum(1 for x in datos[parte]["cabe"] if not x)
        estadisticas[parte] = {
            "ejemplos": len(largos),
            "descartados_por_largo": descartados,
            "tokens_mediana": largos[len(largos) // 2],
            "tokens_max": largos[-1],
            "tokens_total": sum(largos),
        }
        datos[parte] = datos[parte].filter(lambda e: e["cabe"])
    print("Datos:", json.dumps(estadisticas, indent=2))

    # ---- Modelo en 4 bits + LoRA ----
    cuantizacion = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.float16,  # T4: fp16
    )
    modelo = AutoModelForCausalLM.from_pretrained(
        a.modelo,
        quantization_config=cuantizacion,
        torch_dtype=torch.float16,
        device_map={"": 0},
        attn_implementation="sdpa",
    )
    modelo = prepare_model_for_kbit_training(modelo, use_gradient_checkpointing=True)
    lora = LoraConfig(
        r=a.rango,
        lora_alpha=a.alpha,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )
    modelo = get_peft_model(modelo, lora)
    entrenables, totales = modelo.get_nb_trainable_parameters()
    print(f"Parámetros entrenables: {entrenables:,} de {totales:,}")

    # ---- Entrenamiento ----
    config = TrainingArguments(
        output_dir=os.path.join(carpeta_logs, "checkpoints"),
        num_train_epochs=a.epocas,
        max_steps=a.max_pasos,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=a.acumular,
        learning_rate=a.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        fp16=True,
        optim="paged_adamw_8bit",
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        logging_steps=5,
        eval_strategy="steps" if a.max_pasos <= 0 else "no",
        eval_steps=25,
        save_strategy="steps",
        save_steps=25,
        save_total_limit=2,
        report_to="none",
        seed=a.semilla,
        dataloader_num_workers=2,
        remove_unused_columns=False,
    )
    entrenador = Trainer(
        model=modelo,
        args=config,
        train_dataset=datos["train"].remove_columns(["largo", "cabe"]),
        eval_dataset=datos["val"].remove_columns(["largo", "cabe"]),
        data_collator=lambda lote: juntar(lote, tok.pad_token_id),
    )
    resultado = entrenador.train()
    evaluacion = entrenador.evaluate() if a.max_pasos <= 0 else None

    # ---- Guardar adaptador y registro ----
    modelo.save_pretrained(salida_adaptador)
    tok.save_pretrained(salida_adaptador)

    import bitsandbytes, peft, transformers  # noqa: E401 (solo para registrar versiones)

    registro = {
        "corrida": a.nombre,
        "inicio_utc": datetime.fromtimestamp(inicio, timezone.utc).isoformat(),
        "fin_utc": datetime.now(timezone.utc).isoformat(),
        "duracion_s": round(time.time() - inicio, 1),
        "segundos_por_paso": round(resultado.metrics["train_runtime"] / max(resultado.global_step, 1), 2),
        "gpu": torch.cuda.get_device_name(0),
        "memoria_gpu_max_gb": round(torch.cuda.max_memory_allocated() / 1e9, 2),
        "modelo_base": a.modelo,
        "metodo": "QLoRA NF4 + doble cuantización, fp16",
        "hiperparametros": vars(a),
        "pasos": resultado.global_step,
        "metricas_entrenamiento": resultado.metrics,
        "metricas_val": evaluacion,
        "datos": estadisticas,
        "historial": entrenador.state.log_history,
        "versiones": {
            "python": platform.python_version(),
            "torch": torch.__version__,
            "cuda": torch.version.cuda,
            "transformers": transformers.__version__,
            "peft": peft.__version__,
            "bitsandbytes": bitsandbytes.__version__,
        },
        "adaptador": os.path.relpath(salida_adaptador, AQUI),
    }
    with open(os.path.join(carpeta_logs, "registro.json"), "w", encoding="utf-8") as f:
        json.dump(registro, f, ensure_ascii=False, indent=2)
    print(f"\nListo. Adaptador en {salida_adaptador}")
    print(f"Registro en {carpeta_logs}/registro.json")
    print(f"Segundos por paso: {registro['segundos_por_paso']}  ·  memoria GPU máx: {registro['memoria_gpu_max_gb']} GB")


if __name__ == "__main__":
    main()

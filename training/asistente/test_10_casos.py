"""Evaluación del asistente: modelo base vs. ajustado, mismos casos y mismas condiciones.

CLAUDE.md sec. 5 (bases sec. 13): >= 10 casos reservados, distintos de train/val, con
habituales, información incompleta, fuera de alcance y casos donde el modelo debe
reconocer una limitación. Aquí salen de dataset/test.jsonl (plantillas que el modelo
nunca vio en train/val), por categoría:

  habitual          ticket o CFDI con fecha y total impresos
  incompleto        ticket o CFDI sin fecha o sin total legible  -> debe poner "AUTO", no inventar
  fuera_de_alcance  texto que no es comprobante (plantilla N5)    -> todo "AUTO", Conceptos vacío
  limitacion        texto ilegible (plantilla X1)                 -> todo "AUTO", no adivinar

Uso (un modelo por corrida, para no cargar dos en la GPU):
    python test_10_casos.py base                       # modelo base, sin ajuste
    python test_10_casos.py adapters/epoca1            # base + adaptador
    python test_10_casos.py base --por-categoria 10    # más casos (40 en total)
    python test_10_casos.py --comparar logs/eval/base_*.jsonl logs/eval/epoca1_*.jsonl
         (sin GPU: arma logs/eval/comparacion.md con las métricas de ambos)

Configuración idéntica para los dos: mismo prompt de sistema (el del dataset), greedy
(do_sample=False), max_new_tokens=1200, NF4 + fp16. Los casos se eligen con semilla fija,
así que ambas corridas evalúan exactamente los mismos ids (se guardan en logs/eval/casos.json).

Todas las cifras salen de la ejecución; este script no escribe ni corrige resultados a mano.
"""
import argparse, datetime, json, os, random, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
CARPETA = os.path.join(AQUI, "logs", "eval")
BASE = "Qwen/Qwen2.5-7B-Instruct"
SEMILLA = 2026

# Campos que se califican uno por uno (ruta con puntos dentro del JSON).
CAMPOS = [
    "Folio", "Fecha", "SubTotal", "Total", "FormaPago", "FormaPagoLeida", "Moneda",
    "Emisor.Rfc", "Emisor.Nombre", "Impuestos.TotalImpuestosTrasladados",
    "Complemento.TimbreFiscalDigital.UUID",
]
# Claves de catálogo SAT: solo se valen si vienen impresas. Inventarlas es el error más grave.
CLAVES_SAT = ["FormaPago", "MetodoPago", "TipoDeComprobante", "Emisor.RegimenFiscal",
              "Receptor.RegimenFiscalReceptor", "Receptor.UsoCFDI"]
CLAVES_SAT_CONCEPTO = ["ClaveProdServ", "ClaveUnidad", "ObjetoImp"]
CATEGORIAS = ["habitual", "incompleto", "fuera_de_alcance", "limitacion"]
FALTA = object()  # la clave ni siquiera existe en la respuesta


def tomar(d, ruta):
    for parte in ruta.split("."):
        if not isinstance(d, dict) or parte not in d:
            return FALTA
        d = d[parte]
    return d


def vacio(v):
    return v is FALTA or v is None or (isinstance(v, str) and v.strip().upper() in ("", "AUTO"))


def norm(v):
    return v.strip() if isinstance(v, str) else json.dumps(v, ensure_ascii=False, sort_keys=True)


def categoria(caso):
    tipo = caso["meta"]["tipo"]
    if tipo == "no_comprobante":
        return "fuera_de_alcance"
    if tipo == "ilegible":
        return "limitacion"
    esp = json.loads(caso["messages"][-1]["content"])
    return "incompleto" if vacio(tomar(esp, "Total")) or vacio(tomar(esp, "Fecha")) else "habitual"


def elegir_casos(por_categoria):
    casos = [json.loads(l) for l in open(os.path.join(AQUI, "dataset", "test.jsonl"), encoding="utf-8")]
    grupos = {c: [] for c in CATEGORIAS}
    for c in casos:
        grupos[categoria(c)].append(c)
    rnd = random.Random(SEMILLA)
    elegidos = []
    for cat in CATEGORIAS:
        g = sorted(grupos[cat], key=lambda c: c["id"])
        if cat == "habitual":  # que haya tickets y CFDI
            tickets = [c for c in g if c["meta"]["tipo"] == "ticket"]
            cfdis = [c for c in g if c["meta"]["tipo"] == "cfdi"]
            n_cfdi = min(len(cfdis), max(1, por_categoria // 3))
            sel = rnd.sample(cfdis, n_cfdi) + rnd.sample(tickets, min(len(tickets), por_categoria - n_cfdi))
        else:
            sel = rnd.sample(g, min(len(g), por_categoria))
        for c in sorted(sel, key=lambda c: c["id"]):
            elegidos.append((cat, c))
    disponibles = {c: len(v) for c, v in grupos.items()}
    return elegidos, disponibles


def calificar(texto, esperado):
    r = {"json_valido": False, "mismo_esquema": False, "exacto": False, "campos_ok": 0,
         "campos_total": len(CAMPOS), "inventados": [], "omitidos": [], "claves_sat_inventadas": [],
         "conceptos_n_ok": False, "errores_campo": {}}
    try:
        pred = json.loads(texto)
    except json.JSONDecodeError:
        return r
    if not isinstance(pred, dict):
        return r
    r["json_valido"] = True
    r["mismo_esquema"] = set(pred.keys()) == set(esperado.keys())
    r["exacto"] = pred == esperado
    for campo in CAMPOS:
        e, p = tomar(esperado, campo), tomar(pred, campo)
        if (vacio(e) and vacio(p)) or (not vacio(e) and not vacio(p) and norm(e) == norm(p)):
            r["campos_ok"] += 1
        else:
            r["errores_campo"][campo] = {"esperado": None if e is FALTA else e,
                                         "obtenido": "(no existe)" if p is FALTA else p}
            if vacio(e) and not vacio(p):
                r["inventados"].append(campo)
            elif not vacio(e) and vacio(p):
                r["omitidos"].append(campo)
    for campo in CLAVES_SAT:
        if vacio(tomar(esperado, campo)) and not vacio(tomar(pred, campo)):
            r["claves_sat_inventadas"].append(campo)
    ce = esperado.get("Conceptos") or []
    cp = pred.get("Conceptos") if isinstance(pred.get("Conceptos"), list) else []
    r["conceptos_n_ok"] = len(ce) == len(cp)
    for i, conc in enumerate(cp):
        if not isinstance(conc, dict):
            continue
        orig = ce[i] if i < len(ce) and isinstance(ce[i], dict) else {}
        for k in CLAVES_SAT_CONCEPTO:
            if vacio(orig.get(k, FALTA)) and not vacio(conc.get(k, FALTA)):
                r["claves_sat_inventadas"].append(f"Conceptos[{i}].{k}")
    return r


def correr(modelo_arg, por_categoria):
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
    from peft import PeftModel

    adaptador = None if modelo_arg == "base" else modelo_arg
    if adaptador and not os.path.isfile(os.path.join(adaptador, "adapter_config.json")):
        sys.exit(f"No encuentro {adaptador}/adapter_config.json")
    elegidos, disponibles = elegir_casos(por_categoria)
    os.makedirs(CARPETA, exist_ok=True)
    with open(os.path.join(CARPETA, "casos.json"), "w", encoding="utf-8") as f:
        json.dump({"semilla": SEMILLA, "por_categoria": por_categoria, "disponibles_en_test": disponibles,
                   "casos": [{"id": c["id"], "categoria": cat, "tipo": c["meta"]["tipo"],
                              "plantilla": c["meta"]["plantilla"]} for cat, c in elegidos]},
                  f, ensure_ascii=False, indent=2)

    tok = AutoTokenizer.from_pretrained(BASE)
    q = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16)
    m = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=q, device_map={"": 0})
    if adaptador:
        m = PeftModel.from_pretrained(m, adaptador)
    m.eval()

    etiqueta = os.path.basename(os.path.normpath(adaptador)) if adaptador else "base"
    salida = os.path.join(CARPETA, f"{etiqueta}_{datetime.datetime.now():%Y%m%d_%H%M%S}.jsonl")
    print(f"{len(elegidos)} casos · modelo {etiqueta} · GPU {torch.cuda.get_device_name(0)}\nGuardando en {salida}\n")
    with open(salida, "w", encoding="utf-8") as f:
        for i, (cat, c) in enumerate(elegidos, 1):
            esperado = json.loads(c["messages"][-1]["content"])
            ent = tok.apply_chat_template(c["messages"][:-1], add_generation_prompt=True,
                                          return_tensors="pt", return_dict=True).to(0)
            t0 = time.time()
            with torch.no_grad():
                out = m.generate(**ent, max_new_tokens=1200, do_sample=False,
                                 temperature=None, top_p=None, top_k=None)
            seg = time.time() - t0
            nuevos = out[0][ent["input_ids"].shape[1]:]
            texto = tok.decode(nuevos, skip_special_tokens=True)
            cal = calificar(texto, esperado)
            fila = {"id": c["id"], "categoria": cat, "tipo": c["meta"]["tipo"], "plantilla": c["meta"]["plantilla"],
                    "nivel_ruido": c["meta"]["nivel_ruido"], "modelo": BASE, "adaptador": adaptador,
                    "segundos": round(seg, 2), "tokens": len(nuevos), **cal, "salida": texto}
            f.write(json.dumps(fila, ensure_ascii=False) + "\n")
            f.flush()
            print(f"[{i:>2}/{len(elegidos)}] {c['id']} {cat:<16} exacto={cal['exacto']!s:<5} "
                  f"campos={cal['campos_ok']}/{cal['campos_total']} inventados={len(cal['inventados'])} "
                  f"claves_SAT_inventadas={len(cal['claves_sat_inventadas'])} ({seg:.1f} s)")
    print(f"\nMemoria GPU máx.: {torch.cuda.max_memory_allocated() / 2**30:.2f} GB\nRegistro: {salida}")


def resumen(filas):
    n = len(filas)
    if not n:
        return {}
    s = lambda k: sum(1 for f in filas if f[k])
    return {
        "casos": n,
        "json_valido": f"{s('json_valido')}/{n}",
        "mismo_esquema": f"{s('mismo_esquema')}/{n}",
        "exacto": f"{s('exacto')}/{n}",
        "aciertos_por_campo": f"{sum(f['campos_ok'] for f in filas)}/{sum(f['campos_total'] for f in filas)}"
                              f" ({100 * sum(f['campos_ok'] for f in filas) / sum(f['campos_total'] for f in filas):.1f} %)",
        "campos_inventados": sum(len(f["inventados"]) for f in filas),
        "campos_omitidos": sum(len(f["omitidos"]) for f in filas),
        "claves_sat_inventadas": sum(len(f["claves_sat_inventadas"]) for f in filas),
        "casos_con_claves_sat_inventadas": s("claves_sat_inventadas"),
        "n_conceptos_correcto": f"{s('conceptos_n_ok')}/{n}",
        "segundos_promedio": round(sum(f["segundos"] for f in filas) / n, 1),
    }


def comparar(rutas):
    corridas = []
    for r in rutas:
        filas = [json.loads(l) for l in open(r, encoding="utf-8")]
        nombre = os.path.basename(os.path.normpath(filas[0]["adaptador"])) if filas and filas[0]["adaptador"] else "base"
        corridas.append((nombre, r, {f["id"]: f for f in filas}))
    ids = [i for i in corridas[0][2] if all(i in c[2] for c in corridas)]
    if any(len(c[2]) != len(ids) for c in corridas):
        print("⚠ Las corridas no tienen los mismos casos; solo se comparan los comunes:", len(ids))

    l = ["# Evaluación del asistente: base vs. ajustado", "",
         f"Generado {datetime.datetime.now():%Y-%m-%d %H:%M} por `test_10_casos.py --comparar` a partir de:", ""]
    l += [f"- `{nombre}`: `{os.path.relpath(r, AQUI)}`" for nombre, r, _ in corridas]
    l += ["", f"Casos comunes: {len(ids)} de `dataset/test.jsonl` (plantillas no vistas en train/val). "
          "Misma configuración: prompt del dataset, greedy, max_new_tokens=1200, NF4 + fp16.", "",
          "## Resultado global", "", "| Métrica | " + " | ".join(c[0] for c in corridas) + " |",
          "|---|" + "---|" * len(corridas)]
    res = [resumen([c[2][i] for i in ids]) for c in corridas]
    for k in res[0]:
        l.append(f"| {k} | " + " | ".join(str(r[k]) for r in res) + " |")

    l += ["", "## Por categoría (exacto · aciertos por campo · claves SAT inventadas)", "",
          "| Categoría | " + " | ".join(c[0] for c in corridas) + " |", "|---|" + "---|" * len(corridas)]
    for cat in CATEGORIAS:
        celdas = []
        for c in corridas:
            r = resumen([c[2][i] for i in ids if c[2][i]["categoria"] == cat])
            celdas.append(f"{r['exacto']} · {r['aciertos_por_campo']} · {r['claves_sat_inventadas']}" if r else "—")
        l.append(f"| {cat} | " + " | ".join(celdas) + " |")

    l += ["", "## Caso por caso (exacto / campos correctos)", "",
          "| id | categoría | plantilla | " + " | ".join(c[0] for c in corridas) + " |",
          "|---|---|---|" + "---|" * len(corridas)]
    for i in ids:
        f0 = corridas[0][2][i]
        l.append(f"| {i} | {f0['categoria']} | {f0['plantilla']} | " + " | ".join(
            f"{'✓' if c[2][i]['exacto'] else '✗'} {c[2][i]['campos_ok']}/{c[2][i]['campos_total']}" for c in corridas) + " |")

    ultimo = corridas[-1]
    l += ["", f"## Ejemplos de errores de `{ultimo[0]}` (campo: esperado → obtenido)", ""]
    errores = [ultimo[2][i] for i in ids if not ultimo[2][i]["exacto"]]
    if not errores:
        l.append("Sin errores en estos casos.")
    for f in errores[:8]:
        if not f["json_valido"]:
            l.append(f"- **{f['id']}** ({f['categoria']}): JSON inválido")
            continue
        det = "; ".join(f"`{k}`: {v['esperado']!r} → {v['obtenido']!r}" for k, v in list(f["errores_campo"].items())[:4])
        extra = f" · claves SAT inventadas: {', '.join(f['claves_sat_inventadas'])}" if f["claves_sat_inventadas"] else ""
        l.append(f"- **{f['id']}** ({f['categoria']}): {det or 'difiere fuera de los campos calificados (p. ej. conceptos)'}{extra}")
    aciertos = [ultimo[2][i]["id"] for i in ids if ultimo[2][i]["exacto"]]
    l += ["", f"Aciertos exactos de `{ultimo[0]}`: " + (", ".join(aciertos) if aciertos else "ninguno"), "",
          "## Interpretación", "", "_Escribirla el equipo a partir de las tablas de arriba._", ""]
    os.makedirs(CARPETA, exist_ok=True)
    destino = os.path.join(CARPETA, "comparacion.md")
    open(destino, "w", encoding="utf-8").write("\n".join(l))
    print("\n".join(l[:30]))
    print(f"\n... completo en {destino}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("modelo", nargs="?", help="'base' o la carpeta del adaptador")
    p.add_argument("--por-categoria", type=int, default=5, help="casos por categoría (4 categorías; 5 -> 20 casos)")
    p.add_argument("--comparar", nargs="+", metavar="JSONL")
    a = p.parse_args()
    if a.comparar:
        comparar(a.comparar)
    elif a.modelo:
        correr(a.modelo, a.por_categoria)
    else:
        p.print_help()

#!/usr/bin/env python3
"""
Revisión del dataset SINTÉTICO de extracción (texto OCR -> JSON CFDI) que crea
generar_dataset_ocr.py. No modifica el dataset: solo lo lee y reporta.

Revisiones (CLAUDE.md sec. 4, 5, 17 y 18)
 1. Formato: cada línea es JSON, trae id/messages/meta, 3 mensajes (system, user, assistant)
    y la respuesta del asistente es un JSON con todas las claves.
 2. Contrato: las formas que acepta frontend-pwa/lib/cfdi.ts (decimales, fecha ISO, RFC, UUID,
    opciones de catálogo cerrado). Copia independiente en Python; con --con-node además se
    pasa cada respuesta por leerCfdi() real (Node >= 22.18, que quita los tipos de .ts).
 3. Nada inventado: todo valor distinto de "AUTO" debe aparecer en el texto del OCR,
    tolerando formato ($, comas, fecha a ISO) y las confusiones O/0, l/1, S/5, B/8 en importes.
 4. Cuentas internas: subtotal + IVA = total y suma de importes = total (ticket) o subtotal
    (CFDI). Solo detecta errores del generador; no es la regla fiscal de la app.
 5. Fugas entre splits: textos repetidos, casi repetidos, plantillas y nombres compartidos.
 6. Largo: caracteres siempre; tokens reales con --tokenizador (requiere `transformers`).
 7. Distribución: tipos, plantillas, ruido y % de "AUTO" por campo, calculados de los datos.
 8. Muestra estratificada para la revisión humana: revision_manual.md y revision_manual.csv.

Uso (desde la raíz del repo):
    python training/asistente/revisar_dataset.py
    python training/asistente/revisar_dataset.py --muestra 40 --huellas --con-node \
        --tokenizador <ruta_o_nombre_del_modelo> --max-tokens 1024

Salida en la carpeta del dataset: reporte_revision.json, revision_manual.md,
revision_manual.csv y, con --huellas, huellas.txt (formato de `sha256sum -c`).
Código de salida 1 si hay errores (no avisos).
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import re
import statistics
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime
from decimal import Decimal
from pathlib import Path

A = "AUTO"
SPLITS = ("train", "val", "test")
MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
PLANTILLAS_COMPARTIDAS = {"X1"}  # basura aleatoria de "foto ilegible": se permite en todos los splits
NOMBRES_GENERICOS = {"PUBLICO EN GENERAL"}

# Claves esperadas (copia independiente del contrato, no se importa del generador)
CLAVES = {
    "Version", "Serie", "Folio", "Fecha", "FormaPago", "FormaPagoLeida", "MetodoPago", "Moneda",
    "TipoDeComprobante", "Exportacion", "LugarExpedicion", "SubTotal", "Total", "Emisor", "Receptor",
    "Conceptos", "Impuestos", "Complemento",
}
CLAVES_EMISOR = {"Rfc", "Nombre", "RegimenFiscal"}
CLAVES_RECEPTOR = {"Rfc", "Nombre", "DomicilioFiscalReceptor", "RegimenFiscalReceptor", "UsoCFDI"}
CLAVES_CONCEPTO = {"ClaveProdServ", "Cantidad", "ClaveUnidad", "Descripcion", "ValorUnitario", "Importe", "ObjetoImp"}
CLAVES_TRASLADO = {"Base", "Impuesto", "TipoFactor", "TasaOCuota", "Importe"}
CAMPOS_IMPORTE = {"SubTotal", "Total", "TotalImpuestosTrasladados", "ValorUnitario", "Importe", "Base"}

RE_DEC = re.compile(r"^-?\d+(\.\d+)?$")
RE_FECHA = re.compile(r"^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$")
RE_RFC = re.compile(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$")
RE_UUID = re.compile(r"^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$")
# Importe en el texto: admite $, comas y confusiones de OCR (O, l, S, B) dentro del número
RE_NUM_TEXTO = re.compile(r"(?<![0-9A-Za-z])\$?\s?([0-9OlSB][0-9OlSB,]*\.[0-9OlSB]{2})(?![0-9])")
CONFUSION = str.maketrans("OlSB", "0158")

CAMPOS_CLAVE = {
    "Fecha": lambda s: s["Fecha"],
    "Total": lambda s: s["Total"],
    "SubTotal": lambda s: s["SubTotal"],
    "Emisor.Rfc": lambda s: s["Emisor"]["Rfc"],
    "Emisor.Nombre": lambda s: s["Emisor"]["Nombre"],
    "FormaPago": lambda s: s["FormaPago"],
    "FormaPagoLeida": lambda s: s["FormaPagoLeida"],
    "UUID": lambda s: s["Complemento"]["TimbreFiscalDigital"]["UUID"],
}


class Hallazgos:
    def __init__(self):
        self.errores: dict[str, list[dict]] = defaultdict(list)
        self.avisos: dict[str, list[dict]] = defaultdict(list)

    def error(self, cat: str, ident: str, detalle: str):
        self.errores[cat].append({"id": ident, "detalle": detalle})

    def aviso(self, cat: str, ident: str, detalle: str):
        self.avisos[cat].append({"id": ident, "detalle": detalle})


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------


def colapsar(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def hojas(v, ruta=""):
    if isinstance(v, dict):
        for k, x in v.items():
            yield from hojas(x, f"{ruta}.{k}" if ruta else k)
    elif isinstance(v, list):
        for i, x in enumerate(v):
            yield from hojas(x, f"{ruta}[{i}]")
    else:
        yield ruta, v


def nombre_campo(ruta: str) -> str:
    return re.sub(r"\[\d+\]", "", ruta.rsplit(".", 1)[-1])


def dec(v) -> Decimal | None:
    return Decimal(v) if isinstance(v, str) and v != A and RE_DEC.match(v) else None


def variantes_fecha(iso: str) -> list[str]:
    """Formas en que una fecha ISO pudo venir impresa (formato mexicano día/mes)."""
    m = RE_FECHA.match(iso)
    if not m:
        return []
    y, mo, d, hh, mi, ss = m.groups()
    mes = MESES[int(mo) - 1]
    fechas = [f"{d}/{mo}/{y}", f"{d}/{mo}/{y[2:]}", f"{d}-{mes}-{y}", f"{y}-{mo}-{d}", f"{d} {mes} {y}"]
    if hh is None:
        return fechas
    hora = f"{hh}:{mi}" + (f":{ss}" if ss else "")
    return [f"{f}{sep}{hora}" for f in fechas for sep in (" ", "T")]


def importes_del_texto(texto: str) -> set[str]:
    out = set()
    for m in RE_NUM_TEXTO.finditer(texto):
        v = m.group(1).translate(CONFUSION).replace(",", "")
        if re.fullmatch(r"\d+\.\d{2}", v):
            out.add(v)
    return out


def aparece(valor: str, texto_norm: str) -> bool:
    v = colapsar(valor.upper())
    return re.search(rf"(?<![A-Z0-9Ñ]){re.escape(v)}(?![A-Z0-9Ñ])", texto_norm) is not None


# ---------------------------------------------------------------------------
# Revisiones por ejemplo
# ---------------------------------------------------------------------------


def revisar_formato(fila, ident: str, H: Hallazgos):
    """Devuelve (texto_ocr, salida) o None si el ejemplo no se puede leer."""
    if not isinstance(fila, dict) or not {"id", "messages", "meta"} <= set(fila):
        H.error("formato", ident, "faltan id, messages o meta")
        return None
    msgs = fila["messages"]
    if not isinstance(msgs, list) or [m.get("role") for m in msgs if isinstance(m, dict)] != ["system", "user", "assistant"]:
        H.error("formato", ident, "messages debe ser [system, user, assistant]")
        return None
    if any(not isinstance(m.get("content"), str) for m in msgs):
        H.error("formato", ident, "algún content no es texto")
        return None
    usuario = msgs[1]["content"]
    if not usuario.startswith("Texto OCR:\n"):
        H.error("formato", ident, "el mensaje de usuario no empieza con 'Texto OCR:'")
    try:
        salida = json.loads(msgs[2]["content"])
    except json.JSONDecodeError as e:
        H.error("formato", ident, f"la respuesta no es JSON: {e}")
        return None
    if not isinstance(salida, dict):
        H.error("formato", ident, "la respuesta no es un objeto JSON")
        return None
    return usuario.removeprefix("Texto OCR:\n"), salida


def revisar_contrato(s: dict, ident: str, H: Hallazgos) -> bool:
    ok = True

    def mal(detalle):
        nonlocal ok
        ok = False
        H.error("contrato", ident, detalle)

    if set(s) != CLAVES:
        mal(f"claves de primer nivel: faltan {sorted(CLAVES - set(s))}, sobran {sorted(set(s) - CLAVES)}")
        return False
    if not isinstance(s["Emisor"], dict) or set(s["Emisor"]) != CLAVES_EMISOR:
        mal("claves de Emisor")
    if not isinstance(s["Receptor"], dict) or set(s["Receptor"]) != CLAVES_RECEPTOR:
        mal("claves de Receptor")
    if not isinstance(s["Conceptos"], list):
        mal("Conceptos no es lista")
        return False
    imp = s["Impuestos"]
    if not isinstance(imp, dict) or "TotalImpuestosTrasladados" not in imp or set(imp) - {"TotalImpuestosTrasladados", "Traslados"}:
        mal("claves de Impuestos")
        return False
    try:
        uuid_v = s["Complemento"]["TimbreFiscalDigital"]["UUID"]
    except (KeyError, TypeError):
        mal("falta Complemento.TimbreFiscalDigital.UUID")
        return False
    if not ok:
        return False

    for ruta, v in hojas(s):
        if not isinstance(v, str) or v.strip() == "":
            mal(f"{ruta} vacío o no es texto")

    def forma(v, rx, nombre):
        if isinstance(v, str) and v != A and not rx.match(v):
            mal(f"{nombre}={v!r} no tiene la forma esperada")

    def opcion(v, opciones, nombre):
        if isinstance(v, str) and v != A and v not in opciones:
            mal(f"{nombre}={v!r} fuera de {sorted(opciones)}")

    forma(s["Fecha"], RE_FECHA, "Fecha")
    for k in ("SubTotal", "Total"):
        forma(s[k], RE_DEC, k)
    forma(imp["TotalImpuestosTrasladados"], RE_DEC, "TotalImpuestosTrasladados")
    forma(s["Emisor"].get("Rfc", A), RE_RFC, "Emisor.Rfc")
    forma(s["Receptor"].get("Rfc", A), RE_RFC, "Receptor.Rfc")
    forma(uuid_v, RE_UUID, "UUID")
    opcion(s["MetodoPago"], {"PUE", "PPD"}, "MetodoPago")
    opcion(s["TipoDeComprobante"], {"I", "E", "T", "N", "P"}, "TipoDeComprobante")
    for i, c in enumerate(s["Conceptos"]):
        if not isinstance(c, dict) or set(c) != CLAVES_CONCEPTO:
            mal(f"claves de Conceptos[{i}]")
            continue
        for k in ("Cantidad", "ValorUnitario", "Importe"):
            forma(c[k], RE_DEC, f"Conceptos[{i}].{k}")
    for i, t in enumerate(imp.get("Traslados", [])):
        if not isinstance(t, dict) or set(t) != CLAVES_TRASLADO:
            mal(f"claves de Traslados[{i}]")
            continue
        for k in ("Base", "TasaOCuota", "Importe"):
            forma(t[k], RE_DEC, f"Traslados[{i}].{k}")
        opcion(t["Impuesto"], {"001", "002", "003"}, f"Traslados[{i}].Impuesto")
        opcion(t["TipoFactor"], {"Tasa", "Cuota", "Exento"}, f"Traslados[{i}].TipoFactor")
    return ok


def revisar_inventados(texto: str, s: dict, ident: str, H: Hallazgos):
    texto_norm = colapsar(texto.upper())
    importes = importes_del_texto(texto)
    for ruta, v in hojas(s):
        if not isinstance(v, str) or v == A:
            continue
        campo = nombre_campo(ruta)
        if campo in CAMPOS_IMPORTE:
            if v not in importes:
                H.error("inventado", ident, f"{ruta}={v!r} no está entre los importes del texto")
        elif campo == "Fecha":
            if not any(colapsar(f) in texto_norm for f in variantes_fecha(v)):
                H.error("inventado", ident, f"Fecha={v!r} no aparece impresa en el texto")
        elif not aparece(v, texto_norm):
            H.error("inventado", ident, f"{ruta}={v!r} no aparece en el texto")


def revisar_cuentas(s: dict, tipo: str, ident: str, H: Hallazgos):
    sub, tot = dec(s["SubTotal"]), dec(s["Total"])
    iva = dec(s["Impuestos"]["TotalImpuestosTrasladados"])
    if sub is not None and iva is not None and tot is not None and sub + iva != tot:
        H.error("cuentas", ident, f"SubTotal {sub} + IVA {iva} != Total {tot}")
    importes = [dec(c["Importe"]) for c in s["Conceptos"]]
    if importes and all(x is not None for x in importes):
        suma = sum(importes, Decimal("0"))
        if tipo == "ticket" and tot is not None and suma != tot:
            H.error("cuentas", ident, f"suma de importes {suma} != Total {tot}")
        if tipo == "cfdi" and sub is not None and suma != sub:
            H.error("cuentas", ident, f"suma de importes {suma} != SubTotal {sub}")
    for t in s["Impuestos"].get("Traslados", []):
        base = dec(t.get("Base"))
        if base is not None and sub is not None and base != sub:
            H.error("cuentas", ident, f"Traslado.Base {base} != SubTotal {sub}")
    if tipo in ("ilegible", "no_comprobante"):
        llenos = [r for r, v in hojas(s) if v != A]
        if llenos or s["Conceptos"]:
            H.error("cuentas", ident, f"tipo {tipo} debería ir todo en AUTO; tiene {llenos[:5]}")


# ---------------------------------------------------------------------------
# Revisiones de conjunto
# ---------------------------------------------------------------------------


def revisar_fugas(datos: dict[str, list[dict]], H: Hallazgos) -> dict:
    exactos: dict[str, set[str]] = defaultdict(set)
    casi: dict[str, set[str]] = defaultdict(set)
    for split, filas in datos.items():
        vistos_split: set[str] = set()
        for f in filas:
            h = hashlib.sha256(f["texto"].encode("utf-8")).hexdigest()
            if h in vistos_split:
                H.error("fugas", f["id"], f"texto repetido dentro de {split}")
            vistos_split.add(h)
            exactos[h].add(split)
            if f["tipo"] != "ilegible":
                norm = re.sub(r"\d", "#", colapsar(f["texto"].upper()))
                casi[hashlib.sha256(norm.encode("utf-8")).hexdigest()].add(split)
    rep_exactos = sum(1 for s in exactos.values() if len(s) > 1)
    rep_casi = sum(1 for s in casi.values() if len(s) > 1)
    if rep_exactos:
        H.error("fugas", "-", f"{rep_exactos} textos idénticos aparecen en más de un split")
    if rep_casi:
        H.aviso("fugas", "-", f"{rep_casi} textos casi iguales (mismos salvo dígitos) en más de un split")

    plantillas = {s: {f["plantilla"] for f in filas} for s, filas in datos.items()}
    nombres: dict[str, set[str]] = {}
    for s, filas in datos.items():
        nombres[s] = set()
        for f in filas:
            if f["salida"] is None:
                continue
            for grupo in ("Emisor", "Receptor"):
                n = f["salida"].get(grupo, {}).get("Nombre", A)
                if isinstance(n, str) and n != A and n not in NOMBRES_GENERICOS:
                    nombres[s].add(n)
    for otro in ("val", "test"):
        if "train" in plantillas and otro in plantillas:
            comun = (plantillas["train"] & plantillas[otro]) - PLANTILLAS_COMPARTIDAS
            if comun:
                H.error("fugas", "-", f"plantillas de {otro} que también están en train: {sorted(comun)}")
            comunes_n = nombres["train"] & nombres[otro]
            if comunes_n:
                H.error("fugas", "-", f"{len(comunes_n)} nombres de {otro} también en train, p. ej. {sorted(comunes_n)[:5]}")
    return {"textos_identicos_entre_splits": rep_exactos, "textos_casi_iguales_entre_splits": rep_casi,
            "plantillas_por_split": {s: sorted(p) for s, p in plantillas.items()}}


def revisar_largo(datos, tokenizador: str | None, max_tokens: int, trust_remote_code: bool, H: Hallazgos) -> dict:
    res: dict = {}
    for split, filas in datos.items():
        chars = [sum(len(m["content"]) for m in f["messages"]) for f in filas]
        if chars:
            orden = sorted(chars)
            res[split] = {"chars_max": orden[-1], "chars_p95": orden[int(0.95 * (len(orden) - 1))],
                          "chars_promedio": round(statistics.mean(chars))}
    if not tokenizador:
        H.aviso("largo", "-", "sin --tokenizador: solo se midieron caracteres, no tokens reales")
        return res
    try:
        from transformers import AutoTokenizer
    except ImportError:
        H.aviso("largo", "-", "no está instalado `transformers`; no se contaron tokens")
        return res
    tok = AutoTokenizer.from_pretrained(tokenizador, trust_remote_code=trust_remote_code)
    for split, filas in datos.items():
        cuentas = []
        for f in filas:
            if getattr(tok, "chat_template", None):
                ids = tok.apply_chat_template(f["messages"], tokenize=True)
                if not isinstance(ids, list):  # algunas versiones devuelven un dict
                    ids = ids["input_ids"]
            else:
                ids = tok("\n".join(m["content"] for m in f["messages"]))["input_ids"]
            cuentas.append(len(ids))
            if len(ids) > max_tokens:
                H.error("largo", f["id"], f"{len(ids)} tokens > {max_tokens}: se cortaría al entrenar")
        if cuentas:
            orden = sorted(cuentas)
            res.setdefault(split, {}).update({"tokens_max": orden[-1], "tokens_p95": orden[int(0.95 * (len(orden) - 1))],
                                              "tokens_promedio": round(statistics.mean(cuentas))})
    res["tokenizador"] = tokenizador
    return res


def distribucion(datos, H: Hallazgos) -> dict:
    res = {}
    for split, filas in datos.items():
        n = len(filas)
        utiles = [f["salida"] for f in filas if f["tipo"] in ("ticket", "cfdi") and f["salida"] is not None]
        pct_auto = {}
        for campo, leer in CAMPOS_CLAVE.items():
            if not utiles:
                continue
            try:
                pct = round(100 * sum(1 for s in utiles if leer(s) == A) / len(utiles), 1)
            except (KeyError, TypeError):
                continue
            pct_auto[campo] = pct
            if campo in ("Fecha", "Total", "Emisor.Nombre") and (pct == 0 or pct > 60):
                H.aviso("distribucion", split, f"{campo} va en AUTO el {pct} % de las veces (revisar el balance)")
        tipos = Counter(f["tipo"] for f in filas)
        for t in ("ticket", "cfdi", "ilegible", "no_comprobante"):
            if tipos.get(t, 0) == 0:
                H.aviso("distribucion", split, f"no hay ejemplos de tipo {t}")
        res[split] = {
            "total": n,
            "por_tipo": {t: {"n": c, "pct": round(100 * c / n, 1)} for t, c in tipos.items()} if n else {},
            "por_plantilla": dict(Counter(f["plantilla"] for f in filas)),
            "por_nivel_ruido": {str(k): v for k, v in Counter(f["nivel_ruido"] for f in filas).items()},
            "pct_auto_en_tickets_y_cfdi": pct_auto,
            "conceptos_promedio": round(statistics.mean(len(s["Conceptos"]) for s in utiles), 2) if utiles else None,
        }
    return res


def revisar_con_node(datos, raiz_repo: Path, H: Hallazgos) -> dict:
    """Pasa cada respuesta por leerCfdi() de lib/cfdi.ts (la misma función que usa la app)."""
    ruta_ts = raiz_repo / "frontend-pwa" / "lib" / "cfdi.ts"
    if not ruta_ts.exists():
        H.aviso("node", "-", f"no se encontró {ruta_ts}")
        return {}
    codigo = (
        "const { leerCfdi } = await import(process.argv[1]);"
        "let d = ''; process.stdin.on('data', c => d += c);"
        "process.stdin.on('end', () => {"
        "  const out = d.split('\\n').filter(Boolean).map(l => {"
        "    const r = leerCfdi(JSON.parse(l));"
        "    return r.ok ? { ok: true, faltantes: r.faltantes } : { ok: false, motivo: r.motivo };"
        "  });"
        "  process.stdout.write(JSON.stringify(out));"
        "});"
    )
    res = {}
    for split, filas in datos.items():
        validas = [f for f in filas if f["salida"] is not None]
        entrada = "\n".join(json.dumps(f["salida"], ensure_ascii=False) for f in validas)
        try:
            p = subprocess.run(["node", "--input-type=module", "-e", codigo, ruta_ts.as_uri()],
                               input=entrada, capture_output=True, text=True, timeout=300)
        except (FileNotFoundError, subprocess.TimeoutExpired) as e:
            H.aviso("node", "-", f"no se pudo correr node: {e}")
            return res
        if p.returncode != 0:
            H.aviso("node", "-", f"node terminó con error: {p.stderr.strip()[:300]}")
            return res
        resultados = json.loads(p.stdout)
        conteo: Counter = Counter()
        faltantes: Counter = Counter()
        for f, r in zip(validas, resultados):
            conteo[f"{f['tipo']}:{'ok' if r['ok'] else 'sin_datos'}"] += 1
            if r["ok"]:
                faltantes.update(r["faltantes"])
            if f["tipo"] in ("ilegible", "no_comprobante") and r["ok"]:
                H.error("node", f["id"], "leerCfdi encontró datos en un ejemplo que debería ir vacío")
        res[split] = {"resultado_por_tipo": dict(conteo), "faltantes_reportados": dict(faltantes)}
    return res


def escribir_muestra(datos, split: str, n: int, semilla: int, carpeta: Path) -> int:
    filas = [f for s, fs in datos.items() if split in ("todos", s) for f in fs]
    grupos: dict[tuple, list] = defaultdict(list)
    for f in filas:
        grupos[(f["tipo"], f["plantilla"], f["nivel_ruido"])].append(f)
    rng = random.Random(semilla)
    for g in grupos.values():
        rng.shuffle(g)
    claves = sorted(grupos)
    rng.shuffle(claves)
    muestra: list[dict] = []
    while len(muestra) < n and any(grupos[k] for k in claves):  # una de cada grupo por vuelta
        for k in claves:
            if grupos[k] and len(muestra) < n:
                muestra.append(grupos[k].pop())

    md = [
        "# Revisión manual del dataset de extracción (SINTÉTICO)",
        "",
        f"Muestra estratificada de {len(muestra)} ejemplos ({split}), semilla {semilla}, "
        f"generada {datetime.now():%Y-%m-%d %H:%M}. Anotar el resultado en revision_manual.csv.",
        "",
    ]
    for f in muestra:
        salida = json.dumps(f["salida"], ensure_ascii=False, indent=2) if f["salida"] is not None else "(no se pudo leer)"
        md += [
            f"## {f['id']} · {f['tipo']} · {f['plantilla']} · ruido {f['nivel_ruido']}",
            "",
            "Texto OCR:",
            "```text",
            f["texto"] or "(vacío)",
            "```",
            "Respuesta esperada:",
            "```json",
            salida,
            "```",
            "- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)",
            "- [ ] Cada campo de la respuesta es correcto",
            "- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto",
            "- [ ] Los AUTO están bien puestos (no falta copiar nada legible)",
            "",
            "Notas:",
            "",
        ]
    (carpeta / "revision_manual.md").write_text("\n".join(md), encoding="utf-8")
    with (carpeta / "revision_manual.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "tipo", "plantilla", "nivel_ruido", "revisor", "correcto_si_no", "campos_con_error", "notas"])
        for f in muestra:
            w.writerow([f["id"], f["tipo"], f["plantilla"], f["nivel_ruido"], "", "", "", ""])
    return len(muestra)


# ---------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------


def main() -> None:
    aqui = Path(__file__).resolve().parent
    p = argparse.ArgumentParser(description="Revisa el dataset SINTÉTICO texto OCR -> JSON CFDI.")
    p.add_argument("--dataset", type=Path, default=aqui / "dataset")
    p.add_argument("--muestra", type=int, default=40, help="ejemplos para la revisión humana (0 = no generar)")
    p.add_argument("--muestra-split", choices=["train", "val", "test", "todos"], default="todos")
    p.add_argument("--semilla", type=int, default=7)
    p.add_argument("--tokenizador", help="ruta o nombre del tokenizador del modelo base (requiere transformers)")
    p.add_argument("--max-tokens", type=int, default=1024)
    p.add_argument("--trust-remote-code", action="store_true", help="solo si el tokenizador lo exige")
    p.add_argument("--con-node", action="store_true", help="también valida con leerCfdi() de frontend-pwa/lib/cfdi.ts")
    p.add_argument("--huellas", action="store_true", help="escribe huellas.txt (sha256) de los .jsonl")
    p.add_argument("--max-ejemplos-reporte", type=int, default=50, help="hallazgos por categoría en el reporte")
    a = p.parse_args()

    H = Hallazgos()
    datos: dict[str, list[dict]] = {}

    for split in SPLITS:
        ruta = a.dataset / f"{split}.jsonl"
        if not ruta.exists():
            H.error("formato", split, f"no existe {ruta}")
            continue
        datos[split] = []
        with ruta.open(encoding="utf-8") as fh:
            for num, linea in enumerate(fh, 1):
                ident = f"{split}:{num}"
                if not linea.strip():
                    H.aviso("formato", ident, "línea vacía")
                    continue
                try:
                    fila = json.loads(linea)
                except json.JSONDecodeError as e:
                    H.error("formato", ident, f"no es JSON: {e}")
                    continue
                ident = str(fila.get("id", ident)) if isinstance(fila, dict) else ident
                leido = revisar_formato(fila, ident, H)
                meta = fila.get("meta", {}) if isinstance(fila, dict) else {}
                texto, salida = leido if leido else ("", None)
                f = {"id": ident, "texto": texto, "salida": salida, "messages": fila.get("messages", []) if leido else [],
                     "tipo": meta.get("tipo", "?"), "plantilla": meta.get("plantilla", "?"),
                     "nivel_ruido": meta.get("nivel_ruido", "?")}
                if meta.get("sintetico") is not True:
                    H.error("formato", ident, "meta.sintetico debe ser true (CLAUDE.md sec. 18)")
                if leido and revisar_contrato(salida, ident, H):
                    revisar_inventados(texto, salida, ident, H)
                    revisar_cuentas(salida, f["tipo"], ident, H)
                datos[split].append(f)

    reporte = {
        "revisado": datetime.now().isoformat(timespec="seconds"),
        "dataset": str(a.dataset),
        "fugas": revisar_fugas(datos, H),
        "largo": revisar_largo(datos, a.tokenizador, a.max_tokens, a.trust_remote_code, H),
        "distribucion": distribucion(datos, H),
    }
    if a.con_node:
        reporte["node_leerCfdi"] = revisar_con_node(datos, aqui.parents[1], H)

    if a.huellas:
        lineas = []
        for split in SPLITS:
            ruta = a.dataset / f"{split}.jsonl"
            if ruta.exists():
                lineas.append(f"{hashlib.sha256(ruta.read_bytes()).hexdigest()}  {ruta.name}")
        (a.dataset / "huellas.txt").write_text("\n".join(lineas) + "\n", encoding="utf-8")
        reporte["huellas"] = lineas

    if a.muestra > 0 and datos:
        reporte["muestra_manual"] = escribir_muestra(datos, a.muestra_split, a.muestra, a.semilla, a.dataset)

    reporte["errores"] = {c: {"total": len(v), "ejemplos": v[: a.max_ejemplos_reporte]} for c, v in H.errores.items()}
    reporte["avisos"] = {c: {"total": len(v), "ejemplos": v[: a.max_ejemplos_reporte]} for c, v in H.avisos.items()}
    (a.dataset / "reporte_revision.json").write_text(json.dumps(reporte, ensure_ascii=False, indent=2), encoding="utf-8")

    # Resumen en consola
    print(f"Dataset: {a.dataset}")
    for split, filas in datos.items():
        print(f"  {split}: {len(filas)} ejemplos")
    categorias = ["formato", "contrato", "inventado", "cuentas", "fugas", "largo", "node"]
    print("\nErrores:")
    for c in categorias:
        print(f"  {c:<10} {len(H.errores.get(c, []))}")
        for e in H.errores.get(c, [])[:3]:
            print(f"      {e['id']}: {e['detalle']}")
    if H.avisos:
        print("\nAvisos:")
        for c, v in H.avisos.items():
            for e in v[:3]:
                print(f"  [{c}] {e['id']}: {e['detalle']}")
    if "muestra_manual" in reporte:
        print(f"\nMuestra para revisión humana: {reporte['muestra_manual']} ejemplos -> "
              f"{a.dataset / 'revision_manual.md'} y revision_manual.csv")
    print(f"Reporte completo -> {a.dataset / 'reporte_revision.json'}")
    sys.exit(1 if H.errores else 0)


if __name__ == "__main__":
    main()

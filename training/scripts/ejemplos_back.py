import argparse
import copy
import json
import random
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DESTINO = RAIZ.parent / "backend-ia" / "fixtures"

AVISO = (
    "SIMULADO: ejemplo del contrato de POST /vision/analizar armado desde el ground truth de un ticket "
    "sintético. Las confianzas son valores de prueba para pintar el semáforo, no salidas de un modelo."
)
MODELOS_PENDIENTES = {
    "ocdnet": {"archivo": None, "sha256": None},
    "ocrnet": {"archivo": None, "sha256": None},
    "llm": {"base": "Qwen2.5-7B-Instruct", "adaptador": None, "sha256": None},
}
CAMPOS_SIMPLES = {
    "COMERCIO": "comercio",
    "RFC": "rfc",
    "FECHA_HORA": "fecha_hora",
    "FOLIO": "folio",
    "SUBTOTAL": "subtotal",
    "IVA": "iva",
    "TOTAL": "total",
    "FORMA_PAGO": "forma_pago",
    "PAGO": "efectivo",
    "CAMBIO": "cambio",
}


def conf_prueba(rng):
    return round(rng.choice([rng.uniform(0.88, 0.99), rng.uniform(0.88, 0.99), rng.uniform(0.62, 0.84)]), 2)


def armar(registro, rng):
    gt = registro["ground_truth"]
    segmentos = []
    for i, seg in enumerate(s for s in registro["segmentos"] if s["texto"] != "###"):
        segmentos.append(
            {"id": i, "texto": seg["texto"], "poligono": seg["poligono"], "linea": seg["linea"],
             "conf_caja": conf_prueba(rng), "conf_ocr": conf_prueba(rng), "_etiqueta": seg["etiqueta"]}
        )

    campos, items, actual = [], [], []
    for seg in segmentos:
        etq = seg["_etiqueta"]
        if etq in CAMPOS_SIMPLES:
            nombre = CAMPOS_SIMPLES[etq]
            valor = gt[nombre]
            campos.append({
                "nombre": nombre,
                "valor": f"{valor:.2f}" if isinstance(valor, float) else str(valor),
                "texto_original": seg["texto"],
                "conf": round(seg["conf_caja"] * seg["conf_ocr"], 2),
                "seg": [seg["id"]],
            })
        elif etq.startswith("ITEM_"):
            actual.append(seg)
            if etq == "ITEM_IMPORTE":
                datos = gt["items"][len(items)]
                items.append({
                    "cantidad": str(datos["cantidad"]),
                    "descripcion": datos["descripcion"],
                    "precio_unitario": f"{datos['precio_unitario']:.2f}",
                    "importe": f"{datos['importe']:.2f}",
                    "conf": round(min(s["conf_caja"] * s["conf_ocr"] for s in actual), 2),
                    "seg": [s["id"] for s in actual],
                })
                actual = []

    for seg in segmentos:
        del seg["_etiqueta"]

    claves = [c["conf"] for c in campos if c["nombre"] in ("rfc", "fecha_hora", "total")]
    return {
        "_aviso": AVISO,
        "imagen": {"archivo": registro["archivo"], "ancho": registro["ancho"], "alto": registro["alto"]},
        "doc_tipo": "ticket",
        "campos": campos,
        "items": items,
        "categoria_propuesta": registro["giro"],
        "tiene_cfdi": False,
        "uuid_cfdi": None,
        "validaciones": [
            {"regla": "subtotal_mas_iva_igual_total", "ok": True,
             "detalle": f"{gt['subtotal']:.2f} + {gt['iva']:.2f} = {gt['total']:.2f}"},
            {"regla": "formato_rfc", "ok": True, "detalle": gt["rfc"]},
        ],
        "conf_global": min(claves) if claves else 0.0,
        "segmentos": segmentos,
        "modelos": MODELOS_PENDIENTES,
        "errores": [],
    }


def caso_total_no_cuadra(base):
    caso = copy.deepcopy(base)
    total = next(c for c in caso["campos"] if c["nombre"] == "total")
    leido = f"{float(total['valor']) + 90:.2f}"
    total["valor"] = leido
    total["conf"] = round(total["conf"] * 0.5, 2)
    caso["validaciones"][0] = {
        "regla": "subtotal_mas_iva_igual_total", "ok": False,
        "detalle": f"Se leyó total {leido}, pero subtotal + IVA da otro valor. Revisa el total.",
    }
    caso["conf_global"] = min(caso["conf_global"], total["conf"])
    return caso


def caso_sin_rfc(base):
    caso = copy.deepcopy(base)
    caso["campos"] = [c for c in caso["campos"] if c["nombre"] != "rfc"]
    caso["validaciones"][1] = {"regla": "formato_rfc", "ok": False, "detalle": "No se encontró RFC en el ticket."}
    caso["errores"].append({"codigo": "CAMPO_FALTANTE", "campo": "rfc", "mensaje": "No pude leer el RFC. ¿Me lo dictas?"})
    caso["conf_global"] = 0.0
    return caso


def caso_imagen_ilegible():
    return {
        "_aviso": AVISO,
        "imagen": {"archivo": "foto_borrosa.jpg", "ancho": 1080, "alto": 1440},
        "doc_tipo": "desconocido",
        "campos": [], "items": [], "categoria_propuesta": None,
        "tiene_cfdi": False, "uuid_cfdi": None, "validaciones": [], "conf_global": 0.0,
        "segmentos": [], "modelos": MODELOS_PENDIENTES,
        "errores": [{"codigo": "SIN_TEXTO", "campo": None,
                     "mensaje": "No encontré texto en la foto. Intenta con más luz y sin que se mueva."}],
    }


def main(args):
    registros = json.loads((args.origen / "anotaciones.json").read_text(encoding="utf-8"))
    rng = random.Random(args.semilla)
    elegidos = {}
    for reg in registros:
        if reg["split"] == "test" and reg["giro"] not in elegidos:
            elegidos[reg["giro"]] = reg
    if not elegidos:
        raise SystemExit("No hay tickets de test en anotaciones.json")

    args.destino.mkdir(parents=True, exist_ok=True)
    ejemplos = {f"ok_{giro}": armar(reg, rng) for giro, reg in sorted(elegidos.items())}
    base = ejemplos[sorted(ejemplos)[0]]
    ejemplos["error_total_no_cuadra"] = caso_total_no_cuadra(base)
    ejemplos["error_sin_rfc"] = caso_sin_rfc(base)
    ejemplos["error_imagen_ilegible"] = caso_imagen_ilegible()

    for nombre, contenido in ejemplos.items():
        ruta = args.destino / f"analizar_{nombre}.json"
        ruta.write_text(json.dumps(contenido, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(ruta)


def leer_args():
    p = argparse.ArgumentParser(description="Genera ejemplos SIMULADOS del contrato de /vision/analizar para el backend.")
    p.add_argument("--origen", type=Path, default=RAIZ / "data" / "synthetic")
    p.add_argument("--destino", type=Path, default=DESTINO)
    p.add_argument("--semilla", type=int, default=7)
    return p.parse_args()


if __name__ == "__main__":
    main(leer_args())

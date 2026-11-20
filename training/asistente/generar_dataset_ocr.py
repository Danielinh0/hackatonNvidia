#!/usr/bin/env python3
"""
Generador del dataset SINTÉTICO de extracción para el asistente de Dzuun (Bisie'/Tona).

Tarea (a) de CLAUDE.md sec. 17: texto que entrega el OCR (texto plano) -> JSON con forma
CFDI 4.0, el mismo contrato que lee frontend-pwa/lib/cfdi.ts (CLAUDE.md sec. 16).

Qué le enseña al modelo
- Copiar SOLO lo que está escrito. Lo que no aparece o no se puede leer va como "AUTO".
- No calcular: si el ticket no imprime subtotal o IVA, quedan en "AUTO". Las cuentas las
  hace backend-ia/reglas_fiscales.py, nunca el LLM (CLAUDE.md sec. 0).
- No inventar claves SAT: FormaPago, RegimenFiscal, UsoCFDI, ClaveUnidad, ClaveProdServ y
  ObjetoImp solo se copian cuando vienen impresas (representación impresa de un CFDI).
  En un ticket que dice "EFECTIVO", ese texto va en "FormaPagoLeida" y "FormaPago" queda
  en "AUTO"; la conversión a clave la hace el código con el catálogo.
  ("FormaPagoLeida" es una clave extra: lib/cfdi.ts la ignora. Si el equipo la acepta,
  agregarla al contrato de la sec. 16).
- Normalizar formato: importes "1160.00" (sin $ ni comas), fechas ISO, RFC en mayúsculas.
- No confundir el efectivo recibido o el cambio con el total.
- Corregir solo confusiones típicas del OCR dentro de un importe (O->0, l->1, S->5, B->8);
  si el importe trae símbolos que no son números (?, #, ~), es ilegible -> "AUTO".
- Si el texto no es un comprobante o no se entiende, todo en "AUTO" y "Conceptos" vacío.

Datos
- 100 % SINTÉTICOS. Nombres de negocio y personas ficticios; RFC aleatorios con forma válida
  (pueden coincidir por azar con uno real; no se consultan al SAT); receptor genérico
  XAXX010101000 ("público en general"); dominio de ejemplo facturacion.ejemplo.mx.
- Las tasas de IVA de los tickets sintéticos son siempre 16 % y no representan la tasa real
  de cada producto (p. ej. alimentos básicos o medicinas pueden ser tasa 0 %).
- Las claves de catálogo que aparecen impresas en los CFDI sintéticos (FORMA_PAGO, REGIMEN,
  USO_CFDI, UNIDAD, CLAVE_PROD_GENERICA) se deben VERIFICAR contra los catálogos vigentes
  del Anexo 20 del SAT antes de entregar (CLAUDE.md sec. 21).
- Las sumas de este archivo solo sirven para fabricar comprobantes coherentes. No son las
  reglas fiscales de la app.

División (CLAUDE.md sec. 18): por PLANTILLA, no por ejemplo. Cada split usa formatos de
ticket/CFDI propios y su propio grupo de nombres de negocio y personas (ver PLANTILLAS y
pools_por_split). Ningún texto se repite entre splits (se comparan por sha256).
Los >= 10 casos reservados de la sec. 5 (conversación) se arman aparte; test.jsonl sirve
para medir la extracción.

Uso (desde la raíz del repo):
    python training/asistente/generar_dataset_ocr.py \
        --n-train 1600 --n-val 200 --n-test 200 --semilla 2026

Salida en training/asistente/dataset/:
    train.jsonl, val.jsonl, test.jsonl   una línea por ejemplo:
        {"id": ..., "messages": [system, user, assistant], "meta": {...}}
    resumen.json                         distribución real de lo generado (para la ficha, sec. 6C)

El backend (backend-ia/llm_service.py) debe usar el MISMO PROMPT_SISTEMA y el mismo formato
de mensaje (mensaje_usuario) al pedir la extracción, para que coincida con el entrenamiento.
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import random
import re
import string
import sys
import unicodedata
import uuid
from collections import Counter
from datetime import date, datetime, timedelta
from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal
from pathlib import Path

A = "AUTO"
CENT = Decimal("0.01")
MILESIMA = Decimal("0.001")
MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

# ---------------------------------------------------------------------------
# Prompt (igual en entrenamiento, evaluación y backend)
# ---------------------------------------------------------------------------

PROMPT_SISTEMA = """Eres el lector de comprobantes de Dzuun. Recibes el texto que el OCR leyó de un ticket, una factura impresa u otro papel. Responde SOLO con un objeto JSON con la forma CFDI 4.0 de Dzuun, siempre con las mismas claves.
Reglas:
1. Copia solo lo que está escrito. Si un dato no aparece o no se puede leer, escribe "AUTO".
2. No calcules: no saques subtotal, IVA ni total si no están impresos.
3. No conviertas palabras a claves del SAT. Las claves (forma de pago, método de pago, régimen, uso CFDI, unidad, producto, objeto de impuesto) solo se copian si vienen impresas. Si la forma de pago viene solo en palabras, cópiala en "FormaPagoLeida" y deja "FormaPago" en "AUTO".
4. Importes sin signo ni comas, con dos decimales ("1160.00"). Fechas AAAA-MM-DD, con hora si aparece (AAAA-MM-DDTHH:MM o AAAA-MM-DDTHH:MM:SS). RFC en mayúsculas.
5. Si el OCR confundió letras con números dentro de un importe (O por 0, l por 1, S por 5, B por 8), corrígelo. Si el importe tiene símbolos que no son números, es ilegible: "AUTO".
6. El efectivo recibido y el cambio no son el total.
7. Si el texto no es un comprobante o no se entiende, todo va en "AUTO" y "Conceptos" vacío."""


def mensaje_usuario(texto_ocr: str) -> str:
    return "Texto OCR:\n" + texto_ocr


# ---------------------------------------------------------------------------
# Forma de la salida
# ---------------------------------------------------------------------------


def esqueleto() -> dict:
    """Todas las claves siempre presentes; "AUTO" = no se leyó (contrato sec. 16)."""
    return {
        "Version": A,
        "Serie": A,
        "Folio": A,
        "Fecha": A,
        "FormaPago": A,
        "FormaPagoLeida": A,
        "MetodoPago": A,
        "Moneda": A,
        "TipoDeComprobante": A,
        "Exportacion": A,
        "LugarExpedicion": A,
        "SubTotal": A,
        "Total": A,
        "Emisor": {"Rfc": A, "Nombre": A, "RegimenFiscal": A},
        "Receptor": {
            "Rfc": A,
            "Nombre": A,
            "DomicilioFiscalReceptor": A,
            "RegimenFiscalReceptor": A,
            "UsoCFDI": A,
        },
        "Conceptos": [],
        "Impuestos": {"TotalImpuestosTrasladados": A},
        "Complemento": {"TimbreFiscalDigital": {"UUID": A}},
    }


def concepto_vacio() -> dict:
    return {
        "ClaveProdServ": A,
        "Cantidad": A,
        "ClaveUnidad": A,
        "Descripcion": A,
        "ValorUnitario": A,
        "Importe": A,
        "ObjetoImp": A,
    }


RE_DEC = re.compile(r"^-?\d+(\.\d+)?$")
RE_FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$")
RE_RFC = re.compile(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$")
RE_UUID = re.compile(r"^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$")


def validar(s: dict, ident: str) -> None:
    """Revisa que la etiqueta cumpla las mismas formas que acepta lib/cfdi.ts."""
    base = esqueleto()
    errores: list[str] = []

    def hojas(v, ruta=""):
        if isinstance(v, dict):
            for k, x in v.items():
                yield from hojas(x, f"{ruta}.{k}" if ruta else k)
        elif isinstance(v, list):
            for i, x in enumerate(v):
                yield from hojas(x, f"{ruta}[{i}]")
        else:
            yield ruta, v

    for ruta, v in hojas(s):
        if not isinstance(v, str) or v == "":
            errores.append(f"{ruta} vacío o no es texto")

    if set(s) != set(base):
        errores.append("claves de primer nivel distintas")
    for grupo in ("Emisor", "Receptor"):
        if set(s.get(grupo, {})) != set(base[grupo]):
            errores.append(f"claves de {grupo}")
    if set(s.get("Impuestos", {})) - {"TotalImpuestosTrasladados", "Traslados"}:
        errores.append("claves de Impuestos")

    def chk(v, rx, nombre):
        if isinstance(v, str) and v != A and not rx.match(v):
            errores.append(f"{nombre}={v!r}")

    chk(s["Fecha"], RE_FECHA, "Fecha")
    chk(s["SubTotal"], RE_DEC, "SubTotal")
    chk(s["Total"], RE_DEC, "Total")
    chk(s["Impuestos"]["TotalImpuestosTrasladados"], RE_DEC, "TotalImpuestosTrasladados")
    chk(s["Emisor"]["Rfc"], RE_RFC, "Emisor.Rfc")
    chk(s["Receptor"]["Rfc"], RE_RFC, "Receptor.Rfc")
    chk(s["Complemento"]["TimbreFiscalDigital"]["UUID"], RE_UUID, "UUID")
    for i, c in enumerate(s["Conceptos"]):
        if set(c) != set(concepto_vacio()):
            errores.append(f"claves de Conceptos[{i}]")
        for k in ("Cantidad", "ValorUnitario", "Importe"):
            chk(c.get(k, A), RE_DEC, f"Conceptos[{i}].{k}")
    for i, t in enumerate(s["Impuestos"].get("Traslados", [])):
        for k in ("Base", "TasaOCuota", "Importe"):
            chk(t.get(k, A), RE_DEC, f"Traslados[{i}].{k}")

    if errores:
        raise ValueError(f"{ident}: etiqueta inválida: {errores}")


# ---------------------------------------------------------------------------
# Catálogos de los CFDI sintéticos (VERIFICAR contra el Anexo 20 vigente)
# ---------------------------------------------------------------------------

FORMA_PAGO = {
    "01": "Efectivo",
    "03": "Transferencia electrónica de fondos",
    "04": "Tarjeta de crédito",
    "28": "Tarjeta de débito",
    "99": "Por definir",
}
METODO_PAGO = {"PUE": "Pago en una sola exhibición", "PPD": "Pago en parcialidades o diferido"}
REGIMEN = {
    "601": "General de Ley Personas Morales",
    "612": "Personas Físicas con Actividades Empresariales y Profesionales",
    "616": "Sin obligaciones fiscales",
    "626": "Régimen Simplificado de Confianza",
}
USO_CFDI = {"G01": "Adquisición de mercancías", "G03": "Gastos en general", "S01": "Sin efectos fiscales"}
UNIDAD = {"pz": ("H87", "Pieza"), "kg": ("KGM", "Kilogramo"), "lt": ("LTR", "Litro"), "serv": ("E48", "Unidad de servicio")}
CLAVE_PROD_GENERICA = "01010101"  # "No existe en el catálogo": no se inventan claves por producto

# ---------------------------------------------------------------------------
# Datos ficticios
# ---------------------------------------------------------------------------

# (descripción, precio mínimo, precio máximo, tipo de unidad). Precios con IVA (ticket).
GIROS = {
    "abarrotes": {
        "prefijos": ["ABARROTES", "TIENDA", "MISCELANEA"],
        "productos": [
            ("REFRESCO 600ML", 15, 22, "pz"), ("LECHE ENTERA 1L", 24, 32, "pz"),
            ("HUEVO BLANCO", 38, 52, "kg"), ("ARROZ 1KG", 26, 38, "pz"),
            ("FRIJOL NEGRO 1KG", 30, 45, "pz"), ("ACEITE VEGETAL 1L", 38, 55, "pz"),
            ("AZUCAR ESTANDAR 1KG", 28, 36, "pz"), ("PAPEL HIGIENICO 4R", 28, 45, "pz"),
            ("JABON EN POLVO 1KG", 35, 55, "pz"), ("GALLETAS SURTIDAS", 12, 25, "pz"),
            ("CAFE SOLUBLE 100G", 55, 90, "pz"),
        ],
    },
    "farmacia": {
        "prefijos": ["FARMACIA", "BOTICA"],
        "productos": [
            ("PARACETAMOL 500MG 10 TAB", 18, 45, "pz"), ("IBUPROFENO 400MG 10 TAB", 25, 60, "pz"),
            ("ALCOHOL 250ML", 20, 35, "pz"), ("GASAS ESTERILES 10PZ", 25, 40, "pz"),
            ("VITAMINA C 1G 10 TAB", 40, 85, "pz"), ("CUBREBOCAS 10PZ", 20, 45, "pz"),
            ("SUERO ORAL 625ML", 18, 30, "pz"), ("VENDA ELASTICA 10CM", 22, 40, "pz"),
        ],
    },
    "papeleria": {
        "prefijos": ["PAPELERIA", "CENTRO DE COPIADO"],
        "productos": [
            ("CUADERNO PROFESIONAL 100H", 35, 70, "pz"), ("LAPIZ HB", 5, 12, "pz"),
            ("PLUMA TINTA AZUL", 6, 15, "pz"), ("COPIAS B/N", 1, 2, "pz"),
            ("IMPRESION A COLOR", 5, 12, "pz"), ("FOLDER CARTA", 3, 6, "pz"),
            ("CARTULINA BLANCA", 6, 12, "pz"), ("ENGRAPADORA", 60, 150, "pz"),
        ],
    },
    "ferreteria": {
        "prefijos": ["FERRETERIA", "TLAPALERIA", "MATERIALES"],
        "productos": [
            ("TORNILLO 1/4 PULG", 1, 3, "pz"), ("CINTA DE AISLAR", 15, 30, "pz"),
            ("FOCO LED 9W", 30, 65, "pz"), ("CEMENTO GRIS 50KG", 210, 260, "pz"),
            ("PINTURA VINILICA 4L", 280, 520, "pz"), ("BROCHA 2 PULG", 25, 55, "pz"),
            ("CABLE CAL 12", 12, 20, "pz"), ("CLAVO 2 PULG", 45, 70, "kg"),
        ],
    },
    "restaurante": {
        "prefijos": ["RESTAURANTE", "COCINA ECONOMICA", "FONDA", "COMEDOR"],
        "productos": [
            ("TLAYUDA CON TASAJO", 110, 180, "pz"), ("MEMELAS ORDEN", 45, 80, "pz"),
            ("AGUA DE HORCHATA 1L", 30, 45, "pz"), ("CAFE DE OLLA", 20, 35, "pz"),
            ("ENMOLADAS", 85, 130, "pz"), ("CHILES RELLENOS", 90, 140, "pz"),
            ("CALDO DE RES", 90, 140, "pz"), ("COMIDA CORRIDA", 75, 110, "pz"),
        ],
    },
    "gasolinera": {
        "prefijos": ["ESTACION DE SERVICIO", "GASOLINERIA", "SERVICIO"],
        "productos": [("GASOLINA REGULAR", 23, 25, "lt"), ("GASOLINA PREMIUM", 25, 27, "lt"), ("DIESEL", 25, 27, "lt")],
    },
    "mayoreo": {
        "prefijos": ["BODEGA", "DISTRIBUIDORA", "COMERCIALIZADORA"],
        "productos": [
            ("CACAO EN GRANO", 180, 320, "kg"), ("CHOCOLATE DE MESA 500G", 70, 140, "pz"),
            ("CHILE PASILLA", 150, 260, "kg"), ("MAIZ BLANCO", 8, 14, "kg"),
            ("QUESILLO", 120, 180, "kg"), ("TOSTADAS PAQ 50", 45, 80, "pz"),
            ("MEZCAL ESPADIN 750ML", 250, 600, "pz"),
        ],
    },
    "servicios": {
        "prefijos": ["SERVICIOS", "TALLER"],
        "productos": [
            ("MANTENIMIENTO EQUIPO DE COMPUTO", 300, 1200, "serv"), ("RECARGA DE TONER", 180, 450, "serv"),
            ("REPARACION DE CELULAR", 250, 1500, "serv"), ("INSTALACION ELECTRICA", 500, 3000, "serv"),
            ("DISEÑO DE LOGOTIPO", 800, 3000, "serv"),
        ],
    },
}

NOMBRES_NEGOCIO = [
    "LA GUADALUPANA", "EL SOL", "SAN JOSE", "LA ESPERANZA", "DON CHUY", "LAS FLORES", "EL GUERO",
    "LA OAXAQUEÑA", "SANTA CRUZ", "EL MIRADOR", "LOS ARCOS", "LA PROVIDENCIA", "SAN FELIPE",
    "EL PORVENIR", "DOÑA ROSA", "EL CARMEN", "LA SOLEDAD", "SAN ANTONIO", "EL TULE", "LA CANDELARIA",
    "EL CALVARIO", "LOS PINOS", "LA CIMA", "EL ROBLE", "LA HUERTA", "DON PEPE", "LA PALMA", "EL NOPAL",
    "LA TRINIDAD", "SAN JUAN", "EL PROGRESO", "LA ESTRELLA", "LOS ANGELES", "DOS HERMANOS", "LA MODERNA",
    "EL CENTENARIO", "LA LUZ", "SAN PABLO", "EL MANANTIAL", "LA FE",
]
NOMBRES_PILA = [
    "MARIA", "JOSE", "GUADALUPE", "JUAN", "ROSA", "PEDRO", "ANA", "LUIS", "CARMEN", "MIGUEL", "ELENA",
    "JORGE", "SOFIA", "RAUL", "PATRICIA", "ARTURO", "LETICIA", "FERNANDO", "ISABEL", "RICARDO",
]
APELLIDOS = [
    "LOPEZ", "HERNANDEZ", "GARCIA", "MARTINEZ", "PEREZ", "SANCHEZ", "RAMIREZ", "CRUZ", "SANTIAGO",
    "RUIZ", "MENDOZA", "VASQUEZ", "JIMENEZ", "REYES", "MORALES", "AQUINO",
]
CALLES = ["AV. INDEPENDENCIA", "CALLE ALCALA", "AV. JUAREZ", "CALZ. PORFIRIO DIAZ", "CALLE HIDALGO", "AV. UNIVERSIDAD"]
COLONIAS = ["CENTRO", "REFORMA", "JALATLACO", "EX MARQUESADO", "SAN FELIPE", "VOLCANES"]
MUNICIPIOS = ["OAXACA DE JUAREZ, OAX.", "SANTA LUCIA DEL CAMINO, OAX.", "SANTA CRUZ XOXOCOTLAN, OAX.", "SAN JACINTO AMILPAS, OAX."]
FORMAS_TICKET = ["EFECTIVO"] * 5 + ["TARJETA", "TARJETA DEBITO", "TARJETA CREDITO", "TRANSFERENCIA", "CODI", "VALES"]
PIES_EXTRA = [
    "ESTE TICKET NO ES UN COMPROBANTE FISCAL",
    "FACTURACION EN LINEA: facturacion.ejemplo.mx",
    "SOLICITE SU FACTURA EL MISMO MES",
    "CONSERVE ESTE TICKET",
    "NO SE ACEPTAN DEVOLUCIONES",
]
ESTILOS_IMPORTE = ["signo_coma", "coma", "plano", "signo_espacio"]

# ---------------------------------------------------------------------------
# Plantillas por split (CLAUDE.md sec. 18: split por plantilla)
# ---------------------------------------------------------------------------

LAYOUTS_TICKET = {
    "T1": dict(rfc="RFC:", folio="FOLIO:", fecha_lbl="FECHA:", fechas=["slash_hora"], items="cant_x",
               sub="SUBTOTAL", iva="IVA 16%", total="TOTAL", pago="FORMA DE PAGO:", recibido="EFECTIVO RECIBIDO",
               cambio="CAMBIO", pie="GRACIAS POR SU COMPRA", fecha_abajo=False),
    "T2": dict(rfc="R.F.C.", folio="TICKET #", fecha_lbl="", fechas=["slash_corta", "slash_hora"], items="dos_lineas",
               sub="SUB-TOTAL", iva="I.V.A.", total="TOTAL A PAGAR", pago="PAGO:", recibido="SU PAGO",
               cambio="SU CAMBIO", pie="VUELVA PRONTO", fecha_abajo=True),
    "T3": dict(rfc="RFC", folio="No. VENTA", fecha_lbl="FECHA/HORA", fechas=["iso_seg"], items="tabla",
               sub="SUMA", iva="IMPUESTOS", total="IMPORTE TOTAL", pago="METODO DE PAGO", recibido="PAGO CON",
               cambio="CAMBIO", pie="*** GRACIAS ***", fecha_abajo=False),
    "T4": dict(rfc="RFC EMISOR:", folio="TRANS:", fecha_lbl="", fechas=["mes_texto", "separada"], items="solo_importe",
               sub="SUBTOTAL", iva="IVA", total="TOTAL M.N.", pago="PAGADO CON", recibido="RECIBIDO",
               cambio="CAMBIO", pie="CONSERVE SU TICKET", fecha_abajo=False),
    "T5": dict(rfc="RFC:", folio="NOTA:", fecha_lbl="FECHA", fechas=["mes_texto"], items="cant_x",
               sub="SUBTOTAL:", iva="IVA:", total="TOTAL:", pago="PAGO EN", recibido="ENTREGADO",
               cambio="CAMBIO:", pie="GRACIAS, VUELVA PRONTO", fecha_abajo=True),
    "T6": dict(rfc="R.F.C:", folio="FOLIO", fecha_lbl="FECHA", fechas=["separada", "slash_hora"], items="dos_lineas",
               sub="SUB TOTAL", iva="IVA 16 %", total="TOTAL", pago="FORMA PAGO", recibido="EFECTIVO",
               cambio="CAMBIO", pie="GRACIAS POR SU PREFERENCIA", fecha_abajo=False),
    # val
    "T7": dict(rfc="R.F.C:", folio="FOLIO No.", fecha_lbl="", fechas=["slash_corta"], items="tabla",
               sub="SUBTOT", iva="IVA(16%)", total="TOTAL NETO", pago="PAGO", recibido="RECIBI",
               cambio="CAMBIO", pie="QUE TENGA BUEN DIA", fecha_abajo=True),
    # test
    "T8": dict(rfc="Rfc:", folio="Nota de venta", fecha_lbl="Fecha:", fechas=["iso_seg", "mes_texto"], items="solo_importe",
               sub="Subtotal", iva="Iva", total="Total", pago="Forma pago:", recibido="Paga con",
               cambio="Cambio", pie="Gracias por su visita", fecha_abajo=False),
}

_C_BASE = dict(serie="Serie:", folio="Folio:", serie_folio_junto=False, emisor_tit="EMISOR", receptor_tit="RECEPTOR",
               nombre="Nombre:", regimen="Régimen fiscal:", domicilio="Domicilio fiscal:", regimen_rec="Régimen fiscal:",
               uso="Uso CFDI:", fecha="Fecha de emisión:", fecha_fmt="iso", lugar="Lugar de expedición:",
               uuid="Folio fiscal:", tipo="Tipo de comprobante:", forma="Forma de pago:", metodo="Método de pago:",
               moneda="Moneda:", exportacion="Exportación:", version="Versión:",
               tabla="ClaveProdServ  Cant  Unidad  Descripción  P. Unitario  Importe  ObjImp", unidad_nombre=True,
               subtotal="Subtotal:", iva="IVA 16%:", iva_detalle=False, traslado="Impuestos trasladados:",
               total="Total:", dos_columnas=False)
LAYOUTS_CFDI = {
    "C1": dict(_C_BASE, titulo="FACTURA"),
    "C2": dict(_C_BASE, titulo="FACTURA ELECTRONICA", serie="SERIE", folio="FOLIO", emisor_tit="DATOS DEL EMISOR",
               receptor_tit="DATOS DEL RECEPTOR", nombre="NOMBRE:", regimen="REGIMEN:", domicilio="C.P.:",
               regimen_rec="REGIMEN:", uso="USO CFDI:", fecha="FECHA:", uuid="UUID:", tipo="TIPO:",
               forma="FORMA PAGO:", metodo="METODO PAGO:", moneda="MONEDA:", exportacion="EXPORTACION:",
               version="VERSION CFDI:", tabla="CLAVE  CANT  UNIDAD  DESCRIPCION  P.U.  IMPORTE  OBJ",
               unidad_nombre=False, subtotal="SUBTOTAL", iva="TOTAL IMPUESTOS TRASLADADOS", iva_detalle=True,
               traslado="TRASLADO:", total="TOTAL", dos_columnas=True),
    # val
    "C3": dict(_C_BASE, titulo="COMPROBANTE FISCAL DIGITAL POR INTERNET", uuid="Folio Fiscal (UUID):",
               fecha="Fecha y hora de emisión:", fecha_fmt="dmy", iva_detalle=True, traslado="Traslado IVA:",
               iva="Total impuestos trasladados:"),
    # test
    "C4": dict(_C_BASE, titulo="CFDI 4.0", serie_folio_junto=True, folio="Serie-Folio:", emisor_tit="Emisor",
               receptor_tit="Receptor", nombre="Razón social:", domicilio="CP receptor:", fecha="Emitido:",
               fecha_fmt="dmy", uuid="UUID:", unidad_nombre=False, dos_columnas=True),
}

PLANTILLAS = {
    "train": {"ticket": ["T1", "T2", "T3", "T4", "T5", "T6"], "cfdi": ["C1", "C2"], "ilegible": ["X1"], "no_comprobante": ["N1", "N2", "N3"]},
    "val": {"ticket": ["T7"], "cfdi": ["C3"], "ilegible": ["X1"], "no_comprobante": ["N4"]},
    "test": {"ticket": ["T8"], "cfdi": ["C4"], "ilegible": ["X1"], "no_comprobante": ["N5"]},
}
TIPOS = ["ticket", "cfdi", "ilegible", "no_comprobante"]
PESOS = [0.70, 0.20, 0.05, 0.05]
NIVELES_RUIDO = [0.0, 0.1, 0.2, 0.35]

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------


def dinero(x) -> str:
    return str(Decimal(x).quantize(CENT, rounding=ROUND_HALF_UP))


def fmt_importe(v: str, estilo: str) -> str:
    d = Decimal(v)
    con_coma, plano = f"{d:,.2f}", f"{d:.2f}"
    return {"signo_coma": "$" + con_coma, "coma": con_coma, "plano": plano, "signo_espacio": "$ " + plano}[estilo]


def fmt_cant(c: Decimal, tipo: str) -> str:
    return f"{c:.3f}" if tipo in ("kg", "lt") else str(int(c))


def cantidad(rng: random.Random, tipo: str) -> Decimal:
    if tipo == "kg":
        return Decimal(rng.choice(["0.250", "0.500", "0.750", "1.000", "1.500", "2.000"]))
    if tipo == "lt":
        return Decimal(str(rng.uniform(5, 45))).quantize(MILESIMA, rounding=ROUND_HALF_UP)
    if tipo == "serv":
        return Decimal(1)
    return Decimal(rng.choice([1, 1, 1, 2, 2, 3, 4, 6]))


def precio(rng: random.Random, pmin: float, pmax: float) -> Decimal:
    return Decimal(str(round(rng.uniform(pmin, pmax) * 2) / 2)).quantize(CENT)


def sin_acentos(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def rfc_sintetico(rng: random.Random, fisica: bool) -> str:
    letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    pref = "".join(rng.choice(letras) for _ in range(4 if fisica else 3))
    nac = date(rng.randint(1960, 2004) if fisica else rng.randint(1990, 2023), rng.randint(1, 12), rng.randint(1, 28))
    homo = "".join(rng.choice(letras + string.digits) for _ in range(3))
    return pref + nac.strftime("%y%m%d") + homo


def cp(rng: random.Random) -> str:
    return str(rng.randint(68000, 68299))


def fecha_aleatoria(rng: random.Random) -> datetime:
    d = date(2026, 1, 1) + timedelta(days=rng.randint(0, 321))
    return datetime(d.year, d.month, d.day, rng.randint(7, 21), rng.randint(0, 59), rng.randint(0, 59))


def formatear_fecha(dt: datetime, fmt: str) -> tuple[str, str]:
    """(texto impreso, etiqueta ISO). Formato mexicano día/mes."""
    mes = MESES[dt.month - 1]
    if fmt == "slash_hora":
        return dt.strftime("%d/%m/%Y %H:%M"), dt.strftime("%Y-%m-%dT%H:%M")
    if fmt == "slash_corta":
        return dt.strftime("%d/%m/%y"), dt.strftime("%Y-%m-%d")
    if fmt == "mes_texto":
        return f"{dt.day:02d}-{mes}-{dt.year}", dt.strftime("%Y-%m-%d")
    if fmt == "iso_seg":
        return dt.strftime("%Y-%m-%d %H:%M:%S"), dt.strftime("%Y-%m-%dT%H:%M:%S")
    if fmt == "separada":
        return f"{dt.day:02d} {mes} {dt.year}  {dt:%H:%M}", dt.strftime("%Y-%m-%dT%H:%M")
    if fmt == "iso":
        return dt.strftime("%Y-%m-%dT%H:%M:%S"), dt.strftime("%Y-%m-%dT%H:%M:%S")
    if fmt == "dmy":
        return dt.strftime("%d/%m/%Y %H:%M:%S"), dt.strftime("%Y-%m-%dT%H:%M:%S")
    raise ValueError(fmt)


def particionar(lista: list[str], semilla: int) -> dict[str, list[str]]:
    l = sorted(lista)
    random.Random(semilla).shuffle(l)
    a, b = int(len(l) * 0.7), int(len(l) * 0.85)
    return {"train": l[:a], "val": l[a:b], "test": l[b:]}


def pools_por_split(semilla: int) -> dict[str, dict[str, list[str]]]:
    neg = particionar(NOMBRES_NEGOCIO, semilla)
    nom = particionar(NOMBRES_PILA, semilla + 1)
    return {s: {"negocios": neg[s], "nombres": nom[s]} for s in neg}


def persona(rng: random.Random, pool: dict) -> str:
    return f"{rng.choice(pool['nombres'])} {rng.choice(APELLIDOS)} {rng.choice(APELLIDOS)}"


def razon_social(rng: random.Random, pool: dict) -> str:
    return (f"{rng.choice(['COMERCIALIZADORA', 'DISTRIBUIDORA', 'GRUPO', 'SERVICIOS INTEGRALES'])} "
            f"{rng.choice(pool['negocios'])} {rng.choice(['SA DE CV', 'S DE RL DE CV', 'SC'])}")


class Ruido:
    """Ruido de OCR. Las etiquetas fijas ('TOTAL') se ensucian libremente; los valores solo
    con confusiones corregibles (O->0...) o volviéndolos ilegibles (y entonces van en AUTO)."""

    SIMILARES = {"O": "0", "I": "1", "S": "5", "B": "8", "E": "F", "A": "4", "G": "6", "T": "7", "Z": "2", "L": "1"}
    CONFUSION_NUM = {"0": "O", "1": "l", "5": "S", "8": "B"}

    def __init__(self, rng: random.Random, nivel: float):
        self.rng, self.nivel = rng, nivel
        self.p_ilegible = 0.25 * nivel

    def etiqueta(self, s: str) -> str:
        if not s or self.rng.random() >= self.nivel:
            return s
        op = self.rng.choice(["similar", "quitar", "espacio", "minus", "acentos"])
        i = self.rng.randrange(len(s))
        if op == "similar":
            cand = [j for j, c in enumerate(s) if c.upper() in self.SIMILARES]
            if cand:
                j = self.rng.choice(cand)
                return s[:j] + self.SIMILARES[s[j].upper()] + s[j + 1:]
            return s
        if op == "quitar" and len(s) > 3:
            return s[:i] + s[i + 1:]
        if op == "espacio":
            return s[:i] + " " + s[i:]
        if op == "minus":
            return s.lower()
        if op == "acentos":
            return sin_acentos(s)
        return s

    def numero(self, s: str) -> str:
        if self.rng.random() >= self.nivel / 2:
            return s
        idx = [i for i, c in enumerate(s) if c in self.CONFUSION_NUM]
        if not idx:
            return s
        i = self.rng.choice(idx)
        return s[:i] + self.CONFUSION_NUM[s[i]] + s[i + 1:]

    def ilegible(self, s: str) -> str:
        if not s:
            return "???"
        chars = list(s)
        k = max(2, len(chars) // 2)
        for i in self.rng.sample(range(len(chars)), min(k, len(chars))):
            chars[i] = self.rng.choice("?#*~_%")
        return "".join(chars)

    def valor(self, real: str, impreso: str | None = None, numerico: bool = False) -> tuple[str, str]:
        """(texto a imprimir, etiqueta). Si sale ilegible, la etiqueta es AUTO."""
        impreso = real if impreso is None else impreso
        if self.rng.random() < self.p_ilegible:
            return self.ilegible(impreso), A
        return (self.numero(impreso) if numerico else impreso), real

    def texto(self, lineas: list[str]) -> str:
        if self.nivel == 0:
            return "\n".join(lineas)
        sucias: list[str] = []
        for ln in lineas:
            if self.rng.random() < self.nivel * 0.3:
                sucias.append(self.rng.choice(["", "-----", "*****", "|  |", "~ ~ ~", ". . ."]))
            sucias.append(re.sub(" ", lambda _: " " * self.rng.choice([1, 1, 1, 2, 3]), ln))
        res, i = [], 0
        while i < len(sucias):  # el OCR a veces junta dos renglones
            if i + 1 < len(sucias) and sucias[i] and sucias[i + 1] and self.rng.random() < self.nivel * 0.15:
                res.append(sucias[i] + "  " + sucias[i + 1])
                i += 2
            else:
                res.append(sucias[i])
                i += 1
        return "\n".join(res)


# ---------------------------------------------------------------------------
# Generadores
# ---------------------------------------------------------------------------


def generar_ticket(rng: random.Random, plantilla: str, pool: dict, nivel: float):
    L = LAYOUTS_TICKET[plantilla]
    R = Ruido(rng, nivel)
    s = esqueleto()
    giro = rng.choice(list(GIROS))
    g = GIROS[giro]
    est = rng.choice(ESTILOS_IMPORTE)
    est_item = rng.choice(["plano", "coma"])
    cab: list[str] = []
    datos: list[str] = []
    cuerpo: list[str] = []
    pie: list[str] = []

    # Encabezado: nombre comercial y, a veces, razón social (que es el nombre fiscal)
    fisica = rng.random() < 0.6
    comercial = f"{rng.choice(g['prefijos'])} {rng.choice(pool['negocios'])}"
    t, nombre = R.valor(comercial)
    cab.append(t)
    if rng.random() < 0.35:
        razon = persona(rng, pool) if fisica else razon_social(rng, pool)
        t, lab = R.valor(razon)
        cab.append(t)
        if lab != A:
            nombre = lab
    s["Emisor"]["Nombre"] = nombre
    if rng.random() < 0.6:  # domicilio: no es LugarExpedicion (un ticket no es CFDI)
        cab.append(f"{rng.choice(CALLES)} {rng.randint(1, 900)}, COL. {rng.choice(COLONIAS)}")
        cab.append(f"{rng.choice(MUNICIPIOS)} C.P. {cp(rng)}")
    if rng.random() < 0.75:
        t, s["Emisor"]["Rfc"] = R.valor(rfc_sintetico(rng, fisica))
        cab.append(f"{R.etiqueta(L['rfc'])} {t}")

    # Folio y fecha
    if rng.random() < 0.85:
        folio = rng.choice([f"{rng.randint(1, 999999):06d}", str(rng.randint(100, 99999))])
        t, s["Folio"] = R.valor(folio)
        datos.append(f"{R.etiqueta(L['folio'])} {t}")
    if rng.random() < 0.92:
        impreso, iso = formatear_fecha(fecha_aleatoria(rng), rng.choice(L["fechas"]))
        t, s["Fecha"] = R.valor(iso, impreso)
        datos.append(f"{R.etiqueta(L['fecha_lbl'])} {t}".strip())
    if rng.random() < 0.3:
        datos.append(R.etiqueta(f"CAJA {rng.randint(1, 6)}"))

    # Conceptos
    maximo = 1 if giro == "gasolinera" else 6
    productos = rng.sample(g["productos"], k=min(len(g["productos"]), rng.randint(1, maximo)))
    imprime_items = rng.random() < 0.9
    if imprime_items and L["items"] == "tabla":
        cuerpo.append(R.etiqueta("CANT  DESCRIPCION  IMPORTE"))
    importes: list[Decimal] = []
    for desc, pmin, pmax, tipo in productos:
        cant = cantidad(rng, tipo)
        pu = precio(rng, pmin, pmax)
        imp = (cant * pu).quantize(CENT, rounding=ROUND_HALF_UP)
        importes.append(imp)
        if not imprime_items:
            continue
        c_txt = fmt_cant(cant, tipo)
        d_t, d_l = R.valor(desc)
        pu_t, pu_l = R.valor(dinero(pu), fmt_importe(dinero(pu), est_item), numerico=True)
        im_t, im_l = R.valor(dinero(imp), fmt_importe(dinero(imp), est_item), numerico=True)
        con = concepto_vacio()
        con["Descripcion"], con["Importe"] = d_l, im_l
        if L["items"] == "cant_x":
            cuerpo.append(f"{c_txt} x {pu_t}  {d_t}  {im_t}")
            con["Cantidad"], con["ValorUnitario"] = c_txt, pu_l
        elif L["items"] == "dos_lineas":
            cuerpo.append(d_t)
            cuerpo.append(f"  {c_txt} @ {pu_t}    {im_t}")
            con["Cantidad"], con["ValorUnitario"] = c_txt, pu_l
        elif L["items"] == "tabla":
            cuerpo.append(f"{c_txt}  {d_t}  {im_t}")
            con["Cantidad"] = c_txt
        else:  # solo_importe: no se imprime cantidad ni precio unitario
            cuerpo.append(f"{d_t} {'.' * rng.randint(2, 8)} {im_t}")
        s["Conceptos"].append(con)

    # Totales (precios con IVA incluido; el desglose solo existe si se imprime)
    total = sum(importes, Decimal("0"))
    if rng.random() < 0.5:
        sub = (total / Decimal("1.16")).quantize(CENT, rounding=ROUND_HALF_UP)
        iva = total - sub
        t, s["SubTotal"] = R.valor(dinero(sub), fmt_importe(dinero(sub), est), numerico=True)
        cuerpo.append(f"{R.etiqueta(L['sub'])} {t}")
        t, s["Impuestos"]["TotalImpuestosTrasladados"] = R.valor(dinero(iva), fmt_importe(dinero(iva), est), numerico=True)
        cuerpo.append(f"{R.etiqueta(L['iva'])} {t}")
    elif rng.random() < 0.4:
        cuerpo.append(R.etiqueta("IVA INCLUIDO"))
    if rng.random() < 0.3:
        cuerpo.append(f"{R.etiqueta('ARTICULOS:')} {len(productos)}")
    if rng.random() < 0.97:  # 3 %: el total no salió en la foto
        t, s["Total"] = R.valor(dinero(total), fmt_importe(dinero(total), est), numerico=True)
        cuerpo.append(f"{R.etiqueta(L['total'])} {t}")

    # Pago (en palabras -> FormaPagoLeida; la clave SAT la pone el código)
    if rng.random() < 0.7:
        forma = rng.choice(FORMAS_TICKET)
        cuerpo.append(f"{R.etiqueta(L['pago'])} {forma}")
        s["FormaPagoLeida"] = forma
        if forma == "EFECTIVO" and rng.random() < 0.6:
            recibido = (total / 50).to_integral_value(rounding=ROUND_CEILING) * 50
            if rng.random() < 0.3:
                recibido += rng.choice([50, 100, 200])
            cuerpo.append(f"{R.etiqueta(L['recibido'])} {fmt_importe(dinero(recibido), est)}")
            cuerpo.append(f"{R.etiqueta(L['cambio'])} {fmt_importe(dinero(recibido - total), est)}")
        elif forma.startswith("TARJETA") and rng.random() < 0.5:
            cuerpo.append(f"TARJ **** {rng.randint(1000, 9999)}  AUT {rng.randint(100000, 999999)}")
    if rng.random() < 0.15:
        cuerpo.append(f"{R.etiqueta('MONEDA:')} MXN")
        s["Moneda"] = "MXN"

    pie.append(R.etiqueta(L["pie"]))
    for extra in rng.sample(PIES_EXTRA, k=rng.randint(0, 2)):
        pie.append(R.etiqueta(extra))

    lineas = cab + (cuerpo + datos if L["fecha_abajo"] else datos + cuerpo) + pie
    return R.texto(lineas), s, {"giro": giro}


def generar_cfdi(rng: random.Random, plantilla: str, pool: dict, nivel: float):
    """Representación impresa de un CFDI 4.0 sintético: aquí las claves SÍ vienen impresas."""
    L = LAYOUTS_CFDI[plantilla]
    R = Ruido(rng, nivel)
    s = esqueleto()
    giro = rng.choice(list(GIROS))
    g = GIROS[giro]
    est = rng.choice(["coma", "plano", "signo_coma"])

    em_fis = rng.random() < 0.6
    em = {
        "Nombre": persona(rng, pool) if em_fis else razon_social(rng, pool),
        "Rfc": rfc_sintetico(rng, em_fis),
        "RegimenFiscal": ("626" if rng.random() < 0.7 else "612") if em_fis else "601",
    }
    lugar = cp(rng)
    if rng.random() < 0.3:
        rec = {"Rfc": "XAXX010101000", "Nombre": "PUBLICO EN GENERAL", "DomicilioFiscalReceptor": lugar,
               "RegimenFiscalReceptor": "616", "UsoCFDI": "S01"}
    else:
        rf = rng.random() < 0.6
        rec = {"Rfc": rfc_sintetico(rng, rf), "Nombre": persona(rng, pool) if rf else razon_social(rng, pool),
               "DomicilioFiscalReceptor": cp(rng),
               "RegimenFiscalReceptor": rng.choice(["612", "626"]) if rf else "601",
               "UsoCFDI": rng.choice(["G01", "G03"])}
    metodo = "PUE" if rng.random() < 0.85 else "PPD"
    forma = "99" if metodo == "PPD" else rng.choice(["01", "03", "04", "28"])
    serie = rng.choice(["A", "B", "F", "FA", ""])
    folio = str(rng.randint(1, 9999))
    dt = fecha_aleatoria(rng)
    uid = str(uuid.UUID(int=rng.getrandbits(128), version=4)).upper()

    conceptos = []
    sub = iva_total = Decimal("0")
    for desc, pmin, pmax, tipo in rng.sample(g["productos"], k=min(len(g["productos"]), rng.randint(1, 4))):
        cant = cantidad(rng, tipo)
        pu = (precio(rng, pmin, pmax) / Decimal("1.16")).quantize(CENT, rounding=ROUND_HALF_UP)
        imp = (cant * pu).quantize(CENT, rounding=ROUND_HALF_UP)
        sub += imp
        iva_total += (imp * Decimal("0.16")).quantize(CENT, rounding=ROUND_HALF_UP)
        conceptos.append((desc, tipo, cant, pu, imp))
    total = sub + iva_total

    lineas: list[str] = []

    def campo(etq, real, impreso=None, numerico=False, p=0.95):
        if rng.random() >= p:
            return None, A
        t, lab = R.valor(real, impreso, numerico)
        return f"{R.etiqueta(etq)} {t}", lab

    def poner(*args, **kw):
        ln, lab = campo(*args, **kw)
        if ln:
            lineas.append(ln)
        return lab

    def money(v: Decimal) -> tuple[str, str]:
        return dinero(v), fmt_importe(dinero(v), est)

    lineas.append(R.etiqueta(L["titulo"]))
    if L["serie_folio_junto"]:
        if poner(L["folio"], f"{serie}-{folio}" if serie else folio) != A:
            s["Serie"], s["Folio"] = (serie or A), folio
    else:
        if serie:
            s["Serie"] = poner(L["serie"], serie)
        s["Folio"] = poner(L["folio"], folio)

    col_em, col_re = [R.etiqueta(L["emisor_tit"])], [R.etiqueta(L["receptor_tit"])]
    for col, destino, etq, real, impreso, p in (
        (col_em, ("Emisor", "Nombre"), L["nombre"], em["Nombre"], None, 0.97),
        (col_em, ("Emisor", "Rfc"), "RFC:", em["Rfc"], None, 0.98),
        (col_em, ("Emisor", "RegimenFiscal"), L["regimen"], em["RegimenFiscal"], f"{em['RegimenFiscal']} - {REGIMEN[em['RegimenFiscal']]}", 0.95),
        (col_re, ("Receptor", "Nombre"), L["nombre"], rec["Nombre"], None, 0.97),
        (col_re, ("Receptor", "Rfc"), "RFC:", rec["Rfc"], None, 0.98),
        (col_re, ("Receptor", "DomicilioFiscalReceptor"), L["domicilio"], rec["DomicilioFiscalReceptor"], None, 0.9),
        (col_re, ("Receptor", "RegimenFiscalReceptor"), L["regimen_rec"], rec["RegimenFiscalReceptor"], f"{rec['RegimenFiscalReceptor']} - {REGIMEN[rec['RegimenFiscalReceptor']]}", 0.9),
        (col_re, ("Receptor", "UsoCFDI"), L["uso"], rec["UsoCFDI"], f"{rec['UsoCFDI']} - {USO_CFDI[rec['UsoCFDI']]}", 0.95),
    ):
        ln, lab = campo(etq, real, impreso, p=p)
        if ln:
            col.append(ln)
        s[destino[0]][destino[1]] = lab
    if L["dos_columnas"]:  # el OCR lee las dos columnas en el mismo renglón
        # Ancho según la línea más larga de la izquierda, con >= 4 espacios de separación:
        # con un ancho fijo, una razón social larga quedaba pegada a la otra columna ("CVnombre:").
        ancho = max(48, max(len(x) for x in col_em) + 4)
        for izq, der in itertools.zip_longest(col_em, col_re, fillvalue=""):
            lineas.append(f"{izq:<{ancho}}{der}".rstrip())
    else:
        lineas += col_em + col_re

    impreso, iso = formatear_fecha(dt, L["fecha_fmt"])
    s["Fecha"] = poner(L["fecha"], iso, impreso, p=0.97)
    s["LugarExpedicion"] = poner(L["lugar"], lugar, p=0.9)
    s["Complemento"]["TimbreFiscalDigital"]["UUID"] = poner(L["uuid"], uid, p=0.97)
    s["TipoDeComprobante"] = poner(L["tipo"], "I", "I - Ingreso", p=0.9)
    s["FormaPago"] = poner(L["forma"], forma, f"{forma} - {FORMA_PAGO[forma]}")
    s["MetodoPago"] = poner(L["metodo"], metodo, f"{metodo} - {METODO_PAGO[metodo]}")
    s["Moneda"] = poner(L["moneda"], "MXN", rng.choice(["MXN", "MXN - Peso Mexicano"]), p=0.9)
    s["Exportacion"] = poner(L["exportacion"], "01", "01 - No aplica", p=0.8)
    s["Version"] = poner(L["version"], "4.0", p=0.8)

    lineas.append(R.etiqueta(L["tabla"]))
    for desc, tipo, cant, pu, imp in conceptos:
        cu, unom = UNIDAD[tipo]
        con = concepto_vacio()
        partes = []
        for clave, real, impreso_c, num in (
            ("ClaveProdServ", CLAVE_PROD_GENERICA, None, False),
            ("Cantidad", fmt_cant(cant, tipo), None, False),
            ("ClaveUnidad", cu, f"{cu} {unom}" if L["unidad_nombre"] else cu, False),
            ("Descripcion", desc, None, False),
            ("ValorUnitario", *money(pu), True),
            ("Importe", *money(imp), True),
            ("ObjetoImp", "02", None, False),
        ):
            t, lab = R.valor(real, impreso_c, num)
            partes.append(t)
            con[clave] = lab
        lineas.append("  ".join(partes))
        s["Conceptos"].append(con)

    s["SubTotal"] = poner(L["subtotal"], *money(sub), True, p=0.98)
    if L["iva_detalle"]:
        detalle = f"002 IVA  Tasa  0.160000  Base {fmt_importe(dinero(sub), est)}  Importe {fmt_importe(dinero(iva_total), est)}"
        if poner(L["traslado"], "ok", detalle, p=0.95) != A:
            s["Impuestos"]["Traslados"] = [{"Base": dinero(sub), "Impuesto": "002", "TipoFactor": "Tasa",
                                            "TasaOCuota": "0.160000", "Importe": dinero(iva_total)}]
    s["Impuestos"]["TotalImpuestosTrasladados"] = poner(L["iva"], *money(iva_total), True, p=0.97)
    s["Total"] = poner(L["total"], *money(total), True, p=0.99)

    lineas.append(R.etiqueta("Sello digital del CFDI:"))
    lineas.append("".join(rng.choice(string.ascii_letters + string.digits + "+/") for _ in range(76)))
    lineas.append(f"{R.etiqueta('No. de serie del certificado del SAT:')} {''.join(rng.choice(string.digits) for _ in range(20))}")
    lineas.append(R.etiqueta("Este documento es una representación impresa de un CFDI"))
    return R.texto(lineas), s, {"giro": giro}


def generar_ilegible(rng: random.Random, plantilla: str, pool: dict, nivel: float):
    """Foto movida o recortada: el OCR no saca nada útil."""
    if rng.random() < 0.15:
        return "", esqueleto(), {"giro": None}
    frag = ["T0T", "GRAC", "$", "##", "...", "IVA", "F0L", "~~", "||", "RF", "C0M", "*", "%%"]
    lineas = []
    for _ in range(rng.randint(2, 12)):
        trozos = []
        for _ in range(rng.randint(1, 5)):
            basura = "".join(rng.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ?#*") for _ in range(rng.randint(2, 6)))
            trozos.append(rng.choice(frag + [basura]))
        lineas.append(" ".join(trozos))
    return "\n".join(lineas), esqueleto(), {"giro": None}


def generar_no_comprobante(rng: random.Random, plantilla: str, pool: dict, nivel: float):
    """Papel que no es comprobante (aunque traiga precios): todo AUTO."""
    R = Ruido(rng, nivel)
    neg = rng.choice(pool["negocios"])
    if plantilla == "N1":  # menú
        lineas = [f"COCINA {neg}", "MENU DEL DIA"] + [
            f"{rng.choice(['SOPA DE FIDEO', 'CALDO DE POLLO', 'ARROZ ROJO', 'ENMOLADAS', 'MOLE AMARILLO', 'TAMALES', 'FRIJOLES CHARROS'])}"
            for _ in range(rng.randint(2, 5))
        ] + [f"COMIDA CORRIDA ${rng.choice([75, 80, 85, 90, 95])}", "AGUA DEL DIA INCLUIDA"]
    elif plantilla == "N2":  # lista de compras
        lineas = ["LISTA"] + [
            f"{rng.choice(['1', '2', '3', '1/2'])} {rng.choice(['KG', 'PAQ', 'LT', 'PZ'])} "
            f"{rng.choice(['MAIZ', 'FRIJOL', 'CACAO', 'AZUCAR', 'ACEITE', 'CAFE', 'JABON', 'VELAS'])}"
            for _ in range(rng.randint(3, 8))
        ]
    elif plantilla == "N3":  # aviso
        lineas = [rng.choice(["SE RENTA LOCAL", "SE VENDE TERRENO", "SE SOLICITA AYUDANTE", "SE TRASPASA NEGOCIO"]),
                  rng.choice(["INFORMES EN EL LOCAL", "PREGUNTE POR DON " + rng.choice(pool["nombres"]), "TRATO DIRECTO"]),
                  rng.choice(["", "SIN INTERMEDIARIOS", "BUENA UBICACION"])]
    elif plantilla == "N4":  # horario / recado (val)
        lineas = [f"{rng.choice(['FARMACIA', 'TIENDA', 'TALLER'])} {neg}", "HORARIO DE ATENCION",
                  f"LUN A VIE {rng.choice(['8:00', '9:00', '10:00'])} A {rng.choice(['18:00', '19:00', '20:00'])}",
                  f"SAB {rng.choice(['9:00', '10:00'])} A {rng.choice(['14:00', '15:00'])}",
                  rng.choice(["DOMINGO CERRADO", "CERRADO POR INVENTARIO EL DIA 30", "REGRESO EN 15 MINUTOS"])]
    else:  # N5: volante de promoción (test)
        lineas = [rng.choice(["GRAN OFERTA", "PROMOCION", "SOLO ESTA SEMANA"]),
                  f"2X1 EN {rng.choice(['REFRESCOS', 'PAN DULCE', 'TAMALES', 'COPIAS'])}",
                  f"PRECIO ESPECIAL ${rng.choice(['49.90', '99.00', '19.50', '150.00'])}",
                  "VIGENCIA HASTA AGOTAR EXISTENCIAS", f"VISITANOS EN {neg}"]
    lineas = [R.etiqueta(x) for x in lineas if x]
    return R.texto(lineas), esqueleto(), {"giro": None}


GENERADORES = {
    "ticket": generar_ticket,
    "cfdi": generar_cfdi,
    "ilegible": generar_ilegible,
    "no_comprobante": generar_no_comprobante,
}

# ---------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------

CAMPOS_RESUMEN = {
    "Fecha": lambda s: s["Fecha"],
    "Total": lambda s: s["Total"],
    "SubTotal": lambda s: s["SubTotal"],
    "Emisor.Rfc": lambda s: s["Emisor"]["Rfc"],
    "Emisor.Nombre": lambda s: s["Emisor"]["Nombre"],
    "FormaPago": lambda s: s["FormaPago"],
    "FormaPagoLeida": lambda s: s["FormaPagoLeida"],
    "UUID": lambda s: s["Complemento"]["TimbreFiscalDigital"]["UUID"],
}


def main() -> None:
    p = argparse.ArgumentParser(description="Dataset SINTÉTICO texto OCR -> JSON CFDI para el asistente de Dzuun.")
    p.add_argument("--salida", type=Path, default=Path(__file__).resolve().parent / "dataset")
    p.add_argument("--n-train", type=int, default=1600)
    p.add_argument("--n-val", type=int, default=200)
    p.add_argument("--n-test", type=int, default=200)
    p.add_argument("--semilla", type=int, default=2026)
    p.add_argument("--max-chars", type=int, default=4000,
                   help="descarta ejemplos más largos (aprox. para no pasar la secuencia de entrenamiento; "
                        "verificar con el tokenizador real)")
    p.add_argument("--sobrescribir", action="store_true")
    a = p.parse_args()

    a.salida.mkdir(parents=True, exist_ok=True)
    archivos = {s: a.salida / f"{s}.jsonl" for s in ("train", "val", "test")}
    if not a.sobrescribir and any(f.exists() for f in archivos.values()):
        sys.exit(f"Ya existen archivos en {a.salida}. Usa --sobrescribir para reemplazarlos.")

    pools = pools_por_split(a.semilla)
    vistos: set[str] = set()
    resumen_splits = {}

    for split, n in (("train", a.n_train), ("val", a.n_val), ("test", a.n_test)):
        rng = random.Random(f"{a.semilla}-{split}")
        filas: list[dict] = []
        dup = largos = intentos = 0
        while len(filas) < n:
            intentos += 1
            if intentos > max(1000, n * 20):
                sys.exit(f"{split}: demasiados descartes (duplicados {dup}, largos {largos}).")
            tipo = rng.choices(TIPOS, PESOS)[0]
            plantilla = rng.choice(PLANTILLAS[split][tipo])
            nivel = rng.choice(NIVELES_RUIDO)
            texto, salida, extra = GENERADORES[tipo](rng, plantilla, pools[split], nivel)

            huella = hashlib.sha256(texto.encode("utf-8")).hexdigest()
            if huella in vistos:
                dup += 1
                continue
            ident = f"{split}-{len(filas):05d}"
            validar(salida, ident)
            fila = {
                "id": ident,
                "messages": [
                    {"role": "system", "content": PROMPT_SISTEMA},
                    {"role": "user", "content": mensaje_usuario(texto)},
                    {"role": "assistant", "content": json.dumps(salida, ensure_ascii=False, separators=(",", ":"))},
                ],
                "meta": {"tipo": tipo, "plantilla": plantilla, "giro": extra["giro"], "nivel_ruido": nivel,
                         "sintetico": True, "generador": Path(__file__).name, "semilla": a.semilla},
            }
            if sum(len(m["content"]) for m in fila["messages"]) > a.max_chars:
                largos += 1
                continue
            vistos.add(huella)
            filas.append(fila)

        with archivos[split].open("w", encoding="utf-8") as f:
            for fila in filas:
                f.write(json.dumps(fila, ensure_ascii=False) + "\n")

        utiles = [json.loads(x["messages"][2]["content"]) for x in filas if x["meta"]["tipo"] in ("ticket", "cfdi")]
        resumen_splits[split] = {
            "total": len(filas),
            "por_tipo": dict(Counter(x["meta"]["tipo"] for x in filas)),
            "por_plantilla": dict(Counter(x["meta"]["plantilla"] for x in filas)),
            "por_giro": dict(Counter(x["meta"]["giro"] for x in filas if x["meta"]["giro"])),
            "por_nivel_ruido": {str(k): v for k, v in Counter(x["meta"]["nivel_ruido"] for x in filas).items()},
            "pct_auto_en_tickets_y_cfdi": {
                k: round(100 * sum(1 for s in utiles if f(s) == A) / len(utiles), 1) if utiles else None
                for k, f in CAMPOS_RESUMEN.items()
            },
            "conceptos_promedio": round(sum(len(s["Conceptos"]) for s in utiles) / len(utiles), 2) if utiles else None,
            "descartados_duplicado": dup,
            "descartados_largo": largos,
            "nombres_negocio": pools[split]["negocios"],
        }
        print(f"{split}: {len(filas)} ejemplos -> {archivos[split]}")

    resumen = {
        "descripcion": "Dataset SINTÉTICO texto OCR -> JSON CFDI (tarea a, CLAUDE.md sec. 17).",
        "sintetico": True,
        "generador": Path(__file__).name,
        "sha256_generador": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "semilla": a.semilla,
        "generado": datetime.now().isoformat(timespec="seconds"),
        "division": "por plantilla y por grupo de nombres; sin textos repetidos entre splits (sha256)",
        "plantillas_por_split": PLANTILLAS,
        "pesos_por_tipo": dict(zip(TIPOS, PESOS)),
        "splits": resumen_splits,
    }
    (a.salida / "resumen.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"resumen -> {a.salida / 'resumen.json'}")


if __name__ == "__main__":
    main()

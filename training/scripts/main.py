import argparse
import glob
import json
import math
import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

RAIZ = Path(__file__).resolve().parents[1]

CDN_FUENTES = [
    "https://raw.githubusercontent.com/google/fonts/main/ofl/",
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/",
]

# Todas OFL. El factor compensa fuentes que dibujan glifos más chicos o más grandes a igual tamaño.
FUENTES_GOOGLE = {
    "VT323": ("vt323/VT323-Regular.ttf", 1.25),
    "ShareTechMono": ("sharetechmono/ShareTechMono-Regular.ttf", 1.0),
    "CourierPrime": ("courierprime/CourierPrime-Regular.ttf", 0.95),
    "IBMPlexMono": ("ibmplexmono/IBMPlexMono-Regular.ttf", 0.95),
    "CutiveMono": ("cutivemono/CutiveMono-Regular.ttf", 1.0),
    "SpaceMono": ("spacemono/SpaceMono-Regular.ttf", 0.9),
    "AnonymousPro": ("anonymouspro/AnonymousPro-Regular.ttf", 1.05),
    "FragmentMono": ("fragmentmono/FragmentMono-Regular.ttf", 0.95),
    "PTMono": ("ptmono/PTM55FT.ttf", 0.95),
    "XanhMono": ("xanhmono/XanhMono-Regular.ttf", 1.0),
    "SyneMono": ("synemono/SyneMono-Regular.ttf", 1.0),
}

SPLITS = ("train", "val", "test")
RATIOS_TICKETS = (0.8, 0.1, 0.1)
# Los catálogos se reparten con más peso en val/test que los tickets para que test tenga variedad propia.
RATIOS_CATALOGO = (0.7, 0.15, 0.15)

NOMBRES_COMERCIO = [
    "DON PEPE", "LA ESPERANZA", "EL AHORRO", "LA GUADALUPANA", "SAN JOSE", "SANTA ROSA",
    "LOS ARCOS", "EL SOL", "LA LUNA", "DEL VALLE", "LA ESTRELLA", "EL PROGRESO",
    "LA PROVIDENCIA", "LAS FLORES", "EL CARMEN", "DONA MARY", "DON CHUCHO", "LA ROSITA",
    "LOS PINOS", "EL ROBLE", "SAN FELIPE", "SANTA LUCIA", "LA ANTEQUERA", "MONTE ALBAN",
    "EL TULE", "LA SOLEDAD", "DEL CENTRO", "DEL SUR", "LA MERCED", "LA CHINITA",
    "EL GUERO", "LOS COMPADRES", "LA FAVORITA", "EL TRIUNFO", "LA ECONOMICA", "SAN MARTIN",
    "LA PALMA", "EL MIRADOR", "LOS ANGELES", "VILLA DE ETLA", "EL PARIAN", "LA CASCADA",
    "SAN ANTONIO", "LA JOYA", "EL NOPAL", "LOS TRES HERMANOS", "LA HUERTA", "EL FARO",
]

CALLES = [
    "JUAREZ", "HIDALGO", "MORELOS", "REFORMA", "INDEPENDENCIA", "MACEDONIO ALCALA",
    "PORFIRIO DIAZ", "NINOS HEROES", "UNIVERSIDAD", "LIBERTAD", "GUERRERO", "ALLENDE",
    "ABASOLO", "ALDAMA", "MATAMOROS", "BUSTAMANTE", "ARMENTA Y LOPEZ", "TINOCO Y PALACIOS",
    "VICENTE SUAREZ", "EDUARDO MATA", "FERROCARRIL", "SIMBOLOS PATRIOS", "MAGNOLIAS",
]
TIPOS_CALLE = ["AV.", "CALLE", "C.", "BLVD.", "CALZ.", "PRIV.", "AND."]
COLONIAS = [
    "CENTRO", "REFORMA", "JALATLACO", "XOCHIMILCO", "LA CASCADA", "VOLCANES", "AMERICA",
    "EX MARQUESADO", "SAN FELIPE", "EL ROSARIO", "PRESIDENTES", "LIBERTAD", "LAS FLORES",
]
CIUDADES = [
    "OAXACA DE JUAREZ, OAX.", "SANTA LUCIA DEL CAMINO, OAX.", "SANTA CRUZ XOXOCOTLAN, OAX.",
    "SAN ANTONIO DE LA CAL, OAX.", "TLALIXTAC DE CABRERA, OAX.", "VILLA DE ZAACHILA, OAX.",
]
MESEROS = ["ANA", "LUIS", "CARMEN", "JORGE", "LUPITA", "MIGUEL", "ROSA", "PEDRO", "SOFIA"]
MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

GIROS = {
    "abarrotes": {
        "peso": 3,
        "prefijos": ["ABARROTES", "MINISUPER", "TIENDA", "SUPER", "MISCELANEA", "COMERCIAL"],
        "items": (3, 9),
        "productos": [
            ("LECHE ENTERA 1L", 26.50), ("LECHE DESLACTOSADA 1L", 29.00), ("PAN BLANCO GDE", 44.00),
            ("PAN INTEGRAL", 49.00), ("HUEVO BLANCO 12PZ", 49.50), ("CAFE SOLUBLE 100G", 68.00),
            ("ARROZ EXTRA 1KG", 29.50), ("FRIJOL NEGRO 1KG", 38.00), ("FRIJOL PINTO 1KG", 36.00),
            ("ACEITE VEGETAL 900ML", 45.00), ("AZUCAR ESTANDAR 1KG", 32.00), ("SAL DE MESA 1KG", 15.50),
            ("ATUN EN AGUA 140G", 21.50), ("SARDINA TOMATE 425G", 34.00), ("YOGURT NATURAL 1L", 38.00),
            ("QUESO PANELA 250G", 52.00), ("QUESILLO 250G", 58.00), ("JAMON DE PAVO 250G", 55.00),
            ("SALCHICHA 500G", 47.00), ("TORTILLA MAIZ 1KG", 24.00), ("TOSTADAS 30PZ", 35.00),
            ("GALLETAS MARIAS", 19.00), ("GALLETAS AVENA", 23.00), ("CEREAL MAIZ 500G", 33.00),
            ("AVENA HOJUELAS 400G", 27.00), ("PASTA SPAGHETTI 200G", 12.50), ("PASTA CODITO 200G", 12.00),
            ("SOPA INSTANTANEA 64G", 12.00), ("CONSOME POLLO 12PZ", 18.00), ("PURE TOMATE 210G", 9.50),
            ("CHILES JALAPENOS 220G", 17.00), ("MAYONESA 390G", 39.00), ("CATSUP 680G", 31.00),
            ("REFRESCO COLA 2L", 34.00), ("AGUA NATURAL 1.5L", 15.00), ("AGUA MINERAL 1.5L", 22.00),
            ("JUGO NARANJA 1L", 27.50), ("PAPAS FRITAS 170G", 41.00), ("CHOCOLATE MESA 6PZ", 48.00),
            ("JABON DE BARRA", 18.00), ("DETERGENTE POLVO 1KG", 39.00), ("PAPEL HIGIENICO 4R", 36.00),
            ("CLORO 1L", 16.00), ("SUAVIZANTE 850ML", 29.00), ("SERVILLETAS 250PZ", 21.00),
        ],
    },
    "gasolinera": {
        "peso": 1,
        "prefijos": ["GASOLINERA", "ESTACION DE SERVICIO", "SERVICIO", "GASOLINERIA"],
        "items": (1, 3),
        "productos": [
            ("MAGNA", 23.89), ("PREMIUM", 25.79), ("DIESEL", 25.49), ("GASOLINA REGULAR", 23.79),
            ("GASOLINA PREMIUM", 25.69), ("MAGNA SIN PLOMO", 23.95), ("DIESEL AUTOMOTRIZ", 25.55),
            ("REGULAR 87 OCT", 23.85), ("PREMIUM 91 OCT", 25.75), ("ACEITE MOTOR 1L", 145.00),
            ("ADITIVO GASOLINA", 89.00), ("ANTICONGELANTE 1L", 98.00), ("LIMPIAPARABRISAS 1L", 45.00),
            ("LIQUIDO FRENOS", 79.00), ("AGUA DESTILADA 4L", 38.00),
        ],
    },
    "papeleria": {
        "peso": 1,
        "prefijos": ["PAPELERIA", "PAPELERIA Y REGALOS", "CENTRO DE COPIADO", "PAPELERIA E IMPRESIONES"],
        "items": (2, 8),
        "productos": [
            ("CUADERNO PROF RAYA", 38.00), ("CUADERNO FRANCES CUAD", 29.00), ("HOJAS CARTA 500", 115.00),
            ("HOJAS OFICIO 100", 32.00), ("PLUMA AZUL", 7.50), ("PLUMA NEGRA", 7.50), ("LAPIZ NO 2", 5.00),
            ("BORRADOR BLANCO", 6.00), ("SACAPUNTAS METALICO", 9.00), ("MARCATEXTOS AMARILLO", 14.00),
            ("CORRECTOR LIQUIDO", 19.00), ("PEGAMENTO BARRA 40G", 24.00), ("TIJERAS ESCOLARES", 22.00),
            ("REGLA 30CM", 10.00), ("FOLDER CARTA", 3.50), ("SOBRE MANILA CARTA", 4.00),
            ("CINTA ADHESIVA", 16.00), ("CLIPS 100PZ", 18.00), ("GRAPAS 1000PZ", 21.00),
            ("ENGRAPADORA", 95.00), ("CARTULINA BLANCA", 8.00), ("PLUMONES 12PZ", 65.00),
            ("COLORES 24PZ", 79.00), ("CALCULADORA BASICA", 120.00), ("IMPRESION B/N", 2.00),
            ("IMPRESION COLOR", 8.00), ("COPIA CARTA", 1.00), ("ENGARGOLADO", 35.00),
            ("MEMORIA USB 32GB", 149.00), ("ETIQUETAS ADHESIVAS", 26.00),
        ],
    },
    "restaurante": {
        "peso": 1,
        "prefijos": ["RESTAURANTE", "FONDA", "COCINA ECONOMICA", "COMEDOR", "CAFETERIA", "TLAYUDERIA"],
        "items": (2, 7),
        "productos": [
            ("ENCHILADAS VERDES", 95.00), ("ENCHILADAS DE MOLE", 110.00), ("TLAYUDA SENCILLA", 85.00),
            ("TLAYUDA CON TASAJO", 140.00), ("MOLE NEGRO", 150.00), ("MOLE COLORADITO", 140.00),
            ("TAMAL DE MOLE", 35.00), ("CALDO DE RES", 120.00), ("CHILES RELLENOS", 115.00),
            ("TACOS AL PASTOR", 75.00), ("TACOS DE CECINA", 90.00), ("QUESADILLA", 55.00),
            ("MEMELAS 3PZ", 60.00), ("ENFRIJOLADAS", 85.00), ("CHILAQUILES ROJOS", 90.00),
            ("CHILAQUILES VERDES", 90.00), ("HUEVOS RANCHEROS", 80.00), ("MOLLETES", 70.00),
            ("TORTA MILANESA", 75.00), ("AGUA DE HORCHATA", 30.00), ("AGUA DE JAMAICA", 30.00),
            ("AGUA CHILACAYOTA", 35.00), ("CHOCOLATE DE AGUA", 40.00), ("CAFE DE OLLA", 30.00),
            ("REFRESCO 355ML", 30.00), ("CERVEZA 355ML", 45.00), ("MEZCAL ESPADIN", 80.00),
            ("ATOLE BLANCO", 25.00), ("PAN DE YEMA", 20.00), ("FLAN NAPOLITANO", 45.00),
            ("ARROZ CON LECHE", 40.00),
        ],
    },
    "proveedor": {
        "peso": 2,
        "prefijos": ["DISTRIBUIDORA", "COMERCIALIZADORA", "ABASTOS", "MAYORISTA", "BODEGA"],
        "items": (2, 7),
        "productos": [
            ("CAJA REFRESCO 24PZ", 310.00), ("BULTO AZUCAR 50KG", 1350.00), ("BULTO HARINA 44KG", 820.00),
            ("COSTAL FRIJOL 25KG", 860.00), ("CAJA ACEITE 12PZ", 480.00), ("CAJA LECHE 12PZ", 290.00),
            ("PAQ SERVILLETAS 500", 68.00), ("VASO DESECH 50PZ", 32.00), ("CHAROLA UNICEL 25PZ", 45.00),
            ("BOLSA PLASTICO 1KG", 58.00), ("CAJA GALLETAS 20PZ", 210.00), ("CARTON HUEVO 30PZ", 115.00),
            ("BULTO ARROZ 25KG", 640.00), ("GARRAFON AGUA 20L", 42.00), ("CAJA DETERGENTE 10PZ", 330.00),
            ("PAQ PAPEL HIG 48R", 380.00), ("CAJA CERVEZA 24PZ", 420.00), ("CAJA JUGO 24PZ", 360.00),
            ("BOTE CHILES 2.8KG", 125.00), ("CAJA ATUN 48PZ", 890.00), ("CAJA SOPA INST 12PZ", 120.00),
            ("BOLSA HIELO 5KG", 35.00), ("CAJA CAFE SOL 12PZ", 690.00), ("CAJA CLORO 12L", 150.00),
        ],
    },
    "farmacia": {
        "peso": 1,
        "prefijos": ["FARMACIA", "FARMACIAS", "BOTICA"],
        "items": (1, 6),
        "productos": [
            ("PARACETAMOL 500MG 10T", 35.00), ("IBUPROFENO 400MG 10T", 42.00), ("NAPROXENO 250MG", 48.00),
            ("LORATADINA 10MG 10T", 39.00), ("OMEPRAZOL 20MG 7C", 55.00), ("SUERO ORAL 500ML", 22.00),
            ("ALCOHOL 250ML", 28.00), ("AGUA OXIGENADA 230ML", 19.00), ("GASAS 10PZ", 26.00),
            ("VENDA ELASTICA 5CM", 24.00), ("CURITAS 20PZ", 31.00), ("TERMOMETRO DIGITAL", 99.00),
            ("CUBREBOCAS 10PZ", 45.00), ("GEL ANTIBACTERIAL", 38.00), ("PASTA DENTAL 100ML", 34.00),
            ("CEPILLO DENTAL", 25.00), ("SHAMPOO 400ML", 62.00), ("PANALES ETAPA 3", 189.00),
            ("TOALLAS HUMEDAS 80", 49.00), ("VITAMINA C 1G", 89.00), ("JARABE TOS 120ML", 95.00),
            ("POMADA ROZADURAS", 58.00),
        ],
    },
    "ferreteria": {
        "peso": 1,
        "prefijos": ["FERRETERIA", "TLAPALERIA", "MATERIALES", "FERRETERIA Y PINTURAS"],
        "items": (2, 7),
        "productos": [
            ("CEMENTO GRIS 50KG", 245.00), ("CAL 25KG", 95.00), ("VARILLA 3/8", 165.00),
            ("ALAMBRE RECOCIDO KG", 42.00), ("CLAVO 2.5 PULG KG", 48.00), ("TORNILLO 1/4 100PZ", 65.00),
            ("TAQUETE 1/4 100PZ", 39.00), ("CINTA AISLAR", 18.00), ("CABLE CAL 12 MT", 14.50),
            ("APAGADOR SENCILLO", 32.00), ("CONTACTO DOBLE", 38.00), ("FOCO LED 9W", 35.00),
            ("TUBO PVC 1/2", 58.00), ("CODO PVC 1/2", 6.50), ("PEGAMENTO PVC", 49.00),
            ("LLAVE DE PASO 1/2", 115.00), ("PINTURA VINILICA 4L", 389.00), ("BROCHA 3 PULG", 42.00),
            ("RODILLO 9 PULG", 68.00), ("THINNER 1L", 45.00), ("LIJA AGUA 120", 9.00),
            ("SILICON TRANSPARENTE", 72.00), ("CANDADO 40MM", 95.00), ("FLEXOMETRO 5M", 85.00),
        ],
    },
}


def crear_sesion_resiliente():
    sesion = requests.Session()
    reintentos = Retry(total=3, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504])
    sesion.mount("https://", HTTPAdapter(max_retries=reintentos))
    return sesion


def preparar_fuentes(dir_cache):
    dir_cache.mkdir(parents=True, exist_ok=True)
    sesion = crear_sesion_resiliente()
    rutas = {}

    for nombre, (ruta_repo, escala) in FUENTES_GOOGLE.items():
        destino = dir_cache / Path(ruta_repo).name
        if not (destino.exists() and destino.stat().st_size > 0):
            for base in CDN_FUENTES:
                try:
                    print(f"Descargando {nombre} desde {base.split('/')[2]}...")
                    resp = sesion.get(base + ruta_repo, timeout=(10, 60))
                    resp.raise_for_status()
                    destino.write_bytes(resp.content)
                    break
                except requests.RequestException as e:
                    print(f"  Aviso: fallo al descargar desde {base.split('/')[2]} ({e})")
        if destino.exists() and destino.stat().st_size > 0:
            rutas[nombre] = (str(destino), escala)
        else:
            print(f"  Omitiendo {nombre} por error de red.")

    if not rutas:
        print("Usando fuentes monoespaciadas locales del sistema...")
        fuentes_sistema = sorted(glob.glob("/usr/share/fonts/**/*Mono*.ttf", recursive=True))
        if not fuentes_sistema:
            raise RuntimeError(
                "No se pudieron descargar fuentes ni se encontraron fuentes Mono en /usr/share/fonts."
            )
        for idx, ruta_sys in enumerate(fuentes_sistema[:4]):
            rutas[f"SistemaMono_{idx}"] = (ruta_sys, 0.95)

    return rutas


def particionar(elementos, ratios):
    elementos = sorted(elementos)
    random.shuffle(elementos)
    n = len(elementos)
    n_val = max(1, round(n * ratios[1]))
    n_test = max(1, round(n * ratios[2]))
    n_train = n - n_val - n_test
    if n_train < 1:
        raise ValueError(f"Catálogo demasiado chico para repartir en train/val/test: {n} elementos")
    return {
        "train": elementos[:n_train],
        "val": elementos[n_train : n_train + n_val],
        "test": elementos[n_train + n_val :],
    }


def iniciales_rfc(nombre):
    vacias = {"LA", "EL", "LOS", "LAS", "DE", "DEL", "Y", "E"}
    palabras = [p for p in nombre.replace(".", " ").split() if p not in vacias and p.isalpha()]
    letras = "".join(p[0] for p in palabras)[:3]
    return letras.ljust(3, "X")


def generar_rfc(nombre_comercio):
    # Formato de persona moral (3 letras) o física (4 letras) + AAMMDD + homoclave. Inventados.
    alfanum = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
    if random.random() < 0.5:
        letras = iniciales_rfc(nombre_comercio)
    else:
        letras = "".join(random.choice("ABCDEFGHIJKLMNOPRSTUVZ") for _ in range(4))
    nacimiento = datetime(1985, 1, 1) + timedelta(days=random.randint(0, 13000))
    homoclave = "".join(random.choice(alfanum) for _ in range(3))
    return f"{letras}{nacimiento:%y%m%d}{homoclave}"


def generar_direccion():
    linea1 = f"{random.choice(TIPOS_CALLE)} {random.choice(CALLES)} #{random.randint(1, 1999)}"
    if random.random() < 0.7:
        linea1 += f", COL. {random.choice(COLONIAS)}"
    linea2 = f"C.P. {random.randint(68000, 68299)} {random.choice(CIUDADES)}"
    return [linea1, linea2] if random.random() < 0.6 else [linea1]


def construir_catalogos():
    nombres = particionar(NOMBRES_COMERCIO, RATIOS_CATALOGO)
    comercios = {}
    productos = {}
    for giro, cfg in GIROS.items():
        comercios[giro] = {}
        for split in SPLITS:
            lista = []
            for nombre in nombres[split]:
                completo = f"{random.choice(cfg['prefijos'])} {nombre}"
                lista.append(
                    {"nombre": completo, "direccion": generar_direccion(), "rfc": generar_rfc(completo)}
                )
            comercios[giro][split] = lista
        productos[giro] = particionar(cfg["productos"], RATIOS_CATALOGO)
    return nombres, comercios, productos


def asignar_splits(cantidad):
    n_val = round(cantidad * RATIOS_TICKETS[1])
    n_test = round(cantidad * RATIOS_TICKETS[2])
    asignacion = ["val"] * n_val + ["test"] * n_test
    asignacion += ["train"] * (cantidad - len(asignacion))
    random.shuffle(asignacion)
    return asignacion


def generar_ruido_papel(ancho, alto):
    tono_base = random.choice([[246, 245, 242], [242, 240, 234], [248, 248, 246], [238, 236, 229]])
    base_color = np.array(tono_base, dtype=np.float32)
    ruido = np.random.normal(0, random.uniform(3.5, 6.0), (alto, ancho, 1))
    return Image.fromarray(np.clip(base_color + ruido, 0, 255).astype(np.uint8), "RGB")


def aplicar_efecto_termico(imagen):
    imagen = imagen.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.3, 0.65)))
    arr = np.array(imagen, dtype=np.float32)
    alto = arr.shape[0]
    # Franjas horizontales más claras: desgaste del cabezal térmico.
    for _ in range(random.randint(2, 9)):
        y = random.randint(0, alto - 1)
        grosor = random.randint(1, 2)
        arr[y : y + grosor, :, :] = np.clip(arr[y : y + grosor, :, :] + random.randint(8, 22), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def rotar_poligono(bbox, angulo_grados, ancho_orig, alto_orig, ancho_nuevo, alto_nuevo):
    # Image.rotate gira en sentido antihorario con el eje y hacia abajo; por eso el ángulo va negado.
    x1, y1, x2, y2 = bbox
    rad = math.radians(-angulo_grados)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    cx_o, cy_o = ancho_orig / 2.0, alto_orig / 2.0
    cx_n, cy_n = ancho_nuevo / 2.0, alto_nuevo / 2.0
    puntos = []
    for x, y in [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]:
        dx, dy = x - cx_o, y - cy_o
        rx = dx * cos_a - dy * sin_a + cx_n
        ry = dx * sin_a + dy * cos_a + cy_n
        puntos.append([round(min(max(rx, 0.0), ancho_nuevo), 1), round(min(max(ry, 0.0), alto_nuevo), 1)])
    return puntos


class Lienzo:
    def __init__(self, ancho, ruta_fuente, escala_fuente, color):
        self.ancho = ancho
        self.margen = max(14, int(ancho * 0.055))
        self.img = generar_ruido_papel(ancho, 2600)
        self.draw = ImageDraw.Draw(self.img)
        self.ruta_fuente = ruta_fuente
        self.escala = escala_fuente * ancho / 440
        self.color = color
        self.y = 24
        self.linea = 0
        self.segmentos = []
        self._fuentes = {}

    @property
    def util(self):
        return self.ancho - 2 * self.margen

    def fuente(self, puntos):
        tam = max(8, int(round(puntos * self.escala)))
        if tam not in self._fuentes:
            self._fuentes[tam] = ImageFont.truetype(self.ruta_fuente, tam)
        return self._fuentes[tam]

    def ajustar(self, textos, puntos, minimo=9):
        # Reduce la fuente hasta que los textos de la fila quepan con una separación mínima entre ellos.
        p = puntos
        while True:
            f = self.fuente(p)
            hueco = f.getlength("  ") * (len(textos) - 1)
            if sum(f.getlength(t) for t in textos) + hueco <= self.util or p <= minimo:
                return f
            p -= 1

    def recortar(self, texto, fuente, max_ancho):
        while texto and fuente.getlength(texto) > max_ancho:
            texto = texto[:-1]
        return texto.rstrip()

    def _escribir(self, x, texto, fuente, etiqueta, color=None):
        texto = texto.strip()
        if not texto:
            return
        self.draw.text((x, self.y), texto, font=fuente, fill=color or self.color)
        bbox = self.draw.textbbox((x, self.y), texto, font=fuente)
        self.segmentos.append(
            {"texto": texto, "etiqueta": etiqueta, "linea": self.linea, "bbox": [float(v) for v in bbox]}
        )

    def _ignorar(self, bbox):
        self.segmentos.append(
            {"texto": "###", "etiqueta": "IGNORAR", "linea": self.linea, "bbox": [float(v) for v in bbox]}
        )

    def avanzar(self, fuente, extra=0):
        self.y += int(fuente.size * random.uniform(1.25, 1.45)) + extra
        self.linea += 1

    def espacio(self, px):
        self.y += px

    def centrado(self, texto, etiqueta, puntos, color=None):
        f = self.ajustar([texto], puntos)
        texto = self.recortar(texto, f, self.util)
        x = (self.ancho - f.getlength(texto)) / 2
        self._escribir(x, texto, f, etiqueta, color)
        self.avanzar(f)

    def izquierda(self, texto, etiqueta, puntos):
        f = self.ajustar([texto], puntos)
        texto = self.recortar(texto, f, self.util)
        self._escribir(self.margen, texto, f, etiqueta)
        self.avanzar(f)

    def par(self, izq, etq_izq, der, etq_der, puntos):
        f = self.ajustar([izq, der], puntos)
        ancho_der = f.getlength(der)
        izq = self.recortar(izq, f, self.util - ancho_der - f.getlength("  "))
        self._escribir(self.margen, izq, f, etq_izq)
        self._escribir(self.ancho - self.margen - ancho_der, der, f, etq_der)
        self.avanzar(f)

    def columnas(self, cant, desc, importe, puntos, etiquetas):
        f = self.fuente(puntos)
        x_desc = self.margen + f.getlength("00000 ")
        ancho_imp = f.getlength(importe)
        x_imp = self.ancho - self.margen - ancho_imp
        desc = self.recortar(desc, f, x_imp - f.getlength("  ") - x_desc)
        self._escribir(self.margen, cant, f, etiquetas[0])
        self._escribir(x_desc, desc, f, etiquetas[1])
        self._escribir(x_imp, importe, f, etiquetas[2])
        self.avanzar(f)
        return desc

    def separador(self, puntos):
        f = self.fuente(puntos)
        car = random.choice(["-", "=", "*", "."])
        texto = car * max(1, int(self.util // f.getlength(car)))
        self.draw.text((self.margen, self.y), texto, font=f, fill=self.color)
        self._ignorar(self.draw.textbbox((self.margen, self.y), texto, font=f))
        self.avanzar(f)

    def codigo_barras(self):
        x0 = int(self.ancho * 0.17)
        x = x0
        while x < self.ancho - x0:
            w = random.choice([1, 2, 3])
            if random.random() > 0.35:
                self.draw.rectangle([x, self.y, x + w, self.y + 40], fill=self.color)
            x += w + random.choice([1, 2, 3])
        self._ignorar([x0, self.y, x, self.y + 40])
        self.y += 50
        self.linea += 1

    def logo(self, nombre_comercio, dir_logos):
        archivos = []
        if dir_logos and Path(dir_logos).is_dir():
            archivos = sorted(
                p for p in Path(dir_logos).iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")
            )
        if archivos:
            self._logo_archivo(random.choice(archivos))
        else:
            self._logo_geometrico(nombre_comercio)
        self.linea += 1

    def _logo_archivo(self, ruta):
        logo_raw = Image.open(ruta).convert("RGBA")
        logo_raw.thumbnail((160, 75), Image.Resampling.LANCZOS)
        fondo = Image.new("RGBA", logo_raw.size, (255, 255, 255, 255))
        gris = Image.alpha_composite(fondo, logo_raw).convert("L")
        if random.random() > 0.35:
            gris = gris.convert("1").convert("L")
        arr_gris = np.array(gris, dtype=np.float32) / 255.0
        tinta = np.zeros((gris.height, gris.width, 3), dtype=np.uint8)
        for c in range(3):
            tinta[:, :, c] = np.clip(self.color[c] + arr_gris * (255 - self.color[c]), 0, 255).astype(np.uint8)
        w, h = gris.size
        x = (self.ancho - w) // 2
        fondo_papel = np.array(self.img.crop((x, self.y, x + w, self.y + h)), dtype=np.float32)
        # Mezcla multiplicativa: la tinta oscurece el papel sin tapar su textura.
        mezcla = (fondo_papel * (tinta.astype(np.float32) / 255.0)).astype(np.uint8)
        self.img.paste(Image.fromarray(mezcla, "RGB"), (x, self.y))
        # Un logo de archivo puede traer letras: se marca completo como región a ignorar.
        self._ignorar([x, self.y, x + w, self.y + h])
        self.y += h + 14

    def _logo_geometrico(self, nombre_comercio):
        cx, radio = self.ancho // 2, 26
        cy = self.y + radio
        estilo = random.choice(["circulo", "hexagono", "cuadro"])
        if estilo == "circulo":
            self.draw.ellipse([cx - radio, cy - radio, cx + radio, cy + radio], outline=self.color, width=3)
            self.draw.ellipse(
                [cx - radio + 5, cy - radio + 5, cx + radio - 5, cy + radio - 5], outline=self.color, width=1
            )
        elif estilo == "hexagono":
            puntos = [
                (cx + radio * math.cos(math.radians(60 * k)), cy + radio * math.sin(math.radians(60 * k)))
                for k in range(6)
            ]
            self.draw.polygon(puntos, outline=self.color, width=3)
        else:
            self.draw.rectangle([cx - radio, cy - radio + 4, cx + radio, cy + radio - 4], outline=self.color, width=3)

        iniciales = "".join(p[0] for p in nombre_comercio.split()[:2]).upper()
        f_ini = self.fuente(18)
        bbox = self.draw.textbbox((0, 0), iniciales, font=f_ini)
        iw, ih = bbox[2] - bbox[0], bbox[3] - bbox[1]
        pos = (cx - iw / 2, cy - ih / 2 - 2)
        self.draw.text(pos, iniciales, font=f_ini, fill=self.color)
        # Las iniciales dentro del logo no son texto útil del ticket.
        self._ignorar(self.draw.textbbox(pos, iniciales, font=f_ini))
        self.y += radio * 2 + 14


def formatear_fecha(dt):
    estilo = random.randint(0, 3)
    if estilo == 0:
        return dt.strftime("%d/%m/%Y %H:%M")
    if estilo == 1:
        return dt.strftime("%d/%m/%y %H:%M:%S")
    if estilo == 2:
        return dt.strftime("%Y-%m-%d %H:%M")
    return f"{dt.day:02d}-{MESES[dt.month - 1]}-{dt.year} {dt:%H:%M}"


def formateador_dinero():
    con_signo = random.random() < 0.8
    con_miles = random.random() < 0.6

    def fmt(valor):
        cuerpo = f"{valor:,.2f}" if con_miles else f"{valor:.2f}"
        return f"${cuerpo}" if con_signo else cuerpo

    return fmt


def dibujar_items(lz, giro, seleccion, dinero):
    items = []
    subtotal = 0.0
    formato = "detalle" if giro == "gasolinera" else random.choice(["columnas", "detalle", "compacto"])

    if formato == "columnas":
        encabezado = random.choice([("CANT", "DESCRIPCION", "IMPORTE"), ("CT", "ARTICULO", "TOTAL"), ("CANT.", "PRODUCTO", "IMPORTE")])
        lz.columnas(*encabezado, puntos=12, etiquetas=("ENCABEZADO",) * 3)

    for desc, precio in seleccion:
        if giro == "gasolinera" and precio < 30:
            cant = round(random.uniform(8, 60), 3)
        else:
            cant = random.randint(1, 4) if giro != "proveedor" else random.randint(1, 12)
        importe = round(cant * precio, 2)
        subtotal = round(subtotal + importe, 2)
        cant_txt = f"{cant:.3f} L" if isinstance(cant, float) else str(cant)

        if formato == "columnas":
            desc_impresa = lz.columnas(str(cant), desc, dinero(importe), 15, ("ITEM_CANT", "ITEM_DESC", "ITEM_IMPORTE"))
        elif formato == "detalle":
            lz.izquierda(desc, "ITEM_DESC", 15)
            desc_impresa = lz.segmentos[-1]["texto"]
            lz.par(f"{cant_txt} x {dinero(precio)}", "ITEM_DETALLE", dinero(importe), "ITEM_IMPORTE", 13)
        else:
            lz.par(f"{cant} {desc}", "ITEM_DESC", dinero(importe), "ITEM_IMPORTE", 15)
            desc_impresa = lz.segmentos[-2]["texto"].split(" ", 1)[-1]

        items.append({"cantidad": cant, "descripcion": desc_impresa, "precio_unitario": precio, "importe": importe})

    return items, subtotal


def generar_un_ticket(indice, split, catalogos, fuentes, args):
    _, comercios, productos = catalogos
    giro = random.choices(list(GIROS), weights=[g["peso"] for g in GIROS.values()])[0]
    cfg = GIROS[giro]
    comercio = random.choice(comercios[giro][split])

    nombre_fuente = random.choice(sorted(fuentes))
    ruta_ttf, escala = fuentes[nombre_fuente]
    ancho = random.randrange(380, 601, 4)
    intensidad = random.randint(28, 65)
    color_tinta = (intensidad, intensidad + 2, intensidad + 4)
    color_tenue = (intensidad + 45, intensidad + 47, intensidad + 49)
    lz = Lienzo(ancho, ruta_ttf, escala, color_tinta)
    dinero = formateador_dinero()

    tiene_logo = random.random() < 0.85
    if tiene_logo:
        lz.logo(comercio["nombre"], args.dir_logos)

    lz.centrado(comercio["nombre"], "COMERCIO", 22)
    for linea_dir in comercio["direccion"]:
        lz.centrado(linea_dir, "DIRECCION", 12)
    lz.centrado(f"{random.choice(['RFC:', 'R.F.C.', 'RFC'])} {comercio['rfc']}", "RFC", 12)
    lz.espacio(6)

    fecha_dt = args.fecha_ref - timedelta(
        days=random.randint(1, 365), hours=random.randint(0, 23), minutes=random.randint(0, 59)
    )
    fecha_str = formatear_fecha(fecha_dt)
    folio = f"{random.randint(1000, 99999999)}"
    folio_str = f"{random.choice(['FOLIO:', 'TICKET:', 'NO. VENTA:', 'TRANS:', 'FOLIO NO.'])} {folio}"
    if random.random() < 0.5:
        lz.par(fecha_str, "FECHA_HORA", folio_str, "FOLIO", 12)
    else:
        lz.izquierda(fecha_str, "FECHA_HORA", 12)
        lz.izquierda(folio_str, "FOLIO", 12)

    if giro == "restaurante":
        lz.par(f"MESA: {random.randint(1, 20)}", "EXTRA", f"MESERO: {random.choice(MESEROS)}", "EXTRA", 12)
    elif giro == "gasolinera":
        lz.par(f"BOMBA: {random.randint(1, 12)}", "EXTRA", f"DESPACHADOR: {random.randint(1, 40):02d}", "EXTRA", 12)
    elif giro == "proveedor":
        lz.izquierda(random.choice(["CLIENTE: MOSTRADOR", "CLIENTE: PUBLICO EN GENERAL", "CONDICIONES: CONTADO"]), "EXTRA", 12)
    elif random.random() < 0.5:
        lz.par(f"CAJA: {random.randint(1, 8)}", "EXTRA", f"CAJERO: {random.randint(100, 999)}", "EXTRA", 12)

    lz.separador(15)
    pool = productos[giro][split]
    k = min(random.randint(*cfg["items"]), len(pool))
    items, subtotal = dibujar_items(lz, giro, random.sample(pool, k), dinero)
    lz.espacio(6)
    lz.separador(15)

    iva = round(subtotal * 0.16, 2)
    total = round(subtotal + iva, 2)
    lz.par(random.choice(["SUBTOTAL", "SUBTOTAL:", "SUB-TOTAL"]), "SUBTOTAL_ETQ", dinero(subtotal), "SUBTOTAL", 15)
    lz.par(random.choice(["IVA 16%", "I.V.A.", "IVA:", "IVA 16.00%"]), "IVA_ETQ", dinero(iva), "IVA", 15)
    lz.par(random.choice(["TOTAL", "TOTAL:", "TOTAL A PAGAR", "TOTAL MXN"]), "TOTAL_ETQ", dinero(total), "TOTAL", 22)

    forma_pago = random.choice(["EFECTIVO", "EFECTIVO", "TARJETA DEBITO", "TARJETA CREDITO"])
    efectivo = cambio = None
    if forma_pago == "EFECTIVO":
        efectivo = float(((int(total) // 50) + 1) * 50)
        cambio = round(efectivo - total, 2)
        lz.par(random.choice(["EFECTIVO", "PAGO CON:", "EFECTIVO:"]), "PAGO_ETQ", dinero(efectivo), "PAGO", 15)
        lz.par(random.choice(["CAMBIO", "SU CAMBIO:", "CAMBIO:"]), "CAMBIO_ETQ", dinero(cambio), "CAMBIO", 15)
    else:
        lz.par(forma_pago, "FORMA_PAGO", f"**** {random.randint(1000, 9999)}", "TARJETA", 13)
        lz.izquierda(f"AUT: {random.randint(100000, 999999)}", "EXTRA", 12)

    if giro == "restaurante":
        lz.izquierda(f"PROPINA SUGERIDA 10%: {dinero(round(total * 0.1, 2))}", "EXTRA", 12)

    lz.espacio(12)
    for msg in random.sample(
        ["GRACIAS POR SU COMPRA", "VUELVA PRONTO", "CONSERVE SU TICKET", "FACTURE DENTRO DEL MES"], k=random.randint(1, 2)
    ):
        lz.centrado(msg, "PIE", 12)
    lz.espacio(8)
    lz.centrado("MUESTRA DE PRUEBA - SIN VALOR FISCAL", "MARCA_SINTETICA", 12, color=color_tenue)
    lz.espacio(8)
    if random.random() < 0.7:
        lz.codigo_barras()

    for seg in lz.segmentos:
        x1, _, x2, _ = seg["bbox"]
        if x1 < 0 or x2 > ancho:
            raise RuntimeError(f"Ticket {indice}: '{seg['texto']}' se sale del ancho ({x1:.0f}-{x2:.0f} de {ancho})")

    alto_recorte = lz.y + 20
    img = aplicar_efecto_termico(lz.img.crop((0, 0, ancho, alto_recorte)))
    angulo = random.uniform(-2.2, 2.2)
    img = img.rotate(angulo, expand=True, fillcolor=(225, 225, 225))
    ancho_final, alto_final = img.size

    segmentos = []
    for seg in lz.segmentos:
        poligono = rotar_poligono(seg["bbox"], angulo, ancho, alto_recorte, ancho_final, alto_final)
        segmentos.append({"texto": seg["texto"], "etiqueta": seg["etiqueta"], "linea": seg["linea"], "poligono": poligono})

    nombre_archivo = f"ticket_{indice:05d}.png"
    img.save(args.salida / "images" / nombre_archivo)

    return {
        "id": indice,
        "archivo": nombre_archivo,
        "split": split,
        "giro": giro,
        "ancho": ancho_final,
        "alto": alto_final,
        "fuente_usada": nombre_fuente,
        "tiene_logo": tiene_logo,
        "sintetico": True,
        "ground_truth": {
            "comercio": comercio["nombre"],
            "direccion": " ".join(comercio["direccion"]),
            "rfc": comercio["rfc"],
            "fecha_hora": fecha_str,
            "folio": folio,
            "items": items,
            "subtotal": subtotal,
            "iva": iva,
            "total": total,
            "forma_pago": forma_pago,
            "efectivo": efectivo,
            "cambio": cambio,
        },
        "segmentos": segmentos,
    }


def generar_lote(args):
    random.seed(args.semilla)
    np.random.seed(args.semilla)

    dir_imagenes = args.salida / "images"
    dir_imagenes.mkdir(parents=True, exist_ok=True)
    for viejo in dir_imagenes.glob("ticket_*.png"):
        viejo.unlink()

    fuentes = preparar_fuentes(args.dir_fuentes)
    catalogos = construir_catalogos()
    splits = asignar_splits(args.cantidad)

    registros = []
    for i, split in enumerate(splits, start=1):
        registros.append(generar_un_ticket(i, split, catalogos, fuentes, args))
        if i % 50 == 0 or i == args.cantidad:
            print(f"Generados {i}/{args.cantidad} tickets...")

    with open(args.salida / "anotaciones.json", "w", encoding="utf-8") as f:
        json.dump(registros, f, indent=1, ensure_ascii=False)

    nombres, _, productos = catalogos
    manifiesto = {
        "semilla": args.semilla,
        "cantidad": args.cantidad,
        "fecha_ref": args.fecha_ref.strftime("%Y-%m-%d"),
        "ratios_tickets": dict(zip(SPLITS, RATIOS_TICKETS)),
        "ratios_catalogo": dict(zip(SPLITS, RATIOS_CATALOGO)),
        "fuentes": {n: Path(r).name for n, (r, _) in sorted(fuentes.items())},
        "tickets_por_split": {s: splits.count(s) for s in SPLITS},
        "tickets_por_giro": {g: sum(r["giro"] == g for r in registros) for g in GIROS},
        "nombres_comercio_por_split": nombres,
        "productos_por_split": {g: {s: [d for d, _ in p[s]] for s in SPLITS} for g, p in productos.items()},
    }
    with open(args.salida / "manifiesto.json", "w", encoding="utf-8") as f:
        json.dump(manifiesto, f, indent=1, ensure_ascii=False)

    print(f"\nListo: {args.cantidad} tickets en '{dir_imagenes}'.")
    print(f"Por split: {manifiesto['tickets_por_split']}")
    print(f"Por giro: {manifiesto['tickets_por_giro']}")


def leer_args():
    p = argparse.ArgumentParser(description="Genera tickets sintéticos con anotaciones por segmento de texto.")
    p.add_argument("--cantidad", type=int, default=500)
    p.add_argument("--semilla", type=int, default=42)
    p.add_argument("--salida", type=Path, default=RAIZ / "data" / "synthetic")
    p.add_argument("--dir-fuentes", type=Path, default=RAIZ / ".cache" / "fuentes")
    p.add_argument("--dir-logos", type=Path, default=None, help="Carpeta opcional con logos propios o con licencia libre")
    # Fecha fija para que la misma semilla produzca las mismas fechas en cualquier día.
    p.add_argument("--fecha-ref", type=lambda s: datetime.strptime(s, "%Y-%m-%d"), default=datetime(2026, 11, 19))
    return p.parse_args()


if __name__ == "__main__":
    generar_lote(leer_args())

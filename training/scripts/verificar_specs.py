import argparse
import ast
import re
import sys
from pathlib import Path

import requests
import yaml

RAIZ = Path(__file__).resolve().parents[1]
FUENTE = RAIZ / ".cache" / "tao_src"
REPO = "https://raw.githubusercontent.com/NVIDIA/tao_pytorch_backend/tao_5.5_release/"
ARCHIVOS = {
    "ocdnet": ["nvidia_tao_pytorch/cv/ocdnet/config/default_config.py", "nvidia_tao_pytorch/core/common_config.py"],
    "ocrnet": ["nvidia_tao_pytorch/cv/ocrnet/config/default_config.py", "nvidia_tao_pytorch/core/common_config.py"],
}


def fuente_local(ruta_repo):
    nombre = ruta_repo.replace("/", "_")
    if nombre == "nvidia_tao_pytorch_core_common_config.py":
        nombre = "core_common_config.py"
    local = FUENTE / nombre
    if not local.exists():
        FUENTE.mkdir(parents=True, exist_ok=True)
        resp = requests.get(REPO + ruta_repo, timeout=30)
        resp.raise_for_status()
        local.write_bytes(resp.content)
    return local


def leer_dataclasses(rutas):
    clases = {}
    for ruta in rutas:
        arbol = ast.parse(ruta.read_text(encoding="utf-8"))
        for nodo in arbol.body:
            if not isinstance(nodo, ast.ClassDef):
                continue
            campos = {}
            for item in nodo.body:
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    campos[item.target.id] = ast.unparse(item.annotation)
            bases = [ast.unparse(b) for b in nodo.bases]
            clases[nodo.name] = {"campos": campos, "bases": bases}
    return clases


def campos_de(clases, nombre):
    if nombre not in clases:
        return None
    campos = {}
    for base in clases[nombre]["bases"]:
        campos.update(campos_de(clases, base) or {})
    campos.update(clases[nombre]["campos"])
    return campos


def tipo_anidado(anotacion, clases):
    # Optional[X] / X -> X si X es una dataclass conocida. List[dict] y similares son libres.
    for nombre in re.findall(r"[A-Za-z_][A-Za-z0-9_]*", anotacion):
        if nombre in clases:
            return nombre
    return None


def revisar(valor, clase, clases, ruta, errores):
    campos = campos_de(clases, clase)
    if campos is None or not isinstance(valor, dict):
        return
    for clave, sub in valor.items():
        if clave not in campos:
            errores.append(f"{ruta}{clave}: no existe en {clase} (válidas: {', '.join(sorted(campos))})")
            continue
        anidada = tipo_anidado(campos[clave], clases)
        if anidada:
            revisar(sub, anidada, clases, f"{ruta}{clave}.", errores)


def main(args):
    total = 0
    for modelo, archivos in ARCHIVOS.items():
        try:
            rutas = [fuente_local(a) for a in archivos]
        except requests.RequestException as e:
            sys.exit(f"No se pudieron bajar las fuentes de TAO 5.5 de {REPO}: {e}")
        clases = leer_dataclasses(rutas)
        spec = yaml.safe_load((args.specs / f"{modelo}.yaml").read_text(encoding="utf-8"))
        errores = []
        revisar(spec, "ExperimentConfig", clases, "", errores)
        print(f"{modelo}.yaml: {'OK' if not errores else f'{len(errores)} clave(s) inválida(s)'}")
        for e in errores:
            print(f"  - {e}")
        total += len(errores)
    if total:
        sys.exit(1)


def leer_args():
    p = argparse.ArgumentParser(description="Comprueba que cada clave de los specs exista en el esquema de TAO 5.5.")
    p.add_argument("--specs", type=Path, default=RAIZ / "specs")
    return p.parse_args()


if __name__ == "__main__":
    main(leer_args())

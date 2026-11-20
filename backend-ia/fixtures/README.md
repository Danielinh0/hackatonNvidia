# Ejemplos del contrato `POST /vision/analizar` (SIMULADO)

Respuestas de ejemplo para programar el backend y la PWA antes de que existan los modelos.
Salen del ground truth de tickets sintéticos de test (`training/scripts/ejemplos_back.py`).
**Las confianzas son valores de prueba, no salidas de un modelo.** Para regenerarlos:

```bash
cd training && .venv/bin/python scripts/ejemplos_back.py
```

| Archivo | Caso |
|---|---|
| `analizar_ok_<giro>.json` | Ticket leído completo (abarrotes, farmacia, ferretería, gasolinera, papelería, proveedor, restaurante) |
| `analizar_error_total_no_cuadra.json` | Subtotal + IVA no da el total leído: `validaciones[0].ok = false` y confianza del total a la mitad |
| `analizar_error_sin_rfc.json` | Falta el RFC: error `CAMPO_FALTANTE` con mensaje para el usuario |
| `analizar_error_imagen_ilegible.json` | No se encontró texto: error `SIN_TEXTO`, sin campos |

## Campos

| Campo | Qué es | Lo produce |
|---|---|---|
| `segmentos[]` | Cada texto leído: `id`, `texto`, `poligono` (4 puntos en píxeles de la imagen), `linea`, `conf_caja`, `conf_ocr` | OCDNet + OCRNet |
| `campos[]` | `nombre`, `valor` normalizado, `texto_original`, `conf`, `seg` (ids de `segmentos` de donde salió) | LLM |
| `items[]` | `cantidad`, `descripcion`, `precio_unitario`, `importe`, `conf`, `seg` | LLM |
| `categoria_propuesta` | Giro o categoría sugerida | LLM |
| `validaciones[]` | `regla`, `ok`, `detalle` | `reglas_fiscales.py` |
| `conf_global` | Mínimo de las confianzas de rfc, fecha y total (CLAUDE.md sec. 14) | backend |
| `modelos` | Archivo y sha256 de los pesos usados, para acreditar los modelos entrenados. `null` mientras no existan | backend |
| `errores[]` | `codigo`, `campo`, `mensaje` listo para mostrar | backend |

- Para dibujar la caja de un campo: toma sus `seg` y busca esos `id` en `segmentos`.
- `tiene_cfdi` / `uuid_cfdi` van siempre en `false` / `null`: los tickets sintéticos aún no traen UUID ni QR.
- `fecha_hora` viene tal como está impresa; el formato normalizado se definirá al implementar `llm_service.py`.
- `_aviso` existe solo en estos ejemplos y no forma parte del contrato real.

# Prueba de extremo a extremo: PWA → backend-ia (modelos reales)

> Ejecución real del 20-nov-2026, 15:22–15:23 UTC. Script: `flujo_pwa/flujo.mjs` (Playwright + Chromium, viewport de teléfono 390×844).
> Capturas y `resultados-*.json` en `flujo_pwa/`. Base SQLite aislada (`DZUUN_DB`), cuenta y negocio ficticios.

## Configuración
| Pieza | Estado en la prueba |
|---|---|
| PWA | `next dev -p 3100`, `BACKEND_URL=http://localhost:8000` |
| Asistente | **Real:** Qwen2.5-7B-Instruct + adaptador `training/asistente/adapters/prueba`, RTX 4050 Laptop (6 GB, modo memoria baja) |
| Visión | **SIMULADA** (`VISION_SIMULADA=1`): no hay pesos en `training/vision/weights/` y `extraer_texto` no está conectado. Toda imagen devuelve el texto de `ticket_ejemplo.txt` (caso sintético `test-00000`) |
| Imágenes | PNG generados con el texto de `ticket_ejemplo.txt` (sintéticos) y un archivo falso `falso.jpg` |

## Casos
| # | Caso | Entrada | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|
| R1 | Registro | Nombre, correo, contraseña | Ir a /configurar | /configurar | Pasa |
| R2 | Configurar negocio | Nombre, RFC ficticio, 626 | Guardar y salir | Inicio | Pasa |
| C1 | Habitual: 1 ticket | `ticket_a.png` | Datos leídos por el asistente, rotulado SIMULADO | 26.1 s; Total 3156.00, IVA 435.31, folio 14199, fecha y emisor leídos; JSON idéntico a la etiqueta de `test-00000` | Pasa |
| C2 | Revisión y confirmación | /revision/detalle | Confirmar bloqueado sin tipo de movimiento; se guarda al elegirlo | Bloqueado al abrir (sin RFC de emisor no se propone tipo); tras elegir → `confirmado`, corrección registrada | Pasa |
| C3 | Consulta posterior | /operaciones, /mi-mes?mes=2026-07 | Aparece el ticket confirmado | Aparece en ambas | Pasa |
| C4 | Duplicado | `ticket_a.png` otra vez | Aviso, sin análisis | "Ya habías subido este mismo archivo." (0.7 s) | Pasa |
| C5 | Inválido + válido | `falso.jpg` + `ticket_b.png` | Rechaza uno, procesa el otro | 23.0 s; falso rechazado, válido leído | Pasa |
| C6 | Servicio de IA apagado | `ticket_c.png` con backend detenido | Error claro, sin datos inventados | "No pudimos conectar con el servicio de análisis." | Pasa |
| A1 | API sin token | `curl` sin `Authorization` | 401 | 401 | Pasa |
| A2 | Imagen > 10 MB | 11 MB aleatorios | 413 | 413 "La imagen pesa más de 10 MB." | Pasa |

## Observaciones
1. **Visión no conectada (bloqueante para la demo):** sin YOLO + OCR todas las fotos producen el mismo texto; no se puede "procesar una imagen nueva" (CLAUDE.md sec. 7).
2. **Rótulo engañoso:** la tarjeta dice "SIMULADO · no lo leyó el modelo", pero el asistente entrenado sí leyó el texto; lo simulado es la visión. `app.py` junta ambos en un solo `simulado`. **Corregido el mismo día:** el backend manda `simulado_partes` y la app muestra "SIMULADO · visión: texto de ejemplo; lo leyó el asistente entrenado". Re-ejecución 15:27–15:28 UTC: R1–C5 pasan; la base anterior recibió la columna nueva sin perder filas.
3. El asistente deja `FormaPago: "AUTO"` con `FormaPagoLeida: "TARJETA DEBITO"` (igual que la etiqueta): la clave SAT debe ponerla `reglas_fiscales.py`; hoy la revisión muestra el campo vacío.
4. Tiempo por ticket ≈ 23–26 s en la 4050. Un lote se manda en paralelo con límite de 60 s por archivo (`lib/analisis.ts`); con 3 o más fotos podría cortarse si la GPU las atiende en serie (no probado).
5. Detalles de UI: la fecha se muestra en ISO (`2026-07-02T08:42:47`) y se parte en dos líneas; con 0 de 1 leídos el encabezado dice "Casi todo bien".

## Límites
Visión simulada; un solo ticket sintético de `test` (no es evaluación del modelo, que va aparte con ≥ 10 casos); servidor en modo dev; navegador de escritorio emulando teléfono.

# CLAUDE.md — Dzuun · Hackathon NVIDIA Oaxaca 2026

> Fuente única de verdad del equipo y contexto para Claude Code. Si algo cambia, se edita aquí.
> Última decisión de alcance: 19-nov-2026. Reloj de 24 h en curso.
> **Nombre del producto: Dzuun** (ver sec. 22). Asistente/mascota: **Bisie'** propuesto en los bocetos; en el resto del documento aún aparece como "Tona" hasta confirmarlo (sec. 21).

## 0. Instrucciones para Claude Code (leer primero)
- Lee este archivo completo antes de escribir código. Si una petición contradice las secciones 1–10, avisa antes de actuar.
- **Nunca inventes** métricas, resultados de entrenamiento, logs ni casos de prueba. Todo número debe venir de una ejecución real.
- Marca como `SIMULADO` en código, UI y documentación todo lo que no sea real (timbrado, QR del PDF, cualquier "emisión").
- No incluyas claves, tokens, `.env` ni credenciales. `.env*`, `serviceAccount*.json` y `data/` (base SQLite con fotos) van en `.gitignore`.
- Cálculos fiscales solo en `backend-ia/reglas_fiscales.py`, con pruebas de resultado esperado. El LLM nunca calcula ni inventa claves SAT.
- Todo lo que la IA interprete debe pasar por la pantalla de revisión antes de guardarse.
- Los integrantes deben entender y poder explicar el código. Explica tus decisiones brevemente al proponer cambios.
- Registra el uso de IA en `docs/declaracion_ia.md` (herramienta, empresa, actividades).
- Después del cierre de la competencia no se modifica código, datos ni modelos.

## 1. Reglas duras (bases del hackathon)
- 4 integrantes. Trabajo autónomo durante las 24 h: sin asesoría de coach, docentes ni terceros (presencial o remota). Pueden usar documentación pública y herramientas de IA, declaradas.
- La organización solo resuelve dudas sobre las bases y problemas de infraestructura. Avisos generales y reportes de incidentes: Panel de Control del Hackathon Nvidia Oaxaca 2026.
- Se permiten: modelos preentrenados, librerías, datasets públicos, datos sintéticos (identificados), con procedencia y licencia declaradas.
- La preparación específica, el entrenamiento y la integración se hacen durante las 24 h. No se presenta como entrenamiento del concurso un ajuste hecho antes.
- Demos con datos sintéticos, anonimizados o autorizados. Sin contraseñas, claves ni información personal o financiera de terceros.
- **Causas de descalificación:** plagio, falsificación de evidencias, asesoría externa prohibida comprobable, presentar un componente simulado como implementado.

### Declaración de uso de IA (obligatoria, firmada por el líder; va en README y ficha)
"Para la elaboración de este trabajo se utilizó [HERRAMIENTA Y COMPAÑÍA] como apoyo en [DESCRIBIR LAS ACTIVIDADES REALIZADAS CON IA]. Quienes firman este trabajo han revisado y editado el contenido, verificado las fuentes y asumen plena responsabilidad por la versión final."

## 2. Requisitos mínimos para ser evaluado
- [ ] Equipo de cuatro estudiantes
- [ ] Entrega dentro del plazo
- [ ] Aplicación móvil funcional (nativa, multiplataforma o PWA utilizable desde teléfono)
- [ ] Componente de imágenes + asistente integrados en el recorrido principal
- [ ] Entrenamiento/ajuste de AMBOS acreditado durante la competencia
- [ ] Uso de servidores y herramientas NVIDIA demostrado
- [ ] Todos los entregables obligatorios (sección 6)
- [ ] Presentación ante el jurado

## 3. Producto obligatorio (sec. 6 de las bases)
a) **Completar una tarea del proceso:** iniciar, capturar/consultar información, revisar el resultado y completar. Si se guarda información, debe poder consultarse después. Mostrar qué pasos del proceso actual se digitalizan.
b) **Integrar ambos componentes de IA** dentro de la app (edge) o vía API en servidor del equipo. No basta mostrar los modelos por separado (cuadernos o APIs sueltas).
c) **Usar los modelos entrenados por el equipo:** la app usa los pesos/adaptadores generados en la competencia, con relación verificable entre entrenamiento entregado y modelo en uso.
d) **Revisión y corrección:** el usuario revisa y corrige lo interpretado por la IA antes de confirmar.
e) **Manejo de errores:** informar cuando una imagen no se procesa, faltan datos, falla una conexión o el asistente no puede resolver.
- Un prototipo de pantallas navegables sin funciones implementadas NO cumple.

## 4. Entrenamiento obligatorio
### Visión (sec. 7)
1. Seleccionar e identificar el modelo base. 2. Preparar datos y etiquetas. 3. Separar train/val/test. 4. Entrenar/ajustar durante las 24 h. 5. Guardar pesos. 6. Evaluar con datos de prueba. 7. Integrar en la app.
- Sin imágenes duplicadas ni versiones de la misma imagen en conjuntos distintos.
- Usar solo un servicio de visión/OCR ya entrenado NO acredita el requisito; puede ser complemento si se identifica qué entrenó el equipo.
### Asistente (sec. 8)
- Planificación: modelo base y objetivo del asistente.
- Si hay ajuste: datos de preparación, división de datos, pesos/config finales, evaluación comparativa base vs ajustado.
- Si hay RAG/prompt: fuentes, flujo de datos, diseño del prompt, pruebas de consistencia.
- Integración funcional dentro de la app.
### NVIDIA (sec. 9)
- Preparar y enviar al servidor datos, código, config y modelo base; ejecutar ahí ambos entrenamientos; conservar registros de ejecución; guardar pesos/adaptadores.
- Usar al menos una herramienta NVIDIA para entrenar, optimizar o desplegar, y explicar cuál y qué función cumplió.
- Respetar límites asignados; no interferir con otros equipos.
- Los modelos pueden ejecutarse en el servidor (no es obligatorio en el teléfono).

## 5. HCI y evaluación técnica
### HCI (sec. 12), mínimo
1. Describir usuario, tarea principal y cómo se hace hoy; identificar el paso a mejorar. 2. Flujo digital comprensible. 3. **Justificar tres decisiones de diseño.** 4. Permitir revisar y corregir. 5. Comunicar errores y estados. 6. **Prueba breve con al menos 2 usuarios ajenos** (registrar tarea, dificultades, mejoras; declarar si no son público objetivo). Su participación no es asesoría.
### Evaluación técnica (sec. 13)
- **App:** ≥5 casos del recorrido (habitual; datos incompletos/inválidos; fallo de IA o servicio), con entrada, esperado y obtenido. Comparar proceso actual vs digital con al menos una medida (pasos, tiempo, errores), explicando método y límites.
- **Visión:** cantidad y distribución de datos, métrica adecuada, cómo se calculó, ejemplos de aciertos y errores, comparación con modelo base (o explicar por qué no es comparable).
- **Asistente:** ≥10 casos reservados distintos de train/val: habituales, información incompleta, uno fuera de alcance y uno que requiera reconocer una limitación o pedir confirmación. Comparar base vs ajustado con mismas condiciones. No se exige mejora en todo: se evalúa la ejecución, la calidad de la evaluación y la interpretación honesta.
### Cálculos y pagos (sec. 11, opcionales)
- Cálculos: reglas implementadas y verificables; documentar fuentes, periodo, supuestos y alcance; casos con resultado esperado; estimaciones identificadas, nunca como determinación oficial.
- Cobros/pagos: entorno de prueba permitido; mostrar solicitud, respuesta y estado; considerar un caso de fallo; una pantalla de éxito sin integración se rotula simulación.

## 6. Entregables obligatorios (sec. 14)
| | Entregable | Contenido |
|---|---|---|
| A | Aplicación funcional | Instalable o enlace; instrucciones de instalación y uso; cuenta de demo si aplica; datos de prueba; versión entregada |
| B | Código fuente | App y servicios; código/cuadernos de ambos entrenamientos; config y dependencias; instrucciones para ejecutar y cargar modelos; conexión app-modelos-servicios; declaración de componentes previos, herramientas de IA, fuentes y licencias; lista de funciones implementadas / simuladas / pendientes. SIN claves secretas |
| C | Paquete de entrenamiento (por modelo) | Modelo base (nombre, versión, procedencia, licencia); datos y su distribución; configuración; registro (fecha, duración, GPU, pasos/épocas); artefacto (pesos/adaptador + modelo base necesario); evaluación (métricas, casos, resultados). Archivos grandes por ubicación enlazada en el Panel, accesible al jurado. Capturas complementan, no sustituyen |
| D | Ficha del proyecto (PDF ≤4 págs) | Nombre e integrantes; problema y público; proceso actual y relación con economía digital; recorrido digitalizado vs actual; función de cada modelo; uso de NVIDIA; 3 decisiones de diseño; resultados; limitaciones |
| E | Evidencias de evaluación | Pruebas de la app, resultados de ambos modelos, observaciones de las 2 pruebas de uso |
| F | Presentación (PDF) | Apoyo a la exposición |
| G | Video de respaldo (≤3 min) | Recorrido principal y ambos componentes de IA; funciones simuladas identificadas |
- Todos los entregables se registran antes del cierre en el Panel de Control. Verificar que enlaces y archivos sean accesibles.

## 7. Presentación ante el jurado
- 15 min por equipo: **10 de exposición y demo + 5 de preguntas** (las bases corrigen la diapositiva que decía otra distribución). La exposición termina al minuto 10.
- Debe incluir: negocio, usuario, proceso actual y dificultad; demo del proceso digitalizado con evidencia de mejora; entrenamiento y evaluación de visión y asistente; uso de NVIDIA; decisiones de diseño y resultados de pruebas de uso; limitaciones y funciones pendientes o simuladas.
- **En la demo hay que:** completar el recorrido principal; procesar una imagen NUEVA (no usada para entrenar); hacer una consulta NUEVA al asistente; mostrar cómo el usuario revisa o confirma; acreditar que se usan los modelos entrenados en la competencia.
- El jurado puede pedir una entrada distinta, revisar registros o pedir explicaciones del código. Si algo falla, se usa el video de respaldo.
- Tres preguntas que cada equipo debe poder contestar: qué pregunta intentó responder, qué descubrió, qué cambiaría con más tiempo.

## 8. Rúbrica (100 pts)
Producto funcional 20 · Modelo de visión 20 · Asistente 20 · HCI 15 · Problema y pertinencia 10 · Herramientas NVIDIA 10 · Presentación y documentación 5. La cantidad de funciones no da puntos. Desempate: suma de ambos modelos, luego producto funcional, luego HCI.

## 9. Cierre
Al concluir las 24 h: se cierra el registro de entregables; entrenamientos terminados y archivos guardados; se identifica la versión final del código; no se permiten modificaciones posteriores; sí se pueden iniciar servicios y cargar archivos entregados para la demo. Reportar incidentes de infraestructura por el Panel en cuanto ocurran (no garantiza extensión).

---

# Proyecto

## 10. Problema y usuario
- **Usuario:** personas y negocios pequeños recién formalizados ante el SAT que empiezan a usar pagos digitales.
- **Dolor:** tickets de venta, de gasto y comprobantes SPEI/CoDi en silos; no saben qué tiene CFDI, qué es ingreso o egreso, ni qué les sirve fiscalmente.
- **Proceso actual:** guardar tickets en bolsa o cajón, capturar a mano, revisar al final del mes.
- **Relación con la ley:** adopción de medios de pago digitales y trazabilidad. El efectivo alto puede afectar lo acreditable (verificar en LISR/LIVA vigentes).
- **Fuera de alcance:** el alta ante el SAT (trámite). Sí se incluye en la bienvenida una **guía informativa** de pasos con enlace al portal del SAT (sec. 23); el acompañamiento interactivo de Tona sigue siendo P2.

## 11. Alcance
| Prio | Funcionalidad |
|---|---|
| P0 | Login (local con correo y contraseña; Google opcional) → carga por lote → detección + OCR → clasificar (ingreso / egreso / pago) → ¿tiene CFDI? → revisión con confianza → guardar → Tona pide datos faltantes y explica |
| P1 | Modo accesibilidad (Tona narra, un ticket a la vez) y modo detalle; conciliación ticket vs SPEI; pre-emisión CFDI 4.0 simulada (XML + PDF) |
| P2 | Indicador estimado de IVA acreditable; guía de alta ante el SAT; factura global |
- **Simulado (declarado):** timbrado ante PAC, QR del PDF, cualquier emisión real.

## 12. Régimen fiscal de la demo
- **RESICO persona física (clave 626)**, verificar en `c_RegimenFiscal`.
- Se muestra: ingresos del periodo, gastos CON CFDI (IVA acreditable estimado) y gastos SIN CFDI (probablemente no acreditables). No se calcula ISR.
- Todo rotulado "estimación, no determinación oficial". Regla gancho: efectivo > 2,000 MXN → advertencia (verificar aplicación).
- Reglas con fuente, periodo, supuestos y casos de prueba.

## 13. Flujo
1. Login (local; Google cuando haya credenciales). 2. Subir N fotos (cola con estado por archivo; un fallo no bloquea el lote). 3. Visión clasifica y detecta regiones; OCR solo sobre recortes. 4. Reglas en código: subtotal + IVA 16 % = total, catálogos SAT por consulta. 5. Tona propone clasificación y categoría, pregunta lo que falta. 6. Revisión humana obligatoria. 7. Confirmar → guardar → (P1) XML/PDF simulado.
- **Ingreso vs egreso:** el usuario configura nombre/RFC de su negocio; si el emisor coincide → ingreso, si no → egreso; si no se lee emisor → Tona pregunta.
- **¿Tiene CFDI?:** se activa con `uuid_cfdi` o `qr_cfdi` detectados; se informa como "indicios" con confianza.

## 14. Confianza
`conf_campo = conf_caja × conf_ocr × (1 si pasa reglas, si no 0.5)`. Verde ≥ 0.85, amarillo 0.6–0.85, rojo < 0.6 (calibrar con validación). Rojo exige revisión. Confianza global del ticket = mínimo de campos clave.

## 15. Modos de interfaz (mismos datos, dos vistas)
- **Accesibilidad:** texto grande, alto contraste, botones grandes, Tona narra por voz (`speechSynthesis`, es-MX) y guía un ticket por vez.
- **Detalle:** tabla de campos, imagen con cajas, confianza por campo, edición masiva.

## 16. Arquitectura (SQLite, sin Firebase)
> Cambio de plan (20-nov-2026): se reemplazó Firebase por **SQLite + acceso local (correo y contraseña)** para que la app sea portable: un solo archivo de base y ningún servicio externo. El login con Google está programado pero **desactivado** hasta que haya credenciales (`docs/login.md`).
```text
PWA (Next.js 16 + TypeScript + Tailwind) — servidor Node propio (`pnpm build && pnpm start`)
   ├── Acceso local: /registro y /entrar (contraseña con scrypt) → sesión en cookie httpOnly
   │      (opcional: Google OpenID Connect + PKCE, aparece solo si hay credenciales)
   ├── SQLite (`node:sqlite`, integrado en Node ≥ 22.13) → `data/dzuun.sqlite`: usuarios, sesiones, lotes, imágenes
   └── Servidor Next.js ── HTTPS + secreto compartido ── Cloudflare Tunnel ── Servidor NGC (FastAPI :8000)
                                                                          ├── POST /vision/analizar
                                                                          └── POST /asistente/chat (stream)
```
- **Auth (local):** `/registro` crea la cuenta (nombre, correo, contraseña ≥ 8; hash scrypt en `lib/contrasena.ts`) y `/entrar` abre sesión (`app/entrar/acciones.ts`). Mensaje de error genérico y mismo tiempo de respuesta exista o no el correo. Cuenta nueva → `/configurar`; luego → inicio.
- **Parámetros de ruta:** sin sesión, `proxy.ts` manda a `/entrar?siguiente=<ruta pedida con su query>`; al entrar o registrarse se regresa ahí. `siguienteSeguro()` en `lib/rutas.ts` solo acepta rutas internas (bloquea `https://…`, `//…`, `/\…` y rutas de acceso). Con sesión, `/bienvenida`, `/entrar` y `/registro` saltan al destino. Avisos por `?motivo=caducada|salida`. Los `[id]` dinámicos se validan como UUID y por dueño.
- **Google (opcional):** `/auth/google` → Google → `/auth/google/callback`, con `state`, PKCE, `nonce`, `iss`, `aud`, `exp` y correo verificado (`lib/google.ts`); si el correo ya tiene cuenta local, se vincula.
- **Sesiones:** token aleatorio en cookie `dzuun_sesion` (httpOnly, SameSite=Lax, 30 días); en la base solo su sha256. `proxy.ts` hace la revisión rápida; **cada Server Action y ruta con datos valida la sesión** (`usuarioActual()` / `requerirUsuario()` en `lib/sesion.ts`).
- **Seguridad:** cada persona solo ve sus lotes e imágenes (consulta filtrada por `usuario_id`; si no es suya → 404). El teléfono **no** llama a FastAPI directamente: el servidor Next.js reenvía la petición con un secreto compartido (`BACKEND_TOKEN` en `.env.local`); FastAPI rechaza lo que no lo traiga. CORS cerrado; límite de imagen 10 MB.
- **Carga de fotos:** `app/subir/acciones.ts` verifica tamaño, tipo real por bytes y sha256 del teléfono (`lib/verificacion.ts`, con pruebas), guarda en una transacción y relee la huella antes de redirigir a `/subir/recibido/[lote]`. Un fallo no bloquea el lote.
- **Base de datos:** esquema en `lib/esquema.ts`, se crea sola al primer uso; detalles en `db/README.md`. Tablas actuales: `usuarios`, `sesiones`, `lotes`, `imagenes`. Por agregar: `negocios` (nombre, RFC, régimen), `operaciones` (tipo, categoria, total, iva, fecha, folio, tiene_cfdi, uuid, conf_global, estado, campos JSON, imagen_id), `facturas`, `mensajes`.
- **Despliegue:** no sirve Vercel (su disco es temporal y se perdería la base). Correr en una computadora o servidor del equipo; para probar desde el teléfono con Google hace falta https (túnel), no la IP de la red local.
- Reglas fiscales y catálogos SAT en código; el modelo propone, el código valida. Nunca emitir sin pantalla de revisión.

### Contratos de API
`POST /vision/analizar` (multipart: imagen) →
```json
{
  "doc_tipo": "ticket | spei | desconocido",
  "campos": [{"nombre": "total", "valor": "245.00", "conf": 0.91, "bbox": [0, 0, 0, 0]}],
  "tiene_cfdi": true,
  "conf_global": 0.78,
  "errores": []
}
```
`POST /asistente/chat` → `{ "mensaje": "...", "modo": "accesibilidad|detalle", "contexto": { "operacion_id": "..." } }`, respuesta en streaming (SSE).

## 17. Modelos (decisión final)
| Componente | Modelo base | Método | Licencia | Plan B |
|---|---|---|---|---|
| Visión | YOLO11s (Ultralytics) | Ajuste fino + export TensorRT FP16 | AGPL-3.0 | YOLO11n / YOLO11m |
| OCR (NO entrenado, complemento declarado) | PaddleOCR o Tesseract spa | Preentrenado | Apache-2.0 | EasyOCR |
| Asistente "Tona" | Qwen2.5-7B-Instruct | QLoRA NF4 + tablas SAT por consulta | Apache-2.0 | Qwen2.5-3B-Instruct |
- **Clases del detector:** `ticket_total, ticket_fecha, ticket_folio, ticket_emisor, ticket_rfc, ticket_iva, ticket_forma_pago, qr_cfdi, uuid_cfdi, spei_monto, spei_fecha, spei_clave_rastreo, spei_beneficiario`. El tipo de documento se deduce por regla de clases.
- **Hiperparámetros iniciales (ajustar con validación):** visión imgsz 640, 50–100 épocas, batch 16, parada temprana, aumentos solo en train. QLoRA: NF4, r=16, alpha=32, capas lineales, lr 2e-4, 2–3 épocas, secuencia 1024.
- **Dataset de Tona (JSONL, ~1,500–3,000 ejemplos sintéticos revisados):** (a) texto OCR → JSON, (b) ingreso/egreso/categoría, (c) conversación: datos faltantes, explicación, narración, fuera de alcance, pedir confirmación.
- **Personalidad:** amable, cercana, frases cortas, sin jerga; nunca presenta estimaciones como oficiales; si no sabe, lo dice. Nombre propuesto: Tona.
- **NVIDIA a documentar:** contenedor NGC (`nvcr.io/nvidia/pytorch`), CUDA, TensorRT (benchmark PyTorch vs TensorRT como evidencia). Opcional: NeMo.

## 18. Datos
- Tickets sintéticos: el generador exporta imagen + etiquetas YOLO. Variar plantillas, fuentes, papel, perspectiva, desenfoque, sombras, arrugas, tinta desvanecida.
- 50–100 fotos reales anonimizadas, etiquetadas a mano, para val y test.
- Split por PLANTILLA, no por imagen. Aumentos solo en train. Todo sintético marcado como tal; procedencia y licencia de datasets públicos registradas.

## 19. Estructura del repo
```text
hackathon-nvidia-oaxaca-2026/
├── CLAUDE.md   README.md
├── docs/            ficha PDF, pruebas de uso, evidencias, declaracion_ia.md,
│                    prompt-bueno.md (prompts finales de Stitch), prompt-google-stitch.md (versión con análisis de contraste)
├── frontend-pwa/    Next.js (TS) + Tailwind; acceso local + SQLite, Google opcional (lib/, db/README.md, docs/login.md)
├── backend-ia/      FastAPI: vision_pipeline.py, llm_service.py, reglas_fiscales.py, auth_backend.py (secreto compartido)
└── training-ngc/
    ├── vision/      dataset train/val/test, train_vision.py, logs/, weights/
    └── asistente/   dataset JSONL, train_qlora.py, test_10_casos.py, logs/, adapters/
```

## 20. Roles y plan
- **Roles:** 1) Visión y datos · 2) Asistente y dataset conversacional · 3) Backend, reglas fiscales, CFDI simulado, túnel y auth · 4) PWA, HCI, pruebas con usuarios, ficha y video.
- **Plan (18 h restantes al 19-nov 19:00):** 0–2 acceso GPU y entorno · 2–6 entrenar visión + dataset Tona · 6–10 QLoRA + backend + PWA · 10–14 integración y modos · 14–16 evaluación y 2 pruebas de uso · 16–18 ficha, presentación, video y registro. Si no hay GPU en 3 h, reducir alcance y avisar.

## 21. Pendientes
- [ ] Método de acceso al GPU; confirmar si créditos DLI cuentan como servidores proporcionados
- [ ] `nvidia-smi` funcionando; túnel probado desde la PWA
- [x] Base de datos: SQLite en lugar de Firebase (20-nov-2026)
- [x] Acceso local (correo + contraseña) y sesiones en SQLite, con regreso a la ruta pedida (20-nov-2026)
- [ ] (Opcional) Activar Google: crear el Client ID, ponerlo en `.env.local` y probar un login real (`docs/login.md`)
- [ ] Límite de intentos fallidos al entrar y recuperación de contraseña
- [ ] Guardar en SQLite el negocio de "Configurar" (nombre, RFC, régimen)
- [ ] FastAPI: exigir `BACKEND_TOKEN` y llamar al backend solo desde el servidor Next.js
- [ ] Verificar clave 626 y reglas RESICO en fuentes oficiales
- [x] Nombre de la app: **Dzuun** (19-nov-2026)
- [ ] Confirmar asistente/mascota **Bisie'** y reemplazar "Tona" en este archivo, dataset y prompts del LLM
- [ ] Verificar *dzuun* y *bisieꞌ* (escritura y pronunciación) y citar la fuente en la ficha
- [ ] Verificar los pasos de alta en el SAT de la bienvenida contra la ficha vigente en sat.gob.mx
- [x] Bocetos en Figma ("Pantallas Dzuun"), convertidos a vistas de Next.js; MCP de Figma conectado
- [ ] Registrar en `docs/declaracion_ia.md` el uso de Claude Code para naming, prompts de Stitch, paleta, conversión Figma → código, carga de fotos y login
- [ ] Declaración de IA firmada

---

# Identidad y diseño

## 22. Nombre, mascota y paleta
- **App: Dzuun.** Zapoteco de Mitla (Valles Centrales), *dzuun* = "labor, trabajo, obra". Fuente: *Diccionario zapoteco de Mitla, Oaxaca*, Morris Stubblefield y Carol Miller de Stubblefield, ILV. Citar variante y fuente en la ficha.
- **Eslogan:** "Con Dzuun trabajas menos, facturas más". ⚠️ La emisión de facturas es SIMULADA: en demo y ficha decir "pre-factura simulada" para no presentar lo simulado como implementado.
- **Mascota/asistente (propuesta): Bisie'**, granito de cacao con carita. *bisieꞌ* = "semilla de cacao" (mismo diccionario). El cacao fue moneda en Mesoamérica. Misma personalidad que la sec. 17.
- Otras palabras verificadas (Mitla): *meel* dinero, *guijtz* papel, *rcuaani* escribir, *bajl* luz, *guii* mercado/flor, *rbäxani* aclarar/explicar. Istmo: *gui'chi'* papel/documento.
- **Paleta de marca** (contraste WCAG medido):
  | Color | Rol | Regla |
  |---|---|---|
  | `#FF3A24` rojo-naranja | Marca, emoción, botón principal | Blanco encima solo en texto ≥ 19 px bold (3.6:1); `#000F2A` encima 5.3:1 |
  | `#104094` azul | Confianza, acciones secundarias, enlaces | Blanco encima 9.6:1 |
  | `#D4FF24` lima neón | Acento: chips, resaltados, burbujas | Siempre con `#000F2A` encima (16.5:1). **Nunca sobre blanco** (1.2:1) |
  | `#000F2A` | Texto y superficies oscuras | 19.1:1 sobre blanco |
  | `#FFFFFF` / `#FFF8EC` | Fondos | — |
- **Colores de estado** (no son de marca; siempre con icono + palabra): éxito `#1E8E4E`, advertencia ámbar `#F2A900` con texto `#000F2A`, error `#B3261E` (distinto del rojo de marca). Semáforo de confianza (sec. 14): verde "Alta", ámbar "Media", rojo oscuro "Baja". El lima no se usa como estado porque se confunde con verde.

## 23. Bocetos (Google Stitch) y pantallas
- Prompts finales en `docs/prompt-bueno.md`: un prompt maestro (sistema de diseño + Inicio) y uno por pantalla, pegados por separado en Stitch modo Mobile. `docs/prompt-google-stitch.md` conserva la versión anterior con la tabla de contraste.
- **Pantallas:** 1 Inicio (resumen del mes como estimación) · 2 Bienvenida/login · 3 Configurar negocio (nombre, RFC, régimen 626) · 4 Subir lote · 5 Revisión modo detalle · 6 Revisión modo sencillo · 7 Chat con la mascota · 8 Operaciones · 9 Mi mes · 10 Pre-factura SIMULADO · 11 Errores y estados.
- **Bienvenida (pantalla 2), 4 secciones:** héroe con eslogan y "Continuar con Google" · "Así de fácil" en 3 pasos (foto → la mascota lee y ordena → tú revisas y guardas) · tarjeta "¿Aún no te has dado de alta en el SAT? Recuerda que con Dzuun facturar nunca había sido tan fácil" con 6 pasos (consultar RFC con CURP; inscribirse en línea o con cita; Contraseña y e.firma; elegir régimen, p. ej. RESICO; descargar Constancia de Situación Fiscal; registrarla en Dzuun), nota "Guía informativa, los requisitos pueden cambiar" y enlace subrayado "Para más información ingresa al portal del SAT" → `https://www.sat.gob.mx` (`target="_blank" rel="noopener noreferrer"`) · pie con "Ya tengo cuenta, entrar".
- Los bocetos son guía visual; el código lo escribe y lo explica el equipo. Toda pantalla usa datos ficticios y rotula estimaciones y SIMULADO.
- **Tres decisiones de diseño candidatas para la ficha (sec. 5):** botón "Confirmar" bloqueado mientras haya campos de confianza baja; modo sencillo de un ticket por vez con voz; cola de carga donde un fallo no bloquea el lote.

# CLAUDE.md — Dzuun · Hackathon NVIDIA Oaxaca 2026

> Fuente única de verdad del equipo y contexto para Claude Code. Si algo cambia, se edita aquí.
> Última decisión de alcance: 19-nov-2026. Reloj de 24 h en curso.
> **Nombre del producto: Dzuun** (ver sec. 22). Asistente/mascota: **Bisie'** propuesto en los bocetos; en el resto del documento aún aparece como "Tona" hasta confirmarlo (sec. 21).

## 0. Instrucciones para Claude Code (leer primero)
- Lee este archivo completo antes de escribir código. Si una petición contradice las secciones 1–10, avisa antes de actuar.
- **Nunca inventes** métricas, resultados de entrenamiento, logs ni casos de prueba. Todo número debe venir de una ejecución real.
- Marca como `SIMULADO` en código, UI y documentación todo lo que no sea real (timbrado, QR del PDF, cualquier "emisión").
- No incluyas claves, tokens, `.env` ni credenciales. `.env*` y `serviceAccount*.json` van en `.gitignore`.
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
| P0 | Login con Google → carga por lote → detección + OCR → clasificar (ingreso / egreso / pago) → ¿tiene CFDI? → revisión con confianza → guardar → Tona pide datos faltantes y explica |
| P1 | Modo accesibilidad (Tona narra, un ticket a la vez) y modo detalle; conciliación ticket vs SPEI; pre-emisión CFDI 4.0 simulada (XML + PDF) |
| P2 | Indicador estimado de IVA acreditable; guía de alta ante el SAT; factura global |
- **Simulado (declarado):** timbrado ante PAC, QR del PDF, cualquier emisión real.

## 12. Régimen fiscal de la demo
- **RESICO persona física (clave 626)**, verificar en `c_RegimenFiscal`.
- Se muestra: ingresos del periodo, gastos CON CFDI (IVA acreditable estimado) y gastos SIN CFDI (probablemente no acreditables). No se calcula ISR.
- Todo rotulado "estimación, no determinación oficial". Regla gancho: efectivo > 2,000 MXN → advertencia (verificar aplicación).
- Reglas con fuente, periodo, supuestos y casos de prueba.

## 13. Flujo
1. Login con Google. 2. Subir N fotos (cola con estado por archivo; un fallo no bloquea el lote). 3. Visión: OCDNet detecta líneas de texto y OCRNet lee cada línea (sec. 24). El LLM asigna cada línea a un campo. 4. Reglas en código: subtotal + IVA 16 % = total, catálogos SAT por consulta. 5. Tona propone clasificación y categoría, pregunta lo que falta. 6. Revisión humana obligatoria. 7. Confirmar → guardar → (P1) XML/PDF simulado.
- **Ingreso vs egreso:** el usuario configura nombre/RFC de su negocio; si el emisor coincide → ingreso, si no → egreso; si no se lee emisor → Tona pregunta.
- **¿Tiene CFDI?:** se activa con `uuid_cfdi` o `qr_cfdi` detectados; se informa como "indicios" con confianza.

## 14. Confianza
`conf_campo = conf_caja × conf_ocr × (1 si pasa reglas, si no 0.5)`. Verde ≥ 0.85, amarillo 0.6–0.85, rojo < 0.6 (calibrar con validación). Rojo exige revisión. Confianza global del ticket = mínimo de campos clave.

## 15. Modos de interfaz (mismos datos, dos vistas)
- **Accesibilidad:** texto grande, alto contraste, botones grandes, Tona narra por voz (`speechSynthesis`, es-MX) y guía un ticket por vez.
- **Detalle:** tabla de campos, imagen con cajas, confianza por campo, edición masiva.

## 16. Arquitectura (Firebase)
```text
PWA (Next.js + TypeScript + Tailwind, Vercel)
   ├── Firebase Auth (Google)  ·  Firestore  ·  Cloud Storage for Firebase
   └── HTTPS + ID token ── Cloudflare Tunnel ── Servidor NGC (FastAPI :8000)
                                                  ├── POST /vision/analizar
                                                  └── POST /asistente/chat (stream)
```
- **Auth:** Google con `signInWithRedirect` en móvil; agregar el dominio de Vercel a "Authorized domains" en Firebase Auth.
- **Seguridad:** FastAPI verifica el ID token de Firebase (`firebase-admin`) en cada petición; CORS solo al dominio de la PWA; límite de tamaño de imagen.
- **Sin Firebase Functions:** la lógica de servidor va en rutas de Next.js (generación CFDI simulado) y en FastAPI. Verificar si Storage requiere plan Blaze en el proyecto.
- **Firestore:** `users/{uid}`, `users/{uid}/lotes/{id}`, `users/{uid}/operaciones/{id}` (tipo, categoria, total, iva, fecha, folio, tiene_cfdi, uuid, conf_global, estado, campos, imagen_path, createdAt), `.../facturas/{id}`, `.../mensajes/{id}`. Reglas de seguridad: cada usuario solo lee y escribe bajo su `uid`.
- Reglas fiscales y catálogos SAT en código; el modelo propone, el código valida. Nunca emitir sin pantalla de revisión.

### Contratos de API
`POST /vision/analizar` (multipart: imagen) → un solo JSON ya clasificado. Por dentro, el backend encadena: `pipeline/` (OCDNet → OCRNet → segmentos) → `llm_service.py` (segmentos → campos) → `reglas_fiscales.py` (validaciones).
```json
{
  "doc_tipo": "ticket | spei | desconocido",
  "segmentos": [{"id": 21, "texto": "$1363.00", "poligono": [[372,437],[493,438],[493,460],[372,459]], "linea": 14, "conf_caja": 0.96, "conf_ocr": 0.91}],
  "campos": [{"nombre": "total", "valor": "1363.00", "texto_original": "$1363.00", "conf": 0.87, "seg": [21]}],
  "items": [{"cantidad": "4", "descripcion": "TACOS DE CECINA", "precio_unitario": "90.00", "importe": "360.00", "conf": 0.9, "seg": [8, 9, 10]}],
  "categoria_propuesta": "restaurante",
  "tiene_cfdi": false, "uuid_cfdi": null,
  "validaciones": [{"regla": "subtotal_mas_iva_igual_total", "ok": true, "detalle": "..."}],
  "conf_global": 0.78,
  "modelos": {"ocdnet": {"archivo": "...", "sha256": "..."}, "ocrnet": {"archivo": "...", "sha256": "..."}, "llm": {"base": "Qwen2.5-7B-Instruct", "adaptador": "...", "sha256": "..."}},
  "errores": [{"codigo": "CAMPO_FALTANTE", "campo": "rfc", "mensaje": "..."}]
}
```
- `seg` enlaza cada campo con sus segmentos (caja y confianza para la revisión). `modelos` acredita ante el jurado qué pesos entrenados se usaron.
- Ejemplos SIMULADOS para programar sin modelos: `backend-ia/fixtures/` (ver su README).

`POST /asistente/chat` → `{ "mensaje": "...", "modo": "accesibilidad|detalle", "contexto": { "operacion_id": "..." } }`, respuesta en streaming (SSE).

## 17. Modelos (decisión final)
| Componente | Modelo base | Método | Licencia | Plan B |
|---|---|---|---|---|
| Visión: detección de líneas | OCDNet (NVIDIA TAO 5.5.0, pesos preentrenados de NGC) | Ajuste fino en el lab, fp16 | Verificar licencia del modelo en su ficha de NGC | — |
| Visión: lectura de líneas | OCRNet (NVIDIA TAO 5.5.0, pesos preentrenados de NGC) | Ajuste fino en el lab, fp16 | Verificar licencia del modelo en su ficha de NGC | — |
| Asistente "Tona" | Qwen2.5-7B-Instruct | QLoRA NF4 + tablas SAT por consulta | Apache-2.0 | Qwen2.5-3B-Instruct |
- **Visión (19/20-nov-2026):** se reemplazó YOLO11s + PaddleOCR por TAO OCDNet + OCRNet. El detector ya no tiene clases de campo: detecta líneas y el LLM decide qué línea es comercio, RFC, total, etc. Detalle en sec. 24.
- **Asistente:** se mantiene el QLoRA de esta sección como trabajo aparte del de visión (requisito de ajuste de ambos modelos, sec. 2).
- **Hiperparámetros iniciales del QLoRA (ajustar con validación):** NF4, r=16, alpha=32, capas lineales, lr 2e-4, 2–3 épocas, secuencia 1024.
- **Dataset de Tona (JSONL, ~1,500–3,000 ejemplos sintéticos revisados):** (a) texto OCR → JSON, (b) ingreso/egreso/categoría, (c) conversación: datos faltantes, explicación, narración, fuera de alcance, pedir confirmación.
- **Personalidad:** amable, cercana, frases cortas, sin jerga; nunca presenta estimaciones como oficiales; si no sabe, lo dice. Nombre propuesto: Tona.
- **NVIDIA a documentar:** TAO Toolkit 5.5 (entrenamiento de OCDNet/OCRNet), NGC (pesos preentrenados y contenedores), GPU T4 del lab DLI. Opcional: exportar a ONNX y optimizar con TensorRT (despliegue). Opcional: NeMo.

## 18. Datos
- Tickets sintéticos: `training/scripts/main.py` exporta imagen + líneas de texto con caja; `prep_mod.py` las convierte a formato ICDAR para OCDNet. Variar plantillas, fuentes, papel, perspectiva, desenfoque, sombras, arrugas, tinta desvanecida.
- 30–50 fotos reales de tickets, con datos personales tapados, SOLO para prueba (no se entrena con ellas). Si hay tiempo, 20–30 reales anotadas pueden sumarse al entrenamiento.
- Split por PLANTILLA, no por imagen. Aumentos solo en train. Todo sintético marcado como tal; procedencia y licencia de datasets públicos registradas.

## 19. Estructura del repo
```text
hackathon-nvidia-oaxaca-2026/
├── CLAUDE.md   README.md
├── docs/            ficha PDF, pruebas de uso, evidencias, declaracion_ia.md,
│                    prompt-bueno.md (prompts finales de Stitch), prompt-google-stitch.md (versión con análisis de contraste)
│                    fuentes/ (diccionarios zapotecos), pruebas_uso/, evidencias/
├── frontend-pwa/    Next.js (TS) + Tailwind -> Vercel; Firebase client SDK
├── backend-ia/      FastAPI: vision_pipeline.py, llm_service.py, reglas_fiscales.py, auth_firebase.py
│                    pipeline/ (inferencia OCDNet -> OCRNet -> segmentos), fixtures/ (ejemplos SIMULADOS del contrato)
├── firebase/        firestore.rules, storage.rules (sin claves)
└── training/
    ├── data/        raw/ (fotos reales de prueba, fuera de git), synthetic/, ocdnet/, ocrnet/
    ├── specs/       YAML de TAO (OCDNet, OCRNet)
    ├── scripts/     main.py, aumentar.py, prep_mod.py, prep_ocrnet.py, ver_cajas.py, verificar_specs.py, run_lab.sh
    ├── LAB.md       paso a paso para entrenar en el lab (run_lab.sh)
    ├── notebooks/
    └── asistente/   dataset JSONL, train_qlora.py, test_10_casos.py, logs/, adapters/
```

## 20. Roles y plan
- **Roles:** 1) Visión y datos · 2) Asistente y dataset conversacional · 3) Backend, reglas fiscales, CFDI simulado, túnel y auth · 4) PWA, HCI, pruebas con usuarios, ficha y video.
- **Plan (18 h restantes al 19-nov 19:00):** 0–2 acceso GPU y entorno · 2–6 entrenar visión + dataset Tona · 6–10 QLoRA + backend + PWA · 10–14 integración y modos · 14–16 evaluación y 2 pruebas de uso · 16–18 ficha, presentación, video y registro. Si no hay GPU en 3 h, reducir alcance y avisar.

## 21. Pendientes
- [ ] Método de acceso al GPU; confirmar si créditos DLI cuentan como servidores proporcionados
- [ ] `nvidia-smi` funcionando; túnel probado desde la PWA
- [ ] Proyecto Firebase creado, Google Auth activo, dominio de Vercel autorizado; confirmar si Storage requiere Blaze
- [ ] Reglas de Firestore/Storage por `uid` desplegadas
- [ ] Verificar clave 626 y reglas RESICO en fuentes oficiales
- [x] Nombre de la app: **Dzuun** (19-nov-2026)
- [ ] Confirmar asistente/mascota **Bisie'** y reemplazar "Tona" en este archivo, dataset y prompts del LLM
- [ ] Verificar *dzuun* y *bisieꞌ* (escritura y pronunciación) y citar la fuente en la ficha
- [ ] Verificar los pasos de alta en el SAT de la bienvenida contra la ficha vigente en sat.gob.mx
- [ ] Elegir herramienta de bocetos → Figma (conectar MCP de Figma si se usará para pasar diseño a código)
- [ ] Registrar en `docs/declaracion_ia.md` el uso de Claude Code para naming, prompts de Stitch y paleta
- [ ] Declaración de IA firmada
- [ ] Visión: configurar la NGC API key en el lab (`ngc config set` y `docker login nvcr.io`, la hace el usuario)
- [ ] Visión: crear `~/.tao_mounts.json` en el lab
- [ ] Visión: descargar la imagen Docker de TAO 5.5.0 desde nvcr.io
- [ ] Visión: entrenamiento corto de prueba (1–2 épocas) para validar los specs
- [ ] Visión: conseguir 30–50 fotos reales de tickets de prueba con datos personales tapados
- [ ] Verificar licencias de OCDNet/OCRNet en sus fichas de NGC

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

---

# Visión: entrenamiento con TAO

## 24. Flujo de entrenamiento y entorno
- **Objetivo:** leer tickets de compra y venta para extraer comercio, RFC, fecha, folio, artículos, subtotal, IVA y total, y que el usuario los revise antes de guardar.
- **Flujo:** foto del ticket → **OCDNet** (detecta líneas de texto) → **OCRNet** (lee cada línea) → LLM, con few-shot o RAG, que extrae los campos → validación aritmética y de formato en `backend-ia/reglas_fiscales.py` (subtotal + IVA = total, RFC, fecha) → pantalla de revisión y corrección → guardado.
- **Decisiones:**
  - Visión con NVIDIA TAO Toolkit: OCDNet + OCRNet, ajustados desde pesos preentrenados de NGC.
  - Datos de entrenamiento: tickets sintéticos de `training/scripts/main.py`. Las fotos reales (30–50, con datos personales tapados) son solo de prueba. Si hay tiempo, 20–30 reales anotadas pueden sumarse al entrenamiento.
  - Línea base: OCDNet/OCRNet preentrenados sin ajustar, comparados contra los ajustados.
  - NVIDIA DALI descartado: el dataset es pequeño y TAO ya trae su cargador.
  - Opcional si sobra tiempo: exportar a ONNX y optimizar con TensorRT (cubre "despliegue" en la rúbrica NVIDIA).
  - Presupuesto: unas 10 h antes de la prueba en vivo.
- **Dónde se trabaja:**
  - **El entrenamiento se hace en el lab:** T4, TAO 5.5.0. OCDNet en fp16; OCRNet en fp32 (TAO 5.5 no ofrece fp16 para OCRNet).
  - **En local:** generación de datos, conversión de formatos, pipeline de inferencia, extracción con LLM y app. Todo esto debe poder probarse sin GPU.
- **Entorno del lab (verificado):**
  - JupyterLab en la nube, contenedor de curso NVIDIA DLI, ruta de trabajo `/dli/task`, usuario root, Ubuntu.
  - Python 3.10.12: el comando es `python3`; pip está en `/usr/local/bin/pip`.
  - GPU Tesla T4 de 15 GB, driver 545.23.08, CUDA 12.3. **Sin bf16: entrenar en fp16.**
  - No hay torch, transformers ni peft. TAO corre sus modelos en sus propios contenedores.
  - nvidia-tao 5.5.1 (launcher), toolkit 5.5.0. Docker funciona (`/usr/bin/docker`, socket `/var/run/docker.sock`). Aún no hay imágenes descargadas: se bajan de nvcr.io.
  - Falta `~/.tao_mounts.json`: TAO lo busca y define qué carpetas se montan en los contenedores.
  - NGC CLI 3.57.2 en `/dli/task/ngc_assets/ngc-cli/ngc`. Hay internet: nvcr.io y api.ngc.nvidia.com responden 401, o sea que solo faltan credenciales. La NGC API key la configura el usuario con `ngc config set` y `docker login`.
  - Disco: 90 GB libres. `/dli/task/models` está vacía; `/dli/task/data` solo trae un zip de un curso que no se usa.
  - **La sesión es temporal:** pesos, logs y specs se copian fuera antes de que cierre.
- **Máquina local:** Ubuntu 24.04, Python 3.12, sin garantía de GPU.
- **Rúbrica (resumen):** producto funcional 20, visión 20, asistente 20, HCI 15, problema 10, herramientas NVIDIA 10, presentación 5. Se exige:
  - entrenar o ajustar durante el evento, con train/val/test separados, pesos y logs guardados, y comparación base vs ajustado;
  - corrección humana y manejo de errores;
  - funciones simuladas identificadas;
  - uso de herramientas de IA declarado;
  - sin datos sensibles ni claves;
  - ≥5 casos de prueba de la app, incluidos errores y datos inválidos.
- **Etapas (una a la vez, con confirmación del usuario entre cada una):**
  1. Corregir `main.py` y `prep_mod.py`, y agregar `ver_cajas.py`.
  2. Aumentos tipo foto de celular, con las cajas como polígonos de 4 puntos.
  3. Exportar datos para OCRNet.
  4. Specs YAML de TAO 5.5.0.
  5. `run_lab.sh`, con corrida corta de prueba.
  6. Pipeline de inferencia local + extracción con LLM + validaciones.
  7. Evaluación base vs ajustado sobre fotos reales.
- **Problemas de los scripts originales (corregidos en la Etapa 1, 20-nov-2026):**
  1. El separador y el encabezado de artículos se dibujan sin anotarse.
  2. Las cajas de totales incluyen espacios de relleno.
  3. La línea de TOTAL puede salirse de los 440 px.
  4. No hay split de test con comercios y productos ausentes en train.
  5. Las comas en el texto rompen el formato ICDAR.
  6. Falta semilla global.
  7. Hay poca variedad de comercios, productos y formatos.
  8. Usan rutas relativas al directorio actual.

### Verificado en el código fuente de TAO 5.5 (rama `tao_5.5_release` de NVIDIA/tao_pytorch_backend, 20-nov-2026)
- **OCDNet:** carpeta `img/` + `gt/gt_<nombre>.txt`. Cada línea: 8 coordenadas y el texto; el texto es `','.join(params[8:])`, así que las comas no rompen nada. `ignore_tags: ['*', '###']`. El spec de ejemplo usa `backbone: deformable_resnet18` y `pretrained_model_path`.
- **OCRNet:** `dataset_convert` crea LMDB desde `input_img_dir` + `gt_file` con líneas `imagen<TAB>etiqueta`. La ruta sin LMDB (`train_gt_file`) separa con `split()` y no admite espacios: usar LMDB.
- **Lista de caracteres:** un carácter por línea, leído con `strip()`; **el espacio no se puede incluir**.
- **Filtro silencioso:** se descarta toda etiqueta con más de `max_label_length` caracteres (25 por defecto) o con un carácter fuera de la lista, comparando `label.lower()`. Luego codifica la etiqueta tal cual. Por eso: **etiquetas y lista en minúsculas**; el backend pasa a mayúsculas.
- La lista arma la expresión regular `[^<caracteres>]`: el `-` va al final.
- Entrada por defecto: escala de grises 32×100, `TPS: True`, `ResNet`, `BiLSTM`, `CTC`.
- Con `train.pretrained_model_path` se hace fine-tune: si la lista de caracteres cambia el tamaño de la salida, TAO descarta solo la capa de predicción (`load_for_finetune`) y conserva el resto.
- **Specs (Etapa 4):** `training/specs/ocdnet.yaml` y `ocrnet.yaml`. Cada clave se comprueba con `scripts/verificar_specs.py` contra el esquema de TAO 5.5. **OCRNet entrena en fp32** porque TAO 5.5 no expone precisión para OCRNet; el fp16 se aplica en su motor TensorRT. Decisiones y pendientes en `training/specs/README.md`.
- **Lab (Etapa 5):** `training/scripts/run_lab.sh` por pasos (verificar, datos, montajes, modelos, convertir, prueba, entrenar, evaluar, exportar, empaquetar); guía en `training/LAB.md`. Los datos se regeneran en el lab con la misma semilla y se comparan con `training/huella_datos.sha256`. Probado de punta a punta con simuladores de tao/ngc/nvidia-smi; falta la corrida real.
- **Verificado en el lab con `tao info --verbose` (20-nov-2026):** Tesla T4, driver 545.23.08, 15360 MiB, 90 GB libres. ocdnet/ocrnet: grupo `model`, imagen `nvcr.io/nvidia/tao/tao-toolkit:5.5.0-pyt`; `gen_trt_engine` de ambos en grupo `deploy`, imagen `5.5.0-deploy`.
- **Sin verificar todavía:** formato de `~/.tao_mounts.json`, versiones y licencias de los modelos preentrenados en NGC. Se verifican en el lab.

## 25. Reglas de trabajo (entrenamiento de visión)
- Trabajar una etapa a la vez. Al terminar cada una: explicar qué se hizo y cómo probarla, y esperar confirmación.
- No inventar claves de los specs de TAO. Verificarlas contra la documentación oficial de TAO 5.5 y, si existe, contra los specs por defecto del contenedor (acción `download_specs`). Lo que no se pueda verificar se marca como pendiente de validar en el lab.
- Explicar brevemente el porqué de cada decisión técnica.
- Comentarios en el código solo cuando el motivo no sea obvio. Nada de docstrings genéricos ("Función que…") ni emojis. Al corregir los scripts originales, quitar sus comentarios de ese estilo.
- Nunca escribir claves ni credenciales en archivos. La NGC API key va por variable de entorno o con `ngc config set`.
- Nada de datos sensibles reales. Los RFC de ejemplo son inventados.
- El README declara qué es simulado (facturación CFDI) y qué herramientas de IA se usaron.
- Dependencias fijadas en `requirements.txt`.

### Uso de los scripts (local)
```bash
cd training && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/main.py --cantidad 500 --semilla 42   # data/synthetic: images/, anotaciones.json, manifiesto.json
.venv/bin/python scripts/aumentar.py --copias 2                 # data/augmented: train = original + 2 fotos simuladas; val/test = 1 foto simulada
.venv/bin/python scripts/prep_mod.py --origen data/augmented     # data/ocdnet/{train,val,test}/{img,gt}  (una caja por palabra)
.venv/bin/python scripts/prep_ocrnet.py                          # data/ocrnet/{train,val,test}/{images,gt_list.txt} + character_list
.venv/bin/python scripts/ver_cajas.py -n 4                      # data/revision_cajas/*.png + conteos
```
- Un ticket = una lista de **segmentos** (texto con caja de 4 puntos, etiqueta y número de fila), y cada segmento trae sus **palabras** con su propia caja. Una fila con hueco grande (p. ej. "TOTAL" ... "$446.22") son dos segmentos. **OCDNet y OCRNet trabajan por palabra** (20-nov-2026, porque OCRNet de TAO no admite espacios); el backend reagrupa palabras en filas para el LLM.
- `###` marca regiones a ignorar: separadores, código de barras e iniciales del logo.
- El split es al generar: 80/10/10 de tickets; los nombres de comercio y los productos se reparten 70/15/15, así que val y test solo usan comercios y productos que no existen en train. Lo registra `manifiesto.json`.
- `aumentar.py` (Etapa 2) simula foto de celular: fondo (madera, mesa, tela, kraft, oscuro), perspectiva y rotación ±8° con homografía, pliegues fotométricos, sombra, gradiente de luz y tinte, desenfoque gaussiano o de movimiento, escala 0.75–1.5, ruido y JPEG 35–90. Los polígonos se transforman con la misma homografía. Las versiones de un ticket quedan en su mismo split. **Decisión 20-nov-2026 (aclara la sec. 18):** train lleva el original + 2 copias aleatorias; val y test llevan UNA versión tipo foto que reemplaza al original, para que la selección de checkpoint y la prueba se parezcan al uso real. No hay versiones de una imagen en splits distintos.
- **Resolución (20-nov-2026):** `main.py --escala-render 2` (por defecto) dibuja al doble. Con escala 1 el texto chico quedaba de ~10 px y, tras desenfoque y JPEG, era ilegible incluso para una persona; ahora los recortes de OCRNet miden 15–38 px de alto. `main.py` y `aumentar.py` corren en paralelo con una semilla por ticket, así que el resultado no depende del orden de los procesos.
- Simplificación: todo artículo lleva IVA 16 % (en la realidad muchos alimentos son tasa 0 %).

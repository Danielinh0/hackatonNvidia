# CLAUDE.md — Hackathon NVIDIA Oaxaca 2026

> Fuente única de verdad del equipo y contexto para Claude Code. Si algo cambia, se edita aquí.
> Última decisión de alcance: 19-nov-2026. Reloj de 24 h en curso.

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
- **Fuera de alcance:** el alta ante el SAT. Idea P2: Tona acompaña como guía de pasos.

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
1. Login con Google. 2. Subir N fotos (cola con estado por archivo; un fallo no bloquea el lote). 3. Visión clasifica y detecta regiones; OCR solo sobre recortes. 4. Reglas en código: subtotal + IVA 16 % = total, catálogos SAT por consulta. 5. Tona propone clasificación y categoría, pregunta lo que falta. 6. Revisión humana obligatoria. 7. Confirmar → guardar → (P1) XML/PDF simulado.
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
├── docs/            ficha PDF, pruebas de uso, evidencias, declaracion_ia.md
├── frontend-pwa/    Next.js (TS) + Tailwind -> Vercel; Firebase client SDK
├── backend-ia/      FastAPI: vision_pipeline.py, llm_service.py, reglas_fiscales.py, auth_firebase.py
├── firebase/        firestore.rules, storage.rules (sin claves)
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
- [ ] Proyecto Firebase creado, Google Auth activo, dominio de Vercel autorizado; confirmar si Storage requiere Blaze
- [ ] Reglas de Firestore/Storage por `uid` desplegadas
- [ ] Verificar clave 626 y reglas RESICO en fuentes oficiales
- [ ] Nombre final del asistente; declaración de IA firmada

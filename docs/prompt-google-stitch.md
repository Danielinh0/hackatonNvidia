# Prompts para Google Stitch — bocetos de la PWA

> Basado en `CLAUDE.md` (secciones 3, 5, 10–16). Generado con apoyo de Claude Code (Anthropic); registrar en `docs/declaracion_ia.md`.
> **Nombre provisional:** app **Meel** ("dinero" en zapoteco de Mitla) y mascota/asistente **Bisie'** ("semilla de cacao"). Si cambia el nombre, reemplazar con buscar/reemplazar. En `CLAUDE.md` el asistente sigue llamándose **Tona** hasta que se decida.

## Cómo usarlo
1. En Stitch elige **Mobile** (Standard o Experimental).
2. Pega primero el **prompt maestro** para fijar el estilo y generar la pantalla de inicio.
3. Luego pega **un prompt por pantalla**, en orden, en el mismo proyecto para que conserve el estilo. Stitch rinde mejor con una pantalla por prompt que con todo junto.
4. Ajusta con cambios pequeños ("haz los botones más grandes", "cambia el color primario a…"), uno a la vez.
5. Exporta a Figma o copia el HTML/Tailwind como referencia para `app/`. Los bocetos son guía visual: el código se escribe y se entiende por el equipo.

---

## 1. Prompt maestro (estilo + contexto)

```text
Diseña una PWA móvil en español de México llamada "Meel" para personas y negocios pequeños recién dados de alta ante el SAT (régimen RESICO). La app sustituye la bolsa o cajón donde guardan tickets: el usuario toma fotos de tickets de venta, tickets de gasto y comprobantes de transferencia SPEI/CoDi; una IA detecta los campos (total, fecha, folio, emisor, RFC, IVA, forma de pago, QR/UUID del CFDI), los clasifica como ingreso, egreso o pago y dice si hay indicios de CFDI. El usuario SIEMPRE revisa y corrige antes de guardar.

Hay una mascota-asistente llamada "Bisie'": un granito de cacao con carita amable (el cacao fue moneda en Mesoamérica). Habla con frases cortas, cercanas y sin jerga fiscal; aparece como burbuja de chat y avatar pequeño.

Estilo visual: enérgico, confiable y sencillo, con emoción pero sin saturar. Paleta de marca obligatoria (no inventes otros colores de marca):
- Rojo-naranja #FF3A24: color de marca y emoción. Úsalo en la mascota, encabezados destacados, ilustraciones, iconos activos de la barra inferior y en el botón principal SOLO con texto blanco grande y en negrita (≥ 19 px bold), porque el blanco sobre este rojo tiene contraste 3.6:1.
- Azul #104094: color de confianza y acción. Botones secundarios y de navegación, enlaces, selector de modo, campos activos. Texto blanco sobre azul (contraste 9.6:1).
- Amarillo lima neón #D4FF24: contraste y emoción. Úsalo como acento vibrante: fondos de chips, insignias, resaltados tipo marcatextos, burbujas de la mascota y el indicador de la pestaña activa, SIEMPRE con texto #000F2A encima (16.5:1). Brilla especialmente sobre superficies oscuras #000F2A (encabezado o tarjeta de resumen oscura con cifras en lima). Nunca texto, iconos ni bordes lima sobre fondo blanco o crema (1.2:1, invisible).
- Texto #000F2A (azul casi negro) para todo el texto de lectura, sobre fondo blanco #FFFFFF o crema muy suave #FFF8EC.
Estados del sistema (aparte de la marca, siempre con icono + texto, nunca solo color): éxito/confirmar verde #1E8E4E, advertencia ámbar #F2A900 con icono triangular y texto #000F2A (no uses el lima para advertencias), error con icono y borde rojo oscuro #B3261E para no confundirlo con el rojo de marca.
Tipografía sans redonda y legible, mínimo 16 px en cuerpo. Botones grandes (mínimo 48 px de alto), esquinas redondeadas, mucho espacio en blanco, iconos lineales simples. Contraste WCAG AA como mínimo.

Reglas de contenido: cualquier cifra fiscal se rotula "Estimación, no es una determinación oficial del SAT". Cualquier factura o timbrado se rotula visiblemente "SIMULADO". Nada de datos reales: usa nombres y RFC ficticios (ej. "Tlayudas Doña Mari", RFC "XAXX010101000").

Navegación inferior con 4 pestañas: Inicio, Subir, Operaciones, Bisie'. Selector de modo en el encabezado: "Modo sencillo" (accesibilidad) y "Modo detalle".

Genera primero la pantalla de Inicio: saludo con la mascota, resumen del mes (ingresos, gastos con CFDI, gastos sin CFDI, todo marcado como estimación), botón principal grande "Subir tickets", y lista corta de las últimas 3 operaciones con su estado (confirmado / por revisar).
```

---

## 2. Prompts por pantalla

### 2.1 Bienvenida y login
```text
Pantalla de bienvenida de Meel: mascota Bisie' grande saludando, título "Saca tus tickets del cajón", subtítulo "Toma fotos, Bisie' las ordena y tú confirmas". Un solo botón grande "Continuar con Google" (logo de Google). Debajo, texto pequeño: "Usamos tus fotos solo para leer tus tickets. Datos de demostración." Estado de carga del botón mientras se abre Google, y un mensaje de error amable si falla la conexión con opción "Reintentar".
```

### 2.2 Configurar mi negocio (primer uso)
```text
Pantalla de configuración inicial en 2 pasos con barra de progreso. Paso 1: "¿Cómo se llama tu negocio?" con campo de nombre y campo RFC (con ayuda: "Lo encuentras en tu constancia de situación fiscal"), validación en línea del formato de RFC. Paso 2: régimen fiscal preseleccionado "RESICO persona física (626)" con botón "Cambiar". Burbuja de Bisie' explicando: "Con tu nombre y RFC sé qué tickets son ventas tuyas (ingresos) y cuáles son compras (gastos)". Botón "Guardar y empezar".
```

### 2.3 Subir tickets (carga por lote)
```text
Pantalla "Subir tickets". Dos botones grandes: "Tomar foto" (cámara) y "Elegir de la galería" (permite varias). Debajo, una cola de archivos tipo lista, cada uno con miniatura, nombre y estado con icono y color: "En espera", "Subiendo 45 %", "Leyendo con IA…", "Listo para revisar" (verde), "No se pudo leer" (rojo, con botón "Reintentar" y "Quitar"). Mensaje fijo: "Si una foto falla, las demás siguen". Consejos plegables para buena foto: buena luz, ticket completo, sin sombras. Botón inferior "Revisar 4 listos".
```

### 2.4 Revisión de un ticket — Modo detalle
```text
Pantalla de revisión en "Modo detalle". Arriba, la foto del ticket con cajas de colores sobre cada campo detectado (total, fecha, folio, emisor, RFC, IVA, forma de pago, QR). Debajo, tabla editable de campos: nombre, valor, chip de confianza con color, icono y palabra (verde #1E8E4E "Alta" ≥ 85 %, ámbar #F2A900 con texto #000F2A "Media" 60–85 %, rojo oscuro #B3261E "Baja" < 60 %) e icono de lápiz. Los campos en rojo aparecen primero con aviso "Revisa este dato". Tarjeta "Clasificación propuesta": chips Ingreso / Egreso / Pago (uno sugerido) y categoría editable. Tarjeta "¿Tiene CFDI?": "Indicios de CFDI: se detectó QR (confianza 78 %)". Validación visible: "Subtotal + IVA 16 % = Total ✓" o advertencia si no cuadra. Botones: "Confirmar y guardar" (verde, deshabilitado mientras haya campos rojos sin revisar) y "Descartar".
```

### 2.5 Revisión de un ticket — Modo sencillo (accesibilidad)
```text
La misma revisión en "Modo sencillo": un ticket a la vez, texto muy grande (24 px+), alto contraste, un solo dato por tarjeta. Bisie' arriba en burbuja: "Este ticket es de Abarrotes López por $245.00 del 12 de noviembre. ¿Es correcto?". Botón de bocina "Escuchar" para leerlo en voz alta. Dos botones enormes: "Sí, es correcto" (verde) y "Corregir" (abre un solo campo con teclado). Indicador "Ticket 2 de 5". Sin tablas ni cajas sobre la imagen; la foto aparece pequeña y se puede ampliar.
```

### 2.6 Bisie' pide datos faltantes
```text
Pantalla de chat con Bisie' sobre un ticket concreto (tarjeta resumen fija arriba: miniatura, total, estado "Falta información"). Mensajes de Bisie' cortos: "No pude leer quién emitió este ticket. ¿Me dices el nombre del negocio?" Respuestas rápidas en chips ("Es mío", "Es de un proveedor", "No sé") y campo de texto con micrófono. Ejemplo de respuesta en streaming con indicador "Bisie' está escribiendo…". Un mensaje donde Bisie' reconoce un límite: "Eso no lo puedo decidir yo; te recomiendo confirmarlo con tu contador o en el portal del SAT." Botón "Aplicar cambios al ticket" que lleva de vuelta a la revisión.
```

### 2.7 Operaciones (historial guardado)
```text
Pantalla "Operaciones": lista de tickets confirmados agrupados por fecha. Cada fila: icono de tipo (ingreso flecha verde, egreso flecha café, pago SPEI), emisor, total, etiqueta "Con CFDI" / "Sin CFDI", y punto de confianza. Filtros en chips: Todos, Ingresos, Gastos, Pagos, Por revisar. Buscador arriba. Estado vacío con Bisie': "Aún no hay operaciones. ¡Sube tu primer ticket!". Al tocar una fila se abre el detalle con la foto y los campos guardados.
```

### 2.8 Resumen del periodo (estimación)
```text
Pantalla "Mi mes" con selector de mes. Tres tarjetas grandes: "Ingresos", "Gastos con CFDI (IVA acreditable estimado)", "Gastos sin CFDI (probablemente no acreditables)". Banda visible en todas: "Estimación, no es una determinación oficial del SAT". Tarjeta de advertencia ámbar #F2A900 con texto #000F2A: "3 gastos en efectivo mayores a $2,000: podrían no ser deducibles", con botón "Ver cuáles". Gráfico simple de barras ingresos vs gastos por semana. Botón "Pregúntale a Bisie'".
```

### 2.9 Pre-factura CFDI 4.0 — SIMULADO
```text
Pantalla "Pre-factura (SIMULADO)": sello diagonal grande "SIMULADO — sin validez fiscal" sobre una vista previa de factura CFDI 4.0 con datos ficticios: emisor, receptor, conceptos, subtotal, IVA, total, régimen 626, y un recuadro gris en lugar del QR con texto "QR simulado". Pasos visibles: 1 Revisar datos, 2 Generar XML y PDF, 3 "Timbrado ante PAC: no implementado". Botones "Descargar PDF de muestra" y "Ver XML". Nota: "Esta es una demostración; no se envía nada al SAT".
```

### 2.10 Errores y estados del sistema
```text
Hoja de estados de error para Meel, en tarjetas con la mascota y un mensaje claro, cada una con una acción: 1) "Sin conexión — tus fotos se guardan y se suben al volver la señal" (Reintentar). 2) "No pude leer esta foto — prueba con más luz y el ticket completo" (Tomar otra). 3) "Faltan datos: total y fecha" (Completar). 4) "El servidor de IA no responde" (Reintentar / Capturar a mano). 5) "Bisie' no sabe responder eso" (Reformular). 6) "Imagen muy pesada, máximo 10 MB" (Elegir otra). Tono amable, sin culpar al usuario, iconos y colores consistentes (advertencia: icono triangular sobre ámbar #F2A900 con texto #000F2A; error: icono y borde rojo oscuro #B3261E, distinto del rojo de marca #FF3A24).
```

---

## 3. Paleta y contraste medido (WCAG 2.1)
| Combinación | Contraste | Uso permitido |
|---|---|---|
| Texto #000F2A sobre blanco | 19.1:1 | Todo el texto |
| Blanco sobre azul #104094 | 9.6:1 | Botones, texto normal |
| #000F2A sobre lima #D4FF24 | 16.5:1 | Chips, insignias, burbujas |
| Lima #D4FF24 sobre #000F2A | 16.5:1 | Cifras/títulos sobre superficie oscura |
| Azul #104094 sobre lima | 8.3:1 | Texto sobre resaltados |
| Rojo #FF3A24 sobre lima | 3.1:1 | Solo elementos grandes; evitar texto |
| #000F2A sobre rojo #FF3A24 | 5.3:1 | Texto normal sobre rojo |
| Blanco sobre rojo #FF3A24 | 3.6:1 | Solo texto grande/negrita (≥ 19 px bold) |
| Rojo #FF3A24 sobre blanco | 3.6:1 | Iconos y títulos grandes, no párrafos |
| Lima #D4FF24 sobre blanco | 1.2:1 | ❌ Nunca para texto, iconos ni bordes |

- El lima #D4FF24 es de marca (emoción), no de estado: se ve verdoso y se confundiría con "confirmado" o con la confianza alta. Por eso advertencias y confianza media usan ámbar #F2A900.
- Rojo de marca ≠ rojo de error: para errores se usa #B3261E + icono, para que el usuario no lea "error" cada vez que ve la marca.
- El semáforo de confianza (sec. 14) siempre lleva palabra e icono además del color (daltonismo).

## 4. Checklist rápido de los bocetos (contra `CLAUDE.md`)
- [ ] Recorrido completo: login → subir → revisar/corregir → guardar → consultar después (sec. 3a).
- [ ] Revisión y corrección antes de confirmar, con confianza por campo (sec. 3d, 14).
- [ ] Errores: imagen no procesada, datos faltantes, fallo de conexión, asistente sin respuesta (sec. 3e).
- [ ] Dos modos con los mismos datos: sencillo (voz, un ticket a la vez) y detalle (sec. 15).
- [ ] Todo lo fiscal rotulado como estimación; factura/timbrado/QR rotulados SIMULADO (sec. 0, 11, 12).
- [ ] Datos ficticios en todas las pantallas.
- [ ] Sirven para justificar 3 decisiones de diseño en la ficha (sec. 5): p. ej. botón de confirmar bloqueado con campos rojos, modo sencillo de un ticket por vez, cola de carga donde un fallo no bloquea el lote.

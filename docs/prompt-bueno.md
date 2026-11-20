# Prompt bueno — Google Stitch

> Versión final y depurada de `docs/prompt-google-stitch.md`, lista para copiar y pegar.
> Nombres provisionales: app **Dzuun** ("trabajo, labor" en zapoteco de Mitla; "dinero" es *meel*) · mascota **Bisie'** ("semilla de cacao"). Cambiar con buscar/reemplazar si se decide otro.
> Generado con apoyo de Claude Code (Anthropic); registrar en `docs/declaracion_ia.md`.

**Uso:** Stitch → modo **Mobile** → pega el **Prompt 1** → después pega **cada pantalla por separado** en el mismo proyecto. Ajusta con cambios pequeños, uno a la vez.

---

## Prompt 1 — Sistema de diseño + Inicio

```text
Diseña una app móvil (PWA) en español de México llamada "Dzuun".

QUÉ ES: ayuda a personas y negocios pequeños recién dados de alta ante el SAT (RESICO) a sacar sus tickets del cajón. El usuario toma fotos de tickets de venta, de gasto y comprobantes SPEI/CoDi; la IA lee los datos, los clasifica como ingreso, egreso o pago, y detecta si hay indicios de CFDI. El usuario SIEMPRE revisa y corrige antes de guardar.

MASCOTA: "Bisie'", un granito de cacao con carita amable y expresiva (el cacao fue moneda en Mesoamérica). Habla con frases cortas, cálidas y sin jerga fiscal. Aparece en burbujas de diálogo y como avatar pequeño.

PALETA (usa solo estos colores de marca):
- #FF3A24 rojo-naranja: marca y emoción. Mascota, títulos grandes, iconos activos y botón principal con texto blanco en negrita de 19 px o más.
- #104094 azul: confianza y acción. Botones secundarios, enlaces, campos activos, selector de modo. Texto blanco encima.
- #D4FF24 lima neón: acento de emoción. Chips, insignias, resaltados tipo marcatextos, burbujas de la mascota e indicador de pestaña activa, siempre con texto #000F2A encima. Luce mejor sobre superficies oscuras #000F2A. Nunca texto, iconos ni bordes lima sobre fondo blanco.
- #000F2A: todo el texto de lectura y superficies oscuras destacadas.
- Fondo blanco #FFFFFF y crema suave #FFF8EC.
COLORES DE ESTADO (siempre con icono y palabra, nunca solo color): éxito verde #1E8E4E, advertencia ámbar #F2A900 con texto #000F2A, error rojo oscuro #B3261E (distinto del rojo de marca).

ESTILO: enérgico pero limpio, moderno, amigable. Tipografía sans redonda, cuerpo mínimo 16 px. Botones de 48 px de alto mínimo, esquinas redondeadas, mucho aire, iconos lineales. Contraste WCAG AA.

REGLAS DE CONTENIDO: toda cifra fiscal lleva la etiqueta "Estimación, no es una determinación oficial del SAT". Toda factura, timbrado o QR fiscal lleva la etiqueta visible "SIMULADO". Usa solo datos ficticios (ej. "Tlayudas Doña Mari", RFC "XAXX010101000").

NAVEGACIÓN: barra inferior con 4 pestañas: Inicio, Subir, Operaciones, Bisie'. En el encabezado, interruptor "Modo sencillo / Modo detalle".

PANTALLA A GENERAR — INICIO: saludo de Bisie' ("¡Hola, Mari! Tienes 3 tickets por revisar"). Tarjeta oscura #000F2A con el resumen del mes en cifras lima: ingresos, gastos con CFDI y gastos sin CFDI, con la etiqueta de estimación. Botón principal grande rojo "Subir tickets". Lista de las últimas 3 operaciones con estado ("Confirmado" / "Por revisar").
```

---

## Pantallas (pegar una por una)

### 2 · Bienvenida y login
```text
Pantalla de bienvenida de Dzuun, desplazable verticalmente, con 4 secciones en este orden:

SECCIÓN 1 — HÉROE: Bisie' grande saludando sobre fondo crema con formas lima de fondo. Logo "Dzuun". Eslogan principal grande en #000F2A con la palabra "más" resaltada en lima tipo marcatextos: "Con Dzuun trabajas menos, facturas más". Subtítulo: "Toma fotos, Bisie' las ordena y tú confirmas". Botón principal grande rojo "Continuar con Google" con su logo. Texto pequeño: "Usamos tus fotos solo para leer tus tickets".

SECCIÓN 2 — CÓMO FUNCIONA: título "Así de fácil". Tres pasos numerados en tarjetas horizontales con icono e ilustración pequeña de Bisie': 1) "Toma foto de tus tickets" (icono cámara). 2) "Bisie' los lee y los ordena" (icono chispa). 3) "Tú revisas y guardas" (icono palomita). Conecta los pasos con una línea punteada.

SECCIÓN 3 — ALTA EN EL SAT: tarjeta destacada con fondo oscuro #000F2A y texto blanco. Título en lima: "¿Aún no te has dado de alta en el SAT?". Subtítulo: "Recuerda que con Dzuun facturar nunca había sido tan fácil". Lista de pasos numerados con círculos lima y número en #000F2A:
  1) "Consulta si ya tienes RFC con tu CURP".
  2) "Inscríbete en el RFC en línea o con cita en una oficina del SAT".
  3) "Crea tu Contraseña y tramita tu e.firma (lleva una memoria USB a tu cita)".
  4) "Elige tu régimen, por ejemplo RESICO, y tu actividad".
  5) "Descarga tu Constancia de Situación Fiscal".
  6) "Regístrala en Dzuun y empieza".
Nota pequeña: "Guía informativa. Los requisitos pueden cambix``ar; confírmalos en el SAT". Al final, enlace de texto subrayado en lima: "Para más información ingresa al portal del SAT" con icono de enlace externo, que abre https://www.sat.gob.mx en una pestaña nueva.

SECCIÓN 4 — PIE: botón secundario azul "Ya tengo cuenta, entrar" y texto legal pequeño.

Incluye también la variante con el botón de Google cargando y la variante de error "No pudimos conectar con Google" con botón "Reintentar".
```

### 3 · Configurar mi negocio
```text
Configuración inicial en 2 pasos con barra de progreso. Paso 1: "¿Cómo se llama tu negocio?" con campo nombre y campo RFC, ayuda "Lo encuentras en tu constancia de situación fiscal" y validación en línea del formato. Paso 2: régimen preseleccionado "RESICO persona física (626)" con botón "Cambiar". Burbuja de Bisie': "Con tu RFC sé qué tickets son tus ventas y cuáles son tus compras". Botón "Guardar y empezar".
```

### 4 · Subir tickets (lote)
```text
Pantalla "Subir tickets". Dos botones grandes: "Tomar foto" y "Elegir de la galería" (varias). Debajo, cola de archivos: miniatura, nombre y estado con icono y palabra: "En espera", "Subiendo 45 %" con barra, "Leyendo con IA…", "Listo para revisar" (verde), "No se pudo leer" (rojo oscuro, botones "Reintentar" y "Quitar"). Aviso: "Si una foto falla, las demás siguen". Consejos plegables para buena foto. Botón fijo inferior "Revisar 4 listos".
```

### 5 · Revisión — Modo detalle
```text
Revisión de un ticket en Modo detalle. Arriba, foto del ticket con cajas de colores sobre cada campo detectado (total, fecha, folio, emisor, RFC, IVA, forma de pago, QR). Debajo, tabla editable: campo, valor, chip de confianza con icono y palabra (verde "Alta", ámbar "Media", rojo oscuro "Baja") y lápiz para editar. Los campos "Baja" van primero con aviso "Revisa este dato". Tarjeta "Clasificación": chips Ingreso / Egreso / Pago con uno sugerido y categoría editable. Tarjeta "¿Tiene CFDI?": "Indicios de CFDI: QR detectado (78 %)". Validación: "Subtotal + IVA 16 % = Total ✓" o advertencia ámbar si no cuadra. Botones: "Confirmar y guardar" (deshabilitado mientras haya campos "Baja" sin revisar) y "Descartar".
```

### 6 · Revisión — Modo sencillo
```text
La misma revisión en Modo sencillo para accesibilidad: un ticket a la vez, texto de 24 px o más, alto contraste, un dato por tarjeta. Bisie' en burbuja lima: "Este ticket es de Abarrotes López por $245.00 del 12 de noviembre. ¿Es correcto?". Botón con bocina "Escuchar". Dos botones enormes: "Sí, es correcto" (verde) y "Corregir" (abre un solo campo). Indicador "Ticket 2 de 5". Foto pequeña que se puede ampliar. Sin tablas.
```

### 7 · Chat con Bisie'
```text
Chat con Bisie' sobre un ticket. Tarjeta fija arriba: miniatura, total y estado "Falta información". Bisie': "No pude leer quién emitió este ticket. ¿Me dices el nombre del negocio?". Respuestas rápidas en chips lima: "Es mío", "Es de un proveedor", "No sé". Campo de texto con micrófono. Indicador "Bisie' está escribiendo…". Otro mensaje donde Bisie' reconoce un límite: "Eso no lo puedo decidir yo; confírmalo con tu contador o en el portal del SAT". Botón "Aplicar al ticket".
```

### 8 · Operaciones
```text
Pantalla "Operaciones": tickets confirmados agrupados por fecha. Cada fila: icono de tipo (ingreso, egreso, pago SPEI), emisor, total, etiqueta "Con CFDI" o "Sin CFDI" y nivel de confianza. Buscador arriba y filtros en chips: Todos, Ingresos, Gastos, Pagos, Por revisar. Estado vacío con Bisie': "Aún no hay operaciones. ¡Sube tu primer ticket!".
```

### 9 · Mi mes (estimación)
```text
Pantalla "Mi mes" con selector de mes. Tres tarjetas: "Ingresos", "Gastos con CFDI — IVA acreditable estimado", "Gastos sin CFDI — probablemente no acreditables". Banda visible: "Estimación, no es una determinación oficial del SAT". Advertencia ámbar: "3 gastos en efectivo de más de $2,000 podrían no ser deducibles" con botón "Ver cuáles". Gráfico de barras simple ingresos vs gastos por semana (azul y rojo de marca). Botón "Pregúntale a Bisie'".
```

### 10 · Pre-factura SIMULADA
```text
Pantalla "Pre-factura (SIMULADO)". Vista previa de CFDI 4.0 con datos ficticios (emisor, receptor, conceptos, subtotal, IVA, total, régimen 626) y un sello diagonal grande "SIMULADO — sin validez fiscal". Recuadro gris en lugar del QR con texto "QR simulado". Pasos: 1 Revisar datos ✓, 2 Generar XML y PDF ✓, 3 "Timbrado ante PAC: no implementado". Botones "Ver PDF de muestra" y "Ver XML". Nota: "Demostración: no se envía nada al SAT".
```

### 11 · Errores y estados
```text
Hoja con 6 tarjetas de estado, cada una con Bisie', mensaje amable y una acción: 1) "Sin conexión: tus fotos se suben al volver la señal" (Reintentar). 2) "No pude leer esta foto: prueba con más luz y el ticket completo" (Tomar otra). 3) "Faltan datos: total y fecha" (Completar). 4) "El servidor de IA no responde" (Reintentar / Capturar a mano). 5) "Bisie' no sabe responder eso" (Reformular). 6) "Imagen muy pesada, máximo 10 MB" (Elegir otra). Advertencias en ámbar #F2A900, errores en rojo oscuro #B3261E, siempre con icono.
```

---

## Antes de presentar los bocetos
- [ ] Recorrido completo: login → subir → revisar y corregir → guardar → consultar después.
- [ ] Confianza por campo y botón de confirmar bloqueado si hay datos dudosos.
- [ ] Errores cubiertos: foto ilegible, datos faltantes, sin conexión, asistente sin respuesta.
- [ ] Modo sencillo y modo detalle con los mismos datos.
- [ ] Estimaciones y "SIMULADO" visibles; solo datos ficticios.
- [ ] Lima nunca sobre blanco; rojo de error distinto del rojo de marca.
- [ ] Pasos de alta en el SAT verificados contra la ficha vigente en sat.gob.mx (los requisitos cambiaron en 2024–2025). En código, el enlace lleva `target="_blank" rel="noopener noreferrer"`.

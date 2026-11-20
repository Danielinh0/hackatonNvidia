# API local de facturas (CFDI 4.0) · Dzuun

> **SIMULADO.** Con `CFDI_PROVIDER=mock` (el valor por defecto) ninguna factura sale de la computadora: el
> "PAC" es un simulador local y UUID, sello, certificado y timbre son ficticios. Con `CFDI_PROVIDER=facturama`
> se usa el **sandbox** de Facturama, que tampoco tiene validez fiscal. La app se niega a usar la URL de producción.

## Cómo funciona

```text
PWA ──► /api/cfdi (Next.js) ──► validarCfdi()  ──► proveedor() ──┬── mock      (lib/cfdi/mock.ts)       SIMULADO
                                lib/cfdi/validar.ts              └── facturama (lib/cfdi/facturama.ts)  sandbox, SIN VERIFICAR
```

1. El cuerpo usa los **nombres del XML del SAT** (`SubTotal`, `Receptor.UsoCFDI`, `Conceptos[]`…), el mismo formato que el ejemplo de Facturama.
2. El código revisa catálogos, RFC, códigos postales y que las cuentas cuadren antes de mandar nada al PAC. Si algo falla, responde `422` con el error de cada campo y el valor esperado.
3. El proveedor "timbra" y la API devuelve la factura en el mismo formato, sea mock o Facturama.

| Archivo | Qué hace |
|---|---|
| `lib/cfdi/validar.ts` | Validación y aritmética (función pura, con pruebas) |
| `lib/cfdi/decimal.ts` | Decimales exactos con BigInt (sin errores de float) |
| `lib/cfdi/catalogos.ts` | Subconjunto de catálogos SAT. **Hay que verificarlo contra la versión vigente** |
| `lib/cfdi/documentos.ts` | XML y PDF del simulador, rotulados SIMULADO |
| `lib/cfdi/mock.ts` | PAC simulado: folios, UUID, cancelación, fallos provocados |
| `lib/cfdi/facturama.ts` | Traduce el formato SAT al JSON de Facturama y lo envía al sandbox |
| `app/api/cfdi/**/route.ts` | Rutas HTTP |

## Configuración (`.env`)

```bash
CFDI_PROVIDER=mock               # mock | facturama
MOCK_PAC_EMISOR_RFC=EKU9003173C9 # emisor si el CFDI no trae Emisor.Rfc (RFC de pruebas del SAT)
MOCK_PAC_EMISOR_NOMBRE=ESCUELA KEMPER URGATE
MOCK_PAC_LATENCIA_MS=300         # retraso artificial
MOCK_PAC_TASA_FALLO=0            # 0.2 = 20 % de emisiones responden 503
MOCK_PAC_PERSISTIR=true          # guarda en .mock-pac/facturas.json (ignorado por git)
FACTURAMA_URL=https://apisandbox.facturama.mx
FACTURAMA_USUARIO=...            # nunca se sube al repo
FACTURAMA_PASSWORD=...
```

## Endpoints

| Método | Ruta | Qué hace | Respuestas |
|---|---|---|---|
| GET | `/api/cfdi/estado` | Proveedor activo (sirve para comprobar que la API responde) | 200 |
| POST | `/api/cfdi/validar` | Revisa un CFDI **sin emitirlo** | 200 (`ok: true/false`), 400 |
| POST | `/api/cfdi` | Valida y emite | 201, 422, 409, 503, 504 |
| GET | `/api/cfdi` | Lista las facturas emitidas | 200 |
| GET | `/api/cfdi/{id}` | Detalle | 200, 404 |
| GET | `/api/cfdi/{id}/xml` | XML (`?descargar=1` para bajarlo como archivo) | 200, 404 |
| GET | `/api/cfdi/{id}/pdf` | PDF (`?descargar=1`) | 200, 404 |
| DELETE | `/api/cfdi/{id}?motivo=02` | Cancela. Motivo `01` exige `&uuidSustitucion=...` | 200, 400, 404, 409 |

**Errores**, siempre con la misma forma:
```json
{ "error": { "codigo": "pac_no_disponible", "mensaje": "El PAC simulado no está disponible…", "detalles": null } }
```
Códigos: `validacion` (422), `json_invalido` / `sin_cuerpo` (400), `muy_grande` (413), `no_encontrada` (404),
`folio_duplicado` / `ya_cancelada` (409), `pac_rechazo` (422), `pac_no_disponible` (503), `pac_timeout` (504),
`pac_sin_conexion` / `pac_error` (502), `config` (500).

**Fallos provocados para pruebas (solo mock):** cabecera `x-simular-fallo: pac-caido | timeout | rechazo`.

### Campos del cuerpo

- `Fecha`: `"AUTO"` (hora de Ciudad de México al emitir) o `"AAAA-MM-DDThh:mm:ss"`.
- `Folio`: opcional. Si falta, el simulador asigna el siguiente de la `Serie`.
- `Emisor`: basta `RegimenFiscal`. `Rfc` y `Nombre` son opcionales (si faltan, se toman del `.env`).
- Importes como **texto** (`"2501.00"`).
- Se soporta: tipo `I`/`E`, MXN, IVA trasladado 16 %, 8 %, 0 % o exento. **Se rechaza:** retenciones, descuentos, otras monedas, tipos T/N/P.

## Ejemplos

Ejemplos listos en `docs/ejemplos-cfdi/`:
`ingreso-valido.json` (el de Facturama), `resico-publico-general-efectivo.json` (RESICO 626 a público en general, con datos ficticios), `invalido.json`.

```bash
pnpm dev                              # http://localhost:3000
B=http://localhost:3000/api/cfdi
E=docs/ejemplos-cfdi
```

**1. ¿Responde la API?**
```bash
curl -s $B/estado
# {"ok":true,"proveedor":"mock","descripcion":"PAC simulado local (SIMULADO, sin validez fiscal)","simulado":true,"validezFiscal":false}
```

**2. Validar sin emitir (datos inválidos)**
```bash
curl -s -X POST $B/validar -H 'Content-Type: application/json' -d @$E/invalido.json
# {"ok":false,"errores":[
#   {"campo":"Receptor.Rfc","mensaje":"RFC con formato no válido (12 caracteres persona moral, 13 física)."},
#   {"campo":"Receptor.UsoCFDI","mensaje":"Clave no está en c_UsoCFDI."},
#   {"campo":"Conceptos[0].Importe","mensaje":"No cuadra: Cantidad × ValorUnitario = 2501.00."},
#   {"campo":"Conceptos[0].Impuestos.Traslados[0].Base","mensaje":"La base debe ser igual al Importe del concepto."},
#   {"campo":"Total","mensaje":"No cuadra: debería ser 2901.16."}],
#  "advertencias":[],"calculado":{"SubTotal":"2501.00","TotalImpuestosTrasladados":"400.16","Total":"2901.16"}}
```

**3. Emitir (caso habitual)**
```bash
curl -s -X POST $B -H 'Content-Type: application/json' -d @$E/ingreso-valido.json
# 201
# {"factura":{"id":"00a49905-…","uuid":"8C7668CC-…","proveedor":"mock","simulado":true,"validezFiscal":false,
#   "estado":"vigente","serie":"A","folio":"1","fecha":"2026-11-20T03:03:15", … ,"total":"2901.16",
#   "aviso":"SIMULADO: timbrado por el PAC simulado de Dzuun. UUID, sello y timbre son ficticios; sin validez fiscal."},
#  "advertencias":[],
#  "enlaces":{"self":"/api/cfdi/00a49905-…","xml":"/api/cfdi/00a49905-…/xml","pdf":"/api/cfdi/00a49905-…/pdf"}}

ID=$(curl -s -X POST $B -H 'Content-Type: application/json' -d @$E/ingreso-valido.json | jq -r .factura.id)
```

**4. Emitir con advertencia (efectivo > $2,000)**
```bash
curl -s -X POST $B -H 'Content-Type: application/json' -d @$E/resico-publico-general-efectivo.json | jq .advertencias
# [{"campo":"FormaPago","mensaje":"Pago en efectivo mayor a $2,000: para quien recibe la factura podría no ser deducible. Estimación, verifica con tu contador."}]
```

**5. Consultar, listar y descargar**
```bash
curl -s $B/$ID | jq .factura.estado
curl -s $B | jq '.total, .facturas[].folio'
curl -s -o factura.xml "$B/$ID/xml?descargar=1"
curl -s -o factura.pdf "$B/$ID/pdf?descargar=1"
```

**6. Cancelar**
```bash
curl -s -X DELETE "$B/$ID?motivo=02" | jq .factura.estado            # "cancelada"
curl -s -X DELETE "$B/$ID?motivo=02"                                  # 409 ya_cancelada
curl -s -X DELETE "$B/$ID?motivo=01"                                  # 400 falta_sustitucion
```

**7. Fallos (para los casos de prueba de la sec. 13)**
```bash
curl -s -X POST $B -H 'x-simular-fallo: pac-caido' -H 'Content-Type: application/json' -d @$E/ingreso-valido.json   # 503
curl -s -X POST $B -H 'x-simular-fallo: timeout'   -H 'Content-Type: application/json' -d @$E/ingreso-valido.json   # 504, tarda 5 s
curl -s -X POST $B -H 'x-simular-fallo: rechazo'   -H 'Content-Type: application/json' -d @$E/ingreso-valido.json   # 422
sed 's/"Serie": "A",/"Serie": "A", "Folio": "1",/' $E/ingreso-valido.json \
  | curl -s -X POST $B -H 'Content-Type: application/json' -d @-                                                        # 409 folio_duplicado
curl -s -X POST $B -d '{roto'                                                                                          # 400 json_invalido
curl -s $B/no-existe                                                                                                   # 404
```

**8. Desde la PWA (TypeScript)**
```ts
const r = await fetch("/api/cfdi", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(cfdi),
});
const json = await r.json();
if (r.status === 201) {
  // json.factura.simulado === true → mostrar la etiqueta "SIMULADO" en la pantalla de pre-factura
  window.open(json.enlaces.pdf);
} else if (r.status === 422 && json.error.codigo === "validacion") {
  // json.error.detalles.errores: [{ campo, mensaje }] → marcar cada campo en la pantalla de revisión
} else {
  // 503/504/502: "No pudimos generar la pre-factura. Intenta de nuevo." (json.error.mensaje)
}
```

## Pruebas automáticas

```bash
pnpm test     # lib/cfdi/validar.test.ts: aritmética, catálogos, PPD, público en general, exento, XML/PDF
```

## Pendientes y límites

- **Facturama: SIN VERIFICAR.** Las rutas (`POST /3/cfdis`, `GET /cfdi/{xml|pdf}/issued/{id}`, `DELETE /cfdi/{id}?type=issued&motive=`)
  y los nombres de campo se escribieron sin poder consultar su documentación, porque el servidor rechazó la conexión.
  Hay que probarlos con una cuenta de sandbox (que debe tener cargado el perfil y el CSD de prueba del emisor) antes de decir que funcionan.
- Sin autenticación todavía: falta exigir el ID token de Firebase y separar las facturas por `uid` (CLAUDE.md sec. 16).
- Los catálogos son un subconjunto. `ClaveProdServ` y `ClaveUnidad` solo se validan por formato.
- Las claves de producto de `resico-publico-general-efectivo.json` son ilustrativas; no se verificaron en `c_ClaveProdServ`.
- La regla "efectivo > $2,000" es la regla gancho de CLAUDE.md sec. 12. Falta verificar su aplicación en LISR/LIVA.
- El PDF no incluye el QR de verificación (SIMULADO, CLAUDE.md sec. 11).

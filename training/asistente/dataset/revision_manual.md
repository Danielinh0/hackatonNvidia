# Revisión manual del dataset de extracción (SINTÉTICO)

Muestra estratificada de 40 ejemplos (todos), semilla 7, generada 2026-11-20 05:43. Anotar el resultado en revision_manual.csv.

## train-00141 · ticket · T6 · ruido 0.1

Texto OCR:
```text
PAPELERIA SAN FELIPE
DISTRIBUIDORA   EL MIRADOR S  DE  RL  DE CV
R.F.C: VCQ9909266X6
FOLIO   91937
IMPRESION A COLOR
    1   @ 8.00     8.00
CUADERNO PROFESIONAL 100H
      1  @  57.50        57.50
ENGRAPADORA
  2 @ 90.50    181.00
FOLDER  CARTA
    1   @  4.50    4.50
TOTAL 251.00
FORMA PAGO EFECTIVO
EFECTIVO 300.00
-----
CAMBIO 49.00
MONEDA: MXN
GRACIAS POR SU PREFERENCIA
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "91937",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "MXN",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "251.00",
  "Emisor": {
    "Rfc": "VCQ9909266X6",
    "Nombre": "DISTRIBUIDORA EL MIRADOR S DE RL DE CV",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "IMPRESION A COLOR",
      "ValorUnitario": "8.00",
      "Importe": "8.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CUADERNO PROFESIONAL 100H",
      "ValorUnitario": "57.50",
      "Importe": "57.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "ENGRAPADORA",
      "ValorUnitario": "90.50",
      "Importe": "181.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "FOLDER CARTA",
      "ValorUnitario": "4.50",
      "Importe": "4.50",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## val-00103 · no_comprobante · N4 · ruido 0.0

Texto OCR:
```text
TALLER LA PALMA
HORARIO DE ATENCION
LUN A VIE 10:00 A 18:00
SAB 10:00 A 15:00
CERRADO POR INVENTARIO EL DIA 30
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## val-00092 · cfdi · C3 · ruido 0.1

Texto OCR:
```text
COMPROBANTE FISCAL DIGITAL POR   INTERNET
Serie: FA
Folio: 3175
EMISOR
Nombre:  SERVICIOS INTEGRALES LA   ESTRELLA   S   DE RL DE CV
RFC:   ANQ900125L76
Régimen fiscal: 601 -  General de Ley Personas Morales
RECEPTOR
Nombre:  MARIA RUIZ   HERNANDEZ
RFC:   HKVW661007X7B
Domicilio   fiscal:  68130
régimen fiscal: *12?- ~ers_na~ **~i#*s**on ~~tiv%dades*#m*%e?%ri_%e_  #  __?**#i%n_le*
Uso   CFDI: G03 - Gastos  en   general
Fecha   y  hora de   emisión: 07/08/2026   12:54:01
Lugar de  expedición: 68161
Folio   Fiscal (UUID):  60D0734E-6252-47BD-A493-AF11249ECBB8
Tipo de comprobante: I   - Ingreso
Forma de pago: 01 -   Efectivo
Método de   pago: PUE - Pago  en una  sola  exhibición
moneda: MXN
Exportación: 01 -  No  aplica
-----
Versión:   4.0
ClaveProdServ   Cant  Unidad      Descripción  P. Unitario   Importe  ObjImp
01010101   6    %8__P#eza    CINTA DE  AISLAR    15.09   90.54  02
Subtotal:  90.54
Traslado IVA: 002 IVA    Tasa  0.160000    Base 90.54  Importe  14.49
Total   impuestos trasladados: 14.49
Total:   ~05.?_
sello digital  del cfdi:
wQ+kd/yu77aYSwjRO4j41k/PAnGR3rQx3e6JQWZ6QuIEbO5aqnJ1gvoAfGgm45wWpWPbJH9ALMZG  No.   de   serie   del certificado  del SAT:  47148404381662570062
Este  documento es una  representación   impresa de   un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "FA",
  "Folio": "3175",
  "Fecha": "2026-08-07T12:54:01",
  "FormaPago": "01",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68161",
  "SubTotal": "90.54",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "ANQ900125L76",
    "Nombre": "SERVICIOS INTEGRALES LA ESTRELLA S DE RL DE CV",
    "RegimenFiscal": "601"
  },
  "Receptor": {
    "Rfc": "HKVW661007X7B",
    "Nombre": "MARIA RUIZ HERNANDEZ",
    "DomicilioFiscalReceptor": "68130",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "G03"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "6",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CINTA DE AISLAR",
      "ValorUnitario": "15.09",
      "Importe": "90.54",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "14.49",
    "Traslados": [
      {
        "Base": "90.54",
        "Impuesto": "002",
        "TipoFactor": "Tasa",
        "TasaOCuota": "0.160000",
        "Importe": "14.49"
      }
    ]
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "60D0734E-6252-47BD-A493-AF11249ECBB8"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01136 · ticket · T2 · ruido 0.35

Texto OCR:
```text
MATERIALES EL   MIRADOR
*O?GE__AR?#*   ?RUZ
AV. INDEPENDENCIA   664, COL.   CENTRO
SANTA CRUZ   XOXOCOTLAN,   OAX. C.P. 68014
R.F.C.  NQNW010525HMV
PINTURA VINILICA   4L
  1 @   305.00      305.00
C%%TA   ?? AI*L*?
    1 @   30.00      30.00

BROCHA  2 PULG
  1  @  29.50         29.S0
CLAVO 2 PULG
  0.750   @  65.50      ?9#13
CABLE   CAL  12
   2 @ 14.50           29.00
SUB-TOTAL  $381.58
I.V.A.   $61.05
ARTICULOS: 5
TOTAL A   PAG4R $442.63
PAGO:   EFECTIVO
SU PAGO  $450.00
|  |
SU   CAMBIO  $7.37
TICKET  #  #8*97
07/07/26
VUELVA  PRONTO
ESTE TICKET NO ES UN  COMPROBANTE FISCAL
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "2026-07-07",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "381.58",
  "Total": "442.63",
  "Emisor": {
    "Rfc": "NQNW010525HMV",
    "Nombre": "MATERIALES EL MIRADOR",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "PINTURA VINILICA 4L",
      "ValorUnitario": "305.00",
      "Importe": "305.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "AUTO",
      "ValorUnitario": "30.00",
      "Importe": "30.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "BROCHA 2 PULG",
      "ValorUnitario": "29.50",
      "Importe": "29.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "0.750",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CLAVO 2 PULG",
      "ValorUnitario": "65.50",
      "Importe": "AUTO",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CABLE CAL 12",
      "ValorUnitario": "14.50",
      "Importe": "29.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "61.05"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00895 · no_comprobante · N1 · ruido 0.0

Texto OCR:
```text
COCINA LA TRINIDAD
MENU DEL DIA
ENMOLADAS
FRIJOLES CHARROS
COMIDA CORRIDA $90
AGUA DEL DIA INCLUIDA
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00185 · ticket · T3 · ruido 0.1

Texto OCR:
```text
TLAPALERIA   LOS PINOS
COMERCIALIZADORA LA PROVIDENCIA  SA DE  CV

CALZ. PORFIRIO DIAZ   147, COL.   VOLCANES
OAXACA DE JUAREZ,  OAX.  C.P. 68172
No. VENTA 88025
FECHA/HORA 2026-06-29  09:41:03
CAJA   6
CANT   DESCRIPCION  IMPORTE
1  CABLE CAL  12  15.50
4    TORNILLO  1/4 PULG    12.00
1   PINTURA VINILICA 4L  417.00
2  BROCHA 2   PULG      58.00
SUMA   433.19
IMPUESTOS 69.31
IMPORTE  TOTAL 502.50
***  GRACIAS ***
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "88025",
  "Fecha": "2026-06-29T09:41:03",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "433.19",
  "Total": "502.50",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "COMERCIALIZADORA LA PROVIDENCIA SA DE CV",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CABLE CAL 12",
      "ValorUnitario": "AUTO",
      "Importe": "15.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "4",
      "ClaveUnidad": "AUTO",
      "Descripcion": "TORNILLO 1/4 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "12.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "PINTURA VINILICA 4L",
      "ValorUnitario": "AUTO",
      "Importe": "417.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "BROCHA 2 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "58.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "69.31"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## val-00129 · cfdi · C3 · ruido 0.35

Texto OCR:
```text
COMPRO BANTE FISCAL  DIGITAL POR INTERNET
Serie   :  F
Folio: 9539
EMISOR
Nom8re: COMERCIALIZADORA LA SOLEDAD SC

rfc: GLB950322G23
|  |
Régimen fiscal: 601 - General de  Ley Personas Morales
RECEPTOR
  Nombre: SERVICIOS INTEGRALES LOS   ANGELES   SC
RFC: ZPV15050444I
Domicilio  fiscal: 68178
Régimen   fiscal:  601   -  General   de   Ley Personas Morales
Uso CFDI:   G01  - Adquisición   de  mercancías
Fecha  y  hora de emisión:   11/09/2026 09:17:32
~ ~ ~  Lugar de   expedición  : 68233
Folio Fisca1 (UUID): 89462060-ED3A-47BF-B371-0F910A5487BA
Tipo de   coprobante:  I -  Ingreso
Forma de  pago: 28 -  Tarjeta de débito
Moneda: MXN -   Peso Mexicano
Export4ción: 01 - No   aplica
Versión: 4.0
ClaveProdServ     Cant   Unidad  Descripción    P.  Unitario  Importe   ObjImp
01010101    1     H87 Pieza    ~H%#OL*%E D# ME_A%5*%%   $92.24  $92.24   02
01010101  1    H87 Pieza    MEZCAL  ESPADIN 750ML    $265.52  $265.52      02
01010101  2.000    KGM Kilogramo      QUESILLO  $147.84   %29%#68   02
Subtot al:   $653.44
Traslado IVA: 002 IVA  Tasa  0.160000    Base $653.44   Importe $104.55
total impuestos trasladados:  $10%~~5
Total  : $757.99
Sello  digital del   CFDI:
ETJC0NIhzxHkgYVsF/le9E0GqGSEfrnJ/AlRsw739OMZ9wLZ9jaWICivaWTqxLRY+C16DJIF3+I7
No. de   serie  del certificado del SAT:  65604984817065675801
*****
Este documento   es  una representación impresa de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "F",
  "Folio": "9539",
  "Fecha": "2026-09-11T09:17:32",
  "FormaPago": "28",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68233",
  "SubTotal": "653.44",
  "Total": "757.99",
  "Emisor": {
    "Rfc": "GLB950322G23",
    "Nombre": "COMERCIALIZADORA LA SOLEDAD SC",
    "RegimenFiscal": "601"
  },
  "Receptor": {
    "Rfc": "ZPV15050444I",
    "Nombre": "SERVICIOS INTEGRALES LOS ANGELES SC",
    "DomicilioFiscalReceptor": "68178",
    "RegimenFiscalReceptor": "601",
    "UsoCFDI": "G01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "AUTO",
      "ValorUnitario": "92.24",
      "Importe": "92.24",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "MEZCAL ESPADIN 750ML",
      "ValorUnitario": "265.52",
      "Importe": "265.52",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "2.000",
      "ClaveUnidad": "KGM",
      "Descripcion": "QUESILLO",
      "ValorUnitario": "147.84",
      "Importe": "AUTO",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO",
    "Traslados": [
      {
        "Base": "653.44",
        "Impuesto": "002",
        "TipoFactor": "Tasa",
        "TasaOCuota": "0.160000",
        "Importe": "104.55"
      }
    ]
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "89462060-ED3A-47BF-B371-0F910A5487BA"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00214 · cfdi · C1 · ruido 0.2

Texto OCR:
```text
FACTURA
Serie:   FA
Folio:   9297
*****
EMISOR
Nombre: ROSA LOPEZ MENDOZA
RFC:   ZDPL801209OAR
Régimen fiscal:  612  - Personas   Físicas  con   Actividades Empresariales y Profesionales
RECEPTOR
Nombre: PUBLICO EN   GENERAL
RFC:  XAXX010101000
Domicilio  fiscal:   68115
Régimen fiscal:  616 -  Sin obligaciones fiscales
Uso   CFDI: S01 - Sin efectos fiscales
Fecha de emisión:   2026-03-15T13:48:27
Lugar de  expedición:   68115
Folio  fiscal: 981C5350-C3C3-4914-AD08-D9D4B7846B2C
tipo  de comprobante:   I -  Ingreso
Forma de pago: 99 - Por   definir
Método  de pago:  PPD - Pago  en   parcialidades o diferido
Moneda:  MXN   -   Peso  Mexicano
Exportación: 01   - No aplica
Versión:  4.0  ClaveProdServ   Cant    Unidad    Descripción    P.   Unitario    Importe    ObjImp
01010101    4      H87 Pieza    PLUMA TINTA AZUL     7.33  29.32    02
subtotal:   29.32
IVA 16%: 4.69
Total: 34.01
Sello digital   del  CFDI:
LkaGV2whnKfYys7PolIhF7k4N4X/oS9VzkuXQa/Su1ZO36znKQWgc/pVmUSs2+/xPjKuLh/uRMrT  No. de serie  del  certificado del SAT:   16500119515741131477
Este   documento  es  una   representación   impresa  de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "FA",
  "Folio": "9297",
  "Fecha": "2026-03-15T13:48:27",
  "FormaPago": "99",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PPD",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68115",
  "SubTotal": "29.32",
  "Total": "34.01",
  "Emisor": {
    "Rfc": "ZDPL801209OAR",
    "Nombre": "ROSA LOPEZ MENDOZA",
    "RegimenFiscal": "612"
  },
  "Receptor": {
    "Rfc": "XAXX010101000",
    "Nombre": "PUBLICO EN GENERAL",
    "DomicilioFiscalReceptor": "68115",
    "RegimenFiscalReceptor": "616",
    "UsoCFDI": "S01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "4",
      "ClaveUnidad": "H87",
      "Descripcion": "PLUMA TINTA AZUL",
      "ValorUnitario": "7.33",
      "Importe": "29.32",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "4.69"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "981C5350-C3C3-4914-AD08-D9D4B7846B2C"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00769 · cfdi · C1 · ruido 0.1

Texto OCR:
```text
FACTURA
Serie: FA
Folio:  8481
EMISOR
Nombre:  JOSE RUIZ PEREZ
RFC: XHGN7007135LL
Régimen fiscal: 626 - Régimen  Simplificado de Confianza
RECEPTOR
Nombre: PU?~IC__%N%~EN*RA_
RFC: XAXX010101000
Régimen fiscal:  616  -  Sin  obligaciones   fiscales
uso cfdi:   S01 -  Sin   efectos  fiscales
. . .
Fecha de emisión: 2026-09-21T20:37:07
Lugar  de expedición:  68261
Folio fiscal:   DB9BB332-E036-4179-931F-4165624AB5B9  Tipo de comprobante: I -  Ingreso
Forma   de pago: 04  - Tarjeta de   crédito
Método de pago: PUE  - Pago en una sola  exhibición  Moneda:  MXN
Exportación: 01 -   No   aplica
Versión: 4.0
ClaveProdServ    Cant   Unidad   Descripción     P. Unitario      Importe    ObjImp  01010101     2     H87 Pieza      AGUA  DE HORCHATA 1L     37.50     75.00    02
01010101    1  H87   Pieza      CALDO DE RES  84.91  84.91  02
01010101   1   H87   Pieza  COMIDA CORRIDA  6S.52    65.52    02
01010101   1     H87 Pieza    CHILES RELLENOS  102.16    102.16    02
Subtotal: 327.59
IVA   16%: 52.42
Tota  l:   380.01
Sello digital   del CFDI:
euFfcJ/DHVYr2QmsEwAWVe2yEWSFpp8oJhNkFuT85Z74TA5MQ8PFFYC9sisEtvhkD8U3to1XvCVp
No. de serie del crtificado del SAT:   29329879137156328214
Este documento es   una representación  impresa   de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "FA",
  "Folio": "8481",
  "Fecha": "2026-09-21T20:37:07",
  "FormaPago": "04",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68261",
  "SubTotal": "327.59",
  "Total": "380.01",
  "Emisor": {
    "Rfc": "XHGN7007135LL",
    "Nombre": "JOSE RUIZ PEREZ",
    "RegimenFiscal": "626"
  },
  "Receptor": {
    "Rfc": "XAXX010101000",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "616",
    "UsoCFDI": "S01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "2",
      "ClaveUnidad": "H87",
      "Descripcion": "AGUA DE HORCHATA 1L",
      "ValorUnitario": "37.50",
      "Importe": "75.00",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "CALDO DE RES",
      "ValorUnitario": "84.91",
      "Importe": "84.91",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "COMIDA CORRIDA",
      "ValorUnitario": "65.52",
      "Importe": "65.52",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "CHILES RELLENOS",
      "ValorUnitario": "102.16",
      "Importe": "102.16",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "52.42"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "DB9BB332-E036-4179-931F-4165624AB5B9"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00077 · no_comprobante · N5 · ruido 0.35

Texto OCR:
```text
GRAN OFERTA
2X1 EN TAMALES
PRECIO ESPECIAL $49.90
VIGENCIA  HASTA AGOTAR EXISTENCIAS
VISITANOS EN   LA   FE
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00794 · cfdi · C2 · ruido 0.2

Texto OCR:
```text
FACTURA ELECTRONICA
SERIE B  FOLIO 1028
DATOS DEL EMISOR                                                   DATOS DEL RECEPTOR
NOMBRE:  JUAN REYES LOPEZ                                       NOMBRE: PUBLICO EN   GENERAL
. . .
RC: UIQS931004G8H                                                            RFC: XAXX010101000
REGI  MEN: 6*6?- #égi%~**Sim*l?f~~ado#de%_o%?~an%_          C.P.: 68217
                                                                                                 REGIMEN: 616 -  Sin   obligaciones   fiscales
FECHA: 2026-07-13T12:20:19
Lugar de expedición:  68217
UUID:  B036AAC4-7D3D-4D72-9B33-E0A1F91CC8B4
TIPO: I  -   Ingreso
FORMA   PAGO:   28 -  Tarjeta de débito
METODO PAGO: PUE - Pago  en una   sola   exhibición
MONEDA: MXN -   Peso Mexicano  EXPORTAION: 01   -   No  aplica
VERSION CFDI:   4.0
CLAVE  CANT     UNIDAD    DESCRIPCION  P.U.  IMPORTE    OBJ
01010101    1  H87  TOSTADAS PAQ   50  56.47  ?6.%7  02
SUBTOTAL S6.47
TRASLADO: 002   IVA  Tasa   0.160000    Base 56.47  Importe   9.04
TOTAL IMPUESTOS TRASL4DADOS 9.04  TOTAL 65.51
. . .
Sello   digital del  CFDI:
yQW23ZsBWHGlHYI5nZxVyb8OHPMsuBobxw9+iMVPdwA0Hzs/ceHZnUx0TbV6aLaJSc7NGzPBirXB
No.   de serie  del certificado  del   SAT:  07309859776500083691
Este   documento es una representación  impresa de   un  CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "B",
  "Folio": "1028",
  "Fecha": "2026-07-13T12:20:19",
  "FormaPago": "28",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68217",
  "SubTotal": "56.47",
  "Total": "65.51",
  "Emisor": {
    "Rfc": "UIQS931004G8H",
    "Nombre": "JUAN REYES LOPEZ",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "XAXX010101000",
    "Nombre": "PUBLICO EN GENERAL",
    "DomicilioFiscalReceptor": "68217",
    "RegimenFiscalReceptor": "616",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "TOSTADAS PAQ 50",
      "ValorUnitario": "56.47",
      "Importe": "AUTO",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "9.04",
    "Traslados": [
      {
        "Base": "56.47",
        "Impuesto": "002",
        "TipoFactor": "Tasa",
        "TasaOCuota": "0.160000",
        "Importe": "9.04"
      }
    ]
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "B036AAC4-7D3D-4D72-9B33-E0A1F91CC8B4"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00060 · ticket · T8 · ruido 0.35

Texto OCR:
```text
TALLER  LOS  ARCOS
CALLE   ALCALA 378,   COL.   JALATLACO
SAN   JACINTO AMILPAS,  OAX.  C.P.   68177
Rfc:   FGMX7101022K2
Nota de venta 94814
Fecha:   22-FEB-2026
CAJA 1
DISEÑO  DE   LOGOTIPO   ....... 1,544.00
#%*AR** D?_%ONER   ........  _0*.~0
REPARACION  DE CELULAR   ....... l,139.50
INSTALACION ELECTRICA .... 2,600.00
MANTENIMIENTO  EQUIPO DE COMPUTO   .......  1,015.00  IVA   INCLUIDO
T0tal $ 6699.5O
Gracias   por su   visi7a
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "94814",
  "Fecha": "2026-02-22",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "6699.50",
  "Emisor": {
    "Rfc": "FGMX7101022K2",
    "Nombre": "TALLER LOS ARCOS",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "DISEÑO DE LOGOTIPO",
      "ValorUnitario": "AUTO",
      "Importe": "1544.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "AUTO",
      "ValorUnitario": "AUTO",
      "Importe": "AUTO",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "REPARACION DE CELULAR",
      "ValorUnitario": "AUTO",
      "Importe": "1139.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "INSTALACION ELECTRICA",
      "ValorUnitario": "AUTO",
      "Importe": "2600.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "MANTENIMIENTO EQUIPO DE COMPUTO",
      "ValorUnitario": "AUTO",
      "Importe": "1015.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00906 · no_comprobante · N2 · ruido 0.0

Texto OCR:
```text
LISTA
1/2 KG MAIZ
1 PZ VELAS
2 PZ ACEITE
1 KG VELAS
3 PZ MAIZ
2 PAQ JABON
3 KG AZUCAR
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01495 · no_comprobante · N2 · ruido 0.35

Texto OCR:
```text
LISTA
1  LT   CA  FE
|  |
2 PZ JABON
|  |
1/2   PZ VELAS
1/2 PZ  VFLAS
1 pz   velas
1 KG  JABON
1   KG VELAS
1/2 PAQ  CAFE
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00194 · no_comprobante · N1 · ruido 0.1

Texto OCR:
```text
COCINA LOS  PINOS
MENU DEL  DIA
TAMALES
CALDO DE  POLLO
SOPA DE FIDEO
SOPA DE FIDEO
SOPA   DE FIDEO
COMIDA  CORRIDA $95
AGUA DL   DIA INCLUIDA
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00107 · ticket · T8 · ruido 0.1

Texto OCR:
```text
BODEGA   EL SOL
CALLE HIDALGO  33,   COL. EX MARQUESADO
SANTA  CRUZ XOXOCOTLAN, OAX.   C.P. 68223
Rfc: YEHF8212242Z0
Nota   de venta  90624
Fecha: 2026-02-23  21:53:36

MEZCAL ESPADIN 750ML ... 318.50
CACAO EN   GRANO .....   187.50
IVA   INCLUIDO  -----
Total $506.00
Forma  pago: VALES
Gracias por   su visita
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "90624",
  "Fecha": "2026-02-23T21:53:36",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "VALES",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "506.00",
  "Emisor": {
    "Rfc": "YEHF8212242Z0",
    "Nombre": "BODEGA EL SOL",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "MEZCAL ESPADIN 750ML",
      "ValorUnitario": "AUTO",
      "Importe": "318.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CACAO EN GRANO",
      "ValorUnitario": "AUTO",
      "Importe": "187.50",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00034 · ticket · T8 · ruido 0.2

Texto OCR:
```text
MATERIALES  EL GUERO
Rfc:   QDTG641005II1
Nota  de venta   065084
Fech: 2026-01-09 19:55:33
|  |
CLAVO 2 PULG  ........ 51.00
IVA INCLUIDO
Total $ 51.00
Forma pago: TARJETA
MONE DA: MXN
Gracias por  su   visita
ESTE TICKET  NO  ES UN   COMPROBANTE  FISCAL
CONSERVE ESTE TICKET
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "065084",
  "Fecha": "2026-01-09T19:55:33",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "TARJETA",
  "MetodoPago": "AUTO",
  "Moneda": "MXN",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "51.00",
  "Emisor": {
    "Rfc": "QDTG641005II1",
    "Nombre": "MATERIALES EL GUERO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CLAVO 2 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "51.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00811 · ticket · T6 · ruido 0.0

Texto OCR:
```text
MATERIALES SAN JOSE
R.F.C: NHM200728PXK
FECHA 09/05/2026 21:20
CABLE CAL 12
  1 @ 17.00    17.00
CLAVO 2 PULG
  1.000 @ 57.50    57.50
TORNILLO 1/4 PULG
  2 @ 2.50    5.00
FOCO LED 9W
  1 @ 36.50    36.50
PINTURA VINILICA 4L
  2 @ 290.00    580.00
CEMENTO GRIS 50KG
  1 @ 259.50    259.50
TOTAL 955.50
FORMA PAGO EFECTIVO
GRACIAS POR SU PREFERENCIA
NO SE ACEPTAN DEVOLUCIONES
ESTE TICKET NO ES UN COMPROBANTE FISCAL
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "2026-05-09T21:20",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "955.50",
  "Emisor": {
    "Rfc": "NHM200728PXK",
    "Nombre": "MATERIALES SAN JOSE",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CABLE CAL 12",
      "ValorUnitario": "17.00",
      "Importe": "17.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1.000",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CLAVO 2 PULG",
      "ValorUnitario": "57.50",
      "Importe": "57.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "TORNILLO 1/4 PULG",
      "ValorUnitario": "2.50",
      "Importe": "5.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "FOCO LED 9W",
      "ValorUnitario": "36.50",
      "Importe": "36.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "PINTURA VINILICA 4L",
      "ValorUnitario": "290.00",
      "Importe": "580.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CEMENTO GRIS 50KG",
      "ValorUnitario": "259.50",
      "Importe": "259.50",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00024 · no_comprobante · N5 · ruido 0.2

Texto OCR:
```text
GRAN  OFERTA
2X1   EN   COPIAS
PRECIO ESPECIAL   $19.50
VIGENCIA HASTA AGOTAR EXISTENCIAS
VISITANOS  EN   LA   FE
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00254 · cfdi · C1 · ruido 0.0

Texto OCR:
```text
FACTURA
Serie: B
Folio: 9502
EMISOR
Nombre: ISABEL LOPEZ SANCHEZ
RFC: PZFK611121754
Régimen fiscal: 626 - Régimen Simplificado de Confianza
RECEPTOR
Nombre: PUBLICO EN GENERAL
RFC: XAXX010101000
Domicilio fiscal: 68186
Régimen fiscal: 616 - Sin obligaciones fiscales
Uso CFDI: S01 - Sin efectos fiscales
Fecha de emisión: 2026-10-15T10:21:33
Lugar de expedición: 68186
Folio fiscal: 41E3A343-2F8C-4936-993B-31DC018567D4
Tipo de comprobante: I - Ingreso
Forma de pago: 04 - Tarjeta de crédito
Método de pago: PUE - Pago en una sola exhibición
Moneda: MXN
Exportación: 01 - No aplica
Versión: 4.0
ClaveProdServ  Cant  Unidad  Descripción  P. Unitario  Importe  ObjImp
01010101  1  H87 Pieza  PINTURA VINILICA 4L  414.22  414.22  02
01010101  0.250  KGM Kilogramo  CLAVO 2 PULG  53.02  13.26  02
01010101  3  H87 Pieza  CEMENTO GRIS 50KG  213.79  641.37  02
01010101  1  H87 Pieza  CINTA DE AISLAR  21.12  21.12  02
Subtotal: 1,089.97
IVA 16%: 174.40
Total: 1,264.37
Sello digital del CFDI:
b2WXQI1CzzhtYFXmBJuZZWcZ1iUUTxQslugEq3S+Pft96nxF61W/DmkUkxNoBEuothIQ3kGf3pa9
No. de serie del certificado del SAT: 63481057437527456537
Este documento es una representación impresa de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "B",
  "Folio": "9502",
  "Fecha": "2026-10-15T10:21:33",
  "FormaPago": "04",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68186",
  "SubTotal": "1089.97",
  "Total": "1264.37",
  "Emisor": {
    "Rfc": "PZFK611121754",
    "Nombre": "ISABEL LOPEZ SANCHEZ",
    "RegimenFiscal": "626"
  },
  "Receptor": {
    "Rfc": "XAXX010101000",
    "Nombre": "PUBLICO EN GENERAL",
    "DomicilioFiscalReceptor": "68186",
    "RegimenFiscalReceptor": "616",
    "UsoCFDI": "S01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "PINTURA VINILICA 4L",
      "ValorUnitario": "414.22",
      "Importe": "414.22",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "0.250",
      "ClaveUnidad": "KGM",
      "Descripcion": "CLAVO 2 PULG",
      "ValorUnitario": "53.02",
      "Importe": "13.26",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "3",
      "ClaveUnidad": "H87",
      "Descripcion": "CEMENTO GRIS 50KG",
      "ValorUnitario": "213.79",
      "Importe": "641.37",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "CINTA DE AISLAR",
      "ValorUnitario": "21.12",
      "Importe": "21.12",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "174.40"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "41E3A343-2F8C-4936-993B-31DC018567D4"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00448 · ticket · T3 · ruido 0.2

Texto OCR:
```text
FONDA DOÑA ROSA
SERVICIOS INTEGRALES   SAN FELIPE S DE RL DE CV
*****
RFC CUC1011193XW
No.  VENTA   569269
FECHA/HORA 2026-03-29  09:49:08
SUMA 988#%%
IMPUESTOS 158.21
importe total   1,147.00
*** GR ACIAS   ***
CONSERVE   ESTE TICKET
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "569269",
  "Fecha": "2026-03-29T09:49:08",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "1147.00",
  "Emisor": {
    "Rfc": "CUC1011193XW",
    "Nombre": "SERVICIOS INTEGRALES SAN FELIPE S DE RL DE CV",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "158.21"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00912 · ilegible · X1 · ruido 0.1

Texto OCR:
```text
T0T T0T * IVA
%% $
$ * *
* ... T0T GRAC ...
RF $
C0M
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00158 · ticket · T4 · ruido 0.2

Texto OCR:
```text
FERRETERIA  EL NOPAL
GRUPO LA PROVIDENCIA SC
AV.  JUAREZ   519, COL.  EX  MARQUESADO
OAXACA  DE   JUAREZ,  OAX. C.P.  68145
RFC EMISOR: WQT070326TJ8
TRANS: 393327
27  AGO   2026    11:16
CLAVO   2 PULG   ...... 133.00
BROCHA  2  PULG ...   5B.00
TORNILLO 1/4   PULG ......   4.50
CEMENTO GRIS 50KG   ... 255.00
PINTURA VINILICA 4L ... 1830.00
FOCO LED   9W  .......  134.00
TOTAL M.N.  $  2414.50
PAGADO   CON EFECTIVO

CONSERVE   SU   TICKET
NO SE ACEPTAN DEVOLUCIONES
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "393327",
  "Fecha": "2026-08-27T11:16",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "2414.50",
  "Emisor": {
    "Rfc": "WQT070326TJ8",
    "Nombre": "GRUPO LA PROVIDENCIA SC",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CLAVO 2 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "133.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "BROCHA 2 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "58.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "TORNILLO 1/4 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "4.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CEMENTO GRIS 50KG",
      "ValorUnitario": "AUTO",
      "Importe": "255.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "PINTURA VINILICA 4L",
      "ValorUnitario": "AUTO",
      "Importe": "1830.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "FOCO LED 9W",
      "ValorUnitario": "AUTO",
      "Importe": "134.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00758 · ticket · T6 · ruido 0.35

Texto OCR:
```text
CENTRO DE  COPIADO  SAN  JOSE
. . .
R.F.C: WRAQ83080519S
FOLIO  50570
FECH A 29/06/2026   09:30
CARTULINA BLANCA
  1  @ 11.00       11.00
COPIAS B/N

    1 @   2.0O          2.O0
PLUMA TINTA  AZUL
   3  @ 14.00         42.00
CUADERNO  PROFESIONAL   100H
    1  @   69.50      69.50
IMPRESION A COLOR
     2 @  5.50         11.00  -----
SUB  TOTAL 116.81
IVA 16 % 18.69
|  |
OTAL  135.50
GRACIAS   POR SU PREFERENCIA
|  |
NO  SE ACEPTAN DEVOLUCIONES
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "50570",
  "Fecha": "2026-06-29T09:30",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "116.81",
  "Total": "135.50",
  "Emisor": {
    "Rfc": "WRAQ83080519S",
    "Nombre": "CENTRO DE COPIADO SAN JOSE",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CARTULINA BLANCA",
      "ValorUnitario": "11.00",
      "Importe": "11.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "COPIAS B/N",
      "ValorUnitario": "2.00",
      "Importe": "2.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "3",
      "ClaveUnidad": "AUTO",
      "Descripcion": "PLUMA TINTA AZUL",
      "ValorUnitario": "14.00",
      "Importe": "42.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CUADERNO PROFESIONAL 100H",
      "ValorUnitario": "69.50",
      "Importe": "69.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "IMPRESION A COLOR",
      "ValorUnitario": "5.50",
      "Importe": "11.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "18.69"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00582 · ticket · T5 · ruido 0.1

Texto OCR:
```text
FONDA   SAN   FELIPE
CALLE   HIDALGO 792, COL. CENTRO
SANTA   LUCIA   DEL CAMINO,   OAX. C.P. 68058
RFC: WXH911019TPY
1 x 76.00  COMIDA CORRIDA  76.00
2 x   101.50  ENMOLADAS  203.00
1 x 134.00  CALDO DE   RES     134.00
SUBTOTAL: $356.03
IVA: $56.97
TOTAL: $413.00
FECHA   15-FEB-2026
CA   JA  2
GRACIAS, VUELVA   PRONTO
FACTURACION EN LINEA: facturacion.ejemplo.mx
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "2026-02-15",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "356.03",
  "Total": "413.00",
  "Emisor": {
    "Rfc": "WXH911019TPY",
    "Nombre": "FONDA SAN FELIPE",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "COMIDA CORRIDA",
      "ValorUnitario": "76.00",
      "Importe": "76.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "2",
      "ClaveUnidad": "AUTO",
      "Descripcion": "ENMOLADAS",
      "ValorUnitario": "101.50",
      "Importe": "203.00",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CALDO DE RES",
      "ValorUnitario": "134.00",
      "Importe": "134.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "56.97"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01228 · ticket · T2 · ruido 0.1

Texto OCR:
```text
FONDA   DOS HERMANOS
AV. JUAREZ 158, COL. CENTRO
SAN JACINTO   AMILPAS,   OAX. C.P.  68209
R.F.C. URBG910703KS6
. . .
CALDO  DE  RES
  4  @ 113.00     452.00
SUB-TOTAL $ 389.66
1.V.A.   $ 62.34
TOTAL A PAGAR $ 452.00
PAGO: EFECTIVO
TICKET # 51373
06/11/2026   19:08
VUELVA PRONT0
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "51373",
  "Fecha": "2026-11-06T19:08",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "389.66",
  "Total": "452.00",
  "Emisor": {
    "Rfc": "URBG910703KS6",
    "Nombre": "FONDA DOS HERMANOS",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "4",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CALDO DE RES",
      "ValorUnitario": "113.00",
      "Importe": "452.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "62.34"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00737 · no_comprobante · N1 · ruido 0.2

Texto OCR:
```text
COCINA  LA  OAXAQUEÑA
-----
menu   del   dia
ENMOLADAS
TAMALES  MOLE   AMARILLO
COMIDA   CORRIDA $80  AGUA  DEL  DIA   INCLUIDA
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01060 · cfdi · C2 · ruido 0.0

Texto OCR:
```text
FACTURA ELECTRONICA
SERIE F
DATOS DEL EMISOR                                     DATOS DEL RECEPTOR
NOMBRE: SERVICIOS INTEGRALES LA TRINIDAD SA DE CV    RFC: XAXX010101000
RFC: EBM9602159L5                                    C.P.: 68057
REGIMEN: 601 - General de Ley Personas Morales       REGIMEN: 616 - Sin obligaciones fiscales
                                                     USO CFDI: S01 - Sin efectos fiscales
FECHA: 2026-06-28T21:58:29
Lugar de expedición: 68057
UUID: 553B6AAC-69D8-4A57-A3F0-D51C6F56BDF8
FORMA PAGO: 01 - Efectivo
METODO PAGO: PUE - Pago en una sola exhibición
MONEDA: MXN
EXPORTACION: 01 - No aplica
VERSION CFDI: 4.0
CLAVE  CANT  UNIDAD  DESCRIPCION  P.U.  IMPORTE  OBJ
01010101  6  H87  LECHE ENTERA 1L  25.00  150.00  02
SUBTOTAL 150.00
TRASLADO: 002 IVA  Tasa  0.160000  Base 150.00  Importe 24.00
TOTAL IMPUESTOS TRASLADADOS 24.00
TOTAL 174.00
Sello digital del CFDI:
YnhJibj68grGIDBxck33vjL+nnQCGashdg6WhNe9AyIFtZf7eHQhnzXfVrG5Esx2SdIoU3ToIpUu
No. de serie del certificado del SAT: 80979012270307098274
Este documento es una representación impresa de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "F",
  "Folio": "AUTO",
  "Fecha": "2026-06-28T21:58:29",
  "FormaPago": "01",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "01",
  "LugarExpedicion": "68057",
  "SubTotal": "150.00",
  "Total": "174.00",
  "Emisor": {
    "Rfc": "EBM9602159L5",
    "Nombre": "SERVICIOS INTEGRALES LA TRINIDAD SA DE CV",
    "RegimenFiscal": "601"
  },
  "Receptor": {
    "Rfc": "XAXX010101000",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "68057",
    "RegimenFiscalReceptor": "616",
    "UsoCFDI": "S01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "6",
      "ClaveUnidad": "H87",
      "Descripcion": "LECHE ENTERA 1L",
      "ValorUnitario": "25.00",
      "Importe": "150.00",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "24.00",
    "Traslados": [
      {
        "Base": "150.00",
        "Impuesto": "002",
        "TipoFactor": "Tasa",
        "TasaOCuota": "0.160000",
        "Importe": "24.00"
      }
    ]
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "553B6AAC-69D8-4A57-A3F0-D51C6F56BDF8"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01148 · ticket · T1 · ruido 0.35

Texto OCR:
```text
DISTRIBUIDORA   EL  ROBLE  . . .
RFC: ZCRB651223LLY
folio: 088037
C4JA  3
IVA INCLUIDO
TOTAL $2,058.00
FORMA  DE PAGO: EFECTIVO
GRACIAS POR  SU   COMPRA
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "088037",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "2058.00",
  "Emisor": {
    "Rfc": "ZCRB651223LLY",
    "Nombre": "DISTRIBUIDORA EL ROBLE",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## val-00003 · ticket · T7 · ruido 0.0

Texto OCR:
```text
FERRETERIA SANTA CRUZ
CALLE ALCALA 459, COL. CENTRO
SANTA CRUZ XOXOCOTLAN, OAX. C.P. 68297
IVA INCLUIDO
ARTICULOS: 6
TOTAL NETO $1,985.00
PAGO TARJETA CREDITO
MONEDA: MXN
FOLIO No. 423045
02/08/26
QUE TENGA BUEN DIA
NO SE ACEPTAN DEVOLUCIONES
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "423045",
  "Fecha": "2026-08-02",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "TARJETA CREDITO",
  "MetodoPago": "AUTO",
  "Moneda": "MXN",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "1985.00",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "FERRETERIA SANTA CRUZ",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00188 · cfdi · C4 · ruido 0.35

Texto OCR:
```text
CFDI 4.0
Serie-Folio:  FA-9013
|  |
Emisor                                                                                            Receptor
Razón social: SE**ICIOS IN_%*#A_**?%A?F~_?%D? ~L #E*CV      Razón social: CARMEN REYES RAMIREZ
RFC:  YQA9201260VO                                                                    CP   rFceptor:  6~11~  Régimen fiscal: 601   -   General   de  Ley Personas   Morales           Uso   CFDI: G01 - Adquisición de mercancías
Emitido:  %9%##/_#26 2#:5#:1_
Lugar de   expedición: 68111
UUI: 2466C18F-47E9-4909-A78D-39676F403DED
Tipo  de   comprobante:   I  - Ingreso
*****
Forma de pago:  *4   %%#?rjet*   ?e   c#_d_#o
Método de  pago:  PUE - Pago en  una  sola  exhibición
Moneda: MXN - Peso Mexicano
Exportación: 01   - No aplica
Versión:   4.0
~ ~ ~
ClaveProdServ     Cant  Unidad     Descripción   P. Unitario   Importe    ObjImp
01010101  4    H87     CAFE  SOLUBLE 100G  72.41  289.64  02
01010101    4  H87  ARROZ 1KG  23.7l   94.84  02
. . .
01010101    2    H87     REFRESCO 600ML      17_#7    35.34  02
5ubtotal:   419.82
IVA 16%: 67.16
Total:   486.98
Sello digital del   CFDI:
Rpt6izrdgs9b2Pp6c05hrlA1lYFeW07xsyW8q/Zm+AAEOKqLTI3r+W8VfoUWP455xc1GlpCtBu0J
No. de serie del certi ficado del SAT:   64449709402772003126
Este documento es una  representación impresa   de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "FA",
  "Folio": "9013",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68111",
  "SubTotal": "419.82",
  "Total": "486.98",
  "Emisor": {
    "Rfc": "YQA9201260VO",
    "Nombre": "AUTO",
    "RegimenFiscal": "601"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "CARMEN REYES RAMIREZ",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "G01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "4",
      "ClaveUnidad": "H87",
      "Descripcion": "CAFE SOLUBLE 100G",
      "ValorUnitario": "72.41",
      "Importe": "289.64",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "4",
      "ClaveUnidad": "H87",
      "Descripcion": "ARROZ 1KG",
      "ValorUnitario": "23.71",
      "Importe": "94.84",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "2",
      "ClaveUnidad": "H87",
      "Descripcion": "REFRESCO 600ML",
      "ValorUnitario": "AUTO",
      "Importe": "35.34",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "67.16"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "2466C18F-47E9-4909-A78D-39676F403DED"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00017 · cfdi · C1 · ruido 0.35

Texto OCR:
```text
FACTURA  *****
Serie: FA
Folio: ~*76
EMISOR
|  |
Nombre: COMERCIALIZADORA  LAS  FLORES SC
RFC: BSH91090870G
Régimen f  iscal:  601  -  General de   Ley Personas Morales
RECPTOR
Nombre: SERVICIOS INTEGRALES LOS   PINOS SA DE   CV
RFC: KET210726O94
Domicilio fiscal: 68274
Régimen fiscal:  601 - General  de Ley  Personas Morales
Uso   CFDI:  G03 - Gastos en   general
Fecha de   emisión:  2026-10-13T07:40:02
Lugar  de expedición: 68182
Folio fiscal 7E2A5387-9D0F-492E-9A59-E4753006BAFD
Tipo de comprobante: I - Ingreso
Forma  de pago:   04  - Tarjeta de crédito
|  |
Método de  pago:  PUE -  Pago en una sola exhibición
MonFda:   MXN  -   Peso   Mexicano
Exportación: 01  - No aplica  Versión: %?0
ClaveProdServ  Cant  Unidad    Descripción   P. Unitario    Importe  ObjImp
01010101   2   H87 Pieza    CINTA   DE AISLAR    $1B.97     $37.94    02
01010101  1  H87 Pieza   BROCHA 2  PULG  $37.93  $37.93      02
01010101  1   H87  Pieza  PINTURA   VINILICA 4L   $382.33     $3B2.33  02
Subtotal:   $458.20

Total: $531.51
Sello digital del   CFDI:
ZTfXF3H+AeI/XBVoGrvXAVBcgaijl4SL7S1WFiZqDZ/ERcV+ftqvJ9+YTRvRnKLHSB72oXt13+dA
No.  de serie del   certificado del  SAT: 92833975842010495207
Este documento  es una  representa   ción  impresa de   un CFDI
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "FA",
  "Folio": "AUTO",
  "Fecha": "2026-10-13T07:40:02",
  "FormaPago": "04",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68182",
  "SubTotal": "458.20",
  "Total": "531.51",
  "Emisor": {
    "Rfc": "BSH91090870G",
    "Nombre": "COMERCIALIZADORA LAS FLORES SC",
    "RegimenFiscal": "601"
  },
  "Receptor": {
    "Rfc": "KET210726O94",
    "Nombre": "SERVICIOS INTEGRALES LOS PINOS SA DE CV",
    "DomicilioFiscalReceptor": "68274",
    "RegimenFiscalReceptor": "601",
    "UsoCFDI": "G03"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "2",
      "ClaveUnidad": "H87",
      "Descripcion": "CINTA DE AISLAR",
      "ValorUnitario": "18.97",
      "Importe": "37.94",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "BROCHA 2 PULG",
      "ValorUnitario": "37.93",
      "Importe": "37.93",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "H87",
      "Descripcion": "PINTURA VINILICA 4L",
      "ValorUnitario": "382.33",
      "Importe": "382.33",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "7E2A5387-9D0F-492E-9A59-E4753006BAFD"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01231 · ticket · T3 · ruido 0.0

Texto OCR:
```text
SERVICIOS LA GUADALUPANA
COMERCIALIZADORA SAN JOSE SC
AV. UNIVERSIDAD 262, COL. VOLCANES
OAXACA DE JUAREZ, OAX. C.P. 68074
RFC VXT130720XWI
No. VENTA 928691
FECHA/HORA 2026-05-01 17:13:37
CANT  DESCRIPCION  IMPORTE
1  RECARGA DE TONER  309.50
1  MANTENIMIENTO EQUIPO DE COMPUTO  635.50
1  INSTALACION ELECTRICA  2118.50
1  REPARACION DE CELULAR  1177.50
1  DISEÑO DE LOGOTIPO  2224.50
IMPORTE TOTAL $ 6465.50
METODO DE PAGO TARJETA CREDITO
TARJ **** 4777  AUT 112470
MONEDA: MXN
*** GRACIAS ***
NO SE ACEPTAN DEVOLUCIONES
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "928691",
  "Fecha": "2026-05-01T17:13:37",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "TARJETA CREDITO",
  "MetodoPago": "AUTO",
  "Moneda": "MXN",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "6465.50",
  "Emisor": {
    "Rfc": "VXT130720XWI",
    "Nombre": "COMERCIALIZADORA SAN JOSE SC",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "RECARGA DE TONER",
      "ValorUnitario": "AUTO",
      "Importe": "309.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "MANTENIMIENTO EQUIPO DE COMPUTO",
      "ValorUnitario": "AUTO",
      "Importe": "635.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "INSTALACION ELECTRICA",
      "ValorUnitario": "AUTO",
      "Importe": "2118.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "REPARACION DE CELULAR",
      "ValorUnitario": "AUTO",
      "Importe": "1177.50",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "DISEÑO DE LOGOTIPO",
      "ValorUnitario": "AUTO",
      "Importe": "2224.50",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00434 · no_comprobante · N3 · ruido 0.2

Texto OCR:
```text
SE SOLICITA AYUDANTE
INFORME  EN EL  LOCAL
SIN INTERMEDIARIOS
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## val-00141 · cfdi · C3 · ruido 0.0

Texto OCR:
```text
COMPROBANTE FISCAL DIGITAL POR INTERNET
Serie: F
Folio: 8787
EMISOR
Nombre: LETICIA HERNANDEZ MARTINEZ
RFC: WMYU610806IML
Régimen fiscal: 626 - Régimen Simplificado de Confianza
RECEPTOR
Nombre: MARIA MENDOZA CRUZ
RFC: BPSA6211144GD
Domicilio fiscal: 68097
Uso CFDI: G03 - Gastos en general
Fecha y hora de emisión: 21/01/2026 16:00:55
Lugar de expedición: 68095
Folio Fiscal (UUID): A89FC197-9E31-4178-AF83-41F4B7F96F6D
Tipo de comprobante: I - Ingreso
Forma de pago: 01 - Efectivo
Método de pago: PUE - Pago en una sola exhibición
Exportación: 01 - No aplica
ClaveProdServ  Cant  Unidad  Descripción  P. Unitario  Importe  ObjImp
01010101  1  E48 Unidad de servicio  MANTENIMIENTO EQUIPO DE COMPUTO  363.36  363.36  02
01010101  1  E48 Unidad de servicio  RECARGA DE TONER  244.83  244.83  02
01010101  1  E48 Unidad de servicio  INSTALACION ELECTRICA  748.71  748.71  02
01010101  1  E48 Unidad de servicio  REPARACION DE CELULAR  1,050.00  1,050.00  02
Subtotal: 2,406.90
Traslado IVA: 002 IVA  Tasa  0.160000  Base 2,406.90  Importe 385.10
Total impuestos trasladados: 385.10
Total: 2,792.00
Sello digital del CFDI:
QtUMbGfS8omqNjc1W+fku2+r90cqKzYDzsCohEcZsAp6+qGFr2qxLzRVn3Mkve5wn1pfE2GwFXFC
No. de serie del certificado del SAT: 94867053269460185579
Este documento es una representación impresa de un CFDI
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "F",
  "Folio": "8787",
  "Fecha": "2026-01-21T16:00:55",
  "FormaPago": "01",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "AUTO",
  "TipoDeComprobante": "I",
  "Exportacion": "01",
  "LugarExpedicion": "68095",
  "SubTotal": "2406.90",
  "Total": "2792.00",
  "Emisor": {
    "Rfc": "WMYU610806IML",
    "Nombre": "LETICIA HERNANDEZ MARTINEZ",
    "RegimenFiscal": "626"
  },
  "Receptor": {
    "Rfc": "BPSA6211144GD",
    "Nombre": "MARIA MENDOZA CRUZ",
    "DomicilioFiscalReceptor": "68097",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "G03"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "E48",
      "Descripcion": "MANTENIMIENTO EQUIPO DE COMPUTO",
      "ValorUnitario": "363.36",
      "Importe": "363.36",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "E48",
      "Descripcion": "RECARGA DE TONER",
      "ValorUnitario": "244.83",
      "Importe": "244.83",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "E48",
      "Descripcion": "INSTALACION ELECTRICA",
      "ValorUnitario": "748.71",
      "Importe": "748.71",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "1",
      "ClaveUnidad": "E48",
      "Descripcion": "REPARACION DE CELULAR",
      "ValorUnitario": "1050.00",
      "Importe": "1050.00",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "385.10",
    "Traslados": [
      {
        "Base": "2406.90",
        "Impuesto": "002",
        "TipoFactor": "Tasa",
        "TasaOCuota": "0.160000",
        "Importe": "385.10"
      }
    ]
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "A89FC197-9E31-4178-AF83-41F4B7F96F6D"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## test-00086 · cfdi · C4 · ruido 0.2

Texto OCR:
```text
CFDI  4.0
Serie-Folio: 2903
Emisor                                                                                       Receptor
Razón   social: ELENA JIMENEZ LOPEZ                                   Razón social: PUBLICO  EN GENERAL
RFC: UCBD6308250VG                                                                    RFC:   XAXX010101000
régimen   fiscal: 626 -  Régimen Simplificado de Confianza    CP  receptor: 68188
                                                                                                    Uso  CFDI: S01 -  Sin efectos fiscales
Emitido: 13/11/2026 11:49:54
Lugar  de expedición:   68188
UUID:   E901BAEC-9F1E-403A-A639-AF20EF73CAE0
Tipo  de comprobante:   I  -   Ingreso
Forma   de  pago: 04 -   Tarjeta  de   crédito
|  |
Método   de  pago: PUE - Pago  en una sola exhibición
M0neda: MXN
Versión: 4.0
ClaveProdServ      Cant    Unidad  Descripción   P. Unitario  Importe    ObjImp
01010101  18.206    LTR    DIESEL  $22.41  $408.00   02
01010101      22.418    LTR   GASOLINA   REGULAR      $20.26   $454.19  02
IVA 16%:   $137.95
Total :   $1,O00.14
Sello digital del  CFDI:
*****
l3g+pKwKfL90EHx4lQtPVC/dhiTWFyXBX/k2r6Pxaqd+XKPR+8LjRST7dpBQizSWfETKIEVoTNVR
No. de   serie  del certificado del SAT:  74959526792852117965
Este   documento es una representación impresa   de   un CFDI
```
Respuesta esperada:
```json
{
  "Version": "4.0",
  "Serie": "AUTO",
  "Folio": "2903",
  "Fecha": "2026-11-13T11:49:54",
  "FormaPago": "04",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "PUE",
  "Moneda": "MXN",
  "TipoDeComprobante": "I",
  "Exportacion": "AUTO",
  "LugarExpedicion": "68188",
  "SubTotal": "AUTO",
  "Total": "1000.14",
  "Emisor": {
    "Rfc": "UCBD6308250VG",
    "Nombre": "ELENA JIMENEZ LOPEZ",
    "RegimenFiscal": "626"
  },
  "Receptor": {
    "Rfc": "XAXX010101000",
    "Nombre": "PUBLICO EN GENERAL",
    "DomicilioFiscalReceptor": "68188",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "S01"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "18.206",
      "ClaveUnidad": "LTR",
      "Descripcion": "DIESEL",
      "ValorUnitario": "22.41",
      "Importe": "408.00",
      "ObjetoImp": "02"
    },
    {
      "ClaveProdServ": "01010101",
      "Cantidad": "22.418",
      "ClaveUnidad": "LTR",
      "Descripcion": "GASOLINA REGULAR",
      "ValorUnitario": "20.26",
      "Importe": "454.19",
      "ObjetoImp": "02"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "137.95"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "E901BAEC-9F1E-403A-A639-AF20EF73CAE0"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## val-00152 · ticket · T7 · ruido 0.1

Texto OCR:
```text
SERVICIO  SANTA  CRUZ
AV. JUAREZ   113,  COL. VOLCANES
OAXACA DE JUAREZ,  OAX. C.P. 68281
R.F.C: WAYX880916O5F
SUBTOT  $ 513.29
IVA(16%)   $  82.13
ARTICULOS:  1
TOTAL  NETO $   595.42
PAGO   EFECTIVO
RECIBI $ 700.00
CAMBIO   $ 104.58
FOLIO No. 21164
QUE  TENGA BUEN DIA
-----
CONSERVE  ESTE  TICKET
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "21164",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "513.29",
  "Total": "595.42",
  "Emisor": {
    "Rfc": "WAYX880916O5F",
    "Nombre": "SERVICIO SANTA CRUZ",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "82.13"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00575 · ilegible · X1 · ruido 0.0

Texto OCR:
```text
* || ... ~~ GRAC
|| IVA T0T C0M
... * $
IVA RF
$ ~~ ... ~~
F0L
IVA
AZCZSU
* RF F0L
GRAC ## || MLGQ#Z *
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "AUTO",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "AUTO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-01062 · ticket · T3 · ruido 0.35

Texto OCR:
```text
TLAPALERIA   LA  LUZ
ROSA PEREZ HERNANDEZ
AV. UNIVERSIDAD 589, COL. VOLCANES
OAXACA  DE JUAREZ, OAX. C.P. 68177
RFC FNDA620608IOE
No.   VENTA 022797
FECHA/HORA 20~6*01##* *%:~5:5?
*****
CANT    DESCRIPCION   IMPORTE

0.250    CLAVO 2  PULG    17.25
*****
1     CEMENTO GRIS   50KG  231.00
IVA INCLUIDO
articulos: 2
IMPOTE TOTAL $248.25
|  |
METODO  DE PAGO   EFECTIVO
PAGO   CON $250.00
~ ~ ~
CAMBIO $1.75
*** GRACIAS   ***
SOLICITE SU FACTURA   EL MISMO MES
~ ~ ~
CONSERVE ESTE TICKET
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "022797",
  "Fecha": "AUTO",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "EFECTIVO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "248.25",
  "Emisor": {
    "Rfc": "FNDA620608IOE",
    "Nombre": "ROSA PEREZ HERNANDEZ",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "0.250",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CLAVO 2 PULG",
      "ValorUnitario": "AUTO",
      "Importe": "17.25",
      "ObjetoImp": "AUTO"
    },
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "1",
      "ClaveUnidad": "AUTO",
      "Descripcion": "CEMENTO GRIS 50KG",
      "ValorUnitario": "AUTO",
      "Importe": "231.00",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

## train-00961 · ticket · T4 · ruido 0.1

Texto OCR:
```text
ABARROTES LA   PROVIDENCIA
CALZ.  PORFIRIO  DIAZ  639, COL. EX  MARQUESADO
SANTA  LUCIA DEL  CAMINO, OAX.  C.P.  68101
RFC EMISOR: PGBV96110521R
TRANS: 692114
21   ABR   2026    08:56
CAJ4  6
JABON EN   POLVO 1KG ...... 40.50
ARTICULOS: 1
TOTAL M.N. $4~*?0
PAGADO CON TARJETA DEBITO
TARJ   **** 8658    AUT  921378
CONSERVE SU  TICKET
NO  SE  ACEPTAN DEVOLUCIONES
```
Respuesta esperada:
```json
{
  "Version": "AUTO",
  "Serie": "AUTO",
  "Folio": "692114",
  "Fecha": "2026-04-21T08:56",
  "FormaPago": "AUTO",
  "FormaPagoLeida": "TARJETA DEBITO",
  "MetodoPago": "AUTO",
  "Moneda": "AUTO",
  "TipoDeComprobante": "AUTO",
  "Exportacion": "AUTO",
  "LugarExpedicion": "AUTO",
  "SubTotal": "AUTO",
  "Total": "AUTO",
  "Emisor": {
    "Rfc": "PGBV96110521R",
    "Nombre": "ABARROTES LA PROVIDENCIA",
    "RegimenFiscal": "AUTO"
  },
  "Receptor": {
    "Rfc": "AUTO",
    "Nombre": "AUTO",
    "DomicilioFiscalReceptor": "AUTO",
    "RegimenFiscalReceptor": "AUTO",
    "UsoCFDI": "AUTO"
  },
  "Conceptos": [
    {
      "ClaveProdServ": "AUTO",
      "Cantidad": "AUTO",
      "ClaveUnidad": "AUTO",
      "Descripcion": "JABON EN POLVO 1KG",
      "ValorUnitario": "AUTO",
      "Importe": "40.50",
      "ObjetoImp": "AUTO"
    }
  ],
  "Impuestos": {
    "TotalImpuestosTrasladados": "AUTO"
  },
  "Complemento": {
    "TimbreFiscalDigital": {
      "UUID": "AUTO"
    }
  }
}
```
- [ ] El texto parece un ticket o factura real (o un papel que no es comprobante)
- [ ] Cada campo de la respuesta es correcto
- [ ] Nada se dedujo o calculó: todo lo que no es AUTO está escrito en el texto
- [ ] Los AUTO están bien puestos (no falta copiar nada legible)

Notas:

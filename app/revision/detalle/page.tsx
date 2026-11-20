import Link from "next/link";
import { Suspense } from "react";
import { AvatarUsuario, AvatarVacio } from "@/components/AvatarUsuario";
import { ChipConfianza, nivelDe } from "@/components/Confianza";
import { HeaderSecundario } from "@/components/HeaderSecundario";
import { Ico, MascotaBisie } from "@/components/ui";

/*
 * Pantalla 5 · Revisión de ticket, modo detalle (Figma 1:869).
 * Vista estática: el ticket de la izquierda es una recreación HTML del boceto
 * (en la app real será la foto con las cajas de YOLO). Valores y confianzas de ejemplo.
 */
const R = "/figma/revision";

type Campo = { id: string; nombre: string; valor: string; conf: number; nota?: string; mono?: boolean };

// Ordenados de menor a mayor confianza: lo dudoso va primero.
const campos: Campo[] = [
  { id: "rfc", nombre: "RFC Emisor", valor: "CCO8605231N4", conf: 0.42, nota: "⚠️ Revisa este dato antes de continuar (ilegible el último dígito)", mono: true },
  { id: "forma_pago", nombre: "Forma de pago", valor: "04 - Tarjeta de Débito", conf: 0.75 },
  { id: "total", nombre: "Total de la operación", valor: "$650.00 MXN", conf: 0.98 },
  { id: "iva", nombre: "IVA trasladado (16%)", valor: "$89.65 MXN", conf: 0.98 },
  { id: "subtotal", nombre: "Subtotal", valor: "$560.35 MXN", conf: 0.98 },
  { id: "fecha", nombre: "Fecha de emisión", valor: "14/03/2024", conf: 0.98 },
  { id: "emisor", nombre: "Nombre comercial emisor", valor: "CADENA COMERCIAL OXXO", conf: 0.98 },
];

/* Caja de detección sobre el ticket */
function Caja({
  etiqueta,
  color,
  children,
  derecha,
  className = "",
}: {
  etiqueta: React.ReactNode;
  color: "azul" | "oliva" | "error" | "ambar";
  children: React.ReactNode;
  derecha?: boolean;
  className?: string;
}) {
  const c = {
    azul: { box: "bg-azul/10 shadow-[0px_0px_0px_1.5px_#104094]", tag: "bg-azul text-white" },
    oliva: { box: "bg-oliva-viva/10 shadow-[0px_0px_0px_1.5px_#506300]", tag: "bg-oliva text-white" },
    error: { box: "bg-error/10 shadow-[0px_0px_0px_2px_#ba1a1a]", tag: "bg-error text-white" },
    ambar: { box: "bg-[rgba(245,158,11,0.1)] shadow-[0px_0px_0px_1.5px_#f2a900]", tag: "bg-[#f2a900] text-noche-profunda" },
  }[color];
  return (
    <div className={`relative rounded-2xl p-1.5 ${c.box} ${className}`}>
      <span
        className={`absolute -top-2.5 flex items-center gap-0.5 rounded-2xl px-1.5 text-[9px] leading-4 font-bold whitespace-nowrap ${c.tag} ${
          derecha ? "right-2" : "left-2"
        }`}
      >
        {etiqueta}
      </span>
      {children}
    </div>
  );
}

function TicketConCajas() {
  return (
    <section className="relative overflow-clip rounded-2xl bg-[#f1f3ff] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex justify-center p-4">
        <div className="relative flex w-full max-w-[320px] flex-col gap-3 rounded-[32px] bg-white px-5 py-5 font-mono text-tinta shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-marca to-transparent opacity-60" />
          <div className="border-b-2 border-dashed border-azul-50 pb-3.5 text-center">
            <p className="text-sm leading-5 font-bold tracking-[0.7px] uppercase">Cadena Comercial OXXO, S.A. de C.V.</p>
            <p className="text-[11px] leading-4 opacity-75">ESTACION GUADALUPE SUR 4022</p>
            <p className="text-[10px] leading-4 opacity-60">MONTERREY, N.L. C.P. 64000</p>
          </div>

          <Caja etiqueta="Emisor: OXXO GAS" color="azul" className="mt-2">
            <p className="text-[11px] leading-4 font-bold">CADENA COMERCIAL OXXO</p>
          </Caja>
          <Caja
            etiqueta={
              <>
                <Ico src={`${R}/aviso-mini.svg`} w={8.333} h={8.333} />
                RFC: Baja Confianza
              </>
            }
            color="error"
            derecha
            className="mt-1"
          >
            <p className="text-[11px] leading-4 font-bold tracking-[0.55px] text-error">RFC: CCO8605231N?</p>
          </Caja>
          <div className="mt-1 flex gap-2">
            <Caja etiqueta="Fecha" color="oliva" className="flex-1 p-1">
              <p className="text-[10px] leading-4">14/03/2024 18:32</p>
            </Caja>
            <Caja etiqueta="Folio: 49281" color="oliva" derecha className="flex-1 p-1 text-right">
              <p className="text-[10px] leading-4">TKT #49281</p>
            </Caja>
          </div>

          <div className="border-y border-dashed border-azul-50 py-2">
            <p className="flex justify-between text-[10px] leading-4">
              <span>MAGNA REGULAR (26.31 L)</span>
              <b>$560.35</b>
            </p>
            <p className="text-[9px] leading-4 opacity-60">P.U. $21.30 / LITRO</p>
          </div>

          <Caja etiqueta="IVA 16% ($89.65)" color="oliva" className="mt-1">
            <p className="flex justify-between text-[10px] leading-4">
              <span>SUBTOTAL</span>
              <span>$560.35</span>
            </p>
            <p className="flex justify-between text-[10px] leading-4">
              <span>IVA 16% TRASLADADO</span>
              <span>$89.65</span>
            </p>
          </Caja>
          <Caja etiqueta="Total: $650.00" color="oliva" derecha className="mt-1 bg-oliva-viva/15 p-2 shadow-[0px_0px_0px_2px_#506300]">
            <p className="flex items-center justify-between font-bold">
              <span className="text-xs leading-4">TOTAL MXN</span>
              <span className="text-sm leading-5">$650.00</span>
            </p>
          </Caja>
          <Caja etiqueta="Pago: Tarjeta" color="ambar" className="mt-1">
            <p className="text-[10px] leading-4">PAGO: TARJETA DE DEBITO VISA **** 4129</p>
          </Caja>

          <div className="flex items-center justify-between border-t-2 border-dashed border-azul-50 pt-2.5">
            <p className="text-[9px] leading-[11.25px] opacity-70">
              SOLICITA FACTURA EN:
              <br />
              oxxo.com/facturacion
              <br />
              VIGENCIA: 30 DIAS
            </p>
            <Caja etiqueta="QR SAT" color="azul" derecha className="mt-2 rounded-2xl bg-azul/15 p-1">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-tinta p-1">
                <Ico src={`${R}/qr-sat.svg`} w={21} h={21} />
              </span>
            </Caja>
          </div>
        </div>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-noche/80 px-2 py-1 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] backdrop-blur-[12px]">
        <button aria-label="Acercar" className="flex size-8 items-center justify-center rounded-full">
          <Ico src={`${R}/zoom-in.svg`} w={13.5} h={13.5} />
        </button>
        <button aria-label="Alejar" className="flex size-8 items-center justify-center rounded-full">
          <Ico src={`${R}/zoom-out.svg`} w={13.5} h={13.5} />
        </button>
        <button aria-label="Pantalla completa" className="flex size-8 items-center justify-center rounded-full">
          <Ico src={`${R}/pantalla.svg`} w={13.5} h={13.5} />
        </button>
      </div>
    </section>
  );
}

function CampoEditable({ campo }: { campo: Campo }) {
  const baja = nivelDe(campo.conf) === "baja";
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-2xl p-4 ${
        baja ? "bg-[rgba(255,218,214,0.4)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" : "bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={campo.id} className="flex items-center gap-1.5 text-sm leading-5 font-semibold text-tinta">
          {baja && <Ico src={`${R}/alerta.svg`} w={16.5} h={14.25} />}
          {campo.nombre}
        </label>
        <ChipConfianza conf={campo.conf} />
      </div>
      {campo.nota && <p className="text-xs leading-[18px] text-error">{campo.nota}</p>}
      <div className="relative pt-0.5">
        <input
          id={campo.id}
          defaultValue={campo.valor}
          className={`h-12 w-full rounded-[48px] pr-10 pl-4 text-base text-tinta outline-none focus:ring-2 focus:ring-azul ${
            baja ? "bg-white font-mono font-bold shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" : "bg-[#f1f3ff]"
          } ${campo.mono ? "font-mono" : ""}`}
        />
        <span aria-hidden className="pointer-events-none absolute top-2.5 right-2 flex size-8 items-center justify-center">
          <Ico src={`${R}/editar.svg`} w={13.5} h={13.5} />
        </span>
      </div>
    </div>
  );
}

const tipos = [
  { id: "ingreso", label: "Ingreso" },
  { id: "egreso", label: "Egreso", sugerido: true },
  { id: "pago", label: "Pago / Transf." },
];

export default function RevisionDetalle() {
  const pendientes = campos.filter((c) => nivelDe(c.conf) === "baja");

  return (
    <>
      <HeaderSecundario
        atras="/subir"
        derecha={
          <>
            <button aria-label="Ayuda" className="flex size-11 items-center justify-center rounded-full">
              <Ico src="/figma/configurar/ayuda.svg" w={18.333} h={18.333} />
            </button>
            <Suspense fallback={<AvatarVacio />}>
              <AvatarUsuario />
            </Suspense>
          </>
        }
      />

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-6 bg-fondo px-4 pt-16 pb-[150px]">
        <div className="-mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between py-2">
            <p className="flex items-center gap-1 text-sm leading-5 font-semibold text-tinta">
              Revisar ticket
              <span className="rounded-full bg-azul-50 px-2 py-0.5 text-xs leading-4 font-bold text-azul">1 de 4</span>
            </p>
            <Link
              href="/revision/sencillo"
              className="flex items-center gap-1.5 rounded-full bg-lima px-3 py-1 text-xs leading-4 font-bold tracking-[0.3px] text-lima-tinta"
            >
              <span className="size-2 rounded-full bg-oliva" />
              Modo detalle activo
            </Link>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-tinta">OXXO GAS</h1>
              <span className="text-sm leading-5 font-semibold text-azul">#49281</span>
            </div>
            <p className="flex items-center gap-1 text-sm leading-5 font-semibold text-tinta-suave">
              <Ico src={`${R}/ocr.svg`} w={12} h={13.333} />
              Ticket de papel térmico analizado con OCR
            </p>
          </div>
        </div>

        <TicketConCajas />

        {/* Consejo de Bisie' */}
        <aside className="flex items-start gap-3 rounded-2xl bg-lima p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <MascotaBisie size={48} fondo="bg-fondo" />
          <div className="flex flex-1 flex-col gap-[3px]">
            <p className="flex items-center gap-1.5 text-xs leading-4 font-bold">
              <span className="text-lima-tinta">Bisie&apos; tu asesor</span>
              <span className="size-1.5 rounded-full bg-azul" />
              <span className="text-azul">Tip de deducción</span>
            </p>
            <p className="text-sm leading-[19.25px] font-semibold text-lima-tinta">
              ¡Ojo al RFC! Está un poco borroso en el papel impreso. Revísalo antes de confirmar para que cuente sin
              problemas como gasto deducible en tu RESICO.
            </p>
          </div>
        </aside>

        {/* Campos */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[19px] leading-6 font-bold text-tinta">Campos detectados</h2>
            <span className="text-xs leading-4 font-bold text-tinta-suave">{campos.length} identificados</span>
          </div>
          <div className="flex flex-col gap-2">
            {campos.map((c) => (
              <CampoEditable key={c.id} campo={c} />
            ))}
          </div>
        </section>

        {/* Clasificación */}
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[19px] leading-6 font-bold text-tinta">Clasificación de la operación</h2>
            <Ico src={`${R}/etiqueta.svg`} w={15.833} h={16.667} />
          </div>
          <fieldset className="grid grid-cols-3 gap-2 pt-2">
            <legend className="sr-only">Tipo de operación</legend>
            {tipos.map((t) => (
              <label
                key={t.id}
                className="relative flex min-h-[60px] cursor-pointer items-center justify-center rounded-[48px] bg-[#f1f3ff] px-2 text-center text-sm leading-5 font-semibold text-tinta has-checked:bg-azul has-checked:text-white has-checked:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)]"
              >
                <input type="radio" name="tipo" value={t.id} defaultChecked={t.sugerido} className="sr-only" />
                {t.sugerido && (
                  <span className="absolute -top-2 right-1 rounded-full bg-lima px-1.5 text-[9px] leading-5 font-bold text-lima-tinta">
                    Sugerido
                  </span>
                )}
                {t.label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-[5.5px] pt-2">
            <label htmlFor="categoria" className="text-xs leading-4 font-bold text-tinta-suave">
              Categoría fiscal deducible
            </label>
            <div className="relative">
              <Ico src={`${R}/gasolina.svg`} w={13.75} h={15} className="pointer-events-none absolute top-[16.5px] left-4" />
              <select
                id="categoria"
                defaultValue="combustibles"
                className="h-12 w-full appearance-none truncate rounded-[48px] bg-[#f1f3ff] pr-10 pl-10 text-base leading-6 text-tinta outline-none focus:ring-2 focus:ring-azul"
              >
                <option value="combustibles">Combustibles y lubricantes (Gasolina)</option>
                <option value="insumos">Insumos y mercancía</option>
                <option value="servicios">Servicios (luz, agua, internet)</option>
                <option value="otros">Otros gastos</option>
              </select>
              <Ico src={`${R}/chevron.svg`} w={8.333} h={4.167} className="pointer-events-none absolute top-[22px] right-4" />
            </div>
            <p className="flex items-center gap-1 text-xs leading-[18px] text-tinta-suave">
              <Ico src={`${R}/info.svg`} w={11.667} h={11.667} />
              Indispensable contar con factura CFDI y pago electrónico en RESICO.
            </p>
          </div>
        </section>

        {/* ¿Tiene CFDI? */}
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-[19px] leading-6 font-bold text-tinta">
              <span className="flex size-8 items-center justify-center rounded-full bg-[rgba(128,163,253,0.3)]">
                <Ico src={`${R}/cfdi.svg`} w={16.667} h={18.333} />
              </span>
              ¿Tiene CFDI oficial?
            </h2>
            <span className="shrink-0 rounded-full bg-[#ffdad6] px-2 py-0.5 text-[11px] leading-[16.5px] font-bold tracking-[0.275px] text-[#93000a]">
              CFDI SIMULADO
            </span>
          </div>
          <div className="flex flex-col gap-2.5 pb-2">
            <p className="flex items-center justify-between rounded-[48px] bg-[#f1f3ff] p-2.5">
              <span className="flex items-center gap-2 text-sm leading-5 font-semibold text-tinta">
                <Ico src={`${R}/qr.svg`} w={15} h={15} />
                Código QR fiscal detectado
              </span>
              <span className="text-xs leading-4 font-bold text-azul">78% certeza</span>
            </p>
            <div className="flex items-start gap-2 rounded-[48px] bg-[#f1f3ff] p-2.5">
              <Ico src={`${R}/uuid.svg`} w={16.667} h={18.667} />
              <div>
                <p className="text-sm leading-5 font-semibold text-tinta">Folio fiscal UUID sugerido</p>
                <p className="text-xs leading-4 font-bold text-tinta-suave">
                  No timbrado aún (ticket de mostrador para facturar en línea)
                </p>
              </div>
            </div>
          </div>
          <button className="flex h-12 items-center justify-center gap-2 rounded-full bg-azul/10 text-base leading-6 text-azul">
            <Ico src={`${R}/portal.svg`} w={15} h={15} />
            Solicitar factura en portal OXXO
          </button>
        </section>

        {/* Validación de reglas */}
        <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm leading-5 font-semibold text-tinta">
              <Ico src={`${R}/calculo.svg`} w={20.167} h={19.25} />
              Cálculo fiscal automático
            </h2>
            <span className="flex items-center gap-1 rounded-full bg-lima px-2.5 py-0.5 text-xs leading-4 font-bold text-lima-tinta">
              <Ico src={`${R}/check.svg`} w={11.863} h={6.514} />
              Cuadra exacto
            </span>
          </div>
          <p className="rounded-[48px] bg-[#f1f3ff] p-3 font-mono text-sm leading-5 font-bold text-tinta">
            Subtotal ($560.35) + IVA 16% ($89.65) = <span className="text-marca">$650.00 ✓</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs leading-[15px] text-tinta-suave">
            <Ico src={`${R}/nota.svg`} w={12} h={12.667} />
            Estimación, no es una determinación oficial del SAT.
          </p>
        </section>
      </main>

      {/* Barra de acciones */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px] flex-col gap-2 bg-fondo/95 px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0px_-4px_16px_0px_rgba(0,15,42,0.06)] backdrop-blur-[16px]">
        <div className="flex items-center justify-between px-1 text-xs leading-4 font-bold">
          {pendientes.length > 0 ? (
            <span className="flex items-center gap-1.5 text-error" role="status">
              <Ico src={`${R}/exclama.svg`} w={2.667} h={12} />
              {pendientes.length} campo por revisar ({pendientes.map((p) => p.id.toUpperCase()).join(", ")})
            </span>
          ) : (
            <span />
          )}
          <span className="text-tinta-suave">Paso 1 de 4</span>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Descartar ticket" className="flex h-[52px] items-center justify-center rounded-full bg-azul-100 px-4">
            <Ico src={`${R}/basura.svg`} w={13.333} h={15} />
          </button>
          <Link
            href="/operaciones"
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-marca text-[19px] leading-6 font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <Ico src={`${R}/confirmar.svg`} w={14.942} h={11.023} />
            Confirmar y guardar
          </Link>
        </div>
      </div>
    </>
  );
}

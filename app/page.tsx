import Link from "next/link";
import { Suspense } from "react";
import { Saludo } from "@/components/AvatarUsuario";
import { PantallaApp } from "@/components/PantallaApp";
import { Ico, MascotaBisie, Simulado } from "@/components/ui";

/*
 * Pantalla 1 · Inicio (Figma 1:2). Vista estática: los montos y movimientos son
 * DATOS DE EJEMPLO del boceto, no vienen de Firestore ni de un cálculo real.
 */
const I = "/figma/inicio";

type Movimiento = {
  nombre: string;
  detalle: string;
  monto: string;
  ingreso: boolean;
  icono: { src: string; w: number; h: number; bg: string };
  estado: "confirmado" | "por-revisar";
  nota: React.ReactNode;
};

const movimientos: Movimiento[] = [
  {
    nombre: "Tlayudas Doña Mari",
    detalle: "Pago con CoDi / SPEI • Hoy 2:15 PM",
    monto: "+$450.00",
    ingreso: true,
    icono: { src: `${I}/tienda.svg`, w: 18.419, h: 16.5, bg: "bg-azul-150" },
    estado: "confirmado",
    nota: (
      <span className="rounded-md bg-azul-100 px-2 py-0.5 text-tinta-suave/80">
        CFDI Timbrado <Simulado />
      </span>
    ),
  },
  {
    nombre: "Abarrotes La Providencia",
    detalle: "Ticket de mostrador • Ayer 6:40 PM",
    monto: "-$1,240.00",
    ingreso: false,
    icono: { src: `${I}/carrito.svg`, w: 18.316, h: 18.333, bg: "bg-azul-100" },
    estado: "por-revisar",
    nota: (
      <span className="max-w-[200px] truncate text-right font-semibold text-marca-viva">
        Sin CFDI detectado • Tienes hasta fin de mes
      </span>
    ),
  },
  {
    nombre: "Empaques y Desechables",
    detalle: "Ticket RFC XAXX010101000 • 28 Oct",
    monto: "-$680.00",
    ingreso: false,
    icono: { src: `${I}/archivo.svg`, w: 18.333, h: 18.333, bg: "bg-azul-200" },
    estado: "confirmado",
    nota: (
      <span className="rounded-md bg-azul-100 px-2 py-0.5 text-tinta-suave/80">
        CFDI recibido <Simulado />
      </span>
    ),
  },
];

export default function Inicio() {
  return (
    <PantallaApp activa="inicio">
      {/* Aviso de sincronización */}
      <div className="flex items-center justify-between px-1 text-xs leading-4 font-bold">
        <div className="flex items-center gap-1.5 text-tinta-suave/90">
          <span className="size-2 rounded-full bg-oliva-viva" />
          Bisie&apos; conectada al buzón
        </div>
        <span className="text-tinta-suave/75">Hoy, 10:42 AM</span>
      </div>

      {/* 1 · Saludo de Bisie' */}
      <section className="overflow-clip rounded-[32px] bg-white p-4 shadow-tarjeta">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0 pt-0.5">
            <MascotaBisie size={64} />
            <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-marca">
              <Ico src={`${I}/badge-bisie.svg`} w={10.833} h={10.86} />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="flex w-fit items-center gap-1.5 rounded-full bg-lima px-3 py-1 text-xs leading-4 font-bold text-lima-tinta drop-shadow-[0px_2px_4px_rgba(200,243,12,0.4)]">
              <Ico src={`${I}/chip-hola.svg`} w={12} h={13.333} />
              <Suspense fallback="¡Hola!">
                <Saludo />
              </Suspense>{" "}
              Tienes 3 tickets por revisar 📋
            </p>
            <p className="pt-2 text-base leading-[22px] text-tinta">
              Revisémoslos en un minuto para que nada se te escape del cajón.
            </p>
            <Link href="/revision/sencillo" className="flex items-center gap-2 pt-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-azul-100 px-2.5 py-1 text-xs leading-4 font-bold text-tinta-suave">
                <span className="h-2 w-[7px] rounded-full bg-marca-viva" />
                3 pendientes de validar
              </span>
              <span className="text-xs leading-4 font-semibold text-azul">Toca para abrir →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2 · Resumen del mes */}
      <section className="relative overflow-clip rounded-[32px] bg-noche p-6 shadow-[0px_12px_32px_0px_rgba(0,15,42,0.32)]">
        <span className="absolute -top-16 -right-16 size-44 rounded-full bg-azul/25 blur-[64px]" />
        <span className="absolute -bottom-16 -left-16 size-36 rounded-full bg-lima/10 blur-[40px]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[19px] leading-6 font-bold text-noche-tinta">
              <Link href="/mi-mes" className="flex items-center gap-2">
                <Ico src={`${I}/resumen.svg`} w={15} h={15} />
                Resumen del mes
              </Link>
            </h2>
            <span className="rounded-full bg-lima px-3 py-1 text-xs leading-4 font-bold text-lima-tinta drop-shadow-[0px_0px_6px_rgba(200,243,12,0.35)]">
              RESICO Activo
            </span>
          </div>

          <p className="flex items-center gap-2 rounded-full bg-noche/80 px-3 py-1.5 text-xs leading-4 font-bold text-noche-tinta/90">
            <Ico src={`${I}/alerta.svg`} w={15.583} h={13.458} />
            <span className="truncate">Estimación, no es una determinación oficial del SAT</span>
          </p>

          <div className="flex flex-col gap-3">
            <div className="rounded-[48px] bg-noche p-3.5">
              <p className="text-sm leading-5 font-semibold text-noche-tinta/80">Cobrado con tickets y SPEI</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[28px] leading-9 font-extrabold tracking-[-0.7px] text-lima">$28,450.00</p>
                <span className="rounded-full bg-oliva-viva/30 px-2 py-0.5 text-xs leading-4 font-bold text-lima/90">
                  Tasa 1.0%
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Metrica
                icono={<Ico src={`${I}/con-factura.svg`} w={13.75} h={13.125} />}
                etiqueta="Con factura"
                color="text-lima"
                monto="$9,320.00"
                pie="Facturas verificadas"
              />
              <Metrica
                icono={<Ico src={`${I}/por-solicitar.svg`} w={11.875} h={13.125} />}
                etiqueta="Por solicitar"
                color="text-salmon"
                monto="$3,150.00"
                pie="Tickets pendientes"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs leading-4 font-bold">
              <span className="text-noche-tinta/85">74% amparado con CFDI</span>
              <span className="text-lima">$12,470.00 total gastos</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={74}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Gastos amparados con CFDI"
              className="flex h-3 overflow-clip rounded-full bg-[rgba(232,237,255,0.2)] p-0.5"
            >
              <span className="h-full w-[74%] rounded-full bg-lima" />
              <span className="h-full w-[26%] rounded-full bg-salmon/70" />
            </div>
          </div>
        </div>
      </section>

      {/* 3 · CTA principal */}
      <Link
        href="/subir"
        className="flex min-h-16 items-center justify-between rounded-[48px] bg-marca px-5 py-3 drop-shadow-[0px_8px_12px_rgba(186,11,0,0.35)]"
      >
        <span className="flex items-center gap-3.5">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/15">
            <Ico src={`${I}/camara.svg`} w={23.333} h={21} />
          </span>
          <span className="flex flex-col">
            <span className="text-xl leading-[26px] font-bold tracking-[-0.5px] text-white">📸 Subir tickets</span>
            <span className="text-xs leading-4 font-bold text-white/85">Cámara o galería • Detección automática</span>
          </span>
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Ico src={`${I}/flecha.svg`} w={14.667} h={14.667} />
        </span>
      </Link>

      {/* 4 · Últimos movimientos */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="flex items-center gap-1.5 text-[19px] leading-6 font-bold text-tinta">
            <Ico src={`${I}/historial.svg`} w={15} h={15} />
            Últimos movimientos
          </h3>
          <Link href="/operaciones" className="flex items-center gap-0.5 text-sm leading-5 font-bold text-azul">
            Ver todos
            <Ico src={`${I}/chevron.svg`} w={4.933} h={8} />
          </Link>
        </div>

        <ul className="flex flex-col gap-2.5">
          {movimientos.map((m) => (
            <li key={m.nombre} className="flex flex-col gap-2 rounded-[32px] bg-white p-4 drop-shadow-[0px_2px_5px_rgba(0,15,42,0.04)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${m.icono.bg}`}>
                    <Ico src={m.icono.src} w={m.icono.w} h={m.icono.h} />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <h4 className="truncate text-base leading-6 font-semibold text-tinta">{m.nombre}</h4>
                    <p className="truncate text-xs leading-4 font-bold text-tinta-suave">{m.detalle}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-[19px] leading-6 font-bold ${m.ingreso ? "text-oliva" : "text-tinta"}`}>
                  {m.monto}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 text-xs leading-4 font-bold">
                {m.estado === "confirmado" ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-azul-50 px-2.5 py-0.5 text-oliva">
                    <Ico src={`${I}/check.svg`} w={12.5} h={12.5} />
                    Confirmado
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-azul-100 px-2.5 py-0.5 text-tinta">
                    <Ico src={`${I}/reloj.svg`} w={12.5} h={12.5} />
                    Por revisar
                  </span>
                )}
                {m.nota}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Consejo de Bisie' */}
      <aside className="flex items-center gap-3 rounded-[48px] bg-azul-100/60 p-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
          <Ico src={`${I}/foco.svg`} w={18.75} h={18.333} />
        </span>
        <p className="text-xs leading-[16.5px] font-bold text-tinta-suave">
          <span className="font-extrabold text-tinta">Consejo de Bisie&apos;:</span> Si compras en tienditas de barrio,
          pide que anoten su RFC en el ticket para solicitar factura antes del día 30.
        </p>
      </aside>
    </PantallaApp>
  );
}

function Metrica(props: { icono: React.ReactNode; etiqueta: string; color: string; monto: string; pie: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between rounded-[48px] bg-noche p-3">
      <div className="flex flex-col gap-1.5">
        <p className={`flex items-center gap-1 text-xs leading-4 font-bold ${props.color}`}>
          {props.icono}
          {props.etiqueta}
        </p>
        <p className="text-[19px] leading-6 font-bold text-noche-tinta">{props.monto}</p>
      </div>
      <p className="pt-2 text-xs leading-4 font-bold text-noche-tinta/70">{props.pie}</p>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { comprobantesDeLote, type ResumenComprobante } from "@/lib/comprobantes";
import { db, esUuid } from "@/lib/db";
import { requerirUsuario } from "@/lib/sesion";
import { FotoLocal } from "@/components/FotoLocal";
import { Ico } from "@/components/ui";

/*
 * Resultado de un lote: lo que el modelo leyó de cada documento (guardado en SQLite).
 * La foto NO viene del servidor: <FotoLocal> la muestra solo si este teléfono aún la tiene.
 * Los datos se leen por petición, dentro de <Suspense> (requisito de cacheComponents);
 * connection() evita que la consulta síncrona se prerenderice.
 */
const S = "/figma/subir";

type Lote = { total_enviados: number; rechazados: string };

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const dinero = (v: string | null, moneda: string | null) =>
  v === null ? "—" : `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda ?? ""}`.trim();

/** Nombres amables para los campos que faltan (Bisie' los pedirá en la revisión). */
const NOMBRE_CAMPO: Record<string, string> = {
  Fecha: "Fecha",
  Total: "Total",
  "Emisor.Rfc": "RFC de quien emite",
  "Emisor.Nombre": "Nombre de quien emite",
  Conceptos: "Productos o servicios",
};

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] leading-4 font-bold tracking-[0.4px] text-tinta-suave uppercase">{etiqueta}</dt>
      <dd className={`text-sm leading-5 font-semibold break-words ${valor ? "text-tinta" : "text-tinta-suave/60 italic"}`}>
        {valor ?? "No se leyó"}
      </dd>
    </div>
  );
}

function Tarjeta({ c }: { c: ResumenComprobante }) {
  const faltantes = JSON.parse(c.faltantes) as string[];
  return (
    <li className="flex flex-col gap-3 rounded-[32px] bg-white p-4 shadow-tarjeta">
      <FotoLocal sha256={c.sha256} nombre={c.nombre_archivo} tamano={c.tamano_bytes} tipo={c.tipo_mime} origen={c.origen} />

      <div className="flex flex-col gap-1">
        <p className="truncate text-base leading-6 font-semibold text-tinta">{c.nombre_archivo}</p>
        <p className="text-xs leading-4 font-bold text-tinta-suave">
          {c.origen === "camara" ? "Foto de la cámara" : "Archivo"} · {c.tipo_mime.replace("image/", "").replace("application/", "").toUpperCase()} · {kb(c.tamano_bytes)}
        </p>
      </div>

      {c.estado === "error" ? (
        <p role="alert" className="flex items-center gap-1.5 rounded-2xl bg-[#ffdad6] px-3 py-2 text-sm leading-5 font-semibold text-[#93000a]">
          <Ico src={`${S}/aviso.svg`} w={11.917} h={10.292} />
          {c.error}
        </p>
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-1.5 text-xs leading-4 font-bold">
            <span className="flex items-center gap-1 rounded-full bg-azul-100 px-2.5 py-0.5 text-oliva">
              <Ico src={`${S}/check.svg`} w={12.5} h={12.5} />
              Datos leídos y guardados
            </span>
            {c.analisis_simulado === 1 && (
              <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[#92400e]">SIMULADO · no lo leyó el modelo</span>
            )}
            {c.huella_cliente === 0 && (
              <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[#92400e]">Sin huella del teléfono (conexión no segura)</span>
            )}
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl bg-fondo p-3">
            <Dato etiqueta="Emisor" valor={c.emisor_nombre ?? c.emisor_rfc} />
            <Dato etiqueta="Receptor" valor={c.receptor_nombre ?? c.receptor_rfc} />
            <Dato etiqueta="Fecha" valor={c.fecha} />
            <Dato etiqueta="Folio" valor={c.serie || c.folio ? `${c.serie ?? ""}${c.folio ?? ""}` : null} />
            <Dato etiqueta="IVA trasladado" valor={c.total_traslados ? dinero(c.total_traslados, c.moneda) : null} />
            <Dato etiqueta="Total" valor={c.total ? dinero(c.total, c.moneda) : null} />
          </dl>
          <p className="text-xs leading-4 font-semibold text-tinta-suave">
            {c.conceptos === 1 ? "1 concepto" : `${c.conceptos} conceptos`} · Falta tu revisión antes de confirmar.
          </p>
          {faltantes.length > 0 && (
            <div className="flex flex-col gap-1 rounded-2xl bg-[#fef3c7] px-3 py-2 text-xs leading-4 text-[#92400e]">
              <p className="font-bold">Bisie&apos; te preguntará:</p>
              <p>{faltantes.map((f) => NOMBRE_CAMPO[f] ?? f).join(" · ")}</p>
            </div>
          )}
        </>
      )}
    </li>
  );
}

async function Recibido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!esUuid(id)) notFound();

  await connection();
  const usuario = await requerirUsuario();
  const d = db();
  // Solo lotes de la persona con sesión; si es de alguien más, 404.
  const lote = d
    .prepare("SELECT total_enviados, rechazados FROM lotes WHERE id = ? AND usuario_id = ?")
    .get(id, usuario.id) as Lote | undefined;
  if (!lote) notFound();
  const comprobantes = comprobantesDeLote(d, id, usuario.id);

  const rechazados = JSON.parse(lote.rechazados) as { nombre: string; motivo: string }[];
  const leidos = comprobantes.filter((c) => c.estado !== "error").length;
  const todoBien = leidos === lote.total_enviados;

  return (
    <>
      <section
        role="status"
        className={`flex flex-col items-center gap-2 rounded-[32px] p-6 text-center ${todoBien ? "bg-[#1e8e4e] text-white" : "bg-[#f2a900] text-noche-profunda"}`}
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-4xl" aria-hidden>
          {todoBien ? "✓" : "!"}
        </span>
        <h1 className="text-[28px] leading-9 font-extrabold tracking-[-0.7px]">{todoBien ? "¡Listo!" : "Casi todo bien"}</h1>
        <p className="text-base leading-6 font-semibold">
          {todoBien
            ? leidos === 1 ? "Leímos tu documento." : `Leímos tus ${leidos} documentos.`
            : `Leímos ${leidos} de ${lote.total_enviados}. Revisa los que fallaron abajo.`}
        </p>
        <p className="text-xs leading-4 font-semibold opacity-90">🔒 Las fotos no se guardan: solo los datos leídos.</p>
      </section>

      <ul className="flex flex-col gap-3">
        {comprobantes.map((c) => (
          <Tarjeta key={c.id} c={c} />
        ))}
      </ul>

      {rechazados.length > 0 && (
        <section role="alert" className="flex flex-col gap-1 rounded-2xl bg-[#ffdad6] p-4 text-sm leading-5 text-[#93000a]">
          <p className="font-bold">No se analizaron:</p>
          {rechazados.map((r) => (
            <p key={r.nombre}>
              <b>{r.nombre}:</b> {r.motivo}
            </p>
          ))}
        </section>
      )}
    </>
  );
}

function Cargando() {
  return (
    <p role="status" className="rounded-[32px] bg-white p-6 text-center text-base font-semibold text-tinta-suave shadow-tarjeta">
      Cargando lo que leímos…
    </p>
  );
}

export default function Page({ params }: PageProps<"/subir/recibido/[id]">) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 py-8">
      <Suspense fallback={<Cargando />}>
        <Recibido params={params} />
      </Suspense>
      <div className="flex flex-col gap-2 pt-2">
        <Link
          href="/revision/sencillo"
          className="flex h-14 items-center justify-center rounded-full bg-marca text-[19px] leading-6 font-bold text-white drop-shadow-[0px_8px_12px_rgba(186,11,0,0.35)]"
        >
          Revisar mis tickets →
        </Link>
        <Link href="/subir" className="flex h-12 items-center justify-center rounded-full bg-azul-50 text-base leading-6 font-bold text-azul">
          Subir más fotos
        </Link>
      </div>
    </main>
  );
}

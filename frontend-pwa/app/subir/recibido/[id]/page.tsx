import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db, esUuid } from "@/lib/db";
import { requerirUsuario } from "@/lib/sesion";
import { Ico } from "@/components/ui";

/*
 * Confirmación después de subir un lote: "¡Todo bien!" + las imágenes tal como
 * quedaron guardadas en SQLite. Los datos se leen por petición, dentro de <Suspense>
 * (requisito de cacheComponents); connection() evita que la consulta síncrona se prerenderice.
 */
const S = "/figma/subir";

type Imagen = {
  id: string;
  nombre_original: string;
  tipo_mime: string;
  tamano_bytes: number;
  sha256: string;
  huella_cliente: number; // 0 | 1
};
type Lote = { total_enviados: number; rechazados: string };

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

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
  const imagenes = d
    .prepare(
      `SELECT id, nombre_original, tipo_mime, tamano_bytes, sha256, huella_cliente
         FROM imagenes WHERE lote_id = ? ORDER BY creado_en, nombre_original`,
    )
    .all(id) as Imagen[];

  const rechazados = JSON.parse(lote.rechazados) as { nombre: string; motivo: string }[];
  const todoBien = rechazados.length === 0;
  const n = imagenes.length;

  return (
    <>
      <section
        role="status"
        className={`flex flex-col items-center gap-2 rounded-[32px] p-6 text-center ${todoBien ? "bg-[#1e8e4e] text-white" : "bg-[#f2a900] text-noche-profunda"}`}
      >
        <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-4xl" aria-hidden>
          {todoBien ? "✓" : "!"}
        </span>
        <h1 className="text-[28px] leading-9 font-extrabold tracking-[-0.7px]">
          {todoBien ? "¡Todo bien!" : "Casi todo bien"}
        </h1>
        <p className="text-base leading-6 font-semibold">
          {todoBien
            ? n === 1 ? "Recibimos tu foto completa y sin cambios." : `Recibimos tus ${n} fotos completas y sin cambios.`
            : `Recibimos ${n} de ${lote.total_enviados} archivos. Revisa los que fallaron abajo.`}
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {imagenes.map((img) => (
          <li key={img.id} className="flex flex-col gap-3 rounded-[32px] bg-white p-4 shadow-tarjeta">
            {img.tipo_mime === "application/pdf" ? (
              <a
                href={`/api/imagenes/${img.id}`}
                target="_blank"
                className="flex h-40 items-center justify-center rounded-2xl bg-azul-50 text-base font-bold text-azul"
              >
                📄 Ver PDF
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/imagenes/${img.id}`}
                alt={`Foto recibida: ${img.nombre_original}`}
                className="max-h-[420px] w-full rounded-2xl bg-azul-50 object-contain"
              />
            )}
            <div className="flex flex-col gap-1">
              <p className="truncate text-base leading-6 font-semibold text-tinta">{img.nombre_original}</p>
              <p className="text-xs leading-4 font-bold text-tinta-suave">
                {img.tipo_mime.replace("image/", "").replace("application/", "").toUpperCase()} · {kb(img.tamano_bytes)}
              </p>
              <p className="flex flex-wrap items-center gap-1.5 pt-1 text-xs leading-4 font-bold">
                <span className="flex items-center gap-1 rounded-full bg-azul-100 px-2.5 py-0.5 text-oliva">
                  <Ico src={`${S}/check.svg`} w={12.5} h={12.5} />
                  Guardada y comprobada
                </span>
                {img.huella_cliente ? (
                  <span className="rounded-full bg-lima/40 px-2.5 py-0.5 text-lima-tinta">Huella idéntica a la de tu teléfono</span>
                ) : (
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[#92400e]">Sin huella del teléfono (conexión no segura)</span>
                )}
              </p>
              <p className="font-mono text-[10px] leading-4 break-all text-tinta-suave/70">sha256 {img.sha256}</p>
            </div>
          </li>
        ))}
      </ul>

      {rechazados.length > 0 && (
        <section role="alert" className="flex flex-col gap-1 rounded-2xl bg-[#ffdad6] p-4 text-sm leading-5 text-[#93000a]">
          <p className="font-bold">No se guardaron:</p>
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
      Comprobando tus fotos…
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

import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { FormularioRevision } from "@/components/FormularioRevision";
import { db, esUuid } from "@/lib/db";
import { comprobanteParaRevision, pendientes } from "@/lib/operaciones";
import { requerirUsuario } from "@/lib/sesion";

/** Carga el comprobante pedido (?id=) o el primer pendiente, y arma la revisión. */
export async function Revision({ searchParams, modo }: { searchParams: Promise<{ id?: string | string[] }>; modo: "sencillo" | "detalle" }) {
  await connection();
  const u = await requerirUsuario();
  const d = db();
  const lista = pendientes(d, u.id);
  const pedido = (await searchParams).id;
  const id = typeof pedido === "string" ? pedido : lista[0];

  if (!id) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-[32px] bg-white p-8 text-center">
        <span aria-hidden className="text-5xl">🎉</span>
        <h1 className="text-2xl font-extrabold text-tinta">No tienes tickets por revisar</h1>
        <p className="text-base text-tinta-suave">Cuando subas uno nuevo, aquí lo revisamos juntos.</p>
        <div className="flex w-full flex-col gap-2 pt-2">
          <Link href="/subir" className="flex h-14 items-center justify-center rounded-full bg-marca text-[19px] font-bold text-white">Subir tickets</Link>
          <Link href="/operaciones" className="flex h-12 items-center justify-center rounded-full bg-azul-50 font-bold text-azul">Ver mis operaciones</Link>
        </div>
      </section>
    );
  }
  if (!esUuid(id)) notFound();
  const c = comprobanteParaRevision(d, u.id, id);
  if (!c) notFound();
  const i = lista.indexOf(id);
  return <FormularioRevision key={c.id} c={c} modo={modo} posicion={i >= 0 ? { n: i + 1, total: lista.length } : null} />;
}

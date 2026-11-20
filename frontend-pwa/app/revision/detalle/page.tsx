import { Suspense } from "react";
import { HeaderSecundario } from "@/components/HeaderSecundario";
import { Revision } from "@/components/RevisionPagina";

/*
 * Pantalla 5 · Revisión, modo detalle (Figma 1:869).
 * Datos reales de SQLite; al confirmar se guardan las correcciones y se pasa al siguiente pendiente.
 */
export default function Page({ searchParams }: PageProps<"/revision/detalle">) {
  return (
    <>
      <HeaderSecundario atras="/operaciones" />
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 pt-16 pb-8">
        <Suspense fallback={<p className="rounded-[32px] bg-white p-6 text-center font-semibold text-tinta-suave">Cargando el ticket…</p>}>
          <Revision searchParams={searchParams} modo="detalle" />
        </Suspense>
      </main>
    </>
  );
}

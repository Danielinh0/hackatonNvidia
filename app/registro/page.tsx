import { PantallaCuenta } from "@/components/PantallaCuenta";

/* Crear cuenta local. Sin ?siguiente= la persona va después a /configurar. */
export default function Page({ searchParams }: PageProps<"/registro">) {
  return <PantallaCuenta modo="registro" searchParams={searchParams} />;
}

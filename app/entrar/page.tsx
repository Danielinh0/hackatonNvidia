import { PantallaCuenta } from "@/components/PantallaCuenta";

/* Entrar con correo y contraseña. Acepta ?siguiente=/ruta (validado) y ?motivo=caducada|salida. */
export default function Page({ searchParams }: PageProps<"/entrar">) {
  return <PantallaCuenta modo="entrar" searchParams={searchParams} />;
}

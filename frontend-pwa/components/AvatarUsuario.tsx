import Link from "next/link";
import { requerirUsuario, primerNombre } from "@/lib/sesion";

/* Foto de Google de la persona (o su inicial). Va dentro de <Suspense> porque lee la sesión. */
export async function AvatarUsuario({
  size = 32,
  enlace = true,
}: {
  size?: number;
  enlace?: boolean;
}) {
  const u = await requerirUsuario();
  const imagen = u.foto_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={u.foto_url}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-azul text-sm font-bold text-white uppercase"
      style={{ width: size, height: size }}
    >
      {primerNombre(u).slice(0, 1)}
    </span>
  );
  /* Dentro de la barra inferior el enlace lo pone el elemento "Cuenta". */
  if (!enlace)
    return <span className="block shrink-0 rounded-full">{imagen}</span>;
  return (
    <Link
      href="/configurar"
      aria-label={`Tu perfil (${u.email})`}
      className="block shrink-0 rounded-full"
    >
      {imagen}
    </Link>
  );
}

export function AvatarVacio({ size = 32 }: { size?: number }) {
  return (
    <span
      className="block shrink-0 rounded-full bg-azul-150"
      style={{ width: size, height: size }}
    />
  );
}

/* Saludo con el primer nombre (pantalla de Inicio). */
export async function Saludo() {
  const u = await requerirUsuario();
  return <>¡Hola, {primerNombre(u)}!</>;
}

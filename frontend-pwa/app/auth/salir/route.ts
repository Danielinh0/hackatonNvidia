import { NextResponse, type NextRequest } from "next/server";
import { origen } from "@/lib/google";
import { cerrarSesion, COOKIE_SESION } from "@/lib/sesion";

/* Cerrar sesión (POST desde un formulario). Borra la sesión en SQLite y la cookie. */
export async function POST(req: NextRequest) {
  cerrarSesion(req.cookies.get(COOKIE_SESION)?.value);
  const res = NextResponse.redirect(`${origen(req.url)}/entrar?motivo=salida`, 303);
  res.cookies.delete(COOKIE_SESION);
  return res;
}

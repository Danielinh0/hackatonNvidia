import { NextResponse, type NextRequest } from "next/server";
import { origen } from "@/lib/google";
import { COOKIE_SESION } from "@/lib/sesion";

/* La cookie existe pero la sesión ya no es válida (vencida o borrada): se limpia y se pide entrar de nuevo. */
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(`${origen(req.url)}/entrar?motivo=caducada`);
  res.cookies.delete(COOKIE_SESION);
  return res;
}

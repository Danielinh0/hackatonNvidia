import { NextResponse, type NextRequest } from "next/server";
import { esPublica, RUTAS_ACCESO, rutaEntrar, siguienteSeguro } from "@/lib/rutas";

/*
 * Revisión rápida ("optimista") de la cookie de sesión y manejo de ?siguiente=:
 *  - Sin sesión en "/" → /bienvenida.
 *  - Sin sesión en otra página → /entrar?siguiente=<ruta pedida con sus parámetros>.
 *  - Sin sesión en /api → 401.
 *  - Con sesión en /bienvenida, /entrar o /registro → al destino (?siguiente= validado) o al inicio.
 * NO valida la sesión contra la base: eso lo hacen las acciones y páginas (lib/sesion.ts).
 */
export function proxy(req: NextRequest) {
  const { pathname, search, searchParams } = req.nextUrl;
  const conSesion = req.cookies.has("dzuun_sesion");

  if (!conSesion && !esPublica(pathname)) {
    if (pathname.startsWith("/api/")) return new NextResponse("Inicia sesión", { status: 401 });
    const destino = pathname === "/" ? "/bienvenida" : rutaEntrar(pathname + search);
    return NextResponse.redirect(new URL(destino, req.url));
  }

  if (conSesion && RUTAS_ACCESO.includes(pathname)) {
    return NextResponse.redirect(new URL(siguienteSeguro(searchParams.get("siguiente")), req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todo menos archivos estáticos, íconos de Figma e imágenes optimizadas.
  matcher: ["/((?!_next/static|_next/image|figma/|favicon.ico).*)"],
};

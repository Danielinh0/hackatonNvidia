import Link from "next/link";

/* Índice de desarrollo: enlaza cada pantalla convertida desde Figma ("Pantallas Dzuun"). */
const pantallas = [
  { n: 1, ruta: "/", nombre: "Inicio", nodo: "1:2" },
  { n: 2, ruta: "/bienvenida", nombre: "Bienvenida y login", nodo: "1:2985" },
  { n: 2, ruta: "/bienvenida/error", nombre: "Bienvenida · error de conexión", nodo: "1:2819" },
  { n: 2, ruta: "/entrar", nombre: "Entrar (correo y contraseña)", nodo: "—" },
  { n: 2, ruta: "/registro", nombre: "Crear cuenta", nodo: "—" },
  { n: 3, ruta: "/configurar", nombre: "Configurar negocio", nodo: "1:475" },
  { n: 4, ruta: "/subir", nombre: "Subir lote", nodo: "1:632" },
  { n: 5, ruta: "/revision/detalle", nombre: "Revisión · modo detalle", nodo: "1:869" },
  { n: 6, ruta: "/revision/sencillo", nombre: "Revisión · modo sencillo", nodo: "1:1243" },
  { n: 7, ruta: "/chat", nombre: "Chat con Bisie'", nodo: "1:1998" },
  { n: 8, ruta: "/operaciones", nombre: "Operaciones", nodo: "1:1421" },
  { n: 9, ruta: "/mi-mes", nombre: "Mi mes", nodo: "1:1714" },
  { n: 10, ruta: "/pre-factura", nombre: "Pre-factura (SIMULADO)", nodo: "1:2158" },
  { n: 11, ruta: "/estados", nombre: "Errores y estados", nodo: "1:2375" },
];

export default function Pantallas() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-fondo px-4 py-8">
      <div>
        <h1 className="text-2xl leading-8 font-bold text-tinta">Pantallas Dzuun</h1>
        <p className="text-sm leading-5 text-tinta-suave">
          Vistas estáticas convertidas desde Figma. Los datos son de ejemplo; nada se guarda todavía.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {pantallas.map((p) => (
          <li key={p.ruta}>
            <Link href={p.ruta} className="flex items-center justify-between gap-2 rounded-2xl bg-white p-4 shadow-tarjeta">
              <span className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul-100 text-xs font-bold text-azul">
                  {p.n}
                </span>
                <span className="text-base leading-6 font-semibold text-tinta">{p.nombre}</span>
              </span>
              <span className="font-mono text-xs text-tinta-suave">{p.ruta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

import { Suspense } from "react";
import { Bienvenida } from "@/components/Bienvenida";

/* Variante de error (Figma 1:2819). /auth/google/callback redirige aquí con ?motivo=... */
const MOTIVOS: Record<string, string> = {
  cancelado: "Cerraste la ventana de Google antes de terminar. Puedes intentarlo otra vez.",
  expirado: "El intento de entrar tardó demasiado. Vuelve a intentarlo.",
  state: "No pudimos confirmar que el intento venía de esta app. Vuelve a intentarlo.",
  token: "Google respondió con datos que no pudimos validar.",
  google: "Google no respondió a tiempo.",
  config: "El login con Google aún no está configurado en este servidor (faltan credenciales).",
};

async function Detalle({ searchParams }: { searchParams: Promise<{ motivo?: string | string[] }> }) {
  const { motivo } = await searchParams;
  const texto = typeof motivo === "string" ? MOTIVOS[motivo] : undefined;
  return texto ? <p className="text-sm leading-5 font-semibold text-error">{texto}</p> : null;
}

export default function Page({ searchParams }: PageProps<"/bienvenida/error">) {
  return (
    <Bienvenida
      estado="error"
      detalle={
        <Suspense fallback={null}>
          <Detalle searchParams={searchParams} />
        </Suspense>
      }
    />
  );
}

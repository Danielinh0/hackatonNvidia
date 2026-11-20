import { Ico } from "./ui";

/*
 * Semáforo de confianza (CLAUDE.md sec. 14 y 22):
 * Alta ≥ 0.85 · Media 0.6–0.85 · Baja < 0.6. Siempre icono + palabra.
 */
export type Nivel = "alta" | "media" | "baja";

export function nivelDe(conf: number): Nivel {
  if (conf >= 0.85) return "alta";
  if (conf >= 0.6) return "media";
  return "baja";
}

const estilos: Record<Nivel, { clase: string; icono: string; size: number; texto: string }> = {
  alta: { clase: "bg-[#1e8e4e] text-white", icono: "/figma/revision/alta.svg", size: 10.833, texto: "Alta" },
  media: { clase: "bg-[#f2a900] text-noche-profunda", icono: "/figma/revision/media.svg", size: 10.833, texto: "Media" },
  baja: { clase: "bg-[#b3261e] text-white", icono: "/figma/revision/baja.svg", size: 9.75, texto: "Baja" },
};

export function ChipConfianza({ conf }: { conf: number }) {
  const n = nivelDe(conf);
  const e = estilos[n];
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs leading-4 font-bold drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] ${e.clase}`}
    >
      <Ico src={e.icono} w={e.size} h={e.size} />
      {e.texto} ({Math.round(conf * 100)}%)
    </span>
  );
}

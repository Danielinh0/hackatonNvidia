/*
 * Aritmética decimal exacta para importes del CFDI.
 * Todo se guarda como BigInt en millonésimas (6 decimales, lo que permite el SAT en
 * Cantidad, ValorUnitario y TasaOCuota). Así 0.1 + 0.2 da 0.3 exacto, sin errores de float.
 */
const ESCALA = 6;
const UNO = 10n ** BigInt(ESCALA);

/** "1250.50" → 1250500000n. Devuelve null si no es un decimal positivo con ≤ 6 decimales. */
export function leer(s: unknown): bigint | null {
  if (typeof s === "number") s = String(s);
  if (typeof s !== "string" || !/^\d{1,15}(\.\d{1,6})?$/.test(s.trim())) return null;
  const [ent, dec = ""] = s.trim().split(".");
  return BigInt(ent) * UNO + BigInt(dec.padEnd(ESCALA, "0"));
}

/** Redondeo "half up" a `decimales` (2 para importes en MXN). */
export function redondear(v: bigint, decimales: number): bigint {
  const paso = 10n ** BigInt(ESCALA - decimales);
  return ((v + paso / 2n) / paso) * paso;
}

/** a × b, redondeado a 6 decimales. */
export function multiplicar(a: bigint, b: bigint): bigint {
  return (a * b + UNO / 2n) / UNO;
}

/** 2901160000n, 2 → "2901.16" */
export function formatear(v: bigint, decimales: number): string {
  const r = redondear(v, decimales);
  const ent = r / UNO;
  if (decimales === 0) return ent.toString();
  const dec = (r % UNO).toString().padStart(ESCALA, "0").slice(0, decimales);
  return `${ent}.${dec}`;
}

export const suma = (xs: bigint[]) => xs.reduce((a, b) => a + b, 0n);

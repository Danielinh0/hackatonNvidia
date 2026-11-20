/*
 * Contraseñas con scrypt (integrado en node:crypto, sin dependencias).
 * Formato guardado: "scrypt$N$r$p$sal$hash" (base64url), así se pueden subir los
 * parámetros en el futuro sin romper las contraseñas existentes.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (clave: string, sal: Buffer, largo: number, op: ScryptOptions) =>
  new Promise<Buffer>((res, rej) => scryptCb(clave, sal, largo, op, (e, k) => (e ? rej(e) : res(k))));

const N = 16384, R = 8, P = 1, LARGO = 64;
export const MIN_CONTRASENA = 8;

export async function hashContrasena(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const k = await scrypt(clave.normalize("NFKC"), sal, LARGO, { N, r: R, p: P });
  return ["scrypt", N, R, P, sal.toString("base64url"), k.toString("base64url")].join("$");
}

export async function verificarContrasena(clave: string, guardado: string): Promise<boolean> {
  const [alg, n, r, p, sal, hash] = guardado.split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64url");
  const k = await scrypt(clave.normalize("NFKC"), Buffer.from(sal, "base64url"), esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return k.length === esperado.length && timingSafeEqual(k, esperado); // comparación en tiempo constante
}

/** Hash de relleno: si el correo no existe se verifica contra este para tardar lo mismo
 *  y no revelar qué correos tienen cuenta. */
export const HASH_RELLENO =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

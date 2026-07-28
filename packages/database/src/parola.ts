import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Parola özeti ve oturum jetonu — node:crypto ile.
 *
 * ponytail: bcrypt/argon2 bağımlılığı yok; scrypt stdlib'de ve OWASP'ın
 * kabul ettiği bir KDF. Parametreler açıkça yazılı, ileride yükseltilebilir.
 * ponytail: N=2^15; donanım hızlanırsa N yükseltilir, format `scrypt$N$r$p$...`
 * olduğu için eski özetler doğrulanmaya devam eder.
 */

const scryptAsync = promisify(scrypt) as (parola: string, tuz: Buffer, uzunluk: number, secenek: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

const N = 32768;
const r = 8;
const p = 1;
const UZUNLUK = 32;

export async function parolaOzetle(parola: string): Promise<string> {
  const tuz = randomBytes(16);
  const ozet = await scryptAsync(parola.normalize("NFKC"), tuz, UZUNLUK, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${tuz.toString("base64")}$${ozet.toString("base64")}`;
}

export async function parolaDogrula(parola: string, saklanan: string | null): Promise<boolean> {
  if (!saklanan) return false;
  const [alg, sN, sr, sp, tuzB64, ozetB64] = saklanan.split("$");
  if (alg !== "scrypt") return false;
  const tuz = Buffer.from(tuzB64, "base64");
  const beklenen = Buffer.from(ozetB64, "base64");
  const hesap = await scryptAsync(parola.normalize("NFKC"), tuz, beklenen.length, {
    N: Number(sN),
    r: Number(sr),
    p: Number(sp),
    maxmem: 64 * 1024 * 1024,
  });
  return hesap.length === beklenen.length && timingSafeEqual(hesap, beklenen);
}

export function oturumJetonu(): string {
  return randomBytes(32).toString("base64url");
}

/** Jetonun kendisi çerezde durur; veritabanında yalnızca özeti saklanır. */
export async function jetonOzeti(jeton: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(jeton).digest("hex");
}

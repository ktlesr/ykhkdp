/**
 * Log, metrik, trace.
 *
 * ponytail: pino/winston/OTel yerine stdout'a JSON satırı. Dokploy zaten
 * stdout topluyor; toplayıcı bir alan bekliyorsa `YKH_LOG_FORMAT=json` yeterli.
 * Gerçek bir APM'e ihtiyaç doğduğunda `yaz()` tek noktadan değiştirilir.
 */

export type Seviye = "debug" | "info" | "uyari" | "hata";

export type Olay = {
  seviye: Seviye;
  mesaj: string;
  [alan: string]: unknown;
};

const SIRA: Record<Seviye, number> = { debug: 10, info: 20, uyari: 30, hata: 40 };
const ESIK = SIRA[(process.env.YKH_LOG_SEVIYE as Seviye) ?? "info"] ?? 20;

/**
 * Kişisel veri log'a yazılmaz. Bu alanlar görülürse maskelenir — brief §4
 * KVKK ayrımının log tarafındaki karşılığı.
 */
const GIZLI = new Set(["parola", "parola_hash", "eposta", "ad_soyad", "jeton", "token_hash", "authorization"]);

function maskele(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (GIZLI.has(k)) out[k] = "***";
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = maskele(v as Record<string, unknown>);
    else out[k] = v;
  }
  return out;
}

function yaz(olay: Olay): void {
  if (SIRA[olay.seviye] < ESIK) return;
  const { seviye, mesaj, ...alanlar } = olay;
  const satir = JSON.stringify({ t: new Date().toISOString(), seviye, mesaj, ...maskele(alanlar) });
  if (seviye === "hata") console.error(satir);
  else console.log(satir);
}

export const log = {
  debug: (mesaj: string, alanlar: Record<string, unknown> = {}) => yaz({ seviye: "debug", mesaj, ...alanlar }),
  info: (mesaj: string, alanlar: Record<string, unknown> = {}) => yaz({ seviye: "info", mesaj, ...alanlar }),
  uyari: (mesaj: string, alanlar: Record<string, unknown> = {}) => yaz({ seviye: "uyari", mesaj, ...alanlar }),
  hata: (mesaj: string, alanlar: Record<string, unknown> = {}) => yaz({ seviye: "hata", mesaj, ...alanlar }),
};

/** Süre ölçümü — `using` ile kapsam sonunda otomatik yazar. */
export async function olc<T>(ad: string, is: () => Promise<T>, alanlar: Record<string, unknown> = {}): Promise<T> {
  const t0 = performance.now();
  try {
    const sonuc = await is();
    log.info(ad, { ...alanlar, ms: Math.round(performance.now() - t0) });
    return sonuc;
  } catch (e) {
    log.hata(ad, { ...alanlar, ms: Math.round(performance.now() - t0), hata: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

/** AI çağrısı maliyet kaydı — brief §6 "maliyet" gereksinimi. */
export function aiMaliyeti(m: { model: string; girdiToken: number; ciktiToken: number; promptSurum: string; sonuc: "ok" | "red" }): void {
  log.info("ai_cagrisi", m);
}

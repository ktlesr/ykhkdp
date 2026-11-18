export * from "./sema.ts";
export * from "./prompt.ts";
export * from "./gateway.ts";
export * from "./istemci.ts";

/**
 * Pinli model. `latest` yasak.
 *
 * Varsayılan istemciye göre değişir: OPENAI_API_KEY varsa gerçek çağrı
 * api.openai.com'a gider, dolayısıyla snapshot bir OpenAI modeli olmalıdır.
 * Anahtar yokken çevrimdışı istemci çalışır ve snapshot yalnızca künye olarak
 * kaydedilir. `YKH_MODEL_SNAPSHOT` ikisini de ezer.
 */
export const VARSAYILAN_OPENAI_MODEL = "gpt-5.4-mini-2026-03-17";
export const CEVRIMDISI_KUNYE = "cevrimdisi-2026-07";

export function modelSnapshot(): string {
  const acik = process.env.YKH_MODEL_SNAPSHOT?.trim();
  if (acik) return acik;
  return process.env.OPENAI_API_KEY ? VARSAYILAN_OPENAI_MODEL : CEVRIMDISI_KUNYE;
}

/** Geriye dönük kullanım için; çağrı anında okunması gereken yerlerde modelSnapshot() kullanın. */
export const MODEL_SNAPSHOT = modelSnapshot();

/**
 * Yöneticinin seçebileceği modeller (`/ayarlar`). Kimlikler pinli: `latest`
 * yok, künyeye bu dizge yazılır. "varsayilan" = ortam değişkenine göre
 * (OPENAI_API_KEY → OpenAI, yoksa çevrimdışı).
 */
export const MODEL_SECENEKLERI = [
  { id: "openai:gpt-5.4-mini-2026-03-17", saglayici: "openai", model: "gpt-5.4-mini-2026-03-17", ad: "OpenAI GPT-5.4 mini", anahtar: "OPENAI_API_KEY" },
  { id: "anthropic:claude-opus-5-5", saglayici: "anthropic", model: "claude-opus-5-5", ad: "Claude Opus 5.5", anahtar: "ANTHROPIC_API_KEY" },
  { id: "anthropic:claude-sonnet-5-5", saglayici: "anthropic", model: "claude-sonnet-5-5", ad: "Claude Sonnet 5.5", anahtar: "ANTHROPIC_API_KEY" },
  { id: "anthropic:claude-haiku-5-5", saglayici: "anthropic", model: "claude-haiku-5-5", ad: "Claude Haiku 5.5", anahtar: "ANTHROPIC_API_KEY" },
  // Kurumun kendi sunucusundaki model (vLLM, OpenAI uyumlu uç). Belge metni kurum dışına çıkmaz.
  { id: "zafer:gemma4-26b", saglayici: "zafer", model: "gemma4-26b", ad: "Zafer AI Local LLM (Gemma 4)", anahtar: "ZAFER_AI_API_KEY" },
] as const;
export type ModelSecenegi = (typeof MODEL_SECENEKLERI)[number];

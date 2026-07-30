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
export const VARSAYILAN_OPENAI_MODEL = "gpt-4.1-2025-04-14";
export const CEVRIMDISI_KUNYE = "cevrimdisi-2026-07";

export function modelSnapshot(): string {
  const acik = process.env.YKH_MODEL_SNAPSHOT?.trim();
  if (acik) return acik;
  return process.env.OPENAI_API_KEY ? VARSAYILAN_OPENAI_MODEL : CEVRIMDISI_KUNYE;
}

/** Geriye dönük kullanım için; çağrı anında okunması gereken yerlerde modelSnapshot() kullanın. */
export const MODEL_SNAPSHOT = modelSnapshot();

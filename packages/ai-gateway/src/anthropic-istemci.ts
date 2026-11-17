import Anthropic from "@anthropic-ai/sdk";
import type { ModelCevabi, ModelIstegi, ModelIstemcisi } from "./gateway.ts";

/**
 * Anthropic Messages API istemcisi — OpenAI istemcisiyle AYNI sözleşme.
 *
 * Gateway'in doğrulama zinciri değişmez: çıktı yine Zod `.strict()` ile
 * okunur, alıntılar yine kaynakta birebir aranır. Sağlayıcı yalnızca metni
 * üretir; neyin kaydedileceğine doğrulayıcı karar verir.
 *
 * Yapılandırılmış çıktı `output_config.format` ile. Claude'un şema motoru
 * minLength/maximum/maxItems gibi kısıtları kabul etmiyor; bunlar gönderilen
 * şemadan çıkarılır, Zod ise aynı kısıtları yanıt geldiğinde yine uygular —
 * kısıt gevşemez, yalnızca denetimin yeri değişir.
 *
 * Ret (`refusal`) için sunucu tarafı yedek model açıktır (`fallbacks:
 * "default"`); yedek devreye girerse YANITI VEREN model künyeye yazılır
 * (`ModelCevabi.model`) — "bu sayıyı kim koydu" sorusu doğru cevaplanır.
 * Haiku'da sunucu tarafı yedek yok; orada ret, model aşaması hatasıdır.
 */

/** Claude'un yapılandırılmış çıktı şemasında desteklenmeyen anahtar sözcükler. */
const DESTEKSIZ = new Set(["minLength", "maxLength", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minItems", "maxItems", "pattern"]);

/**
 * Çıkarılan kısıt modele SÖZLE bildirilir (alanın `description`ına eklenir).
 *
 * Ölçüldü: maxLength sessizce çıkarılınca Claude NACE gerekçesini 300
 * karakterin üstünde yazdı ve Zod çıktıyı reddetti — güvence çalıştı ama
 * çağrı boşa gitti. Kısıtın kendisi Zod'da kalır; burada yalnızca model
 * onu bilir.
 */
function kisitNotu(o: Record<string, unknown>): string {
  const n: string[] = [];
  if (typeof o.minLength === "number" && o.minLength > 1) n.push(`en az ${o.minLength} karakter`);
  if (typeof o.maxLength === "number") n.push(`en çok ${o.maxLength} karakter`);
  if (typeof o.minimum === "number") n.push(`en küçük ${o.minimum}`);
  if (typeof o.maximum === "number") n.push(`en büyük ${o.maximum}`);
  if (typeof o.minItems === "number" && o.minItems > 0) n.push(`en az ${o.minItems} öğe`);
  if (typeof o.maxItems === "number") n.push(`en çok ${o.maxItems} öğe`);
  if (typeof o.pattern === "string") n.push(`biçim: ${o.pattern}`);
  return n.join(", ");
}

export function semayiSadelestir(d: unknown): unknown {
  if (Array.isArray(d)) return d.map(semayiSadelestir);
  if (!d || typeof d !== "object") return d;
  const o = d as Record<string, unknown>;
  const sade = Object.fromEntries(
    Object.entries(o)
      .filter(([k]) => !DESTEKSIZ.has(k) && k !== "$schema")
      .map(([k, v]) => [k, semayiSadelestir(v)]),
  );
  const not = kisitNotu(o);
  if (not) sade.description = [o.description, `(${not})`].filter(Boolean).join(" ");
  return sade;
}

/** Sunucu tarafı yedek model yalnızca Opus ve Sonnet'te var. */
const yedekVar = (model: string) => /^claude-(opus|sonnet)-/.test(model);

export const anthropicIstemci = (efor: (sema: string) => string): ModelIstemcisi => ({
  ad: "anthropic",
  async cagir(istek: ModelIstegi): Promise<ModelCevabi> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY tanımlı değil.");
    // 429/5xx/bağlantı hataları SDK içinde geri çekilmeli yeniden denenir.
    const client = new Anthropic({
      maxRetries: 3,
      timeout: Number(process.env.YKH_MODEL_ZAMAN_ASIMI_MS) || 180_000,
    });

    const yanit = await client.beta.messages.create({
      model: istek.modelSnapshot,
      max_tokens: 16000,
      system: istek.sistem,
      messages: [{ role: "user", content: istek.kullanici }],
      output_config: {
        effort: efor(istek.semaAdi) as "low" | "medium" | "high",
        format: { type: "json_schema", schema: semayiSadelestir(istek.jsonSema) as Record<string, unknown> },
      },
      ...(yedekVar(istek.modelSnapshot)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });

    if (yanit.stop_reason === "refusal") {
      throw new Error(`Anthropic reddetti (${yanit.stop_details?.category ?? "kategori yok"}).`);
    }
    if (yanit.stop_reason === "max_tokens") {
      throw new Error("Anthropic yanıtı token sınırında kesildi; çıktı eksik.");
    }
    const metin = yanit.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return {
      metin,
      girdiToken: yanit.usage.input_tokens,
      ciktiToken: yanit.usage.output_tokens,
      model: yanit.model,
    };
  },
});

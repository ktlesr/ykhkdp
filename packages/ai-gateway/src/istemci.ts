import type { ModelCevabi, ModelIstegi, ModelIstemcisi } from "./gateway.ts";

/**
 * İki istemci:
 *
 *  - `cevrimdisiIstemci` — API anahtarı olmadan çalışır. Kaynak paketinden
 *    deterministik, kaynağa bağlı çıktı üretir. Geliştirme ve eval için.
 *  - `openAiIstemci`     — OPENAI_API_KEY varsa Responses API + Structured Outputs.
 *
 * Gateway ikisini de aynı doğrulama zincirinden geçirir; "çevrimdışı" mod
 * güvenlik kontrollerini gevşetmez.
 */

export function istemciSec(): ModelIstemcisi {
  return process.env.OPENAI_API_KEY ? openAiIstemci() : cevrimdisiIstemci();
}

/** Kaynak bloğundaki evidence_id'leri ve cümleleri kullanarak çıktı kurar. */
export const cevrimdisiIstemci = (): ModelIstemcisi => ({
  ad: "cevrimdisi",
  async cagir(istek: ModelIstegi): Promise<ModelCevabi> {
    const ids = [...istek.kullanici.matchAll(/evidence_id="([^"]+)"/g)].map((m) => m[1]);
    const icerikler = [...istek.kullanici.matchAll(/<icerik guvenilir="hayir">([\s\S]*?)<\/icerik>/g)].map((m) =>
      m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"),
    );

    const metin = JSON.stringify(uret(istek.semaAdi, ids, icerikler));
    return {
      metin,
      girdiToken: Math.ceil((istek.sistem.length + istek.kullanici.length) / 4),
      ciktiToken: Math.ceil(metin.length / 4),
    };
  },
});

function ilkCumle(metin: string): string {
  const c = metin.split(/(?<=[.!?])\s/)[0]?.trim() ?? metin.trim();
  return c.length > 380 ? `${c.slice(0, 377)}...` : c;
}

function uret(ad: ModelIstegi["semaAdi"], ids: string[], icerikler: string[]): unknown {
  switch (ad) {
    case "iddia_cikarimi":
      return {
        iddialar: ids.slice(0, 3).map((id, i) => ({
          metin: ilkCumle(icerikler[i] ?? icerikler[0] ?? "Kaynakta belirtilen bulgu."),
          evidence_ids: [id],
          alinti: null,
          guven: "orta",
        })),
        eksik_veri: ids.length ? [] : ["Kaynak paketi boş; iddia çıkarılamadı."],
      };
    case "nace_onerisi":
      return {
        kod: "13.10",
        aciklama: "Tekstil elyafı hazırlama ve bükme",
        guven: "dusuk",
        gerekce: "Çevrimdışı istemci sabit öneri döndürür; kullanıcı onayı zorunludur.",
      };
    case "mukerrerlik":
      return { benzer: [] };
    case "gerekce_metni":
      return {
        metin:
          "Karar, yalnızca uzman onaylı kanıta dayandırılmıştır. " +
          (icerikler[0] ? ilkCumle(icerikler[0]) : "Kaynak paketindeki kayıtlar değerlendirilmiştir."),
        evidence_ids: ids.slice(0, 3),
      };
  }
}

/** OpenAI Responses API + Structured Outputs. */
export const openAiIstemci = (): ModelIstemcisi => ({
  ad: "openai",
  async cagir(istek: ModelIstegi): Promise<ModelCevabi> {
    const anahtar = process.env.OPENAI_API_KEY;
    if (!anahtar) throw new Error("OPENAI_API_KEY tanımlı değil.");

    const yanit = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${anahtar}` },
      body: JSON.stringify({
        model: istek.modelSnapshot,
        input: [
          { role: "system", content: istek.sistem },
          { role: "user", content: istek.kullanici },
        ],
        text: {
          format: {
            type: "json_schema",
            name: istek.semaAdi,
            strict: true,
            schema: istek.jsonSema,
          },
        },
      }),
    });

    if (!yanit.ok) throw new Error(`OpenAI ${yanit.status}: ${await yanit.text()}`);
    const j = (await yanit.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const metin = j.output_text ?? j.output?.[0]?.content?.[0]?.text ?? "";
    return {
      metin,
      girdiToken: j.usage?.input_tokens ?? 0,
      ciktiToken: j.usage?.output_tokens ?? 0,
    };
  },
});

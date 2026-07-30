import type { ModelCevabi, ModelIstegi, ModelIstemcisi } from "./gateway.ts";

/**
 * İki istemci:
 *  - `cevrimdisiIstemci` — API anahtarı olmadan çalışır; belgelerden BİREBİR
 *    alıntı çıkarır, uydurmaz. Geliştirme ve eval için.
 *  - `openAiIstemci` — OPENAI_API_KEY varsa Responses API + Structured Outputs.
 *
 * Gateway ikisini de aynı doğrulama zincirinden geçirir; çevrimdışı mod
 * hiçbir kontrolü gevşetmez.
 */

export function istemciSec(): ModelIstemcisi {
  return process.env.OPENAI_API_KEY ? openAiIstemci() : cevrimdisiIstemci();
}

const KRITERLER = [
  "plan_uyumu", "yerel_potansiyel", "pazar_talep", "deger_zinciri",
  "istihdam_katma_deger", "uygulanabilirlik", "yatirimci_ilgisi", "surdurulebilirlik",
] as const;

/** `id` pakete yerel numaradır — prompt bloğunda yazan değer. */
function belgeleriCoz(kullanici: string): Array<{ id: number; ad: string; metin: string }> {
  const out: Array<{ id: number; ad: string; metin: string }> = [];
  for (const m of kullanici.matchAll(
    /<belge id="(\d+)">\s*<kunye>([\s\S]*?)<\/kunye>\s*<icerik guvenilir="hayir">([\s\S]*?)<\/icerik>/g,
  )) {
    out.push({ id: Number(m[1]), ad: coz(m[2]).split(" · ")[0], metin: coz(m[3]) });
  }
  return out;
}

function coz(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Metinden anahtar kelimeye en yakın cümleyi birebir çıkarır. */
function cumleBul(metin: string, anahtarlar: string[]): string | null {
  const cumleler = metin.split(/(?<=[.!?])\s+/).filter((c) => c.length >= 20 && c.length <= 380);
  const puanla = (c: string) => anahtarlar.filter((a) => c.toLocaleLowerCase("tr-TR").includes(a)).length;
  const en = cumleler.map((c) => ({ c, p: puanla(c) })).sort((a, b) => b.p - a.p)[0];
  return en && en.p > 0 ? en.c.trim() : (cumleler[0]?.trim() ?? null);
}

export const cevrimdisiIstemci = (): ModelIstemcisi => ({
  ad: "cevrimdisi",
  async cagir(istek: ModelIstegi): Promise<ModelCevabi> {
    const metin = JSON.stringify(uret(istek));
    return {
      metin,
      girdiToken: Math.ceil((istek.sistem.length + istek.kullanici.length) / 4),
      ciktiToken: Math.ceil(metin.length / 4),
    };
  },
});

function uret(istek: ModelIstegi): unknown {
  const gorev = istek.kullanici.match(/<gorev>\n([\s\S]*?)\n<\/gorev>/)?.[1] ?? "";

  if (istek.semaAdi === "nace_onerisi") {
    const adaylar = [...istek.kullanici.matchAll(/<kod deger="([^"]+)">([\s\S]*?)<\/kod>/g)].map((m) => ({
      kod: m[1],
      tanim: coz(m[2]),
    }));
    const kelimeler = gorev.toLocaleLowerCase("tr-TR").split(/\W+/).filter((w) => w.length > 4);
    const skor = (t: string) => kelimeler.filter((w) => t.toLocaleLowerCase("tr-TR").includes(w)).length;
    const sirali = [...adaylar].sort((a, b) => skor(b.tanim) - skor(a.tanim));
    return {
      adaylar: sirali.slice(0, 2).map((a, i) => ({
        kod: a.kod,
        gerekce: `Öneri metni “${a.tanim.slice(0, 80)}” tanımıyla örtüşüyor.`,
        guven: i === 0 && skor(a.tanim) > 1 ? "orta" : "dusuk",
      })),
    };
  }

  if (istek.semaAdi === "karsi_gorus") {
    // ponytail: çevrimdışı karşı görüş tek tipli ve tek alıntılı. Amaç zinciri
    // çalıştırmak; gerçek itiraz OPENAI_API_KEY ile üretilir.
    const bl = belgeleriCoz(istek.kullanici);
    const ilk = bl[0];
    const c = ilk ? cumleBul(ilk.metin, []) : null;
    if (!ilk || !c) return { gorusler: [], alintilar: [] };
    return {
      gorusler: [
        {
          tur: "farkli_oncelik",
          iddia:
            "Çevrimdışı istemci: belge bu alanda farklı bir öncelik tanımlıyor olabilir; " +
            "gerçek itiraz için OPENAI_API_KEY tanımlanmalıdır.",
          alinti_no: [1],
        },
      ],
      alintilar: [{ no: 1, belge_id: ilk.id, alinti: c }],
    };
  }

  // degerlendirme
  const belgeler = belgeleriCoz(istek.kullanici);
  const gerekceMetni = gorev.match(/Neden burada \(yatırımcının gerekçesi\): ([\s\S]*)$/)?.[1] ?? "";
  const anahtarlar = gerekceMetni
    .toLocaleLowerCase("tr-TR")
    .split(/\W+/)
    .filter((w) => w.length > 5)
    .slice(0, 8);

  const alintilar: Array<{ no: number; belge_id: number; alinti: string }> = [];
  for (const b of belgeler.slice(0, 3)) {
    const c = cumleBul(b.metin, anahtarlar);
    if (c) alintilar.push({ no: alintilar.length + 1, belge_id: b.id, alinti: c });
  }

  // ponytail: çevrimdışı istemci deterministik taban puan üretir; gerçek
  // değerlendirme OPENAI_API_KEY ile yapılır. Amaç zinciri çalıştırmak.
  const taban = 55 + Math.min(20, alintilar.length * 7);
  return {
    puanlar: KRITERLER.map((k, i) => ({
      kriter: k,
      puan: Math.max(0, Math.min(100, taban + ((i * 7) % 13) - 6)),
      not: "Çevrimdışı istemci: belgelerdeki eşleşmeye göre taban puan.",
      // Bulunan alıntılar kriterlere sırayla dağıtılır; kalanlar dayanaksız kalır.
      alinti_no: i < alintilar.length ? [alintilar[i].no] : [],
    })),
    // Gerekçede SAYI YOK: doğrulayıcı belgede geçmeyen her sayısal ifadeyi
    // reddeder ve kendi çıktımızı kendimiz reddettirmiş oluruz.
    gerekce: alintilar.length
      ? "Çevrimdışı değerlendirme. Öneri, üst ölçekli belgelerde tanımlı önceliklerle " +
        "eşleşen ifadeler içeriyor. Gerçek puanlama için OPENAI_API_KEY tanımlanmalıdır."
      : "Çevrimdışı değerlendirme. Belgelerde öneriyle eşleşen ifade bulunamadı; " +
        "dayanak puanı sıfır kalıyor. Gerçek puanlama için OPENAI_API_KEY tanımlanmalıdır.",
    alintilar,
    eksik_veri: alintilar.length ? [] : ["Belgelerde öneriyle eşleşen ifade bulunamadı."],
  };
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
        text: { format: { type: "json_schema", name: istek.semaAdi, strict: true, schema: istek.jsonSema } },
      }),
    });
    if (!yanit.ok) throw new Error(`OpenAI ${yanit.status}: ${await yanit.text()}`);

    const j = (await yanit.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    return {
      metin: j.output_text ?? j.output?.[0]?.content?.[0]?.text ?? "",
      girdiToken: j.usage?.input_tokens ?? 0,
      ciktiToken: j.usage?.output_tokens ?? 0,
    };
  },
});

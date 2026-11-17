import { anthropicIstemci } from "./anthropic-istemci.ts";
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

/**
 * İstemci seçimi. Sağlayıcı verilirse o (yönetici ayarı); verilmezse
 * ortamdaki anahtara göre: OpenAI anahtarı varsa OpenAI, yoksa çevrimdışı.
 * Seçilen sağlayıcının anahtarı yoksa çağrı anında açık hata verir —
 * sessizce başka sağlayıcıya düşmek künyeyi yalanlardı.
 */
export function istemciSec(saglayici?: "openai" | "anthropic" | "cevrimdisi"): ModelIstemcisi {
  if (saglayici === "anthropic") return anthropicIstemci(eforSec);
  if (saglayici === "openai") return openAiIstemci();
  if (saglayici === "cevrimdisi") return cevrimdisiIstemci();
  // Ortamda Claude pinlendiyse (eval, sınama) sağlayıcı ondan çıkar.
  if (process.env.YKH_MODEL_SNAPSHOT?.startsWith("claude-")) return anthropicIstemci(eforSec);
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

  if (istek.semaAdi === "kanit_cikarimi") {
    // ponytail: çevrimdışı tarama her parçadan ilk üç uygun cümleyi alır.
    // Amaç zinciri çalıştırmak; gerçek çıkarım OPENAI_API_KEY ile yapılır.
    const kanitlar = belgeleriCoz(istek.kullanici).flatMap((b) =>
      b.metin
        .split(/(?<=[.!?])\s+/)
        .map((c) => c.trim())
        .filter((c) => c.length >= 30 && c.length <= 380 && !/…|\.{3,}/.test(c))
        .slice(0, 3)
        .flatMap((c) => {
          const konu = c.split(/\s+/).filter((w) => !/\d/.test(w)).slice(0, 5).join(" ");
          return konu.length >= 3 ? [{ belge_id: b.id, tur: "firsat", konu, alinti: c }] : [];
        }),
    );
    return { kanitlar: kanitlar.slice(0, 12) };
  }

  if (istek.semaAdi === "aday_kesfi") {
    // İki kanıt → bir aday; biri yerel. Gerekçe kanıtların kendi cümleleridir:
    // çevrimdışı istemci de gerekçe kuralından geçmek zorunda.
    const kayitlar = [
      ...istek.kullanici.matchAll(
        /<kanit no="(\d+)" yerel="(evet|hayir)"[^>]*>[\s\S]*?<konu>([\s\S]*?)<\/konu>\s*<icerik guvenilir="hayir">([\s\S]*?)<\/icerik>/g,
      ),
    ].map((m) => ({ no: Number(m[1]), yerel: m[2] === "evet", konu: coz(m[3]), metin: coz(m[4]) }));
    const adaylar = kayitlar
      .filter((k) => k.yerel)
      .slice(0, 3)
      .flatMap((y) => {
        const es = kayitlar.find((k) => k.no !== y.no);
        if (!es) return [];
        const gerekce = `${y.metin} ${es.metin}`.slice(0, 1200);
        return gerekce.length >= 40 ? [{ baslik: `${y.konu} yatırımı`.slice(0, 140).padEnd(8, "."), gerekce, kanit_no: [y.no, es.no] }] : [];
      });
    // Yürürlükteki ilk resmî konuyu OLDUĞU GİBİ yeniden önerir: "resmî konuyu
    // destekle" yolu çevrimdışı da çalışsın (kopya açılmamalı).
    const resmi = gorev.match(/Yürürlükteki resmî liste: (.+)/)?.[1]?.split(" | ")[0]?.trim();
    if (resmi && adaylar[0]) adaylar.push({ ...adaylar[0], baslik: resmi.slice(0, 140) });
    return { adaylar };
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

    const govde = {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${anahtar}` },
      body: JSON.stringify({
        model: istek.modelSnapshot,
        input: [
          { role: "system", content: istek.sistem },
          { role: "user", content: istek.kullanici },
        ],
        text: { format: { type: "json_schema", name: istek.semaAdi, strict: true, schema: istek.jsonSema } },
        // Akıl yürüten modeller (gpt-5.x, o-serisi) için düzey. Verilmezse model
        // en düşük düzeyde kalıp prompt'taki yerellik tavanını koşudan koşuya
        // farklı uyguluyordu (eval: yersiz gerekçe 39–78). gpt-4.1 bu alanı kabul
        // etmez, o yüzden yalnızca akıl yürüten modellere gönderilir.
        ...(/^(gpt-5|o\d)/.test(istek.modelSnapshot)
          ? { reasoning: { effort: eforSec(istek.semaAdi) } }
          : {}),
      }),
      // Askıda kalan çağrı worker'ı süresiz durdurmasın. Zaman aşımı "model"
      // aşaması hatasıdır: öneri `degerlendiriliyor` kalır, deneme sayılır.
    };
    const yanit = await yenidenDene(() =>
      fetch("https://api.openai.com/v1/responses", {
        ...govde,
        signal: AbortSignal.timeout(Number(process.env.YKH_MODEL_ZAMAN_ASIMI_MS) || 180_000),
      }),
    );
    if (!yanit.ok) throw new Error(`OpenAI ${yanit.status}: ${await yanit.text()}`);

    const j = (await yanit.json()) as {
      output_text?: string;
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    // Akıl yürüten modellerde (gpt-5.x) ilk çıktı öğesi `reasoning` olabilir;
    // metin `message` öğesinin `output_text` içeriğindedir. İlk öğeye bakmak
    // boş metin → "geçerli JSON değil" reddi üretirdi.
    const mesaj = j.output
      ?.filter((o) => o.type === "message")
      .flatMap((o) => o.content ?? [])
      .find((c) => c.type === "output_text")?.text;
    return {
      metin: j.output_text ?? mesaj ?? "",
      girdiToken: j.usage?.input_tokens ?? 0,
      ciktiToken: j.usage?.output_tokens ?? 0,
    };
  },
});

/**
 * Akıl yürütme düzeyi çağrı türüne göre. Kanıt TARAMASI metinden pasaj seçer;
 * doğruluğu modelin muhakemesi değil mekanik doğrulayıcı güvenceler (pasaj
 * kaynakta birebir yoksa düşer). Orada "medium" süre ve token harcıyordu
 * (ölçüldü: çağrı başına ~3.600 çıktı tokenı, 17–34 sn). Puanlama ve aday
 * üretimi yargı ister; onlar `YKH_MODEL_EFOR` (varsayılan medium) ile kalır.
 */
export function eforSec(sema: string): string {
  if (sema === "kanit_cikarimi") return process.env.YKH_TARAMA_EFOR || "low";
  return process.env.YKH_MODEL_EFOR || "medium";
}

/**
 * Geçici hatalarda yeniden dener: 429 (hız sınırı), 5xx, ağ hatası.
 *
 * Tarama 6 eşzamanlı çağrı yapıyor; hız sınırına takılan çağrı yeniden
 * denenmeden "parça taranamadı" sayılıyordu (canlıda 922 parçanın 24'ü).
 * `retry-after` varsa ona uyulur. Kalıcı hata (400, 401) hemen döner.
 */
async function yenidenDene(cagri: () => Promise<Response>, deneme = 4): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const r = await cagri();
      if (i >= deneme || !(r.status === 429 || r.status >= 500)) return r;
      const bekle = Number(r.headers.get("retry-after")) * 1000 || 2000 * 2 ** (i - 1);
      await r.body?.cancel();
      await new Promise((ok) => setTimeout(ok, Math.min(bekle, 30_000)));
    } catch (e) {
      if (i >= deneme) throw e;
      await new Promise((ok) => setTimeout(ok, 2000 * 2 ** (i - 1)));
    }
  }
}

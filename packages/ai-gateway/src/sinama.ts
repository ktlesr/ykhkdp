/**
 * AI bağlantı sınaması: `pnpm ai:test`
 *
 * Gerçek bir çağrı yapar ve zincirin her katmanını ayrı ayrı raporlar:
 * model erişimi → şema → alıntı doğrulama → dayanak puanı.
 * Hiçbir şeyi veritabanına yazmaz.
 */

import { degerlendir, naceOner } from "./gateway.ts";
import { cevrimdisiIstemci, openAiIstemci } from "./istemci.ts";
import { CEVRIMDISI_KUNYE, modelSnapshot, VARSAYILAN_OPENAI_MODEL } from "./index.ts";
import { paketKur } from "@ykh/evidence-validation";

const BELGE_METNI =
  "TR33 Bölgesi'nde tekstil ve hazır giyim, deri, seramik ve gıda işleme öncelikli imalat " +
  "sektörleridir. Bölgede tekstil geri dönüşümü ve teknik tekstil, katma değeri yükseltecek " +
  "dönüşüm alanları olarak tanımlanmıştır. Uşak'ta deri ve tekstil ihtisas organize sanayi " +
  "bölgeleri altyapısı mevcuttur. Tarımsal ürünlerde soğuk zincir ve kurutma altyapısı " +
  "eksikliği bölgesel bir darboğazdır.";

const BELGELER = [
  { id: 1, ad: "TR33 Bölge Planı 2024-2028", tur: "bolge_plani", yil: "2024", metin: BELGE_METNI },
];

const NACE_ADAYLAR = [
  { kod: "13.10", tanim: "Tekstil elyafının hazırlanması ve bükülmesi" },
  { kod: "13.95", tanim: "Dokusuz kumaşların ve dokusuz kumaştan yapılan ürünlerin imalatı" },
  { kod: "10.39", tanim: "Meyve ve sebzelerin diğer şekillerde işlenmesi ve saklanması" },
  { kod: "38.32", tanim: "Tasnif edilmiş materyallerin geri kazanımı" },
];

const ONERI = {
  baslik: "Tekstil kırpıklarından geri dönüştürülmüş elyaf üretimi",
  gerekce:
    "Uşak'ta konfeksiyon atölyelerinden çıkan kırpık atığı il içinde toplanıyor ve bugün " +
    "ağırlıklı olarak il dışına ham olarak satılıyor. Tekstil ihtisas OSB altyapısı ve " +
    "nitelikli işgücü ilde mevcut; aynı yatırım kırpık arzı olmayan bir ilde bu maliyetle yapılamaz.",
  il: "Uşak",
  ilce: "Merkez",
};

function satir(ad: string, deger: string) {
  console.log(`  ${ad.padEnd(22)} ${deger}`);
}

const anahtarVar = Boolean(process.env.OPENAI_API_KEY?.trim());
const model = modelSnapshot();
const istemci = anahtarVar ? openAiIstemci() : cevrimdisiIstemci();

console.log("\n── AI sınaması ─────────────────────────────────────────────");
satir("OPENAI_API_KEY", anahtarVar ? "var" : "YOK → çevrimdışı istemci");
satir("istemci", istemci.ad);
satir("model snapshot", model);
if (anahtarVar && model === CEVRIMDISI_KUNYE) {
  console.log("\n  UYARI: anahtar var ama snapshot çevrimdışı künyesi. YKH_MODEL_SNAPSHOT'ı temizleyin.");
}
if (!anahtarVar) {
  console.log(
    "\n  .env içindeki OPENAI_API_KEY boş. Zincir çalışır ama puanlar kabadır.\n" +
      "  Anahtarı girip tekrar çalıştırın.",
  );
}

let hata = false;

// ── 1. NACE önerisi ────────────────────────────────────────────────────────
console.log("\n1) NACE önerisi — aday listesinden seçim");
const n = await naceOner(istemci, model, {
  baslik: ONERI.baslik,
  gerekce: ONERI.gerekce,
  adaylar: NACE_ADAYLAR,
});
if (!n.ok) {
  hata = true;
  satir("SONUÇ", `BAŞARISIZ (${n.asama})`);
  for (const h of n.hatalar.slice(0, 3)) satir("", h);
  if (n.asama === "model" && anahtarVar) {
    console.log(
      `\n  Model erişimi başarısız. Muhtemel nedenler: anahtar geçersiz, kota yok,\n` +
        `  ya da "${model}" bu hesapta yok. .env'de YKH_MODEL_SNAPSHOT'ı deneyin\n` +
        `  (varsayılan ${VARSAYILAN_OPENAI_MODEL}; alternatif gpt-4o-2024-11-20).`,
    );
  }
} else {
  const s = n.veri.adaylar[0];
  satir("seçilen kod", `${s.kod} · güven: ${s.guven}`);
  satir("gerekçe", s.gerekce.slice(0, 70));
  satir("token", `${n.maliyet.girdiToken} girdi / ${n.maliyet.ciktiToken} çıktı`);
  satir("SONUÇ", "geçti");
}

// ── 2. Değerlendirme ───────────────────────────────────────────────────────
console.log("\n2) Değerlendirme — 8 kriter + belge alıntısı + dayanak");
const paket = paketKur("sinama", BELGELER.map((b) => ({ id: b.id, ad: b.ad, metin: b.metin })));
const d = await degerlendir(istemci, model, { ...ONERI, nace: n.ok ? n.veri.adaylar[0].kod : null, belgeler: BELGELER, paket });

if (!d.ok) {
  hata = true;
  satir("SONUÇ", `BAŞARISIZ (${d.asama})`);
  for (const h of d.hatalar.slice(0, 4)) satir("", h);
  if (d.asama === "dayanak") {
    console.log(
      "\n  Doğrulayıcı reddetti — bu bir GÜVENLİK BAŞARISI olabilir: model uydurulmuş\n" +
        "  alıntı veya kaynaksız sayı ürettiyse reddedilmesi doğrudur. Yukarıdaki\n" +
        "  mesajlar hangisi olduğunu söyler.",
    );
  }
} else {
  const p = d.veri.puanlar;
  const yerel = ["yerel_potansiyel", "deger_zinciri", "uygulanabilirlik"];
  const yerelOrt = Math.round(
    p.filter((x) => yerel.includes(x.kriter)).reduce((t, x) => t + x.puan, 0) / 3,
  );
  satir("kriter sayısı", `${p.length}/8`);
  satir("neden burada ort.", `${yerelOrt}/100 (en ağır grup, %44)`);
  satir("dayanak", `${d.dayanak}/100 · eşik 55 → ${d.dayanak >= 55 ? "slot doldurabilir" : "SLOT DOLDURAMAZ"}`);
  satir("alıntı", `${d.veri.alintilar.length} adet, belgede birebir doğrulandı`);
  satir("eksik veri", d.veri.eksik_veri.length ? d.veri.eksik_veri.join("; ").slice(0, 60) : "yok");
  satir("token", `${d.maliyet.girdiToken} girdi / ${d.maliyet.ciktiToken} çıktı`);
  satir("prompt sürümü", d.promptSurum);
  satir("SONUÇ", "geçti");
  console.log(`\n  Gerekçe: ${d.veri.gerekce.slice(0, 180)}${d.veri.gerekce.length > 180 ? "…" : ""}`);
  if (d.veri.alintilar.length) {
    console.log(`  Alıntı:  “${d.veri.alintilar[0].alinti.slice(0, 150)}”`);
  }
}

console.log(
  `\n── ${hata ? "SINAMA BAŞARISIZ" : "SINAMA GEÇTİ"} ─────────────────────────────────────\n`,
);
process.exitCode = hata ? 1 : 0;

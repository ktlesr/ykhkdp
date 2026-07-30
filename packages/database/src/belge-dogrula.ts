import { readFile } from "node:fs/promises";
import { parcala, yolCoz } from "./belge-yukle.ts";

/**
 * Belge kalitesi denetimi — `pnpm belge:dogrula <dosya>`
 *
 * Yeni bir plan belgesini yüklemeden ÖNCE çalıştırılır. Amaç tek soruyu
 * cevaplamak: bu metinde birebir alıntılanabilir cümle var mı?
 *
 * Ölçütler tahmin değil, ölçüm. İki kolonlu PDF'ten kolon farkındalığı olmadan
 * çıkarılan 12KP ile yapılan tüm değerlendirmeler reddedildi; yapı farkındalıklı
 * çıkarımla aynı belge çalıştı. Aradaki fark rakamlarda görünüyor:
 *
 *   satır uzunluğu    kötü ~60–72    iyi ~160–220
 *   sarkan satır       kötü yüksek   iyi düşük
 *
 * Kötü çıkarımda her fiziksel PDF satırı ayrı satır olarak geliyor; iyi
 * çıkarımda paragraf tek satırda bütün duruyor.
 *
 * ponytail: eşikler bu üç belgeden kalibre edildi, evrensel değil. Sınırda
 * kalan bir belge için karar `parcala()` çıktısına bakılarak elle verilir —
 * komut örnek parça da basıyor.
 */

export type Denetim = {
  satir: number;
  ortalamaUzunluk: number;
  /** cümle ortasında biten satır oranı — PDF satır kırpması göstergesi */
  sarkanOrani: number;
  /** satır sonu tirelemesi sayısı */
  tireleme: number;
  sayfaIsareti: number;
  parca: number;
  cipa: Record<string, number>;
  /** parça metinlerinde 40+ karakterlik nokta ile biten cümle oranı */
  cumleOrani: number;
  gecti: boolean;
  uyarilar: string[];
};

const ORTALAMA_ESIK = 110;
const SARKAN_ESIK = 0.35;
const CUMLE_ESIK = 0.5;

export async function belgeDenetle(yol: string): Promise<Denetim> {
  const ham = (await readFile(yolCoz(yol), "utf8")).replace(/\r\n?/g, "\n");
  const satirlar = ham.split("\n");
  const dolu = satirlar.filter((s) => s.trim().length > 0);

  const ortalamaUzunluk = dolu.length
    ? Math.round(dolu.reduce((t, s) => t + s.trim().length, 0) / dolu.length)
    : 0;

  // Sarkan satır: noktalama ile bitmiyor ve sonraki satır küçük harfle başlıyor.
  let sarkan = 0;
  for (const [i, s] of dolu.entries()) {
    const t = s.trim();
    const sonraki = dolu[i + 1]?.trim() ?? "";
    if (!/[.!?:;»"']$/.test(t) && /^\p{Ll}/u.test(sonraki)) sarkan++;
  }
  const sarkanOrani = dolu.length ? sarkan / dolu.length : 0;

  const tireleme = dolu.filter((s) => /\p{L}-$/u.test(s.trim())).length;
  const sayfaIsareti = satirlar.filter((s) => /^\s*\d{1,4}\s*\/\s*\d{1,4}\s*$/.test(s)).length;

  const parcalar = parcala(ham);
  const cipa: Record<string, number> = {};
  for (const p of parcalar) {
    const tur = p.bolum.startsWith("s. ")
      ? "sayfa"
      : p.bolum.startsWith("madde ")
        ? "madde"
        : p.bolum.startsWith("parça ")
          ? "yok (sıralı numara)"
          : "başlık";
    cipa[tur] = (cipa[tur] ?? 0) + 1;
  }

  // Alıntılanabilirlik vekili: parça metninde düzgün biten uzun cümle oranı.
  const cumleler = parcalar.flatMap((p) => p.metin.split(/(?<=[.!?])\s+/));
  const saglam = cumleler.filter((c) => c.trim().length >= 40 && /[.!?]$/.test(c.trim()));
  const cumleOrani = cumleler.length ? saglam.length / cumleler.length : 0;

  const uyarilar: string[] = [];
  if (ortalamaUzunluk < ORTALAMA_ESIK) {
    uyarilar.push(
      `Ortalama satır ${ortalamaUzunluk} karakter (eşik ${ORTALAMA_ESIK}). Paragraflar satır ` +
        "satır kırpılmış görünüyor — yapı farkındalıklı çıkarım gerekiyor.",
    );
  }
  if (sarkanOrani > SARKAN_ESIK) {
    uyarilar.push(
      `Satırların %${Math.round(sarkanOrani * 100)}'i cümle ortasında bitiyor ` +
        `(eşik %${Math.round(SARKAN_ESIK * 100)}).`,
    );
  }
  if (cumleOrani < CUMLE_ESIK) {
    uyarilar.push(
      `Parçalarda düzgün biten cümle oranı %${Math.round(cumleOrani * 100)} ` +
        `(eşik %${Math.round(CUMLE_ESIK * 100)}). Alıntı doğrulaması bu metinde büyük olasılıkla düşer.`,
    );
  }
  if (!parcalar.length) uyarilar.push("Ayrıştırılabilir metin bulunamadı.");
  if (cipa["yok (sıralı numara)"] === parcalar.length && parcalar.length) {
    // Uyarı, hata değil: çıpasız da yüklenir ama atıf denetlenebilir olmaz.
    uyarilar.push(
      "Hiçbir parçada sayfa/madde/başlık çıpası yok; atıflar “parça n/m” olur ve " +
        "belgede elle doğrulanamaz.",
    );
  }

  return {
    satir: dolu.length,
    ortalamaUzunluk,
    sarkanOrani,
    tireleme,
    sayfaIsareti,
    parca: parcalar.length,
    cipa,
    cumleOrani,
    gecti: !uyarilar.length,
    uyarilar,
  };
}

export function denetimiYaz(yol: string, d: Denetim, ornek: string | null): void {
  const satir = (ad: string, deger: string) => console.log(`  ${ad.padEnd(26)} ${deger}`);
  console.log(`\n${yol}`);
  satir("dolu satır", String(d.satir));
  satir("ortalama satır uzunluğu", `${d.ortalamaUzunluk} karakter`);
  satir("cümle ortasında biten", `%${Math.round(d.sarkanOrani * 100)}`);
  satir("satır sonu tirelemesi", `${d.tireleme} satır`);
  satir("sayfa işareti", d.sayfaIsareti ? `${d.sayfaIsareti} adet` : "yok");
  satir("parça", String(d.parca));
  satir("atıf çıpası", Object.entries(d.cipa).map(([k, v]) => `${k}: ${v}`).join(" · ") || "yok");
  satir("düzgün cümle oranı", `%${Math.round(d.cumleOrani * 100)}`);
  satir("SONUÇ", d.gecti ? "yüklemeye uygun" : "UYGUN DEĞİL");
  for (const u of d.uyarilar) console.log(`  · ${u}`);
  if (ornek) console.log(`\n  örnek parça: ${JSON.stringify(ornek.slice(0, 240))}`);
}

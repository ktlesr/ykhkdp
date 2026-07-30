import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sahip } from "./baglanti.ts";

/** Depo kökü — belge yolları buna göre çözülür, cwd'ye bağlı kalmaz. */
const KOK = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/**
 * Üst ölçekli belge yükleyici.
 *
 * Gerçek plan belgeleri 400 KB – 1 MB düz metin. Modele tek parça verilemez;
 * verilse bile prompt kırpması yüzünden yalnızca kapak ve içindekiler görünür.
 * Bu yüzden belge PARÇALARA bölünüp her parça ayrı `belge` satırı olarak
 * yazılır: tam metin araması ilgili parçayı bulur, alıntı doğrulaması o
 * parçanın metninde birebir aranır ve atıf "s. 47" gibi bulunabilir bir yere
 * işaret eder.
 *
 * ponytail: gömme (embedding) yok, semantik bölüm çıkarımı yok. Paragraf
 * sınırında sabit boyutlu parça + tsvector, bu belge sayısı ve boyutu için
 * yeterli. Anlamsal arama ölçülebilir kazanç gösterirse `belge` tablosuna
 * `embedding vector(1536)` eklenir ve yalnızca retrieval sorgusu değişir.
 */

export type YuklemeGirdisi = {
  dosya: string;
  ad: string;
  tur: "bolge_plani" | "kalkinma_plani" | "ovp" | "strateji" | "il_raporu" | "diger";
  yil?: string | null;
  ajansKod?: string | null;
  ilKod?: string | null;
  /** hedef parça uzunluğu (karakter) */
  parcaBoyu?: number;
};

export type Parca = { bolum: string; metin: string };

const SAYFA = /^\s*(\d{1,4})\s*\/\s*\d{1,4}\s*$/;
const ICINDEKILER = /\.{4,}\s*\d+\s*$/;
const BASLIK = /^\s{0,3}#{1,6}\s+\S/;
/** "449.", "881.4." gibi numaralı madde başı — 12. Kalkınma Planı bu biçimde. */
const MADDE = /(?:^|\n)(\d{1,4}(?:\.\d{1,3})*)\.\s+\p{Lu}/gu;

/**
 * Parça içindeki numaralı madde aralığı — atıf çıpası olarak sayfadan iyidir.
 *
 * "parça 226/252" kimsenin bulamayacağı bir adres; "madde 881.4" belgede
 * doğrudan aranabilir. Yalnızca madde numarası taşıyan belgelerde döner.
 */
function maddeAraligi(metin: string): string | null {
  const no = [...metin.matchAll(MADDE)].map((m) => m[1]);
  if (no.length < 2) return no.length ? `madde ${no[0]}` : null;
  return `madde ${no[0]}–${no[no.length - 1]}`;
}

/**
 * Düz metni paragraf sınırında parçalara böler.
 *
 * - CRLF normalize edilir, içindekiler satırları (noktalı dolgu) atılır.
 * - `N / M` sayfa işaretleri metinden çıkarılır ama parça etiketinde tutulur.
 * - Parça hedef boyuna ulaşınca boş satırda kapanır; tek paragraf hedeften
 *   büyükse kendi başına parça olur.
 */
/**
 * Tekrarlayan sayfa mobilyasını bulur: her sayfada yinelenen üst/alt bilgiler ve
 * PDF çıkarımının ters çevirdiği kenar başlıkları
 * (ör. "LESEGLÖB" = "BÖLGESEL" tersi, bgus belgesinde 232 kez).
 *
 * Belgeye özgü liste tutmuyoruz: kısa VE çok tekrar eden satır, tanım gereği
 * içerik değil mobilyadır.
 */
function mobilya(satirlar: readonly string[], enAzTekrar = 5, enFazlaUzunluk = 60): Set<string> {
  const sayim = new Map<string, number>();
  for (const s of satirlar) {
    const t = s.trim();
    if (!t || t.length > enFazlaUzunluk) continue;
    sayim.set(t, (sayim.get(t) ?? 0) + 1);
  }
  return new Set([...sayim].filter(([, n]) => n >= enAzTekrar).map(([t]) => t));
}

/**
 * Markdown süsünü atar.
 *
 * Yapı farkındalıklı PDF çıkarımı başlıkları `## **Başlık**` gibi veriyor.
 * İşaretler metinde kalırsa modelin alıntısı ya yıldızları içerir ya içermez;
 * ikisi de belgede birebir aranan metinle çakışır. Kaynakta temizliyoruz.
 */
function markdownsuz(satir: string): string {
  return satir
    .replace(/^\s{0,3}#{1,6}\s+/, "")
    .replace(/\*\*|__|(?<![\p{L}\d])[*_](?![\s*_])/gu, "")
    .trim();
}

/**
 * Satır sonu tirelemesini birleştirir: "sektörle-" + "rinin" → "sektörlerinin".
 *
 * PDF metni satır sonunda kelimeyi bölüyor. Model alıntıyı doğal haliyle
 * yazdığı için tireli metinle birebir eşleşmiyor ve alıntı düşüyor (ölçüldü:
 * bgus'ta "kimyasal ürün sektörü ile tekstil ve gıda sektörle- rinin").
 *
 * Koşul dar: tireden önce harf, sonraki satır küçük harfle başlıyor. "2024-"
 * gibi sayı tireleri ve "Türkiye-AB" gibi büyük harfli bileşikler korunur.
 */
function tirelemesiz(satirlar: readonly string[]): string {
  let sonuc = "";
  for (const satir of satirlar) {
    if (/\p{L}-$/u.test(sonuc) && /^\p{Ll}/u.test(satir)) sonuc = sonuc.slice(0, -1) + satir;
    else sonuc = sonuc ? `${sonuc} ${satir}` : satir;
  }
  return sonuc;
}

export function parcala(hamMetin: string, parcaBoyu = 2500): Parca[] {
  const hamSatirlar = hamMetin.replace(/\r\n?/g, "\n").split("\n");
  const atilacak = mobilya(hamSatirlar.map(markdownsuz));

  let sayfa: number | null = null;
  let sayfaVar = false;
  let baslik: string | null = null;
  const temiz: Array<{ satir: string; sayfa: number | null; baslik: string | null }> = [];

  for (const ham of hamSatirlar) {
    const s = markdownsuz(ham).trimEnd();
    const m = SAYFA.exec(s);
    if (m) {
      sayfa = Number(m[1]);
      sayfaVar = true;
      continue;
    }
    if (ICINDEKILER.test(s)) continue;
    if (atilacak.has(s.trim())) continue;
    // Markdown başlığı: metinde kalır, ayrıca parça etiketi için kaydedilir.
    if (BASLIK.test(ham) && s.length >= 3 && s.length <= 90) baslik = s;
    temiz.push({ satir: s, sayfa, baslik });
  }

  // Paragraflara topla
  type Paragraf = { metin: string; sayfa: number | null; baslik: string | null };
  const paragraflar: Paragraf[] = [];
  let tampon: string[] = [];
  let tamponSayfa: number | null = null;
  let tamponBaslik: string | null = null;

  const tamponuKapat = () => {
    const metin = tirelemesiz(tampon).replace(/\s+/g, " ").trim();
    if (metin.length > 30) paragraflar.push({ metin, sayfa: tamponSayfa, baslik: tamponBaslik });
    tampon = [];
  };

  for (const { satir, sayfa: sf, baslik: bs } of temiz) {
    if (!satir.trim()) {
      tamponuKapat();
      continue;
    }
    if (!tampon.length) {
      tamponSayfa = sf;
      tamponBaslik = bs;
    }
    tampon.push(satir.trim());
  }
  tamponuKapat();

  // Parçalara birleştir
  const parcalar: Parca[] = [];
  let govde: string[] = [];
  let bas: number | null = null;
  let son: number | null = null;
  let parcaBaslik: string | null = null;

  const parcayiKapat = () => {
    const metin = govde.join("\n\n").trim();
    govde = [];
    if (metin.length < 120) return;
    const sayfaEtiketi =
      sayfaVar && bas !== null ? (bas === son ? `s. ${bas}` : `s. ${bas}–${son}`) : null;
    parcalar.push({ bolum: sayfaEtiketi ?? maddeAraligi(metin) ?? parcaBaslik ?? "", metin });
    bas = null;
  };

  for (const p of paragraflar) {
    if (bas === null) bas = p.sayfa;
    if (!govde.length) parcaBaslik = p.baslik;
    son = p.sayfa;
    govde.push(p.metin);
    if (govde.join("\n\n").length >= parcaBoyu) parcayiKapat();
  }
  parcayiKapat();

  // Hiçbir çıpa bulunamayan parça için sıralı etiket.
  return parcalar.map((p, i) => ({
    ...p,
    bolum: p.bolum || `parça ${i + 1}/${parcalar.length}`,
  }));
}

/** Belgeyi parçalayıp veritabanına yazar. Aynı `ad` varsa önce siler. */
export async function belgeYukle(g: YuklemeGirdisi): Promise<{ parca: number; karakter: number }> {
  const yol = isAbsolute(g.dosya) ? g.dosya : resolve(KOK, g.dosya);
  const ham = await readFile(yol, "utf8");
  const parcalar = parcala(ham, g.parcaBoyu ?? 2500);
  if (!parcalar.length) throw new Error(`${yol}: ayrıştırılabilir metin bulunamadı.`);

  const sql = sahip();
  await sql`delete from belge where ad = ${g.ad}`;

  for (let i = 0; i < parcalar.length; i += 200) {
    const dilim = parcalar.slice(i, i + 200);
    await sql`
      insert into belge ${sql(
        dilim.map((p) => ({
          ad: g.ad,
          bolum: p.bolum,
          tur: g.tur,
          yil: g.yil ?? null,
          ajans_kod: g.ajansKod ?? null,
          il_kod: g.ilKod ?? null,
          metin: p.metin,
        })),
        "ad",
        "bolum",
        "tur",
        "yil",
        "ajans_kod",
        "il_kod",
        "metin",
      )}
    `;
  }

  return { parca: parcalar.length, karakter: parcalar.reduce((t, p) => t + p.metin.length, 0) };
}

/** `docs/` altındaki gerçek plan belgeleri — `pnpm db:belgeler` ile yüklenir. */
export const RESMI_BELGELER: YuklemeGirdisi[] = [
  {
    dosya: "docs/TR33Bolge_plani.md",
    ad: "TR33 Bölge Planı 2024-2028",
    tur: "bolge_plani",
    yil: "2024",
    ajansKod: "TR33",
  },
  {
    dosya: "docs/12KP2024-2028.md",
    ad: "On İkinci Kalkınma Planı 2024-2028",
    tur: "kalkinma_plani",
    yil: "2024",
  },
  {
    dosya: "docs/bgus2024-2028.md",
    ad: "Bölgesel Gelişme Ulusal Stratejisi 2024-2028",
    tur: "strateji",
    yil: "2024",
  },
];

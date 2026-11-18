import { createHash } from "node:crypto";
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
  /** belgenin NEYİ anlattığı (0022); verilmezse 'genel' */
  kategori?: Kategori;
};

/** Belge kategorileri — 0022 `check` kısıtıyla aynı liste. */
export const KATEGORILER = {
  genel: "Genel",
  sanayi: "Sanayi ve üretim",
  dis_ticaret: "Dış ticaret",
  maden_enerji: "Maden ve enerji",
  turizm: "Turizm",
  tarim: "Tarım ve hayvancılık",
  cografi_isaret: "Coğrafi işaret",
  tesvik: "Yatırım teşvik",
  istatistik: "İstatistik",
} as const;
export type Kategori = keyof typeof KATEGORILER;

export type Parca = { bolum: string; metin: string };

const SAYFA = /^\s*(\d{1,4})\s*\/\s*\d{1,4}\s*$/;
/** İçindekiler satırı: noktalı dolgu + sayfa numarası. Tablo boruları çevrildikten sonra bakılır. */
const ICINDEKILER = /\.{3,}\s*\d+(\s*·.*)?$/;
const BASLIK = /^\s{0,3}#{1,6}\s+\S/;
/** "449.", "881.4." gibi numaralı madde başı — 12. Kalkınma Planı bu biçimde. */
const MADDE = /(?:^|\n)(\d{1,4}(?:\.\d{1,3})*)\.\s+\p{Lu}/gu;
/** Bir belgenin "madde numaralı" sayılması için gereken en az numaralı paragraf. */
const MADDE_ESIGI = 20;

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
    // Satır içi HTML: <u>Karar Tarihi</u> gibi. Metinde kalırsa modelin alıntısı
    // etiketi atar, belgedeki metinle birebir eşleşmez ve alıntı düşer.
    .replace(/<\/?[a-zA-Z][a-zA-Z0-9]{0,9}(?:\s[^<>]{0,80})?>/g, "")
    // Tablo satırı: boruları ayırıcıya çevir. Aksi hâlde içindekiler satırları
    // boru içinde kaldığı için ICINDEKILER kalıbına yakalanmıyor.
    .replace(/^\s*\|(.*)\|\s*$/, (_, ic: string) => ic.split("|").map((h) => h.trim()).join(" · "))
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
  /**
   * Madde etiketi yalnızca MADDE NUMARALI belgede. Satır başındaki her "1.
   * Giriş" listesi madde değildir; bilgi notu gibi bir belgede "madde 1–5"
   * etiketi uydurma bir adres olurdu. Plan maddesi belgesi: en az
   * MADDE_ESIGI numaralı paragraf ve en az biri 100'ün üstünde (12. Kalkınma
   * Planı: 400'ü aşkın madde).
   */
  const maddeler = [...hamMetin.replace(/\r\n?/g, "\n").replace(/\*\*/g, "").matchAll(MADDE)].map((m) => Number(m[1].split(".")[0]));
  const maddeBelgesi = maddeler.length >= MADDE_ESIGI && Math.max(0, ...maddeler) >= 100;
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
    parcalar.push({ bolum: sayfaEtiketi ?? (maddeBelgesi ? maddeAraligi(metin) : null) ?? parcaBaslik ?? "", metin });
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

/** Göreli yolu depo köküne göre çözer — komut hangi paketten çalışırsa çalışsın. */
export function yolCoz(dosya: string): string {
  return isAbsolute(dosya) ? dosya : resolve(KOK, dosya);
}

/** Belgeyi parçalayıp veritabanına yazar. Aynı `ad` varsa önce siler. */
export async function belgeYukle(g: YuklemeGirdisi): Promise<{ parca: number; karakter: number }> {
  return metinYukle(g, await readFile(yolCoz(g.dosya), "utf8"));
}

const ozetle = (metin: string) => createHash("sha256").update(metin).digest("hex");

/** Dosyadan üretilmiş veri belgesi: içerik özeti aynıysa dokunmaz. */
async function veriYukle(g: YuklemeGirdisi): Promise<number | null> {
  const ham = await readFile(yolCoz(g.dosya), "utf8");
  const ozet = ozetle(ham);
  const [m] = await sahip()<{ kaynak_ozet: string | null }[]>`select kaynak_ozet from belge where ad = ${g.ad} limit 1`;
  if (m?.kaynak_ozet === ozet) return null;
  // Veri belgesinin yılı kaynakla birlikte ilerler (ihracat 2026 → 2027); yıl değişimi çakışma değildir.
  return (await metinYukle(g, ham, ozet, true)).parca;
}

async function metinYukle(g: YuklemeGirdisi, ham: string, ozet: string | null = null, yilSerbest = false): Promise<{ parca: number; karakter: number }> {
  const yol = g.dosya;
  const parcalar = parcala(ham, g.parcaBoyu ?? 2500);
  if (!parcalar.length) throw new Error(`${yol}: ayrıştırılabilir metin bulunamadı.`);

  // Tek transaction: ekleme ortasında hata olursa eski kaynak eksiksiz kalır.
  await sahip().begin(async (sql) => {
  await sql`select pg_advisory_xact_lock(hashtext(${"belge:" + g.ad}))`;
  // Aynı ad başka kapsamda ya da başka yılla duruyorsa sessizce silinmez.
  const [cakisan] = await sql`
    select 1 from belge where ad = ${g.ad}
      and (ajans_kod is distinct from ${g.ajansKod ?? null} or il_kod is distinct from ${g.ilKod ?? null}
           or (${!yilSerbest} and yil is distinct from ${g.yil ?? null}))
    limit 1
  `;
  if (cakisan) throw new Error(`“${g.ad}” başka bir kapsam/yılla zaten yüklü; önce o kaydı silin.`);
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
          kategori: g.kategori ?? "genel",
          kaynak_ozet: ozet,
        })),
        "kategori",
        "kaynak_ozet",
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
  });

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

/**
 * Kütüphane belgeleri — `docs/kutuphane/manifest.json`. Kalkınma
 * Kütüphanesi'nden dönüştürülmüş il ve ajans raporları.
 *
 * `belgeYukle`den farkı: VAR OLANA DOKUNMAZ. `belgeYukle` belgeyi silip
 * yeniden yazar; bunu her dağıtımda çalıştırmak parça kimliklerini değiştirir
 * ve kanıt tarama önbelleğini (yüzlerce model çağrısı) her seferinde silerdi.
 * Burada aynı adla bir belge varsa atlanır; yalnızca eksik olan eklenir.
 * Ajansın sildiği belge de geri yüklenmez.
 */
export type KutuphaneGirdisi = YuklemeGirdisi & { kaynak?: string };

export async function kutuphaneYukle(): Promise<{ eklenen: number; atlanan: number; parca: number; hatalar: string[] }> {
  let manifest: KutuphaneGirdisi[];
  let ham: string;
  try {
    ham = await readFile(yolCoz("docs/kutuphane/manifest.json"), "utf8");
  } catch {
    return { eklenen: 0, atlanan: 0, parca: 0, hatalar: [] }; // manifest yok: yapılacak iş yok
  }
  try {
    manifest = JSON.parse(ham);
  } catch (e) {
    // Bozuk manifest "iş yok" değildir: sessizce geçmek eksik yüklemeyi gizlerdi.
    return { eklenen: 0, atlanan: 0, parca: 0, hatalar: [`manifest okunamadı: ${e instanceof Error ? e.message : String(e)}`] };
  }
  // Var olan belge yeniden yazılmaz; ajansın /belgeler'den SİLDİĞİ belge de geri
  // gelmez (denetimdeki `belge_silindi` kaydı mezar taşıdır). Geri almak için
  // belge /belgeler'den yeniden yüklenir.
  const mevcut = new Set(
    (
      await sahip()<{ ad: string }[]>`
        select distinct ad from belge
        union
        select detay->>'ad' from denetim where eylem = 'belge_silindi' and detay->>'ad' is not null`
    ).map((r) => r.ad),
  );
  let eklenen = 0, atlanan = 0, parca = 0;
  const hatalar: string[] = [];
  for (const g of manifest) {
    if (mevcut.has(g.ad)) { atlanan++; continue; }
    try {
      parca += (await belgeYukle(g)).parca;
      mevcut.add(g.ad);
      eklenen++;
    } catch (e) {
      // Tek belgenin hatası kurulumu durdurmaz; neden rapora yazılır.
      hatalar.push(`${g.ad}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  // Veri belgeleri (`docs/veri/manifest.json`: MTA, dış ticaret, turizm…):
  // kaynak güncellendikçe yeniden üretilir, bu yüzden "varsa atla" değil
  // İÇERİK ÖZETİ karşılaştırılır — yalnızca değişen belge yeniden yazılır.
  // Ajansın sildiği veri belgesi de geri gelmez.
  const silinen = new Set(
    (await sahip()<{ ad: string }[]>`select detay->>'ad' as ad from denetim where eylem = 'belge_silindi' and detay->>'ad' is not null`).map((r) => r.ad),
  );
  let veri: KutuphaneGirdisi[] = [];
  try {
    veri = JSON.parse(await readFile(yolCoz("docs/veri/manifest.json"), "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") hatalar.push(`veri manifesti okunamadı: ${e instanceof Error ? e.message : String(e)}`);
  }
  for (const g of veri) {
    if (silinen.has(g.ad)) { atlanan++; continue; }
    try {
      const n = await veriYukle(g);
      if (n === null) atlanan++;
      else { eklenen++; parca += n; }
    } catch (e) {
      hatalar.push(`${g.ad}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { eklenen, atlanan, parca, hatalar };
}

// RDA veri API'si (rda.ktlsr.com, tarimveristudio) → docs/veri/rda-*/{il}.md
//
// İl düzeyinde ürün bazında tarım verisi (TÜİK'in anahtarlı servisi vermiyor)
// ve dış ticaret, sanayi, enerji, turizm göstergeleri. İl başına dört belge:
//
//   rda-tarim/        ürün bazında üretim, hayvan sayıları, alan ve üretim değeri
//   rda-dis-ticaret/  sektör bazında ihracat VE ithalat (il düzeyinde ithalat yalnızca burada)
//   rda-sanayi/       OSB ve sanayi sitesi, enerji, il ekonomisi
//   rda-turizm/       konaklama tesislerine geliş ve geceleme
//
//   node --env-file=.env tools/veri/rda.ts [--zorla]
//   (RDA_API_KEY gerekir; RDA_API_URL varsayılanı https://rda.ktlsr.com/api/v1)
//
// Yılda birkaç kez elle koşar. API alan başına içerik özeti verir (`/surum`):
// özeti değişmeyen belge grubu yeniden üretilmez (`--zorla` hepsini üretir).
//
// Veri kuralları — API'nin işaretlerine uyulur, tahmin yürütülmez:
//   · `dogrulandi: false` gösterge alınmaz (kaynağa karşı teyit bekliyor).
//   · `tutarsiz` (toplam ≠ kırılımların toplamı) ve `gizli` gözlem alınmaz.
//   · Yalnızca toplam satırları istenir (`kirilim=yok`): kırılım adları yıla
//     göre değişiyor, çift sayım riski var.
//   · Türkiye payı yalnızca `toplanabilir` göstergede ve gizli değer içermeyen
//     Türkiye toplamıyla hesaplanır.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KOK = path.resolve(import.meta.dirname, "..", "..");
const TABAN = (process.env.RDA_API_URL || "https://rda.ktlsr.com/api/v1").replace(/\/+$/, "");
const anahtar = process.env.RDA_API_KEY;
if (!anahtar) throw new Error("RDA_API_KEY tanımlı değil (node --env-file=.env tools/veri/rda.ts).");
const ZORLA = process.argv.includes("--zorla");
/** Önceki dönemle karşılaştırma aralığı (yıl). */
const GERIYE = 5;

type Gosterge = {
  kod: string; ad: string; olcu: string | null; birim: string; carpan: number; alan: string; grup: string | null;
  uretimBicimi: string | null; toplanabilir: boolean; duzeyler: number[]; ilkYil: number; sonYil: number; dogrulandi: boolean;
};
type Gozlem = {
  gosterge: string; alanKodu: string; duzey: number; il: string | null; yil: number; deger: number | null;
  gizli: boolean; kirilim: string | null; gizliIcerir?: boolean; tutarsiz?: boolean;
};

async function al(yol: string): Promise<string> {
  for (let i = 1; ; i++) {
    const r = await fetch(`${TABAN}${yol}`, { headers: { authorization: `Bearer ${anahtar}` }, signal: AbortSignal.timeout(180_000) });
    if (r.ok) return r.text();
    if (r.status === 429 && i < 5) {
      await new Promise((ok) => setTimeout(ok, (Number(r.headers.get("retry-after")) || 10) * 1000));
      continue;
    }
    throw new Error(`RDA ${yol} → HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  }
}
const gostergeler = async (alan: string) => (JSON.parse(await al(`/gostergeler?alan=${encodeURIComponent(alan)}`)) as { gostergeler: Gosterge[] }).gostergeler;
const gozlemler = async (alan: string, duzey: number) =>
  (await al(`/gozlemler?alan=${encodeURIComponent(alan)}&duzey=${duzey}&kirilim=yok`)).split("\n").filter(Boolean).map((s) => JSON.parse(s) as Gozlem);

const katla = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/[ıi]/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").trim();
type Il = { kod: string; ad: string; ajans: string };
const iller = new Map<string, Il>();
for (const a of JSON.parse(readFileSync(path.join(KOK, "packages/database/data/ajans.json"), "utf8")))
  for (const i of a.iller) iller.set(katla(i.ad), { kod: i.kod, ad: i.ad, ajans: a.kod });

const sayi = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
/** Etiket cümle içinde küçük harfle yazılır; kısaltmalar (OSB, GSYH, AR-GE) olduğu gibi kalır. */
const kucuk = (s: string) =>
  s.split(" ").map((w) => (/\p{Lu}{2}/u.test(w) && w === w.toLocaleUpperCase("tr") ? w : w.toLocaleLowerCase("tr"))).join(" ");
/**
 * Ürün bazındaki belgede anlamlı sayılacak en küçük değer (birime göre).
 * Yoksa 2 tonluk bir ürün "Türkiye üretiminin yüzde 100'ü" diye en üste çıkar
 * (ölçüldü: Kütahya'da altın çilek 2 ton, papatya 9 ton). Eşik bir üretim
 * gerçeği değil, gürültü süzgecidir; belge başlığında yazar.
 */
const EN_AZ: Record<string, number> = { ton: 100, baş: 1000, adet: 10_000 };
/** "TL" + çarpan 1000 → "bin TL"; kaynağın yayımladığı ölçek korunur, sayı çarpılmaz. */
const birimYaz = (g: Gosterge) => {
  const b = g.birim === "USD" ? "dolar" : g.birim;
  return g.carpan === 1000 ? `bin ${b}` : g.carpan === 1_000_000 ? `milyon ${b}` : b;
};
/** Cümlenin öznesi: tarımda ad + ölçü ("örtü altı domates üretim miktarı"), diğerlerinde adın kendisi. */
function ozne(g: Gosterge): string {
  const ad = kucuk(g.ad);
  if (g.alan !== "tarim") return ad;
  const bicim = g.uretimBicimi === "örtü altı" ? "örtü altı " : g.uretimBicimi === "kültür" ? "yetiştiricilik yoluyla " : g.uretimBicimi === "avcılık" ? "avcılık yoluyla " : "";
  if (g.olcu === "üretim miktarı") return `${bicim}${ad} üretim miktarı`;
  if (g.olcu === "hayvan sayısı") return `${ad} sayısı`;
  if (g.olcu === "sayı" && !/sayısı$/i.test(g.ad)) return `${ad} sayısı`;
  return ad; // alan, üretim değeri, "… Sayısı": ad ölçüyü zaten söylüyor
}

type Belge = {
  klasor: string; kategori: string; ad: string; baslik: string; alanlar: string[]; sinir: number;
  /** yalnızca öne çıkanlar mı (tarım: yüzlerce ürün) yoksa hepsi mi */
  secici: boolean; atla?: RegExp; not: string;
};
const BELGELER: Belge[] = [
  { klasor: "rda-tarim", kategori: "tarim", ad: "Tarım ve Hayvancılık Üretimi", baslik: "tarım ve hayvancılık üretimi — ürünlere göre",
    alanlar: ["tarim", "tarim-ozet"], sinir: 80, secici: true,
    not: "Üretim miktarı, hayvan sayısı, alan ve üretim değerleri yıllık il toplamlarıdır. İlin ülke sıralamasında öne çıktığı ürünler alınmıştır; 100 tonun, 1.000 başın ve 10.000 adedin altındaki üretimler alınmamıştır." },
  { klasor: "rda-dis-ticaret", kategori: "dis_ticaret", ad: "İhracat ve İthalat (Sektörlere Göre)", baslik: "ihracat ve ithalatı — sektörlere göre",
    alanlar: ["dis-ticaret"], sinir: 60, secici: false,
    not: "Değerler faaliyet iline göre dış ticarettir. İthalat değerleri ilin dışarıdan aldığı girdiyi gösterir." },
  { klasor: "rda-sanayi", kategori: "sanayi", ad: "Sanayi, Enerji ve Ekonomi Göstergeleri", baslik: "sanayi, enerji ve ekonomi göstergeleri",
    // Sektörlere göre girişim sayıları TÜİK belgesinde (tuik-sanayi) NACE sınıfı düzeyinde var; burada yinelenmez.
    alanlar: ["sanayi", "enerji", "ekonomi"], sinir: 60, secici: false, atla: /Girişim Sayısı/i,
    not: "Organize sanayi bölgesi ve sanayi sitesi, elektrik üretimi ve tüketimi, il gayrisafi yurt içi hasılası." },
  { klasor: "rda-turizm", kategori: "turizm", ad: "Turizm Konaklama İstatistikleri", baslik: "turizm konaklama istatistikleri",
    alanlar: ["turizm"], sinir: 30, secici: false,
    not: "Turizm işletme belgeli ve belediye belgeli konaklama tesislerine geliş ve geceleme sayıları." },
];

const surumYolu = path.join(KOK, "docs", "veri", "rda-surum.json");
const eskiSurum: Record<string, string> = existsSync(surumYolu) ? JSON.parse(readFileSync(surumYolu, "utf8")) : {};
const yeniSurum: Record<string, string> = Object.fromEntries(
  (JSON.parse(await al("/surum")) as { alanlar: { alan: string; ozet: string }[] }).alanlar.map((a) => [a.alan, a.ozet]),
);

const ozet: string[] = [];
let eksik = false;
for (const b of BELGELER) {
  if (!ZORLA && b.alanlar.every((a) => yeniSurum[a] && yeniSurum[a] === eskiSurum[a]) && existsSync(path.join(KOK, "docs", "veri", b.klasor))) {
    ozet.push(`${b.klasor} değişmedi`);
    continue;
  }
  const katalog = new Map<string, Gosterge>();
  const il = new Map<string, number>(); // yil|il|kod
  const tr = new Map<string, number>(); // yil|kod
  for (const alan of b.alanlar) {
    for (const g of await gostergeler(alan)) {
      if (g.dogrulandi && g.duzeyler.includes(3) && !(b.atla && b.atla.test(g.ad))) katalog.set(g.kod, g);
    }
    for (const o of await gozlemler(alan, 3)) {
      if (o.deger == null || o.gizli || o.tutarsiz || o.kirilim != null || !o.il || !katalog.has(o.gosterge)) continue;
      il.set(`${o.yil}|${katla(o.il)}|${o.gosterge}`, o.deger);
    }
    for (const o of await gozlemler(alan, 0)) {
      if (o.deger == null || o.gizli || o.gizliIcerir || o.tutarsiz || o.kirilim != null) continue;
      tr.set(`${o.yil}|${o.gosterge}`, o.deger);
    }
  }
  // Gösterge başına: verisi olan SON yıl (göstergeler farklı yıllarda bitiyor) ve o yılın il sıralaması.
  const sonYil = new Map<string, number>();
  for (const k of il.keys()) {
    const [yil, , kod] = k.split("|");
    if (Number(yil) > (sonYil.get(kod) ?? 0)) sonYil.set(kod, Number(yil));
  }
  const sira = new Map<string, Map<string, number>>(); // kod → il → sıra
  for (const [kod, yil] of sonYil) {
    const d = [...iller.keys()].map((i) => [i, il.get(`${yil}|${i}|${kod}`) ?? 0] as const).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]);
    sira.set(kod, new Map(d.map(([i], n) => [i, n + 1])));
  }

  const cikti = path.join(KOK, "docs", "veri", b.klasor);
  rmSync(cikti, { recursive: true, force: true });
  mkdirSync(cikti, { recursive: true });
  const girdiler: object[] = [];
  for (const [anahtarIl, i] of [...iller].sort((x, y) => x[1].kod.localeCompare(y[1].kod))) {
    const satirlar = [...katalog.values()].flatMap((g) => {
      const yil = sonYil.get(g.kod);
      const v = yil ? il.get(`${yil}|${anahtarIl}|${g.kod}`) : undefined;
      if (!yil || !v || v <= 0) return [];
      if (b.secici && v < (EN_AZ[g.birim] ?? 0)) return [];
      const t = g.toplanabilir ? tr.get(`${yil}|${g.kod}`) : undefined;
      const pay = t && t > 0 && v <= t ? v / t : null;
      return [{ g, yil, v, pay, t, sira: sira.get(g.kod)!.get(anahtarIl)!, once: il.get(`${yil - GERIYE}|${anahtarIl}|${g.kod}`) }];
    });
    // Öne çıkan: Türkiye payı yüksek ya da ülke sıralamasında önde olan. Tarımda
    // yüzlerce ürün var; ilin önemsiz olduğu ürünler defteri doldurmasın.
    const secilen = (b.secici ? satirlar.filter((s, n, hepsi) => s.sira <= 25 || hepsi.length <= 20) : satirlar)
      .sort((x, y) => (y.pay ?? -1) - (x.pay ?? -1) || x.sira - y.sira)
      .slice(0, b.sinir);
    if (!secilen.length) continue;
    const yillar = [...new Set(secilen.map((s) => s.yil))].sort();
    const p = [
      `# ${i.ad} ${b.baslik}`,
      `Kaynak: TÜİK ve ilgili kurum verilerinden derlenmiştir (Türkiye İstatistiki Raporlama Platformu, rda.ktlsr.com). ${b.not} Her gösterge için verisi bulunan son yıl kullanılmıştır (${yillar[0] === yillar.at(-1) ? yillar[0] : `${yillar[0]}–${yillar.at(-1)}`}).`,
    ];
    for (const s of secilen) {
      const birim = birimYaz(s.g);
      p.push(
        `${i.ad} ilinde ${s.yil} yılında ${ozne(s.g)} ${sayi(s.v)} ${birim} olarak gerçekleşmiştir` +
          (s.pay !== null ? `, bu değer Türkiye toplamı olan ${sayi(s.t!)} ${birim} içinde yüzde ${sayi(s.pay * 100)} paya karşılık gelmektedir` : "") +
          ` ve ${i.ad} bu göstergede 81 il arasında ${s.sira}. sıradadır` +
          (s.once && s.once > 0 && s.once !== s.v ? `, ${s.yil - GERIYE} yılında aynı değer ${sayi(s.once)} ${birim} idi.` : "."),
      );
    }
    writeFileSync(path.join(cikti, `${i.kod}.md`), p.join("\n\n") + "\n");
    girdiler.push({
      dosya: `docs/veri/${b.klasor}/${i.kod}.md`, ad: `${i.ad} ${b.ad} (RDA)`, tur: "il_raporu", yil: String(yillar.at(-1)),
      ajansKod: i.ajans, ilKod: i.kod, kategori: b.kategori, kaynak: "https://rda.ktlsr.com",
    });
  }
  const gecici = path.join(cikti, ".girdiler.json");
  writeFileSync(gecici, JSON.stringify(girdiler));
  execFileSync("python", ["-c", "import json,sys;sys.path.insert(0,sys.argv[1]);from manifest import manifeste_yaz;manifeste_yaz(sys.argv[3],json.load(open(sys.argv[2],encoding='utf-8')))", import.meta.dirname, gecici, `docs/veri/${b.klasor}/`]);
  rmSync(gecici);
  for (const a of b.alanlar) eskiSurum[a] = yeniSurum[a];
  ozet.push(`${b.klasor} ${girdiler.length} il · ${katalog.size} gösterge`);
  // Kendi denetimi: 81 il bekleniyor; eksikse sessizce geçilmez.
  if (girdiler.length !== 81) eksik = true;
}
writeFileSync(surumYolu, JSON.stringify(eskiSurum, null, 1) + "\n");
console.log(`BİTTİ ${ozet.join(" · ")}`);
if (eksik) process.exitCode = 1;

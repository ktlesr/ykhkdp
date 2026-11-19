// TÜİK veri servisi (SDMX) → docs/veri/tuik-tarim/{il}.md ve docs/veri/tuik-sanayi/{il}.md
//
// Kaynak: "Ekonomik Faaliyete Göre Girişim Sayısı" (DF_BR_FAALIYET_GIRISIM_V1,
// İş Kayıtları): il × NACE Rev.2 sınıfı × yıl. "İlde ne yapılıyor, ne
// yoğunlaşmış" sorusunu raporların söylediğinden bağımsız cevaplar.
//
//   node --env-file=.env tools/veri/tuik.ts        (TUIK_API_KEY gerekir)
//
// Yılda bir güncellenir; elle koşar. Servisin canlı davranışı localdocs
// TASK-034'te ölçüldü ve burada uygulandı: `accept-language` zorunlu (yoksa
// 500), istek başına TEK medya türü, CSV yalnızca Accept başlığıyla, token 5 dk.
//
// Servisin VERMEDİĞİ: il düzeyinde bitkisel üretim miktarı ve hayvan sayısı
// (2026-11-19'da katalogdaki 517 veri kümesi tarandı; tarım tarafında yalnızca
// Türkiye geneli süt ve kümes ürünleri ile 35 il için tarım işçisi ücreti var).
// Buradaki tarım belgesi ÜRETİM değil, tarım-hayvancılık faaliyetinde kayıtlı
// GİRİŞİM sayısıdır ve belge bunu kendi içinde söyler.
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KOK = path.resolve(import.meta.dirname, "..", "..");
const AKIS = "DF_BR_FAALIYET_GIRISIM_V1";
const SURUM = "1.0";
/** Bir sınıfın belgeye girmesi için en az girişim sayısı: 1–2 girişim gürültüdür. */
const EN_AZ = 3;
/** Belge başına en çok sınıf cümlesi; yoğunlaşmaya göre sıralı. */
const SINIF_SINIRI = { tarim: 40, sanayi: 70 } as const;

const anahtar = process.env.TUIK_API_KEY;
if (!anahtar) throw new Error("TUIK_API_KEY tanımlı değil (node --env-file=.env tools/veri/tuik.ts).");

let jeton = "";
let jetonSonu = 0;
async function token(): Promise<string> {
  if (jeton && Date.now() < jetonSonu) return jeton;
  const r = await fetch("https://giris.tuik.gov.tr/realms/web/protocol/openid-connect/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "password", client_id: "nsi-ws-consumer", api_key: anahtar! }),
  });
  const j = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error(`TÜİK token alınamadı (HTTP ${r.status}).`);
  jeton = j.access_token;
  jetonSonu = Date.now() + ((j.expires_in ?? 300) - 60) * 1000;
  return jeton;
}
/** Servis yavaş ve düzensiz: takılan istek kesilip yeniden denenir. */
async function al(yol: string, accept: string): Promise<string> {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(`https://nsiws.tuik.gov.tr/rest/${yol}`, {
        headers: { authorization: `Bearer ${await token()}`, "accept-language": "tr,en;q=0.8", accept },
        signal: AbortSignal.timeout(180_000),
      });
      if (r.ok) return await r.text();
      if (i >= 3 || r.status < 500) throw new Error(`TÜİK ${yol} → HTTP ${r.status}`);
    } catch (e) {
      if (i >= 3) throw e;
    }
  }
}

const katla = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/[ıi]/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").trim();
type Il = { kod: string; ad: string; ajans: string };
const iller = new Map<string, Il>();
for (const a of JSON.parse(readFileSync(path.join(KOK, "packages/database/data/ajans.json"), "utf8")))
  for (const i of a.iller) iller.set(katla(i.ad), { kod: i.kod, ad: i.ad, ajans: a.kod });

// ── yapı: kod → Türkçe ad ───────────────────────────────────────────────────
const yapi = await al(`dataflow/TR/${AKIS}/${SURUM}?references=descendants`, "application/vnd.sdmx.structure+xml;version=2.1");
function kodListesi(id: string): Map<string, string> {
  const a = yapi.indexOf(`<structure:Codelist id="${id}"`);
  if (a < 0) throw new Error(`Kod listesi yok: ${id}`);
  const govde = yapi.slice(a, yapi.indexOf("</structure:Codelist>", a));
  return new Map(
    govde.split("<structure:Code ").slice(1).map((m) => {
      const ad = m.match(/<common:Name xml:lang="tr">([^<]+)</) ?? m.match(/<common:Name[^>]*>([^<]+)</);
      return [m.match(/id="([^"]+)"/)![1], (ad?.[1] ?? "").replace(/&amp;/g, "&").trim()] as const;
    }),
  );
}
const naceAdi = kodListesi("CL_NACE_REV2_364_HIYERARSIK");
const alanAdi = kodListesi("CL_IBBS");

// ── veri: yıl|alan|faaliyet → girişim sayısı ────────────────────────────────
const csv = (await al(`data/TR,${AKIS},${SURUM}/all`, "application/vnd.sdmx.data+csv;version=1.0.0")).split(/\r?\n/).filter(Boolean);
const bas = csv[0].split(",");
const sutun = (ad: string) => { const i = bas.indexOf(ad); if (i < 0) throw new Error(`CSV sütunu yok: ${ad}`); return i; };
const [cAlan, cNace, cYil, cDeger] = [sutun("REF_AREA"), sutun("ACTIVITY_NACE_REV2"), sutun("TIME_PERIOD"), sutun("OBS_VALUE")];
const veri = new Map<string, number>();
const yillar = new Set<string>();
for (const s of csv.slice(1)) {
  const c = s.split(",");
  if (!c[cDeger]) continue; // gizlenmiş (CONF_STATUS=C) ya da boş: 0 yazılmaz
  veri.set(`${c[cYil]}|${c[cAlan]}|${c[cNace]}`, Number(c[cDeger]));
  yillar.add(c[cYil]);
}
const son = [...yillar].sort().at(-1)!;
const ilk = [...yillar].sort()[0];
const say = (yil: string, alan: string, nace: string) => veri.get(`${yil}|${alan}|${nace}`) ?? 0;

const kisimlar = [...naceAdi.keys()].filter((k) => /^[A-Z]$/.test(k));
const siniflar = [...naceAdi.keys()].filter((k) => /^[A-Z]\d{4}$/.test(k));
const trToplam = kisimlar.reduce((t, k) => t + say(son, "TR", k), 0);

const sayi = (n: number) => n.toLocaleString("tr-TR");
const yuzde = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
const kucuk = (s: string) => s.charAt(0).toLocaleLowerCase("tr") + s.slice(1);
const naceKod = (k: string) => `${k.slice(1, 3)}.${k.slice(3)}`;

const BELGELER = [
  { klasor: "tuik-tarim", kategori: "tarim", kisim: ["A"], baslik: "tarım, ormancılık ve balıkçılık girişimleri", sinir: SINIF_SINIRI.tarim },
  { klasor: "tuik-sanayi", kategori: "sanayi", kisim: ["B", "C"], baslik: "madencilik ve imalat girişimleri", sinir: SINIF_SINIRI.sanayi },
] as const;

const girdiler: Record<string, object[]> = { "tuik-tarim": [], "tuik-sanayi": [] };
const taninmayan: string[] = [];
for (const b of BELGELER) {
  const cikti = path.join(KOK, "docs", "veri", b.klasor);
  rmSync(cikti, { recursive: true, force: true });
  mkdirSync(cikti, { recursive: true });
}
// İl = İBBS-3 kodu: TR + üç karakter. Doğu bölgelerinde harf var (TRA11, TRB21, TRC31).
for (const alan of [...alanAdi.keys()].filter((k) => /^TR[0-9A-Z]\d{2}$/.test(k)).sort()) {
  const il = iller.get(katla(alanAdi.get(alan)!));
  if (!il) { taninmayan.push(`${alan} ${alanAdi.get(alan)}`); continue; }
  const ilToplam = kisimlar.reduce((t, k) => t + say(son, alan, k), 0);
  if (!ilToplam) continue;
  const ilPayi = ilToplam / trToplam;

  for (const b of BELGELER) {
    const p = [
      `# ${il.ad} ${b.baslik} — faaliyet sınıflarına göre`,
      `Kaynak: TÜİK İş Kayıtları İstatistikleri, Ekonomik Faaliyete Göre Girişim Sayısı (${AKIS}), ${son} yılı. Sayılar o faaliyette KAYITLI GİRİŞİM sayısıdır; üretim miktarı, kapasite ya da çalışan sayısı değildir. Tarımda yalnızca kayıtlı girişimler sayılır, kayıt dışı aile işletmeleri bu sayıya girmez.`,
      `${il.ad} ilinde ${son} yılında bütün faaliyetlerde toplam ${sayi(ilToplam)} girişim kayıtlıdır ve bu sayı Türkiye'deki ${sayi(trToplam)} girişimin yüzde ${yuzde(ilPayi * 100)} kadarıdır.`,
    ];
    for (const k of b.kisim) {
      const n = say(son, alan, k);
      if (!n) continue;
      p.push(`${il.ad} ilinde ${son} yılında ${kucuk(naceAdi.get(k)!)} kısmında ${sayi(n)} girişim kayıtlıdır, ${ilk} yılında bu sayı ${sayi(say(ilk, alan, k))} idi.`);
    }
    const satirlar = siniflar
      .filter((k) => b.kisim.includes(k[0] as never))
      .map((k) => ({ k, n: say(son, alan, k), tr: say(son, "TR", k) }))
      .filter((r) => r.n >= EN_AZ && r.tr > 0)
      .map((r) => ({ ...r, yogunluk: r.n / r.tr / ilPayi }))
      // Önce ilin Türkiye ortalamasına göre yoğunlaştığı faaliyetler.
      .sort((x, y) => y.yogunluk - x.yogunluk || y.n - x.n)
      .slice(0, b.sinir);
    if (!satirlar.length) continue;
    for (const r of satirlar) {
      const once = say(ilk, alan, r.k);
      p.push(
        `${il.ad} ilinde ${son} yılında ${kucuk(naceAdi.get(r.k)!)} (NACE ${naceKod(r.k)}) faaliyetinde ${sayi(r.n)} girişim kayıtlıdır` +
          (once !== r.n ? `, ${ilk} yılında bu sayı ${sayi(once)} idi` : "") +
          ` ve Türkiye'de bu faaliyetteki ${sayi(r.tr)} girişimin yüzde ${yuzde((r.n / r.tr) * 100)} kadarı ${il.ad} ilindedir` +
          (r.yogunluk >= 2 ? `, bu oran ilin toplam girişim sayısındaki payının ${yuzde(r.yogunluk)} katıdır.` : "."),
      );
    }
    writeFileSync(path.join(KOK, "docs", "veri", b.klasor, `${il.kod}.md`), p.join("\n\n") + "\n");
    girdiler[b.klasor].push({
      dosya: `docs/veri/${b.klasor}/${il.kod}.md`,
      ad: `${il.ad} ${b.kategori === "tarim" ? "Tarım ve Hayvancılık" : "Sanayi ve Madencilik"} Girişim Sayıları (TÜİK)`,
      tur: "il_raporu", yil: son, ajansKod: il.ajans, ilKod: il.kod, kategori: b.kategori, kaynak: "https://nsiws.tuik.gov.tr",
    });
  }
}

for (const b of BELGELER) {
  const gecici = path.join(KOK, "docs", "veri", b.klasor, ".girdiler.json");
  writeFileSync(gecici, JSON.stringify(girdiler[b.klasor]));
  execFileSync("python", ["-c", "import json,sys;sys.path.insert(0,sys.argv[1]);from manifest import manifeste_yaz;manifeste_yaz(sys.argv[3],json.load(open(sys.argv[2],encoding='utf-8')))", import.meta.dirname, gecici, `docs/veri/${b.klasor}/`]);
  rmSync(gecici);
}
// Kendi denetimi: 81 il bekleniyor; eksikse sessizce geçilmez.
const adet = BELGELER.map((b) => `${b.klasor} ${girdiler[b.klasor].length} il`).join(" · ");
console.log(`BİTTİ ${son} yılı · ${adet}${taninmayan.length ? ` · tanınmayan: ${taninmayan.join(", ")}` : ""}`);
if (taninmayan.length || girdiler["tuik-sanayi"].length !== 81) process.exitCode = 1;

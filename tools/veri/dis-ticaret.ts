// TÜİK dış ticaret panosu → docs/veri/dis-ticaret/{il}.md (il × yıl × fasıl ihracat)
//
// ponytail: Qlik oturumu ve küp okuyucu localdocs projesinden alınır (aynı
// makinede, sınanmış kod); buraya kopyalanmadı. Yılda birkaç kez elle koşar:
//   node tools/veri/dis-ticaret.ts [localdocs yolu, varsayılan D:/localdocs]
// Pano il düzeyinde YALNIZCA ihracat verir (ILFAALIYET, 2022 ve sonrası);
// il bazında ithalat ve GTİP 4+ kırılımı kaynakta yok.
// Tek bağlantı, tek küp; sayfalar arasında bekler.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const KOK = path.resolve(import.meta.dirname, "..", "..");
const ld = (p: string) => pathToFileURL(path.join(process.argv[2] ?? "D:/localdocs", p)).href;
const { Session } = await import(ld("lib/disticaret/session.ts"));
const { Engine } = await import(ld("lib/disticaret/engine.ts"));

const katla = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/[ıi]/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").trim();
type Il = { kod: string; ad: string; ajans: string };
const iller = new Map<string, Il>();
for (const a of JSON.parse(readFileSync(path.join(KOK, "packages/database/data/ajans.json"), "utf8")))
  for (const i of a.iller) iller.set(katla(i.ad), { kod: i.kod, ad: i.ad, ajans: a.kod });

const s = await Session.open();
let rows: { t: string; n: number | null }[][];
try {
  const e = new Engine(s);
  await e.open();
  const r = await e.cube(
    { dims: [{ field: "IL_ADI", sort: "text" }, { field: "YIL_ILFAALIYET", sort: "asc" }, { field: "FASIL_ARAMA", sort: "text" }], measures: ["Sum(ILFAALIYET_DOLAR)"] },
    200_000,
  );
  rows = r.rows;
  if (rows.length < r.total) throw new Error(`küp eksik geldi: ${rows.length}/${r.total}`);
} finally {
  s.close();
}

// il → yıl → [fasıl, dolar]
const veri = new Map<string, Map<string, [string, number][]>>();
const taninmayan = new Set<string>();
for (const [il, yil, fasil, dolar] of rows) {
  const k = iller.get(katla(il.t));
  if (!k) { taninmayan.add(il.t); continue; }
  if (!dolar.n || dolar.n <= 0) continue;
  const y = veri.get(k.kod) ?? new Map();
  veri.set(k.kod, y);
  y.set(yil.t, [...(y.get(yil.t) ?? []), [fasil.t.trim(), dolar.n]]);
}

const para = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} milyon dolar` : `${Math.round(n / 1e3).toLocaleString("tr-TR")} bin dolar`;
const cikti = path.join(KOK, "docs", "veri", "dis-ticaret");
mkdirSync(cikti, { recursive: true });
const girdiler: object[] = [];
for (const il of [...iller.values()].sort((a, b) => a.kod.localeCompare(b.kod))) {
  const yillar = veri.get(il.kod);
  if (!yillar) continue;
  const p = [
    `# ${il.ad} ihracatı — fasıllara göre`,
    `Kaynak: TÜİK Dış Ticaret İstatistikleri panosu (bi.tuik.gov.tr), il bazında ihracat (genel ticaret sistemi, firmanın bağlı olduğu ile göre). İl düzeyinde ithalat verisi yayımlanmamaktadır.`,
  ];
  const buYil = String(new Date().getFullYear());
  // Son üç yıl: içinde bulunulan yıl tamamlanmamıştır ve öyle yazılır.
  const sirali = [...yillar.keys()].sort().reverse().slice(0, 3);
  for (const yil of sirali) {
    const f = yillar.get(yil)!.sort((a, b) => b[1] - a[1]);
    const toplam = f.reduce((t, [, n]) => t + n, 0);
    const donem = yil === buYil ? `${yil} yılı (yıl tamamlanmadı, yıl içi veri)` : `${yil} yılı`;
    p.push(`${il.ad} ilinin ${donem} toplam ihracatı ${para(toplam)} olmuştur; ihracat ${f.length} fasılda gerçekleşmiştir.`);
    // En büyük 15 fasıl: gerisi toplamın küçük kuyruğu ve defteri doldurur.
    p.push(...f.slice(0, 15).map(([ad, n]) =>
      `${il.ad} ${donem} ihracatında ${ad} faslı ${para(n)}; il ihracatı içindeki payı yüzde ${((n / toplam) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}.`));
  }
  writeFileSync(path.join(cikti, `${il.kod}.md`), p.join("\n\n") + "\n");
  girdiler.push({ dosya: `docs/veri/dis-ticaret/${il.kod}.md`, ad: `${il.ad} İhracat İstatistikleri (TÜİK)`, tur: "il_raporu", yil: sirali[0],
    ajansKod: il.ajans, ilKod: il.kod, kategori: "dis_ticaret", kaynak: "https://bi.tuik.gov.tr/extensions/tuik-mashup/index.html" });
}
const gecici = path.join(cikti, ".girdiler.json");
writeFileSync(gecici, JSON.stringify(girdiler));
execFileSync("python", ["-c", "import json,sys;sys.path.insert(0,sys.argv[1]);from manifest import manifeste_yaz;manifeste_yaz('docs/veri/dis-ticaret/',json.load(open(sys.argv[2],encoding='utf-8')))", import.meta.dirname, gecici]);
(await import("node:fs")).rmSync(gecici);
console.log(`BİTTİ ${girdiler.length} il · ${rows.length} satır${taninmayan.size ? ` · tanınmayan: ${[...taninmayan].join(", ")}` : ""}`);

/**
 * Yüklenen dosya → Markdown. PDF, Word (.docx), Excel (.xlsx), düz metin.
 *
 * Hedef alıntı doğrulamasına uygun metin: paragraf TEK SATIRDA bütün, kolonlar
 * karışmamış, sayfa işareti korunmuş ("12 / 240" — `parcala()` bunu sayfa
 * çıpasına çevirir). OCR YOK: metin katmanı olmayan PDF reddedilir; OCR hatası
 * belgede olmayan alıntı üretirdi. Sonuç ayrıca kalite ölçerinden geçer
 * (`metinDenetle`): kötü çıkarım yüklenmez, kullanıcı metni yapıştırabilir.
 *
 * ponytail: PDF'te tablo algılama yok — hücreler ayrı kısa satırlar olur.
 * Tablo ağırlıklı PDF ölçerden geçemez; tablo gerekiyorsa Excel yüklenir.
 */

import { inflateRawSync } from "node:zlib";

export type Ceviri = { ok: true; metin: string; ozet: string; tablo: boolean } | { ok: false; hata: string };

const temizle = (s: string) =>
  s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, "").replace(/[\ue000-\uf8ff]/g, "•");

export async function dosyadanMetin(ad: string, veri: Uint8Array): Promise<Ceviri> {
  const uzanti = ad.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  try {
    if (uzanti === "pdf") return await pdftenMd(veri);
    if (uzanti === "docx" || uzanti === "xlsx") {
      const sisme = zipSismesi(veri);
      if (sisme) return { ok: false, hata: sisme };
      return uzanti === "docx" ? await wordenMd(veri) : await exceldenMd(veri);
    }
    if (uzanti === "txt" || uzanti === "md") {
      return { ok: true, metin: new TextDecoder().decode(veri).trim(), ozet: "metin dosyası", tablo: false };
    }
  } catch (e) {
    return { ok: false, hata: `Dosya okunamadı (${e instanceof Error ? e.message : String(e)}). Metni yapıştırmayı deneyin.` };
  }
  if (uzanti === "doc" || uzanti === "xls") {
    return { ok: false, hata: `Eski .${uzanti} biçimi okunamıyor; dosyayı .${uzanti}x olarak kaydedip yeniden yükleyin.` };
  }
  return { ok: false, hata: "Desteklenen biçimler: PDF, Word (.docx), Excel (.xlsx), .txt, .md." };
}

/**
 * .docx/.xlsx bir ZIP'tir: 30 MB'lık dosya açılınca gigabaytlara şişebilir.
 * Beyan edilen boyuta GÜVENİLMEZ (sahte yazılabilir): her girdi burada gerçekten
 * açılır ve `maxOutputLength` sınırı aşan açma işlemini keser. Ayrıştırıcı
 * (mammoth/exceljs) ancak bu sınamadan geçen dosyayı görür.
 */
export function zipSismesi(veri: Uint8Array, sinir = 150_000_000): string | null {
  const g = new DataView(veri.buffer, veri.byteOffset, veri.byteLength);
  let son = -1;
  for (let i = veri.length - 22; i >= Math.max(0, veri.length - 66_000); i--) {
    if (g.getUint32(i, true) === 0x06054b50) {
      son = i;
      break;
    }
  }
  if (son < 0) return "Dosya geçerli bir Word/Excel dosyası değil.";
  const adet = g.getUint16(son + 10, true);
  let p = g.getUint32(son + 16, true);
  if (adet > 5000) return "Dosya çok fazla iç parça içeriyor.";
  let toplam = 0;
  for (let i = 0; i < adet; i++) {
    if (p + 46 > veri.length || g.getUint32(p, true) !== 0x02014b50) return "Dosya bozuk.";
    const yontem = g.getUint16(p + 10, true);
    const sikisik = g.getUint32(p + 20, true);
    const yerel = g.getUint32(p + 42, true);
    if (yerel + 30 > veri.length || g.getUint32(yerel, true) !== 0x04034b50) return "Dosya bozuk.";
    const bas = yerel + 30 + g.getUint16(yerel + 26, true) + g.getUint16(yerel + 28, true);
    if (bas + sikisik > veri.length) return "Dosya bozuk.";
    if (yontem === 8) {
      try {
        toplam += inflateRawSync(veri.subarray(bas, bas + sikisik), { maxOutputLength: sinir - toplam + 1 }).length;
      } catch (e) {
        if ((e as { code?: string }).code !== "ERR_BUFFER_TOO_LARGE") return "Dosya bozuk.";
        toplam = sinir + 1;
      }
    } else if (yontem === 0) toplam += sikisik;
    else return "Dosya desteklenmeyen bir sıkıştırma kullanıyor.";
    if (toplam > sinir) return "Dosya açıldığında çok büyük; yüklenmedi.";
    p += 46 + g.getUint16(p + 28, true) + g.getUint16(p + 30, true) + g.getUint16(p + 32, true);
  }
  return null;
}

// ───────────────────────── Word ─────────────────────────

const varlik = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
const duz = (html: string) => varlik(html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

/** mammoth HTML'i → Markdown. `convertToMarkdown` kullanılmaz: noktalama işaretlerini `\` ile kaçırır, alıntı birebir kalmaz. */
export function htmldenMd(html: string): string {
  const out: string[] = [];
  for (const m of html.matchAll(/<(h[1-6]|p|li|table)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const [, etiket, ic] = m;
    if (etiket === "table") {
      const satirlar = [...ic!.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)]
        .map((s) => [...s[1]!.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/g)].map((h) => duz(h[1]!).replace(/\|/g, "/")))
        .filter((s) => s.some(Boolean));
      if (satirlar.length) out.push(tabloMd(satirlar));
      continue;
    }
    const t = duz(ic!);
    if (!t) continue;
    out.push(etiket![0] === "h" ? `## ${t}` : etiket === "li" ? `- ${t}` : t);
  }
  return out.join("\n\n");
}

const tabloMd = (satirlar: string[][]) => {
  const en = Math.max(...satirlar.map((s) => s.length));
  const satir = (s: string[]) => `| ${Array.from({ length: en }, (_, i) => s[i] ?? "").join(" | ")} |`;
  return [satir(satirlar[0]!), `|${" --- |".repeat(en)}`, ...satirlar.slice(1).map(satir)].join("\n");
};

async function wordenMd(veri: Uint8Array): Promise<Ceviri> {
  const mammoth = (await import("mammoth")).default;
  // Tablo içindeki <p> ayrıca yakalanmasın diye tablolar önce işaretlenir.
  const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(veri) });
  const tablolar: string[] = [];
  const govde = value.replace(/<table\b[\s\S]*?<\/table>/g, (t) => `<table>${tablolar.push(t) - 1}</table>`);
  const md = htmldenMd(govde.replace(/<table>(\d+)<\/table>/g, (_, i) => tablolar[Number(i)]!.replace(/<\/?p\b[^>]*>/g, " ")));
  return { ok: true, metin: temizle(md), ozet: "Word belgesinden çevrildi", tablo: false };
}

// ───────────────────────── Excel ─────────────────────────

async function exceldenMd(veri: Uint8Array): Promise<Ceviri> {
  const ExcelJS = (await import("exceljs")).default;
  const kitap = new ExcelJS.Workbook();
  await kitap.xlsx.load(veri.buffer.slice(veri.byteOffset, veri.byteOffset + veri.byteLength) as ArrayBuffer);
  const out: string[] = [];
  let sayfa = 0;
  kitap.eachSheet((s) => {
    const satirlar: string[][] = [];
    s.eachRow((r) => {
      const h: string[] = [];
      r.eachCell({ includeEmpty: true }, (c) => h.push(String(c.text ?? "").replace(/\s+/g, " ").trim().replace(/\|/g, "/")));
      if (h.some(Boolean)) satirlar.push(h);
    });
    if (!satirlar.length) return;
    sayfa++;
    out.push(`## ${s.name}`, tabloMd(satirlar));
  });
  if (!out.length) return { ok: false, hata: "Excel dosyasında dolu hücre bulunamadı." };
  return { ok: true, metin: temizle(out.join("\n\n")), ozet: `Excel'den çevrildi · ${sayfa} sayfa`, tablo: true };
}

// ───────────────────────── PDF ─────────────────────────

type Kesit = { x0: number; x1: number; y: number; h: number; metin: string; tablo?: boolean };
const MADDE_BASI = /^(?:[•\-–▪■●○*]|\(?\d{1,3}[.)]|[a-zçğıöşü][.)])\s/;
const CUMLE_SONU = /[.!?:;]\s*$/;

/** Bir sayfanın metin parçalarını satır kesitlerine toplar: aynı satırda büyük boşluk kolon/hücre sınırıdır. */
function kesitler(ogeler: Array<{ str: string; transform: number[]; width: number; height: number }>, genislik: number): Kesit[] {
  const og = ogeler
    .filter((o) => o.str.trim() && Math.abs(o.transform[1]!) <= Math.abs(o.transform[0]!)) // döndürülmüş metin alınmaz
    .map((o) => ({ x: o.transform[4]!, y: o.transform[5]!, w: o.width, h: o.height || Math.hypot(o.transform[2]!, o.transform[3]!), s: o.str }))
    .sort((a, b) => b.y - a.y || a.x - b.x);
  const satirlar: (typeof og)[] = [];
  for (const o of og) {
    const son = satirlar.at(-1);
    if (son && Math.abs(son[0]!.y - o.y) < 0.5 * Math.max(son[0]!.h, o.h)) son.push(o);
    else satirlar.push([o]);
  }
  const out: Kesit[] = [];
  for (const satir of satirlar) {
    satir.sort((a, b) => a.x - b.x);
    const satirBasi = out.length;
    let k: Kesit | null = null;
    let uzun = 0;
    for (const o of satir) {
      const bosluk: number = k ? o.x - k.x1 : 0;
      if (k && bosluk <= Math.max(1.1 * o.h, 10)) {
        k.metin += (bosluk > 0.15 * o.h && !/\s$/.test(k.metin) && !/^\s/.test(o.s) ? " " : "") + o.s;
        k.x1 = Math.max(k.x1, o.x + o.w);
        // Boy, en uzun ögenin boyudur: madde imi glifi büyük olunca satır devamıyla birleşmiyordu.
        if (o.s.length > uzun) {
          uzun = o.s.length;
          k.h = o.h;
        }
      } else {
        k = { x0: o.x, x1: o.x + o.w, y: o.y, h: o.h, metin: o.s };
        uzun = o.s.length;
        out.push(k);
      }
    }
    // Aynı satırda birden çok kesit: tablo satırı — İKİ KOLONLU düz yazı değilse
    // (iki geniş kesit, aradaki boşluk sayfa ortasında).
    const bu = out.slice(satirBasi);
    const temiz = bu.map((k) => ({ ...k, metin: k.metin.replace(/\s+/g, " ").trim() })).filter((k) => k.metin);
    const ikiKolon =
      temiz.length === 2 &&
      temiz.every((k) => k.x1 - k.x0 > genislik * 0.3) &&
      Math.abs((temiz[0]!.x1 + temiz[1]!.x0) / 2 - genislik / 2) < genislik * 0.1;
    if (temiz.length >= 2 && !ikiKolon) {
      out.length = satirBasi;
      out.push({
        x0: temiz[0]!.x0, x1: temiz.at(-1)!.x1, y: temiz[0]!.y, h: Math.max(...temiz.map((k) => k.h)), tablo: true,
        metin: `| ${temiz.map((k) => k.metin.replace(/\|/g, "/")).join(" | ")} |`,
      });
    }
  }
  for (const k of out) if (!k.tablo) k.metin = k.metin.replace(/\s+/g, " ").trim();
  return out.filter((k) => k.metin);
}

/** Okuma sırası: tam genişlik kesit akışı böler, aradakiler sol kolon → sağ kolon. */
function kolonSirasi(ks: Kesit[], genislik: number): Kesit[] {
  const orta = genislik / 2;
  const sirali: Kesit[] = [];
  let tampon: Kesit[] = [];
  const ySira = (a: Kesit, b: Kesit) => b.y - a.y || a.x0 - b.x0;
  const bosalt = () => {
    const sol = tampon.filter((k) => (k.x0 + k.x1) / 2 < orta).sort(ySira);
    const sag = tampon.filter((k) => (k.x0 + k.x1) / 2 >= orta).sort(ySira);
    sirali.push(...(sol.length >= 2 && sag.length >= 2 ? [...sol, ...sag] : tampon.sort(ySira)));
    tampon = [];
  };
  for (const k of [...ks].sort(ySira)) {
    if (k.tablo || k.x1 - k.x0 > genislik * 0.6 || (k.x0 < orta - 20 && k.x1 > orta + 20)) {
      bosalt();
      sirali.push(k);
    } else tampon.push(k);
  }
  bosalt();
  return sirali;
}

/** Ardışık satırları paragrafa birleştirir. */
function paragraflar(ks: Kesit[], genislik: number): Kesit[] {
  const ayniKolon = (a: Kesit, b: Kesit) => Math.abs(a.x0 - b.x0) < genislik * 0.06 || (a.x0 - 2 <= b.x0 && b.x0 <= a.x1);
  const out: Kesit[] = [];
  const kenar = new Map<Kesit, number>(); // satır başına bir kez; sayfa ögesi sayısı ayrıca sınırlı
  let sonSatir: Kesit | null = null; // paragrafın son görsel satırı
  for (const b of ks) {
    const o = out.at(-1);
    if (o && sonSatir) {
      const s: Kesit = sonSatir;
      let sagKenar = kenar.get(s);
      if (sagKenar === undefined) {
        sagKenar = ks.reduce((m, k) => (ayniKolon(s, k) ? Math.max(m, k.x1) : m), s.x1);
        kenar.set(s, sagKenar);
      }
      const dolu = s.x1 >= sagKenar - 2 * s.h; // satır kolonun sonuna kadar gidiyor: paragraf sürüyor
      const yakin = s.y - b.y > 0 && s.y - b.y < 1.7 * Math.max(s.h, b.h);
      const bitmedi = !CUMLE_SONU.test(o.metin) || dolu || /^\p{Ll}/u.test(b.metin);
      if (!o.tablo && !b.tablo && ayniKolon(s, b) && yakin && bitmedi && Math.abs(s.h - b.h) < 0.6 && !MADDE_BASI.test(b.metin)) {
        o.metin = o.metin.endsWith("-") && /^\p{Ll}/u.test(b.metin) ? o.metin.slice(0, -1) + b.metin : `${o.metin} ${b.metin}`;
        o.x0 = Math.min(o.x0, b.x0);
        o.x1 = Math.max(o.x1, b.x1);
        sonSatir = b;
        continue;
      }
    }
    out.push({ ...b });
    sonSatir = b;
  }
  return out;
}

async function pdftenMd(veri: Uint8Array): Promise<Ceviri> {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(veri);
  const n = pdf.numPages;
  if (n > 2000) return { ok: false, hata: `PDF ${n} sayfa; en çok 2000 sayfa yüklenebilir.` };
  const sayfalar: Array<{ no: number; ps: Kesit[] }> = [];
  const boyAgirlik = new Map<number, number>();
  const gorulme = new Map<string, number>();
  let metinsiz = 0;
  for (let no = 1; no <= n; no++) {
    const sayfa = await pdf.getPage(no);
    const genislik = sayfa.getViewport({ scale: 1 }).width;
    const icerik = await sayfa.getTextContent();
    // Sayfa başına öge sınırı: paragraf birleştirme sayfa içinde karesel çalışır.
    if (icerik.items.length > 20_000) return { ok: false, hata: `PDF'in ${no}. sayfası olağan dışı yoğun; yüklenmedi.` };
    const ks = kesitler(icerik.items.filter((i): i is typeof i & { str: string } => "str" in i) as never, genislik);
    if (!ks.length) {
      metinsiz++;
      continue;
    }
    const ps = paragraflar(kolonSirasi(ks, genislik), genislik).filter((p) => !/^\d{1,4}$/.test(p.metin));
    for (const p of ps) if (!p.tablo) boyAgirlik.set(Math.round(p.h * 10) / 10, (boyAgirlik.get(Math.round(p.h * 10) / 10) ?? 0) + p.metin.length);
    for (const t of new Set(ps.filter((p) => !p.tablo && p.metin.length < 100).map((p) => p.metin))) gorulme.set(t, (gorulme.get(t) ?? 0) + 1);
    sayfalar.push({ no, ps });
  }
  const karakter = sayfalar.reduce((t, s) => t + s.ps.reduce((u, p) => u + p.metin.length, 0), 0);
  if (metinsiz / n > 0.5 || karakter < 1500) {
    return {
      ok: false,
      hata: `Bu PDF taranmış görünüyor: ${n} sayfanın ${metinsiz} tanesinde metin katmanı yok. Görüntüden metin okuma (OCR) kullanılmıyor — hatalı okuma belgede olmayan alıntı üretirdi. Metin katmanlı PDF yükleyin ya da metni yapıştırın.`,
    };
  }
  const govde = [...boyAgirlik.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  // Üst/alt bilgi: aynı kısa metin sayfaların onda birinde (en az 5) yineleniyorsa gövde değildir.
  const tekrar = new Set([...gorulme.entries()].filter(([, c]) => c >= Math.max(5, n * 0.1)).map(([t]) => t));
  const out: string[] = [];
  for (const { no, ps } of sayfalar) {
    out.push(`${no} / ${n}`);
    for (const p of ps) {
      if (tekrar.has(p.metin)) continue;
      // İçindekiler satırı (noktalı dolgu) içerik değildir; ölçeri de yanıltır.
      if (!p.tablo && /(?:\.\s?){5,}/.test(p.metin)) continue;
      if (p.tablo) {
        // Ardışık tablo satırları tek blok: aralarında boş satır olmaz.
        const onceki = out.at(-1)!;
        if (onceki.startsWith("|")) out[out.length - 1] = `${onceki}
${p.metin}`;
        else out.push(`${p.metin}
|${" --- |".repeat(p.metin.split(" | ").length)}`);
        continue;
      }
      const baslik = p.metin.length <= 120 && !p.metin.endsWith(".") && p.h >= govde * 1.15;
      out.push(baslik ? `## ${p.metin}` : p.metin);
    }
  }
  return {
    ok: true,
    metin: temizle(out.join("\n\n")),
    ozet: `PDF'ten çevrildi · ${n} sayfa${metinsiz ? ` · ${metinsiz} sayfada metin yok` : ""}`,
    tablo: false,
  };
}

import ExcelJS from "exceljs";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { NihaiDetay, NihaiIl } from "@ykh/database";
import { ayardan, hesapla } from "@ykh/scoring";

/**
 * Nihai liste — il, bölge ya da tümü; Excel ve Word.
 *
 * İçerik ekrandakiyle AYNI hesap: `hesapla` (karar modeli), yalnızca
 * ONAYLANMIŞ öneriler, en çok slot kadar asıl + slot kadar yedek. Liste dışı
 * ve dayanaksız adaylar nihai listeye girmez. Dosya eksiğini SÖYLER: onay
 * bekleyen öneri sayısı, boş slot ve açık dönemi olmayan il yazılır —
 * eksik bir liste tam görünmez.
 */

export type NihaiSatir = {
  bolgeKod: string; bolge: string; il: string; yil: string;
  bolum: "Asıl" | "Yedek" | "Boş slot";
  sira: number; baslik: string; kaynak: string; nace: string; ekNace: string; kapsam: string; puan: number | null; dayanak: number | null;
  sonuc: string; gerekce: string; aiGerekce: string; onayTarihi: string; model: string;
};

export type NihaiOzet = {
  bolgeKod: string; bolge: string; il: string; yil: string; asil: number; yedek: number; bos: number;
  bekleyen: number; agirlik: string; kalibre: boolean; donemVar: boolean;
};

function kaynak(d: NihaiDetay | undefined, koken: string): string {
  if (koken === "mevcut") return `Resmî konu${d?.resmi_yillar ? ` (${d.resmi_yillar})` : ""}`;
  if (d?.resmi_yillar) return `Önceki resmî konu (${d.resmi_yillar})`;
  if (d?.kesif) return "Belgelerden keşif";
  return "Öneri";
}

/** İller → satırlar ve il özeti. Hesap ekrandakiyle aynı. */
export function nihaiHesapla(iller: readonly NihaiIl[]): { satirlar: NihaiSatir[]; ozet: NihaiOzet[] } {
  const satirlar: NihaiSatir[] = [];
  const ozet: NihaiOzet[] = [];
  for (const x of iller) {
    const ortak = { bolgeKod: x.ajansKod, bolge: x.ajans, il: x.il, yil: x.donem?.yil ?? "" };
    if (!x.donem) {
      ozet.push({ ...ortak, asil: 0, yedek: 0, bos: 0, bekleyen: 0, agirlik: "", kalibre: false, donemVar: false });
      continue;
    }
    const h = hesapla(x.adaylar, ayardan(x.donem.set), { yerAdlari: [x.il] });
    const satir = (bolum: NihaiSatir["bolum"], s: (typeof h.kalanlar)[number]): NihaiSatir => {
      const d = x.detay.get(s.id);
      return {
        ...ortak, bolum, sira: s.sira, baslik: s.ad, kaynak: kaynak(d, s.koken),
        nace: d?.nace_kod ? `${d.nace_kod}${d.nace_tanim ? ` · ${d.nace_tanim}` : ""}` : "",
        ekNace: d?.ek_nace ?? "",
        kapsam: d?.kapsam ?? "",
        puan: s.puan, dayanak: s.dayanak, sonuc: s.sonuc,
        gerekce: d?.gerekce ?? "", aiGerekce: d?.ai_gerekce ?? "", onayTarihi: d?.onay_tarihi ?? "", model: d?.model_snapshot ?? "",
      };
    };
    let bos = 0;
    for (const s of h.ilkDort) {
      if (s.bos) {
        bos++;
        satirlar.push({
          ...ortak, bolum: "Boş slot", sira: s.sira, baslik: "Slot boş — yeterince gerekçelendirilebilir aday yok", kaynak: "",
          nace: "", ekNace: "", kapsam: "", puan: null, dayanak: null, sonuc: "boş slot", gerekce: s.gerekce, aiGerekce: "", onayTarihi: "", model: "",
        });
      } else satirlar.push(satir("Asıl", s));
    }
    const yedek = h.kalanlar.filter((s) => s.yedekte);
    for (const s of yedek) satirlar.push(satir("Yedek", s));
    ozet.push({
      ...ortak, asil: h.ilkDort.length - bos, yedek: yedek.length, bos, bekleyen: x.bekleyen,
      agirlik: x.donem.set.surum, kalibre: x.donem.kalibre, donemVar: true,
    });
  }
  return { satirlar, ozet };
}

const KURAL =
  "Yalnızca ajans onaylı öneriler sıralanır. Puanlar yapay zekâ tarafından üretilir ve ajans onayından geçer; " +
  "belgelere bağlanamayan aday (dayanak eşiğinin altında) puanı yüksek olsa da slot dolduramaz. Resmî konulara " +
  "ilan edilmiş devamlılık payı eklenir. Boş slot hata değildir. Sıralama karar değildir.";

// ── Excel ──────────────────────────────────────────────────────────────────

export async function nihaiExcel(iller: readonly NihaiIl[], kapsam: string): Promise<Buffer> {
  const { satirlar, ozet } = nihaiHesapla(iller);
  const wb = new ExcelJS.Workbook();
  wb.creator = "YKH-KDP";
  wb.created = new Date();

  const s1 = wb.addWorksheet("Nihai liste", { views: [{ state: "frozen", ySplit: 1 }] });
  s1.columns = [
    { header: "Bölge", key: "bolgeKod", width: 8 },
    { header: "Ajans", key: "bolge", width: 26 },
    { header: "İl", key: "il", width: 14 },
    { header: "Dönem", key: "yil", width: 8 },
    { header: "Bölüm", key: "bolum", width: 10 },
    { header: "Sıra", key: "sira", width: 6 },
    { header: "Yatırım konusu", key: "baslik", width: 50 },
    { header: "Kaynak", key: "kaynak", width: 24 },
    { header: "Ürün grupları", key: "kapsam", width: 46 },
    { header: "Ana NACE", key: "nace", width: 34 },
    { header: "Ek NACE (ürün grubu)", key: "ekNace", width: 46 },
    { header: "Stratejik puan (devamlılık dahil)", key: "puan", width: 14 },
    { header: "Belge dayanağı", key: "dayanak", width: 12 },
    { header: "Sonuç", key: "sonuc", width: 12 },
    { header: "Neden burada? (gerekçe)", key: "gerekce", width: 70 },
    { header: "Yapay zekâ değerlendirmesi", key: "aiGerekce", width: 70 },
    { header: "Onay tarihi", key: "onayTarihi", width: 12 },
    { header: "Model künyesi", key: "model", width: 24 },
  ];
  s1.getRow(1).font = { bold: true };
  for (const r of satirlar) s1.addRow(r);
  s1.eachRow((row, i) => {
    if (i > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  const s2 = wb.addWorksheet("Özet", { views: [{ state: "frozen", ySplit: 1 }] });
  s2.columns = [
    { header: "Bölge", key: "bolgeKod", width: 8 },
    { header: "Ajans", key: "bolge", width: 26 },
    { header: "İl", key: "il", width: 14 },
    { header: "Dönem", key: "yil", width: 8 },
    { header: "Asıl", key: "asil", width: 7 },
    { header: "Yedek", key: "yedek", width: 7 },
    { header: "Boş slot", key: "bos", width: 9 },
    { header: "Onay bekleyen (listede değil)", key: "bekleyen", width: 16 },
    { header: "Ağırlık seti", key: "agirlik", width: 16 },
    { header: "Ağırlık kaynağı", key: "kaynak", width: 22 },
  ];
  s2.getRow(1).font = { bold: true };
  for (const o of ozet) {
    s2.addRow({
      ...o,
      yil: o.donemVar ? o.yil : "açık dönem yok",
      kaynak: !o.donemVar ? "" : o.kalibre ? "ajansın yayımladığı" : "ulusal varsayılan",
    });
  }

  const s3 = wb.addWorksheet("Künye");
  s3.columns = [{ header: "Alan", key: "a", width: 26 }, { header: "Değer", key: "d", width: 100 }];
  s3.getRow(1).font = { bold: true };
  s3.addRows([
    { a: "Kapsam", d: kapsam },
    { a: "Oluşturuldu", d: new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }) },
    { a: "İl sayısı", d: ozet.length },
    { a: "Onay bekleyen (listede değil)", d: ozet.reduce((t, o) => t + o.bekleyen, 0) },
    { a: "Kural", d: KURAL },
  ]);
  s3.getColumn("d").alignment = { wrapText: true, vertical: "top" };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ── Word ───────────────────────────────────────────────────────────────────

const INCE = { style: BorderStyle.SINGLE, size: 4, color: "D3D6D2" };
const KENAR = { top: INCE, bottom: INCE, left: INCE, right: INCE };

function hucre(metin: string, o: { genislik: number; baslik?: boolean; sag?: boolean }): TableCell {
  return new TableCell({
    width: { size: o.genislik, type: WidthType.PERCENTAGE },
    borders: KENAR,
    shading: o.baslik ? { type: ShadingType.CLEAR, color: "auto", fill: "F3F4F2" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [
      new Paragraph({
        alignment: o.sag ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: metin, bold: o.baslik, size: 18 })],
      }),
    ],
  });
}

const SUTUNLAR: Array<{ ad: string; g: number; sag?: boolean; deger: (s: NihaiSatir) => string }> = [
  { ad: "Sıra", g: 6, sag: true, deger: (s) => String(s.sira) },
  { ad: "Yatırım konusu", g: 40, deger: (s) => s.baslik },
  { ad: "Kaynak", g: 18, deger: (s) => s.kaynak },
  { ad: "Puan", g: 8, sag: true, deger: (s) => (s.puan === null ? "—" : String(s.puan)) },
  { ad: "Dayanak", g: 10, sag: true, deger: (s) => (s.dayanak === null ? "—" : `${s.dayanak}/100`) },
  { ad: "Sonuç", g: 18, deger: (s) => s.sonuc },
];

function tablo(satirlar: NihaiSatir[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: SUTUNLAR.map((c) => hucre(c.ad, { genislik: c.g, baslik: true, sag: c.sag })) }),
      ...satirlar.map((s) => new TableRow({ children: SUTUNLAR.map((c) => hucre(c.deger(s), { genislik: c.g, sag: c.sag })) })),
    ],
  });
}

const p = (text: string, o: { bold?: boolean; renk?: string; boyut?: number; once?: number } = {}) =>
  new Paragraph({
    spacing: { before: o.once ?? 0, after: 80 },
    children: [new TextRun({ text, bold: o.bold, color: o.renk, size: o.boyut ?? 20 })],
  });

export async function nihaiWord(iller: readonly NihaiIl[], kapsam: string): Promise<Buffer> {
  const { satirlar, ozet } = nihaiHesapla(iller);
  const govde: Array<Paragraph | Table> = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Yatırım konuları · nihai liste", bold: true })] }),
    p(`${kapsam} · ${new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}`, { renk: "616A73" }),
    p(KURAL, { renk: "475059", boyut: 18 }),
  ];

  let bolge = "";
  for (const o of ozet) {
    if (o.bolge !== bolge) {
      bolge = o.bolge;
      govde.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360 }, children: [new TextRun(`${o.bolge} · ${o.bolgeKod}`)] }));
    }
    govde.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240 }, children: [new TextRun(`${o.il}${o.donemVar ? ` · ${o.yil} dönemi` : ""}`)] }));
    if (!o.donemVar) {
      govde.push(p("Açık dönem yok; nihai liste üretilmedi.", { renk: "616A73" }));
      continue;
    }
    const ilSatir = satirlar.filter((s) => s.il === o.il && s.bolgeKod === o.bolgeKod);
    const notlar = [
      `${o.asil} asıl, ${o.yedek} yedek${o.bos ? `, ${o.bos} boş slot` : ""}.`,
      o.bekleyen ? `${o.bekleyen} öneri onay sürecinde; bu listeye dahil değil.` : "",
      `Ağırlık seti ${o.agirlik} (${o.kalibre ? "ajansın yayımladığı" : "ulusal varsayılan"}).`,
    ].filter(Boolean).join(" ");
    govde.push(p(notlar, { renk: "475059", boyut: 18 }));

    const asil = ilSatir.filter((s) => s.bolum !== "Yedek");
    const yedek = ilSatir.filter((s) => s.bolum === "Yedek");
    govde.push(p("Asıl liste", { bold: true, once: 120 }), tablo(asil));
    if (yedek.length) govde.push(p("Yedek liste", { bold: true, once: 160 }), tablo(yedek));

    // Gerekçeler: tablo sade kalsın, metin altta.
    const gerekceli = ilSatir.filter((s) => s.bolum !== "Boş slot" && s.gerekce);
    if (gerekceli.length) {
      govde.push(p("Gerekçeler", { bold: true, once: 160 }));
      for (const s of gerekceli) {
        govde.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: `${s.sira}. ${s.baslik} — `, bold: true, size: 18 }), new TextRun({ text: s.gerekce, size: 18 })],
          }),
        );
      }
    }
  }

  const doc = new Document({
    creator: "YKH-KDP",
    title: `Nihai liste · ${kapsam}`,
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.PORTRAIT }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: govde,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

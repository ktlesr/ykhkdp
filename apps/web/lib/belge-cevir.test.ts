import assert from "node:assert/strict";
import { test } from "node:test";
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import ExcelJS from "exceljs";
import { dosyadanMetin, htmldenMd } from "./belge-cevir.ts";

test("Word: başlık çıpa olur, paragraf TEK satırda ve birebir kalır, tablo satır satır gelir", async () => {
  const cumle = "Uşak'ta 2023 yılında tekstil ihracatı %12,5 arttı (kaynak: TÜİK); geri dönüşüm iplik üretimi 1.250 tona ulaştı.";
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Sektör Görünümü", heading: HeadingLevel.HEADING_1 }),
          new Paragraph(cumle),
          new Table({
            rows: [["İl", "İhracat"], ["Uşak", "1.250"]].map(
              (s) => new TableRow({ children: s.map((h) => new TableCell({ children: [new Paragraph(h)] })) }),
            ),
          }),
        ],
      },
    ],
  });
  const r = await dosyadanMetin("rapor.docx", new Uint8Array(await Packer.toBuffer(doc)));
  assert.ok(r.ok);
  const satirlar = r.metin.split("\n");
  assert.ok(satirlar.includes("## Sektör Görünümü"));
  assert.ok(satirlar.includes(cumle), "paragraf birebir ve tek satırda olmalı — kaçış karakteri eklenmemeli");
  assert.ok(satirlar.includes("| Uşak | 1.250 |"));
});

test("Excel: her sayfa başlık + tablo; boş dosya reddedilir", async () => {
  const k = new ExcelJS.Workbook();
  const s = k.addWorksheet("İstihdam");
  s.addRow(["İl", "Yıl", "İstihdam"]);
  s.addRow(["Kütahya", 2023, 41250]);
  k.addWorksheet("Boş");
  const r = await dosyadanMetin("veri.xlsx", new Uint8Array(await k.xlsx.writeBuffer()));
  assert.ok(r.ok && r.tablo);
  assert.match(r.metin, /^## İstihdam\n\n\| İl \| Yıl \| İstihdam \|\n\| --- \| --- \| --- \|\n\| Kütahya \| 2023 \| 41250 \|$/);

  const bos = new ExcelJS.Workbook();
  bos.addWorksheet("x");
  assert.equal((await dosyadanMetin("bos.xlsx", new Uint8Array(await bos.xlsx.writeBuffer()))).ok, false);
});

test("desteklenmeyen ve bozuk dosya açık hatayla döner, fırlatmaz", async () => {
  const eski = await dosyadanMetin("eski.doc", new Uint8Array([1, 2, 3]));
  assert.ok(!eski.ok && /\.docx/.test(eski.hata));
  assert.equal((await dosyadanMetin("resim.png", new Uint8Array([1]))).ok, false);
  assert.equal((await dosyadanMetin("bozuk.pdf", new Uint8Array([1, 2, 3]))).ok, false);
  assert.equal((await dosyadanMetin("bozuk.docx", new Uint8Array([1, 2, 3]))).ok, false);
});

test("htmldenMd: varlıklar çözülür, etiketler atılır", () => {
  assert.equal(htmldenMd("<p>Ar&amp;Ge <strong>payı</strong> &lt; %1</p><ul><li>madde</li></ul>"), "Ar&Ge payı < %1\n\n- madde");
});

import ExcelJS from "exceljs";
import { raporResmiListe, raporSatirlari } from "@ykh/database";
import { NACE_KAYNAK_ETIKET, ONERI_DURUM_ETIKET, onaylayabilir } from "@ykh/domain";
import { KRITERLER, KRITER_ETIKET } from "@ykh/scoring";
import { baglam, kullanici } from "@/lib/oturum.ts";

/**
 * Toplu rapor indirmesi (.xlsx) — ekran değil, indirme ucu.
 *
 * Kapsam SORGUDA: yönetici tüm iller, ajans yalnızca kendi bölgesi
 * (`raporSatirlari`). Burada ayrıca rol kontrolü var çünkü indirme ucu bir
 * URL'dir ve elle çağrılabilir; sorgu fail-closed olsa bile yatırımcıya boş
 * bir çalışma kitabı üretmenin anlamı yok.
 *
 * Excel'in bu üründe bir sözü var: ekranda ne yazıyorsa dosyada da o yazar.
 * Ham AI puanı ile ajans düzeltmesi ayrı kolonlarda durur (`Puan düzeltildi`),
 * model künyesi her satırda taşınır. "Bu sayıyı kim koydu" sorusu dosyada da
 * cevaplanır — provenance ekrandan çıkınca kaybolmaz.
 */

/** Excel'de tarih yerine metin: saat dilimi kayması bir kayıt hatasıdır. */
const gun = (t: string | null) => (t ? t.slice(0, 10) : "");

export async function GET() {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) {
    return new Response("Bu rapora yalnızca ajans ve yönetici erişebilir.", { status: 403 });
  }

  const b = await baglam();
  const [satirlar, resmi] = await Promise.all([raporSatirlari(b), raporResmiListe(b)]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "YKH-KDP";
  wb.created = new Date();

  // ── 1 · Öneriler ────────────────────────────────────────────────────────
  const s1 = wb.addWorksheet("Öneriler", { views: [{ state: "frozen", ySplit: 1 }] });
  s1.columns = [
    { header: "Bölge", key: "ajans_kod", width: 8 },
    { header: "Ajans", key: "ajans", width: 26 },
    { header: "İl", key: "il", width: 14 },
    { header: "İlçe", key: "ilce", width: 14 },
    { header: "Dönem", key: "yil", width: 8 },
    { header: "Köken", key: "koken", width: 9 },
    { header: "Yatırım konusu", key: "baslik", width: 46 },
    { header: "Neden burada? (gerekçe)", key: "gerekce", width: 60 },
    { header: "Durum", key: "durum", width: 16 },
    { header: "NACE", key: "nace_kod", width: 9 },
    { header: "NACE tanımı", key: "nace_tanim", width: 34 },
    { header: "NACE kaynağı", key: "nace_kaynagi", width: 16 },
    { header: "Belge dayanağı", key: "dayanak", width: 13 },
    { header: "Doğrulanmış alıntı", key: "alinti", width: 15 },
    ...KRITERLER.map((kr) => ({ header: KRITER_ETIKET[kr], key: kr, width: 15 })),
    { header: "Puan düzeltildi", key: "duzeltildi", width: 14 },
    { header: "Yapay zekâ gerekçesi", key: "ai_gerekce", width: 60 },
    { header: "Model künyesi", key: "model_snapshot", width: 26 },
    { header: "Prompt sürümü", key: "prompt_surum", width: 18 },
    { header: "Misafir gönderim", key: "misafir", width: 15 },
    { header: "Oluşturuldu", key: "olusturuldu", width: 12 },
    { header: "Onay zamanı", key: "onay_zamani", width: 12 },
  ];

  for (const r of satirlar) {
    const p = r.puanlar ?? {};
    s1.addRow({
      ...r,
      ilce: r.ilce ?? "",
      nace_kod: r.nace_kod ?? "",
      nace_tanim: r.nace_tanim ?? "",
      nace_kaynagi: r.nace_kaynagi
        ? NACE_KAYNAK_ETIKET[r.nace_kaynagi as keyof typeof NACE_KAYNAK_ETIKET]
        : "",
      durum: ONERI_DURUM_ETIKET[r.durum],
      // Değerlendirilmemiş öneride 0 yazmak yanlış olurdu: 0 bir ölçüm,
      // boş ise "henüz ölçülmedi". Excel'de ikisi ayrı kalır.
      dayanak: r.dayanak ?? "",
      ...Object.fromEntries(KRITERLER.map((kr) => [kr, p[kr] ?? ""])),
      duzeltildi: r.duzeltildi ? "evet" : "",
      ai_gerekce: r.ai_gerekce ?? "",
      model_snapshot: r.model_snapshot ?? "",
      prompt_surum: r.prompt_surum ?? "",
      misafir: r.misafir ? "evet" : "",
      olusturuldu: gun(r.olusturuldu),
      onay_zamani: gun(r.onay_zamani),
    });
  }

  // ── 2 · Yürürlükteki resmî liste ────────────────────────────────────────
  const s2 = wb.addWorksheet("Resmî liste", { views: [{ state: "frozen", ySplit: 1 }] });
  s2.columns = [
    { header: "Bölge", key: "ajans_kod", width: 8 },
    { header: "Ajans", key: "ajans", width: 26 },
    { header: "İl", key: "il", width: 14 },
    { header: "Yıl", key: "yil", width: 7 },
    { header: "Sıra", key: "sira", width: 6 },
    { header: "Yatırım konusu", key: "baslik", width: 52 },
    { header: "Gerekçe", key: "gerekce", width: 70 },
    { header: "Tebliğ künyesi", key: "kaynak", width: 44 },
  ];
  for (const r of resmi) s2.addRow(r);

  // ── 3 · Künye ───────────────────────────────────────────────────────────
  //
  // Rapor bir tarih ve kapsam taşımadan dolaşıma girerse "hangi an" sorusu
  // cevapsız kalır. Ekran görüntüsünden farkı bu: dosya elden ele gider.
  const bolgeler = [...new Set(satirlar.map((r) => r.ajans_kod))].sort();
  const s3 = wb.addWorksheet("Künye");
  s3.columns = [
    { header: "Alan", key: "a", width: 28 },
    { header: "Değer", key: "d", width: 76 },
  ];
  for (const [a, d] of [
    ["Rapor", "YKH-KDP toplu öneri raporu"],
    ["Üretildi", new Date().toISOString().slice(0, 19).replace("T", " ")],
    ["Üreten rol", k.rol],
    ["Kapsam", k.rol === "yonetici" ? "Tüm bölgeler" : `Yalnızca ${bolgeler.join(", ") || "—"}`],
    ["Öneri satırı", String(satirlar.length)],
    ["Resmî liste satırı", String(resmi.length)],
    ["Puan kaynağı", "Yapay zekâ ham puanı; ajans düzeltmesi varsa 'Puan düzeltildi' sütunu evet."],
    ["Uyarı", "Puanlar doğrulanmamış taslaktır. Sıralama karar değildir; ajans onayı zorunlu geçittir."],
    ["Uyarı", "Belge dayanağı boş olan satır henüz değerlendirilmemiştir — 0 ile aynı şey değildir."],
  ]) {
    s3.addRow({ a, d });
  }

  for (const ws of [s1, s2, s3]) {
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { vertical: "middle" };
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
  }
  // Uzun metin sütunları sarılır; aksi hâlde gerekçe tek satırda taşıyor.
  for (const key of ["gerekce", "ai_gerekce", "baslik", "nace_tanim"]) {
    const c = s1.getColumn(key);
    if (c) c.alignment = { wrapText: true, vertical: "top" };
  }
  for (const key of ["baslik", "gerekce", "kaynak"]) {
    s2.getColumn(key).alignment = { wrapText: true, vertical: "top" };
  }
  s3.getColumn("d").alignment = { wrapText: true, vertical: "top" };

  const govde = await wb.xlsx.writeBuffer();
  const ad = `ykh-rapor-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(govde as ArrayBuffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${ad}"`,
      "cache-control": "no-store",
    },
  });
}

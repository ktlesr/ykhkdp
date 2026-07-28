import type { Hesap } from "@ykh/domain";

/**
 * Karar raporu.
 *
 * ponytail: docx/xlsx/pdf kütüphanesi yok. Rapor, yazdırmaya hazır tek dosya
 * HTML olarak üretiliyor; tarayıcının "PDF olarak kaydet"i çıktıyı veriyor ve
 * Word bu HTML'i doğrudan açıyor. README §11 zaten siyah-beyaz çıktıda
 * okunabilirlik istiyor — doku ve kenar karakteri burada da korunuyor.
 * Gerçek .docx gerekirse tek dosya değişir.
 */

export type RaporGirdisi = {
  ajans: string;
  il: string;
  donem: string;
  surum: string;
  hesap: Hesap;
  kilitZamani: string | null;
  kilitleyen: string | null;
  gerekceler: Array<{ konu: string; gerekce: string }>;
};

const KACIS: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const k = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => KACIS[c]);

export function kararRaporu(g: RaporGirdisi): string {
  const satirlar = [...g.hesap.ilkDort, ...g.hesap.kalanlar]
    .map((s) =>
      s.bos
        ? `<tr class="bos"><td class="num">${s.sira}</td><td colspan="4"><b>Slot boş — yeterli kanıtlı aday yok.</b><div class="alt">${k(s.gerekce)}</div></td><td class="mono">boş</td></tr>`
        : `<tr class="ep-${s.ep}">
             <td class="num">${s.sira}</td>
             <td>${k(s.ad)}<div class="alt mono">${k(s.nace)}</div></td>
             <td class="mono">${k(s.koken)}</td>
             <td class="num sag">${s.puan}${s.koken === "mevcut" && g.hesap.pay > 0 ? `<div class="alt mono">${s.taban} +${g.hesap.pay}</div>` : ""}</td>
             <td class="num">${s.kanit}/100<div class="alt mono">${s.kanit >= g.hesap.esik ? "eşiği geçti" : "eşik altı"}</div></td>
             <td class="mono">${k(s.sonuc)}</td>
           </tr>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<title>${k(g.il)} ${k(g.donem)} — Yatırım Konusu Kararı</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box }
  body { font-family: "IBM Plex Sans", Georgia, serif; color: #101419; font-size: 11pt; line-height: 1.5; margin: 0 }
  h1 { font-family: "Newsreader", Georgia, serif; font-size: 22pt; font-weight: 500; margin: 0 0 4mm; letter-spacing: -.01em }
  h2 { font-family: "Newsreader", Georgia, serif; font-size: 14pt; font-weight: 500; margin: 8mm 0 3mm }
  .mono, .num { font-family: "IBM Plex Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums }
  .kunye { border: 1px solid #C9C4B8; padding: 4mm; margin-bottom: 6mm; font-size: 9pt }
  .kunye div { margin: 1mm 0 }
  .kunye .etiket { font-family: "IBM Plex Mono", monospace; font-size: 8pt; letter-spacing: .12em; text-transform: uppercase; color: #5C6470 }
  table { width: 100%; border-collapse: collapse; margin: 3mm 0 }
  th { background: #101419; color: #EDE9E0; font-family: "IBM Plex Mono", monospace; font-size: 8pt;
       letter-spacing: .1em; text-transform: uppercase; text-align: left; padding: 2mm 2.5mm; font-weight: 400 }
  td { border-bottom: 1px solid #E9E5DB; padding: 2.5mm; vertical-align: top; font-size: 9.5pt }
  .sag { text-align: right }
  .alt { color: #5C6470; font-size: 8pt; margin-top: 1mm }
  /* Epistemik gramer siyah-beyaz çıktıda da ayırt edilir: kenar karakteri + doku */
  tr.ep-onay td:first-child { border-left: 3px solid #101419 }
  tr.ep-ai   td:first-child { border-left: 3px dashed #101419 }
  tr.ep-yok  td:first-child { border-left: 3px dotted #101419 }
  tr.bos td { background: repeating-linear-gradient(135deg,#FFF 0 3px,#F1EEE7 3px 6px); border-left: 3px dotted #6B6259 }
  .not { border: 1px solid #C9C4B8; padding: 3mm; font-size: 9pt; margin-top: 4mm }
  .uyari { border-left: 3px dashed #8A6A1F; background: #FBF4E2; padding: 3mm; margin: 3mm 0; font-size: 9.5pt }
  footer { margin-top: 8mm; border-top: 1px solid #101419; padding-top: 3mm;
           font-family: "IBM Plex Mono", monospace; font-size: 8pt; color: #5C6470 }
</style></head>
<body>
<h1>${k(g.il)} — ${k(g.donem)} dönemi yatırım konuları</h1>

<div class="kunye">
  <div><span class="etiket">Ajans</span> ${k(g.ajans)}</div>
  <div><span class="etiket">Sürüm</span> <span class="mono">${k(g.surum)}</span></div>
  <div><span class="etiket">Devamlılık payı</span> <span class="mono">+${g.hesap.pay}</span> — gizli katsayı yoktur, sürümlü parametredir</div>
  <div><span class="etiket">Kanıt eşiği</span> <span class="mono">${g.hesap.esik}/100</span></div>
  <div><span class="etiket">Durum</span> ${g.kilitZamani ? `Kilitli · ${k(g.kilitZamani)} · ${k(g.kilitleyen ?? "")}` : "Taslak · kilitlenmedi"}</div>
</div>

${g.hesap.ucDurum ? `<div class="uyari"><b>Uç durum: ${k(g.hesap.ucDurum.baslik)}</b><br>${k(g.hesap.ucDurum.metin)}</div>` : ""}

<h2>Sıralama</h2>
<table>
  <thead><tr><th>Sıra</th><th>Yatırım konusu</th><th>Köken</th><th class="sag">Stratejik</th><th>Kanıt yeterliliği</th><th>Sonuç</th></tr></thead>
  <tbody>${satirlar}</tbody>
</table>

<div class="not">
  Özet: <b>${g.hesap.ozet.korunuyor}</b> korunuyor · <b>${g.hesap.ozet.ekleniyor}</b> ekleniyor ·
  <b>${g.hesap.ozet.cikiyor}</b> çıkıyor · <b>${g.hesap.ozet.bosSlot}</b> boş slot.
  4. ile 5. arasındaki fark ${g.hesap.fark === null ? "hesaplanamadı" : `<span class="mono">${g.hesap.fark}</span> puan`};
  sıralama sağlamlığı <span class="mono">${g.hesap.saglamlik}/100</span>.
</div>

${g.gerekceler.length ? `<h2>Kurul gerekçeleri</h2>${g.gerekceler.map((x) => `<div class="not"><b>${k(x.konu)}</b><br>${k(x.gerekce)}</div>`).join("")}` : ""}

<footer>
  Sıralama yalnızca uzman onaylı kanıtla hesaplanır. AI bulguları puana girmez.
  Destek sayısı puan girdisi değildir. Sıralama karar değildir; kararı il değerlendirme kurulu verir.<br>
  Ağırlık seti sürümü ${k(g.hesap.agirlikSurumu)}.
</footer>
</body></html>`;
}

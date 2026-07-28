import assert from "node:assert/strict";
import test from "node:test";
import type { Hesap } from "@ykh/domain";
import { kararRaporu } from "./index.ts";

const HESAP: Hesap = {
  ilkDort: [
    { bos: false, sira: 1, id: "1", ad: "Teknik tekstil", koken: "mevcut", taban: 73, kanit: 82, nace: "NACE 13.95", ep: "onay", puan: 78, sonuc: "korunuyor", esikDevri: false, esikAlti: false },
    { bos: true, sira: 2, gerekce: "Yeterli kanıtlı aday yok." },
  ],
  kalanlar: [
    { bos: false, sira: 3, id: "2", ad: "<script>alert(1)</script>", koken: "yeni", taban: 60, kanit: 20, nace: "NACE 00", ep: "yok", puan: 60, sonuc: "yedek", esikDevri: false, esikAlti: false },
  ],
  ozet: { korunuyor: 1, ekleniyor: 0, cikiyor: 0, bosSlot: 1 },
  fark: 18,
  saglamlik: 96,
  ucDurum: { baslik: "4 slottan biri boş kalıyor", metin: "Gerekçe zorunlu." },
  pay: 5,
  esik: 55,
  agirlikSurumu: "TR33-2027-v1",
};

const RAPOR = kararRaporu({
  ajans: "Zafer KA", il: "Uşak", donem: "2027", surum: "TR33-2027-v1",
  hesap: HESAP, kilitZamani: null, kilitleyen: null,
  gerekceler: [{ konu: "2. slot", gerekce: "Kanıt talebi açıldı." }],
});

test("rapor devamlılık payını yazıyla ilan eder", () => {
  assert.match(RAPOR, /Devamlılık payı<\/span> <span class="mono">\+5<\/span>/);
  assert.match(RAPOR, /gizli katsayı yoktur/i);
});

test("boş slot raporda gerekçesiyle görünür", () => {
  assert.match(RAPOR, /Slot boş — yeterli kanıtlı aday yok/);
});

test("epistemik gramer siyah-beyaz için kenar karakteriyle taşınır", () => {
  assert.match(RAPOR, /tr\.ep-onay td:first-child \{ border-left: 3px solid/);
  assert.match(RAPOR, /tr\.ep-ai   td:first-child \{ border-left: 3px dashed/);
  assert.match(RAPOR, /tr\.ep-yok  td:first-child \{ border-left: 3px dotted/);
});

test("destek sayısı ve AI kuralı dipnotta yazılı", () => {
  assert.match(RAPOR, /Destek sayısı puan girdisi değildir/);
  assert.match(RAPOR, /AI bulguları puana girmez/);
});

test("HTML kaçışı yapılır", () => {
  assert.equal(RAPOR.includes("<script>alert(1)</script>"), false);
  assert.match(RAPOR, /&lt;script&gt;/);
});

test("sürüm damgası taşır", () => {
  assert.match(RAPOR, /TR33-2027-v1/);
});

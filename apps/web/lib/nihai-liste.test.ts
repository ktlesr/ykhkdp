import assert from "node:assert/strict";
import test from "node:test";
import type { DonemKaydi, NihaiIl } from "@ykh/database";
import type { Aday } from "@ykh/domain";
import { TR33_2027_V1 } from "@ykh/scoring";
import { nihaiExcel, nihaiHesapla, nihaiWord } from "./nihai-liste.ts";

const D = { donemId: 1, ilKod: "usak", il: "Uşak", ajansKod: "TR33", ajans: "ZAFER", yil: "2027", set: TR33_2027_V1, kalibre: true } as DonemKaydi;
// Birbirinden farklı konular: "Konu 1/2/…" gibi yalnızca numarası farklı adlar
// aynı konu sayılır (sıralama tekrarı eler) — test verisi gerçekçi olmalı.
const URUNLER = ["seramik", "tekstil", "deri", "mermer", "zeytin", "bor", "kaolen", "termal", "jeotermal", "lojistik", "dayanaksiz", "a", "b"];
const aday = (id: string, taban: number, dayanak = 80): Aday => ({
  id, ad: `${URUNLER[Number(id) - 1] ?? id} ürünleri üretimi`, koken: "yeni", taban, dayanak, nace: null,
});

const IL: NihaiIl = {
  il: "Uşak", ilKod: "usak", ajans: "Zafer Kalkınma Ajansı", ajansKod: "TR33", donem: D,
  // Dayanaksız aday listenin ortasında: eşiği geçemez, nihai listeye girmez.
  adaylar: Array.from({ length: 10 }, (_, i) => aday(String(i + 1), 90 - i * 3)).concat([aday("dayanaksiz", 70, 5)]),
  detay: new Map(), bekleyen: 2,
};
const DONEMSIZ: NihaiIl = { il: "Ankara", ilKod: "ankara", ajans: "Ankara Kalkınma Ajansı", ajansKod: "TR51", donem: null, adaylar: [], detay: new Map(), bekleyen: 0 };

test("nihai liste: en çok slot kadar asıl + slot kadar yedek; liste dışı ve dayanaksız girmez", () => {
  const { satirlar, ozet } = nihaiHesapla([IL, DONEMSIZ]);
  const usak = satirlar.filter((s) => s.il === "Uşak");
  assert.equal(usak.filter((s) => s.bolum === "Asıl").length, TR33_2027_V1.slotSayisi);
  assert.equal(usak.filter((s) => s.bolum === "Yedek").length, TR33_2027_V1.slotSayisi);
  assert.ok(!usak.some((s) => s.baslik.startsWith("dayanaksiz")), "dayanaksız nihai listeye girmez");
  assert.deepEqual(usak.slice(0, 4).map((s) => s.sira), [1, 2, 3, 4]);
  assert.equal(usak[0].baslik, "seramik ürünleri üretimi", "en yüksek puan en üstte");
  // Eksik gizlenmez: bekleyen sayısı ve dönemsiz il özette.
  assert.equal(ozet.find((o) => o.il === "Uşak")?.bekleyen, 2);
  assert.equal(ozet.find((o) => o.il === "Ankara")?.donemVar, false);
});

test("Excel ve Word geçerli dosya üretir", async () => {
  const x = await nihaiExcel([IL], "Uşak");
  const w = await nihaiWord([IL, DONEMSIZ], "Tüm iller");
  // İkisi de OOXML (zip): "PK" imzası.
  assert.equal(x.subarray(0, 2).toString(), "PK");
  assert.equal(w.subarray(0, 2).toString(), "PK");
  assert.ok(x.length > 2000 && w.length > 2000);
});

test("dayanak eşiği sıralamayı ezer: en yüksek puanlı aday dayanaksızsa slotu BOŞ kalır", () => {
  const il: NihaiIl = { ...IL, adaylar: [aday("dayanaksiz", 99, 5), aday("a", 60), aday("b", 55)] };
  const usak = nihaiHesapla([il]).satirlar;
  assert.equal(usak[0].bolum, "Boş slot", "devir sınırı dışındaki aday slotu devralmaz");
  assert.ok(!usak.some((s) => s.baslik.startsWith("dayanaksiz")));
});

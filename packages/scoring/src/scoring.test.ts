import assert from "node:assert/strict";
import test from "node:test";
import type { Aday } from "@ykh/domain";
import { agirlikSetiGecerli, grupAgirligi, gruplaraGore, KRITERLER, TR33_2027_V1, YERELLIK_TABANI, type AgirlikSeti } from "./kriterler.ts";
import { kirilim, kriterPuanlariniTopla, stratejikPuan, type KriterPuanlari } from "./puan.ts";
import { ayardan, hesapla, slotKimlikleri } from "./siralama.ts";
import { adaylariPuanla, kriterDuyarliligi, senaryolariCalistir } from "./duyarlilik.ts";

const AYAR = ayardan(TR33_2027_V1);

const a = (o: Partial<Aday> & { id: string; taban: number; dayanak: number }): Aday => ({
  ad: o.id,
  koken: "yeni",
  nace: "13.10",
  ...o,
});

const USAK: Aday[] = [
  a({ id: "teknik-tekstil", ad: "Teknik tekstil", koken: "mevcut", taban: 73, dayanak: 82 }),
  a({ id: "elyaf", ad: "Geri dönüştürülmüş elyaf", taban: 74, dayanak: 77 }),
  a({ id: "deri", ad: "Deri ihtisas", koken: "mevcut", taban: 66, dayanak: 71 }),
  a({ id: "kurutma", ad: "Tarımsal kurutma", taban: 69, dayanak: 41 }),
  a({ id: "jeotermal", ad: "Jeotermal sera", taban: 58, dayanak: 63 }),
  a({ id: "batarya", ad: "Batarya kalıp", taban: 57, dayanak: 29 }),
  a({ id: "seramik", ad: "Seramik kaplama", koken: "mevcut", taban: 53, dayanak: 64 }),
  a({ id: "sut", ad: "Süt işleme", koken: "mevcut", taban: 49, dayanak: 38 }),
];

// ── ağırlık seti ───────────────────────────────────────────────────────────

test("TR33-2027-v1 ağırlıkları 1'e toplanır", () => {
  assert.equal(agirlikSetiGecerli(TR33_2027_V1).gecerli, true);
});

test("bozuk ağırlık seti fail-closed reddedilir", () => {
  const bozuk: AgirlikSeti = { ...TR33_2027_V1, agirliklar: { ...TR33_2027_V1.agirliklar, plan_uyumu: 0.5 } };
  assert.equal(agirlikSetiGecerli(bozuk).gecerli, false);
});

// ── "neden burada?" — programın asıl sorusu ────────────────────────────────

test("“Neden burada?” grubu en az %40 ve en büyük paydır", () => {
  const yerellik = grupAgirligi(TR33_2027_V1.agirliklar, "yerellik");
  assert.ok(yerellik >= YERELLIK_TABANI, `yerellik payı ${yerellik} < ${YERELLIK_TABANI}`);
  assert.equal(yerellik, 0.44);

  const digerleri = (["etki", "gerceklesme", "uyum"] as const).map((g) =>
    grupAgirligi(TR33_2027_V1.agirliklar, g),
  );
  assert.ok(digerleri.every((x) => x < yerellik), "yerellik en büyük grup olmalı");
});

test("yerellik payı tabanın altına düşen ağırlık seti reddedilir", () => {
  // yerel_potansiyel'den 0.10 alıp plan_uyumu'na verirsek yerellik %34'e düşer
  const zayif: AgirlikSeti = {
    ...TR33_2027_V1,
    agirliklar: { ...TR33_2027_V1.agirliklar, yerel_potansiyel: 0.08, plan_uyumu: 0.22 },
  };
  const r = agirlikSetiGecerli(zayif);
  assert.equal(r.gecerli, false);
  assert.match(r.sebep ?? "", /Neden burada/);
  assert.match(r.sebep ?? "", /%34/);
});

test("yerellik taban üstünde ama en büyük değilse reddedilir", () => {
  // yerellik %40, etki %42 → toplam 1 ama yerellik en büyük değil
  const dengesiz: AgirlikSeti = {
    ...TR33_2027_V1,
    agirliklar: {
      yerel_potansiyel: 0.16, deger_zinciri: 0.12, uygulanabilirlik: 0.12, // yerellik 0.40
      istihdam_katma_deger: 0.32, surdurulebilirlik: 0.10,                 // etki 0.42
      pazar_talep: 0.08, yatirimci_ilgisi: 0.06,                            // gerçekleşme 0.14
      plan_uyumu: 0.04,                                                     // uyum 0.04
    },
  };
  assert.equal(agirlikSetiGecerli(dengesiz).gecerli, false);
});

test("her kriter tam olarak bir gruba ait", () => {
  const gruplanan = gruplaraGore(TR33_2027_V1.agirliklar).flatMap((g) => g.kriterler);
  assert.equal(gruplanan.length, KRITERLER.length);
  assert.equal(new Set(gruplanan).size, KRITERLER.length);
  const toplam = gruplaraGore(TR33_2027_V1.agirliklar).reduce((t, g) => t + g.agirlik, 0);
  assert.ok(Math.abs(toplam - 1) < 1e-9);
});

test("yerel gerekçesi güçlü aday, yalnızca pazarı güçlü adayı geçer", () => {
  const yerelGuclu = tumu(50);
  yerelGuclu.yerel_potansiyel = 95;
  yerelGuclu.deger_zinciri = 95;
  yerelGuclu.uygulanabilirlik = 95;

  const pazarGuclu = tumu(50);
  pazarGuclu.pazar_talep = 95;
  pazarGuclu.yatirimci_ilgisi = 95;
  pazarGuclu.istihdam_katma_deger = 95;

  assert.ok(
    stratejikPuan(yerelGuclu, TR33_2027_V1) > stratejikPuan(pazarGuclu, TR33_2027_V1),
    "yerel gerekçesi ağır basmalı",
  );
});

// ── puan ───────────────────────────────────────────────────────────────────

const tumu = (n: number): KriterPuanlari =>
  Object.fromEntries(KRITERLER.map((k) => [k, n])) as KriterPuanlari;

test("tüm kriterler 80 ise puan 80", () => {
  assert.equal(stratejikPuan(tumu(80), TR33_2027_V1), 80);
});

test("puan kırılımı sekiz kalem verir ve toplamı tutar", () => {
  const k = kirilim(tumu(60), TR33_2027_V1);
  assert.equal(k.kalemler.length, 8);
  assert.equal(Math.round(k.toplam), 60);
});

test("doğrulanmamış kriter girdisi puana girmez ve eksik olarak işaretlenir", () => {
  const { puanlar, eksik } = kriterPuanlariniTopla([
    { kriter: "plan_uyumu", puan: 90, dogrulanmis: true },
    { kriter: "pazar_talep", puan: 95, dogrulanmis: false },
  ]);
  assert.equal(puanlar.plan_uyumu, 90);
  assert.equal(puanlar.pazar_talep, 0);
  assert.ok(eksik.includes("pazar_talep"));
  assert.equal(eksik.includes("plan_uyumu"), false);
});

test("destek sayısı puanlama imzasında yok", () => {
  // stratejikPuan(puanlar, set) — üçüncü parametre yok. Derleyici garantisi;
  // bu test niyeti kayda geçirir.
  assert.equal(stratejikPuan.length, 2);
});

// ── slot doldurma ──────────────────────────────────────────────────────────

test("eşiği geçemeyen yüksek puanlı aday slot dolduramaz", () => {
  const h = hesapla(USAK, AYAR);
  assert.equal(slotKimlikleri(h).includes("kurutma"), false);
  assert.equal(h.kalanlar.find((s) => s.id === "kurutma")?.sonuc, "dayanaksız");
});

test("devir sınırı aşılırsa slot boş kalır", () => {
  const h = hesapla(USAK, AYAR);
  assert.deepEqual(slotKimlikleri(h), ["teknik-tekstil", "elyaf", "deri", null]);
  assert.equal(h.ozet.bosSlot, 1);
  assert.match(h.ucDurum?.baslik ?? "", /boş kalıyor/);
});

test("devir sınırı içindeyse alt aday devralır", () => {
  const veri = USAK.map((x) => (x.id === "kurutma" ? { ...x, taban: 63 } : x));
  const h = hesapla(veri, AYAR);
  assert.deepEqual(slotKimlikleri(h), ["teknik-tekstil", "elyaf", "deri", "jeotermal"]);
  const d = h.ilkDort.find((s) => !s.bos && s.id === "jeotermal");
  assert.equal(d && !d.bos && d.esikDevri, true);
});

test("devamlılık payı 0 iken sıralama değişir ve pay çıktıda ilan edilir", () => {
  const pay5 = hesapla(USAK, AYAR);
  const pay0 = hesapla(USAK, ayardan(TR33_2027_V1, { devamlilikPayi: 0 }));
  assert.equal(slotKimlikleri(pay5)[0], "teknik-tekstil");
  assert.equal(slotKimlikleri(pay0)[0], "elyaf");
  assert.equal(pay5.pay, 5);
  assert.equal(pay0.pay, 0);
  assert.equal(pay5.agirlikSurumu, "TR33-2027-v1");
});

test("sabit koruma tabanı yok — dört slot da yeni adayla dolabilir", () => {
  const veri = [
    a({ id: "y1", taban: 90, dayanak: 90 }),
    a({ id: "y2", taban: 88, dayanak: 80 }),
    a({ id: "y3", taban: 86, dayanak: 70 }),
    a({ id: "y4", taban: 84, dayanak: 60 }),
    a({ id: "m1", koken: "mevcut", taban: 40, dayanak: 90 }),
  ];
  const h = hesapla(veri, AYAR);
  assert.deepEqual(slotKimlikleri(h), ["y1", "y2", "y3", "y4"]);
  assert.equal(h.ozet.korunuyor, 0);
  assert.match(h.ucDurum?.baslik ?? "", /tamamı değişiyor/);
});

test("dört slotun tamamı boş kalabilir", () => {
  const veri = [1, 2, 3, 4].map((n) => a({ id: `a${n}`, taban: 100 - n * 20, dayanak: 10 }));
  const h = hesapla(veri, AYAR);
  assert.deepEqual(slotKimlikleri(h), [null, null, null, null]);
  assert.equal(h.ozet.bosSlot, 4);
});

test("dört konunun tamamı korunabilir", () => {
  const veri = [
    a({ id: "m1", koken: "mevcut", taban: 80, dayanak: 90 }),
    a({ id: "m2", koken: "mevcut", taban: 78, dayanak: 90 }),
    a({ id: "m3", koken: "mevcut", taban: 76, dayanak: 90 }),
    a({ id: "m4", koken: "mevcut", taban: 74, dayanak: 90 }),
    a({ id: "y1", taban: 60, dayanak: 90 }),
  ];
  const h = hesapla(veri, AYAR);
  assert.equal(h.ozet.korunuyor, 4);
  assert.match(h.ucDurum?.baslik ?? "", /tamamı korunuyor/);
});

test("mevcut konular her dönem yeniden puanlanır — pay dışında ayrıcalık yok", () => {
  const mevcut = a({ id: "m", koken: "mevcut", taban: 50, dayanak: 90 });
  const yeni = a({ id: "y", koken: "yeni", taban: 56, dayanak: 90 });
  const h = hesapla([mevcut, yeni], ayardan(TR33_2027_V1, { devamlilikPayi: 5, slotSayisi: 1 }));
  assert.deepEqual(slotKimlikleri(h), ["y"]); // 56 > 50+5
});

test("slot sayısı parametredir — kodda 4 sabitlenmemiştir", () => {
  const h = hesapla(USAK, ayardan(TR33_2027_V1, { slotSayisi: 2 }));
  assert.equal(h.ilkDort.length, 2);
  assert.equal(h.kalanlar[0].sira, 3);
});

test("eşit puanda sıralama deterministik (id'ye göre)", () => {
  const veri = [a({ id: "b", taban: 70, dayanak: 90 }), a({ id: "a", taban: 70, dayanak: 90 })];
  assert.deepEqual(slotKimlikleri(hesapla(veri, AYAR)).slice(0, 2), ["a", "b"]);
  assert.deepEqual(slotKimlikleri(hesapla([...veri].reverse(), AYAR)).slice(0, 2), ["a", "b"]);
});

// ── senaryo ve duyarlılık ──────────────────────────────────────────────────

test("senaryo çıktısı kaydedilmez olarak işaretlenir", () => {
  const s = senaryolariCalistir(USAK, TR33_2027_V1, [{ ad: "pay yok", ezme: { devamlilikPayi: 0 } }]);
  assert.equal(s[0].kaydedilmez, true);
  assert.equal(s[0].ilkDortDegisti, true);
  assert.match(s[0].hesap.agirlikSurumu, /senaryo/);
});

test("duyarlılık sekiz kriter için sonuç döndürür", () => {
  const girdiler = USAK.map((x) => ({ ...x, kriterPuanlari: tumu(x.taban) }));
  const d = kriterDuyarliligi(girdiler, TR33_2027_V1);
  assert.equal(d.length, 8);
  // tüm kriterler eşit puanlıysa ağırlık oynatmak sıralamayı değiştirmez
  assert.equal(d.every((x) => x.ilkDortDegisti === false), true);
});

test("adaylariPuanla taban puanı kriterlerden türetir", () => {
  const [x] = adaylariPuanla([{ ...USAK[0], kriterPuanlari: tumu(64) }], TR33_2027_V1);
  assert.equal(x.taban, 64);
});

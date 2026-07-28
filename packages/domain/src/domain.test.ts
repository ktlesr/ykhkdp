import assert from "node:assert/strict";
import test from "node:test";
import { gecisIzinli, olasiGecisler, siralamayaGirer } from "./oneri.ts";
import { epistemik, kanitPotansiyeli, kanitYeterliligi, puanlamayaGirer } from "./kanit.ts";
import { donemGecisIzinli, kilitOnayiGecerli, saltOkunur } from "./donem.ts";
import { gorebilir } from "./roller.ts";

test("tanımsız geçiş fail-closed reddedilir", () => {
  assert.equal(gecisIzinli("taslak", "konu_adayi", "ajans_uzmani", false).izinli, false);
  assert.equal(gecisIzinli("reddedildi", "triyaj", "sistem_yoneticisi", false).izinli, false);
});

test("birey yalnızca kendi önerisini yürütür", () => {
  assert.equal(gecisIzinli("taslak", "kanit_bekliyor", "birey", true).izinli, true);
  assert.equal(gecisIzinli("taslak", "kanit_bekliyor", "birey", false).izinli, false);
});

test("kurum onayı diye bir durum yok — INSTITUTION_REVIEW çıkarıldı", () => {
  const hedefler = olasiGecisler("kanit_bekliyor", "ajans_uzmani", false).map((g) => g.to);
  assert.deepEqual(hedefler, ["triyaj", "birlestirildi"]);
});

test("gözlemci ve denetçi hiçbir geçiş tetikleyemez", () => {
  for (const rol of ["gozlemci", "denetci"] as const) {
    assert.equal(olasiGecisler("triyaj", rol, false).length, 0);
    assert.equal(olasiGecisler("uzman_incelemesinde", rol, false).length, 0);
  }
});

test("yalnızca konu_adayi sıralamaya girer", () => {
  assert.equal(siralamayaGirer("konu_adayi"), true);
  assert.equal(siralamayaGirer("uzman_incelemesinde"), false);
});

test("puanlamaya yalnızca uzman onaylı kanıt girer", () => {
  assert.equal(puanlamayaGirer("uzman_onayli"), true);
  for (const d of ["beyan", "ai_bulgusu", "celiskili", "reddedildi"] as const) {
    assert.equal(puanlamayaGirer(d), false);
  }
});

test("kanıt yeterliliği AI bulgusunu saymaz, potansiyel sayar", () => {
  const kanitlar = [
    { agirlik: 40, durum: "uzman_onayli" as const },
    { agirlik: 30, durum: "ai_bulgusu" as const },
    { agirlik: 20, durum: "reddedildi" as const },
  ];
  assert.equal(kanitYeterliligi(kanitlar), 40);
  assert.equal(kanitPotansiyeli(kanitlar), 70);
});

test("epistemik gramer üç duruma indirger", () => {
  assert.equal(epistemik("uzman_onayli"), "onay");
  assert.equal(epistemik("ai_bulgusu"), "ai");
  assert.equal(epistemik("reddedildi"), "yok");
});

test("kilit yalnızca kurul üyesinde, kilitten çıkış yok", () => {
  assert.equal(donemGecisIzinli("degerlendirme", "kilitli", "kurul_uyesi"), true);
  assert.equal(donemGecisIzinli("degerlendirme", "kilitli", "ajans_uzmani"), false);
  assert.equal(donemGecisIzinli("kilitli", "degerlendirme", "sistem_yoneticisi"), false);
  assert.equal(saltOkunur("kilitli"), true);
});

test("kilit onay kelimesi Türkçe büyük harf kuralına uyar", () => {
  assert.equal(kilitOnayiGecerli("kilitle"), true);
  assert.equal(kilitOnayiGecerli(" KİLİTLE "), true);
  assert.equal(kilitOnayiGecerli("KILITLE"), false);
});

test("erişim sınıfı: birey yalnızca kamuya açık veriyi görür", () => {
  assert.equal(gorebilir("birey", "kamuya_acik"), true);
  assert.equal(gorebilir("birey", "kisitli"), false);
  assert.equal(gorebilir("denetci", "gizli"), true);
  assert.equal(gorebilir("kurul_uyesi", "gizli"), false);
});

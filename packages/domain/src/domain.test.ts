import assert from "node:assert/strict";
import test from "node:test";
import { gecisIzinli, gorebilir, olasiGecisler, onaylayabilir, siralamayaGirer } from "./index.ts";

test("tanımsız geçiş fail-closed reddedilir", () => {
  assert.equal(gecisIzinli("degerlendiriliyor", "listede", "ajans").izinli, false);
});

test("yatırımcı hiçbir geçiş tetikleyemez", () => {
  assert.equal(olasiGecisler("onay_bekliyor", "yatirimci").length, 0);
  assert.equal(gecisIzinli("onay_bekliyor", "listede", "yatirimci").izinli, false);
});

test("listeye alma yalnızca onaylayan rollerde", () => {
  assert.equal(gecisIzinli("onay_bekliyor", "listede", "ajans").izinli, true);
  assert.equal(onaylayabilir("ajans"), true);
  assert.equal(onaylayabilir("yatirimci"), false);
});

test("ret gerekçe ister, onay istemez", () => {
  const ret = gecisIzinli("onay_bekliyor", "reddedildi", "ajans");
  assert.equal(ret.izinli && ret.gecis.gerekceZorunlu, true);
  const onay = gecisIzinli("onay_bekliyor", "listede", "ajans");
  assert.equal(onay.izinli && onay.gecis.gerekceZorunlu, false);
});

test("onay geri alınabilir — kilit yok", () => {
  assert.equal(gecisIzinli("listede", "onay_bekliyor", "ajans").izinli, true);
});

test("yalnızca listede olan öneri sıralamaya girer", () => {
  assert.equal(siralamayaGirer("listede"), true);
  assert.equal(siralamayaGirer("onay_bekliyor"), false);
});

test("anonim ve yatırımcı yalnızca kamuya açık veriyi görür", () => {
  assert.equal(gorebilir("anonim", "kamuya_acik"), true);
  assert.equal(gorebilir("yatirimci", "kurum_ici"), false);
  assert.equal(gorebilir("ajans", "kurum_ici"), true);
  assert.equal(gorebilir("ajans", "gizli"), false);
  assert.equal(gorebilir("yonetici", "gizli"), true);
});

import assert from "node:assert/strict";
import test from "node:test";
import { bulguyuDogrula, kaynakPaketiKur, puanlamaGiriseHazir, sayisalTokenlar, type KaynakKaydi } from "./index.ts";

const METIN =
  "Uşak ilinde tekstil ürünleri imalatı, il imalat sanayi katma değerinin yüzde %41,3 kadarını " +
  "oluşturmakta; 2019-2024 döneminde reel artış %12,6 düzeyinde gerçekleşmiştir.";

const KAYIT: Omit<KaynakKaydi, "pakete_dahil"> = {
  evidenceId: "KNT-2026-0431",
  accessClass: "kamuya_acik",
  belgeMetni: METIN,
  spanBaslangic: 0,
  spanBitis: 60,
};

const paket = kaynakPaketiKur("paket-1", [KAYIT], "ajans_uzmani");

test("geçerli bulgu doğrulanır", () => {
  const s = bulguyuDogrula(
    { metin: "Tekstil, katma değerin %41,3 kadarını oluşturuyor.", evidenceIds: ["KNT-2026-0431"] },
    paket,
    "ajans_uzmani",
  );
  assert.equal(s.gecerli, true);
});

test("kaynaksız sayı reddedilir", () => {
  const s = bulguyuDogrula(
    { metin: "Sektör istihdamı 12.400 kişidir.", evidenceIds: ["KNT-2026-0431"] },
    paket,
    "ajans_uzmani",
  );
  assert.equal(s.gecerli, false);
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "kaynaksiz_sayi"));
});

test("sahte kaynak reddedilir", () => {
  const s = bulguyuDogrula({ metin: "Bir iddia.", evidenceIds: ["KNT-9999-0001"] }, paket, "ajans_uzmani");
  assert.equal(s.gecerli, false);
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "evidence_id_yok"));
});

test("kaynaksız bulgu reddedilir", () => {
  const s = bulguyuDogrula({ metin: "Kaynaksız iddia.", evidenceIds: [] }, paket, "ajans_uzmani");
  assert.equal(s.gecerli, false);
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "kaynak_gosterilmedi"));
});

test("yetkisiz kanıt pakete hiç girmez", () => {
  const gizli = kaynakPaketiKur("p", [{ ...KAYIT, accessClass: "gizli" }], "birey");
  assert.equal(gizli.kayitlar.length, 0);
  const s = bulguyuDogrula({ metin: "İddia.", evidenceIds: ["KNT-2026-0431"] }, gizli, "birey");
  assert.equal(s.gecerli, false);
});

test("pakete dahil edilmemiş kanıt reddedilir — model onu görmüş olamaz", () => {
  const sahte = { id: "p", kayitlar: [{ ...KAYIT, pakete_dahil: false }] };
  const s = bulguyuDogrula({ metin: "İddia.", evidenceIds: ["KNT-2026-0431"] }, sahte, "ajans_uzmani");
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "pakette_yok"));
});

test("geçersiz span reddedilir", () => {
  const bozuk = kaynakPaketiKur("p", [{ ...KAYIT, spanBaslangic: 10, spanBitis: 99999 }], "ajans_uzmani");
  const s = bulguyuDogrula({ metin: "İddia.", evidenceIds: ["KNT-2026-0431"] }, bozuk, "ajans_uzmani");
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "span_gecersiz"));
});

test("belgede olmayan alıntı reddedilir", () => {
  const s = bulguyuDogrula(
    { metin: "İddia.", evidenceIds: ["KNT-2026-0431"], alinti: "Bu cümle belgede yok." },
    paket,
    "ajans_uzmani",
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "alinti_eslesmiyor"));
});

test("yıllar sayısal iddia sayılmaz", () => {
  assert.equal(sayisalTokenlar("2027 döneminde").length, 0);
  assert.ok(sayisalTokenlar("%41,3 oranında").length > 0);
});

test("doğrulama tek başına yetmez — uzman onayı zorunlu geçit", () => {
  const s = bulguyuDogrula(
    { metin: "Tekstil, katma değerin %41,3 kadarını oluşturuyor.", evidenceIds: ["KNT-2026-0431"] },
    paket,
    "ajans_uzmani",
  );
  assert.equal(puanlamaGiriseHazir(s, false), false);
  assert.equal(puanlamaGiriseHazir(s, true), true);
});

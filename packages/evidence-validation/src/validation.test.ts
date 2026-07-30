import assert from "node:assert/strict";
import test from "node:test";
import { dayanakPuani, degerlendirmeyiDogrula, paketKur, sayisalTokenlar } from "./index.ts";

const METIN =
  "TR33 Bölgesi'nde tekstil ve deri öncelikli imalat sektörleridir. " +
  "Tekstil geri dönüşümü katma değeri yükseltecek dönüşüm alanı olarak tanımlanmıştır.";

const PAKET = paketKur("p", [
  { id: 1, ad: "TR33 Bölge Planı", metin: METIN },
  { id: 2, ad: "OVP 2026", metin: "Enerji verimliliği yatırımları teşvik edilecektir." },
]);

const puanlar = [{ puan: 60 }];

test("birebir alıntı geçer", () => {
  const s = degerlendirmeyiDogrula(
    { gerekce: "Bölge planı önceliklerine uygundur.", alintilar: [{ belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" }], puanlar },
    PAKET,
  );
  assert.equal(s.gecerli, true);
  assert.ok(s.gecerli && s.dayanak > 0);
});

test("uydurulmuş alıntı reddedilir", () => {
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 1, alinti: "bu cümle belgede yok" }], puanlar },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "alinti_eslesmiyor"));
});

test("olmayan belge reddedilir", () => {
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 99, alinti: "tekstil ve deri" }], puanlar },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "belge_yok"));
});

test("pakete dahil olmayan belge reddedilir — model onu görmüş olamaz", () => {
  const sahte = { id: "p", belgeler: [{ id: 1, ad: "x", metin: METIN, pakete_dahil: false }] };
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 1, alinti: "tekstil ve deri" }], puanlar },
    sahte,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "pakette_yok"));
});

test("kaynaksız sayı reddedilir, yıllar sayılmaz", () => {
  const s = degerlendirmeyiDogrula(
    { gerekce: "Sektörde 12.400 kişi çalışıyor.", alintilar: [], puanlar },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "kaynaksiz_sayi"));
  assert.equal(sayisalTokenlar("2027 döneminde").length, 0);

  const y = degerlendirmeyiDogrula({ gerekce: "2027 döneminde uygundur.", alintilar: [], puanlar }, PAKET);
  assert.equal(y.gecerli, true);
});

test("puan aralığı dışı reddedilir", () => {
  const s = degerlendirmeyiDogrula({ gerekce: "Uygundur.", alintilar: [], puanlar: [{ puan: 140 }] }, PAKET);
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "puan_araligi"));
});

test("alıntısız çıktı geçerli ama dayanak 0 — slot dolduramaz", () => {
  const s = degerlendirmeyiDogrula({ gerekce: "Uygundur.", alintilar: [], puanlar }, PAKET);
  assert.equal(s.gecerli, true);
  assert.equal(s.gecerli && s.dayanak, 0);
});

test("azınlıkta kalan eşleşmeyen alıntı düşürülür, çıktı ayakta kalır", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Bölge planı önceliklerine uygundur.",
      alintilar: [
        { belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { belge_id: 1, alinti: "katma değeri yükseltecek dönüşüm alanı" },
        { belge_id: 2, alinti: "Enerji verimliliği yatırımları" },
        { belge_id: 1, alinti: "bu cümle belgede hiç yok" },
      ],
      puanlar,
    },
    PAKET,
  );
  assert.equal(s.gecerli, true, "1/4 düşen alıntı tüm değerlendirmeyi çöpe atmaz");
  assert.equal(s.gecerli && s.dogrulanan.length, 3);
  assert.equal(s.gecerli && s.dusenler.length, 1);
  // Dayanak yalnızca doğrulanan üç alıntıdan hesaplanır.
  assert.equal(s.gecerli && s.dayanak, dayanakPuani(s.gecerli ? s.dogrulanan : [], PAKET));
});

test("çoğunluk eşleşmiyorsa çıktının tamamı reddedilir", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Uygundur.",
      alintilar: [
        { belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { belge_id: 1, alinti: "bu cümle belgede hiç yok" },
        { belge_id: 1, alinti: "bu cümle de belgede hiç yok" },
      ],
      puanlar,
    },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "alinti_eslesmiyor"));
});

test("paket dışı belge tek başına bile sert reddedilir — güvenlik ihlali", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Uygundur.",
      alintilar: [
        { belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { belge_id: 1, alinti: "katma değeri yükseltecek dönüşüm alanı" },
        { belge_id: 2, alinti: "Enerji verimliliği yatırımları" },
        { belge_id: 99, alinti: "tekstil ve deri" },
      ],
      puanlar,
    },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "belge_yok"), "azınlıkta olsa da düşürülmez");
});

test("dayanak puanı belge çeşitliliğiyle artar", () => {
  const tek = dayanakPuani([{ belge_id: 1, alinti: "a" }], PAKET);
  const cift = dayanakPuani([{ belge_id: 1, alinti: "a" }, { belge_id: 2, alinti: "b" }], PAKET);
  assert.ok(cift > tek);
});

test("kıvrık kesme işareti ve tire farkı alıntıyı reddetmez", () => {
  const paket = paketKur("p", [{ id: 1, ad: "X", metin: "Kayseri'de savunma sanayi 2024-2028 döneminde gelişti." }]);
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 1, alinti: "Kayseri’de savunma sanayi 2024–2028 döneminde" }], puanlar },
    paket,
  );
  assert.equal(s.gecerli, true);
});

test("… ile kısaltılmış alıntı parçaları sırayla doğrulanır", () => {
  const paket = paketKur("p", [
    { id: 1, ad: "X", metin: "Başta Ankara olmak üzere Konya ve Kayseri'de savunma ve havacılık sektörü öne çıkmaktadır." },
  ]);
  const dogru = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 1, alinti: "Başta Ankara olmak üzere … savunma ve havacılık sektörü" }], puanlar },
    paket,
  );
  assert.equal(dogru.gecerli, true, "her parça sırayla geçiyorsa kabul");

  const tersSira = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 1, alinti: "savunma ve havacılık sektörü … Başta Ankara olmak üzere" }], puanlar },
    paket,
  );
  assert.equal(tersSira.gecerli, false, "sıra bozuksa reddedilir — kompozit uydurma engellenir");

  const uydurma = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ belge_id: 1, alinti: "Başta Ankara olmak üzere … deniz ticareti filosu" }], puanlar },
    paket,
  );
  assert.equal(uydurma.gecerli, false, "parçalardan biri uydurmaysa reddedilir");
});

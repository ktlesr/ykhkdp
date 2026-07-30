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

/** Sekiz kriterin tamamı; testin ilgilenmediği kriterler dayanaksız kalır. */
const KRITERLER = [
  "yerel_potansiyel", "deger_zinciri", "uygulanabilirlik", "istihdam_katma_deger",
  "surdurulebilirlik", "pazar_talep", "yatirimci_ilgisi", "plan_uyumu",
] as const;

/** Puan listesi kurar. `eslesme` verilen kriterleri alıntı sırasına bağlar. */
function puanSeti(eslesme: Partial<Record<(typeof KRITERLER)[number], number[]>> = {}, puan = 60) {
  return KRITERLER.map((kriter) => ({ kriter, puan, alinti_no: eslesme[kriter] ?? [] }));
}

const puanlar = puanSeti();

test("birebir alıntı geçer ve eşlendiği kriter dayanağa sayılır", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Bölge planı önceliklerine uygundur.",
      alintilar: [{ no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" }],
      puanlar: puanSeti({ yerel_potansiyel: [1] }),
    },
    PAKET,
  );
  assert.equal(s.gecerli, true);
  assert.ok(s.gecerli && s.dayanak > 0);
  assert.deepEqual(s.gecerli && s.kriterDayanagi.yerel_potansiyel, [0]);
  assert.deepEqual(s.gecerli && s.kriterDayanagi.plan_uyumu, [], "eşlenmeyen kriter dayanaksız");
});

test("eşlenmemiş alıntı dayanağa katkı vermez — sayı değil kapsama ölçülür", () => {
  const alintilar = [
    { no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
    { no: 2, belge_id: 2, alinti: "Enerji verimliliği yatırımları" },
  ];
  const eslenmemis = degerlendirmeyiDogrula({ gerekce: "Uygundur.", alintilar, puanlar }, PAKET);
  const eslenmis = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar, puanlar: puanSeti({ yerel_potansiyel: [1], plan_uyumu: [2] }) },
    PAKET,
  );
  assert.equal(eslenmemis.gecerli && eslenmemis.dayanak, 0, "hiçbir kritere bağlanmayan alıntı dayanak üretmez");
  assert.ok(eslenmis.gecerli && eslenmis.dayanak > 0);
});

test("çözülemeyen alıntı numarası eşlemeden düşer, çıktı reddedilmez", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Uygundur.",
      alintilar: [{ no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" }],
      // 3 numaralı alıntı hiç verilmedi: muhasebe kusuru, uydurma değil.
      puanlar: puanSeti({ yerel_potansiyel: [1, 3] }),
    },
    PAKET,
  );
  assert.equal(s.gecerli, true, "alıntı listesi doğrulanmışken çıktı çöpe atılmaz");
  assert.deepEqual(s.gecerli && s.kriterDayanagi.yerel_potansiyel, [0], "çözülen referans kalır");
  assert.ok(s.gecerli && s.dusenler.some((h) => h.kod === "alinti_no_gecersiz"), "denetime yazılır");
});

test("aynı numara iki alıntıya verilmişse o eşleme belirsizdir ve düşer", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Uygundur.",
      alintilar: [
        { no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { no: 1, belge_id: 2, alinti: "Enerji verimliliği yatırımları" },
      ],
      puanlar: puanSeti({ yerel_potansiyel: [1] }),
    },
    PAKET,
  );
  assert.equal(s.gecerli, true);
  assert.deepEqual(s.gecerli && s.kriterDayanagi.yerel_potansiyel, [], "belirsiz referans krediye dönüşmez");
  assert.ok(s.gecerli && s.dusenler.some((h) => h.kod === "alinti_no_tekrar"));
});

test("zayıf örtüşen parçadan gelen dayanak daha düşük", () => {
  const kur = (sira: number) =>
    paketKur("p", [
      { id: 1, ad: "TR33 Bölge Planı", metin: METIN, sira },
      { id: 2, ad: "OVP 2026", metin: "Enerji verimliliği yatırımları teşvik edilecektir.", sira: 1 },
    ]);
  const girdi = {
    gerekce: "Uygundur.",
    alintilar: [{ no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" }],
    puanlar: puanSeti({ yerel_potansiyel: [1] }),
  };
  const ilgili = degerlendirmeyiDogrula(girdi, kur(1));
  const zayif = degerlendirmeyiDogrula(girdi, kur(0.1));
  assert.ok(ilgili.gecerli && zayif.gecerli && zayif.dayanak < ilgili.dayanak);
});

test("uydurulmuş alıntı reddedilir", () => {
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ no: 1, belge_id: 1, alinti: "bu cümle belgede yok" }], puanlar },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "alinti_eslesmiyor"));
});

test("olmayan belge reddedilir", () => {
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ no: 99, belge_id: 99, alinti: "tekstil ve deri" }], puanlar },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "belge_yok"));
});

test("pakete dahil olmayan belge reddedilir — model onu görmüş olamaz", () => {
  const sahte = { id: "p", belgeler: [{ id: 1, ad: "x", metin: METIN, pakete_dahil: false }] };
  const s = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ no: 1, belge_id: 1, alinti: "tekstil ve deri" }], puanlar },
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
  const s = degerlendirmeyiDogrula({ gerekce: "Uygundur.", alintilar: [], puanlar: puanSeti({}, 140) }, PAKET);
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
        { no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { no: 2, belge_id: 1, alinti: "katma değeri yükseltecek dönüşüm alanı" },
        { no: 3, belge_id: 2, alinti: "Enerji verimliliği yatırımları" },
        { no: 4, belge_id: 1, alinti: "bu cümle belgede hiç yok" },
      ],
      puanlar: puanSeti({ yerel_potansiyel: [1, 4], deger_zinciri: [2], plan_uyumu: [3] }),
    },
    PAKET,
  );
  assert.equal(s.gecerli, true, "1/4 düşen alıntı tüm değerlendirmeyi çöpe atmaz");
  assert.equal(s.gecerli && s.dogrulanan.length, 3);
  // biri belgede bulunamadı, ayrıca ona yapılan eşleme de çözülemedi → iki kayıt
  assert.equal(s.gecerli && s.dusenler.filter((h) => h.kod === "alinti_eslesmiyor").length, 1);
  // Düşen alıntı eşlemeden de düşer; kalan sıralar yeni diziye göre kayar.
  assert.deepEqual(s.gecerli && s.kriterDayanagi.yerel_potansiyel, [0], "düşen 4 no'lu alıntı eşlemeden çıktı");
  assert.deepEqual(s.gecerli && s.kriterDayanagi.plan_uyumu, [2]);
  assert.equal(
    s.gecerli && s.dayanak,
    dayanakPuani(s.gecerli ? s.dogrulanan : [], PAKET, s.gecerli ? s.kriterDayanagi : {}),
  );
});

test("çoğunluk eşleşmiyorsa çıktının tamamı reddedilir", () => {
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Uygundur.",
      alintilar: [
        { no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { no: 2, belge_id: 1, alinti: "bu cümle belgede hiç yok" },
        { no: 3, belge_id: 1, alinti: "bu cümle de belgede hiç yok" },
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
        { no: 1, belge_id: 1, alinti: "tekstil ve deri öncelikli imalat" },
        { no: 2, belge_id: 1, alinti: "katma değeri yükseltecek dönüşüm alanı" },
        { no: 3, belge_id: 2, alinti: "Enerji verimliliği yatırımları" },
        { no: 4, belge_id: 99, alinti: "tekstil ve deri" },
      ],
      puanlar,
    },
    PAKET,
  );
  assert.ok(!s.gecerli && s.hatalar.some((h) => h.kod === "belge_yok"), "azınlıkta olsa da düşürülmez");
});

test("dayanak puanı belge çeşitliliğiyle artar", () => {
  const alintilar = [{ no: 1, belge_id: 1, alinti: "a" }, { no: 2, belge_id: 2, alinti: "b" }];
  const tek = dayanakPuani(alintilar, PAKET, eslemeSeti({ yerel_potansiyel: [0], deger_zinciri: [0] }));
  const cift = dayanakPuani(alintilar, PAKET, eslemeSeti({ yerel_potansiyel: [0], deger_zinciri: [1] }));
  assert.ok(cift > tek, "aynı belgeden iki kriter, iki ayrı belgeden iki kriter kadar güçlü değil");
});

/** Sekiz kriterin tamamını taşıyan eşleme — gerçek çıktı da hep sekizini taşır. */
function eslemeSeti(eslesme: Partial<Record<(typeof KRITERLER)[number], number[]>>) {
  return Object.fromEntries(KRITERLER.map((k) => [k, eslesme[k] ?? []]));
}

test("kriter kapsaması arttıkça dayanak artar", () => {
  const alintilar = [{ no: 1, belge_id: 1, alinti: "a" }, { no: 2, belge_id: 2, alinti: "b" }];
  const iki = dayanakPuani(alintilar, PAKET, eslemeSeti({ yerel_potansiyel: [0], plan_uyumu: [1] }));
  const dort = dayanakPuani(
    alintilar,
    PAKET,
    eslemeSeti({ yerel_potansiyel: [0], deger_zinciri: [0], plan_uyumu: [1], pazar_talep: [1] }),
  );
  assert.ok(dort > iki);
});

test("kıvrık kesme işareti ve tire farkı alıntıyı reddetmez", () => {
  const paket = paketKur("p", [{ id: 1, ad: "X", metin: "Kayseri'de savunma sanayi 2024-2028 döneminde gelişti." }]);
  const s = degerlendirmeyiDogrula(
    {
      gerekce: "Uygundur.",
      alintilar: [{ no: 1, belge_id: 1, alinti: "Kayseri’de savunma sanayi 2024–2028 döneminde" }],
      puanlar: puanSeti({ yerel_potansiyel: [1] }),
    },
    paket,
  );
  assert.equal(s.gecerli, true);
});

test("… ile kısaltılmış alıntı parçaları sırayla doğrulanır", () => {
  const paket = paketKur("p", [
    { id: 1, ad: "X", metin: "Başta Ankara olmak üzere Konya ve Kayseri'de savunma ve havacılık sektörü öne çıkmaktadır." },
  ]);
  const dogru = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ no: 1, belge_id: 1, alinti: "Başta Ankara olmak üzere … savunma ve havacılık sektörü" }], puanlar },
    paket,
  );
  assert.equal(dogru.gecerli, true, "her parça sırayla geçiyorsa kabul");

  const tersSira = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ no: 1, belge_id: 1, alinti: "savunma ve havacılık sektörü … Başta Ankara olmak üzere" }], puanlar },
    paket,
  );
  assert.equal(tersSira.gecerli, false, "sıra bozuksa reddedilir — kompozit uydurma engellenir");

  const uydurma = degerlendirmeyiDogrula(
    { gerekce: "Uygundur.", alintilar: [{ no: 1, belge_id: 1, alinti: "Başta Ankara olmak üzere … deniz ticareti filosu" }], puanlar },
    paket,
  );
  assert.equal(uydurma.gecerli, false, "parçalardan biri uydurmaysa reddedilir");
});

test("ağırlıklı kapsama: büyük paylı kriterin dayanaksız kalması pahalı", () => {
  const alintilar = [{ no: 1, belge_id: 1, alinti: "a" }, { no: 2, belge_id: 2, alinti: "b" }];
  // TR33-2027-v1'e yakın paylar: yerel_potansiyel %18, surdurulebilirlik %8.
  const agirliklar = {
    yerel_potansiyel: 0.18, deger_zinciri: 0.14, uygulanabilirlik: 0.12,
    istihdam_katma_deger: 0.16, surdurulebilirlik: 0.08,
    pazar_talep: 0.12, yatirimci_ilgisi: 0.08, plan_uyumu: 0.12,
  };
  const tam = Object.fromEntries(KRITERLER.map((k, i) => [k, [i % 2]]));

  const yerellikYok = dayanakPuani(alintilar, PAKET, { ...tam, yerel_potansiyel: [] }, agirliklar);
  const surdurulebilirlikYok = dayanakPuani(alintilar, PAKET, { ...tam, surdurulebilirlik: [] }, agirliklar);
  const hepsi = dayanakPuani(alintilar, PAKET, tam, agirliklar);

  assert.ok(yerellikYok < surdurulebilirlikYok, "%18'lik boşluk %8'likten daha çok düşürür");
  assert.ok(surdurulebilirlikYok < hepsi);
});

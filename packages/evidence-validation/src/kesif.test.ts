import assert from "node:assert/strict";
import test from "node:test";
import {
  adaylariDogrula,
  kaynaktanCikar,
  kanitlariDogrula,
  MODEL_METIN_SINIRI,
  paketKur,
  paketteGeciyor,
  desteksizCumle,
  yerelMi,
} from "./index.ts";

const USAK =
  "Uşak’ta tekstil geri dönüşümü sektöründe   ülkenin en büyük kümesi bulunmaktadır. " +
  "İlde 120 işletme faaliyet göstermektedir.";
const ULUSAL = "Sanayide döngüsel ekonomi uygulamaları yaygınlaştırılacaktır. Enerji verimliliği desteklenecektir.";

const PAKET = paketKur("k", [
  { id: 41, ad: "Uşak İl Sanayi Raporu", metin: USAK },
  { id: 42, ad: "12. Kalkınma Planı", metin: ULUSAL },
]);

test("kaynaktanCikar modelin değil kaynağın metnini döndürür", () => {
  // Model tırnağı ve boşluğu değiştirdi, büyük harf kullandı.
  const m = kaynaktanCikar(USAK, "UŞAK'TA tekstil geri dönüşümü sektöründe ülkenin en büyük kümesi");
  assert.equal(m, "Uşak’ta tekstil geri dönüşümü sektöründe   ülkenin en büyük kümesi");
});

test("kaynaktanCikar kesintili ve uydurma alıntıyı kabul etmez", () => {
  assert.equal(kaynaktanCikar(USAK, "Uşak’ta tekstil … en büyük kümesi bulunmaktadır"), null);
  assert.equal(kaynaktanCikar(USAK, "Uşak’ta seramik sektöründe ülkenin en büyük kümesi"), null);
});

test("paket modele gösterilen metinle sınırlıdır: kesilen kuyruktan alıntı geçmez", () => {
  const uzun = "a".repeat(MODEL_METIN_SINIRI) + " Bu cümle modele hiç gösterilmedi ama belgede var.";
  const p = paketKur("u", [{ id: 1, ad: "Uzun", metin: uzun }]);
  assert.equal(paketteGeciyor(p, "Bu cümle modele hiç gösterilmedi ama belgede var."), false);
});

test("kanıt doğru parçaya atfedilir ve özgün metinle kaydedilir", () => {
  const s = kanitlariDogrula(
    [{ belge_id: 2, tur: "yerel_olgu", konu: "Tekstil geri dönüşümü kümesi", alinti: "uşak'ta tekstil geri dönüşümü sektöründe" }],
    PAKET,
  );
  assert.ok(s.gecerli);
  assert.equal(s.kanitlar[0].belge_id, 41); // model 2. parçayı gösterdi, metin 1.'de
  assert.equal(s.kanitlar[0].alinti, "Uşak’ta tekstil geri dönüşümü sektöründe");
});

test("taramada doğrulanan kanıt tutulur, uydurma düşer; hiçbiri doğrulanmazsa parça okunamadı", () => {
  const karisik = kanitlariDogrula(
    [
      { belge_id: 1, tur: "firsat", konu: "Geri dönüşüm", alinti: "Uşak’ta tekstil geri dönüşümü sektöründe" },
      { belge_id: 1, tur: "firsat", konu: "Uydurma", alinti: "Uşak organize sanayi bölgesinde yeni bir lif fabrikası kurulacak" },
      { belge_id: 2, tur: "oncelik", konu: "Uydurma", alinti: "Tekstil geri dönüşümüne yüzde elli hibe verilecektir" },
    ],
    PAKET,
  );
  assert.ok(karisik.gecerli);
  assert.equal(karisik.kanitlar.length, 1, "yalnızca kaynakta birebir geçen kaydedilir");
  assert.equal(karisik.dusenler.length, 2);

  const hepsiUydurma = kanitlariDogrula(
    [{ belge_id: 1, tur: "firsat", konu: "Uydurma", alinti: "Uşak organize sanayi bölgesinde yeni bir lif fabrikası kurulacak" }],
    PAKET,
  );
  assert.equal(hepsiUydurma.gecerli, false);
});

test("tablo satırı ayraçsız alıntılanabilir; kayda kaynaktaki satır girer", () => {
  const tablo = ["| İlçe | Tesis sayısı |", "| --- | --- |", "| Banaz | 14 tekstil işletmesi |"].join("\n");
  assert.equal(kaynaktanCikar(tablo, "Banaz 14 tekstil işletmesi"), "Banaz | 14 tekstil işletmesi");
  assert.ok(paketteGeciyor(paketKur("t", [{ id: 1, ad: "T", metin: tablo }]), "Banaz 14 tekstil işletmesi"));
});

test("konu adında kaynaksız sayı taşıyan kanıt düşer", () => {
  const s = kanitlariDogrula(
    [
      { belge_id: 1, tur: "yerel_olgu", konu: "İlde 300 işletme", alinti: "İlde 120 işletme faaliyet göstermektedir." },
      { belge_id: 1, tur: "yerel_olgu", konu: "İlde 120 işletme", alinti: "İlde 120 işletme faaliyet göstermektedir." },
    ],
    PAKET,
  );
  assert.ok(s.gecerli);
  assert.equal(s.kanitlar.length, 1);
  assert.equal(s.kanitlar[0].konu, "İlde 120 işletme");
});

test("yerellik mekaniktir: il belgesi ya da pasaj çevresinde il/ilçe adı", () => {
  const hedef = { ilKod: "usak", adlar: ["Uşak", "Banaz"] };
  assert.equal(yerelMi({ metin: ULUSAL, ilKod: "usak" }, "Enerji verimliliği desteklenecektir.", hedef), true);
  assert.equal(yerelMi({ metin: USAK, ilKod: null }, "tekstil geri dönüşümü sektöründe", hedef), true);
  // Komşu cümlede il adı geçmesi yetmez: ölçülen hata buydu.
  const bolge = "Uşak'ta deri ihtisas OSB mevcuttur. Kütahya'da seramik ve bor türevleri ihtisaslaşma alanlarıdır.";
  assert.equal(yerelMi({ metin: bolge, ilKod: null }, "seramik ve bor türevleri ihtisaslaşma alanlarıdır", hedef), false);
  assert.equal(yerelMi({ metin: bolge, ilKod: null }, "deri ihtisas OSB mevcuttur", hedef), true);
  assert.equal(yerelMi({ metin: ULUSAL, ilKod: null }, "Enerji verimliliği desteklenecektir.", hedef), false);
  // Kelime içi eşleşme sayılmaz: "kervan" Van değildir.
  const van = { ilKod: "van", adlar: ["Van"] };
  assert.equal(yerelMi({ metin: "Kervan yolu üzerindeki lojistik merkezleri.", ilKod: null }, "lojistik merkezleri", van), false);
  assert.equal(yerelMi({ metin: "Van’da hayvancılık güçlüdür.", ilKod: null }, "hayvancılık güçlüdür", van), true);
});

test("aday: iki kanıt, biri yerel; aksi hâlde yalnızca o aday düşer", () => {
  const defter = [
    { no: 1, kanitId: 101, yerel: true, metin: "İlde 120 işletme faaliyet göstermektedir." },
    { no: 2, kanitId: 102, yerel: false, metin: "Sanayide döngüsel ekonomi uygulamaları yaygınlaştırılacaktır." },
    { no: 3, kanitId: 103, yerel: false, metin: "Enerji verimliliği desteklenecektir." },
  ];
  const s = adaylariDogrula(
    [
      { baslik: "Tekstil geri dönüşüm tesisi", gerekce: "İlde 120 işletme var; döngüsel ekonomi önceliği.", kanit_no: [1, 2] },
      { baslik: "Enerji verimliliği danışmanlığı", gerekce: "Ulusal öncelik ve döngüsel ekonomi hedefi.", kanit_no: [2, 3] },
      { baslik: "Tek kanıtlı aday başlığı", gerekce: "Yalnızca bir yerel kanıta dayanan bir gerekçe.", kanit_no: [1] },
      { baslik: "Sayı uyduran aday başlığı", gerekce: "İlde 500 işletme olduğu belgelerde yazıyor.", kanit_no: [1, 2] },
      { baslik: "Hayalet atıflı aday başlığı", gerekce: "Defterde olmayan kanıtlara dayanan gerekçe.", kanit_no: [1, 2, 7, 8, 9] },
    ],
    defter,
  );
  assert.deepEqual(s.adaylar.map((a) => a.baslik), ["Tekstil geri dönüşüm tesisi"]);
  assert.deepEqual(s.adaylar[0].kanitIdleri, [101, 102]);
  assert.equal(s.dusenler.length, 4);
});

test("gerekçe cümlesi atıf yapılan kanıtta karşılık bulmalı", () => {
  const kanit = "Uşak'ta deri ihtisas organize sanayi bölgesinde arıtma kapasitesi ilave yatırıma açıktır.";
  assert.equal(desteksizCumle("Deri ihtisas organize sanayi bölgesinde arıtma kapasitesi yatırıma açıktır.", kanit), null);
  assert.match(
    desteksizCumle("Arıtma kapasitesi yatırıma açıktır. Seramik hammaddesi rezervleri il sınırları içindedir.", kanit) ?? "",
    /Seramik/,
  );
});

test("bölge kodundaki rakam sayısal iddia değildir: TR33", async () => {
  const { sayisalTokenlar } = await import("./index.ts");
  assert.deepEqual(sayisalTokenlar("TR33 bölgesinde"), []);
  assert.deepEqual(sayisalTokenlar("TR33 Bölge Planı"), []);
  assert.deepEqual(sayisalTokenlar("İlde 120 işletme"), ["120"]);
});

// ── Codex incelemesinden gelen regresyonlar ────────────────────────────────

test("sayı kaynakta SAYI olarak aranır: 120 varken 20 geçmez", async () => {
  const { sayiKaynakta } = await import("./index.ts");
  assert.equal(sayiKaynakta("20", "ilde 120 işletme"), false);
  assert.equal(sayiKaynakta("120", "ilde 120 işletme"), true);
  assert.equal(sayiKaynakta("12", "oran %12,5 oldu"), false);
  assert.equal(sayiKaynakta("12,5", "oran %12,5 oldu"), true);
  assert.equal(sayiKaynakta("120 ton", "yılda 120 ton"), true);
  const defter = [
    { no: 1, kanitId: 1, yerel: true, metin: "İlde 120 işletme faaliyet göstermektedir." },
    { no: 2, kanitId: 2, yerel: false, metin: "Sanayide döngüsel ekonomi uygulamaları yaygınlaştırılacaktır." },
  ];
  const s = adaylariDogrula([{ baslik: "Tekstil geri dönüşüm tesisi", gerekce: "İlde 20 işletme faaliyet göstermektedir.", kanit_no: [1, 2] }], defter);
  assert.equal(s.adaylar.length, 0);
});

test("cümle sonuyla biten pasaj sonraki cümlenin il adını almaz", () => {
  const metin = "Uşak’ta tekstil geri dönüşümü gelişmiştir. Kütahya’da seramik üretimi yaygındır.";
  const kutahya = { ilKod: "kutahya", adlar: ["Kütahya"] };
  assert.equal(yerelMi({ metin, ilKod: null }, "Uşak’ta tekstil geri dönüşümü gelişmiştir.", kutahya), false);
  assert.equal(yerelMi({ metin, ilKod: null }, "Kütahya’da seramik üretimi yaygındır.", kutahya), true);
});

test("aynı metinli iki kanıt 'iki farklı kanıt' sayılmaz", () => {
  const metin = "Uşak’ta deri ihtisas organize sanayi bölgesinde arıtma kapasitesi yatırıma açıktır.";
  const s = adaylariDogrula(
    [{ baslik: "Deri OSB arıtma yatırımı", gerekce: "Deri ihtisas organize sanayi bölgesinde arıtma kapasitesi yatırıma açıktır.", kanit_no: [1, 2] }],
    [
      { no: 1, kanitId: 1, yerel: true, metin },
      { no: 2, kanitId: 2, yerel: true, metin },
    ],
  );
  assert.equal(s.adaylar.length, 0);
});

test("alıntının kesin maddesi: aralık değil, alıntının geçtiği madde", async () => {
  const { alintininMaddesi } = await import("./index.ts");
  const parca = [
    "önceki maddeden taşan cümle burada sürüyor ve bitiyor.",
    "470.2. Batarya geri dönüşümü, ikincil kullanımı ve bertarafına ilişkin bir sistem oluşturulacaktır.",
    "470.3. Tedarik sanayiinin yeşil dönüşümü için farkındalık artırılacaktır.",
    "474.1. Elektrikli araç şarj altyapısı yaygınlaştırılacaktır.",
  ].join("\n\n");
  assert.equal(alintininMaddesi(parca, "Tedarik sanayiinin yeşil dönüşümü için farkındalık"), "470.3");
  assert.equal(alintininMaddesi(parca, "şarj altyapısı yaygınlaştırılacaktır"), "474.1");
  // İlk madde başından önce: madde bilinmez, uydurulmaz.
  assert.equal(alintininMaddesi(parca, "önceki maddeden taşan cümle burada sürüyor"), null);
  assert.equal(alintininMaddesi(parca, "bu metin parçada hiç geçmiyor ve bulunamaz"), null);
});

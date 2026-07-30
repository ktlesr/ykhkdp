import assert from "node:assert/strict";
import test from "node:test";
import { parcala } from "./belge-yukle.ts";

/** Saf metin işleme testleri — veritabanına dokunmaz. */

test("satır sonu tirelemesi birleşir, sayı ve özel ad tireleri korunur", () => {
  const [p] = parcala(
    "Bölgede kimyasal ürün sektörü ile tekstil ve gıda sektörle-\n" +
      "rinin kapasitesi 2024-\n" +
      "2028 döneminde artacaktır. Türkiye-\n" +
      "AB ticareti de bu kapsamdadır ve bu paragraf yeterince uzundur.\n",
    9999,
  );
  assert.match(p.metin, /gıda sektörlerinin kapasitesi/);
  assert.match(p.metin, /2024- 2028/, "sayı tiresi birleştirilmez");
  assert.match(p.metin, /Türkiye- AB/, "büyük harfli bileşik birleştirilmez");
});

test("markdown süsü atılır — alıntı yıldızsız metinde aranır", () => {
  const [p] = parcala(
    "## **TR33 BÖLGESİ**\n\n" +
      "Bölgede **tekstil** ve deri öncelikli imalat sektörleridir; bu iki sektör bölge sanayisinin " +
      "belirleyici omurgasını oluşturmakta ve istihdamın önemli bölümünü karşılamaktadır.\n",
    9999,
  );
  assert.ok(!p.metin.includes("*"), p.metin);
  assert.match(p.metin, /Bölgede tekstil ve deri öncelikli/);
});

test("sayfa işareti metinden çıkar, parça etiketine geçer", () => {
  const govde =
    "Bu paragraf yeterince uzun bir gövde metnidir ve parçanın içine girmesi beklenir; " +
    "yükleyici kısa parçaları attığı için gövdenin yüz yirmi karakteri aşması gerekiyor.\n";
  const [p] = parcala(`31 / 240\n${govde}`, 9999);
  assert.equal(p.bolum, "s. 31");
  assert.ok(!p.metin.includes("31 / 240"));
});

test("sayfa yoksa numaralı madde aralığı çıpa olur", () => {
  const [p] = parcala(
    "449. Elektronik sektöründe ithal bağımlılığı yüksek ara malların yerli üretimi desteklenecektir.\n\n" +
      "450.1. Yarı iletken teknolojilerinin geliştirilmesi sağlanacak ve yatırımlar desteklenecektir.\n",
    9999,
  );
  assert.equal(p.bolum, "madde 449–450.1");
});

test("sayfa ve madde yoksa en yakın başlık çıpa olur", () => {
  const [p] = parcala(
    "## 8.4. TURİZM\n\n" +
      "Bölgede turizm çeşitlendirilecek ve kültür turizmi öne çıkarılacaktır; bu başlık altındaki " +
      "stratejiler yerel aktörlerle birlikte yürütülecek biçimde tasarlanmıştır.\n",
    9999,
  );
  assert.equal(p.bolum, "8.4. TURİZM");
});

test("içindekiler satırları ve tekrarlayan sayfa mobilyası atılır", () => {
  const ham =
    "TR33 BÖLGE PLANI\n1.1. YÖNETİCİ ÖZETİ ....................... 12\n" +
    Array.from(
      { length: 6 },
      () =>
        "TR33 BÖLGE PLANI\nBu gövde paragrafı yeterince uzundur ve korunmalıdır; yükleyici kısa " +
        "parçaları attığı için her paragrafın belirgin biçimde uzun tutulması gerekiyor.\n",
    ).join("\n");
  const metin = parcala(ham, 9999)
    .map((p) => p.metin)
    .join("\n");
  assert.ok(!metin.includes("YÖNETİCİ ÖZETİ"), "noktalı içindekiler satırı atılır");
  assert.ok(!metin.includes("TR33 BÖLGE PLANI"), "6 kez tekrar eden kısa satır mobilyadır");
  assert.match(metin, /gövde paragrafı yeterince uzundur/);
});

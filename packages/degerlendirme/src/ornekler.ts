/**
 * Değerlendirme eval kümesi — `pnpm ai:eval` bunu çalıştırır.
 *
 * Amaç: prompt veya model değiştiğinde çıktının bozulduğunu YAKALAMAK. Bugüne
 * kadar bunu hiçbir şey söylemiyordu; alıntıların birebir eşleşmemesi ancak
 * gerçek bir öneri denenirken ortaya çıktı.
 *
 * Kesin puan beklemiyoruz — model deterministik değil. Beklenen şey **bant** ve
 * **değişmez**: kaç kriter belgeye bağlandı, düşen alıntı oranı, dayanak aralığı.
 * En değerli kontrol AYIRT ETME: aynı başlık, biri gerçekten yerele bağlı bir
 * gerekçeyle, diğeri "ülkemizde bu sektör önemlidir" gerekçesiyle. Yerele bağlı
 * olan yerellik grubunda daha yüksek almalı. Bu, modelden bağımsız bir üründür:
 * programın adı Yerel Kalkınma Hamlesi.
 */

export type Bant = [number, number];

export type Ornek = {
  /** eval çıktısında ve karşılaştırmalarda kullanılan kısa ad */
  ad: string;
  ilKod: string;
  ajansKod: string;
  baslik: string;
  gerekce: string;
  ilce: string | null;
  nace: string | null;
  bekle: {
    /** yerellik grubu (yerel_potansiyel, deger_zinciri, uygulanabilirlik) ortalaması */
    yerellik?: Bant;
    dayanak?: Bant;
    /** en az kaç kriter doğrulanmış bir alıntıya bağlanmalı */
    enAzDayanakliKriter?: number;
    /** düşen alıntı / toplam alıntı oranı bu değeri geçmemeli */
    enFazlaDusenOrani?: number;
  };
};

/** A örneğinin yerellik ortalaması B'yi en az `enAzFark` puan geçmeli. */
export type Karsilastirma = { yuksek: string; dusuk: string; enAzFark: number; neden: string };

export const ORNEKLER: Ornek[] = [
  {
    ad: "usak-kirpik-yerel",
    ilKod: "usak",
    ajansKod: "TR33",
    baslik: "Tekstil kırpıklarından geri dönüştürülmüş elyaf üretimi",
    gerekce:
      "Uşak'ta konfeksiyon ve dokuma atölyelerinden çıkan kırpık atığı il içinde toplanıyor ve " +
      "bugün ağırlıklı olarak ham hâlde il dışına satılıyor. Tekstil ihtisas organize sanayi " +
      "bölgesi altyapısı, boyahane kapasitesi ve sektörde deneyimli işgücü ilde mevcut. Aynı " +
      "yatırım kırpık arzı ve boyahane altyapısı olmayan bir ilde bu maliyetle yapılamaz.",
    ilce: "Merkez",
    nace: null,
    bekle: {
      yerellik: [60, 100],
      dayanak: [40, 100],
      enAzDayanakliKriter: 4,
      enFazlaDusenOrani: 0.34,
    },
  },
  {
    ad: "usak-kirpik-genel",
    ilKod: "usak",
    ajansKod: "TR33",
    baslik: "Tekstil kırpıklarından geri dönüştürülmüş elyaf üretimi",
    // Kasıtlı olarak yersiz gerekçe: hiçbir cümlesi "neden BU il" sorusuna cevap vermiyor.
    gerekce:
      "Tekstil ülkemiz için stratejik bir sektördür ve geri dönüşüm dünya genelinde önemli bir " +
      "eğilimdir. Bu alanda yatırım yapılması ülkemizin kalkınması açısından faydalı olacaktır. " +
      "Sektörde büyüme potansiyeli yüksektir ve yatırımcılar için cazip bir alandır.",
    ilce: null,
    nace: null,
    bekle: { yerellik: [0, 65], enFazlaDusenOrani: 0.34 },
  },
  {
    ad: "kutahya-teknik-seramik",
    ilKod: "kutahya",
    ajansKod: "TR33",
    baslik: "Teknik seramik ve seramik filtre üretimi",
    gerekce:
      "Kütahya'da seramik sanayi yerleşik; hammadde olarak kaolen ve feldspat il içinde " +
      "çıkarılıyor. Mevcut karo ve sofra eşyası üreticileri düşük katma değerli ürünlerde " +
      "yoğunlaşmış durumda; teknik seramik aynı hammadde ve aynı fırın altyapısıyla daha " +
      "yüksek katma değere geçiş imkânı sunuyor.",
    ilce: "Merkez",
    nace: null,
    bekle: { yerellik: [55, 100], dayanak: [40, 100], enAzDayanakliKriter: 4, enFazlaDusenOrani: 0.34 },
  },
  {
    ad: "manisa-belgesiz-konu",
    ilKod: "manisa",
    ajansKod: "TR33",
    baslik: "Denizaltı dalış turizmi merkezi",
    // Belgelerde karşılığı olmayan konu: dayanak düşük kalmalı, alıntı UYDURULMAMALI.
    gerekce:
      "Bölgede dalış turizmine yönelik bir merkez kurulması turizm gelirlerini artırabilir ve " +
      "sezon dışı turizm hareketliliği yaratabilir. Bu alanda henüz bir yatırım bulunmuyor.",
    ilce: null,
    nace: null,
    /**
     * Dayanak burada BANTLANMIYOR ve bu bilinçli. İlk kurulumda `dayanak: [0,55]`
     * yazmıştım; iki koşu 52 ve 94 verdi. Sebep şu: belgelerde turizm başlıkları
     * var, model onlara gerçekten bağlanabiliyor. Dayanak "puan belgeye dayanıyor
     * mu" sorusunu ölçer, "konu iyi mi" sorusunu ölçmez — düşük yerellik puanı da
     * belgeye dayanıyor olabilir. Konunun yersizliğini ölçen şey YERELLİKTİR.
     */
    bekle: { yerellik: [0, 45], enFazlaDusenOrani: 0.34 },
  },
];

export const KARSILASTIRMALAR: Karsilastirma[] = [
  {
    yuksek: "usak-kirpik-yerel",
    dusuk: "usak-kirpik-genel",
    enAzFark: 10,
    neden:
      "Aynı başlık, aynı il, aynı belgeler. Fark yalnızca gerekçede: biri yerel arz ve " +
      "altyapıya bağlanıyor, diğeri her ilde yazılabilecek genel bir metin. Yerellik grubu " +
      "bu farkı görmüyorsa 'neden burada?' ölçülmüyor demektir.",
  },
  {
    yuksek: "kutahya-teknik-seramik",
    dusuk: "manisa-belgesiz-konu",
    enAzFark: 25,
    neden:
      "Kütahya seramiği belgelerde adıyla geçiyor ve hammaddesi il içinde; Manisa'da " +
      "denizaltı dalış turizminin belgelerde karşılığı yok. Yerellik bu ikisini " +
      "ayırmıyorsa sıralama yersiz konuları da ilk dörde taşır.",
  },
];

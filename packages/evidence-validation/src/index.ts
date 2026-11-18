import type { KarsiGorusTuru } from "@ykh/domain";

/**
 * Değerlendirme doğrulayıcı — AI Gateway'den ÖNCE gelir.
 *
 * Tüm kontroller FAIL-CLOSED: bir kontrol cevap veremiyorsa sonuç
 * "reddedildi"dir, "belki" değildir. Doğrulayıcıdan geçmeyen çıktı
 * kaydedilmez ve hiçbir koşulda sıralamaya giremez.
 */

export type BelgeKaydi = {
  /** veritabanı kimliği — doğrulanmış alıntıya bu yazılır */
  id: number;
  /**
   * Pakete yerel numara, 1…n. Model YALNIZCA bunu görür ve alıntıda bunu yazar.
   * Veritabanı kimliği verilmiyor çünkü model aralığı tahmin edip pakette
   * olmayan bir kimlik uyduruyor (ölçüldü: 8 belgelik pakette `belge_id: 291`).
   */
  yerel: number;
  ad: string;
  /** belge içindeki yer — düşen alıntı mesajında gösterilir */
  bolum?: string | null;
  /** modele verilen metin — alıntılar bunun içinde aranır */
  metin: string;
  /**
   * Öneriyle örtüşme, 0–1. Paket içinde en iyi eşleşen parça 1'dir
   * (`belgePaketi` normalize eder). Verilmezse 1 sayılır.
   */
  sira?: number;
  /** modele gerçekten verildi mi */
  pakete_dahil: boolean;
};

export type Paket = { id: string; belgeler: BelgeKaydi[] };

/**
 * `no` alıntının kendi numarası; kriter eşlemesi buna referans verir.
 *
 * Dizi indeksi kullanmıyoruz: model 0 tabanlı indekste yanılıyor. Numarayı
 * kendisi verdiğinde tek şart kendi kendisiyle tutarlı olması.
 */
/**
 * `belge_id` GİRDİDE pakete yerel numaradır (modelin gördüğü), ÇIKTIDA
 * veritabanı kimliğidir — doğrulayıcı geçerken çevirir. Böylece modelin
 * uyduramayacağı bir adres alanı ile kalıcı kayıt aynı tipte taşınır.
 */
export type Alinti = { no: number; belge_id: number; alinti: string };

export type HataKodu =
  | "belge_yok"
  | "pakette_yok"
  | "alinti_eslesmiyor"
  | "kaynaksiz_sayi"
  | "puan_araligi"
  | "kriter_kumesi"
  | "alinti_no_gecersiz"
  | "alinti_no_tekrar"
  | "alinti_atif_duzeltildi";

export type Hata = { kod: HataKodu; mesaj: string };

/** Kriter adı → `dogrulanan` içindeki alıntı sıraları. Boş dizi = dayanaksız kriter. */
export type KriterDayanagi = Record<string, number[]>;

export type Sonuc =
  | {
      gecerli: true;
      dayanak: number;
      /** birebir doğrulanmış alıntılar — YALNIZCA bunlar kaydedilir */
      dogrulanan: Alinti[];
      /** hangi kriter hangi doğrulanmış alıntıya dayanıyor */
      kriterDayanagi: KriterDayanagi;
      /** doğrulanamayıp DÜŞÜRÜLEN alıntılar; kaydedilmez, denetime yazılır */
      dusenler: Hata[];
      /** atfı düzeltilen alıntılar; kaydedilir, denetime yazılır */
      duzeltilenler: Hata[];
    }
  | { gecerli: false; hatalar: Hata[] };

/**
 * Doğrulanamayan alıntının yarısı aşılırsa çıktının tamamı reddedilir.
 *
 * Tek tek düşen alıntı olağandır (belge metni bozuk çıkmış olabilir); çoğunluğu
 * düşüyorsa model uyduruyor demektir ve hiçbir parçasına güvenilmez.
 */
const UYDURMA_ESIGI = 0.5;

/**
 * Sayısal token: 12, 12,5, %41,3, 1.234 ton gibi. Yıllar sayılmaz.
 *
 * Sol sınır harf VE rakam: önceden "TR33"teki ikinci "3" (solunda rakam var)
 * ayrı bir sayı sayılıyordu ve gerekçesinde bölge kodu geçen her çıktı
 * "kaynaksız sayı" diye düşüyordu (ölçüldü: aday keşfinde 5 adayın 5'i).
 */
const SAYI = /(?<![\p{L}\p{N}])[%₺$]?\d[\d.,]*(?:\s?(?:%|puan|kişi|ton|MW|km|m²|milyon|milyar|bin))?/gu;
const YIL = /^(19|20)\d{2}$/;

/**
 * Sayı kaynakta SAYI OLARAK geçiyor mu.
 *
 * Alt dize araması yetmiyordu: kaynakta "120 işletme" varken "20 işletme"
 * iddiası geçiyordu (Codex incelemesi). Sayının çekirdeği (12, 12,5, 1.234)
 * kaynakta solunda ve sağında başka rakam olmadan aranır; birim aranmaz —
 * "120" ile "120 ton" aynı sayıdır.
 */
export function sayiKaynakta(token: string, normalizeKaynak: string): boolean {
  const cekirdek = token.match(/\d[\d.,]*/)?.[0].replace(/[.,]+$/, "");
  if (!cekirdek) return true;
  // Yalnızca nokta kaçışlanır: "u" kipinde `\,` geçersiz bir kaçıştır.
  // Ayraç biçimi yalnızca ÜÇ HANELİ grupta fark sayılmaz: belgede "2,247" yazan
  // sayıyı model "2.247" yazabiliyor. Başka yerde ayraç birebir aranır
  // ("12,5" ile "12.5" aynı sayılmaz).
  const kacis = cekirdek.replace(/[.,]/g, (a, i: number) =>
    /^\d{3}(?!\d)/.test(cekirdek.slice(i + 1)) ? "[.,]" : a === "." ? "\\." : a,
  );
  return new RegExp(`(?<![\\p{N}])${kacis}(?![\\p{N}]|[.,]\\p{N})`, "u").test(normalizeKaynak);
}

export function sayisalTokenlar(metin: string): string[] {
  return [...metin.matchAll(SAYI)]
    .map((m) => m[0].trim())
    .filter((t) => !YIL.test(t.replace(/\D/g, "")) || t.includes("%"));
}

/**
 * Karşılaştırma normalizasyonu.
 *
 * Modelin ürettiği kesme işareti ve tire karakterleri belgedekilerden farklı
 * olabiliyor (’ vs ' , – vs -). Bunlar anlamı değiştirmediği için eşitlenir;
 * Markdown tablo ayracı (|) boşluk sayılır: model tablo satırını ayraçsız
 * alıntılıyor ve hücre metni birebir olduğu hâlde eşleşmiyordu.
 * aksi hâlde birebir doğru alıntılar sırf tipografi yüzünden reddedilir.
 */
function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[’‘`´ʼ]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/["“”«»]/g, '"')
    .replace(/[\s |]+/g, " ")
    .trim();
}

/**
 * Alıntı belgede geçiyor mu.
 *
 * Model uzun alıntıları `…` veya `...` ile kısaltıyor. Bunu reddetmek yerine
 * parçalara ayırıp HER PARÇANIN belgede ve DOĞRU SIRADA geçmesini şart koşuyoruz:
 * uydurma yine geçemez, ama tipik model davranışı sistemi kilitlemez.
 */
function alintiGeciyor(belgeMetni: string, alinti: string): boolean {
  const metin = normalize(belgeMetni);
  // Model alıntıyı kendi tırnağına alıyor: ""Aktif sanayi politikaları…"".
  // Sarmalayan tırnak alıntının parçası değil, biçimlendirmedir.
  const parcalar = normalize(alinti.replace(/^[\s"'“”«»]+|[\s"'“”«»]+$/g, ""))
    .split(/…+|\.{3,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Boş olmayan HER parça aranır. Eskiden 12 karakterden kısa parçalar atlanıyor
  // ve "gerçek ifade … UYDURMA" doğrulanmış sayılıyordu (kayıtta orijinal alıntı
  // tutulduğu için uydurma ek de kayda giriyordu).
  if (!parcalar.length) return false;

  let konum = 0;
  for (const p of parcalar) {
    const i = metin.indexOf(p, konum);
    if (i === -1) return false;
    konum = i + p.length;
  }
  return true;
}

/**
 * Alıntı listesini paket metnine karşı doğrular ve `no` → konum haritası kurar.
 *
 * Değerlendirme ve karşı görüş aynı zincirden geçer: ikisi de belgeye alıntıyla
 * bağlanır, ikisinde de uydurulmuş belge kimliği sert ret, eşleşmeyen alıntı
 * düşürme. Tek fark ne için kullanıldıkları.
 */
export function alintilariDogrula(
  alintilar: readonly Alinti[],
  paket: Paket,
): {
  dogrulanan: Alinti[];
  konum: Map<number, number>;
  dusenler: Hata[];
  duzeltilenler: Hata[];
  hatalar: Hata[];
} {
  const dogrulanan: Alinti[] = [];
  const dusenler: Hata[] = [];
  const duzeltilenler: Hata[] = [];
  const hatalar: Hata[] = [];

  /**
   * Tekrar eden numara referansı belirsizleştirir: iki adaydan hangisi
   * kastedildiği bilinemez, o yüzden ikisi de kullanılamaz sayılır.
   */
  const sayim = new Map<number, number>();
  for (const a of alintilar) sayim.set(a.no, (sayim.get(a.no) ?? 0) + 1);
  const belirsiz = new Set([...sayim].filter(([, n]) => n > 1).map(([no]) => no));
  for (const no of belirsiz) {
    dusenler.push({
      kod: "alinti_no_tekrar",
      mesaj: `${no} numarası birden çok alıntıya verilmiş; hangisi kastedildiği belirsiz, eşleme düşürüldü.`,
    });
  }

  /**
   * Metni pakette arar. Güvenceyi veren şey KİMLİK DEĞİL METİNDİR: kayda giren
   * her alıntı, modele gerçekten verilmiş bir belgede birebir geçer.
   */
  const metniBul = (alinti: string) =>
    paket.belgeler.find((b) => b.pakete_dahil && alintiGeciyor(b.metin, alinti));

  const konum = new Map<number, number>();
  for (const a of alintilar) {
    let belge = paket.belgeler.find((b) => b.yerel === a.belge_id);

    // Paket dışı belge GÜVENLİK ihlalidir: model onu görmüş olamaz → sert ret.
    if (belge && !belge.pakete_dahil) {
      hatalar.push({
        kod: "pakette_yok",
        mesaj: `Belge pakete dahil değil; model bunu görmüş olamaz: ${belge.ad}`,
      });
      continue;
    }

    /**
     * Aralık dışı numara sert ret DEĞİL.
     *
     * Numara bir adres, kanıt değil. Model paket dışı bir numara yazıyor
     * (ölçüldü: 8 belgelik pakette `belge_id: 48`) ama alıntı metni pakette
     * gerçekten geçebiliyor. Metin bulunuyorsa adresi düzeltiyoruz; bulunmuyorsa
     * alıntı düşüyor. Güvence bozulmuyor: arama YALNIZCA `pakete_dahil`
     * belgelerde yapılıyor, yani kayda giren metin modele verilmiş metindir.
     */
    if (!belge) {
      const dogruParca = metniBul(a.alinti);
      if (!dogruParca) {
        dusenler.push({
          kod: "alinti_eslesmiyor",
          mesaj:
            `Alıntı “${a.alinti.slice(0, 60)}…” pakette olmayan ${a.belge_id} numaralı belgeye ` +
            `atfedildi (paket 1–${paket.belgeler.length}) ve metni de pakette bulunamadı; düşürüldü.`,
        });
        continue;
      }
      duzeltilenler.push({
        kod: "alinti_atif_duzeltildi",
        mesaj:
          `Alıntı pakette olmayan ${a.belge_id} numaralı belgeye atfedildi; metin ` +
          `${dogruParca.ad}${dogruParca.bolum ? ` · ${dogruParca.bolum}` : ""} içinde bulundu, atıf düzeltildi.`,
      });
      belge = dogruParca;
    }
    /**
     * Yanlış parçaya atfedilmiş DOĞRU alıntı düşürülmez, atfı DÜZELTİLİR.
     *
     * Aynı belgenin parçaları birbirine benziyor ve model sık sık doğru cümleyi
     * komşu parçaya atfediyor (ölçüldü: "Kütahya'da teknik seramik ve seramik
     * filtre üretimi;" pakette var, modelin gösterdiği parçada yok). Metin
     * pakette birebir varsa uydurma değildir — atıf çıpasını metnin gerçekten
     * bulunduğu parçaya çeviriyoruz ve düzeltmeyi denetime yazıyoruz.
     *
     * Güvenlik aynı kalıyor: metin paketin HİÇBİR yerinde yoksa düşer, paket
     * dışı belge kimliği hâlâ sert rettir.
     */
    if (!alintiGeciyor(belge.metin, a.alinti)) {
      const dogruParca = metniBul(a.alinti);
      if (!dogruParca) {
        dusenler.push({
          kod: "alinti_eslesmiyor",
          mesaj: `Alıntı “${a.alinti.slice(0, 60)}…” pakette hiçbir belgede birebir bulunamadı; düşürüldü.`,
        });
        continue;
      }
      duzeltilenler.push({
        kod: "alinti_atif_duzeltildi",
        mesaj:
          `Alıntı “${a.alinti.slice(0, 60)}…” ${belge.ad}${belge.bolum ? ` · ${belge.bolum}` : ""} ` +
          `olarak gösterildi; metin ${dogruParca.ad}${dogruParca.bolum ? ` · ${dogruParca.bolum}` : ""} ` +
          "içinde bulundu, atıf düzeltildi.",
      });
      belge = dogruParca;
    }
    if (!belirsiz.has(a.no)) konum.set(a.no, dogrulanan.length);
    // Yerel numara → veritabanı kimliği: kayıt kalıcı kimliği taşır.
    dogrulanan.push({ ...a, belge_id: belge.id });
  }

  return { dogrulanan, konum, dusenler, duzeltilenler, hatalar };
}

/**
 * Bir numara listesini doğrulanmış alıntı konumlarına çevirir.
 *
 * Çözülemeyen referans (düşen alıntı, belirsiz numara, hiç verilmemiş numara)
 * listeden çıkar ve `dusenler`'e yazılır. Bu SERT RET DEĞİL: alıntı listesinin
 * kendisi doğrulanmış durumda, kusur muhasebede. Cezası kredi kaybıdır ve doğru
 * yönde fail-closed'dır — doğrulanamayan destek sayılmaz.
 */
function referanslariCoz(
  nereye: string,
  numaralar: readonly number[],
  konum: Map<number, number>,
  dusenler: Hata[],
): number[] {
  const cozulen: number[] = [];
  for (const no of numaralar) {
    const k = konum.get(no);
    if (k === undefined) {
      dusenler.push({
        kod: "alinti_no_gecersiz",
        mesaj: `${nereye} ${no} numaralı alıntıya dayandırıldı; bu numara çözülemedi, eşleme düşürüldü.`,
      });
      continue;
    }
    cozulen.push(k);
  }
  return cozulen;
}

/**
 * Bir metnin pakette birebir geçip geçmediği — doğrulayıcıdan BAĞIMSIZ kontrol.
 *
 * Ürün kuralı: kaydedilen her alıntı, modele gerçekten verilmiş bir belgede
 * birebir geçer. Doğrulayıcı bunu sağlıyor; bu fonksiyon eval'in aynı şeyi
 * doğrulayıcıya güvenmeden ölçmesi için var. İkisi ayrışırsa eval kırılır.
 */
export function paketteGeciyor(paket: Paket, alinti: string): boolean {
  return paket.belgeler.some((b) => b.pakete_dahil && alintiGeciyor(b.metin, alinti));
}

/**
 * AI değerlendirmesini belge paketine karşı doğrular ve dayanak puanı üretir.
 *
 * Dayanak = puanın hangi kısmı belgeye bağlandı. Hiç alıntı yoksa 0 — puanı
 * yüksek olsa da slot dolduramaz.
 */
export function degerlendirmeyiDogrula(
  cikti: {
    gerekce: string;
    alintilar: readonly Alinti[];
    puanlar: readonly { kriter: string; puan: number; alinti_no?: readonly number[] }[];
  },
  paket: Paket,
  /** kriter → puandaki pay; dayanak kapsamasını ağırlıklandırır */
  agirliklar: Readonly<Record<string, number>> = {},
): Sonuc {
  const { dogrulanan, konum, dusenler, duzeltilenler, hatalar } = alintilariDogrula(
    cikti.alintilar,
    paket,
  );

  if (cikti.puanlar.some((p) => p.puan < 0 || p.puan > 100 || !Number.isInteger(p.puan))) {
    hatalar.push({ kod: "puan_araligi", mesaj: "Kriter puanı 0–100 aralığında tam sayı olmalı." });
  }

  // Sekiz FARKLI kriter: tekrar eden kriter `Object.fromEntries` ile teke iner
  // ve eksik kriterler normalize edilen payda kaybolur (tek kriterle dayanak 100).
  const kriterler = cikti.puanlar.map((p) => p.kriter);
  const beklenen = Object.keys(agirliklar);
  if (
    new Set(kriterler).size !== kriterler.length ||
    (beklenen.length && (kriterler.length !== beklenen.length || beklenen.some((k) => !kriterler.includes(k))))
  ) {
    hatalar.push({
      kod: "kriter_kumesi",
      mesaj: `Her kriter tam bir kez puanlanmalı; gelen: ${kriterler.join(", ")}.`,
    });
  }

  const kriterDayanagi: KriterDayanagi = {};
  for (const p of cikti.puanlar) {
    kriterDayanagi[p.kriter] = referanslariCoz(
      `${p.kriter} kriteri`,
      p.alinti_no ?? [],
      konum,
      dusenler,
    );
  }

  // Uydurma eşiği YALNIZCA belgede bulunamayan alıntıları sayar; numaralandırma
  // kusuru uydurma değildir ve bu orana girmez.
  const eslesmeyen = dusenler.filter((h) => h.kod === "alinti_eslesmiyor").length;
  if (cikti.alintilar.length && eslesmeyen / cikti.alintilar.length > UYDURMA_ESIGI) {
    hatalar.push({
      kod: "alinti_eslesmiyor",
      mesaj:
        `Alıntıların ${eslesmeyen}/${cikti.alintilar.length}'i belgede bulunamadı — ` +
        "çoğunluk uydurma sayılır ve çıktının tamamı reddedilir.",
    });
    hatalar.push(...dusenler);
  }

  // Kaynaksız sayısal token reddedilir: gerekçedeki her sayı belgede geçmeli.
  const kaynakMetni = normalize(
    paket.belgeler.filter((b) => b.pakete_dahil).map((b) => b.metin).join(" "),
  );
  for (const token of sayisalTokenlar(cikti.gerekce)) {
    if (!sayiKaynakta(token, kaynakMetni)) {
      hatalar.push({
        kod: "kaynaksiz_sayi",
        mesaj: `Belgelerde bulunmayan sayısal ifade: “${token}”. Kaynaksız sayı reddedilir.`,
      });
    }
  }

  if (hatalar.length) return { gecerli: false, hatalar };
  return {
    gecerli: true,
    dayanak: dayanakPuani(dogrulanan, paket, kriterDayanagi, agirliklar),
    dogrulanan,
    kriterDayanagi,
    dusenler,
    duzeltilenler,
  };
}

/**
 * Dayanak puanı: puanın hangi kısmı belgeye bağlandı, ne kadar ilgili parçayla,
 * kaç ayrı belgeye dayanarak.
 *
 * - **kapsama (%70)** — her kriter için onu destekleyen alıntıların en iyi
 *   örtüşme ağırlığı, **kriterin puandaki payıyla çarpılmış**. İki şeyi birden
 *   kapatır: (1) öneriyle zayıf örtüşen parçadan gelen destek zayıf sayılır,
 *   (2) `yerel_potansiyel` (%18) dayanaksız kalmak `surdurulebilirlik` (%8)
 *   dayanaksız kalmaktan pahalıdır. "Neden burada?" cevaplanmadıysa dayanak
 *   düşer — ölçülen şey puanın kendisinin ne kadar dayandığıdır.
 * - **çeşitlilik (%30)** — kaç ayrı belgeye dayanıyor. Tek belgeden beş alıntı,
 *   üç belgeden üç alıntı kadar güçlü değildir.
 *
 * Alıntı yoksa 0; eşlenmemiş alıntı dayanağa katkı vermez. Sayı değil kapsama
 * ölçüldüğü için "sırf sayı artsın diye alıntı eklemek" işe yaramaz.
 *
 * ponytail: bir alıntının o kriteri GERÇEKTEN destekleyip desteklemediği
 * mekanik olarak doğrulanamaz — model aynı alıntıyı yedi kritere eşleyebilir.
 * Ölçebildiğimiz: alıntı gerçek mi, öneriyle örtüşüyor mu, hangi kritere
 * eşlendi. Kalan yargı boşluğu ajans onayına bırakılır ve ekranda kriter
 * başına gösterilir; gizlenmiş bir sayı değildir.
 */
export function dayanakPuani(
  dogrulanan: readonly Alinti[],
  paket: Paket,
  kriterDayanagi: KriterDayanagi = {},
  /** kriter → puandaki pay; verilmezse kriterler eşit sayılır */
  agirliklar: Readonly<Record<string, number>> = {},
): number {
  if (!dogrulanan.length || !paket.belgeler.length) return 0;

  const ortusme = (a: Alinti): number => {
    const b = paket.belgeler.find((x) => x.id === a.belge_id);
    return Math.max(0, Math.min(1, b?.sira ?? 1));
  };

  const kriterler = Object.keys(kriterDayanagi);
  if (!kriterler.length) return 0;
  const toplamPay = kriterler.reduce((t, k) => t + (agirliklar[k] ?? 0), 0);
  // Ağırlık verilmediyse (veya eksikse) eşit pay: eski davranışa düşer.
  const pay = (k: string) => (toplamPay > 0 ? (agirliklar[k] ?? 0) / toplamPay : 1 / kriterler.length);

  const kapsama = kriterler.reduce(
    (t, k) =>
      t + pay(k) * Math.max(0, ...kriterDayanagi[k].map((i) => (dogrulanan[i] ? ortusme(dogrulanan[i]) : 0))),
    0,
  );

  // Çeşitlilik PARÇA değil BELGE sayar: bir planın dört parçası dört ayrı plan
  // değildir. Belge adı künyedir (`belge.ad`, parçalar aynı adı taşır).
  const ad = (id: number) => paket.belgeler.find((b) => b.id === id)?.ad;
  const eslenen = new Set(Object.values(kriterDayanagi).flat());
  const ayriBelge = new Set([...eslenen].map((i) => dogrulanan[i] && ad(dogrulanan[i].belge_id)).filter(Boolean)).size;
  const paketteBelge = new Set(paket.belgeler.map((b) => b.ad)).size;
  const cesitlilik = ayriBelge / Math.min(paketteBelge, 4);

  return Math.max(0, Math.min(100, Math.round(100 * (0.7 * kapsama + 0.3 * cesitlilik))));
}

/**
 * Modele verilecek paketi kurar. Model YALNIZCA bu paketi görür.
 *
 * Yerel numara burada atanır ve `kaynakBloguKur` aynı sırayı kullanır — ikisi
 * ayrışırsa alıntılar yanlış belgede aranır ve testler kırılır.
 */
export function paketKur(
  id: string,
  belgeler: readonly Omit<BelgeKaydi, "pakete_dahil" | "yerel">[],
): Paket {
  /**
   * Paket, modele GİDEN metnin aynısıdır. `kaynakBloguKur` metni
   * `MODEL_METIN_SINIRI`nda kesiyor; paket tam metni tutsaydı modele hiç
   * gösterilmemiş kuyruktan yapılan bir "alıntı" (ezberden) doğrulanırdı.
   */
  return {
    id,
    belgeler: belgeler.map((b, i) => ({
      ...b,
      metin: b.metin.slice(0, MODEL_METIN_SINIRI),
      yerel: i + 1,
      pakete_dahil: true,
    })),
  };
}

/** Bir belge parçasından modele gösterilen en çok karakter. `kaynakBloguKur` de bunu kullanır. */
export const MODEL_METIN_SINIRI = 4000;

export type KarsiGorus = { tur: KarsiGorusTuru; iddia: string; alinti_no?: readonly number[] };

/** Doğrulanmış karşı görüş: alıntıları birebir eşleşmiş, kendi içinde tam. */
export type DogrulanmisKarsiGorus = {
  tur: KarsiGorusTuru;
  iddia: string;
  alintilar: Array<{ belge_id: number; alinti: string }>;
};

export type KarsiGorusSonucu =
  | { gecerli: true; gorusler: DogrulanmisKarsiGorus[]; dusenler: Hata[]; duzeltilenler: Hata[] }
  | { gecerli: false; hatalar: Hata[] };

/**
 * Karşı görüşü doğrular.
 *
 * Aynı fail-closed zinciri: uydurulmuş belge kimliği sert ret, eşleşmeyen alıntı
 * düşürme. Ek kural: alıntısı kalmayan itiraz DÜŞER. Kaynaksız bir itiraz, tam
 * da bu ürünün reddettiği şeydir — "belgede yazıyor" diyip belgeyi
 * gösteremeyen bir cümle ajansın kararına giremez.
 *
 * Boş sonuç meşrudur: "belgelerde bu öneriye karşı dayanak bulunamadı" bilgi
 * taşıyan bir cevaptır, hata değil.
 */
export function karsiGorusuDogrula(
  cikti: { gorusler: readonly KarsiGorus[]; alintilar: readonly Alinti[] },
  paket: Paket,
): KarsiGorusSonucu {
  const { dogrulanan, konum, dusenler, duzeltilenler, hatalar } = alintilariDogrula(
    cikti.alintilar,
    paket,
  );
  if (hatalar.length) return { gecerli: false, hatalar };

  const kaynakMetni = normalize(
    paket.belgeler.filter((b) => b.pakete_dahil).map((b) => b.metin).join(" "),
  );
  const gorusler: DogrulanmisKarsiGorus[] = [];
  for (const g of cikti.gorusler) {
    // Ana değerlendirmedeki kural itirazda da geçerli: kaynaksız sayı taşıyan
    // itiraz DÜŞER (ana puanı engellemez, karşı görüş en iyi çabadır).
    const kaynaksiz = sayisalTokenlar(g.iddia).find((t) => !sayiKaynakta(t, kaynakMetni));
    if (kaynaksiz) {
      dusenler.push({
        kod: "kaynaksiz_sayi",
        mesaj: `Kaynaksız sayı (“${kaynaksiz}”) taşıyan itiraz düşürüldü: “${g.iddia.slice(0, 80)}”`,
      });
      continue;
    }
    const cozulen = referanslariCoz(`“${g.iddia.slice(0, 40)}…” itirazı`, g.alinti_no ?? [], konum, dusenler);
    if (!cozulen.length) {
      dusenler.push({
        kod: "alinti_no_gecersiz",
        mesaj: `Alıntısız itiraz düşürüldü: “${g.iddia.slice(0, 80)}”`,
      });
      continue;
    }
    gorusler.push({
      tur: g.tur,
      iddia: g.iddia,
      alintilar: cozulen.map((i) => ({ belge_id: dogrulanan[i].belge_id, alinti: dogrulanan[i].alinti })),
    });
  }

  return { gecerli: true, gorusler, dusenler, duzeltilenler };
}

// ── Aday keşfi ─────────────────────────────────────────────────────────────

/**
 * Alıntının kaynaktaki ÖZGÜN karşılığını keser.
 *
 * Karşılaştırma `normalize` ile yapılır (büyük/küçük harf, tipografik tırnak,
 * boşluk), ama kayda modelin yazdığı değil KAYNAĞIN metni girer: model bir
 * tırnağı ya da harfi değiştirmişse kayıt yine belgedeki gibidir.
 *
 * Yalnızca KESİNTİSİZ alıntı: "…" ile birleştirilmiş parçalar kanıt defterine
 * girmez — arası atlanmış bir pasaj, belgede o hâliyle geçmez.
 */
export function kaynaktanCikar(metin: string, alinti: string): string | null {
  const temiz = alinti.replace(/^[\s"'“”«»]+|[\s"'“”«»]+$/g, "");
  if (/…|\.{3,}/.test(temiz)) return null;
  const aranan = normalize(temiz);
  if (aranan.length < 20) return null;

  // Normalize edilmiş metnin her karakteri için kaynaktaki konum.
  let n = "";
  const kaynak: number[] = [];
  let bosluk = false;
  for (let i = 0; i < metin.length; i++) {
    if (/[\s |]/.test(metin[i])) {
      if (!bosluk && n.length) {
        n += " ";
        kaynak.push(i);
      }
      bosluk = true;
      continue;
    }
    bosluk = false;
    // Karakter başına normalize: tr-TR küçük harf ve tipografi (İ → i).
    for (const c of normalize(metin[i]) || metin[i]) {
      n += c;
      kaynak.push(i);
    }
  }
  const bas = n.indexOf(aranan);
  if (bas === -1) return null;
  return metin.slice(kaynak[bas], kaynak[bas + aranan.length - 1] + 1);
}

const kacisRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Bir pasaj hedef ile ilgili mi — MEKANİK kontrol, modelin beyanı değil.
 *
 * Ajans kapsamlı belge tek başına yetmez: parça komşu ili anlatabilir. Yerel
 * sayılması için ya belgenin kendisi o ile ait olmalı ya da pasajın içinde
 * bulunduğu CÜMLE(LER)DE il veya ilçe adı geçmeli. Karakter penceresi
 * kullanılmıyor: ölçüldü, "Kütahya'da seramik…" cümlesi bir önceki
 * cümledeki "Uşak'ta" yüzünden Uşak'a yerel sayılıyordu.
 *
 * ponytail: ad eşlemesi sol kelime sınırıyla önek araması ("Uşak'ta",
 * "Kütahyalı" yakalanır). "Muş" gibi kısa adlar "muşamba"ya takılabilir;
 * yanlış pozitif görülürse ek listesiyle daraltılır.
 */
export function yerelMi(
  parca: { metin: string; ilKod: string | null },
  pasaj: string,
  hedef: { ilKod: string; adlar: readonly string[] },
): boolean {
  if (parca.ilKod === hedef.ilKod) return true;
  const i = parca.metin.indexOf(pasaj);
  if (i === -1) return false;
  // Pasajı cümle sınırlarına genişlet. Pasaj zaten cümle sonuyla bitiyorsa
  // genişletme bir SONRAKİ cümleye taşmaz (ölçüldü: komşu cümledeki il adı
  // yakalanıyordu).
  const once = parca.metin.slice(0, i);
  const bas = Math.max(once.search(/[.!?]\s[^.!?]*$/) + 1, 0);
  const sonrasi = /[.!?]["'”’)]*\s*$/.test(pasaj) ? 0 : parca.metin.slice(i + pasaj.length).search(/[.!?](\s|$)/);
  const son = sonrasi === -1 ? parca.metin.length : i + pasaj.length + (sonrasi ? sonrasi + 1 : 0);
  const cumle = parca.metin.slice(bas, son).toLocaleLowerCase("tr-TR");
  return hedef.adlar.some((ad) =>
    new RegExp(`(?<![\\p{L}])${kacisRegex(ad.toLocaleLowerCase("tr-TR"))}`, "u").test(cumle),
  );
}

/** İçerik kelimesi kökleri: 5+ harfli kelimelerin ilk 5 harfi (Türkçe ekleri kabaca atar). */
function kokler(metin: string): string[] {
  return metin
    .toLocaleLowerCase("tr-TR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 5)
    .map((w) => w.slice(0, 5));
}

/**
 * Gerekçe cümlesi atıf yapılan kanıtlarda karşılık buluyor mu.
 *
 * Gerçek alıntı doğru gerekçe garantisi değil: ölçüldü, model defterde olan
 * ama ATIF YAPMADIĞI bir kanıtın cümlesini gerekçeye yazdı ("seramik
 * hammaddesi rezervleri…") ve gösterdiği kanıtlar bunu desteklemiyordu.
 * Her cümlenin içerik köklerinin en az yarısı atıf yapılan kanıtlarda geçmeli.
 *
 * ponytail: sözcüksel örtüşme, anlamsal destek değil — yeniden ifade edilmiş
 * doğru bir cümleyi düşürebilir (fail-closed yönde). Kalan yargı ajansta.
 */
export const GEREKCE_ORTUSME_ESIGI = 0.5;
export function desteksizCumle(gerekce: string, kanitMetni: string): string | null {
  const kaynak = new Set(kokler(kanitMetni));
  for (const c of gerekce.split(/(?<=[.!?;])\s+/)) {
    const k = kokler(c);
    if (k.length < 2) continue;
    if (k.filter((x) => kaynak.has(x)).length / k.length < GEREKCE_ORTUSME_ESIGI) return c.trim();
  }
  return null;
}

export const KANIT_TURLERI = ["yerel_olgu", "firsat", "oncelik", "kisit"] as const;
export type KanitTuru = (typeof KANIT_TURLERI)[number];

export type HamKanit = { belge_id: number; tur: KanitTuru; konu: string; alinti: string };
/** Doğrulanmış kanıt: `belge_id` veritabanı kimliği, `alinti` kaynaktan kesilmiş özgün metin. */
export type DogrulanmisKanit = HamKanit;

/**
 * Kanıt çıkarımını doğrular (tarama aşaması).
 *
 * Değerlendirmeyle aynı ilke: paket dışı belge sert ret, eşleşmeyen alıntı
 * düşer, yarısından fazlası düşerse çağrının tamamı reddedilir (model
 * uyduruyor). Fark: kayda modelin metni değil kaynaktan kesilen metin girer
 * ve atıf, metnin GERÇEKTEN bulunduğu parçaya yapılır. Konu adında kaynaksız
 * sayı taşıyan kanıt düşer.
 */
export function kanitlariDogrula(
  kanitlar: readonly HamKanit[],
  paket: Paket,
): { gecerli: true; kanitlar: DogrulanmisKanit[]; dusenler: Hata[] } | { gecerli: false; hatalar: Hata[] } {
  const sonuc: DogrulanmisKanit[] = [];
  const dusenler: Hata[] = [];
  const goruldu = new Set<string>();

  for (const k of kanitlar) {
    const adres = paket.belgeler.find((b) => b.yerel === k.belge_id);
    if (adres && !adres.pakete_dahil) {
      return { gecerli: false, hatalar: [{ kod: "pakette_yok", mesaj: `Belge pakete dahil değil: ${adres.ad}` }] };
    }
    // Önce gösterilen parça, sonra paketin geri kalanı: metin nerede geçiyorsa atıf oraya.
    const sira = [...(adres ? [adres] : []), ...paket.belgeler.filter((b) => b.pakete_dahil && b !== adres)];
    let bulunan: { belge: BelgeKaydi; metin: string } | null = null;
    for (const b of sira) {
      const m = kaynaktanCikar(b.metin, k.alinti);
      if (m) {
        bulunan = { belge: b, metin: m };
        break;
      }
    }
    if (!bulunan) {
      dusenler.push({
        kod: "alinti_eslesmiyor",
        mesaj: `Kanıt “${k.alinti.slice(0, 60)}…” kaynakta kesintisiz ve birebir bulunamadı; düşürüldü.`,
      });
      continue;
    }
    const kaynakMetni = normalize(bulunan.metin);
    const kaynaksiz = sayisalTokenlar(k.konu).find((t) => !sayiKaynakta(t, kaynakMetni));
    if (kaynaksiz) {
      dusenler.push({ kod: "kaynaksiz_sayi", mesaj: `Konu adında kaynaksız sayı (“${kaynaksiz}”); kanıt düşürüldü.` });
      continue;
    }
    const anahtar = `${bulunan.belge.id}:${kaynakMetni}`;
    if (goruldu.has(anahtar)) continue;
    goruldu.add(anahtar);
    sonuc.push({ belge_id: bulunan.belge.id, tur: k.tur, konu: k.konu.trim(), alinti: bulunan.metin });
  }

  /**
   * Taramada çağrı ancak HİÇBİR kanıt doğrulanamazsa reddedilir.
   *
   * Değerlendirmedeki "yarısından fazlası düşerse hepsi reddedilir" kuralı bir
   * PUANI korur: uyduran modelin sayısına güvenilmez. Kanıt defterinde puan
   * yok; her pasaj kendi başına kaynakta doğrulanır, düşen kaydedilmez. Kural
   * burada yalnızca doğru pasajları da çöpe atıyor ve parçayı "taranamadı"
   * bırakıyordu (canlıda 922 parçanın 24'ü). Hiçbiri doğrulanamazsa parça
   * gerçekten okunamamıştır: ret, nedeniyle birlikte kayda geçer.
   */
  if (kanitlar.length && !sonuc.length && dusenler.length) {
    return {
      gecerli: false,
      hatalar: [
        {
          kod: "alinti_eslesmiyor",
          mesaj: `${kanitlar.length} kanıtın hiçbiri kaynakta birebir bulunamadı; parça okunamadı.`,
        },
        ...dusenler,
      ],
    };
  }
  return { gecerli: true, kanitlar: sonuc, dusenler };
}

/** Aday üretiminde modele verilen defter satırı; `no` pakete yerel (1…n). */
export type DefterKaydi = { no: number; kanitId: number; yerel: boolean; metin: string };

export type HamUrunGrubu = { ad: string; kanit_no: readonly number[] };
export type HamAday = { baslik: string; gerekce: string; sentez?: string; kanit_no: readonly number[]; urun_gruplari?: readonly HamUrunGrubu[] };
/** Doğrulanmış ürün grubu: kendi kanıtına bağlı; `yerel` = kanıtlarından biri bu ile özgü. */
export type UrunGrubu = { ad: string; kanitIdleri: number[]; yerel: boolean };
/** `sentez`: modelin çıkarımı (olgu değil). Kanıtta olmayan sayı taşıyorsa boşaltılır. */
export type DogrulanmisAday = { baslik: string; gerekce: string; sentez: string; kanitIdleri: number[]; urunGruplari: UrunGrubu[] };

/**
 * Ürün grubunda ayırt edici sayılmayan genel kökler — "otomotiv sanayi"
 * ortaklığı sensör ya da elektrik motoru kabiliyetini kanıtlamaz.
 */
const GENEL_KOKLER = new Set(["sanay", "sektö", "üreti", "yatır", "tekno", "siste", "gelis", "geliş", "katma", "değer"]);

/**
 * Ürün gruplarını doğrular — her grup KENDİ kanıtına dayanmalı.
 *
 * Grup yalnızca adayın doğrulanmış kanıtlarına atıf yapabilir. Grubun
 * AYIRT EDİCİ kökü (başlıktaki şemsiye kelimeler ve genel kökler hariç) kendi
 * kanıt metninde geçmeli. Geçmeyen grup düşer, aday düşmez: dar ama güçlü
 * dayanaklı konu da meşrudur. 0 grup geçerli bir sonuçtur.
 *
 * ponytail: sözcüksel kontrol, anlamsal değil — "elektrik motorları" grubunu
 * "elektrikli motor sistemleri" pasajına bağlar, ama pasajın gerçekten o
 * kabiliyeti anlattığını ajans tartar.
 */
function urunGruplariniDogrula(
  baslik: string,
  gruplar: readonly HamUrunGrubu[],
  cozulen: readonly DefterKaydi[],
  numara: Map<number, DefterKaydi>,
  dusenler: Hata[],
): UrunGrubu[] {
  const izinli = new Set(cozulen.map((d) => d.kanitId));
  const baslikKokleri = new Set(kokler(baslik));
  const gorulen = new Set<string>();
  const sonuc: UrunGrubu[] = [];
  for (const g of gruplar.slice(0, 8)) {
    const ad = g.ad.trim();
    const anahtar = normalize(ad);
    if (!ad || gorulen.has(anahtar)) continue;
    const kanit = [...new Set(g.kanit_no)].map((n) => numara.get(n)).filter((d): d is DefterKaydi => Boolean(d) && izinli.has(d!.kanitId));
    const ayirt = kokler(ad).filter((k) => !baslikKokleri.has(k) && !GENEL_KOKLER.has(k));
    if (!kanit.length) {
      dusenler.push({ kod: "alinti_no_gecersiz", mesaj: `Ürün grubu “${ad}” adayın doğrulanmış bir kanıtına dayanmıyor; düşürüldü.` });
      continue;
    }
    if (!ayirt.length) {
      dusenler.push({ kod: "belge_yok", mesaj: `Ürün grubu “${ad}” yalnızca genel kelimelerden oluşuyor; düşürüldü.` });
      continue;
    }
    const kaynak = new Set(kokler(kanit.map((d) => d.metin).join(" ")));
    if (!ayirt.some((k) => kaynak.has(k))) {
      dusenler.push({ kod: "alinti_eslesmiyor", mesaj: `Ürün grubu “${ad}” atıf yaptığı kanıtlarda karşılık bulmuyor; düşürüldü.` });
      continue;
    }
    gorulen.add(anahtar);
    sonuc.push({ ad: ad.slice(0, 120), kanitIdleri: kanit.map((d) => d.kanitId), yerel: kanit.some((d) => d.yerel) });
  }
  return sonuc;
}

/**
 * Aday üretimini doğrular. Model yeni alıntı YAZAMAZ; yalnızca defterdeki
 * doğrulanmış kanıtlara numarayla atıf yapar.
 *
 * Aday başına kurallar (biri tutmazsa YALNIZCA o aday düşer; toplu çağrıda
 * iyi adaylar kötüsünü maskelemez, kötüsü de iyileri batırmaz):
 *  - en az iki farklı çözülen kanıt,
 *  - bunlardan en az biri YEREL ("neden burada?"),
 *  - başlık ve gerekçedeki her sayı atıf yapılan kanıtlardan birinde geçer,
 *  - çözülemeyen numaralar çözülenleri aşamaz,
 *  - gerekçenin her cümlesi atıf yapılan kanıtlarda karşılık bulur.
 */
/**
 * Modelin gerekçeye yazdığı atıf notu — "(kanıt 22)", "(kanıt 9 ve 31)", "[4, 7]".
 * Numara pakete yerel bir ADRESTİR, sayısal iddia değil; kayda da girmez.
 * Canlıda ölçüldü: Sonnet her cümleyi böyle bitiriyor, "kaynaksız sayı"
 * kuralı yedi adayın yedisini düşürüyordu.
 */
const ATIF_NOTU = /\s*(?:\([^()]*kan[ıi]t(?:lar)?(?![\p{L}])[^()]*\)|\[\s*\d+(?:\s*[,;]\s*\d+)*\s*\])/giu;
/** Parantezsiz atıf ("kanıt 64'e göre", "64 numaralı kanıt"): yalnızca sayı denetiminde yok sayılır. */
const CIPLAK_ATIF = /kan[ıi]t(?:lar)?(?:\s*no)?[\s:.]*\d+(?:\s*(?:,|ve|-)\s*\d+)*|\d+\s*(?:numaralı|no['’]?lu|nolu)\s*kan[ıi]t/giu;

/**
 * Gruplar arasında dengeli seçim: her grup sırayla bir kayıt verir, grubun
 * payı kendi içinde eşit aralıkla dağıtılır. Kanıt defteri bununla kurulur —
 * ilk N kaydı almak, defteri ilk taranan bir iki belgeye bırakıyordu.
 */
export function dengeliSec<T>(liste: readonly T[], anahtar: (x: T) => string | number, sinir: number): T[] {
  if (liste.length <= sinir) return [...liste];
  const gruplar = [...Map.groupBy(liste, anahtar).values()];
  const pay = gruplar.map(() => 0);
  for (let kalan = sinir; kalan > 0; ) {
    for (const [i, g] of gruplar.entries()) if (kalan > 0 && pay[i] < g.length) { pay[i]++; kalan--; }
  }
  return gruplar.flatMap((g, i) => Array.from({ length: pay[i] }, (_, j) => g[Math.floor((j * g.length) / pay[i])]));
}

export function adaylariDogrula(
  adaylar: readonly HamAday[],
  defter: readonly DefterKaydi[],
): { adaylar: DogrulanmisAday[]; dusenler: Hata[] } {
  const sonuc: DogrulanmisAday[] = [];
  const dusenler: Hata[] = [];
  const numara = new Map(defter.map((d) => [d.no, d]));

  for (const ham of adaylar) {
    const a = { ...ham, gerekce: ham.gerekce.replace(ATIF_NOTU, "").trim() };
    const ad =`“${a.baslik.slice(0, 60)}”`;
    const tekil = [...new Set(a.kanit_no)];
    // Aynı metin iki kanıt sayılmaz (çakışan pencere, eşzamanlı tarama).
    const metinler = new Set<string>();
    const cozulen = tekil
      .map((n) => numara.get(n))
      .filter((d): d is DefterKaydi => Boolean(d))
      .filter((d) => !metinler.has(normalize(d.metin)) && Boolean(metinler.add(normalize(d.metin))));
    if (cozulen.length < 2) {
      dusenler.push({ kod: "alinti_no_gecersiz", mesaj: `${ad} en az iki doğrulanmış kanıta dayanmıyor; düşürüldü.` });
      continue;
    }
    if (tekil.length - cozulen.length > cozulen.length) {
      dusenler.push({ kod: "alinti_no_gecersiz", mesaj: `${ad} atıflarının çoğu defterde yok; düşürüldü.` });
      continue;
    }
    if (!cozulen.some((d) => d.yerel)) {
      dusenler.push({ kod: "belge_yok", mesaj: `${ad} hiçbir yerel kanıta dayanmıyor; "neden burada?" cevapsız, düşürüldü.` });
      continue;
    }
    const kaynak = normalize(cozulen.map((d) => d.metin).join(" "));
    // Yalnızca adayın GERÇEKTEN atıf yaptığı numaralar yok sayılır: "kanıt 5000 ton" denetimden kaçamaz.
    const atifsiz = (s: string) =>
      s.replace(CIPLAK_ATIF, (m) => ((m.match(/\d+/g) ?? []).every((n) => a.kanit_no.includes(Number(n))) ? "" : m));
    const kaynaksiz = sayisalTokenlar(`${a.baslik} ${atifsiz(a.gerekce)}`).find((t) => !sayiKaynakta(t, kaynak));
    if (kaynaksiz) {
      dusenler.push({ kod: "kaynaksiz_sayi", mesaj: `${ad} kaynaksız sayı (“${kaynaksiz}”) taşıyor; düşürüldü.` });
      continue;
    }
    const desteksiz = desteksizCumle(a.gerekce, cozulen.map((d) => d.metin).join(" "));
    if (desteksiz) {
      dusenler.push({ kod: "alinti_eslesmiyor", mesaj: `${ad} gerekçesindeki “${desteksiz.slice(0, 80)}” cümlesi atıf yapılan kanıtlarda karşılık bulmuyor; düşürüldü.` });
      continue;
    }
    /**
     * Sentez modelin ÇIKARIMIDIR: kanıtta karşılık aranmaz (bağ kurar, olgu
     * söylemez) ve kayıtta öyle etiketlenir. Ama yeni sayı getiremez: kaynaksız
     * sayı taşıyan sentez düşer, aday kalır.
     */
    // Model etiketi kendisi de yazabiliyor; etiket kayıtta bir kez durur.
    let sentez = (ham.sentez ?? "").replace(ATIF_NOTU, "").replace(/^s*yapay zek[aâ] çıkarımı[^:]{0,30}:s*/iu, "").trim();
    const sentezSayisi = sayisalTokenlar(atifsiz(sentez)).find((t) => !sayiKaynakta(t, kaynak));
    if (sentezSayisi) {
      dusenler.push({ kod: "kaynaksiz_sayi", mesaj: `Çıkarım düşürüldü: ${ad} adayının çıkarımı kaynaksız sayı (“${sentezSayisi}”) taşıyor; aday çıkarımsız alındı.` });
      sentez = "";
    }
    sonuc.push({
      baslik: a.baslik.trim(),
      gerekce: a.gerekce.trim(),
      sentez,
      kanitIdleri: cozulen.map((d) => d.kanitId),
      urunGruplari: urunGruplariniDogrula(a.baslik, a.urun_gruplari ?? [], cozulen, numara, dusenler),
    });
  }
  return { adaylar: sonuc, dusenler };
}

export type UygunlukKarari = "uygun" | "kismen" | "uygun_degil" | "baglanamadi";
export type Uygunluk = {
  karar: UygunlukKarari;
  /** olgu: her cümlesi atıf yapılan kanıtta karşılık bulur; uygun değilse "" */
  gerekce: string;
  /** modelin çıkarımı (olgu değil) */
  sentez: string;
  /** uygun değilse ya da çekince varsa neden */
  neden: string;
  kanitIdleri: number[];
};

/**
 * Konu uygunluğu çıktısını doğrular — aday kurallarının AYNISI.
 *
 * "Uygun" ya da "kısmen" kararı ancak gerekçe aday kurallarından geçerse
 * ayakta kalır (≥2 kanıt, ≥1 yerel, kaynaksız sayı yok, her cümle kanıtta);
 * geçmezse karar "baglanamadi" olur ve neden mekanik kuralın kendisidir.
 * "Neden" metni modelin değerlendirmesidir; kaynaksız sayı taşıyorsa silinir.
 */
export function uygunluguDogrula(
  ham: { baslik: string; karar: "uygun" | "kismen" | "uygun_degil"; gerekce: string; sentez: string; neden: string; kanit_no: readonly number[] },
  defter: readonly DefterKaydi[],
): Uygunluk {
  const numara = new Map(defter.map((d) => [d.no, d]));
  const cozulen = [...new Set(ham.kanit_no)].map((n) => numara.get(n)).filter((d): d is DefterKaydi => Boolean(d));
  const kaynak = normalize(cozulen.map((d) => d.metin).join(" "));
  const kanitIdleri = cozulen.map((d) => d.kanitId);
  let neden = ham.neden.replace(ATIF_NOTU, "").trim();
  if (sayisalTokenlar(neden.replace(CIPLAK_ATIF, (m) => ((m.match(/\d+/g) ?? []).every((n) => ham.kanit_no.includes(Number(n))) ? "" : m))).some((t) => !sayiKaynakta(t, kaynak))) {
    neden = "";
  }
  if (ham.karar === "uygun_degil") {
    return { karar: "uygun_degil", gerekce: "", sentez: "", neden: neden || "Belgelerde bu konuyu bu ile bağlayan dayanak bulunamadı.", kanitIdleri };
  }
  const d = adaylariDogrula([{ baslik: ham.baslik, gerekce: ham.gerekce, sentez: ham.sentez, kanit_no: ham.kanit_no }], defter);
  const a = d.adaylar[0];
  if (!a) {
    return { karar: "baglanamadi", gerekce: "", sentez: "", neden: d.dusenler[0]?.mesaj ?? "Gerekçe kanıtlara bağlanamadı.", kanitIdleri };
  }
  return { karar: ham.karar, gerekce: a.gerekce, sentez: a.sentez, neden, kanitIdleri: a.kanitIdleri };
}

/**
 * Alıntının parça içindeki KESİN maddesi — "madde 472.1".
 *
 * Parça etiketi ("madde 470.2–474.1") parçanın kapsadığı ARALIKTIR; alıntının
 * nerede geçtiğini söylemez ve okuyan onu alıntının maddesi sanıyordu.
 * Alıntı kaynakta aranır, ondan önceki son madde başı alıntının maddesidir.
 * Alıntı parçanın ilk madde başından ÖNCE geçiyorsa (önceki parçadan
 * taşmış metin) madde bilinmez: null — uydurulmaz.
 *
 * Madde biçimi `belge-yukle.ts` MADDE ile aynı: satır başında "470.2. Büyük".
 */
const MADDE_BASI = /(?:^|\n)(\d{1,4}(?:\.\d{1,3})*)\.\s+\p{Lu}/gu;
export function alintininMaddesi(parcaMetni: string, alinti: string): string | null {
  const ozgun = kaynaktanCikar(parcaMetni, alinti);
  const konum = ozgun ? parcaMetni.indexOf(ozgun) : -1;
  if (konum === -1) return null;
  let son: string | null = null;
  for (const m of parcaMetni.matchAll(MADDE_BASI)) {
    if ((m.index ?? 0) > konum) break;
    son = m[1];
  }
  return son;
}

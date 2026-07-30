/**
 * Değerlendirme doğrulayıcı — AI Gateway'den ÖNCE gelir.
 *
 * Tüm kontroller FAIL-CLOSED: bir kontrol cevap veremiyorsa sonuç
 * "reddedildi"dir, "belki" değildir. Doğrulayıcıdan geçmeyen çıktı
 * kaydedilmez ve hiçbir koşulda sıralamaya giremez.
 */

export type BelgeKaydi = {
  id: number;
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
export type Alinti = { no: number; belge_id: number; alinti: string };

export type HataKodu =
  | "belge_yok"
  | "pakette_yok"
  | "alinti_eslesmiyor"
  | "kaynaksiz_sayi"
  | "puan_araligi"
  | "alinti_no_gecersiz"
  | "alinti_no_tekrar";

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
    }
  | { gecerli: false; hatalar: Hata[] };

/**
 * Doğrulanamayan alıntının yarısı aşılırsa çıktının tamamı reddedilir.
 *
 * Tek tek düşen alıntı olağandır (belge metni bozuk çıkmış olabilir); çoğunluğu
 * düşüyorsa model uyduruyor demektir ve hiçbir parçasına güvenilmez.
 */
const UYDURMA_ESIGI = 0.5;

/** Sayısal token: 12, 12,5, %41,3, 1.234 ton gibi. Yıllar sayılmaz. */
const SAYI = /(?<![\p{L}])[%₺$]?\d[\d.,]*(?:\s?(?:%|puan|kişi|ton|MW|km|m²|milyon|milyar|bin))?/gu;
const YIL = /^(19|20)\d{2}$/;

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
 * aksi hâlde birebir doğru alıntılar sırf tipografi yüzünden reddedilir.
 */
function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/[’‘`´ʼ]/g, "'")
    .replace(/[–—−]/g, "-")
    .replace(/["“”«»]/g, '"')
    .replace(/[\s ]+/g, " ")
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
  const parcalar = normalize(alinti)
    .split(/…+|\.{3,}/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 12);

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
 * AI değerlendirmesini belge paketine karşı doğrular ve dayanak puanı üretir.
 *
 * Dayanak = doğrulanmış alıntıların kapsadığı belge çeşitliliği ve sayısı.
 * Hiç alıntı yoksa 0 — puanı yüksek olsa da slot dolduramaz.
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
  const hatalar: Hata[] = [];

  if (cikti.puanlar.some((p) => p.puan < 0 || p.puan > 100 || !Number.isInteger(p.puan))) {
    hatalar.push({ kod: "puan_araligi", mesaj: "Kriter puanı 0–100 aralığında tam sayı olmalı." });
  }

  const dogrulanan: Alinti[] = [];
  const dusenler: Hata[] = [];

  /**
   * Tekrar eden numara referansı belirsizleştirir: iki adaydan hangisi
   * kastedildiği bilinemez, o yüzden ikisi de kullanılamaz sayılır.
   */
  const sayim = new Map<number, number>();
  for (const a of cikti.alintilar) sayim.set(a.no, (sayim.get(a.no) ?? 0) + 1);
  const belirsiz = new Set([...sayim].filter(([, n]) => n > 1).map(([no]) => no));
  for (const no of belirsiz) {
    dusenler.push({
      kod: "alinti_no_tekrar",
      mesaj: `${no} numarası birden çok alıntıya verilmiş; hangisi kastedildiği belirsiz, eşleme düşürüldü.`,
    });
  }
  /** alıntı no → doğrulanan listesindeki konum; düşen alıntı haritada yok */
  const yeniSira = new Map<number, number>();

  for (const a of cikti.alintilar) {
    const belge = paket.belgeler.find((b) => b.id === a.belge_id);
    // Uydurulmuş belge kimliği ve paket dışı belge GÜVENLİK ihlalidir → sert ret.
    if (!belge) {
      hatalar.push({ kod: "belge_yok", mesaj: `Belge bulunamadı: ${a.belge_id}` });
      continue;
    }
    if (!belge.pakete_dahil) {
      hatalar.push({
        kod: "pakette_yok",
        mesaj: `Belge pakete dahil değil; model bunu görmüş olamaz: ${belge.ad}`,
      });
      continue;
    }
    // Eşleşmeyen alıntı DÜŞÜRÜLÜR: kaydedilmez, dayanağa katkı vermez, denetime yazılır.
    if (!alintiGeciyor(belge.metin, a.alinti)) {
      dusenler.push({
        kod: "alinti_eslesmiyor",
        mesaj: `Alıntı “${a.alinti.slice(0, 60)}…” ${belge.ad}${belge.bolum ? ` · ${belge.bolum}` : ""} içinde birebir bulunamadı; düşürüldü.`,
      });
      continue;
    }
    if (!belirsiz.has(a.no)) yeniSira.set(a.no, dogrulanan.length);
    dogrulanan.push(a);
  }

  /**
   * Kriter → doğrulanmış alıntı eşlemesi.
   *
   * Çözülemeyen referans (düşen alıntı, belirsiz numara, hiç verilmemiş numara)
   * eşlemeden çıkar ve denetime yazılır. Bu SERT RET DEĞİL: alıntı listesinin
   * kendisi doğrulanmış durumda, kusur muhasebede. Cezası kredi kaybıdır ve
   * doğru yönde fail-closed'dır — doğrulanamayan destek sayılmaz.
   */
  const kriterDayanagi: KriterDayanagi = {};
  for (const p of cikti.puanlar) {
    const cozulen: number[] = [];
    for (const no of p.alinti_no ?? []) {
      const konum = yeniSira.get(no);
      if (konum === undefined) {
        dusenler.push({
          kod: "alinti_no_gecersiz",
          mesaj: `${p.kriter} kriteri ${no} numaralı alıntıya dayandırıldı; bu numara çözülemedi, eşleme düşürüldü.`,
        });
        continue;
      }
      cozulen.push(konum);
    }
    kriterDayanagi[p.kriter] = cozulen;
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
    if (!kaynakMetni.includes(normalize(token))) {
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

  const eslenen = new Set(Object.values(kriterDayanagi).flat());
  const ayriBelge = new Set([...eslenen].map((i) => dogrulanan[i]?.belge_id).filter(Boolean)).size;
  const cesitlilik = ayriBelge / Math.min(paket.belgeler.length, 4);

  return Math.max(0, Math.min(100, Math.round(100 * (0.7 * kapsama + 0.3 * cesitlilik))));
}

/** Modele verilecek paketi kurar. Model YALNIZCA bu paketi görür. */
export function paketKur(id: string, belgeler: readonly Omit<BelgeKaydi, "pakete_dahil">[]): Paket {
  return { id, belgeler: belgeler.map((b) => ({ ...b, pakete_dahil: true })) };
}

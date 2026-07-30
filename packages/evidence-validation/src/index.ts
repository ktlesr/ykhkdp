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
  /** modele gerçekten verildi mi */
  pakete_dahil: boolean;
};

export type Paket = { id: string; belgeler: BelgeKaydi[] };

export type Alinti = { belge_id: number; alinti: string };

export type HataKodu =
  | "belge_yok"
  | "pakette_yok"
  | "alinti_eslesmiyor"
  | "kaynaksiz_sayi"
  | "puan_araligi";

export type Hata = { kod: HataKodu; mesaj: string };

export type Sonuc =
  | {
      gecerli: true;
      dayanak: number;
      /** birebir doğrulanmış alıntılar — YALNIZCA bunlar kaydedilir */
      dogrulanan: Alinti[];
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
  cikti: { gerekce: string; alintilar: readonly Alinti[]; puanlar: readonly { puan: number }[] },
  paket: Paket,
): Sonuc {
  const hatalar: Hata[] = [];

  if (cikti.puanlar.some((p) => p.puan < 0 || p.puan > 100 || !Number.isInteger(p.puan))) {
    hatalar.push({ kod: "puan_araligi", mesaj: "Kriter puanı 0–100 aralığında tam sayı olmalı." });
  }

  const dogrulanan: Alinti[] = [];
  const dusenler: Hata[] = [];

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
    dogrulanan.push(a);
  }

  if (cikti.alintilar.length && dusenler.length / cikti.alintilar.length > UYDURMA_ESIGI) {
    hatalar.push({
      kod: "alinti_eslesmiyor",
      mesaj:
        `Alıntıların ${dusenler.length}/${cikti.alintilar.length}'i belgede bulunamadı — ` +
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
  return { gecerli: true, dayanak: dayanakPuani(dogrulanan, paket), dogrulanan, dusenler };
}

/**
 * Dayanak puanı: doğrulanmış alıntı sayısı ve kaç ayrı belgeye dayandığı.
 *
 * ponytail: doğrusal formül. Anlamsal kapsam ölçmüyor; alıntı sayısı ve belge
 * çeşitliliği yakınsak bir vekil. Gerçek kapsam ölçümü gerekirse kriter başına
 * alıntı eşlemesi eklenir ve formül tek yerde değişir.
 */
export function dayanakPuani(dogrulanan: readonly Alinti[], paket: Paket): number {
  if (!dogrulanan.length || !paket.belgeler.length) return 0;
  const ayriBelge = new Set(dogrulanan.map((a) => a.belge_id)).size;
  const cesitlilik = ayriBelge / Math.min(paket.belgeler.length, 4);
  const yogunluk = Math.min(dogrulanan.length, 6) / 6;
  return Math.max(0, Math.min(100, Math.round(100 * (0.6 * cesitlilik + 0.4 * yogunluk))));
}

/** Modele verilecek paketi kurar. Model YALNIZCA bu paketi görür. */
export function paketKur(id: string, belgeler: readonly Omit<BelgeKaydi, "pakete_dahil">[]): Paket {
  return { id, belgeler: belgeler.map((b) => ({ ...b, pakete_dahil: true })) };
}

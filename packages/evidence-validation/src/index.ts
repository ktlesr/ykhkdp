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
export type Sonuc = { gecerli: true; dayanak: number } | { gecerli: false; hatalar: Hata[] };

/** Sayısal token: 12, 12,5, %41,3, 1.234 ton gibi. Yıllar sayılmaz. */
const SAYI = /(?<![\p{L}])[%₺$]?\d[\d.,]*(?:\s?(?:%|puan|kişi|ton|MW|km|m²|milyon|milyar|bin))?/gu;
const YIL = /^(19|20)\d{2}$/;

export function sayisalTokenlar(metin: string): string[] {
  return [...metin.matchAll(SAYI)]
    .map((m) => m[0].trim())
    .filter((t) => !YIL.test(t.replace(/\D/g, "")) || t.includes("%"));
}

function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR").replace(/[\s ]+/g, " ").trim();
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
  for (const a of cikti.alintilar) {
    const belge = paket.belgeler.find((b) => b.id === a.belge_id);
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
    if (!normalize(belge.metin).includes(normalize(a.alinti))) {
      hatalar.push({
        kod: "alinti_eslesmiyor",
        mesaj: `Alıntı “${a.alinti.slice(0, 60)}…” ${belge.ad} içinde bulunamadı.`,
      });
      continue;
    }
    dogrulanan.push(a);
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
  return { gecerli: true, dayanak: dayanakPuani(dogrulanan, paket) };
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

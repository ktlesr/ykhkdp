import { gorebilir, type ErisimSinifi, type Rol } from "@ykh/domain";

/**
 * Kanıt doğrulayıcı — AI Gateway'den ÖNCE gelir (brief §10.4).
 *
 * Tüm kontroller FAIL-CLOSED: bir kontrol cevap veremiyorsa sonuç "reddedildi"
 * olur, "belki" olmaz. Doğrulayıcıdan geçmeyen bulgu hiçbir koşulda puanlama
 * girdisine dönüşemez.
 */

export type KaynakKaydi = {
  evidenceId: string;
  accessClass: ErisimSinifi;
  /** kaynak paketine dahil edilmiş mi — modele gerçekten verildi mi */
  pakete_dahil: boolean;
  belgeMetni: string;
  spanBaslangic: number | null;
  spanBitis: number | null;
};

export type KaynakPaketi = {
  /** paketin kimliği; bulgu bu pakete karşı doğrulanır */
  id: string;
  kayitlar: KaynakKaydi[];
};

export type Bulgu = {
  /** modelin ürettiği metin */
  metin: string;
  /** dayandırdığı kanıtlar */
  evidenceIds: string[];
  /** modelin alıntıladığını iddia ettiği metin (varsa) */
  alinti?: string;
};

export type HataKodu =
  | "evidence_id_yok"
  | "pakette_yok"
  | "yetki_yok"
  | "span_gecersiz"
  | "alinti_eslesmiyor"
  | "kaynaksiz_sayi"
  | "kaynak_gosterilmedi";

export type Hata = { kod: HataKodu; mesaj: string; evidenceId?: string };

export type Sonuc = { gecerli: true } | { gecerli: false; hatalar: Hata[] };

/** Sayısal token: 12, 12,5, %41,3, 1.234, 2019–2024 gibi. */
const SAYI = /(?<![\p{L}])[%₺$]?\d[\d.,]*(?:\s?(?:%|puan|kişi|ton|MW|km|m²|milyon|milyar|bin))?/gu;

/** Yıl aralığı ve tek yıllar sayısal iddia sayılmaz — bağlam bilgisidir. */
const YIL = /^(19|20)\d{2}$/;

export function sayisalTokenlar(metin: string): string[] {
  return [...metin.matchAll(SAYI)]
    .map((m) => m[0].trim())
    .filter((t) => !YIL.test(t.replace(/\D/g, "")) || t.includes("%"));
}

function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR").replace(/[\s ]+/g, " ").trim();
}

/**
 * Bir AI bulgusunu kaynak paketine karşı doğrular.
 *
 * @param rol doğrulamayı isteyen kullanıcının rolü — yetki kontrolü buna göre
 */
export function bulguyuDogrula(bulgu: Bulgu, paket: KaynakPaketi, rol: Rol): Sonuc {
  const hatalar: Hata[] = [];

  if (!bulgu.evidenceIds.length) {
    hatalar.push({ kod: "kaynak_gosterilmedi", mesaj: "Bulgu hiçbir kanıta dayandırılmamış." });
  }

  const dayanaklar: KaynakKaydi[] = [];

  for (const id of bulgu.evidenceIds) {
    const kayit = paket.kayitlar.find((k) => k.evidenceId === id);
    if (!kayit) {
      hatalar.push({ kod: "evidence_id_yok", mesaj: `Kanıt bulunamadı: ${id}`, evidenceId: id });
      continue;
    }
    if (!kayit.pakete_dahil) {
      hatalar.push({
        kod: "pakette_yok",
        mesaj: `Kanıt kaynak paketine dahil değil; model bunu görmüş olamaz: ${id}`,
        evidenceId: id,
      });
      continue;
    }
    if (!gorebilir(rol, kayit.accessClass)) {
      hatalar.push({ kod: "yetki_yok", mesaj: `Bu kanıta erişim yetkiniz yok: ${id}`, evidenceId: id });
      continue;
    }
    if (kayit.spanBaslangic !== null && kayit.spanBitis !== null) {
      const gecerli =
        kayit.spanBaslangic >= 0 &&
        kayit.spanBitis > kayit.spanBaslangic &&
        kayit.spanBitis <= kayit.belgeMetni.length;
      if (!gecerli) {
        hatalar.push({
          kod: "span_gecersiz",
          mesaj: `Sayfa/span aralığı belge metnine oturmuyor: ${id}`,
          evidenceId: id,
        });
        continue;
      }
    }
    dayanaklar.push(kayit);
  }

  // Alıntı gerçekten belgede mi
  if (bulgu.alinti && dayanaklar.length) {
    const metinler = dayanaklar.map((d) => normalize(d.belgeMetni));
    if (!metinler.some((m) => m.includes(normalize(bulgu.alinti!)))) {
      hatalar.push({ kod: "alinti_eslesmiyor", mesaj: "Alıntı kaynak belgede bulunamadı." });
    }
  }

  // Kaynaksız sayısal token reddedilir (brief §3)
  const kaynakMetni = dayanaklar.map((d) => normalize(d.belgeMetni)).join(" ");
  for (const token of sayisalTokenlar(bulgu.metin)) {
    if (!kaynakMetni.includes(normalize(token))) {
      hatalar.push({
        kod: "kaynaksiz_sayi",
        mesaj: `Kaynakta bulunmayan sayısal ifade: “${token}”. Kaynaksız sayı reddedilir.`,
      });
    }
  }

  return hatalar.length ? { gecerli: false, hatalar } : { gecerli: true };
}

/**
 * Kaynak paketi kurar. Modele YALNIZCA bu paket verilir; kapalı kaynak modu
 * (brief §3) bu fonksiyonun dışında bir girdi olmadığı anlamına gelir.
 */
export function kaynakPaketiKur(
  id: string,
  kayitlar: readonly Omit<KaynakKaydi, "pakete_dahil">[],
  rol: Rol,
): KaynakPaketi {
  return {
    id,
    // Yetkisi olmayan kanıt pakete hiç girmez — model onu göremez.
    kayitlar: kayitlar.filter((k) => gorebilir(rol, k.accessClass)).map((k) => ({ ...k, pakete_dahil: true })),
  };
}

/**
 * Doğrulanmış bulgunun puanlamaya girip giremeyeceği. Tek geçit:
 * doğrulayıcıdan geçmiş OLSA BİLE uzman onayı olmadan puana giremez (§1.3).
 */
export function puanlamaGiriseHazir(sonuc: Sonuc, uzmanOnayladi: boolean): boolean {
  return sonuc.gecerli && uzmanOnayladi;
}

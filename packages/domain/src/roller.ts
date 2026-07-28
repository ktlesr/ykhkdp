/**
 * Brief §4 — kullanıcı modeli.
 *
 * Kurumsal kayıt, kurum doğrulama ve kurum onayı YOKTUR. Kullanıcılar bireydir.
 * Öneri verme herkese açık (e-posta doğrulamalı hesap yeterli).
 * Yetkili roller davetle atanır.
 */

export const ROLLER = [
  "birey",
  "ajans_uzmani",
  "sektor_uzmani",
  "kurul_uyesi",
  "gozlemci",
  "denetci",
  "sistem_yoneticisi",
  "ai_yonetisim",
] as const;

export type Rol = (typeof ROLLER)[number];

/** Davetle atanan roller. `birey` kendi kaydolur, diğerleri atanır. */
export const DAVETLE_ATANAN: readonly Rol[] = ROLLER.filter((r) => r !== "birey");

export const ROL_ETIKET: Record<Rol, string> = {
  birey: "Birey",
  ajans_uzmani: "Ajans uzmanı",
  sektor_uzmani: "Sektör uzmanı",
  kurul_uyesi: "Kurul üyesi",
  gozlemci: "Gözlemci",
  denetci: "Denetçi",
  sistem_yoneticisi: "Sistem yöneticisi",
  ai_yonetisim: "AI yönetişim sorumlusu",
};

/** Kanıt doğrulayabilen roller — §1.3, puanlamaya yalnızca uzman onaylı kanıt girer. */
export const KANIT_DOGRULAYABILIR: readonly Rol[] = ["ajans_uzmani", "sektor_uzmani"];

/** Kararı kilitleyebilen roller — §7, geri alınamaz işlem. */
export const KARAR_KILITLEYEBILIR: readonly Rol[] = ["kurul_uyesi"];

/** Salt okuma rolleri; hiçbir durum geçişi tetikleyemez. */
export const SALT_OKUR: readonly Rol[] = ["gozlemci", "denetci"];

export function rolVar(rol: Rol, kume: readonly Rol[]): boolean {
  return kume.includes(rol);
}

/**
 * Veri sınıfı — her tabloda `access_class` sütunu zorunlu (brief §7, rls-first).
 * Maskeleme ve RLS politikaları bu sınıfa göre yazılır.
 */
export const ERISIM_SINIFLARI = ["kamuya_acik", "kurum_ici", "kisitli", "gizli"] as const;
export type ErisimSinifi = (typeof ERISIM_SINIFLARI)[number];

/** Bir rolün görebileceği en yüksek veri sınıfı. */
const GORUS: Record<Rol, ErisimSinifi[]> = {
  birey: ["kamuya_acik"],
  gozlemci: ["kamuya_acik", "kurum_ici"],
  ajans_uzmani: ["kamuya_acik", "kurum_ici", "kisitli"],
  sektor_uzmani: ["kamuya_acik", "kurum_ici", "kisitli"],
  kurul_uyesi: ["kamuya_acik", "kurum_ici", "kisitli"],
  denetci: ["kamuya_acik", "kurum_ici", "kisitli", "gizli"],
  ai_yonetisim: ["kamuya_acik", "kurum_ici", "kisitli", "gizli"],
  sistem_yoneticisi: ["kamuya_acik", "kurum_ici", "kisitli", "gizli"],
};

export function gorebilir(rol: Rol, sinif: ErisimSinifi): boolean {
  return GORUS[rol].includes(sinif);
}

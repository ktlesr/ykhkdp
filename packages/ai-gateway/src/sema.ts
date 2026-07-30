import { z } from "zod";

/**
 * Yapılandırılmış çıktı şemaları. JSON Schema strict + Zod.
 * Şema dışı çıktı reddedilir — `.strict()` her nesnede zorunlu.
 */

const KRITER = z.enum([
  "plan_uyumu",
  "yerel_potansiyel",
  "pazar_talep",
  "deger_zinciri",
  "istihdam_katma_deger",
  "uygulanabilirlik",
  "yatirimci_ilgisi",
  "surdurulebilirlik",
]);

const Alinti = z
  .object({
    /**
     * Alıntının KENDİ numarası; `puanlar[].alinti_no` buna referans verir.
     *
     * Dizi indeksi kullanmıyoruz: model 0 tabanlı indekslemede yanılıyor
     * (5 alıntı için "5. alıntı" yazdı). Numarayı kendisi verince tek şart
     * kendi kendisiyle tutarlı olması — bunu yapabiliyor.
     */
    no: z.number().int().min(0).max(99),
    belge_id: z.number().int().positive(),
    /** belgede birebir geçen kısa alıntı; doğrulayıcı bunu belgede arar */
    alinti: z.string().min(10).max(400),
  })
  .strict();

/** Öneriyi sekiz kriterle puanlar ve her kriteri belgeye bağlar. */
export const Degerlendirme = z
  .object({
    puanlar: z
      .array(
        z
          .object({
            kriter: KRITER,
            puan: z.number().int().min(0).max(100),
            not: z.string().min(5).max(300),
            /**
             * Bu puanı dayandırdığı alıntıların `alintilar[].no` değerleri.
             * Boş liste meşrudur: o kriter "dayanaksız kriter" olarak görünür
             * ve dayanak puanını düşürür.
             */
            alinti_no: z.array(z.number().int().min(0).max(99)).max(8),
          })
          .strict(),
      )
      .length(8),
    /** özet gerekçe — yatırımcıya gösterilen metin */
    gerekce: z.string().min(40).max(1200),
    /** üst ölçekli belgelerden alıntılar; boşsa dayanak puanı 0 olur */
    alintilar: z.array(Alinti).max(8),
    eksik_veri: z.array(z.string().max(200)).max(6),
  })
  .strict();

export type Degerlendirme = z.infer<typeof Degerlendirme>;

/** Öneri metninden NACE kodu önerir. Kullanıcı kod girmediyse çalışır. */
export const NaceOnerisi = z
  .object({
    /** aday kodlar, en olasıdan başlayarak */
    adaylar: z
      .array(
        z
          .object({
            kod: z.string().regex(/^\d{2}\.\d{2}(\.\d{2})?$/, "NACE biçimi: 13.10 veya 13.10.03"),
            gerekce: z.string().min(5).max(300),
            guven: z.enum(["dusuk", "orta", "yuksek"]),
          })
          .strict(),
      )
      .min(1)
      .max(3),
  })
  .strict();

export type NaceOnerisi = z.infer<typeof NaceOnerisi>;

export const SEMALAR = {
  degerlendirme: Degerlendirme,
  nace_onerisi: NaceOnerisi,
} as const;

export type SemaAdi = keyof typeof SEMALAR;

export function jsonSema(ad: SemaAdi) {
  return z.toJSONSchema(SEMALAR[ad], { io: "output" });
}

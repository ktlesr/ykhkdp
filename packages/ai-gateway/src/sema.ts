import { z } from "zod";

/**
 * Yapılandırılmış çıktı şemaları. JSON Schema strict + Zod (brief §3).
 * Şema dışı çıktı reddedilir — `.strict()` her nesnede zorunludur.
 */

export const IddiaCikarimi = z
  .object({
    iddialar: z
      .array(
        z
          .object({
            metin: z.string().min(10).max(400),
            evidence_ids: z.array(z.string().min(3)).min(1),
            alinti: z.string().max(600).nullable(),
            guven: z.enum(["dusuk", "orta", "yuksek"]),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    eksik_veri: z.array(z.string().max(200)).max(10),
  })
  .strict();

export type IddiaCikarimi = z.infer<typeof IddiaCikarimi>;

export const NaceOnerisi = z
  .object({
    kod: z.string().regex(/^\d{2}(\.\d{1,2})?$/, "NACE kodu biçimi: 13 veya 13.10"),
    aciklama: z.string().min(3).max(200),
    guven: z.enum(["dusuk", "orta", "yuksek"]),
    gerekce: z.string().max(400),
  })
  .strict();

export type NaceOnerisi = z.infer<typeof NaceOnerisi>;

export const MukerrerlikOnerisi = z
  .object({
    benzer: z
      .array(
        z
          .object({
            oneri_id: z.number().int().positive(),
            benzerlik: z.number().min(0).max(100),
            gerekce: z.string().max(300),
          })
          .strict(),
      )
      .max(5),
  })
  .strict();

export type MukerrerlikOnerisi = z.infer<typeof MukerrerlikOnerisi>;

export const GerekceMetni = z
  .object({
    metin: z.string().min(40).max(2000),
    evidence_ids: z.array(z.string()).min(1),
  })
  .strict();

export type GerekceMetni = z.infer<typeof GerekceMetni>;

export const SEMALAR = {
  iddia_cikarimi: IddiaCikarimi,
  nace_onerisi: NaceOnerisi,
  mukerrerlik: MukerrerlikOnerisi,
  gerekce_metni: GerekceMetni,
} as const;

export type SemaAdi = keyof typeof SEMALAR;

/** OpenAI Structured Outputs / JSON Schema karşılığı. */
export function jsonSema(ad: SemaAdi) {
  return z.toJSONSchema(SEMALAR[ad], { io: "output" });
}

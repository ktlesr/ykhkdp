import { KARSI_GORUS_TURLERI } from "@ykh/domain";
import { KANIT_TURLERI } from "@ykh/evidence-validation";
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
    /** `<belge id="…">` bloğundaki PAKETE YEREL numara (1…n), veritabanı kimliği değil */
    // Üst sınır gevşek: aralık dışı numara sert ret DEĞİL, doğrulayıcı metni
    // pakette bulursa atfı düzeltir (brif §6). Sıkı sınır şemada reddettiriyordu.
    belge_id: z.number().int().min(1).max(9999),
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
      .length(8)
      // Sekiz FARKLI kriter. JSON Schema bunu ifade edemiyor (refine dışa
      // aktarılmaz); Structured Outputs'u bozmadan Zod tarafında kapatılır.
      .refine((p) => new Set(p.map((x) => x.kriter)).size === p.length, {
        message: "Her kriter tam bir kez puanlanmalı.",
      }),
    /** özet gerekçe — yatırımcıya gösterilen metin */
    gerekce: z.string().min(40).max(1200),
    /**
     * Ana çerçeve — konunun on temel unsurla (`TEMEL_UNSURLAR`) ilişkisi.
     * `unsur` 0 = hiçbirine doğrudan girmiyor. Modelin SINIFLAMASIDIR;
     * PUANA ETKİ ETMEZ, ajansın okuyacağı açıklamadır.
     */
    cerceve: z
      .object({
        unsur: z.number().int().min(0).max(10),
        aciklama: z.string().min(10).max(300),
      })
      .strict(),
    /** üst ölçekli belgelerden alıntılar; boşsa dayanak puanı 0 olur */
    alintilar: z.array(Alinti).max(8),
    eksik_veri: z.array(z.string().max(200)).max(6),
    /**
     * Konu ölçeği — PUANA ETKİ ETMEZ. Kapsamın genişliği talep kanıtı
     * değildir; bu not ajansın kararına girer, sıralamaya girmez.
     */
    kapsam: z
      .object({
        tur: z.enum(["dar", "urun_ailesi", "asiri_genis", "kanit_yetersiz"]),
        aciklama: z.string().min(10).max(400),
      })
      .strict(),
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

/**
 * Karşı görüş: aynı belgelerle önerinin ALEYHİNE en güçlü itiraz.
 *
 * Ajans tek taraflı bir savunma değil, karşı tezi de görür. Puanı DEĞİŞTİRMEZ —
 * insanın tartacağı bir girdidir. Boş liste meşrudur.
 */
export const KarsiGorus = z
  .object({
    gorusler: z
      .array(
        z
          .object({
            // Tür listesi @ykh/domain'de; şema ile UI etiketi ayrışamaz.
            tur: z.enum(KARSI_GORUS_TURLERI),
            iddia: z.string().min(20).max(400),
            /** itirazı dayandıran alıntıların `alintilar[].no` değerleri */
            alinti_no: z.array(z.number().int().min(0).max(99)).max(4),
          })
          .strict(),
      )
      .max(4),
    alintilar: z.array(Alinti).max(6),
  })
  .strict();

export type KarsiGorus = z.infer<typeof KarsiGorus>;

/**
 * Kanıt çıkarımı — aday keşfinin TARAMA aşaması. Puan yok, aday yok: yalnızca
 * belgede yazanı birebir pasajla kayda geçirir. Boş liste meşrudur.
 */
export const KanitCikarimi = z
  .object({
    kanitlar: z
      .array(
        z
          .object({
            belge_id: z.number().int().min(1).max(64),
            tur: z.enum(KANIT_TURLERI),
            /** pasajın neyle ilgili olduğu, kısa ad: "tekstil geri dönüşümü" */
            konu: z.string().min(3).max(120),
            /** belgede KESİNTİSİZ ve birebir geçen pasaj; "…" yok */
            alinti: z.string().min(20).max(400),
          })
          .strict(),
      )
      // Yoğun bir parça 12'yi aşabiliyor ve şema reddi bütün parçayı
      // taranmamış bırakıyordu; sınır prompt'ta 12, şemada pay bırakıldı.
      .max(24),
  })
  .strict();

/**
 * Aday üretimi — keşfin İL aşaması. Model yeni alıntı yazamaz; yalnızca
 * defterdeki doğrulanmış kanıtlara `kanit_no` ile atıf yapar.
 */
/**
 * Yerel yatırım konularının belirlenmesinde temel alınacak unsurlar — ANA
 * ÇERÇEVE. Her keşif adayı bunlardan birine girmek zorundadır (`unsur`);
 * şema dışındaki numara çıktıyı reddettirir. Kısa adlar ekranda, tam metin
 * prompt'ta (`aday_kesfi`).
 */
export const TEMEL_UNSURLAR: Record<number, string> = {
  1: "ekonomik coğrafyanın potansiyeli ve coğrafyadan kaynaklı darboğazın çözümü",
  2: "bölgede üretilmeyen ama ekonomik coğrafyanın mümkün kıldığı ürün",
  3: "turizm destinasyonunu çeşitlendiren ve cazibe katan yatırım",
  4: "tarımsal ürünün ve mevcut nihai ürünün daha katma değerli ürüne dönüşmesi",
  5: "üretim ekosisteminde ileri-geri bağlantı",
  6: "üretim atıklarının değerlendirilmesi, döngüsel üretim",
  7: "ilin bilgi ve becerisine uygun yatırım",
  8: "ithal edilen girdinin yerli üretimi",
  9: "kümelenme potansiyeli taşıyan sektörün yenilik ve teknoloji düzeyini yükseltme",
  10: "yaşam kalitesini yükselten özel sektör hizmet altyapısı",
};

export const AdayKesfi = z
  .object({
    adaylar: z
      .array(
        z
          .object({
            // Alt uzunluk sınırı ŞEMADA DEĞİL, aday başına doğrulayıcıdadır
            // (`adaylariDogrula`): canlıda tek bir kısa başlık bütün ilin
            // adaylarını reddettirdi. Kötü aday iyileri batırmaz.
            baslik: z.string().min(1).max(140),
            /** "neden bu ilde?" — yalnızca atıf yapılan kanıtlarda yazanla */
            gerekce: z.string().min(1).max(1200),
            /** Uzman çıkarımı — kanıtları birleştiren bağ; olgu değil, ekranda öyle etiketlenir. Boş olabilir. */
            sentez: z.string().max(600),
            /** Ana çerçeve: adayın girdiği temel unsur (1–10, `TEMEL_UNSURLAR`). */
            unsur: z.number().int().min(1).max(10),
            kanit_no: z.array(z.number().int().min(1).max(200)).min(2).max(8),
            /**
             * Ürün grupları — her grup KENDİ kanıtına (`kanit_no`) dayanır.
             * Boş liste meşrudur: dar ama güçlü dayanaklı konu da konu.
             */
            urun_gruplari: z
              .array(
                z
                  .object({
                    ad: z.string().min(2).max(120),
                    kanit_no: z.array(z.number().int().min(1).max(200)).min(1).max(4),
                  })
                  .strict(),
              )
              .max(8),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

/**
 * Ek NACE kodları — her ürün grubu için o grubun aday listesinden EN ÇOK bir
 * kod. Ana kodun alternatifleri DEĞİL: her kod bir ürün grubuna bağlı.
 * Uygun kod yoksa grup atlanır; boş liste meşrudur.
 */
export const NaceKapsami = z
  .object({
    kodlar: z
      .array(
        z
          .object({
            urun_grubu: z.string().min(2).max(120),
            kod: z.string().regex(/^\d{2}\.\d{2}(\.\d{2})?$/, "NACE biçimi: 13.10 veya 13.10.03"),
            gerekce: z.string().min(5).max(300),
            guven: z.enum(["dusuk", "orta", "yuksek"]),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

/**
 * Konu uygunluğu — yalnızca başlık verilir; model ilin kanıt defterine bakıp
 * konunun bu ile uygun olup olmadığını söyler. Uygunsa gerekçeyi (olgu) ve
 * sentezi (çıkarım) hazırlar; değilse nedenini yazar.
 */
export const KonuUygunlugu = z
  .object({
    karar: z.enum(["uygun", "kismen", "uygun_degil"]),
    /** "neden bu ilde?" — yalnızca atıf yapılan kanıtlarda yazanla; uygun değilse "" */
    gerekce: z.string().max(1200),
    /** uzman çıkarımı; olgu değil */
    sentez: z.string().max(600),
    /** uygun değilse ya da çekince varsa nedeni; atıf yapılan kanıtlara dayanır */
    neden: z.string().max(800),
    kanit_no: z.array(z.number().int().min(1).max(200)).max(8),
  })
  .strict();

export const SEMALAR = {
  konu_uygunlugu: KonuUygunlugu,
  degerlendirme: Degerlendirme,
  nace_onerisi: NaceOnerisi,
  karsi_gorus: KarsiGorus,
  kanit_cikarimi: KanitCikarimi,
  aday_kesfi: AdayKesfi,
  nace_kapsami: NaceKapsami,
} as const;

export type SemaAdi = keyof typeof SEMALAR;

export function jsonSema(ad: SemaAdi) {
  return z.toJSONSchema(SEMALAR[ad], { io: "output" });
}

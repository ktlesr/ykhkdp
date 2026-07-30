import { islem, type Baglam } from "@ykh/database";
import { paketKur, type Paket } from "@ykh/evidence-validation";

/**
 * Üst ölçekli belge araması ve model paketi.
 *
 * ponytail: pgvector + gömme yerine Postgres tsvector. Belge sayısı onlarla
 * ölçülüyor ve tam metin araması yeterli. Gerekirse `belge` tablosuna
 * `embedding vector(1536)` eklenir ve buradaki tek sorgu değişir.
 */

export type BelgeSatiri = { id: number; ad: string; bolum: string | null; tur: string; yil: string | null; metin: string };

/**
 * Öneriye ilgili belgeleri seçer.
 *
 * Kapsam sırası: ile özgü → ajansa özgü → ulusal. Aramada eşleşme olmasa bile
 * kapsama giren belgeler pakete girer; model boş pakete karşı puanlamaz.
 */
export async function belgePaketi(
  b: Baglam,
  girdi: { ilKod: string; ajansKod: string; sorgu: string; limit?: number },
): Promise<{ paket: Paket; belgeler: BelgeSatiri[] }> {
  const limit = girdi.limit ?? 8;
  const q = herhangiBiri(girdi.sorgu) || girdi.sorgu;

  const satirlar = await islem(b, (sql) =>
    sql<BelgeSatiri[]>`
      select id, ad, bolum, tur::text, yil, metin
      from belge
      where (il_kod = ${girdi.ilKod}
             or (il_kod is null and ajans_kod = ${girdi.ajansKod})
             or (il_kod is null and ajans_kod is null))
        -- Parça bazlı arama: alakasız parçayı pakete koymanın maliyeti var.
        and arama @@ websearch_to_tsquery('simple', ${q})
      order by
        (il_kod = ${girdi.ilKod}) desc,
        (ajans_kod = ${girdi.ajansKod}) desc,
        ts_rank(arama, websearch_to_tsquery('simple', ${q})) desc,
        id
      limit ${limit}
    `,
  );

  // postgres.js int8'i string döndürür; alıntı doğrulaması sayı karşılaştırıyor.
  const belgeler = satirlar.map((s) => ({ ...s, id: Number(s.id) }));

  return {
    belgeler,
    paket: paketKur(
      `belge-${girdi.ilKod}-${belgeler.length}`,
      belgeler.map((s) => ({ id: s.id, ad: s.ad, bolum: s.bolum, metin: s.metin })),
    ),
  };
}

/**
 * Serbest metni "herhangi bir kelime" tsquery'sine çevirir.
 *
 * `plainto_tsquery` terimleri AND'ler; uzun bir öneri başlığında hiçbir kayıt
 * eşleşmez. Bu yüzden kelimeler OR'lanır.
 */
export function herhangiBiri(metin: string, enAzUzunluk = 4): string {
  const kelimeler = [
    ...new Set(
      metin
        .toLocaleLowerCase("tr-TR")
        .split(/[^\p{L}\p{N}]+/u)
        .filter((w) => w.length >= enAzUzunluk),
    ),
  ].slice(0, 12);
  return kelimeler.join(" OR ");
}

/** NACE önerisi için aday kod listesi — arama, AI'nin seçebileceği kümeyi kısar. */
export async function naceAdaylari(
  b: Baglam,
  sorgu: string,
  limit = 25,
): Promise<Array<{ kod: string; tanim: string }>> {
  const q = herhangiBiri(sorgu);
  if (!q) return [];
  return islem(b, (sql) =>
    sql<{ kod: string; tanim: string }[]>`
      select kod, tanim from nace
      where duzey = 'sinif' and arama @@ websearch_to_tsquery('simple', ${q})
      order by ts_rank(arama, websearch_to_tsquery('simple', ${q})) desc, kod
      limit ${limit}
    `,
  );
}

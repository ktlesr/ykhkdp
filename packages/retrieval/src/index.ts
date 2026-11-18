import { islem, type Baglam } from "@ykh/database";
import { paketKur, type Paket } from "@ykh/evidence-validation";

/**
 * Üst ölçekli belge araması ve model paketi.
 *
 * ponytail: pgvector + gömme yerine Postgres tsvector. Belge sayısı onlarla
 * ölçülüyor ve tam metin araması yeterli. Gerekirse `belge` tablosuna
 * `embedding vector(1536)` eklenir ve buradaki tek sorgu değişir.
 */

export type BelgeSatiri = {
  id: number; ad: string; bolum: string | null; tur: string; yil: string | null; metin: string;
  /** öneriyle örtüşme — pakette en iyi eşleşen parça 1, örtüşmeyen 0'a yakın */
  sira: number;
};

/**
 * Konu → belge kategorileri. Konu madenle ilgiliyse maden kaynağı, turizmle
 * ilgiliyse turizm kaynağı devreye girsin diye: eşleşen kategorinin İL
 * belgelerine pakette yer ayrılır.
 *
 * Kök sözcük BAŞINDA aranır; sonu boşlukla biten kök tam sözcüktür ("sera "
 * seramiği, "yem " yemeği yakalamasın).
 * ponytail: kök listesi + NACE bölümü; sözcükseldir ("otel" bulur, "misafirhane"
 * bulmaz). Kaçırılan kategori belgeyi dışlamaz — yalnızca öncelik vermez; o
 * belge yine metin eşleşmesiyle pakete girebilir. Yetmezse modele sınıflatılır.
 */
const KATEGORI_KOKLERI: Record<string, string[]> = {
  maden_enerji: ["maden", "mermer", "traverten", "dogaltas", "dogal tas", "linyit", "komur", "perlit", "feldispat", "kaolen", "manyezit", "krom", "cevher", "kuvars", "pomza", "bentonit", "zeolit", "jeotermal", "rezerv", "enerji", "gunes ener", "ruzgar ener", "biyogaz", "biyokutle"],
  turizm: ["turizm", "otel", "konaklama", "termal", "kaplica", "kayak", "tatil", "pansiyon", "kamp ", "kamping", "karavan", "yayla", "muze", "oren yeri", "gastronomi", "saglik turiz", "kongre"],
  cografi_isaret: ["cografi isaret", "yoresel", "geleneksel", "el sanat", "mahrec", "mense"],
  dis_ticaret: ["ihracat", "ihrac", "ithalat", "ithal", "dis ticaret", "dis pazar"],
  tarim: ["tarim", "hayvan", "sut ", "sutu", "besi ", "besicil", "meyve", "sebze", "sera ", "seraci", "tohum", "yem ", "yem bitki", "bitki", "aricilik", "su urun", "tahil", "bakliyat", "zeytin", "findik", "gida"],
  sanayi: ["sanayi", "imalat", "fabrika", "makine", "osb "],
  tesvik: ["tesvik", "yatirim tesvik"],
};
const katla = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a");

export function konuKategorileri(metin: string, naceKod?: string | null): string[] {
  const m = " " + katla(metin).replace(/[^a-z0-9]+/g, " ") + " ";
  const k = new Set(Object.entries(KATEGORI_KOKLERI).filter(([, kokler]) => kokler.some((kok) => m.includes(" " + kok))).map(([ad]) => ad));
  const bolum = Number(/^\d{2}/.exec(naceKod ?? "")?.[0]);
  if (bolum >= 1 && bolum <= 3) k.add("tarim");
  else if (bolum >= 5 && bolum <= 9 || bolum === 35) k.add("maden_enerji");
  else if (bolum >= 10 && bolum <= 33) k.add("sanayi");
  else if (bolum === 55 || bolum === 79) k.add("turizm");
  return [...k];
}

/**
 * Öneriye ilgili belgeleri seçer.
 *
 * Kapsam sırası: ile özgü → ajansa özgü → ulusal. Aramada eşleşme olmasa bile
 * kapsama giren belgeler pakete girer; model boş pakete karşı puanlamaz.
 */
export async function belgePaketi(
  b: Baglam,
  girdi: {
    ilKod: string; ajansKod: string; sorgu: string; limit?: number;
    /** önerinin NACE kodu (varsa) — kategori yönlendirmesine girer */
    naceKod?: string | null;
    /**
     * Pakete MUTLAKA girecek parçalar (kapsam içindeyse). Keşif adayı
     * değerlendirilirken onu doğuran kanıtların parçaları: puanlayıcı adayın
     * dayandığı metni görmeden puanlamasın.
     */
    zorunlu?: readonly number[];
  },
): Promise<{ paket: Paket; belgeler: BelgeSatiri[] }> {
  /**
   * Paket boyu 12. Sekizde kalırken model paketin dışındaki (ama gerçek) plan
   * metnini ezberinden alıntılıyordu ve alıntı düşüyordu — daha çok gerçek metin
   * vermek bu dürtüyü azaltıyor. Üst sınır prompt boyutu ve maliyet.
   */
  const limit = girdi.limit ?? 12;
  const q = herhangiBiri(girdi.sorgu) || girdi.sorgu;

  const zorunlu = [...new Set(girdi.zorunlu ?? [])].slice(0, limit);
  /**
   * Kategori payı: konunun kategorisindeki İL belgelerinden en iyi eşleşen en
   * çok 3 parça pakete kesin girer (zorunlu gibi). Olmadan, onlarca il raporu
   * arasında tek bir MTA ya da turizm belgesi sıralamada kaybolabiliyor.
   */
  const kategoriler = konuKategorileri(girdi.sorgu, girdi.naceKod);
  const kategoriPayi = kategoriler.length
    ? (
        await islem(b, (sql) =>
          sql<{ id: string }[]>`
            select id from belge
            where il_kod = ${girdi.ilKod} and kategori in ${sql(kategoriler)}
              and arama @@ websearch_to_tsquery('simple', ${q})
            order by ts_rank(arama, websearch_to_tsquery('simple', ${q})) desc, id
            limit 3`,
        )
      ).map((r) => Number(r.id))
    : [];
  zorunlu.push(...kategoriPayi.filter((id) => !zorunlu.includes(id)).slice(0, Math.max(0, limit - zorunlu.length)));

  const satirlar = await islem(b, (sql) =>
    sql<BelgeSatiri[]>`
      select id, ad, bolum, tur::text, yil, metin,
             ts_rank(arama, websearch_to_tsquery('simple', ${q})) as sira
      from belge
      where (il_kod = ${girdi.ilKod}
             or (il_kod is null and ajans_kod = ${girdi.ajansKod})
             or (il_kod is null and ajans_kod is null))
        -- Parça bazlı arama: alakasız parçayı pakete koymanın maliyeti var.
        and (arama @@ websearch_to_tsquery('simple', ${q})
             ${zorunlu.length ? sql`or id in ${sql(zorunlu)}` : sql``})
      -- il → ajans → ulusal. Ulusal parçada il_kod/ajans_kod NULL ve
      -- karşılaştırma NULL verir; DESC sıralamada NULL ÖNCE gelir; nulls last
      -- olmadan sıra tam tersine dönüyordu (ulusal paket dolduruyordu).
      order by
        ${zorunlu.length ? sql`(id in ${sql(zorunlu)}) desc,` : sql``}
        (il_kod = ${girdi.ilKod}) desc nulls last,
        (ajans_kod = ${girdi.ajansKod}) desc nulls last,
        ts_rank(arama, websearch_to_tsquery('simple', ${q})) desc,
        id
      limit ${limit}
    `,
  );

  /**
   * `ts_rank` mutlak değeri anlamsız (0.0x aralığında) ve sorgudan sorguya
   * değişiyor. Paket içinde en iyi eşleşmeye göre normalize ediyoruz: dayanak
   * puanı "eldeki en iyi parçaya göre ne kadar ilgili" sorusunu soruyor.
   * Hiçbir satırın sırası yoksa hepsi 1 sayılır (ağırlıksız eski davranış).
   */
  const enIyi = Math.max(0, ...satirlar.map((s) => Number(s.sira) || 0));
  // postgres.js int8'i string döndürür; alıntı doğrulaması sayı karşılaştırıyor.
  const belgeler = satirlar.map((s) => ({
    ...s,
    id: Number(s.id),
    sira: enIyi > 0 ? (Number(s.sira) || 0) / enIyi : 1,
  }));

  return {
    belgeler,
    paket: paketKur(
      `belge-${girdi.ilKod}-${belgeler.length}`,
      belgeler.map((s) => ({ id: s.id, ad: s.ad, bolum: s.bolum, metin: s.metin, sira: s.sira })),
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

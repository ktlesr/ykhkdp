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
    /** konunun başlığı — ayırt edici kökleri sıralamada öne çıkar; verilmezse sorgunun ilk satırı */
    baslik?: string;
    /** il ve ilçe adları — başlıkta geçse de konu kökü sayılmaz */
    yerAdlari?: readonly string[];
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
  const genel = herhangiBiri(olguMetni(girdi.sorgu)) || girdi.sorgu;
  // Başlık verilmediyse sorgunun ilk satırı konu sayılır (eski çağıranlar).
  const konu = konuSorgusu(girdi.baslik ?? girdi.sorgu.split("\n")[0], girdi.yerAdlari ?? []);
  /**
   * SIRALAMA: konunun ayırt edici kökleri (başlıktan) genel kelimelerin dört
   * katı sayılır. Yalnızca "herhangi bir kelime" sıralamasında "üretim, ürün,
   * Türkiye, ilde" gibi her raporda geçen kelimeler belirleyici oluyordu:
   * ölçüldü, Adıyaman'da BADEM adayının 12 parçalık paketinin 9'u ARICILIK
   * raporundan geldi; model "belgelerde veri yok" dedi ve dayanak 23'te kaldı.
   */
  const skor = (sql: Sql) =>
    konu
      ? sql`(4 * ts_rank(arama, to_tsquery('simple', ${konu})) + ts_rank(arama, websearch_to_tsquery('simple', ${genel})))`
      : sql`ts_rank(arama, websearch_to_tsquery('simple', ${genel}))`;
  const eslesir = (sql: Sql) =>
    konu
      ? sql`(arama @@ to_tsquery('simple', ${konu}) or arama @@ websearch_to_tsquery('simple', ${genel}))`
      : sql`arama @@ websearch_to_tsquery('simple', ${genel})`;

  const konuEslesir = (sql: Sql) => (konu ? sql`(arama @@ to_tsquery('simple', ${konu}))` : sql`false`);

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
            where il_kod = ${girdi.ilKod} and kategori in ${sql(kategoriler)} and ${eslesir(sql)}
            order by ${skor(sql)} desc, id
            limit 3`,
        )
      ).map((r) => Number(r.id))
    : [];
  zorunlu.push(...kategoriPayi.filter((id) => !zorunlu.includes(id)).slice(0, Math.max(0, limit - zorunlu.length)));

  /**
   * KAPSAM: il belgesi önde ama MUTLAK değil. Eski sıra "önce il, sonra ajans,
   * sonra ulusal" idi; kütüphane yüklenince her ilin onlarca raporu paketi tek
   * başına doldurdu: konuyla ilgisiz il raporu (arıcılık), konunun kendi
   * raporunu (ajans kapsamlı "Badem Hedef Pazar Analizi") ve plan belgelerini
   * dışarıda bıraktı. Şimdi bütün kapsamlar TEK sıralamada yarışır; il belgesi
   * ve ajans belgesi küçük bir katsayı alır, belirleyici olan konu ilgisidir.
   * Ayrıca plan belgelerine (ajans ve ulusal) en az birer-ikişer yer ayrılır:
   * "politikayla uyum" kriteri belgeye bağlanabilsin.
   */
  const kapsam = (sql: Sql) =>
    sql`(il_kod = ${girdi.ilKod} or (il_kod is null and ajans_kod = ${girdi.ajansKod}) or (il_kod is null and ajans_kod is null))`;
  const kap = (sql: Sql) => sql`(case when il_kod = ${girdi.ilKod} then 0 when ajans_kod = ${girdi.ajansKod} then 1 else 2 end)`;
  const agirlikli = (sql: Sql) =>
    sql`(${skor(sql)} * case when il_kod = ${girdi.ilKod} then ${IL_KATSAYISI}::float8 when ajans_kod = ${girdi.ajansKod} then ${AJANS_KATSAYISI}::float8 else 1.0 end)`;
  const sec = (kosul: (sql: Sql) => unknown, adet: number, haric: readonly number[]) =>
    adet <= 0
      ? Promise.resolve([] as Satir[])
      : islem(b, (sql) =>
          sql<Satir[]>`
            select id, ad, bolum, tur::text, yil, metin, ${skor(sql)} as sira, ${konuEslesir(sql)} as konu, ${kap(sql)} as kap
            from belge
            where ${kosul(sql) as never} and ${eslesir(sql)}
              ${haric.length ? sql`and id not in ${sql(haric)}` : sql``}
            order by ${agirlikli(sql)} desc, id
            limit ${adet}`,
        );
  const zorunluSatir = zorunlu.length
    ? await islem(b, (sql) =>
        sql<Satir[]>`
          select id, ad, bolum, tur::text, yil, metin, ${skor(sql)} as sira, true as konu, ${kap(sql)} as kap
          from belge
          where id in ${sql(zorunlu)} and ${kapsam(sql)}`,
      )
    : [];
  const bos = Math.max(0, limit - zorunluSatir.length);
  // Plan payı: yer varsa ajans ve ulusal kapsamdan en iyi eşleşen parçalar.
  const pay = Math.floor(bos / 6);
  const [ajansSatir, ulusalSatir] = await Promise.all([
    sec((sql) => sql`(il_kod is null and ajans_kod = ${girdi.ajansKod})`, Math.min(AJANS_PAYI, pay), zorunlu),
    sec((sql) => sql`(il_kod is null and ajans_kod is null)`, Math.min(ULUSAL_PAYI, pay), zorunlu),
  ]);
  const ayrilan = [...zorunluSatir, ...ajansSatir, ...ulusalSatir];
  // Modele sunuş sırası: önce adayı doğuran (zorunlu) parçalar, sonra il → ajans → ulusal;
  // kapsam içinde en ilgili parça önde. SEÇİM yukarıda yapıldı, bu yalnızca sıradır.
  const kalan = [...ajansSatir, ...ulusalSatir, ...(await sec(kapsam, limit - ayrilan.length, ayrilan.map((x) => Number(x.id))))]
    .sort((x, y) => x.kap - y.kap || (Number(y.sira) || 0) - (Number(x.sira) || 0) || Number(x.id) - Number(y.id));
  const satirlar = [...zorunluSatir, ...kalan];

  /**
   * `ts_rank` mutlak değeri anlamsız (0.0x aralığında) ve sorgudan sorguya
   * değişiyor. Paket içinde en iyi eşleşmeye göre normalize ediyoruz: dayanak
   * puanı "eldeki en iyi parçaya göre ne kadar ilgili" sorusunu soruyor.
   * Hiçbir satırın sırası yoksa hepsi 1 sayılır (ağırlıksız eski davranış).
   */
  const enIyi = Math.max(0, ...satirlar.map((s) => Number(s.sira) || 0));
  // postgres.js int8'i string döndürür; alıntı doğrulaması sayı karşılaştırıyor.
  /**
   * Konunun ayırt edici köküyle eşleşen (ya da zorunlu) parça en az
   * `KONU_TABANI` örtüşme alır. Olmadan, çok güçlü tek bir parça diğerlerini
   * eziyordu: ölçüldü, "Adıyaman'da badem üretimi 18.235 ton" cümlesinin
   * parçası 0,12 örtüşme aldı ve o alıntıya dayanan kriter neredeyse hiç
   * dayanak üretmedi. Konuyla yalnızca genel kelimelerle örtüşen parça için
   * eski kural aynen geçerli: zayıf örtüşen parçadan gelen destek zayıftır.
   */
  const belgeler = satirlar.map(({ konu: konuda, kap: _kap, ...s }) => {
    const oran = enIyi > 0 ? (Number(s.sira) || 0) / enIyi : 1;
    return { ...s, id: Number(s.id), sira: konuda ? Math.max(KONU_TABANI, oran) : oran };
  });

  return {
    belgeler,
    paket: paketKur(
      `belge-${girdi.ilKod}-${belgeler.length}`,
      belgeler.map((s) => ({ id: s.id, ad: s.ad, bolum: s.bolum, metin: s.metin, sira: s.sira })),
    ),
  };
}

type Sql = Parameters<Parameters<typeof islem>[1]>[0];
/** Bölge planına ve ulusal plana ayrılan en çok parça (12'lik pakette). */
const AJANS_PAYI = 2;
const ULUSAL_PAYI = 2;
/** Tek sıralamada kapsam katsayısı: il belgesi önde, ama konu ilgisi belirleyici. */
const IL_KATSAYISI = 1.5;
const AJANS_KATSAYISI = 1.2;
/** Konu köküyle eşleşen parçanın en düşük örtüşmesi (dayanak hesabı). */
const KONU_TABANI = 0.7;
type Satir = BelgeSatiri & { konu: boolean; kap: number };

/** Konu kökü olmayan başlık kelimeleri: her konuda geçer, ayırt etmez. */
const KONU_DISI = new Set([
  "üretim", "üretimi", "üretimleri", "imalat", "imalatı", "tesis", "tesisi", "tesisleri", "yatırım", "yatırımı", "yatırımları",
  "fabrika", "fabrikası", "işletme", "işletmesi", "kurulumu", "kurulması", "ürün", "ürünü", "ürünleri", "ürünlerinin", "mamul",
  "mamulleri", "türev", "türevleri", "sektör", "sektörü", "sektöründe", "sanayi", "sanayii", "sanayisi", "işleme", "işlenmesi",
  "geliştirilmesi", "değerlendirilmesi", "merkezi", "entegre", "modern", "yeni", "yönelik", "dayalı", "amaçlı", "için", "ilinde",
  "ilçesi", "ilçesinde", "bölgesi", "bölgesinde", "katma", "değerli", "yüksek", "ileri", "teknoloji", "asgari", "kapasite", "kapasiteli",
]);

/**
 * Başlığın ayırt edici kökleri → önek eşleşmeli tsquery ("badem:* | antep:*").
 * Türkçe ekler önekle karşılanır: "badem" kökü "bademin", "bademli"yi de bulur
 * ('simple' sözlükte kök alma yok). Boş dönerse yalnızca genel sorgu kullanılır.
 */
export function konuSorgusu(baslik: string, yerAdlari: readonly string[] = []): string {
  const yer = new Set(yerAdlari.map((y) => y.toLocaleLowerCase("tr-TR").slice(0, 5)));
  const kokler = [
    ...new Set(
      baslik
        .toLocaleLowerCase("tr-TR")
        .replace(/['’`][\p{L}]*/gu, "")
        .split(/[^\p{L}]+/u)
        .filter((w) => w.length >= 4 && !KONU_DISI.has(w))
        .map((w) => w.slice(0, 5))
        .filter((k) => !yer.has(k)),
    ),
  ].slice(0, 8);
  return kokler.map((k) => `${k}:*`).join(" | ");
}

/** Keşif adayının gerekçesindeki etiketli ekler (çıkarım, unsur) aramaya girmez: kalıp kelimelerdir. */
const olguMetni = (sorgu: string) => sorgu.split(/Yapay zekâ çıkarımı \(belgede yazmaz\):|Temel unsur \(yapay zekâ sınıflaması\):/)[0];

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

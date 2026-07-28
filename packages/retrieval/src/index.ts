import { islem, type Baglam } from "@ykh/database";
import type { ErisimSinifi } from "@ykh/domain";
import { kaynakPaketiKur, type KaynakPaketi } from "@ykh/evidence-validation";

/**
 * Hibrit arama ve kaynak paketi kurma.
 *
 * ponytail: pgvector + gömme yerine Postgres tsvector + künye filtresi.
 * Kaynak paketi 20 kayıtla sınırlı bir kurum belgesi kümesinden seçiliyor;
 * anlamsal arama ölçülebilir bir kazanç göstermeden gömme altyapısı taşımak
 * boşuna. Gerekirse `kanit` tablosuna `embedding vector(1536)` eklenir ve
 * bu dosyadaki tek sorgu değişir.
 */

export type AramaSonucu = {
  kanitId: number;
  kod: string;
  kaynakKurum: string;
  belge: string;
  sayfaTablo: string | null;
  alinti: string | null;
  dogrulamaDurumu: string;
  skor: number;
};

export async function kanitAra(
  b: Baglam,
  donemId: number,
  sorgu: string,
  limit = 10,
): Promise<AramaSonucu[]> {
  if (!sorgu.trim()) return [];
  return islem(b, (sql) =>
    sql<AramaSonucu[]>`
      select
        k.id as "kanitId", k.kod, k.kaynak_kurum as "kaynakKurum", k.belge,
        k.sayfa_tablo as "sayfaTablo", k.alinti,
        k.dogrulama_durumu as "dogrulamaDurumu",
        ts_rank(
          to_tsvector('simple', coalesce(k.belge,'') || ' ' || coalesce(k.kaynak_kurum,'') || ' ' || coalesce(k.alinti,'')),
          plainto_tsquery('simple', ${sorgu})
        ) as skor
      from kanit_kunye k
      where k.donem_id = ${donemId}
        and to_tsvector('simple', coalesce(k.belge,'') || ' ' || coalesce(k.kaynak_kurum,'') || ' ' || coalesce(k.alinti,''))
            @@ plainto_tsquery('simple', ${sorgu})
      order by skor desc, k.id
      limit ${limit}
    `,
  );
}

/**
 * Modele verilecek kaynak paketini kurar.
 *
 * Kapalı kaynak modu (brief §3): model YALNIZCA bu paketi görür. Kullanıcının
 * yetkisi olmayan kayıt pakete hiç girmez — filtreleme `kaynakPaketiKur`
 * içinde ikinci kez de yapılır (katmanlı savunma).
 */
export async function kaynakPaketi(
  b: Baglam,
  donemId: number,
  sorgu: string,
  limit = 8,
  /** verilirse bu dosyanın kendi kanıtları her hâlükârda pakete girer */
  oneriId?: number,
): Promise<{ paket: KaynakPaketi; satirlar: Array<{ evidenceId: string; kaynakKurum: string; belge: string; sayfaTablo: string | null; metin: string }> }> {
  const kayitlar = await islem(b, (sql) =>
    sql<
      { kod: string; kaynak_kurum: string; belge: string; sayfa_tablo: string | null;
        belge_metni: string | null; alinti: string | null; access_class: ErisimSinifi;
        span_baslangic: number | null; span_bitis: number | null }[]
    >`
      select k.kod, k.kaynak_kurum, k.belge, k.sayfa_tablo, k.belge_metni, k.alinti,
             k.access_class, k.span_baslangic, k.span_bitis
      from kanit_kunye k
      where k.donem_id = ${donemId}
        and (
          -- dosyanın kendi kanıtı: aramaya bakmaksızın pakete girer
          (${oneriId ?? null}::bigint is not null and k.oneri_id = ${oneriId ?? null}::bigint)
          or ${sorgu} = ''
          or to_tsvector('simple', coalesce(k.belge,'') || ' ' || coalesce(k.alinti,''))
             @@ plainto_tsquery('simple', ${sorgu})
        )
      order by (k.oneri_id is distinct from ${oneriId ?? null}::bigint), k.id
      limit ${limit}
    `,
  );

  const satirlar = kayitlar.map((k) => ({
    evidenceId: k.kod,
    kaynakKurum: k.kaynak_kurum,
    belge: k.belge,
    sayfaTablo: k.sayfa_tablo,
    metin: k.belge_metni ?? k.alinti ?? "",
  }));

  const paket = kaynakPaketiKur(
    `paket-${donemId}-${satirlar.length}`,
    kayitlar.map((k) => ({
      evidenceId: k.kod,
      accessClass: k.access_class,
      belgeMetni: k.belge_metni ?? k.alinti ?? "",
      spanBaslangic: k.span_baslangic,
      spanBitis: k.span_bitis,
    })),
    b.rol === "anonim" ? "birey" : b.rol,
  );

  return { paket, satirlar: satirlar.filter((s) => paket.kayitlar.some((k) => k.evidenceId === s.evidenceId)) };
}

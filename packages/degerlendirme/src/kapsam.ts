import { naceKapsami, PROMPTLAR, urunListesi } from "@ykh/ai-gateway";
import { denetle, islem, type Baglam } from "@ykh/database";
import { dengeliSec, yerelMi, type NetUrun } from "@ykh/evidence-validation";
import { aiMaliyeti } from "@ykh/observability";
import { konuKategorileri, naceAdaylari } from "@ykh/retrieval";
import { SENTEZ_ETIKETI, taramaKaynagi, UNSUR_ETIKETI } from "./kesif.ts";
import { modelSec } from "./model-secimi.ts";
import { baslikSorgusu } from "./uygunluk.ts";

/**
 * Ürün listesini netleştirme — bir konunun kapsadığı SOMUT ürünler (tebliğdeki
 * parantez içi: "sucuk, salam, pastırma vb.").
 *
 * Tarama, aday üretimi ve puanlama YENİDEN KOŞMAZ: ilin zaten taranmış
 * kanıtları okunur, tek bir model çağrısı yapılır. Bu işlev yalnızca üretir;
 * kayda yazmak çağıranın işidir.
 */

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };
/** Ürün adı taşıyan veri belgeleri — konu hangi kategoride olursa olsun deftere girer. */
const URUN_KATEGORILERI = ["cografi_isaret", "tarim", "dis_ticaret"];
const SINIR = { kendi: 12, veri: 36, eslesen: 24 };

/** Ek NACE ürün adlarına göre yenilenir (değerlendirme hattındaki adımın aynısı); ajansın kodlarına dokunulmaz. En iyi çaba; sonucu ekrana yazılacak kısa metin olarak döner. */
export async function ekNaceYenile(k: { id: number; baslik: string; naceKod: string | null }, adlar: string[], not: string): Promise<string> {
  try {
    const gruplar = await Promise.all(adlar.map(async (ad) => {
      const [dar, genis] = await Promise.all([naceAdaylari(SERVIS, ad, 8), naceAdaylari(SERVIS, `${k.baslik} ${ad}`, 8)]);
      return { ad, adaylar: [...new Map([...dar, ...genis].map((x) => [x.kod, x])).values()].slice(0, 14) };
    }));
    const { istemci, model } = await modelSec("yargi");
    const e = await naceKapsami(istemci, model, { baslik: k.baslik, anaKod: k.naceKod, gruplar });
    if (!e.ok) return " · ek NACE yenilenemedi (eskisi kaldı)";
    await islem(SERVIS, async (sql) => {
      await sql`delete from oneri_nace where oneri_id = ${k.id} and kaynak = 'ai'`;
      let sira = 1;
      for (const x of e.kodlar) {
        await sql`insert into oneri_nace (oneri_id, nace_kod, urun_grubu, gerekce, guven, kaynak, sira)
                  values (${k.id}, ${x.kod}, ${x.urunGrubu}, ${x.gerekce}, ${x.guven}, 'ai', ${sira++}) on conflict (oneri_id, nace_kod) do nothing`;
      }
      await denetle(sql, SERVIS, "ek_nace_ai_atandi", "oneri", k.id, { kodlar: e.kodlar, model: e.modelSnapshot, promptSurum: e.promptSurum, not });
    });
    return ` · ${e.kodlar.length} ek NACE`;
  } catch (h) {
    return ` · ek NACE yenilenemedi: ${h instanceof Error ? h.message.slice(0, 80) : h}`;
  }
}

export type UrunSonucu =
  | { ok: true; urunler: NetUrun[]; dusenler: string[]; defterBoyu: number; model: string; promptSurum: string }
  | { ok: false; neden: string };

export async function urunleriNetlestir(girdi: { ilKod: string; baslik: string; gerekce: string; kanitIdleri?: readonly number[] }): Promise<UrunSonucu> {
  const [il] = await islem(SERVIS, (sql) => sql<{ ad: string; ajans_kod: string }[]>`select ad, ajans_kod from il where kod = ${girdi.ilKod}`);
  if (!il) return { ok: false, neden: "İl bulunamadı." };
  const ilceler = (await islem(SERVIS, (sql) => sql<{ ad: string }[]>`select ad from ilce where il_kod = ${girdi.ilKod}`)).map((x) => x.ad).filter((a) => a !== "Merkez");
  const hedef = { ilKod: girdi.ilKod, adlar: [il.ad, ...ilceler] };
  const surum = PROMPTLAR.kanit_cikarimi.surum;
  const q = baslikSorgusu(girdi.baslik, hedef.adlar);
  const kategoriler = [...new Set([...konuKategorileri(`${girdi.baslik} ${girdi.gerekce}`), ...URUN_KATEGORILERI])].filter((k) => k !== "genel");
  const kendi = (girdi.kanitIdleri ?? []).map(String);

  type Satir = { id: string; tur: string; konu: string; alinti: string; ad: string; bolum: string | null; metin: string; il_kod: string | null; kaynak_turu: string };
  const satirlar = await islem(SERVIS, (sql) => sql<Satir[]>`
    with aday as (
      select k.id, k.tur, k.konu, k.alinti, p.ad, p.bolum, p.metin, p.il_kod, p.kategori,
             ${q ? sql`to_tsvector('simple', k.konu || ' ' || k.alinti) @@ to_tsquery('simple', ${q})` : sql`false`} as eslesti,
             ${q ? sql`ts_rank(to_tsvector('simple', k.konu || ' ' || k.alinti), to_tsquery('simple', ${q}))` : sql`0`} as sira
      from kanit k join belge p on p.id = k.belge_id
      where k.prompt_surum = ${surum} and ${taramaKaynagi(sql, sql`k`, surum)}
        and (p.il_kod = ${girdi.ilKod} or (p.il_kod is null and p.ajans_kod = ${il.ajans_kod}) or (p.il_kod is null and p.ajans_kod is null))
    )
    select id, tur, konu, alinti, ad, bolum, metin, il_kod,
           case when id = any(${kendi}::bigint[]) then 'kendi'
                when il_kod = ${girdi.ilKod} and kategori = any(${kategoriler}) then 'veri' else 'eslesen' end as kaynak_turu
    from aday
    where id = any(${kendi}::bigint[]) or (il_kod = ${girdi.ilKod} and kategori = any(${kategoriler})) or eslesti
    order by sira desc, id
    limit 1200
  `);
  if (!satirlar.length) return { ok: false, neden: `${il.ad} için taranmış, konuyla ilgili kanıt yok.` };

  const hepsi = satirlar.map((x) => ({
    kanitId: Number(x.id), tur: x.tur, konu: x.konu, metin: x.alinti, belge: x.ad, kaynakTuru: x.kaynak_turu,
    kaynak: `${x.ad}${x.bolum ? ` · ${x.bolum}` : ""}`,
    yerel: yerelMi({ metin: x.metin, ilKod: x.il_kod }, x.alinti, hedef),
  }));
  const sec = (tur: string, n: number) => dengeliSec(hepsi.filter((d) => d.kaynakTuru === tur), (d) => d.belge, n);
  const defter = [...sec("kendi", SINIR.kendi), ...sec("veri", SINIR.veri), ...hepsi.filter((d) => d.kaynakTuru === "eslesen").slice(0, SINIR.eslesen)].map((d, i) => ({ ...d, no: i + 1 }));

  // Bakanlığın benzer konularda yazdığı ürün listeleri: modelin örnek aldığı gerçek kayıtlar.
  const ornekler = q
    ? (await islem(SERVIS, (sql) => sql<{ baslik: string }[]>`
        select baslik from (
          select distinct on (lower(baslik)) baslik, ts_rank(to_tsvector('simple', baslik), to_tsquery('simple', ${q})) as sira
          from yatirim_konusu
          where baslik like '%(%vb.%)%' and to_tsvector('simple', baslik) @@ to_tsquery('simple', ${q})
          order by lower(baslik), sira desc
        ) x order by sira desc limit 4
      `)).map((x) => x.baslik)
    : [];

  // Ürün kataloğu: konuyla örtüşen altı haneli NACE faaliyet tanımları ("peynir,
  // lor ve çökelek imalatı"). Model ürünü ezberden yazmak yerine buradan seçer.
  const katalog = q
    ? (await islem(SERVIS, (sql) => sql<{ tanim: string }[]>`
        select tanim from nace
        where duzey = 'faaliyet' and arama @@ to_tsquery('simple', ${q})
        order by ts_rank(arama, to_tsquery('simple', ${q})) desc, kod limit 14
      `)).map((x) => x.tanim)
    : [];

  const { istemci, model } = await modelSec("yargi");
  // Ürün nedeni yalnızca gerekçenin DOĞRULANMIŞ kısmına dayanabilir: sentez modelin çıkarımıdır.
  const olgu = girdi.gerekce.split(SENTEZ_ETIKETI)[0].split(UNSUR_ETIKETI)[0];
  const r = await urunListesi(istemci, model, { il: il.ad, baslik: girdi.baslik, gerekce: girdi.gerekce, olgu, defter, ornekler, katalog });
  aiMaliyeti({ model: r.maliyet?.model ?? model, girdiToken: r.maliyet?.girdiToken ?? 0, ciktiToken: r.maliyet?.ciktiToken ?? 0, promptSurum: r.promptSurum, sonuc: r.ok ? "ok" : "red" });
  if (!r.ok) return { ok: false, neden: `Model çıktısı alınamadı (${r.asama}): ${(r.hatalar[0] ?? "").slice(0, 200)}` };
  return { ok: true, urunler: r.urunler, dusenler: r.dusenler, defterBoyu: defter.length, model: r.modelSnapshot, promptSurum: r.promptSurum };
}

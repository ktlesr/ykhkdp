import type { Aday, DonemDurumu, EpistemikDurum, Koken, OneriDurumu, Rol } from "@ykh/domain";
import type { AgirlikSeti, Kriter } from "@ykh/scoring";
import type postgres from "postgres";
import { denetle, islem, type Baglam } from "./baglanti.ts";
import { jetonOzeti, oturumJetonu, parolaDogrula, parolaOzetle } from "./parola.ts";

/**
 * Veri erişimi. Her fonksiyon `islem()` içinde çalışır, yani RLS bağlamı
 * bağlıdır. Bağlamsız (anonim) çağrı yalnızca kamuya açık satırları görür.
 */

// ── oturum ─────────────────────────────────────────────────────────────────

export type Kullanici = { ref: string; rol: Rol; eposta: string | null; adSoyad: string | null };

export async function kayitOl(
  eposta: string,
  parola: string,
  adSoyad: string,
): Promise<{ ok: true; jeton: string } | { ok: false; hata: string }> {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return { ok: false, hata: "Geçerli bir e-posta yazın." };
  if (parola.length < 10) return { ok: false, hata: "Parola en az 10 karakter olmalı." };
  if (adSoyad.trim().length < 3) return { ok: false, hata: "Ad soyad en az 3 karakter olmalı." };

  return islem({ gonderenRef: null, rol: "anonim" }, async (sql) => {
    const [{ eposta_kayitli: kayitli }] = await sql<{ eposta_kayitli: boolean }[]>`
      select eposta_kayitli(${eposta})
    `;
    if (kayitli) return { ok: false as const, hata: "Bu e-posta zaten kayıtlı." };

    // ponytail: e-posta doğrulaması SMTP olmadan çalışmaz; geliştirmede
    // hesap doğrulanmış açılır, üretimde `eposta_dogrulandi` false başlar.
    const [{ hesap_ac: ref }] = await sql<{ hesap_ac: string }[]>`
      select hesap_ac(${eposta}, ${adSoyad.trim()}, ${await parolaOzetle(parola)},
                      ${process.env.NODE_ENV !== "production"})
    `;
    const jeton = await oturumYarat(sql, ref);
    await denetle(sql, { gonderenRef: ref, rol: "birey" }, "kayit_olundu", "gonderen", ref);
    return { ok: true as const, jeton };
  });
}

export async function girisYap(
  eposta: string,
  parola: string,
): Promise<{ ok: true; jeton: string } | { ok: false; hata: string }> {
  return islem({ gonderenRef: null, rol: "anonim" }, async (sql) => {
    const [k] = await sql<{ gonderen_ref: string; parola_hash: string | null }[]>`
      select * from giris_kimlik(${eposta})
    `;
    // Aynı mesaj: hesabın var olup olmadığı sızmaz.
    const gecerli = await parolaDogrula(parola, k?.parola_hash ?? null);
    if (!k || !gecerli) return { ok: false as const, hata: "E-posta veya parola hatalı." };
    const jeton = await oturumYarat(sql, k.gonderen_ref);
    return { ok: true as const, jeton };
  });
}

async function oturumYarat(sql: postgres.Sql, ref: string): Promise<string> {
  const jeton = oturumJetonu();
  await sql`
    insert into oturum (token_hash, gonderen_ref, gecerlilik)
    values (${await jetonOzeti(jeton)}, ${ref}, now() + interval '30 days')
  `;
  return jeton;
}

export async function oturumCoz(jeton: string | undefined): Promise<Kullanici | null> {
  if (!jeton) return null;
  return islem({ gonderenRef: null, rol: "anonim" }, async (sql) => {
    const [s] = await sql<{ ref: string; rol: Rol; eposta: string | null; ad_soyad: string | null }[]>`
      select * from oturum_coz(${await jetonOzeti(jeton)})
    `;
    return s ? { ref: s.ref, rol: s.rol, eposta: s.eposta, adSoyad: s.ad_soyad } : null;
  });
}

export async function cikisYap(jeton: string | undefined): Promise<void> {
  if (!jeton) return;
  await islem({ gonderenRef: null, rol: "anonim" }, async (sql) => {
    await sql`delete from oturum where token_hash = ${await jetonOzeti(jeton)}`;
  });
}

export function baglamdan(k: Kullanici | null): Baglam {
  return k ? { gonderenRef: k.ref, rol: k.rol } : { gonderenRef: null, rol: "anonim" };
}

// ── il / dönem ─────────────────────────────────────────────────────────────

export type DonemKaydi = {
  donemId: number;
  ilKod: string;
  il: string;
  ajansKod: string;
  ajans: string;
  yil: string;
  durum: DonemDurumu;
  set: AgirlikSeti;
};

export async function donemGetir(b: Baglam, ilKod: string, yil: string): Promise<DonemKaydi | null> {
  return islem(b, async (sql) => {
    const [d] = await sql<
      {
        donem_id: number; il_kod: string; il: string; ajans_kod: string; ajans: string;
        yil: string; durum: DonemDurumu; surum: string; agirliklar: Record<Kriter, number>;
        devamlilik_payi: number; kanit_esigi: number; devir_siniri: number; slot_sayisi: number;
      }[]
    >`
      select d.id as donem_id, i.kod as il_kod, i.ad as il, a.kod as ajans_kod, a.ad as ajans,
             d.yil, d.durum, s.surum, s.agirliklar, s.devamlilik_payi, s.kanit_esigi,
             s.devir_siniri, s.slot_sayisi
      from donem d
      join il i on i.kod = d.il_kod
      join ajans a on a.kod = i.ajans_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      where i.kod = ${ilKod} and d.yil = ${yil}
    `;
    if (!d) return null;
    return {
      donemId: d.donem_id,
      ilKod: d.il_kod,
      il: d.il,
      ajansKod: d.ajans_kod,
      ajans: d.ajans,
      yil: d.yil,
      durum: d.durum,
      set: {
        surum: d.surum,
        ajans: d.ajans_kod,
        donem: d.yil,
        agirliklar: d.agirliklar,
        devamlilikPayi: d.devamlilik_payi,
        kanitEsigi: d.kanit_esigi,
        devirSiniri: d.devir_siniri,
        slotSayisi: d.slot_sayisi,
      },
    };
  });
}

export async function donemleriListele(b: Baglam) {
  return islem(b, (sql) =>
    sql<{ il_kod: string; il: string; ajans: string; yil: string; durum: DonemDurumu }[]>`
      select i.kod as il_kod, i.ad as il, a.ad as ajans, d.yil, d.durum
      from donem d join il i on i.kod = d.il_kod join ajans a on a.kod = i.ajans_kod
      order by a.ad, i.ad, d.yil desc
    `,
  );
}

// ── adaylar (sıralama girdisi) ─────────────────────────────────────────────

/**
 * Sıralama girdisi. `taban` doğrulanmış kriter puanlarından, `kanit` yalnızca
 * uzman onaylı kanıttan hesaplanır. Destek sayısı bu sorguda YOKTUR.
 */
export async function adaylariGetir(b: Baglam, d: DonemKaydi): Promise<Aday[]> {
  const satirlar = await islem(b, (sql) =>
    sql<{ id: number; ad: string; koken: Koken; nace: string | null; kanit: number; ep: EpistemikDurum; taban: number }[]>`
      select
        a.id, a.ad, a.koken, a.nace,
        kanit_yeterliligi(a.id) as kanit,
        aday_epistemik(a.id, ${d.set.kanitEsigi}) as ep,
        aday_taban_puani(a.id, ${sql.json(d.set.agirliklar as never)}) as taban
      from aday a
      where a.donem_id = ${d.donemId}
      order by a.id
    `,
  );

  return satirlar.map((s) => ({
    id: String(s.id),
    ad: s.ad,
    koken: s.koken,
    nace: s.nace ?? "",
    kanit: s.kanit,
    ep: s.ep,
    taban: s.taban,
  }));
}

/** Tek adayın stratejik puanı — kırılım görünmese de toplam aynıdır. */
export async function adayTabanPuani(b: Baglam, adayId: number, set: AgirlikSeti): Promise<number> {
  const [r] = await islem(b, (sql) =>
    sql<{ taban: number }[]>`select aday_taban_puani(${adayId}, ${sql.json(set.agirliklar as never)}) as taban`,
  );
  return r.taban;
}

// ── aday detayı (Blok 2) ───────────────────────────────────────────────────

export type KanitKaydi = {
  id: number; kod: string; kaynakKurum: string; belge: string; belgeSurum: string | null;
  sayfaTablo: string | null; yayimTarihi: string | null; cografiKapsam: string | null;
  veriDonemi: string | null; url: string | null; alinti: string | null; sinirlilik: string | null;
  katkiPuani: number; dogrulamaDurumu: string; dogrulayan: string | null; dogrulamaZamani: string | null;
};

export async function adayDetay(b: Baglam, adayId: number) {
  return islem(b, async (sql) => {
    const [aday] = await sql<
      { id: number; ad: string; koken: Koken; nace: string | null; oneri_id: number | null;
        donem_id: number; il_kod: string; yil: string }[]
    >`
      select a.id, a.ad, a.koken, a.nace, a.oneri_id, a.donem_id, d.il_kod, d.yil
      from aday a join donem d on d.id = a.donem_id
      where a.id = ${adayId}
    `;
    if (!aday) return null;

    const kriterler = await sql<{ kriter: Kriter; puan: number; dogrulandi: boolean; gerekce: string | null }[]>`
      select kriter, puan, dogrulandi, gerekce from kriter_puani where aday_id = ${adayId} order by kriter
    `;
    const iddialar = await sql<{ id: number; metin: string }[]>`
      select id, metin from iddia where aday_id = ${adayId} order by id
    `;
    const kanitlar = await sql<
      (KanitKaydi & { iddia_id: number | null })[]
    >`
      select k.id, k.kod, k.kaynak_kurum as "kaynakKurum", k.belge, k.belge_surum as "belgeSurum",
             k.sayfa_tablo as "sayfaTablo", k.yayim_tarihi::text as "yayimTarihi",
             k.cografi_kapsam as "cografiKapsam", k.veri_donemi as "veriDonemi", k.url,
             k.alinti, k.sinirlilik, k.katki_puani as "katkiPuani",
             k.dogrulama_durumu as "dogrulamaDurumu",
             ki.ad_soyad as "dogrulayan", k.dogrulama_zamani::text as "dogrulamaZamani",
             ik.iddia_id
      from kanit_kunye k
      left join kimlik ki on ki.gonderen_ref = k.dogrulayan_ref
      left join iddia_kanit ik on ik.kanit_id = k.id
      where k.aday_id = ${adayId}
      order by k.id
    `;
    const [{ destek }] = await sql<{ destek: number }[]>`
      select coalesce(destek_sayisi(${aday.oneri_id}), 0) as destek
    `;
    return { aday, kriterler, iddialar, kanitlar, destek: Number(destek) };
  });
}

export async function kanitDetay(b: Baglam, kanitId: number) {
  return islem(b, async (sql) => {
    const [k] = await sql<
      (KanitKaydi & { adayId: number | null; adayAdi: string | null })[]
    >`
      select k.id, k.kod, k.kaynak_kurum as "kaynakKurum", k.belge, k.belge_surum as "belgeSurum",
             k.sayfa_tablo as "sayfaTablo", k.yayim_tarihi::text as "yayimTarihi",
             k.cografi_kapsam as "cografiKapsam", k.veri_donemi as "veriDonemi", k.url,
             k.alinti, k.sinirlilik, k.katki_puani as "katkiPuani",
             k.dogrulama_durumu as "dogrulamaDurumu",
             ki.ad_soyad as "dogrulayan", k.dogrulama_zamani::text as "dogrulamaZamani",
             k.aday_id as "adayId", a.ad as "adayAdi"
      from kanit_kunye k
      left join aday a on a.id = k.aday_id
      left join kimlik ki on ki.gonderen_ref = k.dogrulayan_ref
      where k.id = ${kanitId}
    `;
    if (!k) return null;
    const [iddia] = await sql<{ metin: string }[]>`
      select i.metin from iddia i join iddia_kanit ik on ik.iddia_id = i.id where ik.kanit_id = ${kanitId} limit 1
    `;
    return { ...k, iddia: iddia?.metin ?? null };
  });
}

// ── yan panel sayıları ─────────────────────────────────────────────────────

export async function panelVerisi(b: Baglam, d: DonemKaydi) {
  return islem(b, async (sql) => {
    const [akis] = await sql<
      { gelen: number; aday: number; incelemede: number; kanit_bekliyor: number }[]
    >`
      select
        (select count(*) from oneri where donem_id = ${d.donemId} and durum <> 'taslak') as gelen,
        (select count(*) from oneri where donem_id = ${d.donemId} and durum = 'konu_adayi') as aday,
        (select count(*) from oneri where donem_id = ${d.donemId} and durum in ('triyaj','uzman_incelemesinde')) as incelemede,
        (select count(*) from oneri where donem_id = ${d.donemId} and durum = 'kanit_bekliyor') as kanit_bekliyor
    `;
    const [saglik] = await sql<{ onayli: number; ai: number; kanitsiz: number }[]>`
      with k as (select dogrulama_durumu, katki_puani from kanit where donem_id = ${d.donemId})
      select
        coalesce(round(100.0 * sum(katki_puani) filter (where dogrulama_durumu = 'uzman_onayli')
                 / nullif(sum(katki_puani), 0)), 0)::int as onayli,
        coalesce(round(100.0 * sum(katki_puani) filter (where dogrulama_durumu in ('beyan','ai_bulgusu','celiskili'))
                 / nullif(sum(katki_puani), 0)), 0)::int as ai,
        coalesce(round(100.0 * sum(katki_puani) filter (where dogrulama_durumu = 'reddedildi')
                 / nullif(sum(katki_puani), 0)), 0)::int as kanitsiz
      from k
    `;
    // Veri boşluğu: kriter puanı doğrulanmamış olan adaylar.
    const bosluklar = await sql<{ baslik: string; alt: string }[]>`
      select a.ad as baslik,
             'Kanıt yeterliliği ' || kanit_yeterliligi(a.id) || '/100 — eşik ' || ${d.set.kanitEsigi} as alt
      from aday a
      where a.donem_id = ${d.donemId} and kanit_yeterliligi(a.id) < ${d.set.kanitEsigi}
      order by kanit_yeterliligi(a.id)
      limit 3
    `;
    return {
      akis: [
        { etiket: "Gelen öneri (dönem)", deger: Number(akis.gelen) },
        { etiket: "Konu seviyesinde geçerli", deger: Number(akis.aday) },
        { etiket: "Uzman incelemesinde", deger: Number(akis.incelemede) },
        { etiket: "Kanıt bekliyor", deger: Number(akis.kanit_bekliyor) },
      ],
      saglik: [
        { etiket: "Uzman onaylı kanıt oranı", oran: saglik.onayli, ep: "onay" as const },
        { etiket: "AI bulgusu, doğrulanmamış", oran: saglik.ai, ep: "ai" as const },
        { etiket: "Reddedilen / kanıtsız", oran: saglik.kanitsiz, ep: "yok" as const },
      ],
      bosluklar,
    };
  });
}

// ── öneri akışı (Blok 3) ───────────────────────────────────────────────────

export type OneriGirdi = {
  donemId: number;
  tur: "yeni" | "koruma" | "kapsam";
  baslik: string;
  tanim: string;
  ilce: string;
  neden: string;
  nace: string | null;
  naceOnayli: boolean;
};

export async function oneriOlustur(b: Baglam, g: OneriGirdi): Promise<{ id: number }> {
  return islem(b, async (sql) => {
    const [o] = await sql<{ id: number }[]>`
      insert into oneri (donem_id, gonderen_ref, tur, baslik, tanim, ilce, neden, nace, nace_onayli, durum)
      values (${g.donemId}, ${b.gonderenRef}, ${g.tur}::oneri_turu, ${g.baslik}, ${g.tanim},
              ${g.ilce}, ${g.neden}, ${g.nace}, ${g.naceOnayli}, 'kanit_bekliyor')
      returning id
    `;
    await denetle(sql, b, "oneri_gonderildi", "oneri", o.id, { baslik: g.baslik });
    return o;
  });
}

export async function onerilerim(b: Baglam) {
  return islem(b, (sql) =>
    sql<
      { id: number; baslik: string; durum: OneriDurumu; il: string; yil: string;
        kanit: number; destek: number; olusturuldu: string }[]
    >`
      select o.id, o.baslik, o.durum, i.ad as il, d.yil,
             oneri_kanit_yeterliligi(o.id) as kanit,
             destek_sayisi(o.id) as destek,
             o.olusturuldu::text
      from oneri o join donem d on d.id = o.donem_id join il i on i.kod = d.il_kod
      where o.gonderen_ref = ${b.gonderenRef}
      order by o.olusturuldu desc
    `,
  );
}

export async function oneriGetir(b: Baglam, id: number) {
  return islem(b, async (sql) => {
    const [o] = await sql<
      { id: number; donem_id: number; baslik: string; tanim: string; ilce: string | null;
        neden: string; nace: string | null; nace_onayli: boolean; durum: OneriDurumu;
        gonderen_ref: string; il_kod: string; il: string; yil: string; kanit: number; destek: number }[]
    >`
      select o.id, o.donem_id, o.baslik, o.tanim, o.ilce, o.neden, o.nace, o.nace_onayli, o.durum,
             o.gonderen_ref, d.il_kod, i.ad as il, d.yil,
             oneri_kanit_yeterliligi(o.id) as kanit, destek_sayisi(o.id) as destek
      from oneri o join donem d on d.id = o.donem_id join il i on i.kod = d.il_kod
      where o.id = ${id}
    `;
    if (!o) return null;
    const kanitlar = await sql<KanitKaydi[]>`
      select id, kod, kaynak_kurum as "kaynakKurum", belge, belge_surum as "belgeSurum",
             sayfa_tablo as "sayfaTablo", yayim_tarihi::text as "yayimTarihi",
             cografi_kapsam as "cografiKapsam", veri_donemi as "veriDonemi", url, alinti, sinirlilik,
             katki_puani as "katkiPuani", dogrulama_durumu as "dogrulamaDurumu",
             null as "dogrulayan", dogrulama_zamani::text as "dogrulamaZamani"
      from kanit_kunye where oneri_id = ${id} order by id
    `;
    return { ...o, kanitlar };
  });
}

/** Benzerlik: başlık/tanım tsvector + NACE + ilçe örtüşmesi. */
export async function benzerOneriler(b: Baglam, donemId: number, baslik: string, nace: string | null, ilce: string | null) {
  return islem(b, (sql) =>
    sql<{ id: number; baslik: string; kanit: number; destek: number; benzerlik: number }[]>`
      select o.id, o.baslik,
             oneri_kanit_yeterliligi(o.id) as kanit,
             destek_sayisi(o.id) as destek,
             round(100 * (
               0.6 * ts_rank(o.arama, plainto_tsquery('simple', ${baslik})) * 10
               + 0.25 * (case when o.nace is not distinct from ${nace} then 1 else 0 end)
               + 0.15 * (case when o.ilce is not distinct from ${ilce} then 1 else 0 end)
             ))::int as benzerlik
      from oneri o
      where o.donem_id = ${donemId}
        and o.durum not in ('taslak', 'reddedildi', 'birlestirildi')
        and (o.arama @@ plainto_tsquery('simple', ${baslik}) or o.nace is not distinct from ${nace})
      order by benzerlik desc
      limit 3
    `,
  );
}

export async function destekVer(b: Baglam, oneriId: number): Promise<void> {
  await islem(b, async (sql) => {
    await sql`
      insert into destek (oneri_id, gonderen_ref) values (${oneriId}, ${b.gonderenRef})
      on conflict do nothing
    `;
    await denetle(sql, b, "destek_verildi", "oneri", oneriId, {
      not: "Destek sayısı puan girdisi değildir; ilgi sinyalidir.",
    });
  });
}

export async function kanitEkle(
  b: Baglam,
  oneriId: number,
  k: { kaynakKurum: string; belge: string; sayfaTablo: string; yayimTarihi: string | null; url: string | null; alinti: string; katkiPuani: number },
): Promise<{ id: number; kod: string }> {
  return islem(b, async (sql) => {
    const [{ donem_id, aday_id }] = await sql<{ donem_id: number; aday_id: number | null }[]>`
      select o.donem_id, a.id as aday_id
      from oneri o left join aday a on a.oneri_id = o.id
      where o.id = ${oneriId}
    `;
    const [{ kod }] = await sql<{ kod: string }[]>`
      select 'KNT-' || to_char(now(), 'YYYY') || '-' ||
             lpad((coalesce(max(substring(kod from '[0-9]+$')::int), 0) + 1)::text, 4, '0') as kod
      from kanit
    `;
    const [kn] = await sql<{ id: number }[]>`
      insert into kanit (kod, donem_id, aday_id, oneri_id, kaynak_kurum, belge, sayfa_tablo,
                         yayim_tarihi, url, alinti, katki_puani, dogrulama_durumu)
      values (${kod}, ${donem_id}, ${aday_id}, ${oneriId}, ${k.kaynakKurum}, ${k.belge}, ${k.sayfaTablo},
              ${k.yayimTarihi}::date, ${k.url}, ${k.alinti},
              ${Math.max(0, Math.min(100, k.katkiPuani))}, 'beyan')
      returning id
    `;
    await denetle(sql, b, "kanit_eklendi", "kanit", kn.id, { kod, oneriId });
    return { id: kn.id, kod };
  });
}

// ── uzman incelemesi (Blok 4) ──────────────────────────────────────────────

export async function incelemeKuyrugu(b: Baglam, donemId: number) {
  return islem(b, (sql) =>
    sql<
      { id: number; kod: string; belge: string; kaynak_kurum: string; katki_puani: number;
        dogrulama_durumu: string; oneri_id: number | null; oneri_baslik: string | null;
        aday_id: number | null; aday_ad: string | null; alinti: string | null }[]
    >`
      select k.id, k.kod, k.belge, k.kaynak_kurum, k.katki_puani, k.dogrulama_durumu,
             k.oneri_id, o.baslik as oneri_baslik, k.aday_id, a.ad as aday_ad, k.alinti
      from kanit k
      left join oneri o on o.id = k.oneri_id
      left join aday a on a.id = k.aday_id
      where k.donem_id = ${donemId} and k.dogrulama_durumu in ('beyan', 'ai_bulgusu', 'celiskili')
      order by k.olusturuldu
    `,
  );
}

export async function kanitDurumDegistir(
  b: Baglam,
  kanitId: number,
  durum: "uzman_onayli" | "reddedildi" | "celiskili",
  gerekce: string,
): Promise<void> {
  await islem(b, async (sql) => {
    await sql`
      update kanit set
        dogrulama_durumu = ${durum}::dogrulama_durumu,
        dogrulayan_ref = ${durum === "uzman_onayli" ? b.gonderenRef : null},
        dogrulama_zamani = ${durum === "uzman_onayli" ? sql`now()` : null},
        sinirlilik = coalesce(sinirlilik, '') || case when ${gerekce} = '' then '' else E'\n' || ${gerekce} end
      where id = ${kanitId}
    `;
    await denetle(sql, b, `kanit_${durum}`, "kanit", kanitId, { gerekce });
  });
}

export async function oneriDurumDegistir(
  b: Baglam,
  oneriId: number,
  yeni: OneriDurumu,
  gerekce: string,
): Promise<void> {
  await islem(b, async (sql) => {
    await sql`update oneri set durum = ${yeni}::oneri_durumu, guncellendi = now() where id = ${oneriId}`;

    // Konu adayı olduğunda sıralamaya girer — aday kaydı burada doğar.
    if (yeni === "konu_adayi") {
      const [o] = await sql<{ donem_id: number; baslik: string; nace: string | null }[]>`
        select donem_id, baslik, nace from oneri where id = ${oneriId}
      `;
      const [a] = await sql<{ id: number }[]>`
        insert into aday (donem_id, oneri_id, ad, koken, nace)
        values (${o.donem_id}, ${oneriId}, ${o.baslik}, 'yeni', ${o.nace})
        on conflict (oneri_id) do update set ad = excluded.ad
        returning id
      `;
      await sql`update kanit set aday_id = ${a.id} where oneri_id = ${oneriId} and aday_id is null`;
    }
    await denetle(sql, b, `oneri_${yeni}`, "oneri", oneriId, { gerekce });
  });
}

export async function kriterPuaniYaz(
  b: Baglam,
  adayId: number,
  kriter: Kriter,
  puan: number,
  gerekce: string,
): Promise<void> {
  await islem(b, async (sql) => {
    await sql`
      insert into kriter_puani (aday_id, kriter, puan, dogrulandi, degerlendiren_ref, gerekce)
      values (${adayId}, ${kriter}::kriter, ${Math.max(0, Math.min(100, puan))}, true, ${b.gonderenRef}, ${gerekce})
      on conflict (aday_id, kriter) do update set
        puan = excluded.puan, dogrulandi = true,
        degerlendiren_ref = excluded.degerlendiren_ref, gerekce = excluded.gerekce
    `;
    await denetle(sql, b, "kriter_puani_yazildi", "aday", adayId, { kriter, puan, gerekce });
  });
}

// ── karar kilidi (§7 OV-02) ────────────────────────────────────────────────

export async function kararKilitle(
  b: Baglam,
  donemId: number,
  surum: string,
  icerik: unknown,
  gerekceler: unknown[],
): Promise<{ ok: true } | { ok: false; hata: string }> {
  // Katmanlı savunma: uygulama kontrolü + RLS politikası. İkisi de gerekir.
  if (b.rol !== "kurul_uyesi") return { ok: false, hata: "Kararı yalnızca kurul üyesi kilitleyebilir." };

  return islem(b, async (sql) => {
    const [d] = await sql<{ durum: DonemDurumu }[]>`select durum from donem where id = ${donemId}`;
    if (!d) return { ok: false as const, hata: "Dönem bulunamadı." };
    if (d.durum === "kilitli") return { ok: false as const, hata: "Bu dönem zaten kilitli." };

    await sql`
      insert into karar (donem_id, surum, icerik, gerekceler, kilitleyen_ref)
      values (${donemId}, ${surum}, ${sql.json(icerik as never)}, ${sql.json(gerekceler as never)}, ${b.gonderenRef})
    `;
    await sql`update donem set durum = 'kilitli' where id = ${donemId}`;
    await denetle(sql, b, "karar_kilitlendi", "donem", donemId, { surum });
    return { ok: true as const };
  });
}

export async function kararGetir(b: Baglam, donemId: number) {
  return islem(b, async (sql) => {
    const [k] = await sql<
      { surum: string; icerik: unknown; gerekceler: unknown; kilit_zamani: string; kilitleyen: string | null }[]
    >`
      select k.surum, k.icerik, k.gerekceler, k.kilit_zamani::text, ki.ad_soyad as kilitleyen
      from karar k left join kimlik ki on ki.gonderen_ref = k.kilitleyen_ref
      where k.donem_id = ${donemId}
      order by k.kilit_zamani desc limit 1
    `;
    return k ?? null;
  });
}

// ── denetim izi ────────────────────────────────────────────────────────────

export async function denetimIzi(b: Baglam, limit = 50) {
  return islem(b, (sql) =>
    sql<{ id: number; zaman: string; aktor_rol: Rol | null; eylem: string; nesne_tip: string; nesne_id: string | null; detay: unknown }[]>`
      select id, zaman::text, aktor_rol, eylem, nesne_tip, nesne_id, detay
      from denetim order by zaman desc limit ${limit}
    `,
  );
}

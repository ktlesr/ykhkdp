import { onaylayabilir, type Aday, type Koken, type NaceKaynagi, type OneriDurumu, type Rol } from "@ykh/domain";
import { agirlikSetiGecerli, type AgirlikSeti, type Kriter } from "@ykh/scoring";
import type postgres from "postgres";
import { denetle, islem, type Baglam } from "./baglanti.ts";
import { jetonOzeti, oturumJetonu, parolaDogrula, parolaOzetle } from "./parola.ts";

/**
 * Veri erişimi. Her fonksiyon `islem()` içinde çalışır → RLS bağlamı bağlıdır.
 * Bağlamsız (anonim) çağrı yalnızca kamuya açık satırları görür.
 */

// ── oturum ─────────────────────────────────────────────────────────────────

export type Kullanici = { ref: string; rol: Rol; eposta: string | null; adSoyad: string | null };

const ANONIM: Baglam = { gonderenRef: null, rol: "anonim" };

export async function kayitOl(
  eposta: string,
  parola: string,
  adSoyad: string,
): Promise<{ ok: true; jeton: string } | { ok: false; hata: string }> {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return { ok: false, hata: "Geçerli bir e-posta yazın." };
  if (parola.length < 10) return { ok: false, hata: "Parola en az 10 karakter olmalı." };
  if (adSoyad.trim().length < 3) return { ok: false, hata: "Ad soyad en az 3 karakter olmalı." };

  return islem(ANONIM, async (sql) => {
    const [{ eposta_kayitli: kayitli }] = await sql<{ eposta_kayitli: boolean }[]>`select eposta_kayitli(${eposta})`;
    if (kayitli) return { ok: false as const, hata: "Bu e-posta zaten kayıtlı." };

    const [{ hesap_ac: ref }] = await sql<{ hesap_ac: string }[]>`
      select hesap_ac(${eposta}, ${adSoyad.trim()}, ${await parolaOzetle(parola)})
    `;
    const jeton = await oturumYarat(sql, ref);
    await denetle(sql, { gonderenRef: ref, rol: "yatirimci" }, "kayit_olundu", "gonderen", ref);
    return { ok: true as const, jeton };
  });
}

export async function girisYap(
  eposta: string,
  parola: string,
): Promise<{ ok: true; jeton: string } | { ok: false; hata: string }> {
  return islem(ANONIM, async (sql) => {
    const [k] = await sql<{ gonderen_ref: string; parola_hash: string | null }[]>`
      select * from giris_kimlik(${eposta})
    `;
    // Aynı mesaj: hesabın var olup olmadığı sızmaz.
    if (!k || !(await parolaDogrula(parola, k.parola_hash))) {
      return { ok: false as const, hata: "E-posta veya parola hatalı." };
    }
    return { ok: true as const, jeton: await oturumYarat(sql, k.gonderen_ref) };
  });
}

async function oturumYarat(sql: postgres.Sql, ref: string): Promise<string> {
  const jeton = oturumJetonu();
  await sql`insert into oturum (token_hash, gonderen_ref, gecerlilik)
            values (${await jetonOzeti(jeton)}, ${ref}, now() + interval '30 days')`;
  return jeton;
}

export async function oturumCoz(jeton: string | undefined): Promise<Kullanici | null> {
  if (!jeton) return null;
  return islem(ANONIM, async (sql) => {
    const [s] = await sql<{ ref: string; rol: Rol; eposta: string | null; ad_soyad: string | null }[]>`
      select * from oturum_coz(${await jetonOzeti(jeton)})
    `;
    return s ? { ref: s.ref, rol: s.rol, eposta: s.eposta, adSoyad: s.ad_soyad } : null;
  });
}

export async function cikisYap(jeton: string | undefined): Promise<void> {
  if (!jeton) return;
  await islem(ANONIM, async (sql) => {
    await sql`delete from oturum where token_hash = ${await jetonOzeti(jeton)}`;
  });
}

export function baglamdan(k: Kullanici | null): Baglam {
  return k ? { gonderenRef: k.ref, rol: k.rol } : ANONIM;
}

// ── il / dönem ─────────────────────────────────────────────────────────────

export type DonemKaydi = {
  donemId: number;
  ilKod: string;
  il: string;
  ajansKod: string;
  ajans: string;
  yil: string;
  set: AgirlikSeti;
};

export async function donemGetir(b: Baglam, ilKod: string, yil?: string): Promise<DonemKaydi | null> {
  return islem(b, async (sql) => {
    const [d] = await sql<
      { donem_id: number; il_kod: string; il: string; ajans_kod: string; ajans: string; yil: string;
        surum: string; agirliklar: Record<Kriter, number>; devamlilik_payi: number;
        dayanak_esigi: number; devir_siniri: number; slot_sayisi: number }[]
    >`
      select d.id as donem_id, i.kod as il_kod, i.ad as il, a.kod as ajans_kod, a.ad as ajans, d.yil,
             s.surum, s.agirliklar, s.devamlilik_payi, s.dayanak_esigi, s.devir_siniri, s.slot_sayisi
      from donem d
      join il i on i.kod = d.il_kod
      join ajans a on a.kod = i.ajans_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      where i.kod = ${ilKod} ${yil ? sql`and d.yil = ${yil}` : sql``}
      order by d.yil desc limit 1
    `;
    if (!d) return null;

    const set: AgirlikSeti = {
      surum: d.surum, ajans: d.ajans_kod, donem: d.yil, agirliklar: d.agirliklar,
      devamlilikPayi: d.devamlilik_payi, dayanakEsigi: d.dayanak_esigi,
      devirSiniri: d.devir_siniri, slotSayisi: d.slot_sayisi,
    };
    // Fail-closed: geçersiz ağırlık setiyle sıralama hesaplanmaz.
    const g = agirlikSetiGecerli(set);
    if (!g.gecerli) throw new Error(`Ağırlık seti ${set.surum} kullanılamaz: ${g.sebep}`);

    return {
      donemId: d.donem_id, ilKod: d.il_kod, il: d.il,
      ajansKod: d.ajans_kod, ajans: d.ajans, yil: d.yil, set,
    };
  });
}

export async function illeriListele(b: Baglam) {
  return islem(b, (sql) =>
    sql<{ il_kod: string; il: string; ajans: string; yil: string; listede: number; bekleyen: number }[]>`
      select i.kod as il_kod, i.ad as il, a.ad as ajans, d.yil,
             count(*) filter (where o.durum = 'listede')::int as listede,
             count(*) filter (where o.durum in ('degerlendiriliyor','onay_bekliyor'))::int as bekleyen
      from donem d
      join il i on i.kod = d.il_kod
      join ajans a on a.kod = i.ajans_kod
      left join oneri o on o.donem_id = d.id
      group by i.kod, i.ad, a.ad, d.yil
      order by a.ad, i.ad
    `,
  );
}

export async function ilceler(b: Baglam, ilKod: string) {
  return islem(b, (sql) =>
    sql<{ ad: string }[]>`select ad from ilce where il_kod = ${ilKod} order by (ad <> 'Merkez'), ad`,
  );
}

// ── NACE ───────────────────────────────────────────────────────────────────

export type NaceKaydi = { kod: string; tanim: string; duzey: string };

/** Arama: kod öneki veya tanım. Yalnızca sınıf ve faaliyet düzeyi seçilebilir. */
export async function naceAra(b: Baglam, sorgu: string, limit = 20): Promise<NaceKaydi[]> {
  const q = sorgu.trim();
  if (q.length < 2) return [];
  return islem(b, (sql) =>
    sql<NaceKaydi[]>`
      select kod, tanim, duzey::text from nace
      where duzey in ('sinif','faaliyet')
        and (kod like ${q + "%"} or arama @@ plainto_tsquery('simple', ${q}))
      order by (kod like ${q + "%"}) desc, length(kod), kod
      limit ${limit}
    `,
  );
}

export async function naceGetir(b: Baglam, kod: string): Promise<NaceKaydi | null> {
  return islem(b, async (sql) => {
    const [n] = await sql<NaceKaydi[]>`select kod, tanim, duzey::text from nace where kod = ${kod}`;
    return n ?? null;
  });
}

// ── öneri ──────────────────────────────────────────────────────────────────

export type OneriGirdi = {
  donemId: number;
  baslik: string;
  gerekce: string;
  ilce: string;
  naceKod: string | null;
};

export async function oneriOlustur(b: Baglam, g: OneriGirdi): Promise<{ id: number }> {
  return islem(b, async (sql) => {
    const [o] = await sql<{ id: number }[]>`
      insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, ilce, nace_kod, nace_kaynagi, durum)
      values (${g.donemId}, ${b.gonderenRef}, 'yeni', ${g.baslik}, ${g.gerekce}, ${g.ilce},
              ${g.naceKod}, ${g.naceKod ? "kullanici" : null}::nace_kaynagi, 'degerlendiriliyor')
      returning id
    `;
    // Kuyruk yok: worker `degerlendiriliyor` durumundaki önerileri kendisi alır.
    await denetle(sql, b, "oneri_gonderildi", "oneri", o.id, { baslik: g.baslik, naceGirildi: Boolean(g.naceKod) });
    return o;
  });
}

export type ListeSatiri = {
  id: number;
  baslik: string;
  koken: Koken;
  gerekce: string;
  ilce: string | null;
  nace_kod: string | null;
  nace_tanim: string | null;
  nace_kaynagi: NaceKaynagi | null;
  durum: OneriDurumu;
  taban: number;
  dayanak: number;
  ai_gerekce: string | null;
  duzeltildi: boolean;
  olusturuldu: string;
};

/** Sıralama girdisi — yalnızca onaylanmış (`listede`) öneriler. */
export async function adaylariGetir(b: Baglam, d: DonemKaydi): Promise<Aday[]> {
  const satirlar = await islem(b, (sql) =>
    sql<{ id: number; baslik: string; koken: Koken; nace_kod: string | null; taban: number; dayanak: number }[]>`
      select o.id, o.baslik, o.koken, o.nace_kod,
             oneri_taban_puani(o.id, ${sql.json(d.set.agirliklar as never)}) as taban,
             coalesce(g.dayanak, 0) as dayanak
      from oneri o
      left join degerlendirme g on g.oneri_id = o.id
      where o.donem_id = ${d.donemId} and o.durum = 'listede'
      order by o.id
    `,
  );
  return satirlar.map((s) => ({
    id: String(s.id),
    ad: s.baslik,
    koken: s.koken,
    nace: s.nace_kod,
    taban: s.taban,
    dayanak: s.dayanak,
  }));
}

/**
 * Ajans kuyruğu: değerlendirilen ve onay bekleyen öneriler.
 *
 * Katmanlı savunma: RLS sahibinin kendi önerisini görmesine izin verir (doğru
 * davranış), ama onay kuyruğu bir ajans görünümüdür — rol kontrolü burada da yapılır.
 */
export async function onayKuyrugu(b: Baglam, donemId?: number) {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return [];
  return islem(b, (sql) =>
    sql<(ListeSatiri & { il: string; il_kod: string; yil: string })[]>`
      select o.id, o.baslik, o.koken, o.gerekce, o.ilce, o.nace_kod, n.tanim as nace_tanim,
             o.nace_kaynagi, o.durum, o.olusturuldu::text,
             coalesce(g.dayanak, 0) as dayanak,
             g.gerekce as ai_gerekce,
             (g.duzeltilmis_puanlar is not null) as duzeltildi,
             0 as taban,
             i.ad as il, i.kod as il_kod, d.yil
      from oneri o
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      left join degerlendirme g on g.oneri_id = o.id
      left join nace n on n.kod = o.nace_kod
      where o.durum in ('degerlendiriliyor', 'onay_bekliyor')
        ${donemId ? sql`and o.donem_id = ${donemId}` : sql``}
      order by o.olusturuldu
    `,
  );
}

export async function oneriGetir(b: Baglam, id: number) {
  return islem(b, async (sql) => {
    const [o] = await sql<
      (ListeSatiri & {
        donem_id: number; gonderen_ref: string; il: string; il_kod: string; yil: string;
        ret_gerekcesi: string | null; onaylayan: string | null; onay_zamani: string | null;
        puanlar: Record<Kriter, number> | null; alintilar: Array<{ belge_ad: string; alinti: string }> | null;
        model_snapshot: string | null; prompt_surum: string | null;
      })[]
    >`
      select o.id, o.donem_id, o.gonderen_ref, o.baslik, o.koken, o.gerekce, o.ilce,
             o.nace_kod, n.tanim as nace_tanim, o.nace_kaynagi, o.durum, o.ret_gerekcesi,
             o.olusturuldu::text, o.onay_zamani::text, ki.ad_soyad as onaylayan,
             i.ad as il, i.kod as il_kod, d.yil,
             coalesce(g.dayanak, 0) as dayanak,
             g.gerekce as ai_gerekce,
             coalesce(g.duzeltilmis_puanlar, g.puanlar) as puanlar,
             (g.duzeltilmis_puanlar is not null) as duzeltildi,
             g.alintilar, g.model_snapshot, g.prompt_surum,
             oneri_taban_puani(o.id, s.agirliklar) as taban
      from oneri o
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      left join degerlendirme g on g.oneri_id = o.id
      left join nace n on n.kod = o.nace_kod
      left join kimlik ki on ki.gonderen_ref = o.onaylayan_ref
      where o.id = ${id}
    `;
    return o ?? null;
  });
}

export async function onerilerim(b: Baglam) {
  return islem(b, (sql) =>
    sql<{ id: number; baslik: string; durum: OneriDurumu; il: string; il_kod: string; yil: string; dayanak: number; olusturuldu: string }[]>`
      select o.id, o.baslik, o.durum, i.ad as il, i.kod as il_kod, d.yil,
             coalesce(g.dayanak, 0) as dayanak, o.olusturuldu::text
      from oneri o
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      left join degerlendirme g on g.oneri_id = o.id
      where o.gonderen_ref = ${b.gonderenRef}
      order by o.olusturuldu desc
    `,
  );
}

// ── ajans işlemleri ────────────────────────────────────────────────────────

export async function durumDegistir(
  b: Baglam,
  oneriId: number,
  yeni: OneriDurumu,
  gerekce: string,
): Promise<void> {
  await islem(b, async (sql) => {
    await sql`
      update oneri set
        durum = ${yeni}::oneri_durumu,
        ret_gerekcesi = ${yeni === "reddedildi" ? gerekce : null},
        onaylayan_ref = ${yeni === "listede" ? b.gonderenRef : null},
        onay_zamani = ${yeni === "listede" ? sql`now()` : null},
        guncellendi = now()
      where id = ${oneriId}
    `;
    await denetle(sql, b, `oneri_${yeni}`, "oneri", oneriId, { gerekce });
  });
}

/** Ajans düzeltmesi. AI'nin ham puanı korunur; düzeltme ayrı kolona yazılır. */
export async function puanDuzelt(
  b: Baglam,
  oneriId: number,
  puanlar: Record<Kriter, number>,
  gerekce: string,
): Promise<void> {
  await islem(b, async (sql) => {
    const [onceki] = await sql<{ puanlar: unknown; duzeltilmis_puanlar: unknown }[]>`
      select puanlar, duzeltilmis_puanlar from degerlendirme where oneri_id = ${oneriId}
    `;
    await sql`
      update degerlendirme
      set duzeltilmis_puanlar = ${sql.json(puanlar as never)}, duzelten_ref = ${b.gonderenRef}
      where oneri_id = ${oneriId}
    `;
    await denetle(sql, b, "puan_duzeltildi", "oneri", oneriId, { gerekce, onceki, yeni: puanlar });
  });
}

export async function naceDuzelt(b: Baglam, oneriId: number, naceKod: string): Promise<void> {
  await islem(b, async (sql) => {
    await sql`update oneri set nace_kod = ${naceKod}, nace_kaynagi = 'ajans', guncellendi = now() where id = ${oneriId}`;
    await denetle(sql, b, "nace_duzeltildi", "oneri", oneriId, { naceKod });
  });
}

// ── üst ölçekli belgeler ───────────────────────────────────────────────────

export type BelgeKaydi = {
  id: number; ad: string; tur: string; yil: string | null;
  ajans_kod: string | null; il_kod: string | null; uzunluk: number; olusturuldu: string;
};

export async function belgeleriListele(b: Baglam) {
  return islem(b, (sql) =>
    sql<BelgeKaydi[]>`
      select id, ad, tur::text, yil, ajans_kod, il_kod,
             char_length(metin) as uzunluk, olusturuldu::text
      from belge order by olusturuldu desc
    `,
  );
}

export async function belgeEkle(
  b: Baglam,
  g: { ad: string; tur: string; yil: string | null; ajansKod: string | null; ilKod: string | null; metin: string },
): Promise<{ id: number }> {
  return islem(b, async (sql) => {
    const [x] = await sql<{ id: number }[]>`
      insert into belge (ad, tur, yil, ajans_kod, il_kod, metin, yukleyen_ref)
      values (${g.ad}, ${g.tur}::belge_turu, ${g.yil}, ${g.ajansKod}, ${g.ilKod}, ${g.metin}, ${b.gonderenRef})
      returning id
    `;
    await denetle(sql, b, "belge_eklendi", "belge", x.id, { ad: g.ad, uzunluk: g.metin.length });
    return x;
  });
}

export async function belgeSil(b: Baglam, id: number): Promise<void> {
  await islem(b, async (sql) => {
    await sql`delete from belge where id = ${id}`;
    await denetle(sql, b, "belge_silindi", "belge", id, {});
  });
}

// ── denetim ────────────────────────────────────────────────────────────────

export async function denetimIzi(b: Baglam, limit = 50) {
  return islem(b, (sql) =>
    sql<{ id: number; zaman: string; aktor_rol: Rol | null; eylem: string; nesne_tip: string; nesne_id: string | null; detay: unknown }[]>`
      select id, zaman::text, aktor_rol, eylem, nesne_tip, nesne_id, detay
      from denetim order by zaman desc limit ${limit}
    `,
  );
}

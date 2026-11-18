import { gecisIzinli, onaylayabilir, type Aday, type Koken, type NaceKaynagi, type OneriDurumu, type Rol } from "@ykh/domain";
import { agirlikSetiGecerli, type AgirlikSeti, type Kriter } from "@ykh/scoring";
import { createHash } from "node:crypto";
import type postgres from "postgres";
import { denetle, islem, type Baglam } from "./baglanti.ts";
import { parcala, type Kategori } from "./belge-yukle.ts";
import { jetonOzeti, oturumJetonu, parolaDogrula, parolaOzetle } from "./parola.ts";

/**
 * Veri erişimi. Her fonksiyon `islem()` içinde çalışır → RLS bağlamı bağlıdır.
 * Bağlamsız (anonim) çağrı yalnızca kamuya açık satırları görür.
 */

// ── oturum ─────────────────────────────────────────────────────────────────

export type Kullanici = {
  ref: string;
  rol: Rol;
  eposta: string | null;
  adSoyad: string | null;
  /** kayıt olmadan devam eden gönderen — `kimlik` satırı yok */
  misafir: boolean;
};

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

/**
 * Misafir oturumu açar — kişisel veri toplanmaz.
 *
 * "Kayıt olmadan devam et" yolu. `kimlik` satırı oluşturulmaz; öneri değişmez
 * `gonderen.ref` anahtarına bağlanır ve yatırımcı oturum çerezi ile kendi
 * önerisini takip edebilir. Çerez kaybolursa öneriye erişim biter — bilinen ve
 * kabul edilmiş bedel; alternatifi kişisel veri toplamak.
 */
export async function misafirAc(): Promise<{ jeton: string; ref: string }> {
  return islem(ANONIM, async (sql) => {
    const [{ misafir_ac: ref }] = await sql<{ misafir_ac: string }[]>`select misafir_ac()`;
    const jeton = await oturumYarat(sql, ref);
    await denetle(sql, { gonderenRef: ref, rol: "yatirimci" }, "misafir_oturum_acildi", "gonderen", ref);
    return { jeton, ref };
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
    const [s] = await sql<
      { ref: string; rol: Rol; eposta: string | null; ad_soyad: string | null; misafir: boolean }[]
    >`
      select * from oturum_coz(${await jetonOzeti(jeton)})
    `;
    return s
      ? { ref: s.ref, rol: s.rol, eposta: s.eposta, adSoyad: s.ad_soyad, misafir: s.misafir }
      : null;
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
  /**
   * Ağırlık seti bu ajansın YAYIMLADIĞI kalibrasyon mu, yoksa ulusal
   * varsayılan mı. False ise ekran bunu yazmak zorunda: brief §5 "gizli
   * katsayı yok" — hangi sayının nereden geldiği görünmeli.
   */
  kalibre: boolean;
};

export async function donemGetir(b: Baglam, ilKod: string, yil?: string): Promise<DonemKaydi | null> {
  return islem(b, async (sql) => {
    const [d] = await sql<
      { donem_id: number; il_kod: string; il: string; ajans_kod: string; ajans: string; yil: string;
        surum: string; set_ajans_kod: string | null; agirliklar: Record<Kriter, number>;
        devamlilik_payi: number; dayanak_esigi: number; devir_siniri: number; slot_sayisi: number }[]
    >`
      select d.id as donem_id, i.kod as il_kod, i.ad as il, a.kod as ajans_kod, a.ad as ajans, d.yil,
             s.surum, s.ajans_kod as set_ajans_kod, s.agirliklar, s.devamlilik_payi,
             s.dayanak_esigi, s.devir_siniri, s.slot_sayisi
      from donem d
      join il i on i.kod = d.il_kod
      join ajans a on a.kod = i.ajans_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      where i.kod = ${ilKod} ${yil ? sql`and d.yil = ${yil}` : sql``}
      order by d.yil desc limit 1
    `;
    if (!d) return null;

    const set: AgirlikSeti = {
      // Ulusal varsayılanda `set_ajans_kod` null; puanlama açısından fark yok,
      // ama "bu sayıları kim koydu" sorusu ekranda cevaplanıyor (bkz. `kalibre`).
      surum: d.surum, ajans: d.set_ajans_kod ?? d.ajans_kod, donem: d.yil, agirliklar: d.agirliklar,
      devamlilikPayi: d.devamlilik_payi, dayanakEsigi: d.dayanak_esigi,
      devirSiniri: d.devir_siniri, slotSayisi: d.slot_sayisi,
    };
    // Fail-closed: geçersiz ağırlık setiyle sıralama hesaplanmaz.
    const g = agirlikSetiGecerli(set);
    if (!g.gecerli) throw new Error(`Ağırlık seti ${set.surum} kullanılamaz: ${g.sebep}`);

    return {
      donemId: d.donem_id, ilKod: d.il_kod, il: d.il,
      ajansKod: d.ajans_kod, ajans: d.ajans, yil: d.yil, set,
      /** false ise ulusal varsayılan uygulanıyor; ekran bunu yazmak zorunda */
      kalibre: d.set_ajans_kod !== null,
    };
  });
}

/**
 * İl listesi — 81 ilin TAMAMI, dönemi olmayanlar da.
 *
 * Önce `donem` ile iç birleştirme yapıyordu ve dönemi olmayan 77 il hiç
 * görünmüyordu; o illerin yürürlükteki resmî listesi yüklü olduğu hâlde
 * ulaşılamıyordu. Dönemi olmayan ilde `yil` null gelir ve ekran bunu
 * "açık dönem yok" olarak yazar, gizlemez.
 */
export async function illeriListele(b: Baglam) {
  return islem(b, (sql) =>
    sql<
      { il_kod: string; il: string; ajans_kod: string; ajans: string; kisa_ad: string | null;
        yil: string | null; listede: number; bekleyen: number; resmi_konu: number }[]
    >`
      select i.kod as il_kod, i.ad as il, a.kod as ajans_kod, a.ad as ajans, a.kisa_ad,
             max(d.yil) as yil,
             count(*) filter (where o.durum = 'listede')::int as listede,
             count(*) filter (where o.durum in ('degerlendiriliyor','onay_bekliyor'))::int as bekleyen,
             (select count(*) from yatirim_konusu y where y.il_kod = i.kod)::int as resmi_konu
      from il i
      join ajans a on a.kod = i.ajans_kod
      left join donem d on d.il_kod = i.kod
      left join oneri o on o.donem_id = d.id
      group by i.kod, i.ad, a.kod, a.ad, a.kisa_ad
      order by a.kod, i.ad
    `,
  );
}

/**
 * Tanıtım sayfasının sayıları — hepsi kamuya açık, hepsi gerçek.
 *
 * Landing sayfasında uydurma metrik yok: bu sayılar veritabanından geliyor ve
 * boşsa boş görünüyor. "1000+ yatırımcı" gibi bir cümle bu üründe yazılamaz.
 */
export async function platformOzeti(b: Baglam) {
  return islem(b, async (sql) => {
    const [r] = await sql<
      { il: number; ajans: number; nace: number; belge: number; parca: number; listede: number; bekleyen: number }[]
    >`
      select
        (select count(*) from il)::int as il,
        (select count(*) from ajans)::int as ajans,
        (select count(*) from nace)::int as nace,
        (select count(distinct ad) from belge)::int as belge,
        (select count(*) from belge)::int as parca,
        (select count(*) from oneri where durum = 'listede')::int as listede,
        (select count(*) from oneri where durum in ('degerlendiriliyor','onay_bekliyor'))::int as bekleyen
    `;
    return r;
  });
}

/**
 * Tanıtım sayfası için GERÇEK bir değerlendirme kaydı.
 *
 * Landing sayfasının imza anı: mekanizmayı anlatmak yerine çalıştığını
 * göstermek. En çok doğrulanmış alıntısı olan kayıt seçilir; kayıt yoksa null
 * döner ve sayfa uydurma bir örnek göstermez.
 *
 * YALNIZCA `koken = 'mevcut'`: yatırımcının gönderdiği konu başlığı ticari
 * fikirdir ve sahibi ile ajans dışında kimseye gösterilmez — onaylanmış olsa
 * bile. Resmî listeden türeyen konular ise zaten yayımlanmış tebliğ metnidir;
 * platformun onlara ne dediğini göstermek kimsenin verisini açmaz.
 */
export async function ornekDegerlendirme(b: Baglam) {
  return islem(b, async (sql) => {
    const [r] = await sql<
      {
        id: number; baslik: string; il: string; il_kod: string; ilce: string | null;
        dayanak: number; gerekce: string; model_snapshot: string; prompt_surum: string;
        alintilar: Array<{ belge_ad: string; bolum: string | null; alinti: string }>;
        kriter_dayanagi: Record<string, number[]>;
        karsi_gorus: Array<{ tur: string; iddia: string }>;
      }[]
    >`
      select o.id, o.baslik, i.ad as il, i.kod as il_kod, o.ilce,
             g.dayanak, g.gerekce, g.model_snapshot, g.prompt_surum,
             g.alintilar, g.kriter_dayanagi, g.karsi_gorus
      from oneri o
      join degerlendirme g on g.oneri_id = o.id
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      where o.koken = 'mevcut' and jsonb_array_length(g.alintilar) > 0
      order by jsonb_array_length(g.alintilar) desc, g.dayanak desc, o.id
      limit 1
    `;
    return r ?? null;
  });
}

// ── kurumsal ayarlar ───────────────────────────────────────────────────────

/**
 * Kurumsal ayar okuma — herkes okur (palet kamuya açık bir görünüm kararı).
 * Anahtar yoksa null döner ve çağıran kendi varsayılanını kullanır; ayar
 * tablosu boşken arayüz çalışmaya devam eder.
 */
export async function ayarGetir(b: Baglam, anahtar: string): Promise<string | null> {
  const [r] = await islem(b, (sql) =>
    sql<{ deger: string }[]>`select deger from ayar where anahtar = ${anahtar}`,
  );
  return r?.deger ?? null;
}

/**
 * Kurumsal ayar yazma — RLS yalnızca yöneticiye izin verir; denetime yazılır.
 *
 * Yetkisiz çağrı SESSİZCE BAŞARISIZ OLMAZ, hata fırlatır: `with check` ihlali
 * PostgreSQL'de "new row violates row-level security policy" olarak yükselir.
 * Bu doğru davranış — yetkisiz yazma denemesi gürültülü olmalı — ve arayüz
 * katmanı rol kontrolünü zaten önce yapıyor; buraya düşen bir çağrı ilk
 * katmanın atlandığı anlamına gelir.
 *
 * Dönüş değeri UPDATE yolu içindir: politika satırı filtrelerse 0 satır etkiler
 * ve hata yükselmez.
 */
export async function ayarYaz(b: Baglam, anahtar: string, deger: string): Promise<boolean> {
  return islem(b, async (sql) => {
    const [onceki] = await sql<{ deger: string }[]>`select deger from ayar where anahtar = ${anahtar}`;
    const yazilan = await sql`
      insert into ayar (anahtar, deger, guncelleyen_ref, guncellendi)
      values (${anahtar}, ${deger}, ${b.gonderenRef}, now())
      on conflict (anahtar) do update set
        deger = excluded.deger,
        guncelleyen_ref = excluded.guncelleyen_ref,
        guncellendi = now()
      returning anahtar
    `;
    // RLS yazmayı sessizce 0 satıra düşürebilir; çağıran bunu bilmeli.
    if (!yazilan.length) return false;
    await denetle(sql, b, "ayar_degistirildi", "ayar", null, {
      anahtar,
      onceki: onceki?.deger ?? null,
      yeni: deger,
    });
    return true;
  });
}

export type YatirimKonusu = {
  sira: number;
  baslik: string;
  gerekce: string;
  kaynak: string;
  /**
   * Bir önceki yıl karşılığı:
   *  `aynen`  — başlık BİREBİR aynı, kanıtlanabilir olgu
   *  `benzer` — yakın bir başlık var ama yeniden ifade edilmiş; DOĞRULANMADI
   *  `yok`    — bir önceki listede karşılık bulunamadı
   */
  onceki_durum: "aynen" | "benzer" | "yok";
  onceki_baslik: string | null;
  onceki_benzerlik: number | null;
};

/**
 * Yıllar arası süreklilik eşiği — ADAY GÖSTERME eşiği, karar eşiği değil.
 *
 * Resmî başlıklar çok ortak kalıp taşıyor ("Katma Değerli Ürün Üretimi",
 * "Entegre … İşleme Tesisi"), bu yüzden trigram benzerliğinin bir gürültü
 * tabanı var: ölçüldü, Muş'ta "Entegre Kaz Yetiştiriciliği" ile "Su Ürünleri
 * Yetiştiriciliği" 0.48 alıyor — farklı konular.
 *
 * Bu yüzden benzerlik KARAR VERMEZ: yalnızca birebir aynı başlık "aynen
 * korundu" olgusu sayılır; kalan yakın eşleşmeler "doğrulanmadı" durumunda
 * gösterilir ve iki başlık yan yana konur, yargıyı insan verir.
 */
export const SUREKLILIK_ESIGI = 0.45;

/**
 * Bir ilin o yılki RESMÎ yatırım konuları — tebliğ listesi.
 *
 * Platformun sıralaması bu listenin yerine geçmez; onun hazırlık katmanıdır.
 * Ekranda yan yana durmaları ürünün ne yaptığını anlatan şeydir: solda
 * yürürlükteki resmî liste, sağda platformun gerekçelendirdiği sıralama.
 */
export async function yatirimKonulari(
  b: Baglam,
  ilKod: string,
  yil: number,
): Promise<YatirimKonusu[]> {
  const { konular, adaylar } = await islem(b, async (sql) => {
    const konular = await sql<{ sira: number; baslik: string; gerekce: string; kaynak: string }[]>`
      select sira, baslik, gerekce, kaynak from yatirim_konusu
      where il_kod = ${ilKod} and yil = ${yil} order by sira
    `;
    const adaylar = await sql<{ sira: number; onceki_sira: number; onceki_baslik: string; benzerlik: number }[]>`
      select y.sira, o.sira as onceki_sira, o.baslik as onceki_baslik,
             round(similarity(y.baslik, o.baslik)::numeric, 2)::float8 as benzerlik
      from yatirim_konusu y
      join yatirim_konusu o
        on o.il_kod = y.il_kod and o.yil = ${yil - 1}
       and similarity(y.baslik, o.baslik) >= ${SUREKLILIK_ESIGI}
      where y.il_kod = ${ilKod} and y.yil = ${yil}
      order by similarity(y.baslik, o.baslik) desc, y.sira, o.sira
    `;
    return { konular, adaylar };
  });

  /**
   * Birebir eşleme: bir önceki yılın bir konusu EN FAZLA bir konuya eşlenir.
   *
   * Aksi hâlde aynı 2025 konusu iki 2026 konusuna birden eşleşiyordu (ölçüldü:
   * Muş'ta "Entegre Kaz Yetiştiriciliği" hem kendisine hem "Su Ürünleri
   * Yetiştiriciliği"ne). En yüksek benzerlikten başlayarak açgözlü eşleme;
   * her iki taraf da bir kez kullanılır.
   */
  const eslesme = new Map<number, { baslik: string; benzerlik: number }>();
  const kullanilan = new Set<number>();
  for (const a of adaylar) {
    if (eslesme.has(a.sira) || kullanilan.has(a.onceki_sira)) continue;
    eslesme.set(a.sira, { baslik: a.onceki_baslik, benzerlik: Number(a.benzerlik) });
    kullanilan.add(a.onceki_sira);
  }

  /** "Aynen korundu" olgusu: boşluk ve büyük/küçük harf dışında fark yok. */
  const sade = (x: string) => x.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");

  return konular.map((k) => {
    const e = eslesme.get(k.sira);
    if (!e) {
      return { ...k, onceki_durum: "yok" as const, onceki_baslik: null, onceki_benzerlik: null };
    }
    return {
      ...k,
      onceki_durum: sade(k.baslik) === sade(e.baslik) ? ("aynen" as const) : ("benzer" as const),
      onceki_baslik: e.baslik,
      onceki_benzerlik: e.benzerlik,
    };
  });
}

/** Bir ilde herhangi bir yılın resmî listesi var mı — dönem şartı olmadan. */
export async function konuluYillar(b: Baglam, ilKod: string): Promise<number[]> {
  const r = await islem(b, (sql) =>
    sql<{ yil: number }[]>`
      select distinct yil from yatirim_konusu where il_kod = ${ilKod} order by yil desc
    `,
  );
  return r.map((x) => Number(x.yil));
}

/** İl künyesi — dönem şartı yok, 81 ilin hepsi için çalışır. */
export async function ilGetir(b: Baglam, ilKod: string) {
  const [r] = await islem(b, (sql) =>
    sql<{ kod: string; ad: string; ajans: string; ajans_kod: string; kisa_ad: string | null }[]>`
      select i.kod, i.ad, a.ad as ajans, a.kod as ajans_kod, a.kisa_ad
      from il i join ajans a on a.kod = i.ajans_kod
      where i.kod = ${ilKod}
    `,
  );
  return r ?? null;
}

export type Bolge = {
  ajans_kod: string;
  ajans: string;
  /** ajansın günlük kısaltması — ZAFER, AHİKA, DOĞAKA */
  kisa_ad: string | null;
  iller: Array<{
    kod: string;
    ad: string;
    /** açık dönem yılı; null ise o ile öneri verilemez */
    yil: string | null;
    /** ilçe verisi yüklenmemiş illerde boş — uydurulmaz */
    ilceler: string[];
  }>;
};

/**
 * Öneri sihirbazının tüm coğrafyası — tek sorgu.
 *
 * Sihirbaz ajans bölgesi → il → ilçe adımlarını istemcide yürütüyor; her adımda
 * sunucuya dönmek gereksiz gecikme.
 *
 * TÜM ajanslar ve iller döner, açık dönemi olmayanlar da. Dönemi olmayan ile
 * öneri verilemez ama listeden GİZLENMEZ: yatırımcı ilini bulur ve "açık dönem
 * yok" cevabını alır. Gizlemek, ilin hiç olmadığı izlenimi verirdi.
 *
 * ponytail: tüm ilçeler tek seferde geliyor. 81 il × ~15 ilçe ≈ 1200 satır,
 * JSON olarak önemsiz. Ölçü rahatsız edici olursa ilçeler adım 3'te ayrı bir
 * sunucu eylemiyle çekilir ve sihirbazın yalnızca o adımı değişir.
 */
export async function bolgeler(b: Baglam): Promise<Bolge[]> {
  const satirlar = await islem(b, (sql) =>
    sql<
      { ajans_kod: string; ajans: string; kisa_ad: string | null; kod: string; ad: string;
        yil: string | null; ilceler: string[] }[]
    >`
      select a.kod as ajans_kod, a.ad as ajans, a.kisa_ad, i.kod, i.ad, max(d.yil) as yil,
             coalesce(
               array_agg(distinct c.ad) filter (where c.ad is not null),
               '{}'
             ) as ilceler
      from ajans a
      join il i on i.ajans_kod = a.kod
      left join donem d on d.il_kod = i.kod
      left join ilce c on c.il_kod = i.kod
      group by a.kod, a.ad, a.kisa_ad, i.kod, i.ad
      order by a.ad, i.ad
    `,
  );

  const out: Bolge[] = [];
  for (const r of satirlar) {
    let bolge = out.find((x) => x.ajans_kod === r.ajans_kod);
    if (!bolge) {
      bolge = { ajans_kod: r.ajans_kod, ajans: r.ajans, kisa_ad: r.kisa_ad, iller: [] };
      out.push(bolge);
    }
    // `array_agg(distinct)` sıralamayı taşımıyor; Merkez'i başa almak burada.
    const ilceler = [...r.ilceler].sort((x, y) =>
      x === "Merkez" ? -1 : y === "Merkez" ? 1 : x.localeCompare(y, "tr"),
    );
    bolge.iller.push({ kod: r.kod, ad: r.ad, yil: r.yil, ilceler });
  }
  return out;
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
  ilce: string | null;
  naceKod: string | null;
  /** ürün grupları — kullanıcı yazdı, kanıta bağlı değil (ekranda "doğrulanmadı") */
  kapsam?: string[];
};

/** Gönderen kotası aşıldı: öneri ve model işi oluşturulmadı. */
export class KotaAsildi extends Error {}

/**
 * `kota` verilirse gönderen başına son 24 saatteki öneri sayısı sınırlanır.
 * Sayım ve ekleme AYNI transaction'da, gönderene özgü advisory kilitle seri:
 * düz COUNT + INSERT eşzamanlı iki gönderimde kotayı aşardı.
 */
export async function oneriOlustur(b: Baglam, g: OneriGirdi, kota?: number): Promise<{ id: number }> {
  return islem(b, async (sql) => {
    if (kota !== undefined) {
      await sql`select pg_advisory_xact_lock(hashtext(${"oneri-kota:" + (b.gonderenRef ?? "")}))`;
      const [{ n }] = await sql<{ n: number }[]>`
        select count(*)::int as n from oneri
        where gonderen_ref = ${b.gonderenRef} and olusturuldu > now() - interval '24 hours'
      `;
      if (n >= kota) throw new KotaAsildi(`Son 24 saatte ${n} öneri verildi; sınır ${kota}.`);
    }
    const [o] = await sql<{ id: number }[]>`
      insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, ilce, kapsam, nace_kod, nace_kaynagi, durum)
      values (${g.donemId}, ${b.gonderenRef}, 'yeni', ${g.baslik}, ${g.gerekce}, ${g.ilce},
              ${g.kapsam?.length ? sql.json(g.kapsam.map((ad) => ({ ad, kanit_id: [] })) as never) : null},
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
    sql<(ListeSatiri & { il: string; il_kod: string; yil: string; dayanak_esigi: number;
      asama: string | null; hatali: boolean; gonderildi: string; kesif_id: number | null; resmi_yillar: string | null;
      ajans_kod: string; ajans: string; kisa_ad: string | null; gonderen_rol: string; misafir: boolean })[]>`
      select o.id, o.baslik, o.kesif_id,
             i.ajans_kod, a.ad as ajans, a.kisa_ad, coalesce(gg.rol::text, 'bilinmiyor') as gonderen_rol,
             coalesce(gg.misafir, false) as misafir,
             (select string_agg(distinct y.yil::text, ', ' order by y.yil::text) from yatirim_konusu y
               where y.il_kod = i.kod and lower(trim(y.baslik)) = lower(trim(o.baslik))) as resmi_yillar, o.koken, o.gerekce, o.ilce, o.nace_kod, n.tanim as nace_tanim,
             o.nace_kaynagi, o.durum, o.olusturuldu::text,
             -- Ekran saati: ürün Türkiye'de, oturum saat diliminden bağımsız.
             to_char(o.olusturuldu at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as gonderildi,
             coalesce(g.dayanak, 0) as dayanak,
             g.gerekce as ai_gerekce,
             (g.duzeltilmis_puanlar is not null) as duzeltildi,
             -- Stratejik puan: "en iyi en üstte" sıralaması ve öngörü için.
             case when g.oneri_id is null then 0
                  else oneri_taban_puani(o.id, s.agirliklar) end as taban,
             i.ad as il, i.kod as il_kod, d.yil,
             -- Eşik dönemin ağırlık setinden: detay ekranıyla aynı etiket.
             s.dayanak_esigi,
             o.asama, (o.son_hata is not null) as hatali
      from oneri o
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      join ajans a on a.kod = i.ajans_kod
      -- Önerinin YOLU (yatırımcı, misafir, ajans) gönderen kaydından; ajans görür.
      -- left: RLS bir gönderen satırını gizlerse öneri kuyruktan SESSİZCE düşmesin.
      left join gonderen gg on gg.ref = o.gonderen_ref
      left join degerlendirme g on g.oneri_id = o.id
      left join nace n on n.kod = o.nace_kod
      where o.durum in ('degerlendiriliyor', 'onay_bekliyor')
        ${donemId ? sql`and o.donem_id = ${donemId}` : sql``}
      -- Bölge → il → geliş sırası: ekran bu sırayla gruplar.
      order by a.ad, i.ad, o.olusturuldu, o.id
    `,
  );
}

/**
 * Benzerlik eşiği — gerçek başlık çiftleriyle ölçüldü, `database.test.ts`
 * içinde sabitlendi.
 *
 *   aynı konu, farklı sözcükler        0.37 – 0.70
 *   farklı konu                        0.06 – 0.30
 *
 * 0.35 dört gerçek kopyayı da yakalıyor, dört farklı konuyu da dışarıda
 * bırakıyor. Marj ince: en yakın yanlış eşleşme "Deri ve deri ürünlerinde
 * ihtisas üretimi" ↔ "Süt ve süt ürünleri işleme" (0.30) ve benzerliği
 * konudan değil "ve … ürünleri" kalıbından geliyor.
 *
 * Geri çağırma lehine seçildi: sonuç bir karar değil, ajansın bakması gereken
 * yeri gösteren işaret. Fazladan bir işaret gürültü; kaçırılan kopya iki kez
 * onaylanmış aynı konu demek.
 *
 * ponytail: durak kelime ayıklama yok. Yanlış eşleşme rahatsız edici olursa
 * karşılaştırma başlıktan durak kelimeler çıkarıldıktan sonra yapılır.
 */
export const BENZERLIK_ESIGI = 0.35;

export type YakinKopya = { id: number; baslik: string; durum: OneriDurumu; benzerlik: number };

/**
 * Aynı (il, dönem) içindeki yakın kopyalar.
 *
 * AI yok: `pg_trgm` benzerliği deterministik ve tekrarlanabilir. Sonuç bir
 * karar değil, ajansın bakması gereken yeri gösteren işaret.
 */
export async function yakinKopyalar(b: Baglam, oneriId: number): Promise<YakinKopya[]> {
  return islem(b, (sql) =>
    sql<YakinKopya[]>`
      select k.id, k.baslik, k.durum, round(similarity(o.baslik, k.baslik)::numeric, 2) as benzerlik
      from oneri o
      join oneri k on k.donem_id = o.donem_id and k.id <> o.id
      where o.id = ${oneriId}
        and k.durum <> 'reddedildi'
        and similarity(o.baslik, k.baslik) >= ${BENZERLIK_ESIGI}
      order by similarity(o.baslik, k.baslik) desc, k.id
      limit 5
    `,
  );
}

/** Onay kuyruğundaki her öneri için yakın kopya sayısı — tek sorgu. */
export async function kuyrukKopyalari(b: Baglam): Promise<Map<number, YakinKopya[]>> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return new Map();
  const satirlar = await islem(b, (sql) =>
    sql<{ oneri_id: number; id: number; baslik: string; durum: OneriDurumu; benzerlik: number }[]>`
      select o.id as oneri_id, k.id, k.baslik, k.durum,
             round(similarity(o.baslik, k.baslik)::numeric, 2) as benzerlik
      from oneri o
      join oneri k on k.donem_id = o.donem_id and k.id <> o.id
      where o.durum in ('degerlendiriliyor', 'onay_bekliyor')
        and k.durum <> 'reddedildi'
        and similarity(o.baslik, k.baslik) >= ${BENZERLIK_ESIGI}
      order by o.id, similarity(o.baslik, k.baslik) desc
    `,
  );
  const out = new Map<number, YakinKopya[]>();
  for (const r of satirlar) {
    const liste = out.get(Number(r.oneri_id)) ?? [];
    liste.push({ id: r.id, baslik: r.baslik, durum: r.durum, benzerlik: Number(r.benzerlik) });
    out.set(Number(r.oneri_id), liste);
  }
  return out;
}

/**
 * Belge kapsaması — hangi ilde AI neyi dayanak alabiliyor.
 *
 * Ulusal belgeler her ilde var; ile veya ajansa özgü belge yoksa yerellik
 * grubu ("neden burada?") ulusal metinden gerekçelendirilemez ve dayanak düşük
 * kalır. Ajans bunu tahmin etmek zorunda kalmasın.
 */
export async function belgeKapsami(b: Baglam) {
  return islem(b, (sql) =>
    sql<{ il: string; il_kod: string; ajans_kod: string; il_belgesi: number; ajans_belgesi: number; ulusal: number; kategoriler: string[] }[]>`
      select i.ad as il, i.kod as il_kod, i.ajans_kod,
             count(distinct b.ad) filter (where b.il_kod = i.kod)::int as il_belgesi,
             count(distinct b.ad) filter (where b.il_kod is null and b.ajans_kod = i.ajans_kod)::int as ajans_belgesi,
             count(distinct b.ad) filter (where b.il_kod is null and b.ajans_kod is null)::int as ulusal,
             -- ilin kendi belgelerinde hangi konu kategorileri var (genel hariç)
             coalesce(array_agg(distinct b.kategori) filter (where b.il_kod = i.kod and b.kategori <> 'genel'), '{}') as kategoriler
      from il i
      join donem d on d.il_kod = i.kod
      left join belge b on b.il_kod = i.kod
        or (b.il_kod is null and b.ajans_kod = i.ajans_kod)
        or (b.il_kod is null and b.ajans_kod is null)
      group by i.ad, i.kod, i.ajans_kod
      order by i.ad
    `,
  );
}

export async function oneriGetir(b: Baglam, id: number) {
  return islem(b, async (sql) => {
    const [o] = await sql<
      (ListeSatiri & {
        donem_id: number; gonderen_ref: string; il: string; il_kod: string; yil: string;
        ret_gerekcesi: string | null; onaylayan: string | null; onay_zamani: string | null;
        deneme: number; son_hata: string | null;
        /** değerlendirme koşusunun adımı (0016); null = sırada ya da bitti */
        asama: string | null; asama_zamani: string | null;
        puanlar: Record<Kriter, number> | null;
        alintilar: Array<{ belge_ad: string; bolum: string | null; alinti: string }> | null;
        /** kriter → alintilar dizisindeki sıralar; boş dizi = dayanaksız kriter */
        kriter_dayanagi: Partial<Record<Kriter, number[]>> | null;
        /** AI'nin aynı belgelerle ürettiği itirazlar; puana etki etmez */
        karsi_gorus: Array<{
          tur: string;
          iddia: string;
          alintilar: Array<{ belge_ad: string; bolum: string | null; alinti: string }>;
        }> | null;
        model_snapshot: string | null; prompt_surum: string | null;
        /** aday keşfinden geldiyse: adayı doğuran doğrulanmış kanıtlar */
        kesif_id: number | null;
        /** başlık bu ilin resmî listesinde BİREBİR geçtiği yıllar (mekanik eşleşme) */
        resmi_yillar: string | null;
        kesif_kanit: Array<{ belge_ad: string; bolum: string | null; tur: string; konu: string; alinti: string; yerel: boolean }> | null;
        /** ürün grupları; keşifte her biri kendi kanıtına bağlı, kullanıcı yazdıysa kanit_id boş */
        kapsam: Array<{ ad: string; kanit_id: number[]; yerel?: boolean }> | null;
        /** ek NACE kodları — her biri bir ürün grubuna bağlı; ana kod nace_kod */
        ek_nace: Array<{ kod: string; tanim: string; urun_grubu: string; kaynak: string; guven: string | null }> | null;
        /** konu ölçeği notu — PUANA ETKİ ETMEZ */
        kapsam_notu: { tur: "dar" | "urun_ailesi" | "asiri_genis" | "kanit_yetersiz"; aciklama: string } | null;
      })[]
    >`
      select o.id, o.donem_id, o.gonderen_ref, o.baslik, o.koken, o.gerekce, o.ilce, o.kesif_id, o.kesif_kanit,
             o.kapsam, g.kapsam_notu,
             (select json_agg(json_build_object('kod', x.nace_kod, 'tanim', n2.tanim, 'urun_grubu', x.urun_grubu,
                                                'kaynak', x.kaynak, 'guven', x.guven) order by x.sira)
                from oneri_nace x join nace n2 on n2.kod = x.nace_kod where x.oneri_id = o.id) as ek_nace,
             (select string_agg(distinct y.yil::text, ', ' order by y.yil::text) from yatirim_konusu y
               where y.il_kod = i.kod and lower(trim(y.baslik)) = lower(trim(o.baslik))) as resmi_yillar,
             o.nace_kod, n.tanim as nace_tanim, o.nace_kaynagi, o.durum, o.ret_gerekcesi,
             o.deneme, o.son_hata, o.asama,
             -- ISO 8601: tarayıcının Date.parse'ı Postgres'in boşluklu biçimini güvenle okumaz.
             to_json(o.asama_zamani) #>> '{}' as asama_zamani,
             o.olusturuldu::text, o.onay_zamani::text, ki.ad_soyad as onaylayan,
             i.ad as il, i.kod as il_kod, d.yil,
             coalesce(g.dayanak, 0) as dayanak,
             g.gerekce as ai_gerekce,
             coalesce(g.duzeltilmis_puanlar, g.puanlar) as puanlar,
             (g.duzeltilmis_puanlar is not null) as duzeltildi,
             g.alintilar, g.kriter_dayanagi, g.karsi_gorus, g.model_snapshot, g.prompt_surum,
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
    sql<{ id: number; baslik: string; durum: OneriDurumu; il: string; il_kod: string; yil: string; dayanak: number;
      olusturuldu: string; asama: string | null; hatali: boolean }[]>`
      select o.id, o.baslik, o.durum, i.ad as il, i.kod as il_kod, d.yil,
             o.asama, (o.son_hata is not null) as hatali,
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

/**
 * Durum geçişi. Kural VERİTABANINDAKİ durumla, aynı transaction içinde ve satır
 * kilidiyle uygulanır. `beklenen` ekranın gördüğü durumdur: farklıysa ekran
 * eskimiştir ve daha yeni bir kararı ezmek yerine çakışma bildirilir.
 */
export async function durumDegistir(
  b: Baglam,
  oneriId: number,
  beklenen: OneriDurumu,
  yeni: OneriDurumu,
  gerekce: string,
): Promise<{ ok: true } | { ok: false; mesaj: string }> {
  const rol = b.rol;
  if (rol === "anonim") return { ok: false, mesaj: "Yetki yok." };
  return islem(b, async (sql) => {
    const [o] = await sql<{ durum: OneriDurumu }[]>`
      select durum from oneri where id = ${oneriId} for update
    `;
    if (!o) return { ok: false as const, mesaj: "Öneri bulunamadı." };
    if (o.durum !== beklenen) {
      return { ok: false as const, mesaj: "Öneri bu arada değişti; sayfayı yenileyip yeniden karar verin." };
    }
    const izin = gecisIzinli(o.durum, yeni, rol);
    if (!izin.izinli) return { ok: false as const, mesaj: izin.sebep };
    const r = await sql`
      update oneri set
        durum = ${yeni}::oneri_durumu,
        ret_gerekcesi = ${yeni === "reddedildi" ? gerekce : null},
        onaylayan_ref = ${yeni === "listede" ? b.gonderenRef : null},
        onay_zamani = ${yeni === "listede" ? sql`now()` : null},
        -- Kuyruğa dönen öneri sıfırdan başlar: eski deneme sayacı worker'ın
        -- onu almasını engellerdi (deneme < 3).
        ${yeni === "degerlendiriliyor" ? sql`deneme = 0, asama = null, son_hata = null,` : sql``}
        guncellendi = now()
      where id = ${oneriId} and durum = ${o.durum}::oneri_durumu
    `;
    if (!r.count) return { ok: false as const, mesaj: "Öneri güncellenemedi; yetki reddedildi." };
    await denetle(sql, b, `oneri_${yeni}`, "oneri", oneriId, { gerekce, onceki: o.durum });
    return { ok: true as const };
  });
}

/** Ajans düzeltmesi. AI'nin ham puanı korunur; düzeltme ayrı kolona yazılır. */
export async function puanDuzelt(
  b: Baglam,
  oneriId: number,
  puanlar: Record<Kriter, number>,
  gerekce: string,
): Promise<boolean> {
  return islem(b, async (sql) => {
    const [onceki] = await sql<{ puanlar: unknown; duzeltilmis_puanlar: unknown }[]>`
      select puanlar, duzeltilmis_puanlar from degerlendirme where oneri_id = ${oneriId}
    `;
    const r = await sql`
      update degerlendirme
      set duzeltilmis_puanlar = ${sql.json(puanlar as never)}, duzelten_ref = ${b.gonderenRef}
      where oneri_id = ${oneriId}
    `;
    // Etkilenen satır yoksa başarı denetimi de yazılmaz.
    if (!r.count) return false;
    await denetle(sql, b, "puan_duzeltildi", "oneri", oneriId, { gerekce, onceki, yeni: puanlar });
    return true;
  });
}

export async function naceDuzelt(b: Baglam, oneriId: number, naceKod: string): Promise<boolean> {
  return islem(b, async (sql) => {
    const r = await sql`
      update oneri set nace_kod = ${naceKod}, nace_kaynagi = 'ajans', guncellendi = now() where id = ${oneriId}
    `;
    if (!r.count) return false;
    await denetle(sql, b, "nace_duzeltildi", "oneri", oneriId, { naceKod });
    return true;
  });
}

// ── üst ölçekli belgeler ───────────────────────────────────────────────────

export type BelgeKaydi = {
  ad: string; tur: string; yil: string | null; kategori: string;
  ajans_kod: string | null; il_kod: string | null;
  /** kaç parçaya bölündü */
  parca: number;
  uzunluk: number; olusturuldu: string;
};

/**
 * Belgeleri BELGE bazında listeler, parça bazında değil.
 *
 * Bir plan belgesi 200'ü aşkın `belge` satırına bölünüyor (bkz. `belge-yukle`);
 * ekranda 502 satır göstermek yerine ada göre toplanır.
 */
export async function belgeleriListele(b: Baglam) {
  return islem(b, (sql) =>
    sql<BelgeKaydi[]>`
      select ad, min(tur::text) as tur, min(yil) as yil, min(kategori) as kategori,
             min(ajans_kod) as ajans_kod, min(il_kod) as il_kod,
             count(*)::int as parca,
             sum(char_length(metin))::int as uzunluk,
             max(olusturuldu)::text as olusturuldu
      from belge
      group by ad
      order by max(olusturuldu) desc
    `,
  );
}

/**
 * Web'den belge ekler — CLI (`belgeYukle`) ile AYNI parçalayıcıdan geçer.
 *
 * Tek satıra yazılan uzun metin paketi şişiriyor ve atıf çıpasını kaybediyordu;
 * aynı kaynak iki yoldan farklı davranıyordu. Aynı adla belge varsa eklenmez:
 * parçalar `ad` ile gruplanıyor ve iki kaynak sessizce birleşirdi.
 */
export async function belgeEkle(
  b: Baglam,
  g: { ad: string; tur: string; yil: string | null; ajansKod: string | null; ilKod: string | null; metin: string;
       kategori?: Kategori; kaynakOzet?: string; degistir?: boolean },
): Promise<{ ok: true; id: number; parca: number } | { ok: false; hata: string }> {
  const parcalar = parcala(g.metin);
  if (!parcalar.length) return { ok: false, hata: "Metinden parça çıkarılamadı." };
  return islem(b, async (sql) => {
    // Ada özgü kilit: iki eşzamanlı yükleme de "yok" görüp ekleyemesin. CLI aynı kilidi alır.
    await sql`select pg_advisory_xact_lock(hashtext(${"belge:" + g.ad}))`;
    const [mevcut] = await sql`select 1 from belge where ad = ${g.ad} limit 1`;
    if (mevcut && !g.degistir) return { ok: false as const, hata: `“${g.ad}” adıyla bir belge zaten var; önce silin.` };
    if (mevcut) await sql`delete from belge where ad = ${g.ad}`;
    const satirlar = await sql`
      insert into belge ${sql(
        parcalar.map((p) => ({
          ad: g.ad, bolum: p.bolum, tur: g.tur, yil: g.yil, ajans_kod: g.ajansKod, il_kod: g.ilKod,
          metin: p.metin, yukleyen_ref: b.gonderenRef,
          kategori: g.kategori ?? "genel", kaynak_ozet: g.kaynakOzet ?? null,
        })),
        "ad", "bolum", "tur", "yil", "ajans_kod", "il_kod", "metin", "yukleyen_ref", "kategori", "kaynak_ozet",
      )}
      returning id
    `;
    const id = Number(satirlar[0].id);
    await denetle(sql, b, "belge_eklendi", "belge", id, {
      ad: g.ad, uzunluk: g.metin.length, parca: satirlar.length, ajansKod: g.ajansKod, ilKod: g.ilKod,
    });
    return { ok: true as const, id, parca: satirlar.length };
  });
}

/** Belgeyi TÜM parçalarıyla siler — parça tek başına anlamsız. */
/**
 * Dış kaynaktan üretilen belge (Türk Patent, TÜİK…): içerik özeti aynıysa
 * DOKUNMAZ, değiştiyse yeniden yazar. Yeniden yazılan belgenin parçaları yeni
 * kimlik alır; kanıt taraması yalnızca onlar için yeniden koşar.
 */
export async function kaynakBelgesiYaz(
  b: Baglam,
  g: { ad: string; tur: string; yil: string | null; ajansKod: string | null; ilKod: string | null; metin: string; kategori: Kategori },
): Promise<"ayni" | "yazildi"> {
  const ozet = createHash("sha256").update(g.metin).digest("hex");
  const [m] = await islem(b, (sql) => sql<{ kaynak_ozet: string | null }[]>`select kaynak_ozet from belge where ad = ${g.ad} limit 1`);
  if (m?.kaynak_ozet === ozet) return "ayni";
  const r = await belgeEkle(b, { ...g, kaynakOzet: ozet, degistir: true });
  if (!r.ok) throw new Error(r.hata);
  return "yazildi";
}

export async function belgeSil(b: Baglam, ad: string): Promise<number> {
  return islem(b, async (sql) => {
    const silinen = await sql`delete from belge where ad = ${ad} returning id`;
    // Var olmayan belge için kayıt düşülmez: silme kaydı "geri yükleme" mezar taşıdır ve
    // henüz yüklenmemiş bir belgenin adını önceden kapatmak için kullanılamamalı.
    if (silinen.length) await denetle(sql, b, "belge_silindi", "belge", null, { ad, parca: silinen.length });
    return silinen.length;
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

// ── yönetici: kayıtlı kullanıcılar (KVKK sınırlı) ──────────────────────────

export type KayitliKullanici = {
  ref: string;
  rol: Rol;
  misafir: boolean;
  ajans_kod: string | null;
  ajans: string | null;
  /** MASKELİ e-posta — açmak ayrı ve denetlenen bir eylemdir */
  eposta_maske: string | null;
  ad_maske: string | null;
  pseudonimlestirildi: boolean;
  oneri: number;
  olusturuldu: string;
};

/**
 * Kayıtlı kullanıcı listesi — `kimlik` `gizli` sınıfta olduğu için RLS zaten
 * yalnızca yöneticiye satır verir; burada ayrıca rol kontrolü yapılmıyor,
 * fail-closed olan katman veritabanıdır.
 *
 * KİŞİSEL VERİ MASKELİ DÖNER. Yönetici bu veriye erişebilir (güvenlik §3) ama
 * KVKK'nın istediği şey "yetkili görebilir" değil, **veri minimizasyonu**:
 * listeyi okumak için e-postanın tamamına gerek yok. Açmak `kimlikAc()` ile
 * ve tek tek yapılır, denetime yazılır.
 *
 * Maskeleme SQL'de yapılıyor, bilerek: açık değer uygulama katmanına hiç
 * gelmezse log'a, hata izine veya bir React ağacına sızma yolu da kalmaz.
 */
export async function kayitliKullanicilar(b: Baglam) {
  return islem(b, (sql) =>
    sql<KayitliKullanici[]>`
      select g.ref, g.rol, g.misafir, g.ajans_kod, a.ad as ajans,
             case
               when k.eposta is null then null
               else left(k.eposta::text, 1) || '****' ||
                    substring(k.eposta::text from position('@' in k.eposta::text))
             end as eposta_maske,
             -- Bu şablonda ters bölü KULLANILAMAZ: postgres.js etiketli
             -- şablon kullanıyor, geçersiz bir kaçış cooked dizide undefined
             -- bırakıyor ve SQL sessizce bozuluyor (regexp_replace denendi,
             -- "syntax error at position 1" verdi). Maske için baş harf yeter;
             -- liste tarama için değil, KVKK talebini eşleştirmek için var.
             case
               when k.ad_soyad is null then null
               else left(k.ad_soyad, 1) || '***'
             end as ad_maske,
             coalesce(k.pseudonimlestirildi, false) as pseudonimlestirildi,
             (select count(*)::int from oneri o where o.gonderen_ref = g.ref) as oneri,
             g.olusturuldu::text
      from kimlik k
      join gonderen g on g.ref = k.gonderen_ref
      left join ajans a on a.kod = g.ajans_kod
      order by g.rol, k.eposta
    `,
  );
}

/**
 * Bir kimliğin AÇIK hâlini döndürür ve erişimi denetime yazar.
 *
 * "Kim ne zaman kimin verisini açtı" sorusunun cevabı buradan çıkar. Liste
 * okumak kişisel veri ifşası değildir (maskeli), tekil açmak ifşadır.
 */
export async function kimlikAc(b: Baglam, ref: string, gerekce: string) {
  return islem(b, async (sql) => {
    const [k] = await sql<{ eposta: string | null; ad_soyad: string | null }[]>`
      select eposta::text, ad_soyad from kimlik where gonderen_ref = ${ref}
    `;
    if (!k) return null;
    await denetle(sql, b, "kimlik_goruntulendi", "gonderen", ref, { gerekce });
    return k;
  });
}

/** KVKK silme talebi — kimliği siler, öneri zincirini korur. */
export async function kimlikSil(b: Baglam, ref: string): Promise<void> {
  await islem(b, async (sql) => {
    await sql`select kimlik_pseudonimlestir(${ref}::uuid)`;
  });
}

// ── toplu rapor ────────────────────────────────────────────────────────────

export type RaporSatiri = {
  id: number;
  il: string;
  il_kod: string;
  ajans_kod: string;
  ajans: string;
  yil: string;
  koken: Koken;
  baslik: string;
  gerekce: string;
  ilce: string | null;
  durum: OneriDurumu;
  nace_kod: string | null;
  nace_tanim: string | null;
  nace_kaynagi: string | null;
  /** yapay zekânın HAM puanı — değişmez */
  puanlar: Record<string, number> | null;
  /** ajans düzeltmesi; yoksa null */
  duzeltilmis_puanlar: Record<string, number> | null;
  duzeltildi: boolean;
  dayanak: number | null;
  ai_gerekce: string | null;
  alinti: number;
  model_snapshot: string | null;
  prompt_surum: string | null;
  misafir: boolean;
  olusturuldu: string;
  onay_zamani: string | null;
};

/**
 * Toplu öneri raporu — yönetici tüm iller, ajans YALNIZCA KENDİ BÖLGESİ.
 *
 * Kapsam SQL'de ve `gonderen.ajans_kod` üzerinden kuruluyor; uygulama katmanı
 * bir il listesi göndermiyor. Sebebi basit: kapsamı çağıran belirlerse,
 * çağırmayı unutan yer hepsini görür.
 *
 * FAIL-CLOSED: bölgesi atanmamış bir ajans kullanıcısı HİÇBİR satır görmez.
 * "Bölge bilinmiyorsa hepsini göster" sessiz bir yetki genişlemesi olurdu.
 *
 * RLS bunun üstünde ayrıca çalışır: yatırımcı bu fonksiyonu çağırsa kendi
 * önerilerinden fazlasını göremez. Kapsam kuralı RLS'in YERİNE değil,
 * ÜSTÜNE geliyor.
 */
export async function raporSatirlari(b: Baglam) {
  return islem(b, (sql) =>
    sql<RaporSatiri[]>`
      with yetki as (
        select app_rol()::text as rol,
               (select ajans_kod from gonderen where ref = app_ref()) as ajans
      )
      select o.id, i.ad as il, i.kod as il_kod, i.ajans_kod, a.ad as ajans, d.yil,
             o.koken, o.baslik, o.gerekce, o.ilce, o.durum,
             o.nace_kod, n.tanim as nace_tanim, o.nace_kaynagi::text,
             -- Ham AI puanı ve ajans düzeltmesi AYRI: "bu sayıyı kim koydu"
             -- dosyada da cevaplanır (brief §2).
             g.puanlar, g.duzeltilmis_puanlar,
             (g.duzeltilmis_puanlar is not null) as duzeltildi,
             g.dayanak, g.gerekce as ai_gerekce,
             coalesce(jsonb_array_length(g.alintilar), 0) as alinti,
             g.model_snapshot, g.prompt_surum,
             gn.misafir, o.olusturuldu::text, o.onay_zamani::text
      from oneri o
      join donem d on d.id = o.donem_id
      join il i on i.kod = d.il_kod
      join ajans a on a.kod = i.ajans_kod
      join gonderen gn on gn.ref = o.gonderen_ref
      left join degerlendirme g on g.oneri_id = o.id
      left join nace n on n.kod = o.nace_kod
      where (select rol from yetki) = 'yonetici'
         or i.ajans_kod = (select ajans from yetki)
      order by i.ajans_kod, i.ad, o.koken desc, o.id
    `,
  );
}

/** Rapordaki resmî liste sayfası — tebliğ künyesiyle, aynı kapsam kuralıyla. */
export async function raporResmiListe(b: Baglam) {
  return islem(b, (sql) =>
    sql<
      { il: string; ajans_kod: string; ajans: string; yil: number; sira: number;
        baslik: string; gerekce: string; kaynak: string }[]
    >`
      with yetki as (
        select app_rol()::text as rol,
               (select ajans_kod from gonderen where ref = app_ref()) as ajans
      )
      select i.ad as il, i.ajans_kod, a.ad as ajans, y.yil, y.sira,
             y.baslik, y.gerekce, y.kaynak
      from yatirim_konusu y
      join il i on i.kod = y.il_kod
      join ajans a on a.kod = i.ajans_kod
      where (select rol from yetki) = 'yonetici'
         or i.ajans_kod = (select ajans from yetki)
      order by i.ajans_kod, i.ad, y.yil desc, y.sira
    `,
  );
}

/**
 * Rol ve ajans bölgesi ataması — yalnızca yönetici.
 *
 * RLS zaten `gonderen_guncelle` politikasıyla yöneticiye izin veriyor; ayrı
 * bir `security definer` kapıya gerek yok.
 *
 * `ajans_kod` yalnızca ajans rolünde anlamlı: rol değişince temizleniyor,
 * yoksa yatırımcıya düşürülen bir hesapta eski bölge asılı kalırdı.
 */
export async function rolAta(b: Baglam, ref: string, rol: Rol, ajansKod: string | null): Promise<boolean> {
  return islem(b, async (sql) => {
    const [onceki] = await sql<{ rol: Rol; ajans_kod: string | null }[]>`
      select rol, ajans_kod from gonderen where ref = ${ref}
    `;
    if (!onceki) return false;
    const yaziliyor = await sql`
      update gonderen set rol = ${rol}::rol, ajans_kod = ${rol === "ajans" ? ajansKod : null}
      where ref = ${ref} returning ref
    `;
    if (!yaziliyor.length) return false;
    await denetle(sql, b, "rol_atandi", "gonderen", ref, {
      onceki: onceki.rol,
      yeni: rol,
      onceki_ajans: onceki.ajans_kod,
      yeni_ajans: rol === "ajans" ? ajansKod : null,
    });
    return true;
  });
}

// ── Aday keşfi ─────────────────────────────────────────────────────────────

export type KesifDurumu = {
  id: number; durum: "bekliyor" | "calisiyor" | "tamam" | "hata"; asama: string | null;
  toplam_parca: number; taranan_parca: number; kanit_sayisi: number; yerel_kanit: number;
  aday_sayisi: number; taranamayan: number; mesaj: string | null; model_snapshot: string | null; guncellendi: string;
  tarih: string;
  /** Alınmayan adaylar ve düşen ürün grupları, nedeniyle — denetim kaydından. */
  alinmayan: string[];
};

/** Dönemin en son keşif koşusu — ajans ekranında ilerleme ve sonuç. */
export async function sonKesif(b: Baglam, donemId: number): Promise<KesifDurumu | null> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return null;
  const [r] = await islem(b, (sql) =>
    sql<(Omit<KesifDurumu, "alinmayan"> & { kayit: { dusenler?: string[]; atlananlar?: string[]; tekrarlar?: { baslik: string; neden: string }[] } | null })[]>`
      select id, durum, asama, toplam_parca, taranan_parca, kanit_sayisi, yerel_kanit, aday_sayisi, taranamayan,
             mesaj, model_snapshot, guncellendi::text,
             to_char(olusturuldu at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as tarih,
             (select d.detay from denetim d
              where d.nesne_tip = 'kesif' and d.nesne_id = kesif.id::text and d.eylem = 'kesif_adaylari_yazildi'
              order by d.id desc limit 1) as kayit
      from kesif where donem_id = ${donemId} order by id desc limit 1
    `,
  );
  if (!r) return null;
  const { kayit, ...k } = r;
  return {
    ...k,
    id: Number(k.id),
    alinmayan: [
      ...(kayit?.dusenler ?? []),
      ...(kayit?.tekrarlar ?? []).map((t) => `“${t.baslik}” bu dönemde zaten önerilmiş bir konuyla aynı (${t.neden}); alınmadı.`),
      ...(kayit?.atlananlar ?? []).map((a) => `“${a}” bu dönemde zaten önerilmiş; alınmadı.`),
    ],
  };
}

export class KesifZatenAcik extends Error {}

/**
 * Keşif koşusu açar. Bölge kontrolü RLS'tedir (`kesif_ac`); burada yalnızca
 * "zaten sürüyor" durumu anlamlı bir mesaja çevrilir.
 */
export async function kesifAc(b: Baglam, donemIdleri: readonly number[]): Promise<number> {
  return islem(b, async (sql) => {
    let acilan = 0;
    for (const donemId of donemIdleri) {
      const r = await sql`
        insert into kesif (donem_id, tetikleyen_ref) values (${donemId}, ${b.gonderenRef})
        on conflict do nothing
      `;
      acilan += r.count;
      if (r.count) await denetle(sql, b, "kesif_acildi", "donem", donemId);
    }
    if (donemIdleri.length === 1 && !acilan) throw new KesifZatenAcik();
    return acilan;
  });
}

/**
 * Toplu başlatmada adayı HAZIR olan il atlanır: kuyrukta ya da listede en az
 * slot sayısı kadar keşif adayı olan dönem yeniden koşmaz. Durdurulan toplu
 * koşu yeniden başlatılınca yalnızca kalan iller çalışır; kuyruk topluca
 * silinirse bütün iller yeniden koşar. Tek il için elle başlatma bu süzgece
 * girmez — orada istek açıktır.
 */
export async function kesifGerekenDonemler(b: Baglam, donemIdleri: readonly number[]): Promise<number[]> {
  if (!donemIdleri.length) return [];
  const r = await islem(b, (sql) =>
    sql<{ id: string }[]>`
      select d.id from donem d
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      where d.id in ${sql(donemIdleri)}
        and (select count(*) from oneri o
             where o.donem_id = d.id and o.kesif_id is not null and o.koken = 'yeni'
               and o.durum in ('degerlendiriliyor', 'onay_bekliyor', 'listede')) < s.slot_sayisi
    `,
  );
  return r.map((x) => Number(x.id));
}

/**
 * Aday çıkmayan illeri kendiliğinden yeniden sıraya alır. İşleyici keşif
 * kuyruğu BOŞALINCA çağırır (toplu koşu bitti): son keşfi aday vermeden biten
 * (reddedilen çıktı, kanıt kuralına takılan adaylar, hata) dönem için yeni
 * koşu açılır — tetikleyen aynı kişidir, tarama önbellekten gelir.
 *
 * Sınırlar — sonsuz döngü ve boşa harcama olmasın:
 *  · dönem başına 24 saatte en çok `DENEME_SINIRI` koşu (ilk koşu dahil);
 *  · elle DURDURULAN koşu yeniden açılmaz;
 *  · yalnızca son 24 saatte koşmuş dönemler (eski sonuçlar diriltilmez).
 */
const KESIF_DENEME_SINIRI = 3;
export async function adaysizKesifleriYenidenAc(): Promise<number> {
  const servis: Baglam = { gonderenRef: null, rol: "yonetici" };
  const adaylar = await islem(servis, (sql) =>
    sql<{ donem_id: string; tetikleyen_ref: string; rol: Rol }[]>`
      select k.donem_id, k.tetikleyen_ref, g.rol
      from kesif k
      join gonderen g on g.ref = k.tetikleyen_ref
      where k.id = (select max(id) from kesif x where x.donem_id = k.donem_id)
        and k.durum in ('tamam', 'hata') and k.aday_sayisi = 0
        and coalesce(k.mesaj, '') not like 'Keşif durduruldu%'
        and k.olusturuldu > now() - interval '24 hours'
        and (select count(*) from kesif x where x.donem_id = k.donem_id and x.olusturuldu > now() - interval '24 hours') < ${KESIF_DENEME_SINIRI}
        and not exists (select 1 from kesif x where x.durum in ('bekliyor', 'calisiyor'))
    `,
  );
  let acilan = 0;
  for (const a of adaylar) {
    // Tetikleyenin KENDİ bağlamıyla: `kesif_ac` RLS'i bölge kapsamını yeniden sınar.
    acilan += await kesifAc({ gonderenRef: a.tetikleyen_ref, rol: a.rol }, [Number(a.donem_id)]).catch(() => 0);
  }
  return acilan;
}

/** Ajansın keşif açabileceği dönemler: yönetici 81 il, ajans kendi bölgesi. */
export async function kesifDonemleri(b: Baglam): Promise<number[]> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return [];
  const r = await islem(b, (sql) =>
    sql<{ id: string }[]>`
      select distinct on (d.il_kod) d.id from donem d
      where app_il_kapsaminda(d.il_kod)
      order by d.il_kod, d.yil desc
    `,
  );
  return r.map((x) => Number(x.id));
}

/**
 * Resmî listedeki konuları belgelere göre yeniden değerlendirmeye sokar.
 *
 * Mevcut konular tebliğden türer ve hiç puanlanmamıştır: dayanakları 0,
 * sıralamada "dayanaksız". Bir konuyu "korunuyor" saymak için o da yeni
 * öneriyle AYNI hattan geçmeli: başlığı ve tebliğ gerekçesi OLDUĞU GİBİ
 * kalır, puan ve dayanak belgelerden gelir, devamlılık payı ilan edilmiş
 * parametre olarak eklenir, ajans yeniden onaylar. Yalnızca hiç
 * değerlendirilmemiş olanlar: onaylanmış bir değerlendirme ezilmez.
 */
export async function resmiKonulariDegerlendir(b: Baglam, donemId: number): Promise<number> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return 0;
  const idler = await islem(b, (sql) =>
    sql<{ id: string }[]>`
      select o.id from oneri o
      where o.donem_id = ${donemId} and o.koken = 'mevcut' and o.durum = 'listede'
        and not exists (select 1 from degerlendirme g where g.oneri_id = o.id)
      order by o.id
    `,
  );
  let n = 0;
  for (const { id } of idler) {
    const r = await durumDegistir(b, Number(id), "listede", "degerlendiriliyor", "Resmî konu belgelere göre yeniden değerlendirmeye alındı.");
    if (r.ok) n++;
  }
  return n;
}

// ── İl ekranı: dönemin bütün önerileri ─────────────────────────────────────

export type IlOnerisi = {
  id: number;
  baslik: string;
  koken: Koken;
  durum: OneriDurumu;
  /** belgelerden keşif adayı mı */
  kesif: boolean;
  /** değerlendirme varsa; yoksa null — 0 yazılmaz */
  dayanak: number | null;
  taban: number | null;
  asama: string | null;
  hatali: boolean;
  ret_gerekcesi: string | null;
  gonderildi: string;
  /** başlık bu ilin resmî listesinde birebir geçtiği yıllar */
  resmi_yillar: string | null;
};

/**
 * Bir dönemin BÜTÜN önerileri — il ekranı onları karar durumuna göre
 * kategorilere ayırır. Yalnızca ajans ve yönetici: satırlar başkalarının
 * önerileridir. Kapsam tek dönem = tek il; başka ilin önerisi gelmez.
 */
export async function ilOnerileri(b: Baglam, d: DonemKaydi): Promise<IlOnerisi[]> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return [];
  const r = await islem(b, (sql) =>
    sql<IlOnerisi[]>`
      select o.id, o.baslik, o.koken, o.durum, (o.kesif_id is not null) as kesif,
             g.dayanak,
             case when g.oneri_id is null then null
                  else oneri_taban_puani(o.id, ${sql.json(d.set.agirliklar as never)}) end as taban,
             o.asama, (o.son_hata is not null) as hatali, o.ret_gerekcesi,
             to_char(o.olusturuldu at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') as gonderildi,
             (select string_agg(distinct y.yil::text, ', ' order by y.yil::text) from yatirim_konusu y
               where y.il_kod = ${d.ilKod} and lower(trim(y.baslik)) = lower(trim(o.baslik))) as resmi_yillar
      from oneri o
      left join degerlendirme g on g.oneri_id = o.id
      where o.donem_id = ${d.donemId}
      order by o.olusturuldu, o.id
    `,
  );
  return r.map((x) => ({ ...x, id: Number(x.id) }));
}

// ── Nihai liste (Excel/Word) ───────────────────────────────────────────────

export type NihaiDetay = {
  id: number; gerekce: string; ilce: string | null; nace_kod: string | null; nace_tanim: string | null;
  ai_gerekce: string | null; kesif: boolean; resmi_yillar: string | null;
  onay_tarihi: string | null; model_snapshot: string | null;
  /** "27.11 · Elektrik motorları" biçiminde, ürün grubuyla */
  ek_nace: string | null;
  /** ürün grupları, "; " ile */
  kapsam: string | null;
};

export type NihaiIl = {
  il: string; ilKod: string; ajans: string; ajansKod: string;
  donem: DonemKaydi | null;
  adaylar: Aday[];
  detay: Map<string, NihaiDetay>;
  /** listeye henüz girmemiş öneriler — dosya bunu SÖYLER, gizlemez */
  bekleyen: number;
};

/**
 * Nihai liste verisi — il, bölge ya da tümü.
 *
 * Kapsam VERİTABANINDA: `app_il_kapsaminda` — yönetici 81 il, ajans yalnızca
 * kendi bölgesi; bölgesi atanmamış ajans hiçbir il görmez (fail-closed,
 * toplu raporla aynı kural). Yalnızca ONAYLANMIŞ öneriler sıralamaya girer;
 * onay bekleyenlerin sayısı ayrıca döner.
 */
export async function nihaiListeVerisi(b: Baglam, suzgec: { il?: string; bolge?: string }): Promise<NihaiIl[]> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return [];
  const iller = await islem(b, (sql) =>
    sql<{ kod: string; ad: string; ajans_kod: string; ajans: string }[]>`
      select i.kod, i.ad, i.ajans_kod, a.ad as ajans
      from il i join ajans a on a.kod = i.ajans_kod
      where app_il_kapsaminda(i.kod)
        ${suzgec.il ? sql`and i.kod = ${suzgec.il}` : sql``}
        ${suzgec.bolge ? sql`and i.ajans_kod = ${suzgec.bolge}` : sql``}
      order by a.ad, i.ad
    `,
  );

  const sonuc: NihaiIl[] = [];
  // ponytail: il başına birkaç sorgu, 8'li gruplar hâlinde. 81 il için birkaç
  // saniye; indirme ucu için yeterli. Yavaşlarsa tek toplu sorguya çevrilir.
  for (let i = 0; i < iller.length; i += 8) {
    const parca = await Promise.all(
      iller.slice(i, i + 8).map(async (x): Promise<NihaiIl> => {
        const donem = await donemGetir(b, x.kod);
        if (!donem) return { il: x.ad, ilKod: x.kod, ajans: x.ajans, ajansKod: x.ajans_kod, donem: null, adaylar: [], detay: new Map(), bekleyen: 0 };
        const adaylar = await adaylariGetir(b, donem);
        const [detaylar, [{ n }]] = await Promise.all([
          adaylar.length
            ? islem(b, (sql) =>
                sql<NihaiDetay[]>`
                  select o.id, o.gerekce, o.ilce, o.nace_kod, n.tanim as nace_tanim, g.gerekce as ai_gerekce,
                         (o.kesif_id is not null) as kesif,
                         (select string_agg(distinct y.yil::text, ', ' order by y.yil::text) from yatirim_konusu y
                           where y.il_kod = ${x.kod} and lower(trim(y.baslik)) = lower(trim(o.baslik))) as resmi_yillar,
                         to_char(o.onay_zamani at time zone 'Europe/Istanbul', 'DD.MM.YYYY') as onay_tarihi,
                         g.model_snapshot,
                         (select string_agg(x.nace_kod || ' (' || x.urun_grubu || ')', '; ' order by x.sira)
                            from oneri_nace x where x.oneri_id = o.id) as ek_nace,
                         (select string_agg(e->>'ad', '; ') from jsonb_array_elements(o.kapsam) e) as kapsam
                  from oneri o
                  left join degerlendirme g on g.oneri_id = o.id
                  left join nace n on n.kod = o.nace_kod
                  where o.id in ${sql(adaylar.map((a) => Number(a.id)))}
                `,
              )
            : Promise.resolve([] as NihaiDetay[]),
          islem(b, (sql) =>
            sql<{ n: string }[]>`
              select count(*) as n from oneri
              where donem_id = ${donem.donemId} and durum in ('degerlendiriliyor', 'onay_bekliyor')
            `,
          ),
        ]);
        return {
          il: x.ad, ilKod: x.kod, ajans: x.ajans, ajansKod: x.ajans_kod, donem, adaylar,
          detay: new Map(detaylar.map((d) => [String(d.id), { ...d, id: Number(d.id) }])),
          bekleyen: Number(n),
        };
      }),
    );
    sonuc.push(...parca);
  }
  return sonuc;
}

/**
 * Alıntıların parça metinleri — kesin madde için. Anahtar `ad|bolum`:
 * değerlendirme, karşı görüş ve keşif kayıtlarının üçü de belge adı ile
 * çıpayı taşıyor. Belgeler kamuya açık; RLS herkese okutur.
 */
export async function parcaMetinleri(b: Baglam, cipalar: ReadonlyArray<{ ad: string; bolum: string | null }>): Promise<Map<string, string>> {
  const tekil = [...new Map(cipalar.filter((c) => c.bolum?.startsWith("madde")).map((c) => [`${c.ad}|${c.bolum}`, c])).values()];
  if (!tekil.length) return new Map();
  const r = await islem(b, (sql) =>
    sql<{ ad: string; bolum: string; metin: string }[]>`
      select ad, bolum, metin from belge
      where (ad, bolum) in ${sql(tekil.map((c) => [c.ad, c.bolum!]) as never)}
    `,
  );
  return new Map(r.map((x) => [`${x.ad}|${x.bolum}`, x.metin]));
}

// ── Yönetici: kuyruktaki öneriyi sil / güncelle ────────────────────────────

const KUYRUK_DURUMLARI = ["degerlendiriliyor", "onay_bekliyor"] as const;

/**
 * Kuyruktaki öneriyi KALICI olarak siler — yalnızca yönetici, gerekçeyle.
 *
 * Silmeden önce kaydın tam görüntüsü (öneri + değerlendirme + ek NACE)
 * değiştirilemez `denetim`e yazılır; ikisi aynı transaction'da. Kişisel veri
 * görüntüye girmez: öneri kimliğe değil `gonderen_ref`e bağlı. RLS
 * (`oneri_sil`) ikinci katman: yönetici olmayan ya da kuyruk dışı öneri
 * için silme 0 satır etkiler.
 */
export async function oneriSil(b: Baglam, id: number, gerekce: string): Promise<{ ok: true } | { ok: false; mesaj: string }> {
  if (b.rol !== "yonetici") return { ok: false, mesaj: "Öneriyi yalnızca yönetici silebilir." };
  if (gerekce.trim().length < 10) return { ok: false, mesaj: "Silme gerekçesi en az 10 karakter olmalı." };
  return islem(b, async (sql) => {
    const [kayit] = await sql<Record<string, unknown>[]>`
      select to_jsonb(o) - 'arama' as oneri, to_jsonb(g) as degerlendirme,
             (select jsonb_agg(to_jsonb(x)) from oneri_nace x where x.oneri_id = o.id) as ek_nace
      from oneri o left join degerlendirme g on g.oneri_id = o.id
      where o.id = ${id} and o.durum in ${sql(KUYRUK_DURUMLARI)}
      for update of o
    `;
    if (!kayit) return { ok: false as const, mesaj: "Öneri bulunamadı ya da kuyrukta değil; sayfayı yenileyin." };
    await denetle(sql, b, "oneri_silindi", "oneri", id, { gerekce: gerekce.trim(), kayit });
    const r = await sql`delete from oneri where id = ${id}`;
    if (!r.count) throw new Error("Öneri silinemedi; yetki reddedildi.");
    return { ok: true as const };
  });
}

/**
 * Kuyruktaki KEŞİF ADAYLARINI topluca siler — yalnızca yönetici, gerekçeyle.
 * Keşfi yeni kaynaklarla sıfırdan koşturmadan önce kuyruğu boşaltmak için.
 *
 * Kapsam dardır ve SQL'de kurulur: yalnızca keşfin ürettiği (`kesif_id`),
 * `koken = 'yeni'`, kuyruktaki (değerlendiriliyor / onay bekliyor) öneriler.
 * Yatırımcının ya da ajansın elle girdiği öneri, onaylanmış ya da reddedilmiş
 * öneri ve resmî listeden türeyen konu SİLİNMEZ. Her kaydın tam görüntüsü tek
 * tek denetime yazılır (`oneri_silindi`), tekil silmeyle aynı biçimde.
 */
export async function kesifAdaylariniSil(
  b: Baglam, kapsam: { ajansKod?: string | null; ilKod?: string | null }, gerekce: string,
): Promise<{ ok: true; silinen: number } | { ok: false; mesaj: string }> {
  if (b.rol !== "yonetici") return { ok: false, mesaj: "Toplu silmeyi yalnızca yönetici yapabilir." };
  if (gerekce.trim().length < 10) return { ok: false, mesaj: "Silme gerekçesi en az 10 karakter olmalı." };
  return islem(b, async (sql) => {
    const kayitlar = await sql<{ id: string; kayit: Record<string, unknown> }[]>`
      select o.id, jsonb_build_object('oneri', to_jsonb(o) - 'arama', 'degerlendirme', to_jsonb(g),
               'ek_nace', (select jsonb_agg(to_jsonb(x)) from oneri_nace x where x.oneri_id = o.id)) as kayit
      from oneri o
      join donem dn on dn.id = o.donem_id
      join il i on i.kod = dn.il_kod
      left join degerlendirme g on g.oneri_id = o.id
      where o.kesif_id is not null and o.koken = 'yeni' and o.durum in ${sql(KUYRUK_DURUMLARI)}
        ${kapsam.ilKod ? sql`and i.kod = ${kapsam.ilKod}` : sql``}
        ${kapsam.ajansKod ? sql`and i.ajans_kod = ${kapsam.ajansKod}` : sql``}
      for update of o
    `;
    for (const k of kayitlar) {
      await denetle(sql, b, "oneri_silindi", "oneri", Number(k.id), { gerekce: gerekce.trim(), toplu: true, kayit: k.kayit });
    }
    if (kayitlar.length) {
      const r = await sql`delete from oneri where id in ${sql(kayitlar.map((k) => k.id))}`;
      if (r.count !== kayitlar.length) throw new Error("Toplu silme tamamlanamadı; hiçbir kayıt silinmedi.");
    }
    return { ok: true as const, silinen: kayitlar.length };
  });
}

export type OneriDuzeltme = { baslik: string; gerekce: string; ilce: string | null; kapsam: string[] };

/**
 * Kuyruktaki önerinin metnini düzeltir — yalnızca yönetici, gerekçeyle.
 *
 * Metin değişince eski AI puanı artık bu metne ait değildir: önceki
 * değerlendirme denetime yazılıp silinir, AI'nin atadığı ek NACE kodları
 * temizlenir ve öneri `degerlendiriliyor`a döner (deneme sıfırlanır).
 * Önceki ve yeni metin denetimde yan yana durur.
 */
export async function oneriGuncelle(b: Baglam, id: number, yeni: OneriDuzeltme, neden: string): Promise<{ ok: true } | { ok: false; mesaj: string }> {
  if (b.rol !== "yonetici") return { ok: false, mesaj: "Öneriyi yalnızca yönetici düzeltebilir." };
  if (neden.trim().length < 10) return { ok: false, mesaj: "Düzeltme gerekçesi en az 10 karakter olmalı." };
  if (yeni.baslik.trim().length < 8) return { ok: false, mesaj: "Başlık en az 8 karakter olmalı." };
  if (yeni.gerekce.trim().length < 40) return { ok: false, mesaj: "“Neden burada?” gerekçesi en az 40 karakter olmalı." };
  return islem(b, async (sql) => {
    const [onceki] = await sql<{ baslik: string; gerekce: string; ilce: string | null; kapsam: unknown; durum: string }[]>`
      select baslik, gerekce, ilce, kapsam, durum::text from oneri
      where id = ${id} and durum in ${sql(KUYRUK_DURUMLARI)} for update
    `;
    if (!onceki) return { ok: false as const, mesaj: "Öneri bulunamadı ya da kuyrukta değil; sayfayı yenileyin." };
    const [eskiDeg] = await sql<Record<string, unknown>[]>`delete from degerlendirme where oneri_id = ${id} returning *`;
    await sql`delete from oneri_nace where oneri_id = ${id} and kaynak = 'ai'`;
    const kapsam = yeni.kapsam.length ? sql.json(yeni.kapsam.map((ad) => ({ ad, kanit_id: [] })) as never) : null;
    await sql`
      update oneri set baslik = ${yeni.baslik.trim()}, gerekce = ${yeni.gerekce.trim()}, ilce = ${yeni.ilce},
        kapsam = ${kapsam}, durum = 'degerlendiriliyor', deneme = 0, asama = null, son_hata = null,
        guncellendi = now()
      where id = ${id}
    `;
    await denetle(sql, b, "oneri_duzeltildi", "oneri", id, {
      neden: neden.trim(),
      onceki: { baslik: onceki.baslik, gerekce: onceki.gerekce, ilce: onceki.ilce, kapsam: onceki.kapsam, durum: onceki.durum },
      yeni,
      eskiDegerlendirme: eskiDeg ?? null,
      not: "Metin değişti; eski AI puanı bu metne ait değil, yeniden değerlendirilecek.",
    });
    return { ok: true as const };
  });
}

/** Kapsamdaki sürmekte olan keşiflerin özeti — toplu keşif ilerlemesi. Aktif koşu yoksa null. */
export type TopluKesifDurumu = {
  bekleyen: number;
  biten: number;
  aday: number;
  calisan: Array<{ il: string; asama: string | null; taranan: number; toplam: number }>;
};

export async function topluKesifDurumu(b: Baglam): Promise<TopluKesifDurumu | null> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return null;
  const r = await islem(b, (sql) =>
    sql<{ il: string; durum: string; asama: string | null; taranan_parca: number; toplam_parca: number; aday_sayisi: number }[]>`
      with kapsam as (
        select k.*, i.ad as il from kesif k
        join donem d on d.id = k.donem_id join il i on i.kod = d.il_kod
        where app_il_kapsaminda(d.il_kod)
      )
      -- Aynı toplu başlatmanın bitenleri: aktif koşuların en eskisinden beri açılanlar.
      select il, durum, asama, taranan_parca, toplam_parca, aday_sayisi from kapsam
      where olusturuldu >= (select min(olusturuldu) from kapsam where durum in ('bekliyor', 'calisiyor'))
      order by id
    `,
  );
  const aktif = r.filter((x) => x.durum === "bekliyor" || x.durum === "calisiyor");
  if (!aktif.length) return null;
  return {
    bekleyen: aktif.filter((x) => x.durum === "bekliyor").length,
    biten: r.length - aktif.length,
    aday: r.reduce((t, x) => t + x.aday_sayisi, 0),
    calisan: aktif.filter((x) => x.durum === "calisiyor").map((x) => ({ il: x.il, asama: x.asama, taranan: x.taranan_parca, toplam: x.toplam_parca })),
  };
}

/**
 * Sıradaki ve süren keşifleri durdurur (kapsam: `app_il_kapsaminda`; `ilKod`
 * verilirse yalnızca o il). Süren koşu bir sonraki ilerleme adımında kendini
 * keser (`kesifYap`). Taranmış parçalar önbellekte kalır.
 */
export async function kesifDurdur(b: Baglam, ilKod?: string): Promise<number> {
  if (b.rol === "anonim" || !onaylayabilir(b.rol)) return 0;
  const idler = (
    await islem(b, (sql) =>
      sql<{ id: string }[]>`
        select k.id from kesif k join donem d on d.id = k.donem_id
        where k.durum in ('bekliyor', 'calisiyor') and app_il_kapsaminda(d.il_kod)
          ${ilKod ? sql`and d.il_kod = ${ilKod}` : sql``}
      `,
    )
  ).map((x) => Number(x.id));
  if (!idler.length) return 0;
  // Güncelleme politikası yalnızca yönetici: kapsam yukarıda kullanıcının bağlamında süzüldü.
  const r = await islem({ gonderenRef: null, rol: "yonetici" }, (sql) => sql`
    update kesif set durum = 'hata', asama = null, guncellendi = now(),
      mesaj = 'Keşif durduruldu. Taranmış parçalar saklandı; yeniden başlatınca kalanından devam eder.'
    where id in ${sql(idler)} and durum in ('bekliyor', 'calisiyor')
  `);
  await islem(b, (sql) => denetle(sql, b, "kesif_durduruldu", "kesif", null, { adet: r.count, il: ilKod ?? null }));
  return r.count;
}

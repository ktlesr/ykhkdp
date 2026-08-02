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
    sql<{ il: string; il_kod: string; ajans_kod: string; il_belgesi: number; ajans_belgesi: number; ulusal: number }[]>`
      select i.ad as il, i.kod as il_kod, i.ajans_kod,
             count(distinct b.ad) filter (where b.il_kod = i.kod)::int as il_belgesi,
             count(distinct b.ad) filter (where b.il_kod is null and b.ajans_kod = i.ajans_kod)::int as ajans_belgesi,
             count(distinct b.ad) filter (where b.il_kod is null and b.ajans_kod is null)::int as ulusal
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
      })[]
    >`
      select o.id, o.donem_id, o.gonderen_ref, o.baslik, o.koken, o.gerekce, o.ilce,
             o.nace_kod, n.tanim as nace_tanim, o.nace_kaynagi, o.durum, o.ret_gerekcesi,
             o.deneme, o.son_hata,
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
  ad: string; tur: string; yil: string | null;
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
      select ad, min(tur::text) as tur, min(yil) as yil,
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

/** Belgeyi TÜM parçalarıyla siler — parça tek başına anlamsız. */
export async function belgeSil(b: Baglam, ad: string): Promise<number> {
  return islem(b, async (sql) => {
    const silinen = await sql`delete from belge where ad = ${ad} returning id`;
    await denetle(sql, b, "belge_silindi", "belge", null, { ad, parca: silinen.length });
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
  puanlar: Record<string, number> | null;
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
             coalesce(g.duzeltilmis_puanlar, g.puanlar) as puanlar,
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

import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { ANONIM, islem, kapat, sahip, type Baglam } from "./baglanti.ts";
import { asagi, sifirla, yukari } from "./migrate.ts";
import { DEMO_PAROLA, seed } from "./seed.ts";
import {
  baglamdan,
  belgeKapsami,
  BENZERLIK_ESIGI,
  girisYap,
  misafirAc,
  naceAra,
  oneriOlustur,
  kayitliKullanicilar,
  kimlikAc,
  kimlikSil,
  naceGetir,
  oturumCoz,
  raporResmiListe,
  raporSatirlari,
  rolAta,
  yakinKopyalar,
} from "./sorgu.ts";

/** Gerçek Postgres'e bağlanır; RLS'in gerçekten uygulandığını kanıtlar. */

let ajans: Baglam;
let yatirimci: Baglam;

async function girisBaglami(eposta: string): Promise<Baglam> {
  const r = await girisYap(eposta, DEMO_PAROLA);
  assert.equal(r.ok, true, `giriş başarısız: ${eposta}`);
  const k = await oturumCoz(r.ok ? r.jeton : "");
  assert.ok(k);
  return baglamdan(k);
}

before(async () => {
  await sifirla({ test: true });
  await yukari();
  await seed();
  ajans = await girisBaglami("ajans@ykh.local");
  yatirimci = await girisBaglami("yatirimci@ykh.local");
});

after(async () => {
  await kapat();
});

// ── NACE ───────────────────────────────────────────────────────────────────

test("NACE Rev.2.1 yüklendi ve hiyerarşi bağlandı", async () => {
  const [{ n }] = await islem(ANONIM, (sql) => sql<{ n: string }[]>`select count(*) as n from nace`);
  assert.equal(Number(n), 3190);

  const [duzeyler] = await islem(ANONIM, (sql) =>
    sql<{ kisim: string; bolum: string; sinif: string; faaliyet: string }[]>`
      select
        count(*) filter (where duzey = 'kisim') as kisim,
        count(*) filter (where duzey = 'bolum') as bolum,
        count(*) filter (where duzey = 'sinif') as sinif,
        count(*) filter (where duzey = 'faaliyet') as faaliyet
      from nace
    `,
  );
  assert.equal(Number(duzeyler.kisim), 23);
  assert.equal(Number(duzeyler.sinif), 651);

  // 13.10.03 → 13.10 → 13.1 → 13
  const [f] = await islem(ANONIM, (sql) =>
    sql<{ ust_kod: string }[]>`select ust_kod from nace where kod = '13.10.03'`,
  );
  assert.equal(f.ust_kod, "13.10");
});

test("NACE araması kodla ve tanımla çalışır, yalnızca seçilebilir düzeyler", async () => {
  const kod = await naceAra(ANONIM, "13.10");
  assert.equal(kod[0]?.kod, "13.10");

  const tanim = await naceAra(ANONIM, "elyaf");
  assert.ok(tanim.length > 0);
  assert.ok(tanim.every((x) => x.duzey === "sinif" || x.duzey === "faaliyet"));

  assert.equal((await naceAra(ANONIM, "a")).length, 0, "tek harf arama yapmaz");
  assert.equal((await naceGetir(ANONIM, "13.10"))?.tanim.includes("elyaf"), true);
});

// ── RLS ────────────────────────────────────────────────────────────────────

test("anonim kişisel veri göremez", async () => {
  assert.equal((await islem(ANONIM, (sql) => sql`select * from kimlik`)).length, 0);
  assert.equal((await islem(ANONIM, (sql) => sql`select * from denetim`)).length, 0);
});

test("yatırımcı yalnızca kendi kimliğini görür", async () => {
  const kendi = await islem(yatirimci, (sql) => sql`select gonderen_ref from kimlik`);
  assert.equal(kendi.length, 1);
});

test("yatırımcı belge yükleyemez, ajans yükler", async () => {
  const metin = "Deneme belge metni. ".repeat(20);
  await assert.rejects(
    () =>
      islem(yatirimci, (sql) =>
        sql`insert into belge (ad, tur, metin) values ('Yetkisiz', 'diger', ${metin})`,
      ),
    /row-level security|new row violates/i,
  );
  await islem(ajans, (sql) => sql`insert into belge (ad, tur, metin) values ('Yetkili', 'diger', ${metin})`);
});

test("yatırımcı değerlendirme yazamaz", async () => {
  await assert.rejects(
    () =>
      islem(yatirimci, (sql) =>
        sql`insert into degerlendirme (oneri_id, puanlar, model_snapshot, prompt_surum)
            values (1, '{}'::jsonb, 'x', 'y')`,
      ),
    /row-level security|new row violates/i,
  );
});

test("onaylanmamış öneri anonime kapalı, sahibine açık", async () => {
  const anonimGoruyor = await islem(ANONIM, (sql) => sql`select id from oneri where durum <> 'listede'`);
  assert.equal(anonimGoruyor.length, 0);

  const sahibiGoruyor = await islem(yatirimci, (sql) =>
    sql`select id from oneri where durum <> 'listede' and gonderen_ref = ${yatirimci.gonderenRef}`,
  );
  assert.ok(sahibiGoruyor.length > 0);
});

test("denetim append-only — iki katman", async () => {
  await islem(ajans, (sql) =>
    sql`insert into denetim (eylem, nesne_tip, nesne_id) values ('test', 'test', '1')`,
  );
  // 1. katman: update/delete politikası yok → 0 satır
  assert.equal(
    (await islem(ajans, (sql) => sql`update denetim set eylem = 'sahte' where id = (select min(id) from denetim) returning id`)).length,
    0,
  );
  // 2. katman: RLS baypas edilse bile trigger reddeder
  await assert.rejects(
    () => sahip()`update denetim set eylem = 'sahte' where id = (select min(id) from denetim)`,
    /append-only/i,
  );
  await assert.rejects(
    () => sahip()`delete from denetim where id = (select min(id) from denetim)`,
    /append-only/i,
  );
});

// ── veritabanı iş kuralları ────────────────────────────────────────────────

test("NACE varsa kaynağı zorunlu — kim atadı kaybolmaz", async () => {
  await assert.rejects(
    () =>
      sahip()`
        insert into oneri (donem_id, gonderen_ref, baslik, nace_kod)
        values (1, (select ref from gonderen limit 1), 'Kaynaksız NACE denemesi', '13.10')
      `,
    /oneri_nace_kaynagi/,
  );
});

test("listede olan öneri onaylayan izi taşımak zorunda", async () => {
  await assert.rejects(
    () =>
      sahip()`
        insert into oneri (donem_id, gonderen_ref, baslik, durum)
        values (1, (select ref from gonderen limit 1), 'İzsiz onay denemesi', 'listede')
      `,
    /oneri_onay_izi/,
  );
});

test("ret gerekçesiz reddedilemez", async () => {
  await assert.rejects(
    () =>
      sahip()`
        insert into oneri (donem_id, gonderen_ref, baslik, durum)
        values (1, (select ref from gonderen limit 1), 'Gerekçesiz ret denemesi', 'reddedildi')
      `,
    /oneri_ret_gerekcesi/,
  );
});

test("model snapshot 'latest' olamaz", async () => {
  await assert.rejects(
    () =>
      sahip()`
        insert into degerlendirme (oneri_id, puanlar, model_snapshot, prompt_surum)
        values ((select id from oneri limit 1), '{}'::jsonb, 'latest', 'v1')
      `,
    /snapshot_pinli/,
  );
});

test("etkin puan düzeltmeyi tercih eder", async () => {
  const [o] = await sahip()<{ id: number }[]>`
    select oneri_id as id from degerlendirme where duzeltilmis_puanlar is null limit 1
  `;
  // Fonksiyon `security definer` ama görünürlük kontrolü İÇİNDE: çağrının
  // bağlamı önemli. Ajans bağlamıyla okunuyor — gerçek çağıran o.
  const taban = async (b: Baglam) => {
    const [r] = await islem(b, (sql) =>
      sql<{ taban: number }[]>`
        select oneri_taban_puani(${o.id}, (select agirliklar from agirlik_seti limit 1)) as taban
      `,
    );
    return r.taban;
  };

  const once = await taban(ajans);
  await sahip()`
    update degerlendirme
    set duzeltilmis_puanlar = (select jsonb_object_agg(k, 100) from unnest(enum_range(null::kriter)) k),
        duzelten_ref = (select ref from gonderen where rol = 'ajans' limit 1)
    where oneri_id = ${o.id}
  `;
  const sonra = await taban(ajans);
  assert.equal(sonra, 100);
  assert.notEqual(sonra, once);
});

test("taban puanı görmediğin öneri için 0 döner — security definer kapısı", async () => {
  // `oneri_taban_puani` RLS'i aşar. Öneriler kamuya açıkken zararsızdı; öneri
  // gizliliği açıldıktan sonra aynı fonksiyon "id dene, başkasının puanını oku"
  // kapısına dönüşürdü. Kontrol fonksiyonun içine alındı; bu test onu tutar.
  const [o] = await sahip()<{ id: number }[]>`
    select d.oneri_id as id from degerlendirme d
    join oneri o on o.id = d.oneri_id
    where o.koken = 'yeni' limit 1
  `;
  const taban = async (b: Baglam) => {
    const [r] = await islem(b, (sql) =>
      sql<{ taban: number }[]>`
        select oneri_taban_puani(${o.id}, (select agirliklar from agirlik_seti limit 1)) as taban
      `,
    );
    return r.taban;
  };

  assert.ok((await taban(ajans)) > 0, "ajans görür");
  assert.equal(await taban(ANONIM), 0, "anonim başkasının puanını okuyamaz");
});

test("KVKK: kimlik pseudonimleşir, öneri zinciri korunur", async () => {
  const [g] = await sahip()<{ ref: string }[]>`
    select o.gonderen_ref as ref from oneri o join kimlik k on k.gonderen_ref = o.gonderen_ref
    where k.eposta is not null limit 1
  `;
  const [{ n: once }] = await sahip()<{ n: string }[]>`
    select count(*) as n from oneri where gonderen_ref = ${g.ref}
  `;
  // B14: yönetici dışındaki her bağlam reddedilir — fonksiyon security definer.
  for (const rol of ["anonim", "yatirimci", "ajans"]) {
    await assert.rejects(
      islem({ gonderenRef: null, rol: rol as never }, (sql) => sql`select kimlik_pseudonimlestir(${g.ref})`),
      /yalnızca yönetici/,
      `${rol} kimlik silememeli`,
    );
  }
  await islem({ gonderenRef: null, rol: "yonetici" }, (sql) => sql`select kimlik_pseudonimlestir(${g.ref})`);

  const [k] = await sahip()<{ eposta: string | null; pseudonimlestirildi: boolean }[]>`
    select eposta, pseudonimlestirildi from kimlik where gonderen_ref = ${g.ref}
  `;
  assert.equal(k.eposta, null);
  assert.equal(k.pseudonimlestirildi, true);

  const [{ n: sonra }] = await sahip()<{ n: string }[]>`
    select count(*) as n from oneri where gonderen_ref = ${g.ref}
  `;
  assert.equal(sonra, once, "öneriler korunmalı");
});

// ── migration geri alma ────────────────────────────────────────────────────

test("migration geri alınabilir ve yeniden uygulanabilir", async () => {
  const geri = await asagi(22);
  assert.deepEqual(geri, [
    "0022_belge_kategori", "0021_oneri_silme", "0020_kapsam_coklu_nace", "0019_model_ayari", "0018_tarama_reddi", "0017_aday_kesfi", "0016_degerlendirme_asamasi", "0015_kimlik_silme_yetkisi", "0014_rol_atama", "0013_gonderen_ajans", "0012_oneri_gizlilik", "0011_ulusal_agirlik", "0010_ayar", "0009_yatirim_konusu", "0008_ajans_kisa_ad", "0007_misafir", "0006_yakin_kopya", "0005_karsi_gorus",
    "0004_kriter_dayanagi", "0003_kurallar", "0002_rls", "0001_sema",
  ]);
  const [{ n }] = await sahip()<{ n: string }[]>`
    select count(*) as n from information_schema.tables where table_schema = 'public' and table_name = 'oneri'
  `;
  assert.equal(Number(n), 0);

  assert.deepEqual(await yukari(), [
    "0001_sema", "0002_rls", "0003_kurallar", "0004_kriter_dayanagi",
    "0005_karsi_gorus", "0006_yakin_kopya", "0007_misafir", "0008_ajans_kisa_ad", "0009_yatirim_konusu", "0010_ayar", "0011_ulusal_agirlik", "0012_oneri_gizlilik", "0013_gonderen_ajans", "0014_rol_atama",
    "0015_kimlik_silme_yetkisi", "0016_degerlendirme_asamasi", "0017_aday_kesfi", "0018_tarama_reddi", "0019_model_ayari", "0020_kapsam_coklu_nace", "0021_oneri_silme", "0022_belge_kategori",
  ]);
  await seed();
});

// ── yakın kopya · pg_trgm, AI yok ──────────────────────────────────────────

test("benzerlik eşiği gerçek başlık çiftlerini ayırıyor", async () => {
  const KOPYA: Array<[string, string]> = [
    ["Tekstil kırpıklarından geri dönüştürülmüş elyaf", "Tekstil kırpığından geri dönüşüm elyafı üretimi"],
    ["Teknik seramik ve seramik filtre üretimi", "Seramik filtre ve teknik seramik imalatı"],
    ["Jeotermal destekli sera ve ısı geri kazanımı", "Jeotermal sera ısıtması yatırımı"],
    ["Tarımsal kurutma ve soğuk zincir tesisi", "Soğuk zincir ve tarımsal kurutma yatırımı"],
  ];
  const FARKLI: Array<[string, string]> = [
    ["Deri ve deri ürünlerinde ihtisas üretimi", "Süt ve süt ürünleri işleme"],
    ["Bor türevleri ve ileri malzeme", "Manyezit bazlı refrakter üretimi"],
    ["Teknik tekstil ve dokusuz yüzey üretimi", "Termal turizm destekli sağlık hizmetleri"],
  ];

  const benzerlik = async (a: string, b: string) => {
    const [r] = await sahip()<{ s: number }[]>`select similarity(${a}, ${b}) as s`;
    return Number(r.s);
  };

  for (const [a, b] of KOPYA) {
    const s = await benzerlik(a, b);
    assert.ok(s >= BENZERLIK_ESIGI, `kopya sayılmalı (${s.toFixed(2)}): ${a} ↔ ${b}`);
  }
  for (const [a, b] of FARKLI) {
    const s = await benzerlik(a, b);
    assert.ok(s < BENZERLIK_ESIGI, `kopya sayılmamalı (${s.toFixed(2)}): ${a} ↔ ${b}`);
  }
});

test("yakın kopya aynı dönemde bulunur, reddedilen sayılmaz", async () => {
  const [o] = await sahip()<{ id: number; donem_id: number; gonderen_ref: string; baslik: string }[]>`
    select id, donem_id, gonderen_ref, baslik from oneri where baslik like 'Tekstil kırpık%' limit 1
  `;
  assert.ok(o, "tohum öneri bulunmalı");

  const kopya = async (baslik: string, durum: string, gerekce = "Benzerlik testi.") => {
    const [x] = await sahip()<{ id: number }[]>`
      insert into oneri (donem_id, gonderen_ref, baslik, gerekce, durum, ret_gerekcesi)
      values (${o.donem_id}, ${o.gonderen_ref}, ${baslik}, ${gerekce}, ${durum}::oneri_durumu,
              ${durum === "reddedildi" ? "test" : null})
      returning id
    `;
    return x.id;
  };

  const yakin = await kopya("Tekstil kırpığından geri dönüşüm elyafı üretimi", "onay_bekliyor");
  const reddedilen = await kopya("Tekstil kırpıklarından geri dönüşümlü elyaf tesisi", "reddedildi");

  const bulunan = await yakinKopyalar(ajans, o.id);
  const idler = bulunan.map((y) => Number(y.id));
  assert.ok(idler.includes(Number(yakin)), "yakın kopya bulunmalı");
  assert.ok(!idler.includes(Number(reddedilen)), "reddedilmiş öneri kopya sayılmaz");
  assert.ok(bulunan.every((y) => y.benzerlik >= BENZERLIK_ESIGI));
});

test("belge kapsaması yerel belgesi olmayan ili gösterir", async () => {
  const kapsam = await belgeKapsami(ANONIM);
  // 81 ilin tamamında açık dönem var (program yıllık ve ulusal).
  assert.equal(kapsam.length, 81);
  const usak = kapsam.find((x) => x.il_kod === "usak");
  const manisa = kapsam.find((x) => x.il_kod === "manisa");
  assert.ok(usak && usak.il_belgesi > 0, "Uşak'ın il raporu var");
  assert.ok(manisa && manisa.il_belgesi === 0, "Manisa'nın ile özgü belgesi yok");
  assert.ok(manisa && manisa.ajans_belgesi > 0, "ajans belgesi (bölge planı) her ilde geçerli");
  assert.ok(kapsam.every((x) => x.ulusal > 0), "ulusal belgeler her ilde geçerli");
  const yerelsiz = kapsam.filter((x) => x.il_belgesi + x.ajans_belgesi === 0);
  assert.ok(yerelsiz.length > 0, "TR33 dışındaki illerde yerel belge yok");
});

// ── misafir · kayıt olmadan devam et ───────────────────────────────────────

test("misafir oturumu kişisel veri olmadan açılır ve öneri verebilir", async () => {
  const { jeton, ref } = await misafirAc();
  const m = await oturumCoz(jeton);
  assert.ok(m, "misafir oturumu çözülmeli");
  assert.equal(m.misafir, true);
  assert.equal(m.rol, "yatirimci");
  assert.equal(m.eposta, null, "misafirde e-posta yok");
  assert.equal(m.adSoyad, null, "misafirde ad soyad yok");

  const [k] = await sahip()<{ n: string }[]>`select count(*) as n from kimlik where gonderen_ref = ${ref}`;
  assert.equal(Number(k.n), 0, "kimlik satırı HİÇ oluşturulmaz — toplanan kişisel veri sıfır");

  // Misafir kendi önerisini verebiliyor ve görebiliyor.
  const misafir = baglamdan(m);
  const [d] = await islem(misafir, (sql) => sql<{ id: number }[]>`select id from donem limit 1`);
  const o = await oneriOlustur(misafir, {
    donemId: Number(d.id),
    baslik: "Misafir gönderimi denemesi",
    gerekce: "Kayıt olmadan devam eden yatırımcı bu öneriyi gönderebilmeli ve sonra görebilmeli.",
    ilce: "Merkez",
    naceKod: null,
  });
  const kendi = await islem(misafir, (sql) => sql`select id from oneri where id = ${o.id}`);
  assert.equal(kendi.length, 1, "misafir kendi önerisini görür");
});

test("misafir işareti ajansa görünür — kimin önerdiği saklanmaz", async () => {
  const { ref } = await misafirAc();
  const [g] = await islem(ajans, (sql) => sql<{ misafir: boolean }[]>`
    select misafir from gonderen where ref = ${ref}
  `);
  assert.equal(g?.misafir, true);
});

// ── öneri gizliliği · görünürlük matrisi ───────────────────────────────────

/**
 * Kim hangi öneriyi görüyor — tek tabloda.
 *
 * Ürün kuralı: yatırımcının gönderdiği konu başlığı ticari fikirdir; sahibi ve
 * ajans dışında kimseye görünmez, ONAYLANMIŞ OLSA BİLE. Tek istisna
 * `koken = 'mevcut'`: o satırlar Bakanlığın yayımladığı `yatirim_konusu`
 * tablosundan türer, yani zaten kamuya açık metindir.
 *
 * Bu test hem tabloyu hem de istisnayı tutar. Bir gün politikaya `durum =
 * 'listede'` geri eklenirse ilk kırılan burasıdır.
 */
test("görünürlük matrisi: öneri sahibine ve ajansa görünür, başkasına görünmez", async () => {
  // Bağlamlar burada tazeleniyor: migration testi şemayı düşürüp yeniden
  // kuruyor ve `seed()` yeni `gonderen.ref` üretiyor. Modül düzeyindeki
  // `yatirimci` bağlamı o noktadan sonra kimsenin sahibi değil.
  const yatirimci = await girisBaglami("yatirimci@ykh.local");
  const ajans = await girisBaglami("ajans@ykh.local");
  const yonetici = await girisBaglami("yonetici@ykh.local");
  const { jeton } = await misafirAc();
  const m = await oturumCoz(jeton);
  assert.ok(m);
  const misafir = baglamdan(m);

  // Yatırımcının kendi önerisi (yeni) ve resmî listeden türeyen bir mevcut konu.
  const [benim] = await islem(yatirimci, (sql) => sql<{ id: number }[]>`
    select id from oneri where gonderen_ref = app_ref() and koken = 'yeni' limit 1
  `);
  assert.ok(benim, "yatırımcının kendi önerisi olmalı");
  const [resmi] = await sahip()<{ id: number }[]>`select id from oneri where koken = 'mevcut' limit 1`;

  const gorur = async (b: Baglam, id: number) =>
    (await islem(b, (sql) => sql`select id from oneri where id = ${id}`)).length === 1;

  for (const [ad, b, kendi, digeri] of [
    ["anonim", ANONIM, false, false],
    ["misafir", misafir, false, false],
    ["yatırımcı", yatirimci, true, false],
    ["ajans", ajans, true, true],
    ["yönetici", yonetici, true, true],
  ] as Array<[string, Baglam, boolean, boolean]>) {
    // `kendi` sütunu yatırımcı satırında gerçekten kendi önerisi; diğerlerinde
    // "başkasının önerisi" anlamına gelir. İkisi de aynı id ile sınanıyor.
    assert.equal(await gorur(b, Number(benim.id)), kendi || digeri, `${ad}: yatırımcının önerisi`);
    assert.equal(await gorur(b, Number(resmi.id)), true, `${ad}: resmî konu herkese açık`);
  }

  // Misafir kendi önerisini görür — kural "kayıtlı olmak" değil, "sahibi olmak".
  const [d] = await islem(misafir, (sql) => sql<{ id: number }[]>`select id from donem limit 1`);
  const o = await oneriOlustur(misafir, {
    donemId: Number(d.id),
    baslik: "Görünürlük matrisi denemesi",
    gerekce: "Misafirin kendi önerisi kendisine görünmeli, başka yatırımcıya görünmemeli.",
    ilce: null,
    naceKod: null,
  });
  assert.equal(await gorur(misafir, o.id), true, "misafir kendi önerisini görür");
  assert.equal(await gorur(yatirimci, o.id), false, "başka yatırımcı göremez");
  assert.equal(await gorur(ANONIM, o.id), false, "anonim göremez");
  assert.equal(await gorur(ajans, o.id), true, "ajans görür — değerlendirme ve onay ondadır");
});

test("onaylanmış öneri de gizli kalır — onay yayın demek değildir", async () => {
  // Yaşanmış tasarım hatası: `durum = 'listede'` politikada kamuya açma koşulu
  // sayılıyordu. Onay bir İÇ karardır: öneri sıralamaya girer, yayımlanmaz.
  const [o] = await sahip()<{ id: number }[]>`
    select id from oneri where durum = 'listede' and koken = 'yeni' limit 1
  `;
  assert.ok(o, "onaylanmış bir yatırımcı önerisi olmalı");
  const gorunen = await islem(ANONIM, (sql) => sql`select id from oneri where id = ${o.id}`);
  assert.equal(gorunen.length, 0, "onaylanmış olması anonime açmaz");
});

// ── toplu rapor kapsamı ve KVKK ────────────────────────────────────────────

test("rapor kapsamı: yönetici tüm bölgeler, ajans YALNIZCA kendi bölgesi", async () => {
  const yatirimci = await girisBaglami("yatirimci@ykh.local");
  const ajans = await girisBaglami("ajans@ykh.local");
  const yonetici = await girisBaglami("yonetici@ykh.local");

  const a = await raporSatirlari(ajans);
  const y = await raporSatirlari(yonetici);

  assert.ok(a.length > 0, "ajans kendi bölgesini görür");
  assert.deepEqual([...new Set(a.map((r) => r.ajans_kod))], ["TR33"], "yalnızca kendi bölgesi");
  assert.ok(y.length > a.length, "yönetici daha fazlasını görür");
  assert.ok(new Set(y.map((r) => r.ajans_kod)).size > 1, "yönetici tüm bölgeleri görür");

  // Ajans bölgesindeki HER kaydı görür — kim girdiyse. Kapsam kuralı ili
  // daraltır, gönderen'i değil.
  const kokenler = new Set(a.map((r) => r.koken));
  assert.ok(kokenler.has("mevcut") && kokenler.has("yeni"), "resmî konu da yatırımcı önerisi de görünür");

  // Yatırımcı bu sorguyu çağırsa hiçbir satır göremez: yönetici değil ve
  // `gonderen.ajans_kod` yok. Fail-closed.
  assert.equal((await raporSatirlari(yatirimci)).length, 0);
  assert.equal((await raporResmiListe(yatirimci)).length, 0);
});

test("bölgesi atanmamış ajans hesabı HİÇBİR satır görmez", async () => {
  // "Bölge bilinmiyorsa hepsini göster" sessiz bir yetki genişlemesi olurdu.
  const ajans = await girisBaglami("ajans@ykh.local");
  const [g] = await sahip()<{ ajans_kod: string }[]>`
    update gonderen set ajans_kod = null
    where ref = (select gonderen_ref from kimlik where eposta = 'ajans@ykh.local')
    returning 'TR33' as ajans_kod
  `;
  try {
    assert.equal((await raporSatirlari(ajans)).length, 0, "bölgesiz ajans hiçbir öneri görmez");
    assert.equal((await raporResmiListe(ajans)).length, 0, "resmî listeyi de görmez");
  } finally {
    await sahip()`
      update gonderen set ajans_kod = ${g.ajans_kod}
      where ref = (select gonderen_ref from kimlik where eposta = 'ajans@ykh.local')
    `;
  }
});

test("kayıtlı kullanıcı listesi kişisel veriyi MASKELİ döndürür", async () => {
  const yonetici = await girisBaglami("yonetici@ykh.local");
  const liste = await kayitliKullanicilar(yonetici);
  assert.ok(liste.length >= 3, "demo hesapları görünür");

  for (const u of liste) {
    if (!u.eposta_maske) continue;
    // Açık e-posta uygulama katmanına HİÇ gelmiyor: maskeleme SQL'de.
    assert.match(u.eposta_maske, /^.\*\*\*\*@/, `maskelenmemiş e-posta: ${u.eposta_maske}`);
    assert.ok(!u.eposta_maske.startsWith("yonetici@"), "tam adres sızmamalı");
    assert.match(u.ad_maske ?? "", /^.\*\*\*$/);
  }

  const aj = liste.find((u) => u.rol === "ajans");
  assert.equal(aj?.ajans_kod, "TR33", "ajans kullanıcısının bölgesi taşınır");
});

test("kişisel veriyi açmak denetime yazılır; silmede AKTÖR yöneticidir", async () => {
  const yonetici = await girisBaglami("yonetici@ykh.local");
  const [hedef] = await sahip()<{ ref: string }[]>`
    select gonderen_ref as ref from kimlik where eposta = 'yatirimci@ykh.local'
  `;

  const acik = await kimlikAc(yonetici, hedef.ref, "KVKK başvurusu 2027/14 · kimlik eşleştirme");
  assert.equal(acik?.eposta, "yatirimci@ykh.local", "yönetici açık değeri alır");

  const [iz] = await sahip()<{ aktor_ref: string; aktor_rol: string; detay: { gerekce?: string } }[]>`
    select aktor_ref, aktor_rol, detay from denetim
    where eylem = 'kimlik_goruntulendi' order by id desc limit 1
  `;
  assert.equal(iz.aktor_rol, "yonetici");
  assert.equal(iz.detay.gerekce, "KVKK başvurusu 2027/14 · kimlik eşleştirme", "gerekçe kayda geçer");

  // Silmede denetim AKTÖRÜ yöneticidir, silinen kişi değil. Önceki sürüm
  // `aktor_ref = p_ref` yazıyordu: kayıt "bu kişi kendi verisini sildi"
  // anlamına geliyordu ve izin tek işi olan soruyu yanlış cevaplıyordu.
  await kimlikSil(yonetici, hedef.ref);
  const [sil] = await sahip()<{ aktor_ref: string; nesne_id: string; detay: { ozne?: string } }[]>`
    select aktor_ref, nesne_id, detay from denetim
    where eylem = 'kimlik_pseudonimlestirildi' order by id desc limit 1
  `;
  assert.equal(sil.aktor_ref, yonetici.gonderenRef, "aktör yönetici");
  assert.equal(sil.nesne_id, hedef.ref, "nesne silinen kişi");
  assert.equal(sil.detay.ozne, hedef.ref);

  // Kimlik gitti, öneri zinciri durdu.
  const [k] = await sahip()<{ eposta: string | null; p: boolean }[]>`
    select eposta::text, pseudonimlestirildi as p from kimlik where gonderen_ref = ${hedef.ref}
  `;
  assert.equal(k.eposta, null);
  assert.equal(k.p, true);
  const [o] = await sahip()<{ n: string }[]>`select count(*) as n from oneri where gonderen_ref = ${hedef.ref}`;
  assert.ok(Number(o.n) > 0, "öneriler duruyor");
});

test("yönetici rol ve ajans bölgesi atar; yatırımcı atayamaz", async () => {
  const yonetici = await girisBaglami("yonetici@ykh.local");
  const [hedef] = await sahip()<{ ref: string }[]>`
  insert into gonderen (rol) values ('yatirimci') returning ref
  `;
  // Girişe bağlanmıyoruz: demo yatırımcı önceki KVKK testinde
  // pseudonimleştiriliyor ve bu test sıraya bağımlı hâle gelirdi.
  const yatirimci = { gonderenRef: hedef.ref, rol: "yatirimci" as const };

  // ponytail: test satırı SİLİNMİYOR. `denetim` append-only ve trigger sahip
  // bağlantısıyla bile silmeyi reddediyor; ona bağlı `gonderen` de silinemez.
  // Kimliksiz bir gönderen satırı hiçbir listeye düşmüyor, `db:reset` temizler.

  assert.equal(await rolAta(yonetici, hedef.ref, "ajans", "TR33"), true);
  const [a] = await sahip()<{ rol: string; ajans_kod: string | null }[]>`
    select rol::text, ajans_kod from gonderen where ref = ${hedef.ref}
  `;
  assert.equal(a.rol, "ajans");
  assert.equal(a.ajans_kod, "TR33");

  // Ajans dışına düşürünce bölge TEMİZLENİR; yoksa yatırımcıya inen bir
  // hesapta eski bölge asılı kalır ve ileride yeniden ajans yapılırsa
  // sessizce yanlış bölgeye bağlanır.
  await rolAta(yonetici, hedef.ref, "yatirimci", "TR33");
  const [b] = await sahip()<{ ajans_kod: string | null }[]>`
    select ajans_kod from gonderen where ref = ${hedef.ref}
  `;
  assert.equal(b.ajans_kod, null);

  // RLS son savunma hattı: yatırımcı KENDİ rolünü bile değiştiremez.
  // Eski politika `ref = app_ref()` diyordu ve kendini yönetici yapmak
  // mümkündü (0014 ile kapatıldı).
  assert.equal(await rolAta(yatirimci, hedef.ref, "yonetici", null), false);

  const [iz] = await sahip()<{ aktor_rol: string; detay: { yeni?: string } }[]>`
    select aktor_rol, detay from denetim where eylem = 'rol_atandi' order by id desc limit 1
  `;
  assert.equal(iz.aktor_rol, "yonetici");
  assert.equal(iz.detay.yeni, "yatirimci");
});

// ── resmî yatırım konuları listesi ─────────────────────────────────────────

test("resmî liste yüklendi: 81 il × 4 konu, iki yıl", async () => {
  const [r] = await islem(ANONIM, (sql) =>
    sql<{ konu: number; il: number; yil: number; gerekceli: number }[]>`
      select count(*)::int as konu,
             count(distinct il_kod)::int as il,
             count(distinct yil)::int as yil,
             count(*) filter (where gerekce <> '')::int as gerekceli
      from yatirim_konusu
    `,
  );
  assert.equal(r.il, 81, "81 ilin tamamı");
  assert.equal(r.yil, 2, "2025 ve 2026");
  assert.equal(r.konu, 648, "81 × 4 × 2");
  assert.equal(r.gerekceli, 324, "yalnızca 2026 tebliğinde gerekçe var");

  const [k] = await islem(ANONIM, (sql) =>
    sql<{ kaynak: string }[]>`select distinct kaynak from yatirim_konusu where yil = 2026`,
  );
  assert.match(k.kaynak, /Tebliği/, "tebliğ künyesi taşınır — hangi belge böyle diyor kaybolmaz");
});

test("mevcut adaylar resmî listeden türetilir, uydurma puan taşımaz", async () => {
  const mevcut = await islem(ANONIM, (sql) =>
    sql<{ id: number; baslik: string; gerekce: string; dayanak: number | null }[]>`
      select o.id, o.baslik, o.gerekce, g.dayanak
      from oneri o
      join donem d on d.id = o.donem_id
      left join degerlendirme g on g.oneri_id = o.id
      where o.koken = 'mevcut'
    `,
  );
  assert.ok(mevcut.length > 0, "pilot illerde mevcut aday olmalı");

  for (const o of mevcut) {
    assert.equal(o.dayanak, null, "resmî konuya uydurma değerlendirme yazılmaz");
    assert.ok(o.gerekce.length > 40, "gerekçe resmî tebliğden gelir");

    // Başlık ve gerekçe resmî listede birebir var mı — türetme doğrulanabilir.
    const [eslesme] = await islem(ANONIM, (sql) =>
      sql<{ n: string }[]>`
        select count(*) as n from yatirim_konusu
        where baslik = ${o.baslik} and gerekce = ${o.gerekce}
      `,
    );
    assert.ok(Number(eslesme.n) > 0, `resmî listede karşılığı yok: ${o.baslik.slice(0, 50)}`);
  }
});

test("demo değerlendirmeler model künyesi uydurmaz", async () => {
  const kunye = await islem(ANONIM, (sql) =>
    sql<{ model_snapshot: string }[]>`select distinct model_snapshot from degerlendirme`,
  );
  for (const k of kunye) {
    assert.equal(k.model_snapshot, "seed-demo", "seed puanı gerçek model künyesi taşıyamaz");
  }
});

test("yükleyici fail-closed: eksik il varsa hiç yazmaz", async () => {
  const { writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { konulariYukle } = await import("./konu-yukle.ts");

  const [{ n: once }] = await sahip()<{ n: string }[]>`select count(*) as n from yatirim_konusu`;

  const yol = join(tmpdir(), `ykh-konu-eksik-${process.pid}.json`);
  await writeFile(
    yol,
    JSON.stringify([{ il: "Uşak", yil: 2099, sira: 1, konu: "Tek il ile deneme konusu" }]),
    "utf8",
  );
  await assert.rejects(() => konulariYukle(yol, "test"), /konusu olmayan il/);

  await writeFile(
    yol,
    JSON.stringify([{ il: "Atlantis", yil: 2099, sira: 1, konu: "Tanınmayan il denemesi" }]),
    "utf8",
  );
  await assert.rejects(() => konulariYukle(yol, "test"), /tanınmayan il/i);

  const [{ n: sonra }] = await sahip()<{ n: string }[]>`select count(*) as n from yatirim_konusu`;
  assert.equal(sonra, once, "reddedilen dosyadan tek satır bile yazılmaz");
  await rm(yol, { force: true });
});

test("resmî konular belgelere göre yeniden değerlendirmeye alınır; yatırımcı alamaz", async () => {
  const { resmiKonulariDegerlendir } = await import("./sorgu.ts");
  const sistem = { gonderenRef: null, rol: "yonetici" as const };
  const [aj] = await islem(sistem, (sql) => sql<{ gonderen_ref: string }[]>`select gonderen_ref from kimlik where eposta = 'ajans@ykh.local'`);
  const [d] = await islem(sistem, (sql) => sql<{ donem_id: string }[]>`
    select o.donem_id from oneri o
    where o.koken = 'mevcut' and o.durum = 'listede'
      and not exists (select 1 from degerlendirme g where g.oneri_id = o.id)
    limit 1`);
  assert.ok(d, "seed puanlanmamış resmî konu içermeli");
  const donemId = Number(d.donem_id);

  assert.equal(await resmiKonulariDegerlendir({ gonderenRef: aj.gonderen_ref, rol: "yatirimci" }, donemId), 0);
  const n = await resmiKonulariDegerlendir({ gonderenRef: aj.gonderen_ref, rol: "ajans" }, donemId);
  assert.ok(n > 0);
  const satirlar = await islem(sistem, (sql) => sql<{ durum: string; deneme: number; baslik: string }[]>`
    select durum::text, deneme, baslik from oneri where donem_id = ${donemId} and koken = 'mevcut'
      and not exists (select 1 from degerlendirme g where g.oneri_id = oneri.id)`);
  assert.ok(satirlar.every((x) => x.durum === "degerlendiriliyor" && x.deneme === 0), "kuyruğa sıfır denemeyle döner");
  // Başlık olduğu gibi kalır; ikinci çağrı aynı konuları yeniden kuyruğa sokmaz.
  assert.equal(await resmiKonulariDegerlendir({ gonderenRef: aj.gonderen_ref, rol: "ajans" }, donemId), 0);
});

test("kuyruktaki öneriyi yalnızca yönetici siler; görüntü denetimde kalır; onaylı öneri silinmez", async () => {
  const { oneriSil, oneriGuncelle } = await import("./sorgu.ts");
  const sistem = { gonderenRef: null, rol: "yonetici" as const };
  const ref = async (e: string) => (await islem(sistem, (sql) => sql<{ r: string }[]>`select gonderen_ref as r from kimlik where eposta = ${e}`))[0].r;
  const yonetici = { gonderenRef: await ref("yonetici@ykh.local"), rol: "yonetici" as const };
  const ajans = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" as const };
  const [{ d }] = await islem(sistem, (sql) => sql<{ d: string }[]>`select id as d from donem order by id limit 1`);
  const yeni = async () => (await islem(ajans, (sql) => sql<{ id: string }[]>`
    insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, durum)
    values (${d}, ${ajans.gonderenRef}, 'yeni', 'Silme sınaması konusu', ${"Neden burada sorusuna kırk karakterden uzun bir gerekçe metni."}, 'onay_bekliyor')
    returning id`))[0].id;

  const id = Number(await yeni());
  assert.equal((await oneriSil(ajans, id, "ajans silmeye çalışıyor")).ok, false, "ajans silemez");
  assert.equal((await oneriSil(yonetici, id, "kısa")).ok, false, "gerekçe zorunlu");
  assert.ok((await oneriSil(yonetici, id, "Aynı konunun tekrarı, sınama")).ok);
  const [{ n }] = await islem(sistem, (sql) => sql<{ n: string }[]>`select count(*) as n from oneri where id = ${id}`);
  assert.equal(Number(n), 0);
  const [iz] = await islem(sistem, (sql) => sql<{ detay: { kayit: { oneri: { baslik: string } }; gerekce: string } }[]>`
    select detay from denetim where eylem = 'oneri_silindi' and nesne_id = ${String(id)}`);
  assert.equal(iz.detay.kayit.oneri.baslik, "Silme sınaması konusu", "tam görüntü denetimde");

  // Onaylanmış (listede) öneri kuyrukta değil: ne fonksiyon ne doğrudan SQL siler.
  const id2 = Number(await yeni());
  await islem(sistem, (sql) => sql`update oneri set durum = 'listede', onaylayan_ref = ${ajans.gonderenRef}, onay_zamani = now() where id = ${id2}`);
  assert.equal((await oneriSil(yonetici, id2, "onaylı öneriyi silme denemesi")).ok, false);
  const r = await islem(yonetici, (sql) => sql`delete from oneri where id = ${id2}`);
  assert.equal(r.count, 0, "RLS: listedeki öneri silinemez");

  // Düzeltme: değerlendirme gider, öneri yeniden değerlendirmeye döner.
  const id3 = Number(await yeni());
  const g = await oneriGuncelle(yonetici, id3, { baslik: "Düzeltilmiş konu başlığı", gerekce: "Düzeltilmiş gerekçe metni kırk karakterden uzun olmalıdır.", ilce: null, kapsam: ["Ürün grubu bir"] }, "Başlık netleştirildi");
  assert.ok(g.ok);
  const [o3] = await islem(sistem, (sql) => sql<{ durum: string; baslik: string; deneme: number }[]>`select durum::text, baslik, deneme from oneri where id = ${id3}`);
  assert.deepEqual(o3, { durum: "degerlendiriliyor", baslik: "Düzeltilmiş konu başlığı", deneme: 0 });
  const [dz] = await islem(sistem, (sql) => sql<{ detay: { onceki: { baslik: string } } }[]>`
    select detay from denetim where eylem = 'oneri_duzeltildi' and nesne_id = ${String(id3)}`);
  assert.equal(dz.detay.onceki.baslik, "Silme sınaması konusu", "önceki metin denetimde");
  assert.equal((await oneriGuncelle(ajans, id3, { baslik: "x".repeat(10), gerekce: "y".repeat(45), ilce: null, kapsam: [] }, "ajans deniyor ama yetkisi yok")).ok, false);
});

test("kaynak belgesi: aynı içerik dokunmaz, değişen içerik yeniden yazılır; kategori taşınır", async () => {
  const { kaynakBelgesiYaz } = await import("./sorgu.ts");
  const { ciMetni } = await import("./kaynak.ts");
  const servis: Baglam = { gonderenRef: null, rol: "yonetici" };
  const isaret = (ad: string) => ({
    Name: ad, TypeName: "Mahreç İşareti ", ProductGroupName: "Halılar ve kilimler", CityName: "Uşak", DistrictName: "Eşme",
    StatusName: "Tescilli", RegistrationDate: "/Date(1591822800000)/", ApplicantOrRegistrant: "Eşme Belediyesi",
  });
  const metin = ciMetni("Uşak", [isaret("Eşme Kilimi")]);
  assert.match(metin, /Eşme Kilimi, Uşak ilinde Eşme ilçesinde tescilli bir coğrafi işarettir \(mahreç işareti\)\. Ürün grubu: Halılar ve kilimler\. Tescil yılı 2020\./);
  const g = { ad: "Sınama Coğrafi İşaretleri", tur: "il_raporu", yil: null, ajansKod: "TR33", ilKod: "usak", kategori: "cografi_isaret" as const };
  assert.equal(await kaynakBelgesiYaz(servis, { ...g, metin: metin + "\n\n" + "Dolgu cümlesi. ".repeat(20) }), "yazildi");
  const [ilk] = await sahip()<{ id: string; kategori: string }[]>`select id, kategori from belge where ad = ${g.ad}`;
  assert.equal(ilk.kategori, "cografi_isaret");
  assert.equal(await kaynakBelgesiYaz(servis, { ...g, metin: metin + "\n\n" + "Dolgu cümlesi. ".repeat(20) }), "ayni");
  const [ayni] = await sahip()<{ id: string }[]>`select id from belge where ad = ${g.ad}`;
  assert.equal(ayni.id, ilk.id, "değişmeyen belge yeniden yazılmaz: tarama önbelleği korunur");
  assert.equal(await kaynakBelgesiYaz(servis, { ...g, metin: ciMetni("Uşak", [isaret("Eşme Kilimi"), isaret("Uşak Halısı")]) + "\n\n" + "Dolgu cümlesi. ".repeat(20) }), "yazildi");
  const yeni = await sahip()<{ id: string; metin: string }[]>`select id, metin from belge where ad = ${g.ad}`;
  assert.ok(yeni.every((r) => r.id !== ilk.id) && yeni.some((r) => r.metin.includes("Uşak Halısı")));
  await sahip()`delete from belge where ad = ${g.ad}`;
});

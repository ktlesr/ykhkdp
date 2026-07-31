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
  naceGetir,
  oturumCoz,
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
  await sifirla();
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
  const [{ taban: once }] = await sahip()<{ taban: number }[]>`
    select oneri_taban_puani(${o.id}, (select agirliklar from agirlik_seti limit 1)) as taban
  `;
  await sahip()`
    update degerlendirme
    set duzeltilmis_puanlar = (select jsonb_object_agg(k, 100) from unnest(enum_range(null::kriter)) k),
        duzelten_ref = (select ref from gonderen where rol = 'ajans' limit 1)
    where oneri_id = ${o.id}
  `;
  const [{ taban: sonra }] = await sahip()<{ taban: number }[]>`
    select oneri_taban_puani(${o.id}, (select agirliklar from agirlik_seti limit 1)) as taban
  `;
  assert.equal(sonra, 100);
  assert.notEqual(sonra, once);
});

test("KVKK: kimlik pseudonimleşir, öneri zinciri korunur", async () => {
  const [g] = await sahip()<{ ref: string }[]>`
    select o.gonderen_ref as ref from oneri o join kimlik k on k.gonderen_ref = o.gonderen_ref
    where k.eposta is not null limit 1
  `;
  const [{ n: once }] = await sahip()<{ n: string }[]>`
    select count(*) as n from oneri where gonderen_ref = ${g.ref}
  `;
  await sahip()`select kimlik_pseudonimlestir(${g.ref})`;

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
  const geri = await asagi(11);
  assert.deepEqual(geri, [
    "0011_ulusal_agirlik", "0010_ayar", "0009_yatirim_konusu", "0008_ajans_kisa_ad", "0007_misafir", "0006_yakin_kopya", "0005_karsi_gorus",
    "0004_kriter_dayanagi", "0003_kurallar", "0002_rls", "0001_sema",
  ]);
  const [{ n }] = await sahip()<{ n: string }[]>`
    select count(*) as n from information_schema.tables where table_schema = 'public' and table_name = 'oneri'
  `;
  assert.equal(Number(n), 0);

  assert.deepEqual(await yukari(), [
    "0001_sema", "0002_rls", "0003_kurallar", "0004_kriter_dayanagi",
    "0005_karsi_gorus", "0006_yakin_kopya", "0007_misafir", "0008_ajans_kisa_ad", "0009_yatirim_konusu", "0010_ayar", "0011_ulusal_agirlik",
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

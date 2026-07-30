import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { ANONIM, islem, kapat, sahip, type Baglam } from "./baglanti.ts";
import { asagi, sifirla, yukari } from "./migrate.ts";
import { DEMO_PAROLA, seed } from "./seed.ts";
import { baglamdan, girisYap, naceAra, naceGetir, oturumCoz } from "./sorgu.ts";

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
  const geri = await asagi(3);
  assert.deepEqual(geri, ["0003_kurallar", "0002_rls", "0001_sema"]);
  const [{ n }] = await sahip()<{ n: string }[]>`
    select count(*) as n from information_schema.tables where table_schema = 'public' and table_name = 'oneri'
  `;
  assert.equal(Number(n), 0);

  assert.deepEqual(await yukari(), ["0001_sema", "0002_rls", "0003_kurallar"]);
  await seed();
});

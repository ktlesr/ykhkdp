import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { hesapla, ayardan } from "@ykh/scoring";
import { ANONIM, islem, kapat, sahip, type Baglam } from "./baglanti.ts";
import { asagi, yukari, sifirla } from "./migrate.ts";
import { seed, DEMO_PAROLA } from "./seed.ts";
import {
  adaylariGetir, destekVer, donemGetir, girisYap, kanitDurumDegistir,
  kararKilitle, oturumCoz, baglamdan, oneriOlustur, panelVerisi,
} from "./sorgu.ts";

/**
 * Bu dosya gerçek Postgres'e bağlanır. `pnpm db:reset` ile aynı şemayı kurar,
 * seed'ler ve RLS'in gerçekten uygulandığını kanıtlar.
 */

let uzman: Baglam;
let kurul: Baglam;
let birey: Baglam;

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
  uzman = await girisBaglami("uzman@ykh.local");
  kurul = await girisBaglami("kurul@ykh.local");
  birey = await girisBaglami("birey@ykh.local");
});

after(async () => {
  await kapat();
});

// ── sıralama: prototiple birebir ───────────────────────────────────────────

test("Uşak 2027 sıralaması prototiple birebir aynı", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const adaylar = await adaylariGetir(uzman, d);
  const h = hesapla(adaylar, ayardan(d.set));

  assert.deepEqual(
    h.ilkDort.map((s) => (s.bos ? "BOŞ" : s.ad)),
    [
      "Teknik tekstil ve dokusuz yüzey üretimi",
      "Tekstil kırpıklarından yüksek kaliteli geri dönüştürülmüş elyaf",
      "Deri ve deri ürünlerinde ihtisas üretimi",
      "BOŞ",
    ],
  );
  assert.deepEqual(h.ozet, { korunuyor: 2, ekleniyor: 1, cikiyor: 2, bosSlot: 1 });
  assert.equal(h.fark, 2);
  assert.equal(h.saglamlik, 56);
  assert.equal(h.agirlikSurumu, "TR33-2027-v1");
});

test("kriter puanları hedef taban puanları üretir", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const adaylar = await adaylariGetir(uzman, d);
  const bul = (ad: string) => adaylar.find((a) => a.ad.startsWith(ad));
  assert.equal(bul("Teknik tekstil")?.taban, 73);
  assert.equal(bul("Tekstil kırpık")?.taban, 74);
  assert.equal(bul("Deri")?.taban, 66);
  assert.equal(bul("Tarımsal kurutma")?.taban, 69);
});

test("epistemik durum kanıt eşiğinden ve doğrulanmamış kanıttan türer", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const adaylar = await adaylariGetir(uzman, d);
  assert.equal(adaylar.find((a) => a.ad.startsWith("Teknik"))?.ep, "onay");
  assert.equal(adaylar.find((a) => a.ad.startsWith("Tarımsal"))?.ep, "ai");
  assert.equal(adaylar.find((a) => a.ad.startsWith("Batarya"))?.ep, "yok");
});

// ── RLS ────────────────────────────────────────────────────────────────────

test("RLS gerçekten uygulanıyor: anonim kişisel veri göremez", async () => {
  const satirlar = await islem(ANONIM, (sql) => sql`select * from kimlik`);
  assert.equal(satirlar.length, 0);
});

test("birey başkasının kimliğini göremez, kendisininkini görür", async () => {
  const kendi = await islem(birey, (sql) => sql`select gonderen_ref from kimlik`);
  assert.equal(kendi.length, 1);
});

test("birey kanıt doğrulayamaz — RLS update politikası reddeder", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const [k] = await islem(uzman, (sql) => sql<{ id: number }[]>`select id from kanit limit 1`);
  const etkilenen = await islem(birey, (sql) =>
    sql`update kanit set dogrulama_durumu = 'uzman_onayli' where id = ${k.id} returning id`,
  );
  assert.equal(etkilenen.length, 0);
});

test("birey kriter puanı yazamaz", async () => {
  await assert.rejects(
    () => islem(birey, (sql) => sql`insert into kriter_puani (aday_id, kriter, puan) values (1, 'plan_uyumu', 99)`),
    /row-level security|new row violates/i,
  );
});

test("anonim öneri oluşturamaz", async () => {
  await assert.rejects(
    () => oneriOlustur(ANONIM, {
      donemId: 1, tur: "yeni", baslik: "Anonim deneme", tanim: "x", ilce: "Merkez",
      neden: "y", nace: null, naceOnayli: false,
    }),
    /row-level security|new row violates|null value/i,
  );
});

test("denetim tablosu append-only — iki katman", async () => {
  await islem(uzman, (sql) =>
    sql`insert into denetim (aktor_ref, eylem, nesne_tip, nesne_id) values (null, 'test', 'test', '1')`,
  );

  // 1. katman: RLS'te update/delete politikası yok → hiçbir satır etkilenmez.
  const guncel = await islem(uzman, (sql) =>
    sql`update denetim set eylem = 'sahte' where id = (select min(id) from denetim) returning id`,
  );
  assert.equal(guncel.length, 0);
  const silinen = await islem(uzman, (sql) =>
    sql`delete from denetim where id = (select min(id) from denetim) returning id`,
  );
  assert.equal(silinen.length, 0);

  // 2. katman: RLS baypas edilse bile trigger reddeder.
  await assert.rejects(
    () => sahip()`update denetim set eylem = 'sahte' where id = (select min(id) from denetim)`,
    /append-only/i,
  );
  await assert.rejects(
    () => sahip()`delete from denetim where id = (select min(id) from denetim)`,
    /append-only/i,
  );
});

// ── iş kuralları ───────────────────────────────────────────────────────────

test("destek sayısı puanı değiştirmez", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const once = await adaylariGetir(uzman, d);
  const [o] = await islem(uzman, (sql) =>
    sql<{ id: number }[]>`select id from oneri where donem_id = ${d.donemId} and durum = 'konu_adayi' limit 1`,
  );
  await destekVer(birey, o.id);
  const sonra = await adaylariGetir(uzman, d);
  assert.deepEqual(
    once.map((a) => [a.id, a.taban, a.kanit]),
    sonra.map((a) => [a.id, a.taban, a.kanit]),
  );
});

test("kanıt reddedilince yeterlilik düşer, onaylanınca geri gelir", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const [aday] = await islem(uzman, (sql) =>
    sql<{ id: number }[]>`select id from aday where donem_id = ${d.donemId} order by id limit 1`,
  );
  const [k] = await islem(uzman, (sql) =>
    sql<{ id: number; katki_puani: number }[]>`
      select id, katki_puani from kanit where aday_id = ${aday.id} and dogrulama_durumu = 'uzman_onayli' order by id limit 1
    `,
  );
  const oncekiler = await adaylariGetir(uzman, d);
  const once = oncekiler.find((a) => a.id === String(aday.id))!.kanit;

  await kanitDurumDegistir(uzman, k.id, "reddedildi", "Kaynak künyesi doğrulanamadı.");
  const sonrakiler = await adaylariGetir(uzman, d);
  assert.equal(sonrakiler.find((a) => a.id === String(aday.id))!.kanit, once - k.katki_puani);

  await kanitDurumDegistir(uzman, k.id, "uzman_onayli", "Yeniden doğrulandı.");
  const geri = await adaylariGetir(uzman, d);
  assert.equal(geri.find((a) => a.id === String(aday.id))!.kanit, once);
});

test("panel verisi dönemden gerçek sayı üretir", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const p = await panelVerisi(uzman, d);
  assert.equal(p.akis.length, 4);
  assert.ok(p.akis[0].deger > 0);
  assert.equal(p.saglik.reduce((t, s) => t + s.oran, 0) >= 99, true);
});

test("karar kilidi: kurul kilitler, kilitli dönem salt okunur olur", async () => {
  const d = await donemGetir(kurul, "kutahya", "2027");
  assert.ok(d);

  const uzmanDenemesi = await kararKilitle(uzman, d.donemId, d.set.surum, { deneme: true }, []);
  assert.equal(uzmanDenemesi.ok, false, "uzman kilitleyememeli");

  const r = await kararKilitle(kurul, d.donemId, d.set.surum, { slotlar: [] }, [{ konu: "x", gerekce: "y" }]);
  assert.equal(r.ok, true);

  await assert.rejects(
    () => islem(uzman, (sql) => sql`update aday set ad = 'değişti' where donem_id = ${d.donemId}`),
    /kilitli/i,
  );
  const tekrar = await kararKilitle(kurul, d.donemId, d.set.surum, {}, []);
  assert.equal(tekrar.ok, false);
});

// ── migration geri alma ────────────────────────────────────────────────────

test("migration geri alınabilir ve yeniden uygulanabilir", async () => {
  const geri = await asagi(3);
  assert.deepEqual(geri, ["0003_kurallar", "0002_rls", "0001_sema"]);
  const [{ n }] = await sahip()<{ n: string }[]>`
    select count(*) as n from information_schema.tables where table_schema = 'public' and table_name = 'oneri'
  `;
  assert.equal(Number(n), 0);

  const ileri = await yukari();
  assert.deepEqual(ileri, ["0001_sema", "0002_rls", "0003_kurallar"]);
  await seed();
});

import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import {
  adaylariGetir, baglamdan, donemGetir, girisYap, incelemeKuyrugu, islem, kanitDurumDegistir,
  kanitEkle, kapat, kararGetir, kararKilitle, kayitOl, oneriDurumDegistir, oneriGetir,
  oneriOlustur, oturumCoz, destekVer, type Baglam,
} from "@ykh/database";
import { sifirla, yukari } from "@ykh/database/migrate";
import { seed, DEMO_PAROLA } from "@ykh/database/seed";
import { kararRaporu } from "@ykh/reporting";
import { ayardan, hesapla, slotKimlikleri } from "@ykh/scoring";

/**
 * Uçtan uca: kayıt → öneri → kanıt → uzman doğrulaması → konu adayı →
 * sıralamanın değişmesi → kurul kilidi → kilitli dönemin salt okunur olması →
 * rapor. Gerçek Postgres, gerçek RLS.
 */

let birey: Baglam;
let uzman: Baglam;
let kurul: Baglam;
let donemId: number;
let oneriId: number;

async function girisBaglami(eposta: string, parola = DEMO_PAROLA): Promise<Baglam> {
  const r = await girisYap(eposta, parola);
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
});

after(async () => {
  await kapat();
});

test("1 · kayıt olan birey oturum açar ve bağlamı birey rolüyle gelir", async () => {
  const r = await kayitOl("yeni.kullanici@ykh.local", "cok-guclu-parola-2027", "Y. Kullanıcı");
  assert.equal(r.ok, true);
  const k = await oturumCoz(r.ok ? r.jeton : "");
  assert.ok(k);
  assert.equal(k.rol, "birey");
  birey = baglamdan(k);
});

test("2 · aynı e-posta ikinci kez kaydolamaz", async () => {
  const r = await kayitOl("yeni.kullanici@ykh.local", "baska-bir-parola-2027", "Başkası");
  assert.equal(r.ok, false);
});

test("3 · birey öneri verir; öneri kanıt bekliyor durumunda başlar", async () => {
  const d = await donemGetir(birey, "usak", "2027");
  assert.ok(d);
  donemId = d.donemId;

  const o = await oneriOlustur(birey, {
    donemId,
    tur: "yeni",
    baslik: "Atık ısıdan elektrik üretimi (ORC çevrimi)",
    tanim:
      "Seramik ve tekstil tesislerindeki baca gazı atık ısısının organik Rankine çevrimiyle elektriğe dönüştürülmesi ve OSB şebekesine verilmesi.",
    ilce: "Merkez",
    neden: "Yüksek sıcaklık atık ısı kaynakları il merkezindeki OSB'de yoğunlaşıyor.",
    nace: "NACE 35.11",
    naceOnayli: true,
  });
  oneriId = o.id;

  const kayit = await oneriGetir(birey, oneriId);
  assert.equal(kayit?.durum, "kanit_bekliyor");
  assert.equal(kayit?.kanit, 0, "kanıtsız dosyanın yeterliliği sıfırdır");
});

test("4 · eklenen kanıt beyan olarak girer ve puana girmez", async () => {
  await kanitEkle(birey, oneriId, {
    kaynakKurum: "Uşak OSB Müdürlüğü",
    belge: "Atık Isı Envanteri 2026",
    sayfaTablo: "s. 12 · Tablo 3",
    yayimTarihi: "2026-04-10",
    url: null,
    alinti: "OSB genelinde 180°C üzeri baca gazı kaynakları tespit edilmiştir.",
    katkiPuani: 60,
  });

  const kayit = await oneriGetir(birey, oneriId);
  assert.equal(kayit?.kanitlar.length, 1);
  assert.equal(kayit?.kanitlar[0].dogrulamaDurumu, "beyan");
  assert.equal(kayit?.kanit, 0, "beyan kanıt yeterliliğine katkı vermez");
});

test("5 · birey kendi kanıtını onaylayamaz", async () => {
  const [k] = await islem(birey, (sql) =>
    sql<{ id: number }[]>`select id from kanit where oneri_id = ${oneriId}`,
  );
  const etkilenen = await islem(birey, (sql) =>
    sql`update kanit set dogrulama_durumu = 'uzman_onayli' where id = ${k.id} returning id`,
  );
  assert.equal(etkilenen.length, 0, "RLS bireyin doğrulama yapmasını engeller");
});

test("6 · uzman kanıtı onaylar; yeterlilik ancak o zaman yükselir", async () => {
  const kuyruk = await incelemeKuyrugu(uzman, donemId);
  const hedef = kuyruk.find((x) => x.oneri_id === oneriId);
  assert.ok(hedef, "kanıt uzman kuyruğunda görünmeli");

  await kanitDurumDegistir(uzman, hedef.id, "uzman_onayli", "Kaynak künyesi ve tablo doğrulandı.");
  const kayit = await oneriGetir(birey, oneriId);
  assert.equal(kayit?.kanit, 60);
});

test("7 · destek verilir ama hiçbir puanı değiştirmez", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const once = await adaylariGetir(uzman, d);
  await destekVer(uzman, oneriId);
  const sonra = await adaylariGetir(uzman, d);
  assert.deepEqual(
    once.map((a) => [a.id, a.taban, a.kanit]),
    sonra.map((a) => [a.id, a.taban, a.kanit]),
  );
  const kayit = await oneriGetir(birey, oneriId);
  assert.equal(kayit?.destek, 1);
});

test("8 · konu adayı olunca sıralamaya girer ve kanıt aday üzerinden sayılır", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const oncekiSlotlar = slotKimlikleri(hesapla(await adaylariGetir(uzman, d), ayardan(d.set)));

  await oneriDurumDegistir(uzman, oneriId, "uzman_incelemesinde", "Kanıt yeterli, incelemeye alındı.");
  await oneriDurumDegistir(uzman, oneriId, "konu_adayi", "Konu adayı olarak kabul edildi.");

  const adaylar = await adaylariGetir(uzman, d);
  const yeni = adaylar.find((a) => a.ad.startsWith("Atık ısıdan"));
  assert.ok(yeni, "yeni aday sıralama girdisinde olmalı");
  assert.equal(yeni.kanit, 60, "kanıt aday üzerinden sayılmalı");
  assert.equal(yeni.taban, 0, "kriter puanı yazılmadan taban puan sıfırdır");

  // Kriteri olmayan aday eşiği geçse bile puanı düşük — ilk dörde giremez.
  const sonra = slotKimlikleri(hesapla(adaylar, ayardan(d.set)));
  assert.equal(sonra.includes(yeni.id), false);
  assert.deepEqual(sonra, oncekiSlotlar, "kriter puanı olmayan aday ilk dördü değiştirmez");
});

test("9 · uzman kriter puanı yazınca aday ilk dörde girebilir ve boş slot dolar", async () => {
  const d = await donemGetir(uzman, "usak", "2027");
  assert.ok(d);
  const adaylar = await adaylariGetir(uzman, d);
  const yeni = adaylar.find((a) => a.ad.startsWith("Atık ısıdan"))!;

  const { kriterPuaniYaz } = await import("@ykh/database");
  for (const kriter of Object.keys(d.set.agirliklar) as (keyof typeof d.set.agirliklar)[]) {
    await kriterPuaniYaz(uzman, Number(yeni.id), kriter, 72, "Kanıt dosyası ve saha bilgisi değerlendirildi.");
  }

  const h = hesapla(await adaylariGetir(uzman, d), ayardan(d.set));
  assert.equal(slotKimlikleri(h).includes(yeni.id), true, "72 puanlı kanıtlı aday boş slotu doldurmalı");
  assert.equal(h.ozet.bosSlot, 0, "boş slot artık dolu");
});

test("10 · uzman kararı kilitleyemez, kurul kilitler", async () => {
  const d = await donemGetir(kurul, "usak", "2027");
  assert.ok(d);
  const h = hesapla(await adaylariGetir(kurul, d), ayardan(d.set));

  const uzmanDenemesi = await kararKilitle(uzman, d.donemId, d.set.surum, {}, []);
  assert.equal(uzmanDenemesi.ok, false);

  const r = await kararKilitle(
    kurul,
    d.donemId,
    d.set.surum,
    { slotlar: h.ilkDort.map((s) => (s.bos ? { sira: s.sira, sonuc: "boş" } : { sira: s.sira, ad: s.ad, sonuc: s.sonuc })) },
    [{ konu: "Uşak 2027", gerekce: "Kurul, kanıt yeterliliği eşiğini geçen dört konuyu oybirliğiyle onayladı." }],
  );
  assert.equal(r.ok, true);
});

test("11 · kilitli dönem salt okunur; yeni kanıt bile eklenemez", async () => {
  await assert.rejects(
    () =>
      kanitEkle(birey, oneriId, {
        kaynakKurum: "X", belge: "Y", sayfaTablo: "", yayimTarihi: null, url: null, alinti: "", katkiPuani: 5,
      }),
    /kilitli/i,
  );
  await assert.rejects(
    () => oneriDurumDegistir(uzman, oneriId, "reddedildi", "Kilitten sonra değişiklik denemesi."),
    /kilitli/i,
  );
});

test("12 · rapor kilitli karardan üretilir ve kuralları taşır", async () => {
  const d = await donemGetir(kurul, "usak", "2027");
  assert.ok(d);
  const h = hesapla(await adaylariGetir(kurul, d), ayardan(d.set));
  const karar = await kararGetir(kurul, d.donemId);
  assert.ok(karar);

  const html = kararRaporu({
    ajans: d.ajans, il: d.il, donem: d.yil, surum: d.set.surum, hesap: h,
    kilitZamani: karar.kilit_zamani, kilitleyen: karar.kilitleyen,
    gerekceler: karar.gerekceler as { konu: string; gerekce: string }[],
  });

  assert.match(html, /Uşak — 2027 dönemi/);
  assert.match(html, /Devamlılık payı/);
  assert.match(html, /Destek sayısı puan girdisi değildir/);
  assert.match(html, /TR33-2027-v1/);
  assert.match(html, /Kurul, kanıt yeterliliği eşiğini/);
});

test("13 · denetim izi tüm zinciri kaydetmiş", async () => {
  const izler = await islem(kurul, (sql) =>
    sql<{ eylem: string }[]>`select eylem from denetim order by id`,
  );
  const eylemler = izler.map((x) => x.eylem);
  for (const beklenen of [
    "kayit_olundu", "oneri_gonderildi", "kanit_eklendi", "kanit_uzman_onayli",
    "destek_verildi", "oneri_konu_adayi", "kriter_puani_yazildi", "karar_kilitlendi",
  ]) {
    assert.ok(eylemler.includes(beklenen), `denetim izinde eksik: ${beklenen}`);
  }
});

test("14 · kamu görünümü anonim bağlamda kişisel veri sızdırmaz", async () => {
  const anonim: Baglam = { gonderenRef: null, rol: "anonim" };
  const d = await donemGetir(anonim, "usak", "2027");
  assert.ok(d, "kamu dönem bilgisini görebilmeli");

  const adaylar = await adaylariGetir(anonim, d);
  assert.ok(adaylar.length > 0, "kamu sıralamayı görebilmeli");

  const kimlikler = await islem(anonim, (sql) => sql`select * from kimlik`);
  assert.equal(kimlikler.length, 0, "kamu kimlik tablosunu göremez");

  const denetim = await islem(anonim, (sql) => sql`select * from denetim`);
  assert.equal(denetim.length, 0, "kamu denetim izini göremez");
});

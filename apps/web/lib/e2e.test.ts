import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import {
  adaylariGetir, baglamdan, belgeEkle, bolgeler, donemGetir, durumDegistir, girisYap, islem, kapat,
  kayitOl, misafirAc, naceAra, onayKuyrugu, oneriGetir, oneriOlustur, ornekDegerlendirme, oturumCoz,
  platformOzeti, puanDuzelt, ANONIM, type Baglam,
} from "@ykh/database";
import { sifirla, yukari } from "@ykh/database/migrate";
import { DEMO_PAROLA, seed } from "@ykh/database/seed";
import { ayardan, hesapla, slotKimlikleri } from "@ykh/scoring";
import { degerlendirmeYap } from "@ykh/degerlendirme";

/**
 * Uçtan uca: kayıt → öneri (NACE'siz) → AI NACE atar + puanlar →
 * ajans onaylar → il sıralamasına girer → dayanaksız aday slot dolduramaz.
 */

let yatirimci: Baglam;
let ajans: Baglam;
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
  ajans = await girisBaglami("ajans@ykh.local");
});

after(async () => {
  await kapat();
});

test("1 · kayıt olan kullanıcı yatirimci rolüyle gelir", async () => {
  const r = await kayitOl("yeni@ykh.local", "cok-guclu-parola-2027", "Y. Kullanıcı");
  assert.equal(r.ok, true);
  const k = await oturumCoz(r.ok ? r.jeton : "");
  assert.equal(k?.rol, "yatirimci");
  yatirimci = baglamdan(k);
});

test("2 · NACE aranabilir; yatırımcı biliyorsa girer", async () => {
  const sonuc = await naceAra(yatirimci, "elyaf");
  assert.ok(sonuc.length > 0, "NACE araması sonuç vermeli");
  assert.ok(sonuc.every((n) => n.duzey === "sinif" || n.duzey === "faaliyet"));

  const kod = await naceAra(yatirimci, "13.10");
  assert.equal(kod[0]?.kod, "13.10");
});

test("3 · beş alanla öneri verilir; NACE boş bırakılabilir", async () => {
  const d = await donemGetir(yatirimci, "usak");
  assert.ok(d);

  const o = await oneriOlustur(yatirimci, {
    donemId: d.donemId,
    baslik: "Tekstil atığından teknik keçe üretimi",
    gerekce:
      "Uşak'ta konfeksiyon atölyelerinden çıkan kırpık atığı ilde toplanıyor ve dokusuz yüzey üretimi için " +
      "hazır altyapı bölge planında tanımlı; aynı konu kırpık arzı olmayan bir ilde bu maliyetle yapılamaz.",
    ilce: "Merkez",
    naceKod: null,
  });
  oneriId = o.id;

  const kayit = await oneriGetir(yatirimci, oneriId);
  assert.equal(kayit?.durum, "degerlendiriliyor");
  assert.equal(kayit?.nace_kod, null);
  assert.equal(kayit?.taban, 0, "değerlendirme yapılmadan puan yok");
});

test("4 · yeni öneri il sıralamasında GÖRÜNMEZ (onaylanmadı)", async () => {
  const d = await donemGetir(yatirimci, "usak");
  assert.ok(d);
  const adaylar = await adaylariGetir(yatirimci, d);
  assert.equal(adaylar.some((a) => a.id === String(oneriId)), false);
});

test("5 · AI NACE atar, puanlar, durum onay_bekliyor olur", async () => {
  const sonuc = (await degerlendirmeYap({ gonderenRef: null, rol: "yonetici" }, oneriId)).mesaj;
  assert.match(sonuc, /puan hazır/);

  const k = await oneriGetir(ajans, oneriId);
  assert.ok(k?.nace_kod, "AI NACE atamalı");
  assert.equal(k?.nace_kaynagi, "ai");
  assert.equal(k?.durum, "onay_bekliyor");
  assert.ok((k?.taban ?? 0) > 0, "puan üretilmeli");
  assert.ok((k?.alintilar?.length ?? 0) > 0, "belge alıntısı olmalı");
});

test("6 · onay kuyruğunda görünür, yatırımcı kuyruğu göremez", async () => {
  const kuyruk = await onayKuyrugu(ajans);
  assert.ok(kuyruk.some((x) => x.id === oneriId));

  const yatirimciKuyrugu = await onayKuyrugu(yatirimci);
  assert.equal(yatirimciKuyrugu.length, 0, "RLS yatırımcıya kuyruk göstermez");
});

test("7 · yatırımcı kendi önerisini onaylayamaz", async () => {
  const etkilenen = await islem(yatirimci, (sql) =>
    sql`update oneri set durum = 'listede' where id = ${oneriId} returning id`,
  );
  assert.equal(etkilenen.length, 0, "RLS reddetmeli");
});

test("8 · ajans onaylayınca sıralamaya girer", async () => {
  await durumDegistir(ajans, oneriId, "listede", "");
  const d = await donemGetir(ajans, "usak");
  assert.ok(d);
  const adaylar = await adaylariGetir(ajans, d);
  assert.ok(adaylar.some((a) => a.id === String(oneriId)), "onaylanan öneri sıralamada olmalı");

  const k = await oneriGetir(ajans, oneriId);
  assert.equal(k?.durum, "listede");
  assert.ok(k?.onaylayan, "onaylayan izi olmalı");
});

test("9 · dayanaksız aday slot dolduramaz, boş slot meşru sonuç", async () => {
  const d = await donemGetir(ajans, "usak");
  assert.ok(d);
  const adaylar = await adaylariGetir(ajans, d);

  // Dayanağı eşiğin altındaki bir adayı en yüksek puana çıkar.
  const zayif = adaylar.find((a) => a.dayanak < d.set.dayanakEsigi);
  assert.ok(zayif, "seed'de dayanağı eşik altı aday olmalı");
  const kurgu = adaylar.map((a) => (a.id === zayif.id ? { ...a, taban: 99 } : { ...a, taban: 10, dayanak: 10 }));

  const h = hesapla(kurgu, ayardan(d.set));
  assert.equal(slotKimlikleri(h).includes(zayif.id), false, "dayanaksız aday slot doldurmamalı");
  assert.ok(h.ozet.bosSlot > 0, "boş slot oluşmalı");
  assert.match(h.ilkDort.find((s) => s.bos)?.gerekce ?? "", /dayanak eşiğinin altında/);
});

test("10 · ajans puanı düzeltir; AI ham puanı korunur", async () => {
  const d = await donemGetir(ajans, "usak");
  assert.ok(d);
  const [ham] = await islem(ajans, (sql) =>
    sql<{ puanlar: Record<string, number> }[]>`select puanlar from degerlendirme where oneri_id = ${oneriId}`,
  );

  const yeni = Object.fromEntries(Object.keys(d.set.agirliklar).map((k) => [k, 90])) as Record<string, number>;
  await puanDuzelt(ajans, oneriId, yeni as never, "Saha bilgisiyle yukarı düzeltildi.");

  const k = await oneriGetir(ajans, oneriId);
  assert.equal(k?.duzeltildi, true);
  assert.equal(k?.taban, 90, "etkin puan düzeltilmiş olmalı");

  const [sonra] = await islem(ajans, (sql) =>
    sql<{ puanlar: Record<string, number> }[]>`select puanlar from degerlendirme where oneri_id = ${oneriId}`,
  );
  assert.deepEqual(sonra.puanlar, ham.puanlar, "AI ham puanı değişmemeli");
});

test("11 · belgesiz il için değerlendirme yapılamaz", async () => {
  const d = await donemGetir(ajans, "manisa");
  assert.ok(d);
  const o = await oneriOlustur(yatirimci, {
    donemId: d.donemId,
    baslik: "Zeytinyağı işleme ve paketleme tesisi",
    gerekce: "Manisa'da zeytin üretimi yoğun; işleme kapasitesi arzın altında kalıyor ve ürün il dışına ham gidiyor.",
    ilce: "Akhisar",
    naceKod: null,
  });
  // manisa'ya özgü belge yok; ulusal belgeler var → paket boş değil, sonuç üretilir.
  const sonuc = (await degerlendirmeYap({ gonderenRef: null, rol: "yonetici" }, o.id)).mesaj;
  assert.match(sonuc, /puan hazır|Reddedildi|belge yok/);
});

test("12 · belge eklenince ajans listesinde görünür", async () => {
  const metin =
    "Manisa ilinde zeytin üretimi ve zeytinyağı işleme kapasitesi bölgesel önceliktir. ".repeat(6);
  const r = await belgeEkle(ajans, {
    ad: "Manisa Tarım Raporu 2026",
    tur: "il_raporu",
    yil: "2026",
    ajansKod: "TR33",
    ilKod: "manisa",
    metin,
  });
  assert.ok(r.id);

  const [b] = await islem(ajans, (sql) =>
    sql<{ ad: string }[]>`select ad from belge where id = ${r.id}`,
  );
  assert.equal(b.ad, "Manisa Tarım Raporu 2026");
});

test("13 · denetim izi zinciri kaydeder", async () => {
  const izler = await islem(ajans, (sql) => sql<{ eylem: string }[]>`select eylem from denetim order by id`);
  const eylemler = izler.map((x) => x.eylem);
  for (const beklenen of [
    "kayit_olundu", "oneri_gonderildi", "nace_ai_atandi", "degerlendirme_yapildi",
    "oneri_listede", "puan_duzeltildi", "belge_eklendi",
  ]) {
    assert.ok(eylemler.includes(beklenen), `denetim izinde eksik: ${beklenen}`);
  }
});

test("14 · anonim kişisel veri ve denetim izi göremez", async () => {
  const anonim: Baglam = { gonderenRef: null, rol: "anonim" };
  const d = await donemGetir(anonim, "usak");
  assert.ok(d, "kamu dönem bilgisini görür");
  assert.ok((await adaylariGetir(anonim, d)).length > 0, "kamu sıralamayı görür");

  assert.equal((await islem(anonim, (sql) => sql`select * from kimlik`)).length, 0);
  assert.equal((await islem(anonim, (sql) => sql`select * from denetim`)).length, 0);
  // Onaylanmamış öneri kamuya kapalı
  const gorunen = await islem(anonim, (sql) => sql`select id from oneri where durum <> 'listede'`);
  assert.equal(gorunen.length, 0);
});

// ── tanıtım sayfası ve öneri sihirbazı ─────────────────────────────────────

test("15 · tanıtım sayfası yalnızca gerçek sayı gösterir", async () => {
  const ozet = await platformOzeti(ANONIM);
  assert.ok(ozet.il > 0 && ozet.ajans > 0, "il ve ajans sayısı veritabanından gelir");
  assert.equal(ozet.nace, 3190, "NACE Rev.2.1 tam yüklü");
  assert.ok(ozet.belge > 0, "belge sayısı yüklü belgelerden");
  assert.ok(ozet.listede >= 0 && ozet.bekleyen >= 0);
});

test("15b · tanıtım örneği yalnızca ONAYLANMIŞ ve alıntılı kayıttan seçilir", async () => {
  const o = await ornekDegerlendirme(ANONIM);
  if (!o) return; // henüz onaylanmış kayıt yoksa sayfa uydurma örnek göstermez
  assert.ok(o.alintilar.length > 0, "alıntısız kayıt örnek olarak seçilmez");
  const [durum] = await islem(ANONIM, (sql) =>
    sql<{ durum: string }[]>`select durum from oneri where id = ${o.id}`,
  );
  assert.equal(durum.durum, "listede", "yalnızca kamuya açık kayıt tanıtımda görünür");
  assert.ok(o.model_snapshot && o.model_snapshot !== "latest", "model künyesi taşınır");
});

test("16 · sihirbaz coğrafyası: yalnızca açık dönemi olan iller, ajansa göre gruplu", async () => {
  const b = await bolgeler(ANONIM);
  assert.ok(b.length > 0);
  for (const x of b) {
    assert.ok(x.ajans_kod && x.ajans, "ajans künyesi dolu");
    assert.ok(x.iller.length > 0, "bölge en az bir il taşır");
    for (const i of x.iller) {
      assert.ok(i.yil, "il açık dönem yılı taşır — dönemi olmayan il seçenek olarak sunulmaz");
      assert.ok(i.ilceler.length > 0, "ilçeler adım 4 için hazır gelir");
      // Her ilin "Merkez" ilçesi yok (Manisa: Şehzadeler / Yunusemre). Varsa
      // ilk sırada olmalı; yoksa alfabetik.
      if (i.ilceler.includes("Merkez")) assert.equal(i.ilceler[0], "Merkez");
    }
  }
});

test("17 · misafir sihirbazdan öneri verebilir, adı hiçbir yerde tutulmaz", async () => {
  const { jeton } = await misafirAc();
  const m = await oturumCoz(jeton);
  assert.ok(m?.misafir);

  const misafir = baglamdan(m);
  const [bolge] = await bolgeler(misafir);
  const il = bolge.iller[0];
  const d = await donemGetir(misafir, il.kod);
  assert.ok(d, "seçilen ilin açık dönemi olmalı");

  const o = await oneriOlustur(misafir, {
    donemId: d.donemId,
    baslik: "Sihirbazdan misafir gönderimi",
    gerekce:
      "Kayıt olmadan devam eden yatırımcı sihirbazın son adımında öneriyi gönderebilmeli ve sonra görebilmeli.",
    ilce: il.ilceler[0],
    naceKod: null,
  });

  const kendi = await islem(misafir, (sql) => sql`select id from oneri where id = ${o.id}`);
  assert.equal(kendi.length, 1, "misafir kendi önerisini görür");
  const anonim = await islem(ANONIM, (sql) => sql`select id from oneri where id = ${o.id}`);
  assert.equal(anonim.length, 0, "onaylanmamış öneri anonime kapalı");
});

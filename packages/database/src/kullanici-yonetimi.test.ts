import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { ANONIM, islem, kapat, sahip, type Baglam } from "./baglanti.ts";
import { sifirla, yukari } from "./migrate.ts";
import { kullaniciEkle, kullaniciGuncelle } from "./kullanici-yonetimi.ts";
import { girisYap, kayitliKullanicilar, kimlikSil, oturumCoz } from "./sorgu.ts";

let yonetici: Baglam;
const hesap = { eposta: "yeni@example.test", adSoyad: "Test Kullanıcı", parola: "test-parolasi-123", rol: "ajans" as const, ajansKod: "TEST" };

before(async () => {
  await sifirla({ test: true });
  await yukari();
  const [k] = await sahip()<{ ref: string }[]>`insert into gonderen (rol) values ('yonetici') returning ref`;
  yonetici = { gonderenRef: k.ref, rol: "yonetici" };
  await sahip()`insert into ajans (kod, ad) values ('TEST', 'Test Ajansı')`;
});

after(async () => { await kapat(); });

test("kullanıcı ekleme ve güncelleme yalnızca yöneticiye açık", async () => {
  assert.equal((await kullaniciEkle(ANONIM, hesap)).ok, false);
  assert.equal((await kullaniciGuncelle(ANONIM, yonetici.gonderenRef!, { adSoyad: "Yeni Ad", eposta: "" })).ok, false);
  assert.equal((await sahip()`select * from kimlik`).length, 0);
});

test("geçersiz kullanıcı alanları ve ajans bölgesi kayıt oluşturmaz", async () => {
  for (const g of [
    { ...hesap, eposta: "gecersiz" },
    { ...hesap, adSoyad: "ab" },
    { ...hesap, parola: "kisa" },
    { ...hesap, ajansKod: null },
    { ...hesap, ajansKod: "YOK" },
  ]) assert.equal((await kullaniciEkle(yonetici, g)).ok, false);
  assert.equal((await sahip()`select * from kimlik`).length, 0);
});

test("hesap ekleme oturum oluşturmaz; rol, bölge ve parola ile giriş çalışır", async () => {
  assert.equal((await kullaniciEkle(yonetici, { ...hesap, eposta: " YENI@example.test " })).ok, true);
  assert.equal((await sahip()`select * from oturum`).length, 0);
  const giris = await girisYap(hesap.eposta, hesap.parola);
  assert.ok(giris.ok);
  assert.equal((await oturumCoz(giris.jeton))?.rol, "ajans");
  const [k] = await kayitliKullanicilar(yonetici);
  assert.equal(k.ajans_kod, "TEST");
  assert.equal(k.eposta_maske, "y****@example.test");
});

test("aynı e-posta reddedilince gönderen kaydı da geri alınır", async () => {
  const once = await sahip()`select ref from gonderen`;
  assert.equal((await kullaniciEkle(yonetici, hesap)).ok, false);
  assert.equal((await sahip()`select ref from gonderen`).length, once.length);
});

test("kısmi güncelleme boş alanı ve parolayı korur; denetim kişisel veri içermez", async () => {
  const [k] = await kayitliKullanicilar(yonetici);
  assert.equal((await kullaniciGuncelle(yonetici, k.ref, { adSoyad: "Yeni Kullanıcı", eposta: "" })).ok, true);
  const [kimlik] = await islem(yonetici, (sql) => sql`select eposta::text, ad_soyad from kimlik where gonderen_ref = ${k.ref}`);
  assert.equal(kimlik.eposta, hesap.eposta);
  assert.equal(kimlik.ad_soyad, "Yeni Kullanıcı");
  assert.equal((await kullaniciGuncelle(yonetici, k.ref, { adSoyad: "", eposta: "guncel@example.test" })).ok, true);
  assert.equal((await girisYap(hesap.eposta, hesap.parola)).ok, false);
  assert.equal((await girisYap("guncel@example.test", hesap.parola)).ok, true);
  const izler = await sahip()`select aktor_ref, detay from denetim where eylem in ('kullanici_eklendi', 'kullanici_guncellendi')`;
  assert.equal(izler.length, 3);
  assert.ok(izler.every((i) => i.aktor_ref === yonetici.gonderenRef));
  assert.ok(!JSON.stringify(izler).includes("example.test"));
  assert.ok(!JSON.stringify(izler).includes("Yeni Kullanıcı"));
});

test("çakışan güncelleme atomik reddedilir; silinen hesap canlandırılmaz", async () => {
  assert.equal((await kullaniciEkle(yonetici, { ...hesap, eposta: "diger@example.test", rol: "yatirimci" })).ok, true);
  const liste = await kayitliKullanicilar(yonetici);
  const k = liste.find((u) => u.rol === "ajans")!;
  assert.equal((await kullaniciGuncelle(yonetici, k.ref, { adSoyad: "Yazılmamalı", eposta: "DIGER@example.test" })).ok, false);
  const [kimlik] = await islem(yonetici, (sql) => sql`select ad_soyad from kimlik where gonderen_ref = ${k.ref}`);
  assert.equal(kimlik.ad_soyad, "Yeni Kullanıcı");
  await kimlikSil(yonetici, k.ref);
  assert.equal((await kullaniciGuncelle(yonetici, k.ref, { adSoyad: "Yeni Ad", eposta: "" })).ok, false);
  assert.equal((await girisYap("guncel@example.test", hesap.parola)).ok, false);
  const [g] = await sahip()`select ref from gonderen where ref = ${k.ref}`;
  assert.ok(g, "kimlik silinirken değişmez gönderen anahtarı korunur");
});

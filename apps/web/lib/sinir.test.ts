import assert from "node:assert/strict";
import test from "node:test";
import { icYol, ipBilinir, ipKaydet, ipSec, siraBekle, sinirAsildi, sinirDolu, sinirGeriAl, sinirSay } from "./sinir.ts";

test("yalnızca sayılan denemeler sınırı doldurur; sormak saymaz", () => {
  const k = `say-${Math.random()}`;
  for (let i = 0; i < 5; i++) assert.equal(sinirDolu(k, 2, 1000, 100 + i), false);
  sinirSay(k, 1000, 200);
  sinirSay(k, 1000, 201);
  assert.equal(sinirDolu(k, 2, 1000, 202), true);
  assert.equal(sinirDolu(k, 2, 1000, 1300), false, "pencere dolunca açılır");
});

test("başarılı deneme geri alınır, sayaç dolmaz", () => {
  const k = `geri-${Math.random()}`;
  for (let i = 0; i < 5; i++) {
    sinirSay(k, 1000, 100 + i);
    sinirGeriAl(k);
  }
  assert.equal(sinirDolu(k, 1, 1000, 110), false);
});

test("yönlendirme hedefi yalnızca uygulama içi yol olabilir", () => {
  assert.equal(icYol("/oneri/12?a=1"), "/oneri/12?a=1");
  for (const kotu of [
    "//evil.example", "/\\evil.example", "/\t/evil.example", "https://evil.example", "", "oneri",
    "/.//evil.example", "/%2e//evil.example", "/a/..//evil.example",
  ]) {
    assert.equal(icYol(kotu), null, JSON.stringify(kotu));
  }
});

test("kısa pencereli bir sınırın temizliği uzun pencereli sayacı silmez", () => {
  const uzun = `uzun-${Math.random()}`;
  const t0 = 1_000_000_000;
  assert.equal(sinirAsildi(uzun, 1, 60 * 60_000, t0), false);
  // 11 dakika sonra 10 dakikalık başka bir sınır, temizliği tetikler.
  sinirAsildi(`kisa-${Math.random()}`, 5, 10 * 60_000, t0 + 11 * 60_000);
  assert.equal(sinirAsildi(uzun, 1, 60 * 60_000, t0 + 12 * 60_000), true, "saatlik sayaç hâlâ dolu");
});

test("kayan pencere: limit kadar geçer, sonra reddeder, pencere dolunca açılır", () => {
  const k = `t-${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(sinirAsildi(k, 3, 1000, 10_000 + i), false);
  assert.equal(sinirAsildi(k, 3, 1000, 10_010), true);
  assert.equal(sinirAsildi(k, 3, 1000, 11_005), false, "pencere dışına çıkan izler sayılmaz");
});

test("farklı anahtarlar birbirini engellemez", () => {
  const a = `a-${Math.random()}`;
  const b = `b-${Math.random()}`;
  assert.equal(sinirAsildi(a, 1, 1000, 5), false);
  assert.equal(sinirAsildi(a, 1, 1000, 6), true);
  assert.equal(sinirAsildi(b, 1, 1000, 7), false);
});

test("IP güvenilir proxy'nin eklediği değerden alınır, istemcinin yazdığından değil", () => {
  assert.equal(ipSec("6.6.6.6, 203.0.113.9", 1), "203.0.113.9");
  assert.equal(ipSec("203.0.113.9", 1), "203.0.113.9");
  assert.equal(ipSec(null, 1), "bilinmiyor");
});

test("kısa pencereli bir sınırın temizliği uzun pencereli sayacı silmez", () => {
  const uzun = `uzun-${Math.random()}`;
  const t0 = 1_000_000_000;
  assert.equal(sinirAsildi(uzun, 1, 60 * 60_000, t0), false);
  // 11 dakika sonra 10 dakikalık başka bir sınır temizliği tetikler.
  sinirAsildi(`kisa-${Math.random()}`, 5, 10 * 60_000, t0 + 11 * 60_000);
  assert.equal(sinirAsildi(uzun, 1, 60 * 60_000, t0 + 12 * 60_000), true, "saatlik sayaç hâlâ dolu");
});

test("sıra eşzamanlı çağrıları ardışık işler, kimseyi reddetmez", async () => {
  const k = `sira-${Math.random()}`;
  const t0 = Date.now();
  const bitis: number[] = [];
  await Promise.all([1, 2, 3].map(() => siraBekle(k, 40).then(() => bitis.push(Date.now() - t0))));
  assert.equal(bitis.length, 3, "üç çağrı da tamamlanır");
  assert.ok(Math.max(...bitis) >= 110, `ardışık: ${bitis.join(",")}`);
});

test("sıra sınırlı: doluysa fazlası reddedilir", async () => {
  const k = `dolu-${Math.random()}`;
  const sonuc = await Promise.all([1, 2, 3, 4].map(() => siraBekle(k, 10, 2)));
  assert.deepEqual(sonuc.filter(Boolean).length, 2, "yalnızca iki bekleyen kabul edilir");
});

test("başarılı giriş yapılan IP bilinir", () => {
  const h = `h-${Math.random()}`;
  assert.equal(ipBilinir(h, "203.0.113.9"), false);
  ipKaydet(h, "203.0.113.9");
  assert.equal(ipBilinir(h, "203.0.113.9"), true);
  assert.equal(ipBilinir(h, "198.51.100.1"), false);
});

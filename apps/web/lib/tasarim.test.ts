import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import test from "node:test";

/**
 * Tasarım sistemi koruması.
 *
 * Referans: `design_handoff_ykh_kdp/README.md` — §1 değişmez kurallar,
 * §2 token'lar, §4 epistemik gramer. Bu dosya o kuralların makineyle
 * denetlenebilen kısmını tutar.
 *
 * Buradaki testler estetik yargı vermiyor; SESSİZ kırılmaları yakalıyor.
 * Yaşanmış kusur: `.panel-koyu a` (özgüllük 0,1,1) `.dugme-ters` (0,1,0)
 * yardımcı sınıfını ezdi ve landing'in iki birincil düğmesi #EDE9E0 metin /
 * #F6F4EF zemin, yani 1.09:1 kontrastla görünmez kaldı.
 */

const KOK = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CSS = join(KOK, "app", "globals.css");

async function tsxDosyalari(dizin: string): Promise<string[]> {
  const out: string[] = [];
  for (const g of await readdir(dizin, { withFileTypes: true })) {
    const yol = join(dizin, g.name);
    if (g.isDirectory()) out.push(...(await tsxDosyalari(yol)));
    else if (extname(g.name) === ".tsx") out.push(yol);
  }
  return out;
}

test("globals.css: bileşen sınıfı içindeki eleman seçicisi :where() ile sarılı", async () => {
  const css = await readFile(CSS, "utf8");

  /**
   * `.sinif eleman { … }` biçimi yardımcı sınıfları ezer (özgüllük 0,1,1 >
   * 0,1,0) ve Tailwind ile kurulu bir arayüzde sessiz kırılma üretir.
   * `:where()` özgüllüğü sıfırlar, yardımcı sınıf kazanır.
   */
  const tehlikeli = [...css.matchAll(/^\.[a-z-]+\s+([a-z]+)\s*\{/gm)]
    .map((m) => m[0].trim())
    .filter((k) => !k.includes(":where("));

  assert.deepEqual(
    tehlikeli,
    [],
    `Bileşen sınıfı içinde çıplak eleman seçicisi: ${tehlikeli.join(", ")}. ` +
      ":where() ile sar — yardımcı sınıfı ezmesin.",
  );
});

test("globals.css: yalnızca handoff §2'de tanımlı animasyonlar", async () => {
  const css = await readFile(CSS, "utf8");
  // §2: "Animasyon: sheetIn/drawerIn/ledgerIn 180–200ms ease-out … veilIn 160ms.
  //      Başka animasyon yok."
  const IZINLI = new Set(["sheetIn", "drawerIn", "ledgerIn", "veilIn"]);
  const tanimli = [...css.matchAll(/@keyframes\s+([A-Za-z][\w-]*)/g)].map((m) => m[1]);
  const fazla = tanimli.filter((a) => !IZINLI.has(a));

  assert.deepEqual(
    fazla,
    [],
    `Handoff §2 dışı animasyon: ${fazla.join(", ")}. Hareket yalnızca durum ` +
      "değişimini anlaşılır kılmak için (§1.10); dekoratif giriş animasyonu yok.",
  );
});

test("handoff §1.8 yasakları: gölge, gradyan, 3px üstü köşe yok", async () => {
  const css = await readFile(CSS, "utf8");
  const yaricap = [...css.matchAll(/--radius-[\w-]+:\s*(\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(yaricap.length > 0, "yarıçap ölçeği tanımlı olmalı");
  assert.ok(Math.max(...yaricap) <= 3, `border-radius > 3px yasak: ${Math.max(...yaricap)}px`);

  const golge = [...css.matchAll(/--shadow-[\w-]+:\s*([^;]+);/g)].map((m) => m[1].trim());
  assert.ok(
    golge.every((g) => g === "none"),
    `gölge yasak, şu değerler bulundu: ${golge.filter((g) => g !== "none").join(", ")}`,
  );

  // Dekoratif gradyan yasak; doku için `repeating-linear-gradient` meşru
  // (handoff §2 doku utility'leri bu biçimde tanımlı).
  const gradyan = [...css.matchAll(/(?<!repeating-)linear-gradient\(/g)];
  assert.equal(gradyan.length, 0, "dekoratif gradyan yasak (§1.8)");
});

test("sabit açık renk metin yalnızca koyu panelde meşru", async () => {
  const dosyalar = [
    ...(await tsxDosyalari(join(KOK, "app"))),
    ...(await tsxDosyalari(join(KOK, "components"))),
  ];

  /**
   * Sabit hex metin rengi temayla DÖNMEZ; token zemin döner. İkisi aynı
   * elemanda buluşunca koyu temada açık-üstüne-açık çıkıyor. Kural:
   * sabit açık renk metin yalnızca `panel-koyu` (her iki temada koyu) veya
   * `dugme-ters` (zemini de sabit) taşıyan satırda olabilir.
   */
  const ACIK = /text-\[#([0-9A-Fa-f]{6})\]/g;
  const acikMi = (hex: string) => {
    const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
    const l = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b) > 0.4;
  };

  /**
   * JSX ataları girintiyle takip ediliyor: `panel-koyu` taşıyan satırın
   * girintisinden DAHA DERİN satırlar o panelin içindedir. Prettier tutarlı
   * girinti ürettiği için bu güvenilir; satır düzeyi kontrol yetmiyordu çünkü
   * sınıf birkaç satır yukarıdaki atada duruyor.
   */
  const ihlal: string[] = [];
  for (const f of dosyalar) {
    const satirlar = (await readFile(f, "utf8")).split("\n");
    /** Açık koyu panellerin girintileri. Tek değişken yetmez: iç içe panel
     *  (koyu bölüm içinde ters düğme) dıştakini ezip kapanışta ikisini de
     *  düşürüyordu. */
    const panel: number[] = [];

    for (const [i, satir] of satirlar.entries()) {
      const girinti = satir.search(/\S/);
      if (girinti === -1) continue;
      while (panel.length && girinti <= panel[panel.length - 1]) panel.pop();
      if (/panel-koyu|dugme-ters/.test(satir)) panel.push(girinti);

      if (panel.length) continue;
      for (const m of satir.matchAll(ACIK)) {
        if (!acikMi(m[1])) continue;
        ihlal.push(`${f.split(/[\/]/).slice(-2).join("/")}:${i + 1} → ${m[0]}`);
      }
    }
  }

  assert.deepEqual(
    ihlal,
    [],
    `Sabit açık renk metin koyu panel dışında:\n  ${ihlal.join("\n  ")}\n` +
      "Token kullan (text-paper) veya elemanı panel-koyu içine al.",
  );
});

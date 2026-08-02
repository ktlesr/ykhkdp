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

test("globals.css: handoff §2 animasyonları + kapsanmış hero istisnası", async () => {
  const css = await readFile(CSS, "utf8");
  // §2: "Animasyon: sheetIn/drawerIn/ledgerIn 180–200ms ease-out … veilIn 160ms.
  //      Başka animasyon yok."
  //
  // TEK İSTİSNA, kullanıcı kararıyla: tanıtım hero'su. `hero` önekli
  // keyframe'ler serbest ama ADRESİ SABİT — yalnızca `.hero-*` seçicilerinde
  // kullanılabilirler. Ürünün geri kalanı §2'de kalır. Kural kalkmadı,
  // kapsamı yazıldı; bir gün bir tablo `heroNabiz` kullanmaya kalkarsa
  // aşağıdaki ikinci assert kırılır.
  const IZINLI = new Set(["sheetIn", "drawerIn", "ledgerIn", "veilIn"]);
  const tanimli = [...css.matchAll(/@keyframes\s+([A-Za-z][\w-]*)/g)].map((m) => m[1]);
  const fazla = tanimli.filter((a) => !IZINLI.has(a) && !a.startsWith("hero"));

  assert.deepEqual(
    fazla,
    [],
    `Handoff §2 dışı animasyon: ${fazla.join(", ")}. Hareket yalnızca durum ` +
      "değişimini anlaşılır kılmak için (§1.10); dekoratif giriş animasyonu yok.",
  );

  // Hero animasyonları hero dışında ÇAĞRILAMAZ.
  const heroAdlari = tanimli.filter((a) => a.startsWith("hero"));
  assert.ok(heroAdlari.length > 0, "istisna kullanılmıyorsa kaldırılmalı");

  const kacak: string[] = [];
  for (const kural of css.split("}")) {
    const [secici, govde = ""] = kural.split("{");
    // `String.raw`: düz şablonda `\b` KELİME SINIRI DEĞİL, backspace karakteri
    // (U+0008) olur ve regex hiçbir zaman eşleşmez — kontrol sessizce hep
    // geçerdi. Bu dosyanın işi sessiz kırılmayı yakalamak; kendisi sessizce
    // geçemez.
    if (!heroAdlari.some((a) => new RegExp(String.raw`animation[^;]*\b${a}\b`).test(govde))) continue;
    if (!/\.hero-/.test(secici)) kacak.push(secici.trim().slice(0, 60));
  }
  assert.deepEqual(kacak, [], `Hero animasyonu hero dışında: ${kacak.join(", ")}`);
});

test("hero istisnası TEK YÜZEYE kapsanmış: glow başka yerde yok", async () => {
  /**
   * Handoff §1.8 glow'u yasaklıyor. Tanıtım hero'su için gevşetildi ama
   * gevşeme sızmamalı: `filter`, `drop-shadow` ve `box-shadow` yalnızca
   * `.hero-*` seçicilerinde durabilir.
   *
   * Yaşanmış risk şu: bir istisna açıldığında ikinci kullanım "zaten var"
   * diye gelir ve üçüncüde kural fiilen ölmüş olur. Test istisnanın
   * adresini tutuyor.
   */
  const css = await readFile(CSS, "utf8");
  const kacak: string[] = [];
  for (const kural of css.split("}")) {
    const [secici, govde = ""] = kural.split("{");
    if (!/(^|[\s;])(filter|box-shadow)\s*:|drop-shadow\(/.test(govde)) continue;
    if (!/\.hero-/.test(secici)) kacak.push(`${secici.trim().slice(0, 48)} → ${govde.trim().slice(0, 40)}`);
  }
  assert.deepEqual(kacak, [], `Glow/gölge hero dışında (§1.8): ${kacak.join(" · ")}`);
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
  // (handoff §2 doku utility'leri bu biçimde tanımlı). Hero istisnası burada
  // da KAPSANMIŞ: gradyan yalnızca `.hero-*` seçicisinde ve yalnızca maske
  // olarak kullanılabilir — zemin boyamak için değil.
  const gradyanlar: string[] = [];
  for (const kural of css.split("}")) {
    const [secici, govde = ""] = kural.split("{");
    if (!/(?<!repeating-)linear-gradient\(/.test(govde)) continue;
    if (!/\.hero-/.test(secici) || !/mask-image/.test(govde)) {
      gradyanlar.push(secici.trim().slice(0, 48));
    }
  }
  assert.deepEqual(gradyanlar, [], `dekoratif gradyan yasak (§1.8): ${gradyanlar.join(", ")}`);
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

// ── renk paleti varyasyonları ──────────────────────────────────────────────

/**
 * Palet doğrulaması.
 *
 * Eşikler handoff'un KENDİ ulaştığı değerlerden alınır, sabit yazılmaz: kural
 * "handoff'tan kötü olamaz". Sabit yazıldığında (0.091) handoff'un kendisi
 * kendi testini geçemiyordu — gerçek değer 0.09099…
 */
const HANDOFF_EPIS = {
  verified: "#1D5B4A",
  unverif: "#8A6A1F",
  absent: "#6B6259",
  conflict: "#8C2F24",
};

function oklab(hex: string): [number, number, number] {
  const [r, g, b] = [0, 2, 4]
    .map((i) => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const dE = (x: string, y: string) => {
  const a = oklab(x);
  const b = oklab(y);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};
const lum = (hex: string) =>
  [0, 2, 4]
    .map((i) => Number.parseInt(hex.replace("#", "").slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((t, c, i) => t + [0.2126, 0.7152, 0.0722][i] * c, 0);
const kontrast = (x: string, y: string) => {
  const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p);
  return (a + 0.05) / (b + 0.05);
};

/** `[data-palet="…"]` bloklarındaki token'ları çıkarır. */
async function paletTokenlari(): Promise<Map<string, Record<string, string>>> {
  const css = await readFile(CSS, "utf8");
  const out = new Map<string, Record<string, string>>();
  for (const m of css.matchAll(/\[data-palet="([\w-]+)"\]\s*\{([^}]*)\}/g)) {
    out.set(
      m[1],
      Object.fromEntries([...m[2].matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((x) => [x[1], x[2]])),
    );
  }
  return out;
}

test("her palet epistemik dörtlüyü handoff'tan kötü olmayacak şekilde taşır", async () => {
  const epis = Object.values(HANDOFF_EPIS);
  let temelCift = Number.POSITIVE_INFINITY;
  for (let i = 0; i < epis.length; i++) {
    for (let j = i + 1; j < epis.length; j++) temelCift = Math.min(temelCift, dE(epis[i], epis[j]));
  }

  const paletler = await paletTokenlari();
  assert.ok(paletler.size > 0, "en az bir palet tanımlı olmalı");

  for (const [id, t] of paletler) {
    const dortlu = ["verified", "unverif", "absent", "conflict"].map((k) => {
      assert.ok(t[k], `${id}: --color-${k} eksik`);
      return [k, t[k]] as const;
    });

    // 1. Kontrast — epistemik renkler ve yardımcı metin renkleri
    for (const [k, v] of [...dortlu, ["ink-soft", t["ink-soft"]], ["ink-mute", t["ink-mute"]]] as const) {
      for (const zemin of ["surface", "paper", "page"] as const) {
        if (!t[zemin] || !v) continue;
        const c = kontrast(v, t[zemin]);
        assert.ok(c >= 4.5, `${id}: ${k} / ${zemin} kontrast ${c.toFixed(2)}:1 (eşik 4.5)`);
      }
    }

    // 2. Gövde metni
    assert.ok(
      kontrast(t.ink, t.page) >= 4.5,
      `${id}: gövde metni kontrastı ${kontrast(t.ink, t.page).toFixed(2)}:1`,
    );

    // 3. Epistemik renkler birbirinden — handoff'un kendi ayrışmasından kötü olamaz
    for (let i = 0; i < dortlu.length; i++) {
      for (let j = i + 1; j < dortlu.length; j++) {
        const d = dE(dortlu[i][1], dortlu[j][1]);
        assert.ok(
          d >= temelCift,
          `${id}: ${dortlu[i][0]}↔${dortlu[j][0]} ΔE ${d.toFixed(3)} < handoff ${temelCift.toFixed(3)}`,
        );
      }
    }
  }
});

test("palet yalnızca rengi değiştirir — yarıçap, gölge, animasyon paletsiz", async () => {
  const css = await readFile(CSS, "utf8");
  for (const m of css.matchAll(/\[data-palet="([\w-]+)"\]\s*\{([^}]*)\}/g)) {
    const govde = m[2];
    const renkDisi = [...govde.matchAll(/--(?!color-)[\w-]+:/g)].map((x) => x[0]);
    assert.deepEqual(
      renkDisi,
      [],
      `${m[1]}: palet bloğu renk dışı token taşıyor (${renkDisi.join(", ")}). ` +
        "Tipografi, yarıçap, gölge ve hareket handoff §1–§2'de kalır.",
    );
  }
});

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import test from "node:test";

/**
 * Route erişim koruması — hangi ekran kimin.
 *
 * Öneri gizliliği RLS'te duruyor ve veri testleriyle kanıtlı. Ama iki ekran
 * bunun ÜSTÜNDE bir ürün kararı taşıyor: `/iller` ve `/il/[il]` sayıları ve
 * sıralamayı öneri kümesinden türetiyor, dolayısıyla bir yatırımcı için
 * eksik — yani yanlış — olurdu. O yüzden veri katmanı değil SAYFA kapatıyor.
 *
 * Sayfa kapısı JSX içinde bir satır; sessizce silinebilir ve hiçbir veri
 * testi kırılmaz. Bu dosya o satırın varlığını kaynak metinden ölçer.
 *
 * Yönlendirme hedefi de ölçülüyor: yetkisiz kullanıcıyı `/iller`'e yollamak
 * artık sonsuz sekme üretir (oraya da giremez). Hedef `/oneri` olmalı —
 * yatırımcının giriş noktası sihirbazdır.
 */

const KOK = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const APP = join(KOK, "app");

/** Rolü olmayan kullanıcıya kapalı ekranlar ve kapının biçimi. */
const AJANS_EKRANLARI = ["iller/page.tsx", join("il", "[il]", "page.tsx")];
const YETKI_EKRANLARI = ["onay/page.tsx", "belgeler/page.tsx", "ayarlar/page.tsx"];

async function tsxDosyalari(dizin: string): Promise<string[]> {
  const out: string[] = [];
  for (const g of await readdir(dizin, { withFileTypes: true })) {
    const yol = join(dizin, g.name);
    if (g.isDirectory()) out.push(...(await tsxDosyalari(yol)));
    else if (extname(g.name) === ".tsx") out.push(yol);
  }
  return out;
}

test("il listesi ve il sıralaması yalnızca ajans ve yöneticiye açık", async () => {
  for (const ekran of AJANS_EKRANLARI) {
    const kaynak = await readFile(join(APP, ekran), "utf8");
    assert.match(
      kaynak,
      /if \(!k \|\| !onaylayabilir\(k\.rol\)\) redirect\("\/oneri"\);/,
      `${ekran}: rol kapısı yok — yatırımcı başkalarının önerilerinden türeyen sayıları görür`,
    );
  }
});

test("yetkisiz kullanıcı /iller'e yönlendirilmez — sonsuz sekme olurdu", async () => {
  for (const ekran of [...AJANS_EKRANLARI, ...YETKI_EKRANLARI]) {
    const kaynak = await readFile(join(APP, ekran), "utf8");
    assert.doesNotMatch(kaynak, /redirect\("\/iller"\)/, `${ekran}: /iller'e yönlendiriyor`);
  }
});

test("öneri kaydı yatırımcıya yalnızca KENDİ önerisi için açılır", async () => {
  // RLS yatırımcıya `koken = 'mevcut'` resmî konuları da gösteriyor (onlar
  // kamuya açık tebliğ metni). Kayıt sayfası bunu ayrıca kapatıyor: resmî
  // konunun platform değerlendirmesi ajansın çalışmasıdır.
  const kaynak = await readFile(join(APP, "oneri", "[id]", "page.tsx"), "utf8");
  assert.match(kaynak, /if \(!ajans && o\.koken === "mevcut"\) notFound\(\);/);
});

test("yatırımcıya gösterilen hiçbir ekran /iller veya /il/ bağlantısı taşımaz", async () => {
  /**
   * Kapı çalışsa bile ölü bağlantı bir vaattir: kullanıcı tıklar, sihirbaza
   * düşer. Bağlantı yalnızca `onaylayabilir` koşulunun içinde durabilir.
   *
   * Ölçüm kaba ama yeterli: dosyada `/iller` veya `/il/${...}` geçiyorsa
   * dosyanın ya kendisi ajans ekranı olmalı ya da `onaylayabilir` çağırmalı.
   */
  const ajansEkrani = new Set(AJANS_EKRANLARI.concat(YETKI_EKRANLARI).map((x) => join(APP, x)));

  for (const yol of await tsxDosyalari(APP)) {
    if (ajansEkrani.has(yol)) continue;
    const kaynak = await readFile(yol, "utf8");
    const bagli = /href=\{?"?\/il(ler)?[/"`]/.test(kaynak) || /href=\{`\/il\//.test(kaynak);
    if (!bagli) continue;
    assert.match(
      kaynak,
      /onaylayabilir\(/,
      `${yol.slice(APP.length + 1)}: il bağlantısı var ama rol koşulu yok`,
    );
  }
});

test("öneri taşıyan hiçbir ekran arama motoruna açık değil", async () => {
  /**
   * Bir öneri başlığının paylaşım kartına ya da arama sonucuna düşmesi, RLS ile
   * kapattığımız gizliliği geri açar. `robots: KAPALI` JSX'te tek satır ve
   * sessizce silinebilir; hiçbir veri testi kırılmaz.
   *
   * Başlığın SABİT olması da ölçülüyor: dinamik bir başlık (önerinin kendi
   * adı) sekme adında, tarayıcı geçmişinde ve paylaşılan bağlantının
   * önizlemesinde görünürdü.
   */
  const KAPALI_EKRANLAR = [
    "iller/page.tsx",
    join("il", "[il]", "page.tsx"),
    join("oneri", "[id]", "page.tsx"),
    "onerilerim/page.tsx",
    "onay/page.tsx",
    "belgeler/page.tsx",
    "ayarlar/page.tsx",
  ];

  for (const ekran of KAPALI_EKRANLAR) {
    const kaynak = await readFile(join(APP, ekran), "utf8");
    assert.match(kaynak, /robots: KAPALI/, `${ekran}: arama motoruna açık kalmış`);
    assert.doesNotMatch(
      kaynak,
      /generateMetadata/,
      `${ekran}: dinamik başlık öneri adını sızdırabilir; sabit başlık kullan`,
    );
  }
});

test("sitemap ve robots yalnızca AÇIK yolları ilan eder", async () => {
  const { ACIK_YOLLAR } = await import("./site.ts");
  const yollar = ACIK_YOLLAR.map((x) => x.yol);

  // Öneri kümesinden türeyen hiçbir ekran ilan edilmemeli. Sitemap içeriği
  // vermese de bir adresin VARLIĞINI ve sayısını sızdırır.
  for (const gizli of ["/iller", "/il", "/oneri/", "/onerilerim", "/onay", "/belgeler", "/ayarlar", "/rapor"]) {
    assert.ok(
      !yollar.some((y) => y === gizli || y.startsWith(`${gizli}/`)),
      `${gizli} açık yollar listesinde — sitemap ve robots onu ilan eder`,
    );
  }
  assert.deepEqual(yollar, ["/", "/oneri", "/giris", "/kayit"]);

  /**
   * `Allow: /` kökle başlayan HER ŞEYİ açar ve beyaz listeyi geçersiz kılar.
   * Ölçüldü: gizli ekranların tamamı taranabilir hâle geliyordu. Kök için
   * `$` bağlayıcısı şart.
   */
  const robots = await readFile(join(APP, "robots.ts"), "utf8");
  assert.match(robots, /"\/\$"/, 'robots.ts kökü `/$` ile bağlamalı, düz `/` ile değil');
});

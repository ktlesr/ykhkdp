---
name: YKH-KDP
description: Yerel Kalkınma Hamlesi yatırım konusu önerileri için değerlendirme raporu — AI puanı taslak, alıntı izlenebilirlik, ajans onayı karar.
colors:
  cobalt: "#1d3fa8"
  cobalt-tint: "#eef1fb"
  cobalt-line: "#5a72c4"
  graphite-ink: "#16191d"
  ink-soft: "#475059"
  ink-mute: "#616a73"
  report-white: "#ffffff"
  paper: "#fafaf9"
  page: "#f3f4f2"
  field: "#ffffff"
  hairline: "#d3d6d2"
  hairline-soft: "#e6e8e5"
  verified: "#1d5b4a"
  verified-tint: "#eaf4f0"
  verified-line: "#2c7a64"
  unverif: "#8a6a1f"
  unverif-tint: "#fbf4e2"
  unverif-line: "#c9a557"
  absent: "#6b6259"
  absent-tint: "#f1eee7"
  conflict: "#8c2f24"
  conflict-tint: "#f7eae8"
  conflict-line: "#b4655b"
  print-panel: "#101419"
  print-panel-text: "#ede9e0"
typography:
  display:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.022em"
  display-cover:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-note:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.005em"
  label-l:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 550
    lineHeight: 1.3
    letterSpacing: "0.002em"
  numeric:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontFeature: "tnum"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "34px"
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
rounded:
  sm: "2px"
  lg: "3px"
spacing:
  gutter: "24px"
  gutter-mobile: "16px"
  note-x: "16px"
  panel-x: "20px"
  header-top: "40px"
  touch: "44px"
  column-gap: "40px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.report-white}"
    typography: "{typography.label-l}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
    height: "44px"
  button-line:
    backgroundColor: "{colors.report-white}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.label-l}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
    height: "44px"
  button-line-hover:
    backgroundColor: "{colors.paper}"
  button-unverif:
    backgroundColor: "{colors.unverif-tint}"
    textColor: "#5f4a15"
    typography: "{typography.label-l}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
    height: "44px"
  button-conflict:
    backgroundColor: "{colors.report-white}"
    textColor: "{colors.conflict}"
    typography: "{typography.label-l}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
    height: "44px"
  button-conflict-hover:
    backgroundColor: "{colors.conflict-tint}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "44px"
  badge-neutral:
    backgroundColor: "{colors.report-white}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  badge-verified:
    backgroundColor: "{colors.verified-tint}"
    textColor: "{colors.verified}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  badge-unverif:
    backgroundColor: "{colors.unverif-tint}"
    textColor: "{colors.unverif}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  badge-conflict:
    backgroundColor: "{colors.conflict-tint}"
    textColor: "{colors.conflict}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  badge-absent:
    backgroundColor: "{colors.absent-tint}"
    textColor: "{colors.absent}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  strip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    padding: "12px 16px"
  top-bar:
    backgroundColor: "{colors.report-white}"
    textColor: "{colors.graphite-ink}"
    height: "60px"
---

# Design System: YKH-KDP

> **Başvuru sırası.** Bu dosya inşa edilmiş dünyanın kaydıdır; makineyle
> denetlenen kısmı `lib/tasarim.test.ts`. Tarihsel referans
> [`design_handoff_ykh_kdp/README.md`](../../design_handoff_ykh_kdp/README.md)
> **§1 değişmez kurallar ve §4 epistemik gramer için hâlâ bağlayıcıdır.**
>
> **2026-11 yeniden tasarımı handoff §2'nin tipografisini ve aksan rengini
> GEÇERSİZ KILDI** (kullanıcı isteği "sıfırdan yeniden tasarla", Codex ile
> birlikte karar verildi): Newsreader / IBM Plex ve lacivert `#1B2A47` yok.
> Yerine Schibsted Grotesk + JetBrains Mono ve `navy` token yuvasında kobalt.
> Bu iki konuda handoff ile bu dosya çelişirse **bu dosya geçerlidir**; diğer
> her konuda handoff §1 ve §4 geçerlidir.
>
> Handoff §5–7'deki ekranlar (kanıt bandı, uzman kuyruğu, kurul kilidi, künye
> çekmecesi) bu üründe **yok** (bkz. `docs/ykh-brief.md`).

## Overview

**Creative North Star: "Akredite deney raporu"**

Bir kalkınma ajansı uzmanının günlerce açık tuttuğu bir değerlendirme raporu.
AI puanı bir taslaktır, alıntı izlenebilirliktir, ajans onayı karardır; arayüz
bu üç statüyü birbirine karıştırmadan gösterir. Soğuk rapor beyazı kâğıt,
grafit mürekkep, ince çizgi ve tablo disiplini. Tek kurumsal aksan kobalttır ve
yalnızca eylem, seçili durum ve odak taşır. İl sıralaması izlenebilir bir sonuç
çizelgesi gibi okunur.

Reddedilen iki dünya açıkça yazılı: kart-ızgaralı SaaS paneli ve önceki
"kamu tutanağı" dünyası (krem kâğıt, serif başlık, büyük harfli mono etiket
kostümü, siyah matbu şeritler). Yoğunluk orta-yüksek: ekran uzun süre açık
kalır, içeriği taranmaz okunur; satır uzunluğu 62–68ch ile sınırlanır.

Doğruluk iddiası görseldir: renk tek başına anlam taşımaz, her durum kenar
karakteri + doku + işaret + metin ile birlikte gelir. Gradyan, gölge, glow, cam
efekti ve emoji yok; köşe 2px, tavan 3px.

**Key Characteristics:**
- Soğuk rapor beyazı üç katman (yüzey · kâğıt · sayfa), grafit mürekkep, tek kobalt aksan.
- Tek grotesk aile (Schibsted Grotesk) başlıkta ve arayüzde; mono yalnızca veri.
- Epistemik gramer: 3px solid/dashed/dotted sol kenar + doku + ■ ◌ — + metin.
- Düz yüzey, ince çizgi; derinlik yok, ayrım çizgiyle ve ton katmanıyla.
- Hareket yalnızca gerçek durum değişimi için; iki istisna adresiyle kapsanmış.

## Colors

Soğuk, düşük doygunluklu bir rapor zemini üzerinde tek bir kalibrasyon kobaltı
ve dokunulmamış dört epistemik renk.

### Primary
- **Kalibrasyon Kobaltı** (`cobalt`): birincil düğme zemini, aktif gezinme
  altı çizgisi (2px), odak halkası, seçim rengi, bağlantı rengi, canlı
  değerlendirmenin aktif adımı ve "Ajans kararı" panelinin üst kenarı (2px).
  CSS'te token adı `--color-navy` olarak **korundu** — sayfalar o ada bağlı;
  ad tarihseldir, değer kobalttır. `cobalt-tint` aktif adım satırının ve
  seçili durumun zemini; `cobalt-line` ince kobalt çizgi.

### Neutral
- **Grafit Mürekkep** (`graphite-ink`): gövde metni ve başlıklar.
- **İkincil Mürekkep** (`ink-soft`): açıklama, not gövdesi, şerit metni.
- **Sessiz Mürekkep** (`ink-mute`): etiket, künye, sayaç; ≥4,5:1 eşiğine tabi.
- **Rapor Beyazı** (`report-white`): kart, tablo, panel, üst bar yüzeyi.
- **Kâğıt** (`paper`): şerit (tablo/form başlık satırı) ve hover zemini.
- **Sayfa** (`page`): gövde zemini; yüzeyler onun üstünde durur.
- **Alan** (`field`): form alanı zemini (`--color-alan`). İsimsiz sabit renk
  temayla dönmez, token döner; bu yüzden isimli.
- **Saç Çizgisi** (`hairline`, `hairline-soft`): tüm ayırıcılar ve kenarlar.

### Epistemik dörtlü (handoff §4 · değişmedi)
- **Doğrulanmış** (`verified`, tint, line): onaylanmış, belgeye bağlı.
- **Doğrulanmadı** (`unverif`, tint, line): ochre. AI taslağı, eşik altı,
  süren değerlendirme. **Yalnızca "doğrulanmadı" anlamında** görünür.
- **Dayanak yok** (`absent`, tint): boş slot, dayanaksız kriter, boş durum.
- **Çelişki** (`conflict`, tint, line): ret, hata, tamamlanmayan işlem.

### Named Rules
**The Tek Aksan Rule.** Kobalt eylem, seçili durum ve odak içindir; dekoratif
vurgu, başlık rengi ya da durum rengi olarak kullanılmaz. Durum dört epistemik
renkle söylenir, marka rengiyle değil.

**The Renk Tek Başına Taşımaz Rule.** Hiçbir durum yalnızca renkle ayırt
edilmez (handoff §1.2). Siyah-beyaz çıktıda ve renk körlüğünde kenar karakteri,
doku, işaret ve metin etiketi aynı bilgiyi verir.

**The Ochre Anlamlıdır Rule.** `unverif` ochre dekoratif aksan değildir;
yalnızca ürünün "doğrulanmadı" dediği yerde görünür — tanıtım hero'sunda düşen
alıntı hattı dahil.

**The Koyu Panel Yok Rule.** Matbu koyu panel (`.panel-koyu`) 2026-11'de
kaldırıldı; tanıtım sayfası dahil hiçbir yüzeyde her iki temada koyu kalan
alan yok. Sabit açık renk metin yazılmaz (test denetler).

### Palet varyasyonları

Palet **yalnızca rengi** değiştirir; tipografi, boşluk, yarıçap, gölge ve
hareket paletsizdir (test palet bloğunda renk dışı token'ı kırar). Kaynak M3
setlerindeki `rounded-lg (8px)`, 250–350ms geçiş ve elevation alınmadı.

| id | ad | not |
|---|---|---|
| `temel` | Kağıt ve mürekkep | varsayılan; `@theme` değerleri (rapor beyazı + kobalt) — ayrı blok yok |
| `gece` | Gece ve krem | kalibrasyon gerekmedi (markaya en yakın epistemik renk ΔE 0.243) |
| `antrasit` | Antrasit ve alabaster | marka yuvası `primary` yerine `inverse-surface` |
| `orman` | Orman ve keten | `verified` → `#0f6558` (sapma ΔE 0.033) |

Ayar **kurumsaldır**: `ayar` tablosunda tek kayıt, yalnızca yönetici değiştirir
(`/ayarlar`), değişiklik denetime yazılır. Palet sunucuda okunup
`<html data-palet>` olarak basılır; ilk boyamada sıçrama olmaz. Okunamazsa
varsayılan paletle devam edilir ve sebep log'a yazılır.

**Sert doğrulama** (`tasarim.test.ts` kırar): her epistemik renk ve `ink-soft` /
`ink-mute` `surface`, `paper`, `page` üzerinde ≥4,5:1; gövde metni `page`
üzerinde ≥4,5:1; epistemik renkler birbirinden ≥ handoff'un kendi en yakın
çifti (sabit yazılmaz, hesaplanır — 0.09099…); palet bloğu renk dışı token
taşıyamaz.

**Tavsiye** (zorlanmaz): epistemik renk ile kurumsal aksan arası mesafe.
Zorlamak Antrasit'te "dayanak yok" rengini griden pembeye itiyordu. Kural:
**ucuzsa düzelt, anlamı bozacaksa marka yuvasını değiştir.** Türetilen renkler
(`ink-soft`, `ink-mute`, `alan`, `-tint`/`-line`) M3 token'larından alınmaz,
OKLab'de türetilir.

**Koyu tema.** `[data-theme="dark"]` bloğu ve dokuların ters çevrilmiş
karşılıkları CSS'te tanımlı, ama bugün bu özniteliği basan bir kod yolu yok.
Koyu tema hazır bir karşılık, yürürlükte bir özellik değil.

## Typography

**Display Font:** Schibsted Grotesk (system-ui, sans-serif yedeği)
**Body Font:** Schibsted Grotesk
**Label/Mono Font:** JetBrains Mono — yalnızca sayı, kod ve künye

**Character:** Kurumsal bir haber grotesk'i: kamu belgesinin ciddiyeti, ekran
okunurluğu, eksiksiz Türkçe (latin-ext). Tek aile hiyerarşiyi ağırlık ve
boyutla kurar; mono bir kostüm değil, verinin yüzüdür. Serif yok.

### Hierarchy
- **Display** (600, 34px, 1.08, −.022em; dar ekranda 27px): sayfa başlığı
  (`Baslik`). Bağlam (il, dönem, rol) başlığın **altında** künye satırı olarak
  `.etiket` ile gelir; üstte etiket yok.
- **Display cover** (600, 40px, 1.05, −.025em; darda 30px, maks 16ch):
  giriş/kayıt kapağı (`KimlikSayfasi`).
- **Headline** (600, 18px, −.01em): rapor bölüm başlığı (ör. değerlendirme
  koşusu). Karar paneli başlığı 16px.
- **Title** (600, 15px): boş durum ve not başlıkları (notlarda 14px).
- **Body** (400, 15px / 1.5): gövde; açıklama paragrafları 15px / 1.55,
  maks 68ch. **Not gövdesi** 13.5px / 1.55; ikincil satırlar 13px.
- **Label** (`.etiket`, 500, 12.5px, 1.35, +.005em, sans): alan adı, sütun
  başlığı, künye satırı, durum metni. Eski 9.5–11px büyük harfli mono etiketin
  yerini alan **tek** etiket sınıfı.
- **Label-l** (`.etiket-l`, 550, 13.5px): gezinme ve düğme metni.
- **Numeric** (`.num`: JetBrains Mono + `tabular-nums`): tüm sayılar, kodlar,
  model künyesi, sayaçlar ve epistemik glifler. Karar panelindeki puan
  **figure** olarak 34px.
- **Landing h2** (500, `clamp(1.5rem, 2.8vw, 1.9375rem)`, 1.12, −.01em):
  yalnızca tanıtım sayfası bölüm başlıkları.

### Named Rules
**The Mono Yalnızca Veri Rule.** JetBrains Mono sayı, kod (NACE, NUTS-2),
model künyesi ve epistemik glif içindir. Bir alanın adını söylemek için
kullanılmaz; alan adı `.etiket` ile sans yazılır.

**The Büyük Harf Yok Rule.** Arayüzde büyük harfli, harf aralığı açılmış
etiket yoktur. Hiyerarşi ağırlık ve boyutla kurulur.

**The Tüm Sayılar Tabular Rule.** Her sayı `.num` taşır; sütunlar hizalanır,
puanlar yan yana karşılaştırılabilir.

## Layout

- **Kap:** okuma sayfası maks 760px, geniş sayfa (tablo, sıralama, rapor,
  öneri detayı) maks 1180px. Yatay boşluk 24px, 720px altında 16px. Sayfa
  başlığı üstten 40px (darda 28px), altta 24px ve saç çizgisiyle kapanır.
- **Üst bar:** yapışkan, 60px, rapor beyazı, alt saç çizgisi. 720px altında
  gezinme **ikinci satıra sarılır** (üst ince çizgiyle); gizli kaydırma şeridi
  yok — sıkıştırılınca "Ayarlar" görünmez ve ulaşılmaz oluyordu.
- **Öneri detayı iki sütunlu rapordur:** `minmax(0,1fr) 340px`, 40px aralık.
  Solda değerlendirme gövdesi (gerekçe, canlı adım listesi ya da puan ve
  alıntılar), sağda **yapışkan** (`top: 84px`) panel: puan özeti + "Ajans
  kararı". 1040px altında tek sütuna iner, panel yapışkanlığını bırakır.
- **Kimlik sayfaları (`KimlikSayfasi`):** solda kapak (başlık + ürünün dört
  kapısı numaralı liste olarak, gerçek metin), sağda form (`minmax(0,440px)`),
  64px aralık. 900px altında form öne geçer, kapak alta iner.
- **Izgara şablonları `minmax(0,1fr)` kullanır.** Grid/flex öğeleri varsayılan
  `min-width: auto` taşır; `1fr` tek başına içerikle genişler.
- **Kesme noktaları:** 560 · 720 · 900 · 1040px (Tailwind `max-[…]`).
- **Dokunma hedefi** ≥44px (`min-h-11`); üst bardaki marka bağlantısı darda 52px.

### Named Rules
**The Sayfa Gövdesi Yatay Kaymaz Rule.** Geniş içerik (tablo) kendi
`overflow-x` kabında kayar. `overflow-x-auto` yazan her yerde `min-w-0` da
olur; 320px'ten geniş `minmax` tabanı `minmax(min(420px, 100%), 1fr)` biçiminde
yazılır. İkisi de Galaxy S26 Ultra'da yaşandı; `tasarim.test.ts` ikisini de
denetler.

## Elevation & Depth

Sistem düzdür: gölge ölçeğinin her basamağı `none`'a çakılıdır. Derinlik ton
katmanıyla (sayfa `page` → yüzey `report-white` → şerit `paper`) ve saç
çizgileriyle kurulur. Yükselen kart, havada duran panel yok; yapışkan karar
paneli bile yalnızca çizgiyle ayrılır.

Atmosfer gerektiğinde **doku** kullanılır, gölge değil: durum dokuları
(`tex-unverified` 135°, `tex-absent` 45°, `tex-slot` 135°/12px). Hepsi
`repeating-linear-gradient`; düz `linear-gradient` testle yasaktır.

### Named Rules
**The Gölge Yok Rule.** `box-shadow`, `filter`, `drop-shadow`,
`backdrop-filter` yalnızca `.hero-*` seçicilerinde durabilir; başka yerde
test kırılır.

**The Kapsanmış Hero İstisnası Rule.** Tanıtım sayfasındaki kanıt ağı
(`.hero-*`) handoff hareket listesinden kullanıcı kararıyla gevşetildi. Ağ
artık açık zeminde, çerçeveli bir **şekildir** (serit başlık + açıklama);
metnin arkasında durmaz, buzlu plaka ve glow kaldırıldı.

## Shapes

Köşe 2px (`rounded.sm`): düğme, girdi, rozet, işaret karesi. Ölçeğin tavanı
3px'tir; Tailwind'in `radius-lg` ve üstü 3px'e çakılıdır, test 3px üstünü
kırar. Daire yok — "AI asistan" balonu ve yuvarlak avatar bu dünyaya ait
değil; canlı göstergenin işareti bile dolup boşalan bir kare (■).

Kenar dili: 1px saç çizgisi her yerde; 2px kobalt yalnızca aktif gezinme
altında ve karar panelinin üstünde; **3px sol kenar yalnızca epistemik durum
taşıyan yerde.**

### Epistemik gramer (handoff §4 · bağlayıcı)

| Durum | Sol kenar 3px | Doku | İşaret | Renk |
|---|---|---|---|---|
| Doğrulanmış | `solid` | yok (tint zemin) | `■` | `verified` |
| Doğrulanmadı | `dashed` | `.tex-unverified` | `◌` | `unverif` |
| Dayanak yok | `dotted` | `.tex-absent` | `—` | `absent` |
| Çelişki / hata | `solid` | tint zemin | çizilmiş ✕ kare | `conflict` |

Sonuç işaretleri aynı aileden: `▲` ekleniyor, `▼` reddedildi/çıkıyor;
katlanır bölümde `▸` / `▾`. Hepsi metin glifidir ve `.num` ile basılır.

> **impeccable denetleyicisi bunu `side-tab` antipattern'i olarak işaretler.
> Bulgu REDDEDİLİR.** 3px sol kenar burada dekoratif aksan değil, ürünün imza
> anlam taşıyıcısıdır ve handoff §1.2 gereği renk tek başına yeterli olmadığı
> için zorunludur. **Epistemik durum taşımayan yerde dekoratif sol şerit
> yasaktır.**

### Arayüz işaretleri

`Isaret`: çizilmiş SVG, 20px görünüm kutusu, tek çizgi kalınlığı 1.5, yuvarlak
uç; 16px basılır. Yedi işaret: bilgi, uyarı, hata, tamam, ok, çıkış, giriş.
Epistemik glifler (■ ◌ —) bunlardan ayrıdır ve onların yerine kullanılmaz.

## Components

### Buttons
- **Shape:** 2px köşe, 1px kenar, en az 44px yükseklik, `9px 16px` iç boşluk,
  `.etiket-l` metin, işaretle 8px aralık.
- **Primary (`dolu`):** kobalt zemin, beyaz metin; hover'da kobaltın %86'sı +
  siyah (`color-mix` OKLab). Bağlantı biçimli birincil (`Bag`) sağa ok işareti
  taşır.
- **Çizgi (`cizgi`):** rapor beyazı, saç çizgisi kenar, grafit metin; hover'da
  kenar `ink-mute`, zemin `paper`.
- **Doğrulanmadı (`amber`):** ochre tint zemin, `#5F4A15` metin, ochre çizgi.
- **Ret (`kirmizi`):** beyaz zemin, çelişki metni; hover'da çelişki tint.
- **Geçiş:** yalnızca zemin, kenar ve metin rengi, 150ms. Disabled %55 opaklık.
- **Gönderim sürerken** düğme metni fiile döner (`bekleme`: "Kaydediliyor",
  "Değerlendiriliyor") ve önünde üç çizgilik `analiz-bekle` sayacı durur;
  `aria-busy`.
- **Ters (`dugme-ters`):** yalnızca matbu panel üzerinde; açık zemin, koyu metin.

### Chips (Rozet)
- **Style:** 2px köşe, 1px kenar, `3px 8px`, 12px / 500; isteğe bağlı mono
  glif (11px) önde. Türler: nötr, yeşil (doğrulanmış), amber (doğrulanmadı),
  kırmızı (çelişki), gri (dayanak yok).
- **AsamaRozeti:** listelerde (onay kuyruğu, önerilerim) değerlendirmenin o
  anki adımı: "‹Adım› sürüyor" / "Sırada" / "Deneme tamamlanmadı". Kesikli
  ochre kenar + ◌; adım varsa `analiz-tarama` + `analiz-nabiz`. Liste sayfası
  kendini tazelemez; rozet yalnızca o anki adımı söyler.

### Cards / Containers
- **Corner Style:** köşesiz ya da 2px.
- **Background:** rapor beyazı, sayfa zemininin üstünde.
- **Shadow Strategy:** yok (bkz. Elevation & Depth).
- **Border:** 1px saç çizgisi; iç bölümler `hairline-soft` ile ayrılır.
- **Şerit (`.serit`):** tablo ve form başlık satırı — `paper` zemin, alt saç
  çizgisi, `.etiket`, `12px 16px`. Eski siyah "matbu künye" şeridinin
  yerine; temayla döner, bağırmaz.
- **Internal Padding:** not 16px × 14px; bölüm 20px.

### Inputs / Fields
- **Style:** 44px yükseklik, `alan` zemin, 1px saç çizgisi, 2px köşe,
  `10px 12px`, 14.5px metin. Alan adı üstte `.etiket` / `ink-soft`.
- **Hover / Focus:** hover'da kenar `ink-mute`; odakta kenar kobalt + 2px
  kobalt %25 halka.
- **Error:** alan altında değil, formun başında bir çelişki notu (bkz.
  Bildirim grameri).

### Navigation
- **Üst bar** (`UstBar`): amblem (kobalt kare, üç satır + bağlanmış kare) +
  "YKH" (15px / 600) ve alt satır "Yatırım konusu önerileri" (11.5px,
  560px altında gizli). Gezinme `.etiket-l`; pasif `ink-mute`, hover `ink`,
  aktif `ink` + 2px kobalt alt çizgi ve `aria-current="page"`. Sağda ad + rol
  (720px altında gizli) ve çıkış/giriş.
- **Mobil:** gezinme ikinci satıra sarılır (bkz. Layout).

### Notlar (`Uyari`) ve boş durum (`Bos`)
- İlkel renkli kutu değil: işaret + (başlık) + açıklama, 3px sol kenar
  epistemik grameri izler. `amber` kesikli + doku; `yesil` düz + tint;
  `kirmizi` düz + tint ve `role="alert"`.
- `Bos` "dayanak yok" grameridir: noktalı kenar + doku + —, başlık ve eyleme
  davet eden açıklama.

### Bildirim grameri
- **Hata formun içinde kalır.** Sunucu eylemi başarısızsa formun başında
  çelişki notu: başlık **"İşlem tamamlanmadı"**, gövdede düzeltme yolunu
  söyleyen mesaj. Toast'ta kaybolmaz.
- **Başarı sessizdir:** sol altta "Kayda geçti" kayıt satırı — 3px yeşil sol
  kenar, ■, saat (mono), mesaj; 420px, `ledgerIn` ile girer, `role="status"`.
  Kritik bilgi taşımaz.
- **Ölçülmemiş kayıt 0 yazmaz.** 0 bir ölçümdür; boş "henüz ölçülmedi"
  demektir. Değerlendirilmemiş puan "—" ya da boş kalır; deneme sayısı yalnızca
  gerçek bir deneme varsa yazılır ("0/3" ilerleme gibi okunuyordu).

### Değerlendirme koşusu (imza bileşen)
Arka plandaki AI işinin canlı göstergesi (`DegerlendirmeDurumu`), öneri
detayının gövdesinde. Bölüm kendisi "doğrulanmadı" grameriyle çerçevelenir
(kesikli ochre 3px sol kenar).

- **Her şey sunucudan gelir:** `oneri.asama` + `asama_zamani` (migration
  0016), `deneme`, `son_hata`. Sayfa 4 saniyede bir tazelenir. **Uydurma yüzde
  ya da tahmini süre yok.**
- **Beş durum:** Sırada bekliyor · Değerlendiriliyor · İlerleme durdu
  görünüyor (adım 10 dakikadan uzun değişmedi) · Bu deneme tamamlanmadı (hata,
  deneme hakkı var) · Değerlendirme durdu (deneme hakkı bitti).
- **Dikey adım listesi:** Kuyruktan alındı → NACE kodu → Belge paketi →
  Puanlama → Karşı görüş → Kayıt. Her satır: işaret (■ tamam/aktif, □ sırada,
  — atlandı, ✕ hata) · ad · sağda durum metni (Tamamlandı / Sürüyor / Burada
  durdu / Atlandı / Sırada). Aktif satır `cobalt-tint` zemin + tarama çizgisi;
  hata satırı çelişki tint.
- Alt yazı `aria-live="polite"`; ekran okuyucu adım değişimini duyar.
- Sağ üstte "Deneme" ve "Son adım … önce" (mono). Son hata çelişki bandında.
- Ajans için "Şimdi değerlendir" / "Yeniden değerlendir" eylemi; süren koşuda
  gizli. Koşu sürerken karar paneli "Karar, taslak puan hazır olunca açılır"
  der.

### Ajans kararı paneli
Öneri detayının sağ sütunu: üstte iki hücreli puan özeti (Stratejik puan ·
Belge dayanağı, 34px mono; dayanak eşik altıysa ochre + "◌ Eşik altı — slot
dolduramaz"), altında 2px kobalt üst kenarlı "Ajans kararı" bölümü.

### Katlanır bölüm
Yerel `<details>/<summary>` (`.katlanir`): JavaScript yok. Varsayılan üçgen
kaldırılır, `▸` / `▾` kullanılır. Yükseklik animasyonu yok. Açık gelen bölüm
veriden türer (`/iller`'de açık dönemi olan bölgeler açık).

### Tanıtım sayfası (brand register)
PRODUCT.md'ye göre `/` brand register'da konuşur ama §1 kuralları ve token'lar
orada da bağlar.

- Ürünle aynı kabuk: `UstBar`, `Bag` düğmeleri, `.serit` başlıklı tablo ve
  kayıt, `Baslik`/`KimlikSayfasi` başlık ölçeği (40/27px). Bölümler `surface`
  / `page` arasında değişir; koyu panel yok.
- **Kanıt ağı** (`components/kanit-agi.tsx`): üç belge düğümünden öneri
  düğümlerine alıntı hatları; azınlığı kesikli ochre çizilip **düşer** —
  pakette birebir bulunamayan alıntı. Hareket ürünün tek pazarlıksız kuralını
  gösterir. Yerleşim determinist (tam sayı LCG; `Math.random` yok) — hydration
  uyuşmazlığı olmaz. Reduced-motion altında ağ tam çizili ve durağan.
- **İmza an gerçek kayıttır:** veritabanından gerçek bir değerlendirme —
  alıntı, atıf çıpası, model künyesi ve belgeye bağlanamayan kriter. Kayıt
  yoksa bölüm boş görünür; uydurma örnek ve uydurma metrik yazılmaz.
- Numaralı bölüm işaretleri (01–04) yalnızca zincir bölümünde, çünkü orası
  gerçek bir sıradır.

### Hareket

**Handoff dördü:** `sheetIn` (200ms, 10px) · `drawerIn` (200ms, 24px) ·
`ledgerIn` (180ms, 8px) · `veilIn` (160ms), hepsi ease-out. Başka animasyon
yok; dekoratif giriş animasyonu yasak (550ms'lik bir landing girişi bu yüzden
kaldırıldı).

**İki kapsanmış istisna**, ikisi de kullanıcı kararıyla ve adresi testle tutulur:

| İstisna | Keyframe öneki | Yalnızca | Ne için |
|---|---|---|---|
| Tanıtım hero'su | `hero*` | `.hero-*` | kanıt ağı (yalnızca `/`) |
| Analiz göstergesi | `analiz*` | `.analiz-*` | canlı AI değerlendirme göstergesi |

Analiz dörtlüsü: `analizTarama` (aktif adımın altında 2px kobalt tarama, 1.6s —
"iş sürüyor" demek, ilerleme oranı değil), `analizNabiz` (aktif ■ / ◌ dolup
boşalır, 1.4s), `analizBekle` (düğmede üç çizgi, 0.9s), `analizSatir` (tamamlanan
adım bir kez oturur, 0.5s). **Hata ve takılmada hareket durur, bilgi kalır.**
`prefers-reduced-motion` altında tarama çizgisi tam genişlikte durağan, diğerleri
kapalı. Test, tablo satırına enjekte edilen bir `analizNabiz` kullanımını tam bir
kez yakalar — kapsam testinin kendisi de sınanır.

### Named Rules
**The Hareket Gerçek Durumu Anlatır Rule.** Hareket yalnızca sunucudan gelen
bir durum değişimini anlaşılır kılar (handoff §1.10). Sahte ilerleme, uydurma
yüzde, tahmini süre yok.

**The İstisnanın Adresi Rule.** Bir istisna açıldığında ikinci kullanım "zaten
var" diye gelir, üçüncüde kural ölür. Her istisna önekli keyframe + kendi
seçici adresi + kırılan testle tutulur.

**The :where() Rule.** Bileşen sınıfı içindeki eleman seçicisi her zaman
`:where()` ile sarılır: `.panel-koyu :where(a)` (0,0,1) yardımcı sınıfa yenilir,
`.panel-koyu a` (0,1,1) onu ezer. Yaşandı: landing'in iki birincil düğmesi
1.09:1 kontrastla görünmez kaldı. Test bu biçimi kırar.

## Do's and Don'ts

### Do:
- **Do** her doğrulama durumunu kenar karakteri + doku + işaret + metinle birlikte göster; rengi asla tek başına bırakma.
- **Do** kobaltı yalnızca birincil eylem, seçili durum ve odak için kullan.
- **Do** alan adlarını `.etiket` (sans 12.5px / 500) ile, sayıları ve kodları `.num` (JetBrains Mono, tabular) ile yaz.
- **Do** tablo ve form başlık satırında `.serit` kullan (kâğıt zemin, alt saç çizgisi).
- **Do** form hatasını formun içinde "İşlem tamamlanmadı" çelişki notuyla, başarıyı sessiz "Kayda geçti" kayıt satırıyla bildir.
- **Do** ölçülmemiş değeri boş ya da "—" bırak; 0 yalnızca bir ölçümdür.
- **Do** canlı durumu yalnızca `oneri.asama` gibi gerçek sunucu verisinden türet; hata, takılma ve reduced-motion'da hareketi durdur.
- **Do** ızgara şablonlarında `minmax(0,1fr)`, kaydırma kabında `overflow-x-auto` ile birlikte `min-w-0` kullan.
- **Do** dar ekranda gezinmeyi ikinci satıra sar; her etkileşimli öğe ≥44px ve görünür `:focus-visible` (2px kobalt) taşısın.
- **Do** bileşen sınıfı içindeki eleman seçicisini `:where()` ile sar.

### Don't:
- **Don't** gradyan, gölge, glow, cam efekti, emoji veya 3px üstü köşe kullan (tek istisna `.hero-*`, yalnızca `/`).
- **Don't** epistemik durum taşımayan bir öğeye dekoratif 3px sol şerit ekle.
- **Don't** büyük harfli, harf aralığı açılmış mono etiket kostümüne geri dön.
- **Don't** ürün ekranlarına siyah tablo/form başlık şeridi ya da koyu matbu panel koy; tanıtım sayfası dahil.
- **Don't** `bg-ink` ile her iki temada koyu kalacak alan kur; sabit açık renk metin yazma.
- **Don't** `hero` ya da `analiz` önekli bir animasyonu kendi seçici adresi dışında çağır; handoff dördü dışında yeni keyframe ekleme.
- **Don't** canlı göstergeye uydurma yüzde, tahmini süre ya da ilerleme çubuğu koy.
- **Don't** palet bloğuna renk dışı token (yarıçap, gölge, hareket, tipografi) yaz.
- **Don't** ochre `unverif` rengini "doğrulanmadı" anlamı dışında aksan olarak kullan.
- **Don't** yuvarlak "AI asistan" balonu, avatar ya da dekoratif illüstrasyon ekle.

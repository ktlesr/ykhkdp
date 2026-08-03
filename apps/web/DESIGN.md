# YKH-KDP — tasarım sistemi

> **Başvuru referansı: [`design_handoff_ykh_kdp/README.md`](../../design_handoff_ykh_kdp/README.md).**
> Bu dosya onun kodda uygulanmış hâlidir ve onunla çeliştiği yerde **handoff
> geçerlidir**. Buradaki her başlık handoff'un ilgili bölümüne referans verir.
>
> Handoff §5–7'deki ekranlar (kanıt bandı, uzman kuyruğu, kurul kilidi, künye
> çekmecesi) bu üründe **yok** — ürün sadeleştirildi (bkz. `docs/ykh-brief.md`).
> §1 değişmez kurallar, §2 token'lar ve §4 epistemik gramer **aynen geçerlidir**.

## Değişmez kurallar (handoff §1)

Bunlar estetik tercih değil, ürünün doğruluk iddiası. Makineyle denetlenebilen
kısmı `lib/tasarim.test.ts` içinde tutuluyor.

- **§1.2 Renk tek başına taşıyıcı olamaz.** Kenar karakteri + doku + işaret +
  metin etiketi birlikte çalışır. Siyah-beyaz çıktıda ve renk körlüğünde
  ayırt edilebilir olmalı.
- **§1.4 Gizli katsayı yok.** Uygulanan pay ekranda yazıyla ilan edilir.
- **§1.5 Boş slot bir hata değil.** Tam satır yüksekliğinde, dokulu, gerekçeli.
- **§1.8 Yasaklar:** gradyan, renkli glow, gölge, cam efekti, yuvarlak "AI
  asistan" balonu, emoji, dekoratif illüstrasyon, gereksiz mikro-animasyon,
  `border-radius > 3px`.
- **§1.9 Arayüz dili Türkçe**, sade fiil, kısaltma yok. Buton ne yapıyorsa onu
  yazar.
- **§1.10 Hareket yalnızca durum değişimini anlaşılır kılmak için.**
  `prefers-reduced-motion` desteklenir.

## Token'lar (handoff §2)

`app/globals.css` içinde Tailwind v4 `@theme` bloğu; ayrı `tailwind.config.ts`
yok. Renkler handoff §2 tablosuyla **birebir aynı** — değiştirilmez.

```
ink #101419 · soft #3C4350 · mute #5C6470      navy #1B2A47 · tint #EBEEF4 · line #42557A
paper #F6F4EF · page #EEEBE4 · surface #FFFFFF hairline #C9C4B8 · soft #E2DED4
verified #1D5B4A   unverif #8A6A1F   absent #6B6259   conflict #8C2F24
```

### Handoff'a eklenen tek token

`--color-alan` (form alanı zemini, açık `#FDFCFA` / koyu `#1A1F26`). Handoff
form alanı zemini tanımlamıyor; renk kodda zaten isimsiz sabit olarak vardı.
İsimlendirmek koyu tema karşılığını mümkün kıldı — **isimsiz sabit renk temayla
dönmez, token döner.**

### Tipografi (handoff §2)

| Rol | Yüz | Ölçek |
|---|---|---|
| Başlık | Newsreader **500** | 40px/1.06 ls −.01em (H1) · 31px (H2) · 24px (kart) |
| Gövde | IBM Plex Sans 400/500 | 16 · **14.5 temel** · 13.5 · 13 · 12.5 · 12px · satır 1.45–1.55 · maks **78ch** |
| Utility | IBM Plex Mono | 10–10.5px durum etiketi, uppercase, ls .10–.16em · 9.5px mikro |

Tüm sayılar `.num` (mono + `tabular-nums`).

### Animasyon (handoff §2)

**Yalnızca** `sheetIn` · `drawerIn` · `ledgerIn` (180–200ms ease-out, mesafe
≤24px) ve `veilIn` (160ms). Test bunu denetler.

Yaşanmış ihlal: tanıtım sayfasına 550ms'lik dekoratif giriş animasyonu
eklenmişti; §1.10 "hareket yalnızca durum değişimi için" der, giriş animasyonu
durum değişimi değildir. Kaldırıldı.

### Tanıtım hero'su — kapsanmış istisna

Handoff §1.8 (glow, gradyan) ve §2 (animasyon listesi) **yalnızca tanıtım
hero'su için** gevşetildi. Karar kullanıcıya ait; gerekçe pazarlama yüzeyinin
ürünün geri kalanından farklı bir kayıtta konuşması.

İstisnanın **kapsamı testle tutuluyor** — kural kalkmadı, adresi yazıldı:

| İzin | Sınır |
|---|---|
| `hero` önekli `@keyframes` | yalnızca `.hero-*` seçicisinde çağrılabilir |
| `filter` · `box-shadow` · `drop-shadow` | yalnızca `.hero-*` |
| `linear-gradient` | yalnızca `.hero-*` **ve** yalnızca `mask-image` olarak |

Üç kural da enjekte edilmiş ihlalle sınandı: `.tablo-satiri`'ye `heroNabiz`,
`.kart`'a `box-shadow`, `.bant`'a gradyan eklenince üç test birden kırılıyor.
Bir istisna açıldığında ikinci kullanım "zaten var" diye gelir ve üçüncüde
kural fiilen ölür; test bunu engelliyor.

**Kanıt ağı** (`components/kanit-agi.tsx`): üç belge düğümünden öneri
düğümlerine alıntı hatları çizilir; azınlığı çizilip **düşer** (ochre, kesikli)
— pakette birebir bulunamayan alıntı. Hareket dekoratif değil, ürünün tek
pazarlıksız kuralını gösteriyor. Referans sitedeki Türkiye haritası kopyalanmadı:
bu platform coğrafya değil, bir iddianın belgeye bağlanışını gösteriyor.

Yerleşim **determinist** (tam sayı LCG; `Math.random`/`Math.sin` yok) — sunucu
ve tarayıcı aynı işaretlemeyi üretmezse hydration uyuşmazlığı olurdu.
`prefers-reduced-motion: reduce` altında ağ tam çizili ve durağan: bilgi kaybı
yok, yalnızca hareket yok.

**Buzlu plaka** (`.hero-plaka`). Üç blok — künye şeridi, metin sütunu, ölçü
rafı — canlı ağın üstünde kendi zeminini taşır. Kart değil: yarıçapı, gölgesi
ve kutusu yok, yalnızca kenar çizgileri var; kâğıda konmuş bir baskı plakası.

İlk çözüm maskeydi (ağ başlığın arkasında soluyordu) ve yanlış taraftandı:
görseli kısıyordu. Plaka tersini yapar — ağ tam güçte kalır, metin kendi
zeminini getirir. Gradyan istisnası bu yüzden **kapatıldı**; kullanılmayan
istisna kuralda bırakılmaz.

**Kontrast blur'a bağlı değil.** `backdrop-filter` desteklenmeyen tarayıcıda
tint %86'ya çıkar. En kötü durumda — parlak bir alıntı hattı plakanın tam
altından geçerken — ölçülen değerler:

| | başlık | gövde | mikro 13.5px |
|---|---|---|---|
| destek yok · tint %86 | 14,99 | 10,33 | **5,45** |
| destek var · tint %76 | 13,4 | 9,2 | **4,85** |

Model bilerek kötümser: hattın plakanın altında tam güçte durduğunu varsayıyor,
blur gerçekte dağıtıyor. Hepsi 4,5:1 eşiğinin üstünde.

`backdrop-filter` de kapsam testine **ayrıca** yazıldı: `filter` kalıbı onu
yakalamıyor (önündeki karakter `-`, kalıbın istediği boşluk değil). Kapsam
testinin sessizce geçmesi, kuralın hiç olmamasından beterdir.

## Epistemik gramer (handoff §4)

Üç durum her tabloda, her kartta **birebir aynı** görünür:

| Durum | Sol kenar 3px | Doku | İşaret | Renk |
|---|---|---|---|---|
| Doğrulanmış | `solid` | yok | `■` | `#1D5B4A` |
| Doğrulanmadı | `dashed` | `.tex-unverified` | `◌` | `#8A6A1F` |
| Dayanak yok | `dotted` | `.tex-absent` | `—` | `#6B6259` |

> **impeccable denetleyicisi bunu `side-tab` antipattern'i olarak işaretler.
> Bulgu REDDEDİLİR.** 3px sol kenar burada dekoratif aksan değil, ürünün imza
> anlam taşıyıcısıdır ve handoff §1.2 gereği renk tek başına yeterli olmadığı
> için zorunludur. Yeni bileşenlerde dekoratif amaçlı sol şerit yine yasaktır.

## Koyu panel kuralı

`.panel-koyu` — **her iki temada koyu kalan** matbu künye alanı: üst bar, tablo
başlığı, form künye şeridi, tanıtım sayfası panelleri, kayıt satırı.

`bg-ink` kullanmak yanlış: koyu temada `--color-ink` açık renge döner ve
üzerindeki sabit açık metin görünmez kalır.

**Kural: sabit açık renk metin (`text-[#EDE9E0]` vb.) yalnızca `.panel-koyu`
veya `.dugme-ters` kapsamında meşrudur.** Başka her yerde token kullanılır.
Test bunu JSX girintisiyle kapsam takip ederek denetler.

## CSS özgüllük kuralı

Bileşen sınıfı içindeki eleman seçicileri **her zaman `:where()` ile**:

```css
.panel-koyu :where(a) { … }   /* (0,0,1) — yardımcı sınıf kazanır */
.panel-koyu a { … }           /* (0,1,1) — yardımcı sınıfı EZER, yasak */
```

Yaşanmış kusur: `.panel-koyu a` kuralı `.dugme-ters` (0,1,0) yardımcı sınıfını
ezdi; tanıtım sayfasının iki birincil düğmesi `#EDE9E0` metin / `#F6F4EF` zemin,
yani **1.09:1** kontrastla görünmez kaldı. Test bu biçimi kırar.

## Tanıtım sayfası (brand register)

Handoff §14 bu yüzeyi kapsamıyor; aşağıdaki kararlar bu ürüne özgüdür ve §1–§2
kurallarına tabidir.

- **Yön: kamu tutanağı.** Kategori refleksi (lacivert + altın + kurumsal stok
  fotoğraf) ve ikinci derece refleks (SaaS olmayan → editoryal-magazin) ikisi de
  reddedildi.
- **Renk stratejisi: committed.** `#101419` ink panel ilk katlamayı taşır; ochre
  `#8A6A1F` **yalnızca** ürünün "doğrulanmadı" dediği yerde görünür — aksan
  dekoratif değil, anlamlı.
- **Atmosfer doku ile kurulur**, gradyan/gölge/glow yasak olduğu için:
  `.tex-cetvel` ölçü cetveli çizgileri. Handoff §2'nin doku idiomunun uzantısı
  (`repeating-linear-gradient`).
- **İmza an: gerçek kayıt.** Sayfa mekanizmayı anlatmaz, veritabanından gerçek
  bir değerlendirmeyi açar — gerçek alıntı, gerçek atıf çıpası, model künyesi ve
  **belgeye bağlanamayan kriter**. Uydurma örnek gösterilmez; kayıt yoksa bölüm
  boş görünür.
- **Uydurma metrik yasak.** Sayılar veritabanından gelir; "1000+ yatırımcı"
  gibi bir cümle bu üründe yazılamaz.
- **Numaralı bölüm işaretleri (01–04)** yalnızca zincir bölümünde, çünkü orası
  gerçek bir sıradır ve sıra bilgi taşır. Başka bölümde numara kullanılmaz.

## Renk paleti varyasyonları

Palet **yalnızca rengi** değiştirir. Tipografi, boşluk, yarıçap, gölge ve
hareket handoff §1–§2'de kalır — kaynak dosyalardaki `rounded-lg (8px)`,
250–350ms geçiş ve elevation §1.8'i ihlal ettiği için alınmadı.

| id | ad | kalibrasyon |
|---|---|---|
| `temel` | Kağıt ve mürekkep | handoff'un özgün paleti |
| `gece` | Gece ve krem | gerekmedi (markaya en yakın epistemik renk ΔE 0.243) |
| `antrasit` | Antrasit ve alabaster | marka yuvası `primary` yerine `inverse-surface` |
| `orman` | Orman ve keten | `verified` #1D5B4A → #0f6558 (sapma ΔE 0.033) |

Ayar **kurumsaldır**: `ayar` tablosunda tek kayıt, yalnızca yönetici değiştirir
(`/ayarlar`), değişiklik denetime yazılır. Kişisel tercih yok — ekran görüntüsü
paylaşıldığında herkeste aynı çıksın diye. Palet sunucuda okunup
`<html data-palet>` olarak basılır; ilk boyamada sıçrama olmaz.

### Doğrulama kuralları

**Sert** (`tasarim.test.ts` kırar):

- her epistemik renk `surface`, `paper` ve `page` üzerinde **≥4,5:1**
- `ink-soft` ve `ink-mute` de aynı eşiğe tabi — küçük punto taşıyorlar
- epistemik renkler birbirinden **≥ handoff'un kendi en yakın çifti**
- palet bloğu **renk dışı token taşıyamaz**

Eşikler sabit yazılmaz, handoff'un kendi değerlerinden hesaplanır. Kural
"handoff'tan kötü olamaz"; sabit yazıldığında (0.091) handoff'un kendisi kendi
testini geçemiyordu — gerçek değer 0.09099…

**Tavsiye** (rapor edilir, zorlanmaz): epistemik renk ile kurumsal aksan arası
mesafe. Handoff §1.2 anlamı renkle değil kenar+doku+işaret+etiket ile taşıyor,
bu yüzden marka yakınlığı zayıf bir risktir. Kısıtı zorlamak Antrasit'te
"dayanak yok" rengini griden **pembeye** itiyordu — anlamı yok eden bir sonuç.
Kural şu: **ucuzsa düzelt, anlamı bozacaksa marka yuvasını değiştir.**

### Türetilen renkler

`ink-soft`, `ink-mute`, `alan` ve tüm `-tint`/`-line` varyantları M3
token'larından alınmaz, **handoff'un kendi ilişkisinden OKLab'de türetilir**.
M3 `outline` doğrudan `ink-mute` olarak kullanıldığında kontrast 4,08:1'e
düşüyordu (10px etiketler için eşik altı).

## Katlanır bölüm

`.katlanir` — yerel `<details>/<summary>`. JavaScript yok; klavye, ekran
okuyucu ve tarayıcı içi arama desteği bedava gelir.

- Varsayılan üçgen işareti kaldırılır, ürünün kendi geometrik işaretleri
  kullanılır (`▸` / `▾`) — §1.8 emoji yasağı, ve diğer durum işaretleriyle
  (`■ ◌ — ▲ ▼`) aynı aile.
- Yükseklik animasyonu **yok**. §1.10 hareketi durum değişimi için meşru
  sayıyor ama layout özelliği animasyonu ayrı bir maliyet; açılma anında
  içerik hemen görünür.
- Açık gelen bölüm **veriden türetilir**, keyfî değil. `/iller` sayfasında
  açık dönemi olan ajans bölgeleri açık, olmayanlar kapalı gelir.

## Erişilebilirlik (handoff §11)

- Odak halkası her etkileşimli öğede görünür (`:focus-visible`, 2px `#8A6A1F`).
- Dokunma hedefi ≥44px (`min-h-11`).
- Gövde metni ≥4.5:1, büyük metin ≥3:1.
- Geniş içerik (tablo) kendi `overflow-x` kabında kayar; sayfa gövdesi yatay
  kaymaz. **İki tuzak, ikisi de yaşandı** (Galaxy S26 Ultra'da ölçüldü):
  - `overflow-x-auto` grid/flex öğesindeyse `min-w-0` da ŞART. Öğeler
    varsayılan `min-width: auto` taşır ve içeriğin min-content genişliğinin
    altına inmez; 420px'lik bir tablo grid'i 420px'e genişletir.
  - `minmax(420px, 1fr)` dar ekranda o genişliği ZORLAR. Doğrusu
    `minmax(min(420px, 100%), 1fr)` — geniş ekranda aynı, darda kaba sığar.

  `lib/tasarim.test.ts` ikisini de denetliyor.

## Denetim

```bash
pnpm --filter @ykh/web test    # tasarim.test.ts dahil
```

impeccable denetleyicisi ayrıca çalıştırılabilir; `side-tab` bulgusu bu üründe
geçersizdir (yukarıya bakınız).

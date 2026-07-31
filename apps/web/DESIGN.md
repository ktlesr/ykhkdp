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
≤24px) ve `veilIn` (160ms). **Başka animasyon yok.** Test bunu denetler:
`@keyframes` listesi bu dörtle sınırlı.

Yaşanmış ihlal: tanıtım sayfasına 550ms'lik dekoratif giriş animasyonu
eklenmişti; §1.10 "hareket yalnızca durum değişimi için" der, giriş animasyonu
durum değişimi değildir. Kaldırıldı.

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

## Erişilebilirlik (handoff §11)

- Odak halkası her etkileşimli öğede görünür (`:focus-visible`, 2px `#8A6A1F`).
- Dokunma hedefi ≥44px (`min-h-11`).
- Gövde metni ≥4.5:1, büyük metin ≥3:1.
- Geniş içerik (tablo) kendi `overflow-x` kabında kayar; sayfa gövdesi yatay
  kaymaz.

## Denetim

```bash
pnpm --filter @ykh/web test    # tasarim.test.ts dahil
```

impeccable denetleyicisi ayrıca çalıştırılabilir; `side-tab` bulgusu bu üründe
geçersizdir (yukarıya bakınız).

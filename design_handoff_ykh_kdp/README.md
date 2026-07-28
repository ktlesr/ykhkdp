# Devir: YKH‑KDP — İl Karar Ekranı, Öneri Girişi, Tasarım Dili

## Bu paket nedir

YKH‑KDP (Yatırım Konusu Hazırlama — Karar Destek Platformu) için **hi‑fi tasarım referansı**. Paketteki HTML dosyası bir prototiptir: görünümü, bilgi mimarisini ve davranışı gösterir. **Üretim kodu değildir, kopyalanmaz.**

Görev: bu tasarımları hedef kod tabanının kendi ortamında yeniden kurmak — **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, grafikler Recharts**. Prototipteki inline stiller Tailwind sınıflarına ve shadcn kompozisyonlarına çevrilecek; DOM yapısı birebir taklit edilmeyecek, **görsel sonuç ve kurallar** birebir korunacak.

Fidelity: **hi‑fi**. Renkler, tipografi, boşluklar, kenar karakterleri ve dokular nihai. Piksel düzeyinde uy.

## Ürünün tek işi (bağlam)

Her il için dört yatırım konusu slotu var. Mevcut dört konu ve yeni öneriler **aynı listede, aynı sekiz kriterle** yarışır. İlk dörde girenler o dönemin listesi olur. Sabit koruma tabanı yoktur. Yeterli kanıtı olmayan aday, puanı yüksek olsa bile slot dolduramaz — **"bu slot için yeterli kanıtlı aday yok" geçerli bir sonuçtur.**

Tam ürün brifi: `prototype/urun-brifi.md` (Blok 0–7). Bu paket Blok 0, 1 ve 3'ü kapsar.

---

## 1. Değişmez tasarım kuralları

Bunlar estetik tercih değil, ürünün doğruluk iddiası. İhlal edilirse ürün itibar kaybeder.

1. **Dört ölçüt asla birleştirilmez.** Stratejik puan (0–100), kanıt yeterliliği (0–100), hazır olma/risk profili, sıralama sağlamlığı (0–100). Tek bir "genel skor" halkası/rozeti üretmek yasak. Stratejik puanı yüksek, kanıtı zayıf konu "güçlü öneri" değil, "yüksek potansiyel — ek kanıt gerekli"dir.
2. **Üç epistemik durum her yerde aynı görünür** (bkz. §4). Renk tek başına taşıyıcı olamaz: kenar karakteri + doku + işaret + metin etiketi birlikte çalışır. Siyah‑beyaz çıktıda ve renk körlüğünde ayırt edilebilir olmalı.
3. **Puanlamaya yalnızca uzman onaylı kanıt girer.** AI bulgusu ekranda görünür ama puana katılmaz.
4. **Gizli katsayı yok.** Devamlılık payı uygulanmışsa ekranda yazıyla ilan edilir ("Mevcut konulara +5 devamlılık payı uygulandı — sürüm TR33‑2027‑v1").
5. **Boş slot bir hata değil.** Tam satır yüksekliğinde, dokulu, gerekçeli ve eylem çağrılı görünür.
6. **Destek sayısı puan girdisi değildir.** Arayüz onu ilgi sinyali olarak gösterir, oylama sonucu gibi değil.
7. **Çalışma alanı ile kilitli karar sürümü asla karışmaz.** Ağırlık/pay oynatma senaryo alanıdır; karar ekranı sürüm damgası taşır.
8. **Yasaklar:** gradyan, renkli glow, gölge (`boxShadow: none`), cam efekti, yuvarlak "AI asistan" balonu, emoji, dekoratif illüstrasyon, gereksiz mikro‑animasyon, border‑radius > 3px.
9. Arayüz dili **Türkçe**, sade fiil, kısaltma yok. Buton ne yapıyorsa onu yazar ("Kanıtı onayla", "Kararı kilitle").
10. Hareket yalnızca durum değişimini anlaşılır kılmak için; `prefers-reduced-motion` desteklenir.

---

## 2. Tasarım token'ları

### Renk (açık tema)

| Ad | Hex | Kullanım kuralı |
|---|---|---|
| Mürekkep | `#101419` | Metin, tablo başlığı zemini, birincil buton, sıkı ayraç. Yardımcılar: `soft #3C4350`, `mute #5C6470` |
| Lacivert kayıt | `#1B2A47` | Kurumsal aksan: "yeni öneri" kökeni, bağlantı, seçili durum. Tint `#EBEEF4`, çizgi `#42557A`. Dekoratif kullanılmaz |
| Kağıt | `#F6F4EF` | İkincil zemin: bant, altlık, künye şeridi. Sayfa `#EEEBE4`, yüzey `#FFFFFF` |
| Saç teli | `#C9C4B8` | Kenarlık. Yumuşak ayraç `#E2DED4`, nokta ayraç aynı renk `dotted` |
| Onay yeşili | `#1D5B4A` | **Yalnızca** "uzman onaylı" ve "korunuyor". Tint `#EAF4F0`, çizgi `#2C7A64` |
| Doğrulanmamış | `#8A6A1F` | AI bulgusu, koşullu sonuç, uç durum uyarısı. Tint `#FBF4E2`, çizgi `#C9A557`. Her zaman kesikli kenar veya tarama ile |
| Kanıt yok | `#6B6259` | Boş slot, veri boşluğu. Tint `#F1EEE7` |
| Çıkış / çelişki | `#8C2F24` | "Çıkıyor", çelişen kanıt, kırılgan sınır, hata. Tint `#F7EAE8`, çizgi `#B4655B` |

### Renk (koyu tema)

```
--ink:#E8E4DB   --ink-soft:#B8BEC7  --ink-mute:#8E959F
--paper:#12161B --page:#0C0F13      --surface:#161B21
--hairline:#2A3039  --hairline-soft:#1E242B
--verified:#6FBFA3  --unverif:#D9B25F  --absent:#9A9186  --conflict:#D98A7B
```

Koyu temada dokular ters çevrilir: tarama `#EDE9E0` çizgi / `#101419` zemin; boşluk dokusu `#101419` / `#232A33`.

### tailwind.config

```ts
colors: {
  ink:      { DEFAULT:"#101419", soft:"#3C4350", mute:"#5C6470" },
  navy:     { DEFAULT:"#1B2A47", tint:"#EBEEF4", line:"#42557A" },
  paper:    { DEFAULT:"#F6F4EF", page:"#EEEBE4", surface:"#FFFFFF" },
  hairline: { DEFAULT:"#C9C4B8", soft:"#E2DED4" },
  verified: { DEFAULT:"#1D5B4A", tint:"#EAF4F0", line:"#2C7A64" },
  unverif:  { DEFAULT:"#8A6A1F", tint:"#FBF4E2", line:"#C9A557" },
  absent:   { DEFAULT:"#6B6259", tint:"#F1EEE7" },
  conflict: { DEFAULT:"#8C2F24", tint:"#F7EAE8", line:"#B4655B" }
},
fontFamily: {
  display: ["Newsreader","Georgia","serif"],
  sans:    ["IBM Plex Sans","system-ui","sans-serif"],
  mono:    ["IBM Plex Mono","ui-monospace","monospace"]
},
borderRadius: { DEFAULT:"2px", md:"2px", lg:"3px" },
boxShadow:    { none:"none" }
```

### Doku utility'leri (globals.css)

```css
.tex-unverified { background: repeating-linear-gradient(135deg, #FFF 0 5px, #FBF4E2 5px 10px); }
.tex-absent     { background: repeating-linear-gradient(45deg,  #FFF 0 5px, #F1EEE7 5px 10px); }
.tex-slot       { background: repeating-linear-gradient(135deg, #FFF 0 6px, #F1EEE7 6px 12px); }
.num            { font-variant-numeric: tabular-nums; font-family: var(--font-mono); }
```

### Tipografi

| Rol | Yüz | Kullanım |
|---|---|---|
| Başlık | Newsreader 500 | 40px/1.06 (sayfa H1, ls −.01em) · 31px (bölüm H2) · 29px (karar tabakası) · 24px/23px (kart, çekmece) · 19–22px (tablo sıra numarası) |
| Gövde | IBM Plex Sans 400/500, 600 yalnızca vurgu | 16px · **14.5px temel tablo** · 13.5px · 13px · 12.5px · 12px. Satır aralığı 1.45–1.55, maks. 78ch |
| Utility | IBM Plex Mono 400/500 | 11.5px kod bloğu · **10–10.5px durum etiketi ve künye alanı, uppercase, ls .10–.16em** · 9.5px mikro etiket. Tüm sayılar mono + `tabular-nums` |

Boşluk skalası: 3 · 5 · 7 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26 · 28 · 34px. Kenarlık 1px; vurgu ayraç 2px `#101419`; durum kenarı 3px (solid/dashed/dotted). Kart iç dolgu 18–22px, tablo satırı 15px/22px.

Animasyon: `sheetIn`/`drawerIn`/`ledgerIn` 180–200ms `ease-out`, mesafe ≤24px. `veilIn` 160ms. Başka animasyon yok.

---

## 3. İmza öğe — Kanıt Bandı

Ürünün hatırlanacağı tek öğe ve tüm kod tabanında tek bir bileşen: `<EvidenceBand value={82} state="verified|unverified|absent" cells={5} />`

- Beş hücre (yan panelde 12 hücreli varyant). Hücre 11×15px tablo içinde, 20×24px öneri ekranında, 14×18px koyu blokta. Boşluk 3–4px, kenarlık 1px `#9AA1AB`.
- Dolu hücre sayısı = `round(value/100 * cells)`.
- Dolu hücre: `verified` → düz `#101419`; `unverified` → 135° tarama (`#101419` 1.5px / `#FFF` 4px).
- Boş hücre: `absent` → 45° boşluk dokusu; diğerlerinde `#FFF`.
- Bandın **yanında** her zaman mono `82/100` ve altında durum etiketi (`eşiği geçti` / `eşik altı`).
- Stratejik puanın **içine** asla girmez, halkaya/donut'a dönüştürülmez.

Gerekçesi: ürünün tek ayırt edici iddiası "puan ile kanıtı birleştirmemek". İmza öğe bu iddianın kendisidir; 12px'te ve siyah‑beyaz çıktıda okunur.

---

## 4. Epistemik gramer (üç durum)

| Durum | Kenar (sol, 3px) | Doku | İşaret | Etiket | Renk | Kural |
|---|---|---|---|---|---|---|
| Uzman onaylı | `solid #1D5B4A` | yok, zemin `#FFF` | `■` | "Uzman onaylı kanıt" | `#1D5B4A` | puanlamaya girer |
| AI bulgusu | `dashed #8A6A1F` | `.tex-unverified` | `◌` | "AI bulgusu · doğrulanmadı" | `#8A6A1F` | puana girmez |
| Kanıt yok/yetersiz | `dotted #6B6259` | `.tex-absent` | `—` | "Kanıt yok / yetersiz" | `#6B6259` | slot dolduramaz |

Bu üçlü her tabloda, her kartta, her raporda, kamu portalında **birebir aynı** çalışır. Tek bir `<EpistemicFrame state=…>` sarmalayıcı bileşeni yaz ve her yerde onu kullan.

---

## 5. Ekran: Blok 1 — İl Karar Ekranı

**Amaç:** Bir il, bir dönem, dört slot. Ürünün cevabını verdiği ekran. Örnek içerik: **Uşak, 2027 dönemi.**

**Yerleşim:** sayfa `max-width:1440px`, yatay dolgu 28px. Üstte 52px yüksekliğinde koyu (`#101419`) sabit bar: ürün adı (Newsreader 17px) + mono nav + sağda `SÜRÜM TR33‑2027‑v1` kutusu ve `TASLAK · KİLİTLENMEDİ`.

Başlık bloğu: sol tarafta blok etiketi (mono 10.5px) + H1 40px + 64ch açıklama; sağda bağlam kutusu — **Ajans / İl / Dönem** üç hücre, 1px `#C9C4B8` kenarlık, hücre arası 1px `#E2DED4`. Bu bağlam hiçbir ekranda kaybolmaz (81 il, 26 ajans).

Gövde: `grid-template-columns: minmax(844px,1fr) 336px`, kabuk `min-width:1180px` (masaüstü öncelikli; sıkışmak yerine kaydırır).

**Sol kolon, yukarıdan aşağı:**

1. **Devamlılık payı bandı** — `#F6F4EF` zemin, amber rozet "Devamlılık payı", metin: "Mevcut konulara **+5** puan devamlılık payı uygulandı. Gizli katsayı yoktur; pay Blok 5'te değiştirilebilir." Sağda `Payı 0 yap` düğmesi (senaryo denemesi; kayıt satırı bildirimi açar).
2. **Özet bandı** — 4 hücre: Korunuyor / Ekleniyor / Çıkıyor / Boş slot. Değer mono 28px, altında birim metni. Renkler sırasıyla verified / navy / conflict / absent.
3. **Uç durum uyarısı** (koşullu) — dört konunun tamamı korunuyorsa, tamamı değişiyorsa **veya bir slot boş kalıyorsa** görünür. Amber tint, `◆` işareti, gerekçe zorunluluğunu söyler.
4. **Tablo başlığı** — koyu zemin, mono 9.5px uppercase. Kolonlar: `52px | 1fr | 96px | 92px | 128px | 150px` = Sıra / Yatırım konusu / Köken / Stratejik (sağa yaslı, `padding-right:18px`) / Kanıt yeterliliği / Sonuç.
5. **İlk dört satırı** — satır dolgusu 15px/22px, alt kenar 1px `#E9E5DB`, sol kenar 3px epistemik durum rengi, hover `#F6F4EF`, tıklanabilir → Blok 2. Hücreler: Newsreader 22px sıra no · konu adı 14.5px/500 + altında mono NACE ve epistemik etiket · köken rozeti (mevcut = navy outline+tint, yeni = nötr outline) · stratejik puan mono 19px + altında `73 +5` pay notu · Kanıt Bandı + `82/100` + durum · sonuç rozeti (işaret + mono etiket) + altında açıklama.
6. **Boş slot satırı** — sol kenar 3px `dotted #6B6259`, `.tex-slot` zemin, "Slot boş" kutusu + "Bu slot için yeterli kanıtlı aday yok." + hesaplanmış gerekçe + iki buton (`Kanıt talebi aç`, `Slotu boş bırakma gerekçesini yaz`). Bu ekranın en önemli anı; hata gibi görünmez.
7. **İlk dört sınırı** — üstte 2px, altta 1px `#101419` ayraç, `#F6F4EF` zemin. Sol "İLK DÖRT SINIRI" mono etiket, ortada saç teli çizgi, sağda "4. ile 5. arasındaki fark **N** puan" (fark ≤3 ise `#8C2F24`) + 10 hücreli sağlamlık göstergesi + "Sağlamlık N/100".
8. **Kalan satırlar** (5+) — aynı ızgara, düşük kontrast (`#FDFCFA` zemin, metin `#3C4350`, sıra no 19px).
9. **Alt bant** — "Sıralama yalnızca uzman onaylı kanıtla hesaplanır" notu + `Senaryo çalışma alanına geç` (outline) + `Kurul kararını kilitle` (dolu).

**Sağ panel (336px, `#FDFCFA`):** "İl bağlamı · Uşak · gelen öneri akışı" başlığı; sayı listesi (Gelen öneri 37 / Konu seviyesinde geçerli 22 / Uzman incelemesinde 9 / Kanıt bekliyor 13); **Kanıt sağlığı** — 12 hücreli üç bant (uzman onaylı 68, AI doğrulanmamış 24, kanıtsız 8); **Veri boşlukları** — noktalı kenarlı, dokulu üç kayıt + `Kanıt talebi oluştur`.

### Sıralama algoritması (prototipte uygulanan, birebir taşınacak)

```
puan = taban + (koken === 'mevcut' ? devamlilikPayi : 0)
liste = tüm adaylar, puana göre azalan
slot = 1..4:
  aday = sıradaki
  eğer aday.kanitYeterliligi >= kanitEsigi  → slota yerleşir
  değilse:
    aday "koşullu · kanıt eşiği altı" olarak listenin altına düşer
    sonraki eşiği geçen aday bulunur
    fark = aday.puan - sonraki.puan
    fark <= 8  → sonraki slota girer, "eşik devri ile girdi" notu
    fark >  8  → SLOT BOŞ KALIR, gerekçe metni üretilir
sonuç etiketi: ilk dörtte + mevcut → korunuyor | ilk dörtte + yeni → ekleniyor
              eşik altı → koşullu | dışta + mevcut → çıkıyor | dışta + yeni → yedek
saglamlik = clamp(46 + fark*5, 20, 96)
```

Varsayılanlar: `devamlilikPayi = 5`, `kanitEsigi = 55`. İkisi de yapılandırılabilir olmalı (prototipte Tweaks props). Örnek veri seti prototipte `KONULAR` dizisinde — sekiz konu, taban puan ve kanıt değerleriyle birlikte alınabilir.

---

## 6. Ekran: Blok 3 — Öneri Girişi (giriş serbest, mobil öncelikli)

**Amaç:** Kurumsal kayıt yok; kişi kendi adına, çoğunlukla telefondan öneri veriyor. Yedi bölümlü zorunlu form yasak. Tüm dokunma hedefleri ≥44px.

### Kademe 1 — Hızlı öneri (390px kolon)

Koyu 9px başlık şeridi ("Uşak · 2027 dönemi" / "Öneri ver"), sonra: H 24px "Bir yatırım konusu öner" + "Kanıt şart değil…" açıklaması.

- **Öneri türü** — üç seçim kartı (yeni yatırım konusu / mevcut konunun korunması / kapsam değişikliği). Seçili kart koyu dolu (`#101419`, yazı `#F6F4EF`, işaret `■`), seçili olmayan outline + `□`. **Tür seçimi formun kalanını değiştirir.**
- **Konu başlığı** (input), **Kısa tanım** (textarea 4 satır + `N / 600 karakter` sayacı), **İl** (salt okunur "Uşak · sabit değil" — il hiçbir yerde sabitlenmez), **İlçe** (select: Merkez, Banaz, Eşme, Karahallı, Sivaslı, Ulubey), **Neden burada?** (textarea 3 satır).
- **AI NACE önerisi** — kesikli amber kenar + `.tex-unverified` zemin + `◌` + "AI önerisi · doğrulamadınız". Dokununca onaylanır: düz yeşil kenar + `■` + "Onayladınız · NACE 13.10". **Onay olmadan sınıflandırma boş kalır.**
- **Gizlilik notu** yükleme öncesinde: "Adınız kamuya açık yayımda varsayılan olarak görünmez."
- `Öneriyi gönder` (48px, dolu koyu) → benzerlik katmanı. Altında: dosya `kanıt bekliyor` statüsüyle girer notu.

### Kademe 2 — Dosya güçlendirme

Kanıt Bandı burada **ilerleme çubuğu** olarak çalışır (20×24px hücre, mono 26px değer). Sağda durum rozeti: `Kanıt bekliyor` (<35) → `Kanıt eşiği altında` (35–54) → `Uzman incelemesine girebilir` (≥55) ve etki metni: "Bu öneri şu an kanıt yeterliliği düşük (41/100, eşik 55). Eksikleri tamamlarsanız uzman incelemesine girer."

Altı adım, her biri epistemik çerçeve içinde ve **sıralamaya etkisini söyler** (`eklerseniz +18 puan` / `tamam · +18 puan`):

| Adım | Puan | Tamamlanma koşulu |
|---|---|---|
| Konu başlığı ve tanım | 18 | başlık > 8 ve tanım > 40 karakter |
| İl, ilçe ve "neden burada" gerekçesi | 14 | gerekçe > 30 karakter |
| NACE sınıflandırmasını onaylama | 12 | kullanıcı onayladı |
| En az bir kanıt kartı | 22 | kanıt ≥ 1 |
| Yatırımcı ilgisi veya talep belgesi | 18 | kanıt ≥ 2 |
| Uygulanabilirlik alanları (arazi, enerji, işgücü) | 16 | kanıt ≥ 3 |

**Kanıt kartı** (bu ekranın yıldızı, 2×2 ızgara + tam genişlik alanlar): kaynak kurum · belge · sayfa/tablo · yayım tarihi · URL/dosya bırakma alanı (kesikli, dokulu) · gizlilik satırı ("Kamuya açık künye · belge içeriği yalnızca uzmanlarda"). Butonlar: `Kanıtı dosyaya ekle` (dolu), `Bu iddia için hangi kanıt gerekir?` (outline yardım).

**Destek kartı:** mono 30px sayı + "kişi bu dosyayı destekliyor" + noktalı/dokulu not: "Destek sayısı **puan girdisi değildir**. Sıralama yalnızca sekiz kriter ve uzman onaylı kanıtla hesaplanır." Altında kişisel pano özeti.

---

## 7. Overlay sistemi (bu üründe "modal" yok)

Üç tip, hepsi kare köşeli, gölgesiz, künye/sürüm damgası taşır. Perde: `rgba(16,20,25,.42)` çekmecede, `.55` benzerlikte, `.62` karar tabakasında.

### OV‑01 · Künye çekmecesi (shadcn `Sheet`, `side="right"`, 520px)
Okuma amaçlı; sayfa bağlamı görünür kalır. Sol kenar 1px `#101419`, gölge kapalı. İçerik: başlık şeridi (mono kod `KNT‑2026‑0431` + `Kapat · esc`) → doğrulama rozeti ("Uzman onaylı · S. Aydın · 04.05.2026") → **künye ızgarası** (150px etiket / değer): kaynak kurum, belge+sürüm, sayfa/tablo, yayım tarihi, coğrafi kapsam, veri dönemi, ilişkili iddia, kanıt yeterliliğine katkısı → **kaynaktan alıntı** (Newsreader 15.5px, sol 2px mürekkep ayraç) → **sınırlılık** (conflict renkli başlık) → alt eylem çubuğu (`Konu detayına git`, `Bu kanıta itiraz et`).

### OV‑02 · Karar tabakası (shadcn `AlertDialog`, 720px)
Yalnızca geri alınamaz işlemler. Üst kenar 6px `#101419`. Sağ üstte künye kutusu (Sürüm / İl·Dönem / Devamlılık payı). Gövde: geri alınamazlık açıklaması → **kilitlenecek içeriğin tam dökümü** (dört slot, boş slot dahil, sonuç etiketleriyle) → amber gerekçe uyarısı (boş slot ve çıkan konu ayrı ayrı kayda geçer; çıkar çatışması beyanı 5/5) → **onay için `KİLİTLE` yazma alanı** (mono, ls .16em). Alt çubuk: `Vazgeç` (varsayılan odak burada), açıklama metni, sağda `Kararı kilitle` — doğru kelime yazılmadıkça `disabled` (`#E2DED4` zemin, `not-allowed`). **Onay butonu görsel olarak avantajlı değil, varsayılan seçim yok** (otomasyon yanlılığına karşı).

### OV‑03 · Kayıt satırı (shadcn `Sonner`, `position="bottom-left"`)
Toast değil, defter satırı: koyu, kare, sol kenar 3px `#1D5B4A`, 420px. İçerik: mono "Kayıt satırı · 14:26 · 28.07.2026" + işlem metni + "Sürüm TR33‑2027‑v1 · geri almak için kaydı açın". Asla kritik bilgi taşımaz.

### Satır içi benzerlik katmanı (Blok 3 gönderim anı)
Alt ortada 440px tabaka, üst kenar 5px `#8A6A1F`. "Gönderim durduruldu · benzerlik bulundu" → mevcut dosya kartı (başlık, Kanıt Bandı 77/100, 11 destek, "Benzerlik %86 · başlık, NACE ve ilçe örtüşüyor") → **birincil buton `Bu dosyaya destek ver ve kanıtımı ekle`**, ikincil amber `Yine de ayrı öneri olarak gönder`, üçüncül `Forma dön`. Kural: kolay yol her zaman **birleştirme** yolu.

Tüm katmanlar `Escape` ile kapanır; odak tuzağı ve `aria-modal` zorunlu.

---

## 8. Durum yönetimi

Karar ekranı: `devamlilikPayi` (varsayılan 5), `kanitEsigi` (55), `secilenSatir`, `cekmeceAcik`, `kilitAcik`, `kilitOnayMetni`, `kayitSatiri`. Sıralama bu girdilerden **türetilir**, ayrı state'te tutulmaz — pay değiştiğinde tüm etiketler yeniden hesaplanır.

Öneri girişi: `tur`, `baslik`, `tanim`, `ilce`, `neden`, `kanitSayisi`, `naceOnay`, `benzerlikAcik`. `dosyaPuani` altı adımdan türetilir.

Veri çekme: il/dönem bağlamı URL'den (`/il/[il]/donem/[donem]`), sıralama sunucuda hesaplanmalı; istemci yalnızca senaryo denemesi yapar ve bunun **kaydedilmediğini** açıkça gösterir.

## 9. shadcn eşlemesi

| Bileşen | Kural |
|---|---|
| `Table` | Grid ile kur; satır buton semantiği taşır, klavye ile gezilir, odak halkası (`2px #8A6A1F`, offset 2px) görünür |
| `Badge` | `variant="outline"` temel; dolgu yalnızca durum tint. Radius 2px, mono 10px uppercase |
| `Sheet` | Künye çekmecesi. `side="right"`, `w-[520px]`, gölge kapalı |
| `AlertDialog` | Karar tabakası. Varsayılan odak Vazgeç'te; onay yazılı doğrulama olmadan `disabled` |
| `Sonner` | Kayıt satırı, `bottom-left`, kare, koyu |
| `Progress` | **Kullanma.** Kanıt yeterliliği için `EvidenceBand` |
| `Recharts` | Izgara 1px hairline, dolgu yok veya doku dolgusu; gradyan ve gölge yasak |

## 10. Boş / yükleniyor / hata durumları

- **Boş:** eyleme davet eder ("Bu dönemde henüz öneri yok — ilk öneriyi ver"), asla yalnız bir çizgi/ikon değil.
- **Yükleniyor:** iskelet satırlar saç teli kenarlıklı dikdörtgenler; parıltı animasyonu yok.
- **Hata:** ne olduğunu **ve** nasıl düzeltileceğini söyler; conflict rengi + düz kenar, ayrı tonlama yapılmaz.
- Kontrast AA; klavye odağı her etkileşimli öğede görünür.

## 11. Erişilebilirlik ve çıktı

Renk hiçbir bilgiyi tek başına taşımaz. Sayfa siyah‑beyaz yazdırıldığında üç epistemik durum ve Kanıt Bandı ayırt edilebilir kalır — doku ve kenar karakteri bu yüzden zorunlu. `prefers-reduced-motion: reduce` altında tüm animasyonlar 0.001ms.

## 12. Varlıklar

Görsel varlık yok. İkon yerine mono tipografik işaretler kullanılır: `■ ◌ — ◆ ▲ ▼ ·`. Yazı tipleri Google Fonts: Newsreader (400/500/600), IBM Plex Sans (400/500/600), IBM Plex Mono (400/500/600). `next/font` ile yükleyin.

## 13. Dosyalar

- `prototype/YKH-KDP Karar Ekrani ve Tasarim Dili.dc.html` — çalışan hi‑fi prototip (Blok 1, Blok 3, overlay sistemi, tasarım dili, token bloğu, öz‑kritik). Tarayıcıda doğrudan açılır; sıralama, kanıt ilerlemesi ve tüm katmanlar canlıdır.
- `prototype/urun-brifi.md` — tam ürün brifi, Blok 0–7 (henüz tasarlanmayan Blok 2, 4, 5, 6, 7 dahil).

## 14. Kapsam dışı (henüz tasarlanmadı)

Blok 2 (İddia‑Kanıt Matrisi), Blok 4 (Uzman İnceleme), Blok 5 (Puanlama/Senaryo/Duyarlılık), Blok 6 (Kurul Çalışma Alanı ve Karar Kilidi'nin tam ekranı), Blok 7 (Hesap, Triyaj, Kamu Portalı). Bunları uygularken §1'deki kurallar ve §2–4'teki token/gramer aynen geçerlidir; brifteki ilgili bölümü okuyun.

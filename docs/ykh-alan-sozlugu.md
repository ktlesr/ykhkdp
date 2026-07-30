# Alan sözlüğü — YKH

Terim kayması doğrudan hataya dönüşür. Kod, veritabanı ve arayüz aynı kelimeyi
kullanır. Türkçe terim kanoniktir.

## Çekirdek terimler

| Türkçe (kanonik) | Kod / tablo | UI etiketi |
|---|---|---|
| öneri | `oneri` · `Oneri` | "Yatırım konusu önerisi" |
| aday | `Aday` (sıralama girdisi) | tablo satırı |
| gerekçe | `oneri.gerekce` | "Neden burada?" |
| değerlendirme | `degerlendirme` | "Yapay zekâ değerlendirmesi" |
| dayanak | `dayanak` · `dayanakPuani()` | "Belge dayanağı" |
| dayanak eşiği | `dayanak_esigi` | "Dayanak eşiği" |
| alıntı | `alintilar` | "Kaynaktan alıntı" |
| belge | `belge` (ad'a göre gruplanır) | "Üst ölçekli belge" |
| parça | `belge` satırı · `parcala()` | görünmez (arama ve doğrulama birimi) |
| atıf çıpası | `belge.bolum` | "s. 92–93" · "madde 613.1" · başlık |
| düşen alıntı | `dusenler` | denetimde; ekranda gösterilmez |
| stratejik puan | `oneri_taban_puani()` | "Stratejik puan" |
| devamlılık payı | `devamlilik_payi` | "Devamlılık payı" |
| ağırlık seti | `agirlik_seti` | "Ağırlık seti" |
| slot | `slotSayisi` · `ilkDort` | "Slot" |
| kriter | `kriter` enum · `Kriter` | "Kriter" |
| gönderen | `gonderen.ref` | görünmez (takma anahtar) |
| kimlik | `kimlik` | "Hesap" |
| denetim | `denetim` | "Kayıt" |
| erişim sınıfı | `access_class` | "Veri sınıfı" |

## Kriter grupları — "neden burada?" kuralı

Programın adı **Yerel** Kalkınma Hamlesi. Bir yatırım konusunun asıl gerekçesi,
o konuyu neden **bu ilde ve ilçede** yaptığımızdır.

| Grup | UI etiketi | Kriterler | TR33-2027-v1 |
|---|---|---|---|
| `yerellik` | "Neden burada?" | yerel_potansiyel, deger_zinciri, uygulanabilirlik | **%44** |
| `etki` | "Ne üretir?" | istihdam_katma_deger, surdurulebilirlik | %24 |
| `gerceklesme` | "Gerçekleşir mi?" | pazar_talep, yatirimci_ilgisi | %20 |
| `uyum` | "Politikayla uyum" | plan_uyumu | %12 |

`YERELLIK_TABANI = 0.40` bir kalibrasyon parametresi değil, **ürün kuralıdır**:
hiçbir ağırlık seti yerellik payını %40'ın altına indiremez ve yerellik her zaman
en büyük gruptur. `agirlikSetiGecerli()` reddeder, `donemGetir()` hata fırlatır.

## Öneri durumları

`degerlendiriliyor` → `onay_bekliyor` → `listede` | `reddedildi`

`degerlendiriliyor` **kuyruğun kendisidir** — ayrı iş kuyruğu tablosu yoktur.

## Sonuç etiketleri

| Etiket | Koşul |
|---|---|
| korunuyor | mevcut konu ilk dörtte |
| ekleniyor | yeni öneri ilk dörtte |
| çıkıyor | mevcut konu ilk dört dışında |
| yedek | yeni öneri ilk dört dışında |
| dayanaksız | dayanak eşiğini geçemeyen aday |
| boş slot | yeterince gerekçelendirilebilir aday yok |

## NACE kaynağı

| Değer | UI etiketi | Ne demek |
|---|---|---|
| `kullanici` | "Yatırımcı girdi" | yatırımcı kodu biliyordu |
| `ai` | "AI atadı · doğrulanmadı" | kullanıcı boş bıraktı, AI atadı |
| `ajans` | "Ajans düzeltti" | ajans elle düzeltti |

`nace_kod` varsa `nace_kaynagi` de zorunludur (veritabanı kısıtı) — kodu kimin
koyduğu asla kaybolmaz.

## Yasak eşlemeler

- "genel skor", "başarı skoru" → **yok**. Stratejik puan ve dayanak ayrıdır.
- "onaylandı" tek başına → hangi onay? `nace_kaynagi='ajans'` mı, `durum='listede'` mi.
- "kanıt" → bu üründe kanıt kartı **yok**. Doğru terim: **belge** ve **alıntı**.
- "kurul" → bu üründe kurul kilidi **yok**. Onaylayan: **ajans**.

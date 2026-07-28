# Alan sözlüğü — YKH-KDP

Terim kayması bu projede doğrudan hataya dönüşür. Kod, veritabanı ve arayüz
aynı kelimeyi kullanır. Türkçe terim kanoniktir; İngilizce karşılık yalnızca
literatür eşlemesi içindir.

## Çekirdek terimler

| Türkçe (kanonik) | İngilizce | Kod / tablo | UI etiketi |
|---|---|---|---|
| aday | candidate | `aday` · `Aday` | "Yatırım konusu" (tablo satırı) |
| iddia | claim | `iddia` · `Iddia` | "İddia" |
| kanıt | evidence | `kanit` · `KanitKaydi` | "Kanıt" |
| bulgu | finding | `bulgu` | "AI bulgusu" |
| değerlendirme | assessment | `kriter_puani` | "Kriter puanı" |
| slot | slot | `slotSayisi` · `ilkDort` | "Slot" |
| dönem | cycle | `donem` · `DonemKaydi` | "Dönem" |
| kriter | criterion | `kriter` enum · `Kriter` | "Kriter" |
| ağırlık seti | weight set | `agirlik_seti` · `AgirlikSeti` | "Ağırlık seti" |
| devamlılık payı | continuity bonus | `devamlilik_payi` | "Devamlılık payı" |
| kanıt eşiği | evidence threshold | `kanit_esigi` | "Kanıt eşiği" |
| kanıt yeterliliği | evidence sufficiency | `kanit_yeterliligi()` | "Kanıt yeterliliği" |
| stratejik puan | strategic score | `aday_taban_puani()` | "Stratejik" |
| sıralama sağlamlığı | ranking robustness | `saglamlik` | "Sağlamlık" |
| eşik devri | threshold handover | `esikDevri` | "Eşik devri ile girdi" |
| gönderen | submitter | `gonderen.ref` (`submitter_ref`) | görünmez (takma anahtar) |
| kimlik | identity | `kimlik` | "Hesap" |
| denetim | audit | `denetim` | "Kayıt defteri" |
| erişim sınıfı | access class | `access_class` | "Veri sınıfı" |
| doğrulama durumu | verification status | `dogrulama_durumu` | bkz. epistemik gramer |

## Sonuç etiketleri (brief §2 — birebir)

| Etiket | Koşul |
|---|---|
| korunuyor | mevcut konu ilk dörtte |
| ekleniyor | yeni öneri ilk dörtte |
| çıkıyor | mevcut konu ilk dört dışında |
| koşullu | kanıt eşiğini geçemeyen aday |
| yedek | yeni öneri ilk dört dışında |
| boş slot | yeterli kanıtlı aday yok |

## Epistemik gramer (üç durum)

| Durum | `dogrulama_durumu` | Kenar | Doku | İşaret | Puana girer mi |
|---|---|---|---|---|---|
| Uzman onaylı kanıt | `uzman_onayli` | solid | yok | `■` | **evet** |
| AI bulgusu · doğrulanmadı | `ai_bulgusu`, `beyan`, `celiskili` | dashed | tarama | `◌` | hayır |
| Kanıt yok / yetersiz | `reddedildi`, kayıt yok | dotted | çapraz tarama | `—` | hayır |

## Öneri durumları

`taslak` → `kanit_bekliyor` → `triyaj` → `uzman_incelemesinde` →
`konu_adayi` | `revizyon_istendi` | `reddedildi` | `birlestirildi`

`INSTITUTION_REVIEW` YOKTUR — kurum kaydı, kurum doğrulama ve kurum onayı
bu üründe bulunmaz (brief §4).

## Yasak eşlemeler

- "genel skor", "toplam puan", "başarı skoru" → **yok**. Dört ölçüt ayrıdır.
- "oy", "beğeni", "puan verme" → **destek**; ve destek puana girmez.
- "onaylandı" tek başına → hangi onay? `uzman_onayli` mı, `nace_onayli` mı, kurul kilidi mi.
- "skor" → stratejik puan (0–100) veya kanıt yeterliliği (0–100); hangisi olduğu yazılır.

# YKH — ürün brifi

> Projenin **tek doğruluk kaynağı**. Başka her belgeyle çeliştiği yerde bu dosya geçerlidir.
> 2026-07-30'da sadeleştirildi: önceki sürüm sekiz rol, uzman doğrulama kuyruğu, kanıt
> zinciri ve kurul kilidi içeriyordu; fazla karmaşık bulundu ve kaldırıldı.

---

## 1. Ürün tanımı

Yerel Kalkınma Hamlesi kapsamında her il için dört yatırım konusu belirleniyor.
Bu platform şu akışı yürütür:

```
Yatırımcı öneri verir  →  AI puanlar  →  Ajans onaylar  →  İl sıralamasına girer
```

Yatırımcı yatırım konusu başlığını ve **neden bu ilde/ilçede** yapılması gerektiğini
yazar. NACE kodunu biliyorsa girer, bilmiyorsa yapay zekâ atar. Yapay zekâ öneriyi
üst ölçekli belgelere ve sekiz kritere göre puanlar. Puan **doğrulanmamış bir
taslaktır**; ajans onaylamadan hiçbir öneri sıralamaya girmez.

Platform resmî Portal veya E-TUYS'un yerine geçmez; yatırımcı başvuruları başlamadan
önceki politika hazırlama katmanıdır.

## 2. Beş ekran

| Yol | Kim | Ne |
|---|---|---|
| `/` | herkes | il listesi; her ilde kaç öneri listede, kaç tanesi onay bekliyor |
| `/oneri` | yatırımcı | beş alanlı form: başlık · neden burada · il · ilçe · NACE (boş bırakılabilir) |
| `/il/[il]` | herkes | o ilin sıralaması, slotlar, boş slot gerekçesi |
| `/oneri/[id]` | herkes | AI bu puanı neye dayanarak verdi: gerekçe, belge alıntıları, kriter kırılımı |
| `/onay` | ajans | AI puanladı, onay bekliyor: onayla · puanı düzelt · NACE'yi düzelt · reddet |
| `/belgeler` | ajans | üst ölçekli belge yükleme — AI'nin dayanağı |

Ayrıca `/giris` ve `/kayit`. Başka ekran yok.

## 3. Üç rol

| Rol | Yapar |
|---|---|
| `yatirimci` | öneri verir, kendi önerilerini görür |
| `ajans` | onaylar, reddeder, puanı ve NACE'yi düzeltir, belge yükler |
| `yonetici` | ajansın her şeyi + kişisel veriye erişim (denetim) |

Kurumsal kayıt, kurum doğrulama ve kurum onayı **yoktur**. Yatırımcı e-posta
doğrulamalı bir hesapla girer.

## 4. Dört öneri durumu

```
degerlendiriliyor  →  onay_bekliyor  →  listede
                                     ↘  reddedildi
```

- `degerlendiriliyor` — AI puanlıyor. Bu durum **kuyruğun kendisidir**; ayrı iş
  kuyruğu tablosu yoktur. Worker `for update skip locked` ile alır, `deneme < 3`.
- `onay_bekliyor` — puan hazır ama doğrulanmadı. Sıralamada görünmez.
- `listede` — ajans onayladı. `onaylayan_ref` ve `onay_zamani` zorunlu.
- `reddedildi` — `ret_gerekcesi` zorunlu.

Onay **geri alınabilir**. Kurul kilidi, sürüm dondurma ve salt okunur dönem yok.

## 5. Karar modeli

```
Bir (il, dönem) için:

  adaylar = listede olan öneriler (koken: mevcut | yeni)

  her aday aynı 8 kriterle ve aynı ağırlık setiyle puanlanır
  mevcut konulara açık ve sürümlü bir devamlılık payı eklenir

  sıralama = adaylar puan azalan

  slot_doldurma:
    aday.dayanak >= dayanak_esigi ise slotu doldur
    değilse "dayanaksız" işaretle; eşiği geçen sonraki aday
      devir_siniri içindeyse devralır, değilse SLOT BOŞ KALIR

  sonuç_etiketi:
    mevcut + ilk dörtte → korunuyor      yeni + ilk dörtte → ekleniyor
    mevcut + dışta      → çıkıyor        yeni + dışta      → yedek
    eşik altı           → dayanaksız     doldurulamayan    → boş slot
```

Değişmez kurallar:

- **Sabit koruma tabanı yoktur.** Dört konunun tamamı korunabilir veya değişebilir.
- **Dayanak eşiği sıralamayı ezer.** Üst ölçekli belgelere bağlanamayan aday, puanı
  yüksek olsa da slot dolduramaz. Kaynağı belirsiz bir sayı dört konuyu seçemez.
- **Devamlılık payı gizli katsayı değildir.** Sürümlü parametredir, ekranda yazar.
- **Boş slot hata değildir.** "Yeterince gerekçelendirilebilir aday yok" geçerli sonuçtur.
- **Uç durumlar işaretlenir.** Tamamı korunuyor / tamamı değişiyor / boş slot.

### Sekiz kriter, dört grup

| Grup | UI | Kriterler | TR33-2027-v1 |
|---|---|---|---|
| `yerellik` | "Neden burada?" | yerel_potansiyel %18 · deger_zinciri %14 · uygulanabilirlik %12 | **%44** |
| `etki` | "Ne üretir?" | istihdam_katma_deger %16 · surdurulebilirlik %8 | %24 |
| `gerceklesme` | "Gerçekleşir mi?" | pazar_talep %12 · yatirimci_ilgisi %8 | %20 |
| `uyum` | "Politikayla uyum" | plan_uyumu %12 | %12 |

`YERELLIK_TABANI = %40` **ürün kuralıdır**, kalibrasyon parametresi değil. Hiçbir
ajans/dönem seti yerellik payını bunun altına indiremez ve yerellik her zaman en
büyük gruptur. `agirlikSetiGecerli()` ihlali reddeder; `donemGetir()` geçersiz setle
sıralama hesaplamak yerine hata fırlatır.

Ağırlık setleri global sabit değil, `(ajans, dönem)` anahtarıyla sürümlü kayıttır.
TR33 kalibrasyonu "varsayılan" değil `TR33-2027-v1`.

## 6. AI'nin sınırları

AI **puan üretir** ama karar vermez: her puan ajans onayından geçer.

Yapar: NACE önerisi (kullanıcı girmediyse), sekiz kriter puanı, üst ölçekli
belgelerden alıntıyla gerekçe, dayanak puanı, **karşı görüş**.

Yapmaz: belgede olmayan sayı üretmek, alıntı uydurmak, aday listesi dışında NACE
kodu önermek, hangi konunun seçileceğine karar vermek.

Zorunlu kontroller — hepsi **fail-closed**:

- **Kaydedilen her alıntı pakette birebir geçer.** Bu ürünün tek pazarlıksız
  kuralı. Geçmeyen hiçbir metin kaydedilmez — puana, dayanağa, karşı görüşe,
  ekrana girmez. `paketteGeciyor()` bunu doğrulayıcıdan bağımsız ölçer ve
  `pnpm ai:eval` her koşuda kontrol eder; ihlal toleranssız kırılmadır.
- **Kapalı kaynak modu.** Model yalnızca `belgePaketi()` çıktısını görür. İnternet yok.
- **Ezber yasağı.** Model bu plan belgelerini eğitim verisinden tanıyor ve
  pakette OLMAYAN bölümlerinden alıntı yapmaya çalışıyor (ölçüldü: gerçek 12KP
  cümleleri, paket dışı). Metin gerçek olsa da pakette yoksa düşer. Paket boyu
  8'den 12'ye çıkarıldı: elinde daha çok gerçek metin olunca dışarı uzanmıyor.
- **Belge numarası pakete yereldir (1…n), veritabanı kimliği değil.** Model
  veritabanı kimlik aralığını tahmin edip uyduruyordu. Numara bir ADRES, kanıt
  değil: aralık dışı numara sert ret değildir — metin pakette bulunursa atıf
  metnin gerçekten geçtiği parçaya **düzeltilir**, bulunmazsa alıntı düşer.
  Güvenceyi veren şey kimlik değil metindir.
- **Her kriter dayanağını göstermek zorunda.** `alinti_no` eşlemesi; var olmayan
  sıraya dayandırmak sert rettir. Boş eşleme meşru, "dayanaksız kriter" görünür.
- **Alıntı birebir doğrulanır.** Kısmi kredi: eşleşmeyen alıntı *düşürülür* —
  kaydedilmez, dayanağa katkı vermez, denetime yazılır. Alıntıların **yarısından
  fazlası** düşerse model uyduruyor sayılır ve çıktının tamamı reddedilir.
  Modele VERİLMEMİŞ bir belgeden (`pakete_dahil = false`) alıntı azınlıkta olsa
  da sert rettir: o bir doğruluk hatası değil, güvenlik ihlalidir.
- **Kaynaksız sayısal token reddedilir.** Yıllar sayısal iddia sayılmaz.
- **Şema:** Zod `.strict()` + JSON Schema `additionalProperties: false`.
- **NACE önerisi aday listesiyle sınırlı.** Listede olmayan kod reddedilir.
- **Prompt injection:** belge içeriği `<icerik guvenilir="hayir">` içinde XML kaçışlı.
- **`model_snapshot` pinli;** `latest` hem uygulamada hem `check` kısıtıyla reddedilir.
- **Reddedilen çıktı KAYDEDİLMEZ.** Öneri `degerlendiriliyor` kalır, neden denetime yazılır.
- **AI ham puanı değişmez.** Ajans düzeltmesi ayrı kolona yazılır (`duzeltilmis_puanlar`);
  trigger ham puanın güncellenmesini reddeder. "Bu sayıyı kim koydu" her zaman cevaplanır.

### Karşı görüş

AI aynı belgelerle önerinin **aleyhine** en güçlü itirazı da üretir. Ajans tek
taraflı bir savunma değil, karşı tezi de görür. `/oneri/[id]` içinde bölüm —
yeni ekran yok.

| Tür | Ne demek |
|---|---|
| `baska_yerde_tanimli` | belge bu konuyu başka il/bölge/tipoloji için tanımlıyor |
| `farkli_oncelik` | belge bu alanda farklı bir önceliği öne çıkarıyor |
| `belgede_risk` | belge bu konuda darboğaz, risk veya kısıt sayıyor |
| `belgede_yok` | belge bu konuya değinmiyor; iddia belgeye dayanmıyor |

- **Alıntısız itiraz düşer.** Kaynaksız bir itiraz, tam da bu ürünün reddettiği
  şeydir; ajansın kararına giremez.
- **Boş sonuç meşrudur** ve bilgi taşır: "belgelerde bu öneriye karşı dayanak
  bulunamadı."
- **Puana ETKİ ETMEZ.** Sıralamaya da dayanağa da girmez; insanın tartacağı
  girdidir. Etki etmesi istenirse bu bilinçli bir ürün kararı olur.
- **En iyi çaba, içeriği fail-closed.** Karşı görüş üretilemezse değerlendirmeyi
  engellemez (puan zaten geçerli); ama doğrulanmamış alıntı taşıyan bir itiraz
  kaydedilmez.

### Dayanak puanı

**Puanın hangi kısmı belgeye dayanıyor** (0–100). Alıntı sayısı değil kapsama
ölçülür: model her kriter puanını hangi alıntılara dayandırdığını söylemek
zorundadır (`kriter_dayanagi`).

```
kapsama    %70  Σ kriter payı × o kriteri destekleyen alıntının en iyi örtüşmesi
çeşitlilik %30  kaç ayrı belgeye dayanıyor
```

- **Eşlenmemiş alıntı dayanak üretmez.** "Sırf sayı artsın diye alıntı eklemek"
  işe yaramaz.
- **Örtüşme** `ts_rank`'in paket içinde normalize edilmiş hâli. Öneriyle zayıf
  örtüşen parçadan gelen destek zayıf sayılır — gerçek ama konuyla ilgisiz
  alıntının yüksek dayanak alması buradan kapanır.
- **Kriter payıyla çarpılır.** `yerel_potansiyel` (%18) dayanaksız kalmak
  `surdurulebilirlik` (%8) dayanaksız kalmaktan pahalıdır: "neden burada?"
  cevaplanmadıysa dayanak düşer.
- **Boş eşleme meşrudur.** O kriter ekranda "dayanaksız kriter" yazar.
- **Numaralandırma kusuru kredi kaybıdır, ret değil.** Alıntı numarasını model
  kendisi verir (dizi indeksi değil — model 0 tabanlı indekste yanılıyor).
  Çözülemeyen veya belirsiz bir referans eşlemeden düşer, denetime yazılır ve
  dayanağı azaltır. Sert ret yalnızca belge kimliğinin yalan söylediği durumda:
  o güvenlik ihlalidir, muhasebe hatası değil.
- Hiç alıntı yoksa 0. Belge yüklenmemiş bir ilde tüm dayanaklar 0 kalır ve
  slotlar boş görünür — doğru davranış budur.

Kalan sınır: bir alıntının o kriteri **gerçekten** destekleyip desteklemediği
mekanik olarak doğrulanamaz — model aynı alıntıyı yedi kritere eşleyebilir.
Ölçülebilen: alıntı gerçek mi, öneriyle örtüşüyor mu, hangi kritere eşlendi.
Kalan yargı boşluğu ajans onayına bırakılır ve kriter başına ekranda görünür;
gizlenmiş bir sayı değildir.

## 7. Ölçek ve veri

81 il, 26 kalkınma ajansı. Pilot TR33 (Afyonkarahisar, Kütahya, Manisa, Uşak) ama
**kodda hiçbir il, ajans veya bölge sabitlenmez**.

NACE Rev.2.1 (Altılı, 2026) — 3190 kod, `packages/database/data/nace.json`.
23 kısım · 87 bölüm · 287 grup · 651 sınıf · 2142 faaliyet. Yatırımcıya yalnızca
sınıf ve faaliyet düzeyi seçilebilir olarak sunulur.

### Üst ölçekli belge kümesi

`docs/` altındaki üç gerçek plan belgesi `pnpm db:belgeler` ile yüklenir. Tek
parça verilemez (400 KB – 1 MB); paragraf sınırında **parçalara** bölünür ve her
parça ayrı `belge` satırı olur — tam metin araması ilgili parçayı bulur, alıntı
o parçanın metninde birebir aranır.

| Belge | Kapsam | Parça | Atıf çıpası (`belge.bolum`) |
|---|---|---|---|
| TR33 Bölge Planı 2024-2028 | `ajans_kod='TR33'` | 86 | `s. 92–93` — sayfa işareti |
| On İkinci Kalkınma Planı 2024-2028 | ulusal | 248 | `madde 613.1–614.4` — numaralı madde |
| Bölgesel Gelişme Ulusal Stratejisi 2024-2028 | ulusal | 260 | `8.4. TURİZM` — en yakın başlık |

**Kapsam ayrımı `belgePaketi()` filtresindedir:** ile özgü → ajansa özgü → ulusal.
Bölge planı yalnızca kendi ajansının illerinde pakete girer; kalkınma planı ve
BGUS her ilde girer. Kodda hiçbir il veya ajans sabitlenmez.

Çıpa sırası: sayfa → madde → başlık → `parça n/m`. Kimsenin bulamayacağı bir
adres atıf değildir; sıralı numara yalnızca son çare.

**Kaynak kalitesi doğrudan alıntı doğrulamasını belirler.** İki kolonlu PDF'ten
kolon-farkındalıksız çıkarılan metinde iki kolon aynı satırda birleşiyor ve
belgede birebir hiçbir cümle kalmıyor — bu hâldeki 12KP ile yapılan
değerlendirmeler bütünüyle reddedildi. Yapı farkındalıklı (başlık, tablo,
paragraf) çıkarımla üç belge de doğrulanabilir hâle geldi. Yeni belge eklenirken
ölçüt basit: **paragraf tek satırda bütün mü.** `pnpm belge:dogrula <dosya>` bunu
yüklemeden önce ölçer: ortalama satır uzunluğu, cümle ortasında biten satır oranı,
satır sonu tirelemesi, çıpa dağılımı, düzgün cümle oranı. Kötü çıkarımda ortalama
satır ~60–72 karakter, iyi çıkarımda ~150–220.

## 8. Yığın

Next.js 16 (App Router) • TypeScript strict • PostgreSQL 17 (RLS) • pnpm monorepo.

```
apps/web                      Next.js — 5 ekran + auth
apps/worker                   AI değerlendirme döngüsü (kuyruksuz)
packages/domain               roller, öneri durum makinesi, karar modeli tipleri
packages/scoring              8 kriter, sürümlü ağırlık, pay, dayanak eşiği, slot doldurma
packages/database             şema, RLS, migration, NACE yükleme, veri erişimi
packages/evidence-validation  alıntı/sayı doğrulama, dayanak puanı — fail-closed
packages/ai-gateway           Zod strict, prompt registry, model istemcisi, eval
packages/retrieval            belge paketi, NACE aday listesi
packages/observability        JSON log, maskeleme, maliyet kaydı
```

Redis, S3/MinIO, pgvector, PostGIS **yok**. Gerekene kadar eklenmez.

## 9. Veri modeli

13 tablo: `gonderen` · `kimlik` · `oturum` · `ajans` · `il` · `ilce` · `nace` ·
`agirlik_seti` · `donem` · `belge` · `oneri` · `degerlendirme` · `denetim`.

- **KVKK ayrımı:** öneri kişiye değil değişmez `gonderen.ref` anahtarına bağlanır;
  kişisel veri ayrı `kimlik` tablosunda. `kimlik_pseudonimlestir()` silme talebinde
  kimliği siler, öneri zincirini bozmaz.
- **`denetim` append-only:** RLS'te update/delete politikası yok + trigger ikinci katman.
- **Her tabloda `access_class`:** `kamuya_acik` | `kurum_ici` | `gizli`.

Ayrıntı: [ykh-guvenlik.md](ykh-guvenlik.md).

## 10. Bağlam dosyaları

```
CLAUDE.md                     → yalnızca @import satırları
docs/ykh-brief.md             → bu dosya
docs/ykh-alan-sozlugu.md      → terim sözlüğü
docs/ykh-guvenlik.md          → RLS, veri sınıfları, maskeleme
docs/ykh-calisma-protokolu.md → çalışma ve debug protokolü
```

`design_handoff_ykh_kdp/` tarihsel referanstır: §2 token seti ve §4 epistemik
gramer hâlâ geçerli, ama §5–7'deki ekranlar (kanıt bandı, uzman kuyruğu, kurul
kilidi, künye çekmecesi) bu üründe **yok**.

## 11. Bilinen sınırlar

- Eval kümesi (`pnpm ai:eval`) örnek başına üç koşu yapıp medyan alır — tek koşu
  aynı örnekte dayanak 52 ve 94 verdi. Bantlar geniş; asıl kontrol **ayırt etme**:
  aynı başlık, biri yerele bağlı gerekçeyle, diğeri "ülkemizde bu sektör
  önemlidir" gerekçesiyle; yerellik farkı ölçülür.
- `OPENAI_API_KEY` yoksa çevrimdışı deterministik istemci çalışır: belgelerden
  birebir alıntı çıkarır ama puanları ve NACE eşleşmesini kaba üretir. Doğrulama
  zinciri her iki modda aynıdır.
- Belge yükleme yalnızca `.txt`/`.md` veya metin yapıştırma. PDF/docx ayrıştırıcı yok.
- E-posta doğrulama SMTP'ye bağlı değil.
- Rapor/Excel çıktısı yok.

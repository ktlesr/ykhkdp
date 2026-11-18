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

## 2. Ekranlar

| Yol | Kim | Ne |
|---|---|---|
| `/` | herkes | tanıtım sayfası; mekanizma, kriter payları ve **gerçek bir değerlendirme kaydı** (yalnızca resmî konu) |
| `/oneri` | herkes | **öneri sihirbazı** ve yatırımcının GİRİŞ NOKTASI: kimlik → ajans bölgesi → il → öneri (tek route, dört adım) |
| `/onerilerim` | yatırımcı | kendi önerileri, **ile göre gruplu**; yatırımcının kendi alanı |
| `/oneri/[id]` | sahibi + ajans | AI bu puanı neye dayanarak verdi: gerekçe, belge alıntıları, kriter kırılımı |
| `/iller` | **ajans** | il listesi, ajans bölgesine göre katlanır; sayılar öneri kümesinden türer |
| `/il/[il]` | **ajans** | sıralama, slotlar, yürürlükteki resmî liste ve yıllar arası süreklilik |
| `/ayarlar` | ajans + **yönetici** | toplu rapor (+ Excel); yönetici ayrıca kayıtlı kullanıcılar ve palet |
| `/rapor` | ajans + yönetici | ekran değil, indirme ucu: toplu rapor `.xlsx`; `?tur=nihai&bicim=xlsx\|docx[&il=][&bolge=]` nihai liste |
| `/onay` | ajans | AI puanladı, onay bekliyor: onayla · puanı düzelt · NACE'yi düzelt · reddet · yakın kopya işareti |
| `/belgeler` | ajans | üst ölçekli belge yükleme + il bazlı kapsama — AI'nin dayanağı |
| `/belgeler/yukle` | ajans | ekran değil, belge formunun gönderim ucu: önce oturum ve rol, köken (CSRF), boyut (30 MB); gövde en son okunur |


Ayrıca `/giris` ve `/kayit`. Başka ekran yok.

### Öneri gizliliği

Bir öneri **sahibi ve ajans dışında kimseye görünmez** — onaylanmış olsa bile.
Yatırımcının yazdığı konu başlığı ticari fikirdir ve onay bir *iç* karardır,
yayın değil. Sıralama da bu yüzden ajans görünümüdür: satırları başkalarının
önerileridir.

`koken = 'mevcut'` öneriler Bakanlık listesinden birebir türer ve RLS onları
açık bırakır; onları gizlemek hiçbir şeyi gizlemezdi. Ama **kayıt sayfası
yine de kapatır**: resmî konunun platform değerlendirmesi ajansın çalışmasıdır.
Tanıtım sayfası tek bir örneği kendi içinde açar — gezinilecek bir küme değil.

`/onerilerim` bu kapatmanın doğurduğu ekrandır: yatırımcının kendi önerilerine
ulaşabileceği tek yer. Protokol §10 altıncı ekran için gerekçe ister; gerekçe
gizliliği kapatan değişikliğin kendisidir.

### Nihai liste (Excel · Word)

İl il (`/il/[il]`), bölge bölge ve tümü (`/iller`) indirilir. İçerik ekrandaki
hesabın AYNISI (`hesapla`): yalnızca onaylanmış öneriler, en çok slot kadar
asıl + slot kadar yedek; liste dışı ve dayanaksız girmez. Dosya eksiğini
söyler: boş slot, açık dönemi olmayan il ve "N öneri onay sürecinde, listede
değil" yazılır. Excel: Nihai liste · Özet · Künye; Word: bölge → il
başlıkları, asıl/yedek tabloları, gerekçeler. Kapsam veritabanında
(`app_il_kapsaminda`): ajans yalnızca kendi bölgesi; başka bölgeyi isteyen
404, bölgesiz ajans hiçbir il almaz.

### Toplu rapor ve kapsam

Ajans ve yönetici `/ayarlar` içinde **toplu öneri raporunu** görür: yürürlükteki
resmî konular ve yatırımcı önerileri, gerekçeleri, sekiz kriter puanı, belge
dayanağı ve model künyesiyle. `/rapor` aynı veriyi **`.xlsx`** olarak verir —
üç sayfa: Öneriler · Resmî liste · Künye.

Kapsam **sorguda** kurulur, sayfada değil (`raporSatirlari`):

| Rol | Görür |
|---|---|
| `yonetici` | 81 ilin tamamı |
| `ajans` | **kendi bölgesindeki illere girilmiş her kayıt** — kim girdiyse |
| `yatirimci` · misafir · anonim | hiçbiri (403) |

Ajansın bölgesi `gonderen.ajans_kod` ile tutulur (NUTS-2). **Fail-closed:**
bölgesi atanmamış bir ajans hesabı hiçbir satır görmez — eksik bilgiyle hepsini
göstermek sessiz bir yetki genişlemesi olurdu. Bu kolon şu an yalnızca rapor
kapsamını daraltır; onay kuyruğu ve belge yükleme hâlâ rol tabanlıdır.

Raporda **değerlendirilmemiş kayıt 0 yazmaz, boş kalır.** 0 bir ölçümdür;
boş "henüz ölçülmedi" demektir ve ikisi karıştırılırsa rapor yalan söyler.
Ham AI puanı ile ajans düzeltmesi ayrı sütunlarda durur, model künyesi her
satırda taşınır: "bu sayıyı kim koydu" sorusu dosyada da cevaplanır.

### Yatırımcının akışı — il listesi bir EKRAN değil, bir ADIM

Yumurta-tavuk şuydu: "il seçmek için listeyi görmeli" ile "başkasının önerisini
görmemeli" çatışıyordu. Çözüm listeyi kapatmak değil, **yerini değiştirmek**:

```
/  tanıtım  →  Başla  →  /oneri sihirbazı
                          kimlik → ajans bölgesi → il → öneri
                                   ↑ il seçimi burada, gezinilecek sayfada değil
   giriş yapınca              →  /onerilerim  (ile göre gruplu, kendi alanı)
```

`bolgeler()` yalnızca coğrafya taşır (26 ajans, 81 il, dönem yılı) ve sihirbazı
besler; sayaç taşıyan `illeriListele()` `/iller` ile birlikte ajansta kalır.
Yatırımcı `/iller` veya `/il/[il]`'ye giderse `/oneri`'ye yönlendirilir — 404
değil, çünkü ekran var, o kişi için değil.

Değerlendirmeyi ve onayı **yalnızca ajans ve yönetici** yürütür; yatırımcı
kendi önerisini yeniden değerlendirtemez. Otomatik akış değişmedi: worker
`degerlendiriliyor` durumundaki öneriyi kendisi alır.

**Tanıtım sayfası** platformun başlangıç ekranıdır ve pazarlama yüzeyi olarak
ürünle AYNI görsel dünyada durur (üst çubuk, başlık ölçeği, düğmeler,
şerit başlıklı tablo); kanıt ağı çerçeveli bir şekil olarak tek hareket
istisnasıdır. Ochre yalnızca "doğrulanmadı" anlamında. Sayılar veritabanından gelir; uydurma metrik yazılamaz.
İmza bölümü mekanizmayı anlatmaz, **çalıştığını gösterir** — gerçek bir kaydın
alıntılarını, atıf çıpalarını, model künyesini ve **belgeye bağlanamayan
kriterini** açar. Onaylanmış kayıt yoksa örnek uydurulmaz, bölüm boş görünür.

**Öneri sihirbazı** ekran eklemez: dört adım tek route ve tek istemci bileşeni
içinde yürür, gönderim `oneriEylemi` ile aynı yoldan gider. Adımlar ekranı
bölmek için değil KARARI bölmek için: yatırımcı önce nerede olduğuna, sonra ne
önerdiğine odaklanır.

## 3. Üç rol

| Rol | Yapar |
|---|---|
| `yatirimci` | öneri verir, kendi önerilerini görür |
| `ajans` | onaylar, reddeder, puanı ve NACE'yi düzeltir, belge yükler |
| `yonetici` | ajansın her şeyi + kişisel veriye erişim (denetim) |

Kurumsal kayıt, kurum doğrulama ve kurum onayı **yoktur**.

**Rolleri yönetici atar** — `/ayarlar` içindeki kayıtlı kullanıcı listesinden.
Ayrı bir "süper yönetici" rolü yok: yetkiler aynı olacaksa dördüncü bir rol
enum'a, RLS'e, testlere ve ekranlara yayılan bir maliyet olurdu. Ajans rolünde
bölge seçimi zorunlu (bölgesiz hesap toplu raporda hiçbir satır görmez); rol
ajans dışına düşerse bölge temizlenir. Kimse kendi rolünü değiştiremez.

**Misafir yatırımcı:** öneri vermek için kayıt zorunlu değil. `misafir_ac()`
kişisel veri olmadan bir `gonderen` satırı açar — `kimlik` tablosuna hiç yazılmaz
— ve oturum çerezi verir. Toplanan kişisel veri sıfır; KVKK silme talebinde
pseudonimleştirilecek bir şey yoktur. Bedeli açıkça yazılır: tarayıcı verisi
silinirse öneriye erişim biter. `gonderen.misafir` ajansa görünür, çünkü kimin
önerdiği ajans kararında saklanmaz.

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

**Asıl + yedek.** Platformun çıktısı en çok `slot_sayisi` asıl ve
`slot_sayisi` yedektir (TR33: 4 + 4). Yedek sırası eşiği geçen adaylardan,
puan sırasıyla dolar ve asılların hemen ardından numaralanır. Ötesindeki yeni
öneri **liste dışı** etiketini alır — gizlenmez, adıyla söylenir. Mevcut konu
yedekte de olsa dışarıda da olsa **çıkıyor**dur. Sınır sabit değil, ağırlık
setinden gelir.

**Aynı konu tek kez yarışır.** Başlığı farklı yazılmış aynı konu ("Emniyet
Kemeri Üretimi" ↔ "Aksaray İli Emniyet Kemeri İmalatı Tesisi") asıl listeye
birlikte girmişti — trigram benzerliği il adı ve "imalatı tesisi" kalıbı
yüzünden ayıramıyordu. `ayniKonuMu` başlığı konunun özüne indirger (yer adları,
"üretimi/imalatı/tesisi/asgari/işleme…" kalıbı ve sayılar atılır, 5 harf kök
karşılaştırılır). Ölçüldü: resmî listelerde aynı il-yıl içi 972 farklı konu
çiftinde 0 yanlış alarm; yıllar arası birebir aynı 9 konunun 9'u yakalandı.
Sıralamada (`hesapla`) aynı konudan yalnızca biri asıl/yedek olur — temsilci
dayanak eşiğini geçenler arasında en yüksek puanlı; diğerleri "aynı konu"
etiketiyle dışarıda, kimin tekrarı olduğu yazar. Keşif aynı kuralla tekrarı
kuyruğa hiç almaz (üçüncü katman). Sınır: sözcükseldir — "hava yastığı" ile
"airbag" ayrılmaz.

**Resmî konular da yarışır.** Tebliğden türeyen mevcut konular puanlanmadan
"dayanaksız" kalıyordu — gerçek puanla yarışmıyorlardı. `/il/[il]` "Belgelere
göre değerlendir" ile onları aynı hatta sokar (`listede → degerlendiriliyor`):
başlık ve tebliğ gerekçesi OLDUĞU GİBİ kalır, puan ve dayanak belgelerden
gelir, devamlılık payı eklenir, ajans yeniden onaylar. Yalnızca hiç
puanlanmamış olanlar; onaylanmış bir değerlendirme ezilmez.

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

**Model seçimi (yönetici, `/ayarlar`) — iki iş, iki model.** *Yargı*
(değerlendirme, karşı görüş, NACE, aday üretimi) az çağrı yapar, muhakeme
ister. *Tarama* (kanıt çıkarımı) çağrıların büyük çoğunluğudur ve muhakeme
istemez: pasaj kaynakta birebir yoksa doğrulayıcı düşürür. Seçenekler: OpenAI
`gpt-5.4-mini-2026-03-17`, Claude Opus 5.5 / Sonnet 5.5 / Haiku 5.5, yargı için
"ortam değişkenine göre", tarama için "yargıyla aynı". Taramada ölçüldü
(8 grup × 3 gerçek parça): Haiku 57 kanıt / 0 ret / 4 sn / ≈$0,009; Opus 66 /
0 / 9,6 sn / ≈$0,41; Sonnet 13 / 4 ret — Haiku Opus'un kanıtının ~%86'sını
~45'te bir maliyetle çıkarıyor.

**Limit yedeği.** Claude limit hatası verirse (429, 529, bakiye/kredi) çağrıyı
OpenAI `gpt-5.4-mini-2026-03-17` devralır — yargıda da taramada da. Künyeye
yanıtı veren model yazılır. Yalnızca limit devredilir: ret, şema ve kimlik
hatası gerçek hatadır, olduğu gibi görünür. OpenAI anahtarı yoksa yedek yok.
Tarama önbelleği istenen modelin anahtarıyla tutulur (yedekle taranan parça
yeniden taranmaz); kanıt metni kaynakta birebir doğrulandığı için bu güvenliği
etkilemez.

**Model belge kimliği görmez — düzeltildi (2026-11-17).** Değerlendirme ve
karşı görüş blokları `belge.id` taşıyordu (`<belge id="412">`). OpenAI'de şema
`≤ 64` sınırını üretimde zorladığı için model yanlış küçük numara yazıyor,
doğrulayıcı metinden atfı düzeltiyordu — hata gizliydi. Claude gördüğü kimliği
yazdı ve şema reddetti. Artık modele yerel numara (1…n) gider
(`degerlendirme-v7`, `karsi-gorus-v4`); şemadaki üst sınır gevşetildi çünkü
aralık dışı numara sert ret değil, metinden düzeltilir.
Doğrulama zinciri sağlayıcıdan bağımsızdır — Claude'un şema motorunun kabul
etmediği kısıtlar (minLength, maxItems…) gönderilen şemadan çıkarılır ama Zod
yanıtta aynısını uygular. Opus ve Sonnet'te ret için sunucu tarafı yedek model
açıktır; yedek devreye girerse künyeye YANITI VEREN model yazılır. Anahtarı
tanımlı olmayan sağlayıcı seçilemez; seçili sağlayıcının anahtarı çalışma
anında yoksa çağrı açık hatayla durur, başka modele sessizce düşülmez. Kanıt
önbelleği modele bağlıdır: model değişince tarama yeni modelle baştan yapılır.

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

### Aday keşfi · belgelerden konu çıkarma

`/il/[il]` içinde bölüm (yeni ekran yok); `/iller` bölge veya 81 il için toplu
başlatır. Keşif **aday üretir, puanlamaz ve seçmez**: her aday sıradan bir
`oneri` olarak `degerlendiriliyor` durumuna girer ve yukarıdaki değerlendirme
hattından AYRI bir model çağrısıyla geçer. Karar yine ajansın.

```
envanter  il + ajans + ulusal kapsamdaki BÜTÜN parçalar
tarama    her parça bir kez (il bağımsız, önbellek `kanit_tarama`):
          yerel_olgu · firsat · oncelik · kisit pasajları → `kanit`
aday      ilin kanıt defteri; model yalnızca NUMARAYLA atıf yapar
kayıt     aday → oneri (koken 'yeni', gönderen = tetikleyen, kesif_id)
```

Uydurmasızlık kuralları — hepsi mekanik, modelin beyanı değil:

- **Kanıt metni kaynaktan kesilir.** Model tırnağı/harfi değiştirse de kayda
  belgedeki özgün metin girer (`kaynaktanCikar`). "…" ile birleştirilmiş pasaj
  kanıt olamaz.
- **Yerellik cümle düzeyinde ölçülür.** Parça ilin kendi belgesiyse ya da
  pasajın cümlesinde il/ilçe adı geçiyorsa yerel. Karakter penceresi
  kullanılmaz: ölçüldü, "Kütahya'da seramik…" komşu cümledeki "Uşak'ta"
  yüzünden Uşak'a yerel sayılıyordu.
- **Aday: en az iki kanıt, en az biri yerel.** Yeni alıntı yazamaz.
- **Gerekçenin her cümlesi atıf yapılan kanıtta karşılık bulur**
  (içerik köklerinin ≥ yarısı). Ölçüldü: model defterde olup atıf yapmadığı
  bir kanıtı gerekçeye yazıyordu. Sözcüksel kontrol — yeniden ifade edilmiş
  doğru cümleyi düşürebilir, fail-closed yönde.
- **Kaynaksız sayı** başlıkta veya gerekçede aday düşürür.
- Kurallar **aday başına**: kötü aday iyileri batırmaz, iyiler kötüyü örtmez.
- **Okunamayan parça keşfi kilitlemez, gizlenmez de.** Önceki kural ("tarama
  eksikse aday üretilmez") canlıda bir ili kalıcı olarak kilitledi: 922
  parçanın 24'ü her denemede reddediliyordu. Şimdi ret nedeniyle
  `kanit_tarama`ya (`durum = 'reddedildi'`, `neden`) yazılır, keşif kalan
  parçalarla tamamlanır ve ekranda "kapsam eksik · N okunamadı" yazar.
  Reddedilen parça her keşifte bir kez daha denenir; ön tarama onu atlar.
  Ret nedenleri de azaltıldı: 429/5xx için geri çekilmeli yeniden deneme,
  tablo ayracı (`|`) eşleşmede boşluk sayılır, taramada çağrı ancak HİÇBİR
  pasaj doğrulanamazsa reddedilir (her pasaj zaten tek tek doğrulanıyor;
  puan yok, "yarısı düşerse hepsi" kuralı burada doğru pasajları da atıyordu).
- **Atıf notu sayı değildir; defter belgeler arasında dengelidir**
  (2026-11-18). Canlıda bir il 3.335 kanıtla 0 aday verdi; yerelde üretildi:
  Sonnet her cümleyi "(kanıt 22)" diye bitiriyor, "kaynaksız sayı" kuralı
  numarayı iddia sanıp yedi adayın yedisini düşürüyordu. Atıf notu gerekçeden
  silinir (kayda da girmez); gerçek sayı yine kaynakta aranır. Ayrıca defter
  yerel kanıtların İLK 80'ini alıyordu — il raporları yüklenince binlerce
  yerel kanıtın yalnızca ilk taranan bir iki belgesi görülüyordu. Şimdi 120
  kanıt belgeler arasında sırayla, belge içinde eşit aralıkla seçilir
  (`dengeliSec`). Ölçüldü (aynı il, Sonnet, 3 koşu): 0 → 5, 7, 7 aday; adaylar
  altı ayrı il raporuna dayanıyor. Sınır: 120'nin dışındaki kanıt o koşuda
  görülmez; özet mesajındaki "düşen aday" sayısı artık ürün gruplarını saymaz.
- **Önce yer, sonra nitelik; hazır başlık değil sentez** (2026-11-18,
  `aday-kesfi-v6`, `degerlendirme-v9`). Aday seçiminde belirleyici olan yere
  bağlılıktır: yalnızca o ilde/ilçede bulunan varlığa (maden, jeotermal, doğal
  ya da kültürel varlık, coğrafi işaret, küme, atıl kaynak) dayanan konu; niş
  konu (alternatif turizm, tek ilçedeki maden) meşrudur. Yere bağlı konular
  arasında mevzuattaki değerlendirme nitelikleri (YKH usul ve esasları md. 6:
  yerel ihtiyaç ve çeşitlilik, atıl kaynak, ileri-geri bağlantı, entegre
  üretim, kritik ihtiyaç ve ithalat bağımlılığı, teknoloji ve Ar-Ge, katma
  değer, pazar ve ihracat, istihdam) kanıtıyla taşıyan öne alınır; puanlama
  talimatı sekiz kriteri aynı niteliklerle okur. Proje sahibine ait ölçütler
  (finansal yapı, geri dönüş, tutar, süre, kapasite) konu düzeyinde bilinmez,
  kullanılmaz. Kriter seti ve ağırlıklar DEĞİŞMEDİ. Model belgenin adıyla
  önerdiği yatırımı geri vermek yerine kanıtları birleştirir (varlık +
  kabiliyet + talep/öncelik). Bunun için adayda iki ayrı alan var: **gerekçe**
  olgudur ve her cümlesi kanıtta karşılık bulur; **sentez** modelin
  çıkarımıdır, kanıtta aranmaz ama kanıtta olmayan sayı taşıyamaz (taşırsa
  sentez düşer, aday kalır) ve kayıtta "Yapay zekâ çıkarımı (belgede yazmaz):"
  etiketiyle gerekçenin sonuna eklenir. Ölçüldü (gpt-5.4-mini, Afyonkarahisar
  ve Aksaray): 6'şar aday, çıkarım cümlesi yüzünden düşen yok; adayların bir
  kısmı sentez (süt dışarı gidiyor + küme + yöresel ürün → koyun-keçi sütü
  işleme), bir kısmı hâlâ fizibilite raporunun kendi başlığı. Sayı denetimi
  ayraç biçimini fark saymaz ("2,247" ↔ "2.247").
- **Tekrarlanan keşif kuyruğu şişirmez.** Model dönemde zaten önerilmiş
  başlıkları görür ve eşdeğerini önermez; kayıtta mekanik iki katman daha:
  dönemdeki herhangi bir öneriyle (reddedilen dahil) başlık benzerliği ≥ 0.50
  ya da kanıtlarının yarısı aynıysa aday yazılmaz, denetime yazılır.
  Ölçüldü: aynı konu farklı yazım 0.48–0.67, farklı konu 0.06–0.30; 0.48'de
  kalan aynı-konu çiftini kanıt örtüşmesi yakalar.

**En iyi en üstte.** Onay kuyruğu ve il ekranı onay bekleyenleri "onaylanırsa
il listesinde nereye girer" öngörüsüyle sıralar (`lib/projeksiyon.ts`):
karar modelinin kendisi (`hesapla`), onaylı konularla birlikte — ayrı formül
yok. Gerçek sıralama onayla oluşur.
- **Resmî konuyu yeniden önermek meşrudur** — yürürlükteki liste gelecek yıl
  "önceki" olur. Model yürürlükteki ve önceki yılların resmî konularını
  bağlam olarak görür (kanıt değil); başlığı harfi harfine aynı yazarsa:
  yürürlükteki konuysa kopya açılmaz, keşif kanıtları o konunun kaydına
  eklenir ve puanlanmamışsa değerlendirmeye alınır; önceki yıl konusuysa
  yeni aday olur. "Resmî listede: 2025" rozeti modelin beyanından değil
  başlığın birebir eşleşmesinden gelir.
- Değerlendirme paketi adayı doğuran parçaları **zorunlu** taşır
  (`belgePaketi({ zorunlu })`).

Hız: tarama 6 eşzamanlı çağrıyla (`YKH_TARAMA_ESZAMANLI`) ve düşük akıl
yürütme düzeyiyle (`YKH_TARAMA_EFOR=low`) yürür — ölçüldü, çağrı başına
19–35 sn → 5,6–8,6 sn, kanıt sayısı düşmeden. Doğruluğu modelin muhakemesi
değil mekanik doğrulayıcı güvenceler; puanlama ve aday üretimi `medium`da
kalır. Worker boştayken önbellekte olmayan parçaları **önceden tarar**:
yeni belge yüklendiğinde keşif başlamadan tarama hazırdır. Gömme/RAG
eklenmedi: tarama sorgusuz bir "bütün metni oku" işidir, getirme onu
hızlandırmaz, yalnızca bazı parçaları atlatır.

Bölge: ajans yalnızca kendi bölgesinin illerinde keşif açar (`kesif_ac` RLS,
`app_il_kapsaminda`). Aynı dönemde tek aktif koşu.

### Konu kapsamı ve çoklu NACE

Tek ürün ("hava yastığı") yatırımcı havuzunu daraltabilir; çıplak sektör adı
("otomotiv") "neden burada?" sorusunu cevaplamaz. İyi konu çoğu zaman ilin
kanıtlı kabiliyetine dayanan bir ürün AİLESİDİR — ama her sektörde değil:
dar ve güçlü dayanaklı konu da meşrudur. (Ajans uzmanının Aksaray örneği:
"Motorlu kara taşıtlarına yönelik ileri teknoloji bileşenleri ve üstyapı
sistemleri" + ürün grupları.) Tasarım Codex incelemesiyle düzeltildi:

- **Ürün grupları** `oneri.kapsam` [{ad, kanit_id[]}]. Keşifte her grup KENDİ
  kanıtına dayanır; grubun ayırt edici kökü (başlıktaki şemsiye kelimeler ve
  "sanayi, üretim…" gibi genel kökler hariç) kendi kanıtında geçmeli, geçmeyen
  grup düşer (aday düşmez). Grup "ilin kabiliyeti" ya da "ulusal öncelik"
  olarak işaretlenir. Kullanıcı yazdıysa "belgeye bağlanmadı" görünür.
- **Genişlik puan değildir.** Kriter seti ve ağırlıklar değişmedi. Puanlayıcı
  `degerlendirme.kapsam_notu` üretir — dar / ürün ailesi / aşırı geniş /
  kanıt yetersiz — PUANA VE SIRALAMAYA ETKİ ETMEZ, ajansın kararına girer.
  Prompt açıkça: ürün grubu sayısı hiçbir kriteri kendiliğinden yükseltmez.
  Canlı sınama (tek koşu, Sonnet): hava yastığı tek başına → "dar"; ilgisiz 8
  grupla şişirilmiş konu → "aşırı geniş", yatırımcı ilgisi en düşük.
- **Çoklu NACE.** Ana kod `oneri.nace_kod` kalır (sıralama, rapor değişmez).
  Ek kodlar `oneri_nace`: her biri bir ürün grubuna bağlı, o grubun KENDİ aday
  listesinden (grup adıyla + başlıkla iki arama birleşir); uydurma grup, başka
  grubun kodu, tekrar ve ana kodla aynı kod düşer. Kullanıcı ana kodu girmiş
  olsa da çalışır; en iyi çaba, değerlendirmeyi engellemez. Ajansın düzelttiği
  kodlar ezilmez.
- Eval geçti (Sonnet): yerel/genel 77/38, belgeli/belgesiz 81/8 — önceki turla
  aynı. Eksik: dar ↔ aile ↔ şişirme çiftlerini Aksaray belgeleriyle eval'e
  eklemek.

### Konu puanla

Ajans `/il/[il]` içinde başlık ve "neden burada?" açıklaması girer; konu
yatırımcı önerisiyle **aynı yoldan** (`oneriEylemi` → değerlendirme hattı)
geçer ve sonuç `/oneri/[id]` içinde canlı ilerlemeyle açılır: stratejik puan
(sekiz kriter, dönemin ağırlık seti), belge dayanağı, kriter başına alıntı,
karşı görüş. Ayrı bir puan hesaplayıcı yazılmadı — iki hesap iki doğru demektir.

### Yalnızca başlıkla uygunluk analizi

"Konu puanla" formunda (ajans; yeni ekran yok) gerekçe yazmadan yalnızca
başlık verilir: "bu konu bu ile uygun mu?" İlin TARANMIŞ kanıtlarından
başlığın ayırt edici kökleriyle örtüşenler bulunur (en çok 40 yerel, belgeler
arasında dengeli + 20 diğer) ve yargı modeli karar verir
(`konu-uygunlugu-v1`): **uygun · kısmen · uygun değil**. Uygunsa gerekçeyi
(olgu) ve etiketli çıkarımı hazırlar, dayandığı pasajları gösterir; "Gerekçeyi
forma aktar" ile konu normal yoldan puanlanır. Değilse nedenini yazar.

- Kurallar aday kurallarının AYNISI (`uygunluguDogrula`): "uygun" kararı ancak
  gerekçe en az iki kanıta, biri yerel olmak üzere dayanıyor, kaynaksız sayı
  taşımıyor ve her cümlesi kanıtta karşılık buluyorsa kalır; aksi hâlde
  "belgelere bağlanamadı" ve neden mekanik kuralın kendisidir.
- Model çağrılmadan cevaplanan durumlar: belgeler taranmamış; başlıkla örtüşen
  kanıt yok; kanıt var ama hiçbiri bu ile özgü değil.
- Puanlamaz, kaydetmez, sıralamaya dokunmaz; yalnızca denetime yazılır
  (`konu_uygunlugu`). Sonuç taslaktır.
- Ölçüldü (gpt-5.4-mini, 4–9 sn): Afyonkarahisar mermer atığı ve Aksaray
  perlit "uygun"; Afyonkarahisar zeytinyağı ("kanıtlar Akhisar ve Manisa
  bağlamında") ve Aksaray gemi inşa "uygun değil"; termal sağlık "kısmen".
- Sınır: eşleşme sözcükseldir (5 harf kök); eşanlamlı yazılmış konu
  ("airbag") kanıtını bulamaz. Yalnızca ajans/yönetici: kanıt defteri
  yatırımcıya açık değil.

### Yakın kopya · AI yok

Aynı (il, dönem) içinde başlıkları benzeşen öneriler `/onay` ekranında
işaretlenir. `pg_trgm` benzerliği — deterministik, tekrarlanabilir, model yok.
Sonuç bir karar değil, ajansın bakması gereken yeri gösteren işaret.

Eşik `BENZERLIK_ESIGI = 0.35`, gerçek başlık çiftleriyle ölçüldü ve
`database.test.ts` içinde sabitlendi: aynı konu 0.37–0.70, farklı konu
0.06–0.30. Geri çağırma lehine seçildi — fazladan işaret gürültü, kaçırılan
kopya iki kez onaylanmış aynı konu.

### Belge kapsaması

`/belgeler` her il için kaç ile özgü, kaç ajansa özgü, kaç ulusal belge
olduğunu gösterir. Ulusal belge her ilde geçerli; **yerel belge yoksa
"neden burada?" grubu ulusal metinden gerekçelendirilemez** ve dayanak düşük
kalır. Ajans bunu tahmin etmek zorunda kalmasın.

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

81 il, 26 kalkınma ajansı — `packages/database/data/ajans.json`. Resmî veri
kodda sabitlenmez, NACE gibi veri dosyasından yüklenir.

`ajans.kod` **NUTS-2 (İBBS-2) bölge kodudur**, ajans kısaltması değil: 26 ajans
26 NUTS-2 bölgesine birebir denk düşer ve ağırlık seti sürümü buna bağlıdır
(`TR33-2027-v1`). Günlük kısaltma ayrı kolonda (`ajans.kisa_ad`: ZAFER, AHİKA,
DOĞAKA) ve ekranda kodun yanında görünür; Türkçe harf taşıdığı için anahtar
olarak kullanılmaz. `il.kod` ASCII katlanmış slug (`afyonkarahisar`, `usak`).

**Dönemin varlığı ile ağırlık seti ayrı şeylerdir.** Program yıllık ve 81 ilin
tamamını kapsıyor (2025 ve 2026 tebliğleri bunu gösteriyor), yani her ilin açık
dönemi olması bir **program olgusudur**. Ağırlık seti ise bir **ajans
kalibrasyonudur** ve 25 ajans adına uydurulamaz. Ayrım şöyle çözüldü:

- **Dönem 81 ilin tamamında açılır.**
- `agirlik_seti.ajans_kod` **null olabilir**: null = ulusal varsayılan
  (`ULUSAL-2027-v1`), dolu = o ajansın yayımladığı kalibrasyon.
- Kalibrasyonu olmayan il ulusal varsayılanı kullanır ve `/il/[il]` bunu
  **ekranda yazar**: "… henüz kendi ağırlık setini yayımlamadı; ulusal
  varsayılan uygulanıyor." Gizli katsayı yok (§5).

Bu ayrım olmadan 77 il "açık dönem yok" diye kalıyordu; oysa dönemin olmaması
bir politika kararı değil, benim fazla temkinli davranmamdı.

**İlçe verisi yalnızca dört pilot il için var** (21 ilçe). Kalan 77 il için ilçe
listesi yüklenmemiştir ve uydurulmaz: öneri formu o illerde ilçeyi hiç sormaz,
öneri il düzeyinde kaydedilir (`oneri.ilce` null). Bilinen boşluk — ilçe verisi
eklenince form kendiliğinden sorar.

NACE Rev.2.1 (Altılı, 2026) — 3190 kod, `packages/database/data/nace.json`.
23 kısım · 87 bölüm · 287 grup · 651 sınıf · 2142 faaliyet. Yatırımcıya yalnızca
sınıf ve faaliyet düzeyi seçilebilir olarak sunulur.

### Resmî yatırım konuları listesi

Sanayi ve Teknoloji Bakanlığı **Yerel Yatırım Konuları Listesi Tebliği** —
her il için o yılın dört yatırım konusu. `docs/` altındaki iki JSON dosyası
`pnpm db:konular` ile yüklenir: 2025 ve 2026, 81 il × 4 konu = 648 kayıt.
2026 tebliğinde her konunun **gerekçesi** de var (226–810 karakter).

Bu liste `oneri` tablosuna **zorlanmaz**, kendi tablosunda (`yatirim_konusu`)
durur. Zorlansaydı iki şey uydurmak gerekirdi: `gonderen_ref` (kimse önermedi,
Bakanlık ilan etti) ve `onaylayan_ref` (ajans onaylamadı).

Karar modelindeki **`koken='mevcut'` adaylar buradan türetilir** — gerçek
başlık, gerçek gerekçe, kaynağı denetime yazılı. Türetilen adaya **uydurma
değerlendirme yazılmaz**: platform onları henüz puanlamadı, dayanakları 0 ve
sıralamada "dayanaksız" görünüyorlar. Bu doğru davranış ve ürünün kendi
kuralının gösterimi — mevcut konu da belgeye bağlanmak zorunda.

Yükleyici **fail-closed**: 81 ilin tamamı ve il başına tam 4 konu şartı
sağlanmazsa dosya hiç yüklenmez ve hangi ilin eksik olduğu yazılır. Yatırım
konusunu yanlış ile atamak, bu ürünün var olma sebebi olan hatadır.

`/il/[il]` **açık dönem olmadan da çalışır**: 81 ilin 77'sinde dönem yok ve o
illerin yürürlükteki resmî listesi yüklü olduğu hâlde görünmüyordu. Dönem yoksa
sıralama yok, resmî liste yine var. `/iller` da 81 ilin tamamını listeler.

### Yıllar arası süreklilik

Bir konunun bir önceki listede karşılığı olup olmadığı gösterilir, ama
**benzerlik karar vermez**:

| Durum | Ne demek |
|---|---|
| `aynen` | başlık **birebir aynı** — kanıtlanabilir olgu |
| `benzer` | yakın başlık var ama yeniden yazılmış — **doğrulanmadı**, iki başlık yan yana konur |
| `yok` | önceki listede karşılık bulunamadı |

Resmî başlıklar çok ortak kalıp taşıyor ("Katma Değerli Ürün Üretimi",
"Entegre … İşleme Tesisi") ve trigram benzerliğinin gürültü tabanı var:
ölçüldü, Muş'ta "Entegre Kaz Yetiştiriciliği" ile "Su Ürünleri Yetiştiriciliği"
0.48 alıyor — farklı konular. "Bakanlık bu konuyu korudu" bir olgu iddiasıdır;
eşikle verilmez. Eşleme **birebirdir**: bir önceki yılın bir konusu en fazla
bir konuya eşlenir, aksi hâlde aynı konu iki yere birden eşleşiyordu.

Ölçülen: 324 konunun **16'sı aynen**, 53'ü benzer, 255'i yeni.

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

**Parça etiketi aralıktır, alıntının yeri değil.** "madde 470.2–474.1"
parçanın kapsadığı maddeler; ekran alıntının KESİN maddesini kaynakta arayarak
gösterir ("madde 471.2", `alintininMaddesi`). Alıntı parçanın ilk madde
başından önce geçiyorsa madde uydurulmaz, "maddeler … arası parça" yazılır.
Madde etiketi yalnızca madde numaralı belgede verilir (≥20 numaralı paragraf,
en az biri ≥100): bilgi notundaki "1. Amaç" listesi madde değildir. Sayfa
işaretleri parça metninde tutulmadığı için kesin sayfa hesaplanmaz; sayfa
etiketi parçanın sayfa aralığıdır.

**Kütüphane belgeleri.** Kalkınma Kütüphanesi'nden (kalkinmakutuphanesi.gov.tr)
2019 ve sonrası 623 il/ajans raporu Markdown'a çevrilip `docs/kutuphane/`
altına alındı (26 ajans, 63 il, ~29,5 bin parça); `pnpm db:kur` yalnızca
sistemde olmayanı yükler, ajansın sildiği geri gelmez. Kapsam sitenin
etiketinden ve başlığından gelir, metinle sınanır; kalite ölçerinden
geçemeyen, taranmış (OCR yok), bozuk kodlamalı, Türkçe olmayan ve kopya
belgeler alınmaz — nedenleriyle `docs/kutuphane/rapor.json`. Ölçüldü: rastgele
2.400 cümlenin %99,75'i PDF ham metninde birebir. Ayrıntı:
`docs/kutuphane/README.md`.

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

18 tablo: `ayar` · `gonderen` · `kimlik` · `oturum` · `ajans` · `il` · `ilce` · `nace` ·
`agirlik_seti` · `donem` · `belge` · `yatirim_konusu` · `oneri` · `degerlendirme` ·
`denetim` · `kesif` · `kanit` · `kanit_tarama`.

- **KVKK ayrımı:** öneri kişiye değil değişmez `gonderen.ref` anahtarına bağlanır;
  kişisel veri ayrı `kimlik` tablosunda. `kimlik_pseudonimlestir()` silme talebinde
  kimliği siler, öneri zincirini bozmaz. Misafir gönderende `kimlik` satırı hiç
  oluşmaz (`gonderen.misafir = true`) — bu ayrım sonradan eklenmedi, model bunu
  baştan destekliyordu.
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
docs/ykh-dagitim.md           → Dokploy'a üretim dağıtımı, adım adım
```

## 10a. Üretim kurulumu

`pnpm db:reset` üretimde **asla** çalıştırılmaz: ilk işi `truncate … cascade`.
Üretimin komutu `pnpm db:kur` (`packages/database/src/kur.ts`) ve iki şeyi
ayırır:

| Yüklenir (gerçek veri) | Yüklenmez (demo) |
|---|---|
| NACE, 26 ajans, 81 il, 4 pilot ilin ilçeleri | demo hesaplar |
| resmî tebliğ listeleri (648 konu) | varsayımsal yatırımcı önerileri |
| ağırlık setleri + 81 ilde dönem | `seed-demo` künyeli sahte değerlendirmeler |
| resmî listeden türeyen `mevcut` adaylar | |
| ilk yönetici hesabı | |

Tekrar çalıştırılabilir: her adım ya `on conflict do nothing` ya kendi
anahtarını silip yeniden yazar. Her dağıtımda koşar.

Ayrıca `ykh_app` rolünün parolasını `YKH_APP_PAROLA` ile **değiştirir** —
migration onu depoda yazılı bir sabitle açıyor ve o parolayla üretime çıkmak
olmaz.

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
- Belge yükleme PDF, Word (.docx), Excel (.xlsx), `.txt`/`.md` ya da metin
  yapıştırma (`lib/belge-cevir.ts`, en çok 30 MB). PDF ve Word'den çıkan metin
  kalite ölçerinden geçmeden yüklenmez; taranmış PDF okunmaz (OCR yok). PDF'te
  tablo algılama kabadır: aynı satırdaki ayrık hücreler tablo satırı olur, çok
  satırlı hücreler bölünür. Ölçüldü (kütüphane PDF'leri): 60 belgenin 53'ü
  ölçerden geçti; 900 cümlenin %97,6'sı PDF ham metninde birebir — kalanı
  komşu tablo hücrelerinin birleşmesi. Kütüphane aktarımındaki PyMuPDF
  dönüştürücü (%99,75) daha iyidir; toplu aktarım için o kullanılır. Yüklemeden
  önce önizleme yok. Word/Excel ayrıştırılmadan önce her iç parça gerçekten
  açılarak ölçülür (toplam 150 MB sınırı; beyan edilen boyuta güvenilmez). Dönüştürme
  ana süreçte değil AYRI iş parçacığında koşar (`lib/belge-cevir-surec.ts`):
  yığın sınırı 768 MB, zaman aşımı 90 sn (`YKH_CEVIRI_YIGIN_MB`,
  `YKH_CEVIRI_SURE_MS`); aşan dosyada yalnızca işçi sonlanır, site ayakta
  kalır. Yığın dışı bellek için kapsayıcı düzeyinde sınır ayrıca önerilir.
- E-posta doğrulama SMTP'ye bağlı değil.
- Hız sınırı süreç içi (tek web konteyneri varsayımı); birden çok kopyada
  paylaşılan sayaç gerekir. Öneri kotası veritabanında, kopyadan bağımsız.
- Belge çeşitliliği `belge.ad` ile sayılır: aynı adlı farklı yıl/kapsam
  belgeleri tek kaynak görünür. Kalıcı kaynak kimliği ayrı bir şema işidir.
- Model kriter başına `not` ve `eksik_veri` üretiyor ama saklanmıyor; saklamak
  şema değişikliği ister, ayrı plan (inceleme raporu §6.2).
- CI yok. Plan: PostgreSQL 17 servisi, `_test` veritabanı, çevrimdışı istemci,
  sıralı testler, typecheck, build, `pnpm audit --prod`.
- Aday keşfinde üretici ile puanlayıcı aynı model; ayrı çağrı ama kendi
  ürettiğini kayırma yanlılığı henüz ölçülmedi (plan: kaynağı gizli, sırası
  karışık çapraz eval). Keşif adayının gerekçesi değerlendirme prompt'unda
  hâlâ "yatırımcının gerekçesi" etiketiyle gider.
- Seed'in demo değerlendirmeleri `model_snapshot = 'seed-demo'` künyesi taşır;
  gerçek bir model künyesi uydurulmaz. `/oneri/[id]` künye satırında görünür.

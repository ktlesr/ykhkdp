# Dokploy'a dağıtım — adım adım

> Bu dosya "sunucuyu ilk kez kuran kişi" için yazıldı. Hiçbir adım "bunu zaten
> bilirsin" varsaymıyor. Sırayla uygula, atlama.
>
> Yerelde uçtan uca denendi: dört servis ayağa kalktı, kurulum tamamlandı, web
> 200 döndü, worker döngüye girdi. Ölçümler §10'da.

---

## 0. Neye ihtiyacın var

| | |
|---|---|
| Sunucu | 2 vCPU · 4 GB RAM · 20 GB disk (Ubuntu 22.04+) |
| Dokploy | sunucuda kurulu, panele girebiliyorsun |
| Alan adı | ör. `ykh.kurumun.gov.tr` — **A kaydı sunucunun IP'sine bakıyor olmalı** |
| GitHub | `ktlesr/ykhkdp` deposuna erişim |
| OpenAI | API anahtarı — **zorunlu değil** (yoksa çevrimdışı istemci çalışır) |

Dokploy kurulu değilse sunucuda tek komut:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Bitince tarayıcıdan `http://SUNUCU_IP:3000` → ilk Dokploy hesabını aç.
**Bu hesap Dokploy'un kendi hesabı**, YKH yöneticisiyle ilgisi yok; ikisini
karıştırma.

---

## 1. Üç parola üret — ve hangisinin nereye gittiğini bil

Sunucuda ya da kendi bilgisayarında **üç kez** çalıştır:

```bash
openssl rand -hex 24
```

Üç ayrı çıktı alacaksın, her biri 48 karakterlik bir dize:

```
7f3a1c9b2e5d8a6f4c0b1d9e3a7f2c5b8d1e4a9c6f0b3d7e   ← 1. çıktı
2b8e5c1f9a4d7b0e3c6f2a5d8b1e4c7f0a3d6b9e2c5f8a1d   ← 2. çıktı
9c4f1a7e3b6d0c9f2a5e8b1d4c7f0a3e6b9d2c5f8a1e4b7d   ← 3. çıktı
```

### Hangisi nereye gidiyor

| # | Değişken adı | Kim kullanır | Ne işe yarar |
|---|---|---|---|
| **1** | `POSTGRES_PAROLA` | yalnızca `kurulum` servisi | **Şema sahibi** (`ykh_owner`). Tablo oluşturur, migration çalıştırır, RLS'i baypas eder. Web ve worker bunu **hiç görmez**. |
| **2** | `YKH_APP_PAROLA` | `web` + `worker` | **Uygulama rolü** (`ykh_app`). Superuser değil, tablo sahibi değil, `BYPASSRLS` taşımıyor. Satır güvenliği bu rolde uygulanır. |
| **3** | `YKH_YONETICI_PAROLA` | **sen**, tarayıcıdan | YKH platformuna giriş yapacağın yönetici hesabının parolası. Veritabanıyla ilgisi yok — `/giris` ekranına yazacağın şey. |

Yani: 1 ve 2 **makinelerin** birbirine bağlanma parolası, 3 **senin** giriş
parolan. Üçünü de bir parola yöneticisine kaydet; 1 ve 2'yi bir daha yazmayacaksın,
3'ü her giriş yapışında yazacaksın.

> **Neden iki ayrı veritabanı parolası?** Uygulamanın şemayı değiştirebilen
> bir bağlantıyla çalışması, bir SQL enjeksiyon açığının tablo silmesi
> demektir. Ayrım ürünün güvenlik temeli ([ykh-guvenlik.md](ykh-guvenlik.md)
> §1); birleştirmeyin.

### Neden `-hex 24`, `-base64 32` değil

İki ayrı sebep, ikisi de önemli:

**1 · Alfabe.** Parola bir bağlantı adresinin içine giriyor:

```
postgres://ykh_app:PAROLA@postgres:5432/ykhkdp
```

`openssl rand -base64` çıktısında `/` `+` `=` bulunabiliyor. `/` bu adresi
**ayrıştırılamaz** yapıyor, `@` ise ana makine adını kaydırıyor. Ölçüldü:

```
base64 · "/" içeriyor   → AYRIŞTIRILAMADI: Invalid URL
hex                     → DOĞRU
```

`-hex` çıktısı yalnızca `0-9a-f` — hiçbir kaçış gerektirmiyor. Kurulum artık
bunu **kontrol ediyor**: adresi bozacak bir karakter varsa hata verip duruyor,
üretimde "bazen bağlanamıyor" diye aranan bir kusur doğmuyor.

**2 · Uzunluk.** `-hex 24` **24 bayt** rastgelelik üretir = **192 bit**
= 48 karakter. Kaba kuvvetle kırmak için gereken deneme sayısı 2¹⁹²; evrenin
yaşı boyunca saniyede trilyon deneme yapsan bitiremezsin. 32 bayt (256 bit)
yanlış değil, sadece **gereksiz** — ikisi de "asla kırılamaz" kategorisinde ve
48 karakter panele yapıştırmak için daha rahat.

İstersen `-hex 32` kullan, hiçbir şey bozulmaz. Kural şu: **`-hex` olsun ve en
az 24 bayt olsun.**

---

## 2. Dokploy'da proje ve uygulama oluştur

1. Panelde **Projects** → **Create Project**. Ad: `ykh-kdp`. Kaydet.
2. Projenin içinde **Create Service** → **Compose**.
   - "Application" değil, **Compose** — dört servis var, tek uygulama değil.
3. Ad: `ykh`. Kaydet.
4. Açılan ekranda **General** sekmesi:
   - **Provider**: `GitHub`
   - Depo listesi boşsa **Settings → Git → GitHub → Install GitHub App** ile
     Dokploy'a erişim ver, sonra buraya dön.
   - **Repository**: `ktlesr/ykhkdp`
   - **Branch**: `main`
   - **Compose Path**: `docker-compose.production.yml`
5. **Save**. **Deploy'a HENÜZ BASMA** — önce ortam değişkenleri.

---

## 3. Ortam değişkenlerini gir

**Environment** sekmesine geç. Aşağıdaki bloğun tamamını yapıştır, sonra
`<...>` yazan yerleri doldur.

```env
# ══ 1 · VERİTABANI ══════════════════════════════════════════════════════════
# 1. openssl çıktısı. Şema sahibi; yalnızca kurulum servisi kullanır.
POSTGRES_PAROLA=<1. çıktı>

# 2. openssl çıktısı. Uygulama rolü; web ve worker bunu kullanır, RLS uygulanır.
# Yalnızca harf/rakam olmalı — bağlantı adresinin içine giriyor.
YKH_APP_PAROLA=<2. çıktı>

# ══ 2 · İLK YÖNETİCİ HESABI ═════════════════════════════════════════════════
# Kurulumda bir kez açılır. Zaten varsa dokunulmaz, parola sıfırlanmaz.
YKH_YONETICI_EPOSTA=ad.soyad@kurumun.gov.tr
YKH_YONETICI_PAROLA=<3. çıktı>
YKH_YONETICI_AD=Ad Soyad

# ══ 3 · ÜST ÖLÇEKLİ BELGELER ════════════════════════════════════════════════
# İLK kurulumda `evet`. Kurulum bitince `hayir` yapıp yeniden dağıt (§6).
YKH_KUR_BELGELER=evet

# ══ 4 · YAPAY ZEKÂ ══════════════════════════════════════════════════════════
# BOŞ BIRAKILABİLİR. Anahtar yoksa çevrimdışı deterministik istemci devreye
# girer: doğrulama zinciri aynen çalışır, puanlar ve NACE eşleşmesi kaba olur.
OPENAI_API_KEY=

# Pinli model künyesi. Boş bırakılırsa gpt-4.1-2025-04-14 kullanılır.
# `latest` YASAK — hem uygulama hem veritabanı kısıtı reddeder.
YKH_MODEL_SNAPSHOT=

# ══ 5 · WORKER VE LOG ═══════════════════════════════════════════════════════
# Kuyruk boşken bekleme (ms). Üretimde 5000 yeterli; düşürmek maliyeti artırır.
YKH_WORKER_ARALIK=5000

# debug | info | uyari | hata
YKH_LOG_SEVIYE=info
```

### Değişkenlerin tam listesi

Compose dosyasının okuduğu **her** değişken — başka yok:

| Değişken | Zorunlu | Varsayılan | Nerede kullanılır |
|---|---|---|---|
| `POSTGRES_PAROLA` | **evet** | — | postgres, kurulum |
| `YKH_APP_PAROLA` | **evet** | — | kurulum, web, worker |
| `YKH_YONETICI_EPOSTA` | **evet** | — | kurulum |
| `YKH_YONETICI_PAROLA` | **evet** | — | kurulum |
| `YKH_YONETICI_AD` | hayır | `Yönetici` | kurulum |
| `YKH_KUR_BELGELER` | hayır | `hayir` | kurulum |
| `OPENAI_API_KEY` | hayır | boş | web, worker |
| `YKH_MODEL_SNAPSHOT` | hayır | boş | web, worker |
| `YKH_WORKER_ARALIK` | hayır | `5000` | worker |
| `YKH_LOG_SEVIYE` | hayır | `info` | hepsi |

Zorunlu olanlardan biri eksikse **kurulum başlamadan durur** ve hangisinin
eksik olduğunu yazar. Sessizce yanlış çalışmaz.

`DATABASE_URL` ve `DATABASE_URL_OWNER` **elle girilmez** — compose dosyası
onları yukarıdaki parolalardan kendisi kuruyor. Yerel geliştirmede kullandığın
`.env` dosyasındaki değerlerle karıştırma; üretimde o dosya yok.

**Save** ile kaydet.

---

## 4. Alan adını ve HTTPS'i bağla

**Domains** sekmesi → **Add Domain**:

| Alan | Değer |
|---|---|
| Host | `ykh.kurumun.gov.tr` |
| Service Name | `web` ← **dikkat**, `postgres` veya `worker` değil |
| Container Port | `3000` |
| Path | `/` |
| HTTPS | **açık** |
| Certificate Provider | `Let's Encrypt` |

**Save**.

> ### HTTPS'i atlama — atlarsan hiç kimse giriş yapamaz
>
> Oturum çerezi üretimde `secure` işaretiyle yazılıyor
> ([ykh-guvenlik.md](ykh-guvenlik.md) §8). `secure` çerezi tarayıcı **yalnızca
> HTTPS üzerinden** geri gönderir. HTTP'de: giriş formunu doldurursun, sunucu
> çerezi yazar, tarayıcı bir sonraki istekte göndermez, sen giriş sayfasına
> geri düşersin. Hiçbir hata mesajı görmezsin.
>
> "Giriş çalışmıyor, sürekli geri atıyor" dersen **ilk bakacağın yer burasıdır.**

Let's Encrypt sertifikayı alabilmek için alan adının A kaydı **zaten** sunucuya
bakıyor olmalı. DNS yayılması 5 dakika–1 saat sürebilir; sertifika hatası
alırsan biraz bekleyip **Deploy**'a tekrar bas.

---

## 5. Dağıt

**Deploy** düğmesine bas. İlk dağıtım **5–10 dakika** sürer — iki Docker imajı
sıfırdan kuruluyor.

**Logs** sekmesinden `kurulum` servisini izle. Sırayla göreceklerin:

```
> @ykh/database@0.0.0 kur
> node src/cli.ts kur

Kurulum tamam — 13 migration · ykh_app parolası ayarlandı · 3190 NACE kodu ·
26 ajans · 648 resmî yatırım konusu · 81 ilde 2027 dönemi ·
yönetici hesabı açıldı · 324 mevcut aday · 594 belge parçası
```

Bu satırı gördüysen veritabanı hazır.

> `kurulum` konteyneri sonra **kapanır** ve Dokploy'da **"exited"** görünür.
> **Bu hata değil** — işini bitirdi. Bir kez çalışıp çıkan bir servis.

Ardından `web` ve `worker` başlar. Worker'ın ilk satırı:

```
{"seviye":"info","mesaj":"worker_basladi","aralik":5000,"maksDeneme":3}
```

Üç servisin durumu: `postgres` running · `web` running · `worker` running ·
`kurulum` exited. Doğru tablo budur.

---

## 6. İlk dağıtımdan sonraki tek ayar

**Environment** sekmesine dön, tek satırı değiştir:

```env
YKH_KUR_BELGELER=hayir
```

**Save** → **Deploy**.

> **Neden?** Belge yükleme, `belge` satırlarını ada göre silip yeniden yazıyor
> ve `belge.id` değişiyor. Kayıtlı değerlendirmelerin alıntı atıfları o
> kimliği taşıyor: doğrulanmış **alıntı metni** durur, ama **adres** eskir.
> Belgeleri yalnızca gerçekten değiştirdiğinde yeniden yükle.

---

## 7. Çalıştığını doğrula — sırayla

1. **`https://ykh.kurumun.gov.tr`** açılıyor mu? Adres çubuğunda kilit
   simgesi olmalı. Hero'da hareketli kanıt ağı görünmeli.
2. **`/giris`** → 3. adımdaki `YKH_YONETICI_EPOSTA` ve `YKH_YONETICI_PAROLA`
   ile gir.
3. Üst barda **Ayarlar** görünmeli. Aç:
   - **Toplu öneri raporu** → `324 kayıt · 0 değerlendirildi · 26 bölge`
   - **Excel olarak indir** → `.xlsx` inmeli. Aç: üç sayfa (Öneriler · Resmî
     liste · Künye), başlık satırı kalın, ilk satır dondurulmuş.
   - **Kayıtlı kullanıcılar** → tek satır: senin hesabın, e-posta **maskeli**
     (`a****@kurumun.gov.tr`). Maskeli görmen doğru davranış.
4. **`/iller`** → 81 il, 26 ajans başlığı altında katlanır gruplar.
5. **`/oneri`** → sihirbaz açılmalı; "Kayıt olmadan devam et" çalışmalı.
6. Çıkış yap, `/iller` adresine tekrar git → **`/oneri`'ye yönlendirilmelisin.**
   Yönlendirilmiyorsan bir şey yanlış.

Hepsi tamamsa dağıtım başarılı.

---

## 8. İlk operasyon işleri

### Ajans kullanıcısı aç

Şu an yalnızca senin yönetici hesabın var. Ajans uzmanları:

1. Uzman `/kayit` adresinden normal hesap açar (rolü `yatirimci` olur).
2. Sen onu ajansa yükseltirsin. Dokploy → `postgres` servisi → **Terminal**:

```sql
update gonderen set rol = 'ajans', ajans_kod = 'TR33'
where ref = (select gonderen_ref from kimlik where eposta = 'uzman@ajans.gov.tr');
```

`TR33` yerine o ajansın **NUTS-2 kodunu** yaz (`ajans` tablosunda `kod`
sütunu; ZAFER = TR33, AHİKA = TR71, …).

> **`ajans_kod` atamayı unutma.** Boş kalırsa o kullanıcı toplu raporda
> **hiçbir satır göremez**. Bu bilinçli: bölgesi bilinmeyen bir hesaba
> "hepsini göster" demek sessiz bir yetki genişlemesi olurdu. Ama bilmezsen
> "rapor bozuk" sanırsın.

### Yedekleme kur

Dokploy → proje → **Backups** → `postgres` servisi → günlük yedek, hedef S3 ya
da yerel disk. **Yedeksiz üretim yoktur.**

### Worker'ı izle

İlk gerçek öneri geldiğinde `worker` loglarında `degerlendirme_tamam` satırı
görünmeli. Görünmüyorsa `OPENAI_API_KEY` boş olabilir — o durumda çevrimdışı
istemci çalışır, öneri yine puanlanır ama puanlar kaba olur.

---

## 9. Sonraki dağıtımlar

`main` dalına push ettiğinde Dokploy otomatik yeniden dağıtır (Auto Deploy
açıksa). Her dağıtımda `kurulum` servisi yeniden çalışır ve bu **güvenlidir**:
hiçbir şeyi silmez, demo veri yazmaz, var olanı ikizlemez. İkinci çalıştırmada
göreceğin satır:

```
Kurulum tamam — şema güncel · ykh_app parolası ayarlandı · … ·
yönetici hesabı zaten var · 0 mevcut aday · …
```

> ### `pnpm db:reset` üretimde ASLA çalıştırılmaz
>
> İlk işi `truncate … cascade` — bütün öneriler, değerlendirmeler ve
> kullanıcılar gider. Üretimin komutu **`pnpm db:kur`** ve compose dosyası
> zaten onu çağırıyor. `db:reset` yalnızca yerel geliştirme içindir.

---

## 10. Yerelde alınan ölçümler

Bu rehber yazılmadan önce tüm yığın yerelde ayağa kaldırıldı:

```
kurulum   13 migration · ykh_app parolası ayarlandı · 3190 NACE · 26 ajans ·
          648 resmî konu · 81 ilde 2027 dönemi · yönetici açıldı ·
          324 mevcut aday · 594 belge parçası
web       HTTP/1.1 200 OK · hero ve kanıt ağı render oldu
worker    worker_basladi · aralik 5000 · maksDeneme 3
imaj      web 260 MB · worker 286 MB

tekrar çalıştırma → "şema güncel · yönetici zaten var · 0 mevcut aday"
                    hiçbir şey ikizlenmedi

parola   ağ üzerinden ykh_app'e bağlanma denemesi:
         ykh_app_parola (depoda yazılı)  → password authentication failed
         kesinlikle-yanlis               → password authentication failed
         <verilen parola>                → 81 il

DSN      base64 parola "/" içeriyorsa    → Invalid URL (bağlanamaz)
         hex parola                      → doğru
```

Son iki blok ölçüm yanlışını da içeriyor:

- Konteyner **içinden** `127.0.0.1` ile yapılan parola sınaması **yanıltıcı**:
  orada `pg_hba` `trust` diyor ve her parola geçiyor. Gerçek sınama ağ
  üzerinden yapılmalı — uygulama da oradan bağlanıyor.
- İlk sürümde `openssl rand -base64 24` öneriliyordu; base64 alfabesi `/`
  içeriyor ve bağlantı adresini bozuyor. `-hex`e geçildi ve kurulum artık
  bozuk biçimli parolayı **reddediyor**.

---

## Sorun giderme

| Belirti | Sebep | Çözüm |
|---|---|---|
| `kurulum`: "… tanımlı değil" | zorunlu değişken eksik | §3'teki tabloya bak |
| `kurulum`: "YKH_APP_PAROLA varsayılan değerde" | depodaki sabit parola bırakılmış | `openssl rand -hex 24` |
| `kurulum`: "yalnızca harf, rakam ve . _ ~ - içerebilir" | base64 parola kullanılmış | `openssl rand -hex 24` |
| `kurulum`: "en az 12 karakter olmalı" | yönetici parolası kısa | uzat |
| Giriş yapılamıyor, forma geri dönüyor | HTTPS yok | §4 · Let's Encrypt |
| Sertifika alınamıyor | DNS henüz yayılmamış | A kaydını doğrula, 15 dk sonra tekrar Deploy |
| `/ayarlar` boş rapor (ajans hesabı) | `gonderen.ajans_kod` atanmamış | §8'deki SQL |
| `kurulum` "exited" görünüyor | normal | bir kez çalışıp çıkan servis |
| Öneriler `degerlendiriliyor`da takılı | worker durmuş | `worker` loglarına bak, servisi restart et |
| Tanıtım sayfasında imza bölümü boş | hiçbir resmî konu değerlendirilmemiş | doğru davranış; ajans bir konuyu değerlendirince dolar |
| Yatırımcı `/iller`'i görebiliyor | dağıtım eski sürümde kalmış | son commit'i çektiğini doğrula |

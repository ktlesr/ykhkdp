# Dokploy'a dağıtım — adım adım

> Bu dosya "sunucuyu ilk kez kuran kişi" için yazıldı. Her adımda **ne
> yapacağın** ve **nasıl anlayacağın** var. Komutları sırayla uygula, atlama.
>
> Yerelde uçtan uca denendi: `docker compose -f docker-compose.production.yml`
> ile dört servis ayağa kalktı, kurulum tamamlandı, web 200 döndü, worker
> döngüye girdi. Ölçümler §9'da.

---

## 0. Neye ihtiyacın var

| | |
|---|---|
| Sunucu | 2 vCPU · 4 GB RAM · 20 GB disk (Ubuntu 22.04+) |
| Dokploy | sunucuda kurulu ve panele girebiliyor olman |
| Alan adı | ör. `ykh.kurumun.gov.tr`, A kaydı sunucunun IP'sine bakıyor |
| GitHub | `ktlesr/ykhkdp` deposuna erişim |
| OpenAI | API anahtarı (opsiyonel — yoksa çevrimdışı istemci çalışır) |

Dokploy kurulu değilse sunucuda tek komut:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Kurulum bitince tarayıcıdan `http://SUNUCU_IP:3000` adresine gir, ilk yönetici
hesabını aç.

---

## 1. Parolaları önce üret

Dört gizli değer gerekiyor. **Şimdi üret ve bir parola yöneticisine kaydet** —
sonra adım adım panele yapıştıracaksın.

Sunucuda ya da kendi bilgisayarında:

```bash
openssl rand -base64 24   # POSTGRES_PAROLA        için
openssl rand -base64 24   # YKH_APP_PAROLA         için
openssl rand -base64 18   # YKH_YONETICI_PAROLA    için
```

> **Neden ayrı iki veritabanı parolası?** `ykh_owner` şemayı değiştirebilir ve
> RLS'i baypas eder; yalnızca kurulum adımı onu kullanır. `ykh_app` uygulamanın
> rolü — superuser değil, tablo sahibi değil, `BYPASSRLS` taşımıyor. Web ve
> worker **yalnızca** onu görür. Bu ayrım ürünün güvenlik temeli
> ([ykh-guvenlik.md](ykh-guvenlik.md) §1), bozmayın.

> **Önemli:** `ykh_app` rolü migration'da `ykh_app_parola` sabit parolasıyla
> açılıyor ve o parola herkese açık depoda yazılı. Kurulum adımı ilk iş olarak
> onu senin verdiğin parolayla **değiştiriyor**. `YKH_APP_PAROLA` varsayılan
> değerde bırakılırsa kurulum başlamadan hata verir.

---

## 2. Dokploy'da proje ve uygulama oluştur

1. Dokploy panelinde **Projects → Create Project**. Ad: `ykh-kdp`.
2. Proje içinde **Create Service → Compose**.
3. **Provider: GitHub** seç, `ktlesr/ykhkdp` deposunu bağla, branch `main`.
   - Depo özelse Dokploy'un GitHub App'ini yetkilendirmen gerekir
     (Settings → Git → GitHub → Install).
4. **Compose Path** alanına şunu yaz:

   ```
   docker-compose.production.yml
   ```

5. Kaydet. **Deploy'a henüz basma** — önce ortam değişkenleri.

---

## 3. Ortam değişkenlerini gir

Uygulamanın **Environment** sekmesine geç ve aşağıdakini yapıştır. Sağdaki
sütun ne yazacağını söylüyor.

```env
POSTGRES_PAROLA=<1. adımdaki birinci parola>
YKH_APP_PAROLA=<1. adımdaki ikinci parola>

YKH_YONETICI_EPOSTA=ad.soyad@kurumun.gov.tr
YKH_YONETICI_PAROLA=<1. adımdaki üçüncü parola>
YKH_YONETICI_AD=Ad Soyad

# İLK kurulumda evet. Sonra hayir yapıp yeniden dağıt (bkz. §6).
YKH_KUR_BELGELER=evet

# Boş bırakılabilir: anahtar yoksa çevrimdışı deterministik istemci çalışır,
# doğrulama zinciri aynen işler ama puanlar kaba olur.
OPENAI_API_KEY=

# Boş bırakılırsa gpt-4.1-2025-04-14 kullanılır. `latest` YASAK.
YKH_MODEL_SNAPSHOT=

YKH_WORKER_ARALIK=5000
YKH_LOG_SEVIYE=info
```

`YKH_YONETICI_PAROLA` **en az 12 karakter** olmalı, yoksa kurulum durur.

---

## 4. Alan adını ve HTTPS'i bağla

**Domains** sekmesi → **Add Domain**:

| Alan | Değer |
|---|---|
| Host | `ykh.kurumun.gov.tr` |
| Service Name | `web` |
| Container Port | `3000` |
| HTTPS | açık |
| Certificate | Let's Encrypt |

> **HTTPS zorunlu.** Oturum çerezi üretimde `secure` işaretiyle yazılıyor;
> HTTP üzerinden tarayıcı onu göndermez ve **hiç kimse giriş yapamaz**. Beyaz
> ekran görüp "giriş çalışmıyor" dersen ilk bakacağın yer burasıdır.

Yalnızca `web` servisine alan adı ver. `postgres` ve `worker` dışarı
açılmıyor — compose dosyasında port yayımlanmıyor, bilerek.

---

## 5. Dağıt

**Deploy** düğmesine bas. İlk dağıtım 5–10 dakika sürer (iki imaj kuruluyor).

**Logs** sekmesinden `kurulum` servisini izle. Beklenen son satır:

```
Kurulum tamam — 13 migration · ykh_app parolası ayarlandı · 3190 NACE kodu ·
26 ajans · 648 resmî yatırım konusu · 81 ilde 2027 dönemi ·
yönetici hesabı açıldı · 324 mevcut aday · 594 belge parçası
```

Bu satırı gördüysen veritabanı hazır demektir. `kurulum` konteyneri işini
bitirip **kapanır** — "exited" görmen normaldir, hata değil.

Sonra `web` ve `worker` başlar. Worker'ın ilk satırı:

```
{"seviye":"info","mesaj":"worker_basladi","aralik":5000,"maksDeneme":3}
```

---

## 6. İlk dağıtımdan sonra tek ayar

`YKH_KUR_BELGELER` değerini **`hayir`** yap ve yeniden dağıt.

> **Neden?** Belge yükleme, `belge` satırlarını ada göre silip yeniden yazıyor
> ve `belge.id` değişiyor. Kayıtlı değerlendirmelerin alıntı atıfları o
> kimliği taşıyor: doğrulanmış **alıntı metni** durur ama **adres** eskir.
> Belgeleri yalnızca gerçekten değiştirdiğinde yeniden yükle.

---

## 7. Çalıştığını doğrula

Sırayla:

1. `https://ykh.kurumun.gov.tr` açılıyor mu — hero'da hareketli kanıt ağı
   görünmeli.
2. `/giris` → 3. adımdaki yönetici e-postası ve parolasıyla gir.
3. Üst barda **Ayarlar** görünmeli. Aç:
   - **Toplu öneri raporu** 324 kayıt göstermeli (81 il × 4 resmî konu).
   - **Excel olarak indir** düğmesi `.xlsx` indirmeli, üç sayfa: Öneriler ·
     Resmî liste · Künye.
   - **Kayıtlı kullanıcılar** bölümünde tek satır: senin hesabın, e-posta
     maskeli (`a****@…`).
4. `/iller` → 81 il, 26 ajans başlığı altında.
5. `/oneri` → sihirbaz açılmalı, "Kayıt olmadan devam et" çalışmalı.

Hepsi tamamsa dağıtım başarılı.

---

## 8. İlk operasyon işleri

**Ajans kullanıcısı aç.** Şu an yalnızca yönetici hesabı var. Ajans
kullanıcıları normal `/kayit` akışından `yatirimci` olarak açılır, sonra
rolleri ve bölgeleri veritabanından yükseltilir. Dokploy → `postgres`
servisi → **Terminal**:

```sql
-- Rolü ajansa çevir ve bölgesini ata (NUTS-2 kodu, ör. TR33)
update gonderen set rol = 'ajans', ajans_kod = 'TR33'
where ref = (select gonderen_ref from kimlik where eposta = 'uzman@ajans.gov.tr');
```

> **Bölge atamayı unutma.** `ajans_kod` boş kalırsa o kullanıcı toplu raporda
> **hiçbir satır göremez** — bu bilinçli: eksik bilgiyle hepsini göstermek
> sessiz bir yetki genişlemesi olurdu.

**Yedekleme kur.** Dokploy → proje → **Backups** → `postgres` servisi için
günlük yedek, S3 ya da yerel disk. Yedeksiz üretim yoktur.

**Worker'ı izle.** İlk gerçek öneri geldiğinde `worker` loglarında
`degerlendirme_tamam` satırı görünmeli. Görünmüyorsa `OPENAI_API_KEY` boş
olabilir — o durumda çevrimdışı istemci çalışır ve puanlar kaba olur.

---

## 9. Yerelde alınan ölçümler

Bu rehber yazılmadan önce tüm yığın yerelde ayağa kaldırıldı:

```
kurulum   13 migration · ykh_app parolası ayarlandı · 3190 NACE · 26 ajans ·
          648 resmî konu · 81 ilde 2027 dönemi · yönetici açıldı ·
          324 mevcut aday · 594 belge parçası
web       HTTP/1.1 200 OK · hero ve kanıt ağı render oldu
worker    worker_basladi · aralik 5000 · maksDeneme 3
imaj      web 260 MB · worker 286 MB

tekrar çalıştırma  → "şema güncel · yönetici hesabı zaten var · 0 mevcut aday"
                     (hiçbir şey ikizlenmedi)

parola   ağ üzerinden ykh_app'e bağlanma denemesi:
         ykh_app_parola          → password authentication failed
         kesinlikle-yanlis       → password authentication failed
         <verilen parola>        → 81 il
```

Son blok önemliydi: konteyner içinden `127.0.0.1` ile yapılan sınama
**yanıltıcı** — orada `pg_hba` `trust` diyor ve her parola geçiyor. Gerçek
sınama ağ üzerinden yapılmalı; uygulama da oradan bağlanıyor.

---

## 10. Sonraki dağıtımlar

`main` dalına push ettiğinde Dokploy otomatik yeniden dağıtır (Auto Deploy
açıksa). Her dağıtımda `kurulum` servisi yeniden çalışır ve bu **güvenlidir**:
hiçbir şeyi silmez, demo veri yazmaz, var olanı ikizlemez.

**`pnpm db:reset` üretimde ASLA çalıştırılmaz.** İlk işi `truncate … cascade` —
tüm öneriler, değerlendirmeler ve kullanıcılar gider. Üretimin komutu
`db:kur`, ve compose dosyası zaten onu çağırıyor.

---

## Sorun giderme

| Belirti | Sebep | Çözüm |
|---|---|---|
| `kurulum` hemen hata veriyor: "… tanımlı değil" | zorunlu ortam değişkeni eksik | §3'ü tekrar gözden geçir |
| "YKH_APP_PAROLA varsayılan değerde" | depodaki parola bırakılmış | yeni parola üret |
| Giriş yapılamıyor, form geri dönüyor | HTTPS yok, `secure` çerez gönderilmiyor | §4 · Let's Encrypt |
| `/ayarlar` boş rapor gösteriyor (ajans) | `gonderen.ajans_kod` atanmamış | §8'deki SQL |
| Öneriler `degerlendiriliyor`da takılı | worker durmuş | `worker` loglarına bak, servisi yeniden başlat |
| Tanıtım sayfasında imza bölümü boş | hiçbir resmî konu değerlendirilmemiş | doğru davranış; ajans bir konuyu değerlendirince dolar |

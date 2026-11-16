# Güvenlik — RLS, veri sınıfları, maskeleme

## 1. Bağlantı ayrımı

| Bağlantı | Rol | Kullanım | RLS |
|---|---|---|---|
| `sahip()` | `ykh_owner` (superuser) | yalnızca migration ve seed | baypas |
| `uygulama()` | `ykh_app` | web + worker | **uygulanır** |

`ykh_app` superuser değildir, tablo sahibi değildir ve `BYPASSRLS` taşımaz.
Tüm tablolarda `FORCE ROW LEVEL SECURITY` açıktır.

## 2. İstek bağlamı

Her istek `islem(baglam, ...)` içinde bir transaction açar ve şunları bağlar:

```sql
select set_config('app.rol', $1, true);            -- true = SET LOCAL
select set_config('app.gonderen_ref', $2, true);
```

`SET LOCAL` transaction kapsamındadır: havuzdaki bağlantı bir sonraki isteğe
önceki kimliği taşıyamaz. Değişken yoksa `app_rol()` `'anonim'` döner ve
yalnızca kamuya açık satırlar görünür — **fail-closed**.

## 3. Veri sınıfları (`access_class`)

| Sınıf | İçerik | Kimler görür |
|---|---|---|
| `kamuya_acik` | il, ilçe, NACE, ağırlık seti, belge, listede olan öneri, değerlendirme | herkes |
| `kurum_ici` | gönderen kaydı, denetim izi | ajans ve yönetici |
| `gizli` | kimlik (e-posta, ad, parola özeti), oturum | yönetici |

Üç sınıf var; önceki dört sınıflı model (`kisitli` dahil) kaldırıldı.

`app_gorebilir(sinif)` fonksiyonu ile `@ykh/domain`'deki `gorebilir(rol, sinif)`
**aynı tabloyu** uygular. İkisi ayrışırsa `packages/domain/src/domain.test.ts`
ve `packages/database/src/database.test.ts` birlikte kırılır.

## 4. Politikasız tablo yoktur

Her tabloda en az bir SELECT politikası vardır. Yazma politikası olmayan tabloda
yazma sessizce 0 satır etkiler (RLS filtresi), hata fırlatmaz — bu bilinçlidir ve
`denetim` için trigger ile pekiştirilmiştir.

Özel durumlar:

- **`denetim`** — INSERT var, UPDATE/DELETE politikası **yok**. Ayrıca
  `denetim_degistirilemez()` trigger'ı RLS baypas edilse bile reddeder.
- **`oneri`** — öneri yalnızca sahibinde ve ajansta görünür, **onaylanmış olsa
  bile** (`gonderen_ref = app_ref() or app_onaylayabilir() or koken = 'mevcut'`).
  Tek istisna `koken = 'mevcut'`: o satırlar kamuya açık `yatirim_konusu`
  tablosundan türer. Önceki politika `durum = 'listede'` olan her öneriyi
  herkese açıyordu — onay yayın demek değildir.
  Yatırımcı kendi önerisini `listede` veya `koken='mevcut'` olarak açamaz.
  Durum değişimi yalnızca onaylayan rollerde.
- **`degerlendirme`** — önerisi görünüyorsa görünür; yazma yalnızca ajans.
  `degerlendirme_ham_puan_sabit` trigger'ı `puanlar`, `model_snapshot` ve
  `prompt_surum` güncellemesini reddeder — AI provenance'ı korunur.
- **`belge`** — herkes okur, yalnızca ajans yazar.
- **`gonderen`** — güncelleme YALNIZCA yönetici. Politika önce
  `ref = app_ref() or app_rol() = 'yonetici'` diyordu: herkes kendi satırını
  güncelleyebiliyordu ve `gonderen` yalnızca `rol`/`ajans_kod` taşıdığı için bu,
  bir yatırımcının **kendini yönetici yapabilmesi** demekti. Rol ataması
  arayüze eklenene kadar ulaşılabilir yol yoktu; 0014 ile kapatıldı.
  Rol ataması `rol_atandi` olarak denetime yazılır.

Veritabanı düzeyinde iş kuralları (`check` kısıtları):

- `oneri_nace_kaynagi` — `nace_kod` varsa `nace_kaynagi` de zorunlu.
- `oneri_onay_izi` — `durum='listede'` ise `onaylayan_ref` + `onay_zamani` zorunlu.
- `oneri_ret_gerekcesi` — `durum='reddedildi'` ise gerekçe zorunlu.
- `degerlendirme_snapshot_pinli` — `model_snapshot <> 'latest'`.

## 5. RLS'i aşan üç kapı (`security definer`)

Kimlik doğrulaması bağlam oluşmadan önce çalışır; bu üç fonksiyon RLS'i
**yalnızca** bunun için ve sınırlı çıktıyla aşar:

| Fonksiyon | Döndürdüğü |
|---|---|
| `giris_kimlik(eposta)` | `gonderen_ref`, `parola_hash` — başka hiçbir kolon |
| `eposta_kayitli(eposta)` | boolean |
| `oturum_coz(token_hash)` | ref, rol, eposta, ad_soyad (yalnızca geçerli oturum) |
| `hesap_ac(...)` | yeni `gonderen.ref`; yalnızca `yatirimci` rolü açılabilir |

Ayrıca `oneri_taban_puani(oneri_id, agirliklar)`: RLS'i aşma gerekçesi
"**kırılımı gizle, toplamı aç**" idi — kamu ile ajans farklı sıralama
hesaplamasın diye. Öneri gizliliği açıldıktan sonra aynı fonksiyon "id dene,
başkasının puanını oku" kapısına dönüşürdü; görünürlük kontrolü fonksiyonun
**içine** alındı ve göremediğin öneri için 0 döner. Kamu artık sıralama
hesaplamıyor, kapı yalnızca `koken = 'mevcut'` konular için anlamlı kalıyor.

### Bağlamın sınırı

RLS bağlamı (`app.rol`, `app.gonderen_ref`) uygulama tarafından `set_config`
ile **bildirilir**. Politikalar ve `security definer` içi kontroller
(`kimlik_pseudonimlestir` 0015 ile yalnızca yönetici) **uygulama hatasına**
karşı savunmadır; `ykh_app` parolasını ele geçirip ham SQL yazabilen biri
bağlamı da taklit edebilir. Bu yüzden `oturum` tablosunun koşulsuz politikası
(`oturum_hepsi`) bu turda değiştirilmedi: daraltmak `hesap_ac`/`misafir_ac`/
`oturum_coz` fonksiyonlarının sahip rolüyle FORCE RLS'e takılıp takılmadığına
bağlı ve üretimde sahip rolü superuser olmayabilir. Ayrı plan: fonksiyon
sahipliğini netleştir, sonra `oturum` politikasını kendi satırıyla sınırla.

## 6. Maskeleme

Log: `@ykh/observability` `eposta`, `ad_soyad`, `parola`, `jeton`, `token_hash`,
`authorization` alanlarını iç içe nesnelerde de maskeler.

Belge metni maskelenmez — üst ölçekli belgeler kamuya açık politika belgeleridir.

## 7. KVKK — silme talebi

### Kayıtlı kullanıcı listesi (yönetici)

`/ayarlar` içinde. Kişisel veri **maskeli** döner (`k****@ykh.local`, `A***`)
ve maskeleme **SQL'de** yapılır: açık değer uygulama katmanına hiç gelmezse
log'a, hata izine veya bir React ağacına sızma yolu da kalmaz.

Tek bir kaydı açmak ayrı bir eylemdir (`kimlikAc`), **gerekçe ister** ve
`kimlik_goruntulendi` olarak denetime yazılır. KVKK'nın istediği yetkiyi
kaldırmak değil, kullanımını kayıt altına almaktır: liste okumak ifşa değil,
tekil açmak ifşadır.

`kimlik_pseudonimlestir(ref)`:

1. `kimlik` satırında e-posta, ad, parola özeti silinir, `pseudonimlestirildi`
   işaretlenir.
2. Oturumlar silinir.
3. Denetime kayıt düşülür — **aktör yöneticidir**, silinen kişi değil.
   Önceki sürüm `aktor_ref = p_ref` yazıyordu ve kayıt "bu kişi kendi verisini
   sildi" anlamına geliyordu; izin tek işi olan soruyu yanlış cevaplıyordu
   (0013 ile düzeltildi).

`gonderen.ref` ve ona bağlı öneri/değerlendirme zinciri **bozulmaz**.

## 8. Kimlik doğrulama

- Giriş: IP başına toplam (20/10 dk); hesap+IP başına başarısız deneme (10/15 dk);
  IP'den bağımsız hesap başına 30 başarısız denemeden sonra o hesaba
  BİLİNMEYEN IP'den gelen denemeler sıraya alınır (tek tek, 3 sn arayla; en çok
  10 bekleyen, fazlası reddedilir). O hesapla daha önce başarılı giriş yapılmış
  IP sıraya girmez. Kalan risk: aktif saldırı sırasında hesabın sahibi YENİ bir
  cihaz/ağdan giriş yaparken reddedilebilir; tam çözüm CAPTCHA ya da e-posta
  ile tek kullanımlık bağlantıdır (ürün kararı, henüz yok) (dağıtık tahmine karşı; sert engel hesabı herkesin
  kilitleyebileceği bir anahtar yapardı). Anahtar citext ile aynı
  biçimde (yerelden bağımsız) küçültülür; deneme doğrulamadan önce sayılır,
  başarıda geri alınır.
- Hız sınırı (`apps/web/lib/sinir.ts`): giriş IP ve hesap başına, kayıt ve
  misafir açma IP başına, öneri IP başına + gönderen başına günlük kota
  (veritabanında, atomik). IP, Traefik'in **eklediği** `x-forwarded-for`
  değeridir (sondan `YKH_PROXY_SAYISI`, varsayılan 1); istemcinin yazdığı ilk
  değere güvenilmez. Varsayılanlar kodda; değiştirmek için `YKH_SINIR_*` /
  `YKH_KOTA_ONERI_GUNLUK` / `YKH_PROXY_SAYISI` üretim compose'una da eklenmeli.
  Ajans ve yönetici öneri kotasına tabi değildir.
- Girişten sonraki yönlendirme yalnızca uygulama içi yola yapılır.
- Parola: `node:crypto` scrypt, N=32768 r=8 p=1, 32 baytlık özet, format
  `scrypt$N$r$p$tuz$ozet` — parametre değişse de eski özetler doğrulanır.
- Oturum: 32 bayt rastgele jeton; çerezde jetonun kendisi, veritabanında
  yalnızca SHA-256 özeti. Çerez `httpOnly`, `sameSite=lax`, üretimde `secure`.
- Giriş hatası tek mesaj döndürür: hesabın var olup olmadığı sızmaz.

## 9. AI güvenliği

- Kapalı kaynak modu: model yalnızca `belgePaketi()` çıktısını görür.
- Belge içeriği `<icerik guvenilir="hayir">` içinde, XML kaçışlı; asla talimat
  olarak yürütülmez.
- Şema: Zod `.strict()` + JSON Schema `additionalProperties: false`.
- Alıntı belgede **birebir** aranır; uydurulmuş alıntı tüm çıktıyı reddettirir.
- Kaynaksız sayısal token reddedilir; yıllar sayısal iddia sayılmaz.
- NACE önerisi aday listesiyle sınırlı; listede olmayan kod reddedilir.
- `model_snapshot` pinli; `latest` hem uygulama hem `check` kısıtı ile reddedilir.
- Reddedilen çıktı **kaydedilmez**; yalnızca denetime yazılır ve öneri
  `degerlendiriliyor` durumunda kalır (en çok 3 deneme).
- Doğrulayıcıdan geçen çıktı bile **doğrulanmamış taslaktır**; ajans onayı zorunlu geçittir.

## 10. Bağımlılık güvenliği

2026-11-16: Next 16.4.6 (Server Actions DoS ve RCE kayıtları), Zod 4.6.7.
`pnpm-workspace.yaml` içindeki `overrides` geçişli bağımlılıkları yamalı
sürüme zorlar:

- `postcss@8.5.24` — GHSA-qx2v-qp2m-jg93 (XSS) + sourceMappingURL path traversal (2 kayıt)
- `sharp@0.35.5` — libvips, libheif, librsvg kayıtları
- `nanoid@3.3.20`, `source-map-js@1.2.2` — postcss altında DoS
- `brace-expansion` 1.x/2.x — exceljs > archiver > minimatch altında DoS
- `uuid@11.1.1` — exceljs

`pnpm audit --prod` temiz olmadan sürüm çıkılmaz.

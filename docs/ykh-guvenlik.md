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
| `kamuya_acik` | aday, sıralama, kanıt künyesi, karar | herkes |
| `kurum_ici` | kriter puanları, AI bulguları, gönderen kaydı | gözlemci ve üstü |
| `kisitli` | denetim izi, iş kuyruğu | uzman, kurul, denetçi, yönetici |
| `gizli` | kimlik (e-posta, ad, parola özeti), oturum | denetçi, AI yönetişim, yönetici |

`app_gorebilir(sinif)` fonksiyonu ile `@ykh/domain`'deki `gorebilir(rol, sinif)`
**aynı tabloyu** uygular. İkisi ayrışırsa `packages/domain/src/domain.test.ts`
ve `packages/database/src/database.test.ts` birlikte kırılır.

## 4. Politikasız tablo yoktur

Her tabloda en az bir SELECT politikası vardır. Yazma politikası olmayan
tabloda yazma sessizce 0 satır etkiler (RLS filtresi), hata fırlatmaz — bu
bilinçlidir ve `denetim` için ikinci katman trigger ile pekiştirilmiştir.

Özel durumlar:

- **`denetim`** — INSERT var, UPDATE/DELETE politikası **yok**. Ayrıca
  `denetim_degistirilemez()` trigger'ı RLS baypas edilse bile reddeder.
- **`karar`** — yalnızca `kurul_uyesi` INSERT edebilir. UPDATE/DELETE
  politikası yok: kilitli karar değiştirilemez.
- **`donem`** — `kurul_uyesi` yalnızca kilitlemek için UPDATE edebilir;
  `donem_kilit_tek_yon` trigger'ı geri açmayı engeller.
- **`kanit`** — kayıt anında yalnızca `beyan`/`ai_bulgusu` durumları kabul
  edilir. Doğrulama durumunu yalnızca uzman değiştirebilir (§1.3 tek geçit).

## 5. RLS'i aşan üç kapı (`security definer`)

Kimlik doğrulaması bağlam oluşmadan önce çalışır; bu üç fonksiyon RLS'i
**yalnızca** bunun için ve sınırlı çıktıyla aşar:

| Fonksiyon | Döndürdüğü |
|---|---|
| `giris_kimlik(eposta)` | `gonderen_ref`, `parola_hash` — başka hiçbir kolon |
| `eposta_kayitli(eposta)` | boolean |
| `oturum_coz(token_hash)` | ref, rol, eposta, ad_soyad (yalnızca geçerli oturum) |
| `hesap_ac(...)` | yeni `gonderen.ref`; yalnızca `birey` rolü açılabilir |

Ayrıca `aday_taban_puani(aday_id, agirliklar)`: stratejik puanın **toplamı**
kamuya açıktır, kriter kırılımı ve değerlendirici gerekçesi değildir. Bu
ayrım olmadan kamu görünümü uzman görünümünden farklı bir sıralama gösterirdi.

## 6. Maskeleme

- `kanit_kunye` görünümü: `belge_metni`, `dosya_yolu`, `span_*` yalnızca
  `app_uzman()` true iken döner; künye alanları herkese açıktır.
  Tasarım §6: "Kamuya açık künye · belge içeriği yalnızca uzmanlarda".
- Log: `@ykh/observability` `eposta`, `ad_soyad`, `parola`, `jeton`,
  `token_hash`, `authorization` alanlarını iç içe nesnelerde de maskeler.

## 7. KVKK — silme talebi

`kimlik_pseudonimlestir(ref)`:

1. `kimlik` satırında e-posta, ad, parola özeti silinir, `pseudonimlestirildi`
   işaretlenir.
2. `gonderen` beyan alanları temizlenir.
3. Oturumlar silinir.
4. Denetime kayıt düşülür.

`gonderen.ref` ve ona bağlı öneri/kanıt/karar zinciri **bozulmaz**.

## 8. Kimlik doğrulama

- Parola: `node:crypto` scrypt, N=32768 r=8 p=1, 32 baytlık özet, format
  `scrypt$N$r$p$tuz$ozet` — parametre değişse de eski özetler doğrulanır.
- Oturum: 32 bayt rastgele jeton; çerezde jetonun kendisi, veritabanında
  yalnızca SHA-256 özeti. Çerez `httpOnly`, `sameSite=lax`, üretimde `secure`.
- Giriş hatası tek mesaj döndürür: hesabın var olup olmadığı sızmaz.

## 9. AI güvenliği

- Kapalı kaynak modu: model yalnızca `kaynakPaketiKur()` çıktısını görür.
  Yetkisi olmayan kanıt pakete **hiç girmez**.
- Belge içeriği `<icerik guvenilir="hayir">` içinde, XML kaçışlı verilir;
  asla talimat olarak yürütülmez.
- Şema: Zod `.strict()` + JSON Schema `additionalProperties: false`.
- Kaynaksız sayısal token reddedilir; yıllar sayısal iddia sayılmaz.
- `model_snapshot` pinlidir; `latest` alias'ı hem uygulama hem `check` kısıtı
  ile reddedilir.
- Doğrulayıcıdan geçen çıktı bile **doğrulanmamış bulgudur**; puanlamaya
  girmesi için uzman onayı zorunlu geçittir.

## 10. Bağımlılık güvenliği

`pnpm-workspace.yaml` içindeki `overrides`, Next 16.2.12'nin getirdiği
açık CVE'li geçişli bağımlılıkları yamalı sürüme zorlar:

- `postcss@8.5.24` — GHSA-qx2v-qp2m-jg93 (XSS) + sourceMappingURL path traversal (2 kayıt)
- `sharp@0.35.3` — libvips CVE-2026-33327/33328/35590/35591

`pnpm audit --prod` temiz olmadan sürüm çıkılmaz.

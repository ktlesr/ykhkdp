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
- **`oneri`** — onaylanmamış öneri yalnızca sahibinde ve ajansta görünür
  (`durum = 'listede' or gonderen_ref = app_ref() or app_onaylayabilir()`).
  Yatırımcı kendi önerisini `listede` veya `koken='mevcut'` olarak açamaz.
  Durum değişimi yalnızca onaylayan rollerde.
- **`degerlendirme`** — önerisi görünüyorsa görünür; yazma yalnızca ajans.
  `degerlendirme_ham_puan_sabit` trigger'ı `puanlar`, `model_snapshot` ve
  `prompt_surum` güncellemesini reddeder — AI provenance'ı korunur.
- **`belge`** — herkes okur, yalnızca ajans yazar.

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

Ayrıca `oneri_taban_puani(oneri_id, agirliklar)`: stratejik puanın **toplamı**
kamuya açıktır. Bu ayrım olmadan kamu görünümü ajans görünümünden farklı bir
sıralama hesaplardı.

## 6. Maskeleme

Log: `@ykh/observability` `eposta`, `ad_soyad`, `parola`, `jeton`, `token_hash`,
`authorization` alanlarını iç içe nesnelerde de maskeler.

Belge metni maskelenmez — üst ölçekli belgeler kamuya açık politika belgeleridir.

## 7. KVKK — silme talebi

`kimlik_pseudonimlestir(ref)`:

1. `kimlik` satırında e-posta, ad, parola özeti silinir, `pseudonimlestirildi`
   işaretlenir.
2. Oturumlar silinir.
3. Denetime kayıt düşülür.

`gonderen.ref` ve ona bağlı öneri/değerlendirme zinciri **bozulmaz**.

## 8. Kimlik doğrulama

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

`pnpm-workspace.yaml` içindeki `overrides`, Next 16.2.12'nin getirdiği
açık CVE'li geçişli bağımlılıkları yamalı sürüme zorlar:

- `postcss@8.5.24` — GHSA-qx2v-qp2m-jg93 (XSS) + sourceMappingURL path traversal (2 kayıt)
- `sharp@0.35.3` — libvips CVE-2026-33327/33328/35590/35591

`pnpm audit --prod` temiz olmadan sürüm çıkılmaz.

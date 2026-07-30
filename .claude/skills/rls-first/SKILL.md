---
name: rls-first
description: Yeni tablo veya migration eklenirken RLS politikası ve access_class sütunu olmadan geçilmemesini dayatır. packages/database/migrations altında dosya açılırken, create table yazılırken veya şema değiştirilirken kullan.
---

# RLS önce

Politikasız tablo bırakılmaz. Bu proje veri güvenliğini uygulama koduna değil,
veritabanına dayandırır: bir kod yolu unutulsa bile veritabanı kuralı çiğnemez.

## Yeni tablo kontrol listesi

- [ ] `access_class erisim_sinifi not null default '...'` sütunu var.
- [ ] Varsayılan sınıf, tablonun **en kısıtlı makul** sınıfı (şüphedeyse `kisitli`).
- [ ] `alter table X enable row level security;`
- [ ] `alter table X force row level security;` — `ykh_owner` da kapsansın.
- [ ] En az bir SELECT politikası; `app_gorebilir(access_class)` kullanıyor.
- [ ] Yazma politikaları rol bazlı ve `with check` içeriyor.
- [ ] Geri alma dosyası (`NNNN_ad.down.sql`) yazıldı.
- [ ] `packages/database/src/database.test.ts` içine bir RLS testi eklendi:
      yetkisiz rol o satırı **göremiyor** veya **yazamıyor**.

## Kalıp

```sql
create table yeni_tablo (
  id           bigserial primary key,
  ...,
  access_class erisim_sinifi not null default 'kurum_ici'
);

alter table yeni_tablo enable row level security;
alter table yeni_tablo force row level security;

create policy yeni_tablo_oku on yeni_tablo for select
  using (app_gorebilir(access_class) or app_uzman());

create policy yeni_tablo_yaz on yeni_tablo for all
  using (app_yazabilir_uzman()) with check (app_yazabilir_uzman());
```

## Tuzaklar

**`INSERT ... RETURNING` SELECT politikasına takılır.** Satır yazılabilir ama
okunamıyorsa Postgres `new row violates row-level security policy` der. Yeni
satır henüz kimseye ait değilse (kayıt akışı gibi) `security definer` bir
fonksiyon yaz ve çıktısını daraltarak sınırla — `hesap_ac()` örnektir.

**Değişmezlik politikayla değil, trigger'la da korunur.** UPDATE politikası
olmaması saldırganı 0 satır etkilemeye düşürür; RLS baypas edilirse trigger
devreye girer. `denetim` (append-only) ve `degerlendirme` (ham puan sabit) bunun iki örneğidir.

**Toplam ile kırılımın erişimi farklı olabilir.** Yayımlanan bir sayı kamuya
açık, onu üreten satırlar kurum içi olabilir. Toplamı `security definer` bir
fonksiyonla aç; aksi hâlde kamu görünümü uzman görünümünden farklı bir sonuç
hesaplar. `oneri_taban_puani()` bunun için vardır.

## Uygulama tarafı

`@ykh/domain`'deki `gorebilir(rol, sinif)` ile SQL'deki `app_gorebilir(sinif)`
**aynı tabloyu** uygular. Birini değiştirdiysen diğerini de değiştir; ikisi de
kendi testine sahiptir ve ayrışırlarsa ikisi birden kırılır.

-- ── kendi rolünü yükseltme açığı ─────────────────────────────────────────────
--
-- `gonderen_guncelle` politikası `ref = app_ref() or app_rol() = 'yonetici'`
-- diyordu: herkes KENDİ satırını güncelleyebiliyordu. `gonderen` yalnızca
-- `rol`, `ajans_kod` ve `misafir` taşıdığı için bu, bir yatırımcının kendini
-- yönetici yapabilmesi demek.
--
-- Rol ataması arayüze eklenene kadar ulaşılabilir bir yol yoktu; şimdi var ve
-- RLS'in son savunma hattı olması gerekiyor — uygulama katmanındaki rol
-- kontrolü tek başına yeterli sayılamaz.
--
-- Kendi satırını güncellemeye ihtiyaç duyan hiçbir akış yok: misafir açma
-- INSERT, KVKK silme `kimlik` tablosunda.

drop policy gonderen_guncelle on gonderen;

create policy gonderen_guncelle on gonderen for update
  using (app_rol() = 'yonetici')
  with check (app_rol() = 'yonetici');

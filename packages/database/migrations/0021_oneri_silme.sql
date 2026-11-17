-- ── Öneri silme — yalnızca yönetici ─────────────────────────────────────────
--
-- `oneri` tablosunda silme politikası yoktu: RLS altında silme sessizce 0
-- satır etkiliyordu. Yönetici kuyruktaki (değerlendiriliyor / onay bekliyor)
-- bir öneriyi kalıcı olarak silebilir; ajans reddeder, silmez.
--
-- Silmeden önce kaydın tam görüntüsü `denetim`e yazılır (uygulama, aynı
-- transaction): denetim değiştirilemez, "neyi, kim, neden sildi" kaybolmaz.
-- Değerlendirme ve ek NACE satırları foreign key ile birlikte silinir.

create policy oneri_sil on oneri for delete
  using (app_rol() = 'yonetici' and durum in ('degerlendiriliyor', 'onay_bekliyor'));

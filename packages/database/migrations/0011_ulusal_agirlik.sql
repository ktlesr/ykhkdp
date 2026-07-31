-- ── ulusal varsayılan ağırlık seti ───────────────────────────────────────────
--
-- `ajans_kod` artık NULL olabilir ve bu bir eksiklik değil, bir AYRIM:
--
--   ajans_kod dolu  → o ajansın yayımladığı kalibrasyon
--   ajans_kod null  → ulusal varsayılan; ajans kendi setini yayımlayana kadar
--                     geçerli olan başlangıç değerleri
--
-- Gerekçe: Yerel Kalkınma Hamlesi yıllık ve 81 ilin tamamını kapsıyor (2025 ve
-- 2026 tebliğleri bunu gösteriyor), yani her ilin açık dönemi olması gerekir.
-- Dönemin VARLIĞI bir program olgusudur. Ağırlık seti ise bir ajans
-- kalibrasyonudur ve 25 ajans adına uydurulamaz — bu yüzden ikisi ayrılıyor:
-- dönem herkes için açılır, kalibrasyonu olmayan ulusal varsayılanı kullanır
-- ve bunu EKRANDA YAZAR (brief: gizli katsayı yok).

alter table agirlik_seti alter column ajans_kod drop not null;

comment on column agirlik_seti.ajans_kod is
  'null = ulusal varsayılan; dolu = o ajansın yayımladığı kalibrasyon';

-- ── Yapay zekâ modeli seçimi ────────────────────────────────────────────────
--
-- Yönetici değerlendirme ve keşfin hangi modelle koşacağını `/ayarlar`dan
-- seçer. Değer `MODEL_SECENEKLERI[].id` ya da 'varsayilan' (ortam değişkeni).
-- Kurum içi: yatırımcının hangi modelin seçildiğini okumasına gerek yok;
-- künye zaten her değerlendirmenin yanında yazar. Değişiklik denetime yazılır.

-- İki ayar: yargı (puanlama, karşı görüş, NACE, aday) ve tarama (kanıt
-- çıkarımı). Varsayılan fiyat/performans eşleşmesi ÖLÇÜMLE seçildi
-- (2026-11-17, `pnpm ai:eval` + 8 gruplu tarama sınaması):
--   yargı   Claude Sonnet 5.5 — eval geçti, Opus'un yarı fiyatı
--   tarama  Claude Haiku 5.5  — Opus kanıtının ~%86'sı, ~45'te bir maliyet
-- Seed bu tabloyu boşaltır (cascade): yerel geliştirme ve testler ortam
-- değişkenine bağlı kalır. Anahtar yoksa çağrı açık hatayla durur; yönetici
-- /ayarlar'dan değiştirir.
insert into ayar (anahtar, deger, access_class) values
  ('ai_model', 'anthropic:claude-sonnet-5-5', 'kurum_ici'),
  ('ai_tarama_model', 'anthropic:claude-haiku-5-5', 'kurum_ici')
on conflict (anahtar) do nothing;

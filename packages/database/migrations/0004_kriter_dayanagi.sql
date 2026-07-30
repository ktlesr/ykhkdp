-- ── kriter başına alıntı eşlemesi ────────────────────────────────────────────
--
-- "Bu puanı neye dayandırdın" sorusu kriter düzeyinde cevaplanır. Eşleme
-- olmadan dayanak yalnızca alıntı SAYISINI ölçüyordu; gerçek ama konuyla
-- ilgisiz beş alıntı yüksek dayanak alıyordu.
--
-- { "yerel_potansiyel": [0, 2], "plan_uyumu": [] }
--   → boş dizi meşrudur: o kriter "dayanaksız kriter" olarak görünür.
-- Sıra numaraları `alintilar` dizisini indeksler; doğrulayıcı aralık dışını
-- reddeder, düşen alıntı eşlemeden de düşer.

alter table degerlendirme
  add column kriter_dayanagi jsonb not null default '{}'::jsonb;

-- AI provenance'ı: eşleme de ham puanla birlikte donar. Ajans düzeltmesi
-- puanı `duzeltilmis_puanlar` kolonuna yazar, modelin dayanağını değiştirmez.
create or replace function degerlendirme_ham_puan_sabit() returns trigger
language plpgsql as $$
begin
  if new.puanlar is distinct from old.puanlar
     or new.kriter_dayanagi is distinct from old.kriter_dayanagi
     or new.model_snapshot is distinct from old.model_snapshot
     or new.prompt_surum is distinct from old.prompt_surum then
    raise exception 'AI ham puanı, kriter dayanağı ve model künyesi değiştirilemez; düzeltme duzeltilmis_puanlar kolonuna yazılır.';
  end if;
  return new;
end $$;

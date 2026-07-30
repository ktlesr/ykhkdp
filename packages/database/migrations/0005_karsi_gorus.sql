-- ── karşı görüş ──────────────────────────────────────────────────────────────
--
-- AI aynı belgelerle önerinin ALEYHİNE en güçlü itirazı üretir. Ajans tek
-- taraflı bir savunma değil, karşı tezi de görür.
--
-- [{ "tur": "baska_yerde_tanimli", "iddia": "...",
--    "alintilar": [{ "belge_ad": "...", "bolum": "s. 92", "alinti": "..." }] }]
--
-- Boş dizi meşrudur: "belgelerde bu öneriye karşı dayanak bulunamadı" bilgi
-- taşıyan bir cevaptır. Her itiraz en az bir doğrulanmış alıntı taşır —
-- alıntısız itiraz doğrulayıcıda düşer ve buraya hiç gelmez.
--
-- Puana ETKİ ETMEZ. Sıralamaya girmez, dayanağa girmez; insanın tartacağı
-- bir girdidir. Etki etmesi istenirse bu bilinçli bir ürün kararı olur.

alter table degerlendirme
  add column karsi_gorus jsonb not null default '[]'::jsonb,
  add column karsi_gorus_surum text;

-- AI provenance'ı: karşı görüş de ham puanla birlikte donar.
create or replace function degerlendirme_ham_puan_sabit() returns trigger
language plpgsql as $$
begin
  if new.puanlar is distinct from old.puanlar
     or new.kriter_dayanagi is distinct from old.kriter_dayanagi
     or new.karsi_gorus is distinct from old.karsi_gorus
     or new.model_snapshot is distinct from old.model_snapshot
     or new.prompt_surum is distinct from old.prompt_surum then
    raise exception 'AI ham puanı, kriter dayanağı, karşı görüş ve model künyesi değiştirilemez; düzeltme duzeltilmis_puanlar kolonuna yazılır.';
  end if;
  return new;
end $$;

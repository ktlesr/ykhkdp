-- ── Kriter notları ve ana çerçeve notu ──────────────────────────────────────
--
-- Ekranda puan, yüzde ve kaynak referansı vardı; "bu puan neden bu" sorusunun
-- cevabı yoktu. Model kriter başına kısa not zaten üretiyordu ama saklanmıyordu.
--
--   kriter_notlari  {kriter: not} — modelin o kritere yazdığı bir-iki cümle.
--                   Belgede olmayan sayı taşıyan not KAYDEDİLMEZ (anahtar yok).
--   cerceve         {unsur, aciklama} — konunun on temel unsurla ilişkisi.
--                   unsur 0 = hiçbirine doğrudan girmiyor. Modelin
--                   SINIFLAMASIDIR; ajans tartar.
--
-- İkisi de PUANA, DAYANAĞA ve SIRALAMAYA ETKİ ETMEZ: karşı görüş ve kapsam
-- notu gibi ajansın okuyacağı açıklamadır. Eski kayıtlarda null kalır.

alter table degerlendirme
  add column kriter_notlari jsonb,
  add column cerceve jsonb,
  add constraint degerlendirme_kriter_notlari check (kriter_notlari is null or jsonb_typeof(kriter_notlari) = 'object'),
  add constraint degerlendirme_cerceve check (
    cerceve is null or ((cerceve->>'unsur')::int between 0 and 10 and jsonb_typeof(cerceve->'aciklama') = 'string')
  );

-- AI provenance'ı: notlar da ham puanla birlikte donar.
create or replace function degerlendirme_ham_puan_sabit() returns trigger
language plpgsql as $$
begin
  if new.puanlar is distinct from old.puanlar
     or new.kriter_dayanagi is distinct from old.kriter_dayanagi
     or new.karsi_gorus is distinct from old.karsi_gorus
     or new.kriter_notlari is distinct from old.kriter_notlari
     or new.cerceve is distinct from old.cerceve
     or new.model_snapshot is distinct from old.model_snapshot
     or new.prompt_surum is distinct from old.prompt_surum then
    raise exception 'AI ham puanı, kriter dayanağı, karşı görüş ve model künyesi değiştirilemez; düzeltme duzeltilmis_puanlar kolonuna yazılır.';
  end if;
  return new;
end $$;

comment on column degerlendirme.kriter_notlari is 'Kriter başına AI notu; puana ETKİ ETMEZ. Kaynaksız sayı taşıyan not kaydedilmez.';
comment on column degerlendirme.cerceve is 'On temel unsurla ilişki {unsur 0-10, aciklama}; modelin sınıflaması, puana ETKİ ETMEZ.';

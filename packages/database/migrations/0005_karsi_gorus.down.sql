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

alter table degerlendirme drop column karsi_gorus, drop column karsi_gorus_surum;

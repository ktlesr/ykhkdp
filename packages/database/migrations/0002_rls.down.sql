do $$
declare t text;
begin
  foreach t in array array[
    'ajans','il','ilce','nace','agirlik_seti','donem','gonderen','kimlik','oturum',
    'belge','oneri','degerlendirme','denetim'
  ] loop
    execute format('alter table if exists %I disable row level security', t);
    execute format('alter table if exists %I no force row level security', t);
  end loop;
end $$;

do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

drop function if exists app_gorebilir(erisim_sinifi);
drop function if exists app_onaylayabilir();
drop function if exists app_ref();
drop function if exists app_rol();

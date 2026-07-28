do $$
declare t text;
begin
  foreach t in array array[
    'ajans','il','ilce','agirlik_seti','donem','gonderen','kimlik','oturum',
    'oneri','aday','kanit','iddia','iddia_kanit','kriter_puani','bulgu',
    'destek','karar','denetim','is_kuyrugu'
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
drop function if exists app_yazabilir_uzman();
drop function if exists app_uzman();
drop function if exists app_ref();
drop function if exists app_rol();

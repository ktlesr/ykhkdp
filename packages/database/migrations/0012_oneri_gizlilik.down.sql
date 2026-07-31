drop policy oneri_oku on oneri;
create policy oneri_oku on oneri for select using (
  durum = 'listede'
  or gonderen_ref = app_ref()
  or app_onaylayabilir()
);

create or replace function oneri_taban_puani(p_oneri_id bigint, p_agirliklar jsonb)
returns integer language sql stable security definer
set search_path = public as $$
  select coalesce(round(sum(
    (coalesce(d.duzeltilmis_puanlar, d.puanlar) ->> k.kriter)::numeric
    * (p_agirliklar ->> k.kriter)::numeric
  )), 0)::integer
  from degerlendirme d
  cross join (select unnest(enum_range(null::kriter))::text as kriter) k
  where d.oneri_id = p_oneri_id
    and (coalesce(d.duzeltilmis_puanlar, d.puanlar) ->> k.kriter) is not null
$$;
revoke all on function oneri_taban_puani(bigint, jsonb) from public;
grant execute on function oneri_taban_puani(bigint, jsonb) to ykh_app;

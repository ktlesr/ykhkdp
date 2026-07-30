drop function if exists misafir_ac();
alter table gonderen drop column misafir;

drop function if exists oturum_coz(text);
create or replace function oturum_coz(p_token_hash text)
returns table (ref uuid, rol rol, eposta citext, ad_soyad text)
language sql security definer stable set search_path = public as $$
  select g.ref, g.rol, k.eposta, k.ad_soyad
  from oturum o
  join gonderen g on g.ref = o.gonderen_ref
  left join kimlik k on k.gonderen_ref = g.ref
  where o.token_hash = p_token_hash and o.gecerlilik > now()
$$;
revoke all on function oturum_coz(text) from public;
grant execute on function oturum_coz(text) to ykh_app;

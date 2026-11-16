-- Yetki kontrolünü kaldırır: 0013 sürümüne döner.
create or replace function kimlik_pseudonimlestir(p_ref uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update kimlik set
    eposta = null, ad_soyad = null, parola_hash = null,
    pseudonimlestirildi = true
  where gonderen_ref = p_ref;
  delete from oturum where gonderen_ref = p_ref;
  insert into denetim (aktor_ref, eylem, nesne_tip, nesne_id, detay)
  values (app_ref(), 'kimlik_pseudonimlestirildi', 'gonderen', p_ref::text,
          jsonb_build_object(
            'ozne', p_ref::text,
            'not', 'Öneri ve sıralama zinciri korundu; kişisel veri silindi.'));
end $$;

revoke all on function kimlik_pseudonimlestir(uuid) from public;
grant execute on function kimlik_pseudonimlestir(uuid) to ykh_app;

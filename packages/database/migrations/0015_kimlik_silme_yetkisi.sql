-- ── KVKK silme fonksiyonu yalnızca yönetici bağlamında ───────────────────────
--
-- `kimlik_pseudonimlestir` security definer: RLS'i aşarak kimliği siler ve
-- oturumları kapatır. Yetki kontrolü yalnızca web eyleminde (`kimlikSilEylemi`)
-- vardı; veritabanı katmanı herhangi bir `ykh_app` bağlamından gelen çağrıyı
-- kabul ediyordu. Uygulamadaki bir hata (yanlış bağlamla çağrı) kişisel veriyi
-- geri alınamaz biçimde silebilirdi. Kontrol fonksiyonun İÇİNE alınır —
-- `oneri_taban_puani` ile aynı ilke (güvenlik §5).
--
-- Sınır: bağlam `set_config` ile uygulama tarafından bildirilir; ham SQL
-- erişimi olan biri bunu da taklit edebilir. Bu kontrol uygulama hatasına
-- karşı savunmadır, ele geçirilmiş veritabanı hesabına karşı değil.

create or replace function kimlik_pseudonimlestir(p_ref uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if app_rol() <> 'yonetici' then
    raise exception 'kimlik_pseudonimlestir yalnızca yönetici bağlamında çalışır (gelen: %)', app_rol()
      using errcode = '42501';
  end if;
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

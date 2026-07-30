-- 0003 — veritabanı düzeyinde iş kuralları ve kimlik doğrulama kapıları.

-- ── denetim append-only ────────────────────────────────────────────────────

create or replace function denetim_degistirilemez() returns trigger
language plpgsql as $$
begin
  raise exception 'Denetim tablosu append-only: % engellendi.', tg_op;
end $$;

create trigger denetim_update_engel before update on denetim
  for each row execute function denetim_degistirilemez();
create trigger denetim_delete_engel before delete on denetim
  for each row execute function denetim_degistirilemez();

-- ── AI değerlendirmesi değişmez ────────────────────────────────────────────
-- `puanlar` AI'nin ham çıktısı; ajans düzeltmesi ayrı kolona yazılır.
-- Provenance kaybolmasın diye ham puanların güncellenmesi engellenir.

create or replace function degerlendirme_ham_puan_sabit() returns trigger
language plpgsql as $$
begin
  if new.puanlar is distinct from old.puanlar
     or new.model_snapshot is distinct from old.model_snapshot
     or new.prompt_surum is distinct from old.prompt_surum then
    raise exception 'AI ham puanı ve model künyesi değiştirilemez; düzeltme duzeltilmis_puanlar kolonuna yazılır.';
  end if;
  return new;
end $$;

create trigger degerlendirme_ham_puan_sabit_trg before update on degerlendirme
  for each row execute function degerlendirme_ham_puan_sabit();

-- ── NACE üst kod ağacı ─────────────────────────────────────────────────────

create or replace function nace_ust_kod(p_kod text) returns text
language sql immutable as $$
  select case
    when p_kod ~ '^[A-Z]$'            then null            -- kısım
    when p_kod ~ '^[0-9]{2}$'         then null            -- bölüm (kısmı seed bağlar)
    when p_kod ~ '^[0-9]{2}\.[0-9]$'  then left(p_kod, 2)  -- grup   → bölüm
    when p_kod ~ '^[0-9]{2}\.[0-9]{2}$' then left(p_kod, 4) -- sınıf  → grup
    else left(p_kod, 5)                                     -- faaliyet → sınıf
  end
$$;

-- ── etkin puan · AI ham puanı veya ajans düzeltmesi ────────────────────────

create or replace function etkin_puanlar(p_oneri_id bigint) returns jsonb
language sql stable as $$
  select coalesce(duzeltilmis_puanlar, puanlar) from degerlendirme where oneri_id = p_oneri_id
$$;

/**
 * Stratejik puan — ağırlıklı toplam.
 *
 * Toplam KAMUYA AÇIK (security definer), böylece kamu görünümü uzman
 * görünümüyle aynı sıralamayı hesaplar. `degerlendirme` satırı RLS altında
 * kalsa bile toplam tutarlı kalır.
 */
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

-- ── kimlik doğrulama kapıları ──────────────────────────────────────────────
-- Giriş anında bağlam yoktur; RLS altında `kimlik` okunamaz. Bu fonksiyonlar
-- RLS'i YALNIZCA kimlik doğrulama için, sınırlı çıktıyla aşar.

create or replace function giris_kimlik(p_eposta citext)
returns table (gonderen_ref uuid, parola_hash text)
language sql security definer stable set search_path = public as $$
  select k.gonderen_ref, k.parola_hash from kimlik k
  where k.eposta = p_eposta and k.pseudonimlestirildi = false
$$;

create or replace function eposta_kayitli(p_eposta citext)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from kimlik where eposta = p_eposta and pseudonimlestirildi = false)
$$;

create or replace function oturum_coz(p_token_hash text)
returns table (ref uuid, rol rol, eposta citext, ad_soyad text)
language sql security definer stable set search_path = public as $$
  select g.ref, g.rol, k.eposta, k.ad_soyad
  from oturum o
  join gonderen g on g.ref = o.gonderen_ref
  left join kimlik k on k.gonderen_ref = g.ref
  where o.token_hash = p_token_hash and o.gecerlilik > now()
$$;

/** Hesap açma. `insert ... returning` RLS'te SELECT politikasına takıldığı için
 *  kayıt tek, atomik ve sınırlı bir fonksiyondan geçer. Yalnızca `yatirimci`. */
create or replace function hesap_ac(p_eposta citext, p_ad text, p_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  if exists (select 1 from kimlik where eposta = p_eposta and pseudonimlestirildi = false) then
    raise exception 'eposta_kayitli' using errcode = 'unique_violation';
  end if;
  insert into gonderen (rol) values ('yatirimci') returning ref into r;
  insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash) values (r, p_eposta, p_ad, p_hash);
  return r;
end $$;

revoke all on function giris_kimlik(citext) from public;
revoke all on function eposta_kayitli(citext) from public;
revoke all on function oturum_coz(text) from public;
revoke all on function hesap_ac(citext, text, text) from public;
grant execute on function giris_kimlik(citext) to ykh_app;
grant execute on function eposta_kayitli(citext) to ykh_app;
grant execute on function oturum_coz(text) to ykh_app;
grant execute on function hesap_ac(citext, text, text) to ykh_app;

-- ── KVKK silme talebi ──────────────────────────────────────────────────────

create or replace function kimlik_pseudonimlestir(p_ref uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update kimlik set
    eposta = null, ad_soyad = null, parola_hash = null,
    pseudonimlestirildi = true
  where gonderen_ref = p_ref;
  delete from oturum where gonderen_ref = p_ref;
  insert into denetim (aktor_ref, eylem, nesne_tip, nesne_id, detay)
  values (p_ref, 'kimlik_pseudonimlestirildi', 'gonderen', p_ref::text,
          jsonb_build_object('not', 'Öneri ve sıralama zinciri korundu; kişisel veri silindi.'));
end $$;

revoke all on function kimlik_pseudonimlestir(uuid) from public;
grant execute on function kimlik_pseudonimlestir(uuid) to ykh_app;

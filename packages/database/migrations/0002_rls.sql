-- 0002 — Row Level Security. Politikasız tablo bırakılmaz.
--
-- Uygulama `ykh_app` rolüyle bağlanır: superuser değil, tablo sahibi değil,
-- BYPASSRLS yok. Tüm tablolarda FORCE RLS açık.
--
-- İstek başına: SET LOCAL app.rol / app.gonderen_ref (transaction kapsamında).
-- Değişken yoksa rol 'anonim' sayılır → yalnızca kamuya açık satırlar.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'ykh_app') then
    create role ykh_app login password 'ykh_app_parola';
  end if;
end $$;

grant usage on schema public to ykh_app;
grant select, insert, update, delete on all tables in schema public to ykh_app;
grant usage, select on all sequences in schema public to ykh_app;
alter default privileges in schema public grant select, insert, update, delete on tables to ykh_app;
alter default privileges in schema public grant usage, select on sequences to ykh_app;

create or replace function app_rol() returns text
language sql stable as $$
  select coalesce(nullif(current_setting('app.rol', true), ''), 'anonim')
$$;

create or replace function app_ref() returns uuid
language sql stable as $$
  select nullif(current_setting('app.gonderen_ref', true), '')::uuid
$$;

/** Onaylayan roller — @ykh/domain'deki onaylayabilir() ile aynı küme. */
create or replace function app_onaylayabilir() returns boolean
language sql stable as $$
  select app_rol() in ('ajans', 'yonetici')
$$;

/** @ykh/domain'deki gorebilir(rol, sinif) ile AYNI tablo. Ayrışırlarsa iki test kırılır. */
create or replace function app_gorebilir(sinif erisim_sinifi) returns boolean
language sql stable as $$
  select case app_rol()
    when 'anonim'    then sinif = 'kamuya_acik'
    when 'yatirimci' then sinif = 'kamuya_acik'
    when 'ajans'     then sinif in ('kamuya_acik', 'kurum_ici')
    when 'yonetici'  then true
    else false
  end
$$;

-- ── referans tabloları: herkes okur, yalnızca ajans/yönetici yazar ─────────

do $$
declare t text;
begin
  foreach t in array array['ajans', 'il', 'ilce', 'nace', 'agirlik_seti', 'donem'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy %I_oku on %I for select using (app_gorebilir(access_class))', t, t);
    execute format(
      'create policy %I_yaz on %I for all using (app_onaylayabilir()) with check (app_onaylayabilir())', t, t);
  end loop;
end $$;

-- ── gonderen ───────────────────────────────────────────────────────────────

alter table gonderen enable row level security;
alter table gonderen force row level security;

create policy gonderen_oku on gonderen for select
  using (ref = app_ref() or app_gorebilir(access_class));
create policy gonderen_kayit on gonderen for insert with check (true);
create policy gonderen_guncelle on gonderen for update
  using (ref = app_ref() or app_rol() = 'yonetici')
  with check (ref = app_ref() or app_rol() = 'yonetici');

-- ── kimlik · kişisel veri ──────────────────────────────────────────────────

alter table kimlik enable row level security;
alter table kimlik force row level security;

create policy kimlik_oku on kimlik for select
  using (gonderen_ref = app_ref() or app_rol() = 'yonetici');
create policy kimlik_kayit on kimlik for insert with check (true);
create policy kimlik_guncelle on kimlik for update
  using (gonderen_ref = app_ref() or app_rol() = 'yonetici')
  with check (gonderen_ref = app_ref() or app_rol() = 'yonetici');

-- ── oturum · satır ancak token_hash bilinerek bulunur ──────────────────────

alter table oturum enable row level security;
alter table oturum force row level security;
create policy oturum_hepsi on oturum for all using (true) with check (true);

-- ── belge ──────────────────────────────────────────────────────────────────

alter table belge enable row level security;
alter table belge force row level security;

create policy belge_oku on belge for select using (app_gorebilir(access_class));
create policy belge_yaz on belge for all
  using (app_onaylayabilir()) with check (app_onaylayabilir());

-- ── öneri ──────────────────────────────────────────────────────────────────
-- Onaylanmamış öneri yalnızca sahibinde ve ajansta görünür.

alter table oneri enable row level security;
alter table oneri force row level security;

create policy oneri_oku on oneri for select using (
  durum = 'listede'
  or gonderen_ref = app_ref()
  or app_onaylayabilir()
);

create policy oneri_kayit on oneri for insert with check (
  app_ref() is not null
  and gonderen_ref = app_ref()
  -- Yatırımcı kendi önerisini onaylı veya mevcut konu olarak açamaz.
  and (app_onaylayabilir() or (durum = 'degerlendiriliyor' and koken = 'yeni'))
);

-- Durum değişimi ve puan düzeltmesi yalnızca onaylayan rollerde.
create policy oneri_guncelle on oneri for update
  using (app_onaylayabilir()) with check (app_onaylayabilir());

-- ── değerlendirme · önerisi görünüyorsa görünür ────────────────────────────

alter table degerlendirme enable row level security;
alter table degerlendirme force row level security;

create policy degerlendirme_oku on degerlendirme for select using (
  exists (select 1 from oneri o where o.id = degerlendirme.oneri_id)
);
create policy degerlendirme_yaz on degerlendirme for all
  using (app_onaylayabilir()) with check (app_onaylayabilir());

-- ── denetim · append-only ──────────────────────────────────────────────────

alter table denetim enable row level security;
alter table denetim force row level security;

create policy denetim_oku on denetim for select using (app_gorebilir(access_class));
create policy denetim_yaz on denetim for insert with check (true);
-- update/delete politikası YOK → RLS reddeder; trigger 0003'te ikinci katman.


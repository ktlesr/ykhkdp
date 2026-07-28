-- 0002 — Row Level Security. Politikasız tablo bırakılmaz (rls-first).
--
-- Uygulama `ykh_app` rolüyle bağlanır. Bu rol superuser DEĞİLDİR ve
-- BYPASSRLS taşımaz; tablo sahibi de değildir, dolayısıyla politikalar
-- gerçekten uygulanır.
--
-- İstek başına oturum değişkenleri (SET LOCAL, transaction kapsamında):
--   app.gonderen_ref  — oturumdaki bireyin değişmez anahtarı ('' = anonim)
--   app.rol           — @ykh/domain'deki rol adı ('' = anonim)
--
-- Fail-closed: değişken yoksa `anon()` true döner ve yalnızca kamuya açık
-- satırlar görünür.

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

-- ── yardımcılar ────────────────────────────────────────────────────────────

create or replace function app_rol() returns text
language sql stable as $$
  select coalesce(nullif(current_setting('app.rol', true), ''), 'anonim')
$$;

create or replace function app_ref() returns uuid
language sql stable as $$
  select nullif(current_setting('app.gonderen_ref', true), '')::uuid
$$;

create or replace function app_uzman() returns boolean
language sql stable as $$
  select app_rol() in ('ajans_uzmani', 'sektor_uzmani', 'kurul_uyesi', 'sistem_yoneticisi', 'denetci', 'ai_yonetisim')
$$;

create or replace function app_yazabilir_uzman() returns boolean
language sql stable as $$
  select app_rol() in ('ajans_uzmani', 'sektor_uzmani', 'sistem_yoneticisi')
$$;

-- Rolün veri sınıfını görüp göremediği — @ykh/domain'deki `gorebilir()` ile aynı tablo.
create or replace function app_gorebilir(sinif erisim_sinifi) returns boolean
language sql stable as $$
  select case app_rol()
    when 'anonim'            then sinif = 'kamuya_acik'
    when 'birey'             then sinif = 'kamuya_acik'
    when 'gozlemci'          then sinif in ('kamuya_acik', 'kurum_ici')
    when 'ajans_uzmani'      then sinif in ('kamuya_acik', 'kurum_ici', 'kisitli')
    when 'sektor_uzmani'     then sinif in ('kamuya_acik', 'kurum_ici', 'kisitli')
    when 'kurul_uyesi'       then sinif in ('kamuya_acik', 'kurum_ici', 'kisitli')
    when 'denetci'           then true
    when 'ai_yonetisim'      then true
    when 'sistem_yoneticisi' then true
    else false
  end
$$;

-- ── referans tabloları: herkes okur, yalnızca yönetici yazar ────────────────

do $$
declare t text;
begin
  foreach t in array array['ajans', 'il', 'ilce', 'agirlik_seti', 'donem'] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('create policy %I_oku on %I for select using (app_gorebilir(access_class))', t, t);
    execute format(
      'create policy %I_yaz on %I for all using (app_rol() in (''sistem_yoneticisi'', ''ajans_uzmani'')) '
      'with check (app_rol() in (''sistem_yoneticisi'', ''ajans_uzmani''))', t, t);
  end loop;
end $$;

-- Kurul üyesi dönemi yalnızca kilitlemek için günceller. Geri açmayı
-- 0003'teki `donem_kilit_tek_yon` trigger'ı engeller.
create policy donem_kilitle on donem for update
  using (app_rol() = 'kurul_uyesi') with check (app_rol() = 'kurul_uyesi');

-- ── gonderen ───────────────────────────────────────────────────────────────
-- Birey kendi satırını görür; uzman rolleri kısıtlı sınıfa erişebildiği için hepsini görür.

alter table gonderen enable row level security;
alter table gonderen force row level security;

create policy gonderen_oku on gonderen for select
  using (ref = app_ref() or app_gorebilir(access_class));

create policy gonderen_kayit on gonderen for insert
  with check (true); -- kayıt akışı anonimken çalışır; rol kolonu 'birey' varsayılanıyla gelir

create policy gonderen_guncelle on gonderen for update
  using (ref = app_ref() or app_rol() = 'sistem_yoneticisi')
  with check (ref = app_ref() or app_rol() = 'sistem_yoneticisi');

-- ── kimlik: kişisel veri. Yalnızca sahibi ve denetçi/yönetici. ──────────────

alter table kimlik enable row level security;
alter table kimlik force row level security;

create policy kimlik_oku on kimlik for select
  using (gonderen_ref = app_ref() or app_rol() in ('denetci', 'sistem_yoneticisi'));

create policy kimlik_kayit on kimlik for insert with check (true);

create policy kimlik_guncelle on kimlik for update
  using (gonderen_ref = app_ref() or app_rol() = 'sistem_yoneticisi')
  with check (gonderen_ref = app_ref() or app_rol() = 'sistem_yoneticisi');

-- ── oturum ─────────────────────────────────────────────────────────────────
-- Oturum arama anonim istekte yapılır; token'ın kendisi sır olduğu için
-- select serbest, ama satır ancak token_hash bilinerek bulunur.

alter table oturum enable row level security;
alter table oturum force row level security;

create policy oturum_hepsi on oturum for all using (true) with check (true);

-- ── öneri ──────────────────────────────────────────────────────────────────

alter table oneri enable row level security;
alter table oneri force row level security;

-- Taslak yalnızca sahibinde görünür; gönderilmiş öneri kamuya açık.
create policy oneri_oku on oneri for select using (
  gonderen_ref = app_ref()
  or app_uzman()
  or (durum <> 'taslak' and app_gorebilir(access_class))
);

create policy oneri_kayit on oneri for insert
  with check (gonderen_ref = app_ref() and app_ref() is not null);

create policy oneri_guncelle on oneri for update
  using (gonderen_ref = app_ref() or app_yazabilir_uzman())
  with check (gonderen_ref = app_ref() or app_yazabilir_uzman());

-- ── aday ───────────────────────────────────────────────────────────────────

alter table aday enable row level security;
alter table aday force row level security;

create policy aday_oku on aday for select using (app_gorebilir(access_class) or app_uzman());
create policy aday_yaz on aday for all
  using (app_yazabilir_uzman()) with check (app_yazabilir_uzman());

-- ── kanıt ──────────────────────────────────────────────────────────────────
-- Künye kamuya açık; belge metni ve dosya yolu kısıtlıdır (tasarım §6 gizlilik
-- satırı: "Kamuya açık künye · belge içeriği yalnızca uzmanlarda").
-- Metin maskeleme 0003'teki görünümde yapılır.

alter table kanit enable row level security;
alter table kanit force row level security;

create policy kanit_oku on kanit for select using (
  app_gorebilir(access_class)
  or app_uzman()
  or exists (select 1 from oneri o where o.id = kanit.oneri_id and o.gonderen_ref = app_ref())
);

create policy kanit_kayit on kanit for insert with check (
  app_ref() is not null
  and (
    app_yazabilir_uzman()
    or exists (select 1 from oneri o where o.id = oneri_id and o.gonderen_ref = app_ref())
  )
  -- Kanıt kendini onaylayamaz: kayıt anında yalnızca doğrulanmamış durumlar.
  and (app_yazabilir_uzman() or dogrulama_durumu in ('beyan', 'ai_bulgusu'))
);

-- Doğrulama durumunu yalnızca uzman değiştirebilir (§1.3 tek geçit).
create policy kanit_guncelle on kanit for update
  using (app_yazabilir_uzman()) with check (app_yazabilir_uzman());

-- ── iddia / iddia_kanit / kriter puanı ─────────────────────────────────────

alter table iddia enable row level security;
alter table iddia force row level security;
create policy iddia_oku on iddia for select using (app_gorebilir(access_class) or app_uzman());
create policy iddia_yaz on iddia for all using (app_yazabilir_uzman()) with check (app_yazabilir_uzman());

alter table iddia_kanit enable row level security;
alter table iddia_kanit force row level security;
create policy iddia_kanit_oku on iddia_kanit for select using (app_gorebilir(access_class) or app_uzman());
create policy iddia_kanit_yaz on iddia_kanit for all using (app_yazabilir_uzman()) with check (app_yazabilir_uzman());

alter table kriter_puani enable row level security;
alter table kriter_puani force row level security;
create policy kriter_puani_oku on kriter_puani for select using (app_gorebilir(access_class) or app_uzman());
create policy kriter_puani_yaz on kriter_puani for all using (app_yazabilir_uzman()) with check (app_yazabilir_uzman());

-- ── bulgu ──────────────────────────────────────────────────────────────────

alter table bulgu enable row level security;
alter table bulgu force row level security;

create policy bulgu_oku on bulgu for select using (
  app_gorebilir(access_class)
  or exists (select 1 from oneri o where o.id = bulgu.oneri_id and o.gonderen_ref = app_ref())
);
create policy bulgu_yaz on bulgu for all
  using (app_rol() in ('ajans_uzmani', 'sektor_uzmani', 'sistem_yoneticisi', 'ai_yonetisim'))
  with check (app_rol() in ('ajans_uzmani', 'sektor_uzmani', 'sistem_yoneticisi', 'ai_yonetisim'));

-- ── destek ─────────────────────────────────────────────────────────────────

alter table destek enable row level security;
alter table destek force row level security;

create policy destek_oku on destek for select using (app_gorebilir(access_class) or app_uzman());
create policy destek_ver on destek for insert with check (gonderen_ref = app_ref() and app_ref() is not null);
create policy destek_geri_al on destek for delete using (gonderen_ref = app_ref());

-- ── karar ──────────────────────────────────────────────────────────────────

alter table karar enable row level security;
alter table karar force row level security;

create policy karar_oku on karar for select using (app_gorebilir(access_class));
-- Kararı yalnızca kurul üyesi yazar; güncelleme/silme politikası YOKTUR (§1.7).
create policy karar_kilitle on karar for insert with check (app_rol() = 'kurul_uyesi');

-- ── denetim: append-only ───────────────────────────────────────────────────

alter table denetim enable row level security;
alter table denetim force row level security;

create policy denetim_oku on denetim for select using (app_gorebilir(access_class));
create policy denetim_yaz on denetim for insert with check (true);
-- update/delete politikası yok → RLS altında reddedilir. Trigger 0003'te ayrıca kilitler.

-- ── iş kuyruğu ─────────────────────────────────────────────────────────────

alter table is_kuyrugu enable row level security;
alter table is_kuyrugu force row level security;

create policy is_kuyrugu_hepsi on is_kuyrugu for all
  using (app_rol() in ('sistem_yoneticisi', 'ajans_uzmani', 'sektor_uzmani'))
  with check (app_rol() in ('sistem_yoneticisi', 'ajans_uzmani', 'sektor_uzmani'));

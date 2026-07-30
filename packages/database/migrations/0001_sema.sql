-- 0001 — çekirdek şema.
--
-- Sade akış: yatırımcı öneri verir → AI puanlar → ajans onaylar → il listesine girer.
-- Kanıt kartı, uzman kuyruğu, iddia-kanıt matrisi, destek ve kurul kilidi YOK.
--
-- KVKK: öneri kişiye değil, değişmez `gonderen.ref` anahtarına bağlanır;
-- kişisel veri ayrı `kimlik` tablosunda durur ve silme talebinde
-- pseudonimleştirilir, sıralama zinciri bozulmaz.
--
-- rls-first: her tabloda `access_class` sütunu ve RLS politikası var (0002).

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ── enum'lar ───────────────────────────────────────────────────────────────

create type erisim_sinifi as enum ('kamuya_acik', 'kurum_ici', 'gizli');
create type rol as enum ('yatirimci', 'ajans', 'yonetici');
create type oneri_durumu as enum ('degerlendiriliyor', 'onay_bekliyor', 'listede', 'reddedildi');
create type koken as enum ('mevcut', 'yeni');
create type nace_kaynagi as enum ('kullanici', 'ai', 'ajans');
create type nace_duzeyi as enum ('kisim', 'bolum', 'grup', 'sinif', 'faaliyet');
create type belge_turu as enum ('bolge_plani', 'kalkinma_plani', 'ovp', 'strateji', 'il_raporu', 'diger');
create type kriter as enum (
  'plan_uyumu', 'yerel_potansiyel', 'pazar_talep', 'deger_zinciri',
  'istihdam_katma_deger', 'uygulanabilirlik', 'yatirimci_ilgisi', 'surdurulebilirlik'
);

-- ── kimlik ─────────────────────────────────────────────────────────────────

create table gonderen (
  ref          uuid primary key default gen_random_uuid(),
  rol          rol not null default 'yatirimci',
  access_class erisim_sinifi not null default 'kurum_ici',
  olusturuldu  timestamptz not null default now()
);

create table kimlik (
  gonderen_ref        uuid primary key references gonderen(ref) on delete restrict,
  eposta              citext,
  ad_soyad            text,
  parola_hash         text,
  pseudonimlestirildi boolean not null default false,
  access_class        erisim_sinifi not null default 'gizli',
  olusturuldu         timestamptz not null default now()
);

create unique index kimlik_eposta_uniq on kimlik (eposta) where pseudonimlestirildi = false;

create table oturum (
  token_hash   text primary key,
  gonderen_ref uuid not null references gonderen(ref) on delete cascade,
  gecerlilik   timestamptz not null,
  access_class erisim_sinifi not null default 'gizli'
);

-- ── coğrafya · kodda hiçbir il/ajans sabitlenmez ───────────────────────────

create table ajans (
  kod          text primary key,
  ad           text not null,
  access_class erisim_sinifi not null default 'kamuya_acik'
);

create table il (
  kod          text primary key,
  ad           text not null,
  ajans_kod    text not null references ajans(kod),
  access_class erisim_sinifi not null default 'kamuya_acik'
);

create table ilce (
  id           bigserial primary key,
  il_kod       text not null references il(kod),
  ad           text not null,
  access_class erisim_sinifi not null default 'kamuya_acik',
  unique (il_kod, ad)
);

-- ── NACE Rev.2.1 (altılı, 2026) ────────────────────────────────────────────

create table nace (
  kod          text primary key,
  tanim        text not null,
  duzey        nace_duzeyi not null,
  /** üst kod: 13.10.03 → 13.10 → 13.1 → 13 → C */
  ust_kod      text references nace(kod),
  access_class erisim_sinifi not null default 'kamuya_acik',
  arama        tsvector generated always as (to_tsvector('simple', kod || ' ' || tanim)) stored
);

create index nace_arama on nace using gin (arama);
create index nace_duzey on nace (duzey);
create index nace_ust on nace (ust_kod);

-- ── sürümlü ağırlık seti · (ajans, dönem) anahtarlı ────────────────────────

create table agirlik_seti (
  surum           text primary key,
  ajans_kod       text not null references ajans(kod),
  donem_yil       text not null,
  agirliklar      jsonb not null,
  devamlilik_payi integer not null,
  dayanak_esigi   integer not null,
  devir_siniri    integer not null,
  slot_sayisi     integer not null,
  access_class    erisim_sinifi not null default 'kamuya_acik',
  constraint agirlik_pay_araligi check (devamlilik_payi between 0 and 100),
  constraint agirlik_esik_araligi check (dayanak_esigi between 0 and 100),
  constraint agirlik_slot check (slot_sayisi >= 1)
);

create table donem (
  id                 bigserial primary key,
  il_kod             text not null references il(kod),
  yil                text not null,
  agirlik_seti_surum text not null references agirlik_seti(surum),
  access_class       erisim_sinifi not null default 'kamuya_acik',
  unique (il_kod, yil)
);

-- ── üst ölçekli belgeler · AI değerlendirmesinin dayanağı ──────────────────

create table belge (
  id           bigserial primary key,
  ad           text not null,
  tur          belge_turu not null default 'diger',
  yil          text,
  /** kapsam: null = ulusal; ajans veya il verilmişse o kapsama özgü */
  ajans_kod    text references ajans(kod),
  il_kod       text references il(kod),
  metin        text not null,
  yukleyen_ref uuid references gonderen(ref),
  access_class erisim_sinifi not null default 'kamuya_acik',
  olusturuldu  timestamptz not null default now(),
  arama        tsvector generated always as (to_tsvector('simple', ad || ' ' || metin)) stored
);

create index belge_arama on belge using gin (arama);
create index belge_kapsam on belge (ajans_kod, il_kod);

-- ── öneri ──────────────────────────────────────────────────────────────────

create table oneri (
  id             bigserial primary key,
  donem_id       bigint not null references donem(id),
  gonderen_ref   uuid not null references gonderen(ref) on delete restrict,
  koken          koken not null default 'yeni',
  baslik         text not null,
  /** "neden burada?" — puanın en büyük payı buna ait */
  gerekce        text not null default '',
  ilce           text,
  nace_kod       text references nace(kod),
  nace_kaynagi   nace_kaynagi,
  durum          oneri_durumu not null default 'degerlendiriliyor',
  /** worker deneme sayacı: 'degerlendiriliyor' durumu kuyruğun kendisidir */
  deneme         integer not null default 0,
  son_hata       text,
  ret_gerekcesi  text,
  onaylayan_ref  uuid references gonderen(ref),
  onay_zamani    timestamptz,
  access_class   erisim_sinifi not null default 'kamuya_acik',
  olusturuldu    timestamptz not null default now(),
  guncellendi    timestamptz not null default now(),
  arama          tsvector generated always as (
    to_tsvector('simple', coalesce(baslik, '') || ' ' || coalesce(gerekce, ''))
  ) stored,
  constraint oneri_baslik_uzunluk check (char_length(baslik) >= 8),
  -- NACE varsa kaynağı da olmak zorunda: atamanın kim yaptığı kaybolmaz
  constraint oneri_nace_kaynagi check ((nace_kod is null) = (nace_kaynagi is null)),
  -- listede olan öneri onaylayan izi taşır
  constraint oneri_onay_izi check (
    durum <> 'listede' or (onaylayan_ref is not null and onay_zamani is not null)
  ),
  constraint oneri_ret_gerekcesi check (durum <> 'reddedildi' or ret_gerekcesi is not null)
);

create index oneri_donem on oneri (donem_id);
create index oneri_gonderen on oneri (gonderen_ref);
create index oneri_durum on oneri (durum);
create index oneri_arama on oneri using gin (arama);

-- ── AI değerlendirmesi ─────────────────────────────────────────────────────
--
-- `puanlar` AI'nin ürettiği ham kırılım; DEĞİŞMEZ. Ajans düzeltirse
-- `duzeltilmis_puanlar` dolar. Etkin puan = coalesce(duzeltilmis, puanlar).
-- Böylece "bu sayıyı kim koydu" sorusu her zaman cevaplanabilir.

create table degerlendirme (
  id                  bigserial primary key,
  oneri_id            bigint not null unique references oneri(id) on delete cascade,
  puanlar             jsonb not null,
  duzeltilmis_puanlar jsonb,
  duzelten_ref        uuid references gonderen(ref),
  /** AI'nin öneriyi üst ölçekli belgelere bağlayabilme derecesi (0–100) */
  dayanak             integer not null default 0,
  gerekce             text not null default '',
  /** [{ belge_id, belge_ad, alinti }] — doğrulayıcı bunları belgede arar */
  alintilar           jsonb not null default '[]'::jsonb,
  model_snapshot      text not null,
  prompt_surum        text not null,
  access_class        erisim_sinifi not null default 'kamuya_acik',
  olusturuldu         timestamptz not null default now(),
  constraint degerlendirme_dayanak_araligi check (dayanak between 0 and 100),
  -- 'latest' alias üretimde kullanılmaz
  constraint degerlendirme_snapshot_pinli check (model_snapshot <> 'latest'),
  constraint degerlendirme_duzeltme_izi check (
    (duzeltilmis_puanlar is null) = (duzelten_ref is null)
  )
);

-- ── denetim · append-only ──────────────────────────────────────────────────

create table denetim (
  id           bigserial primary key,
  zaman        timestamptz not null default now(),
  aktor_ref    uuid references gonderen(ref),
  aktor_rol    rol,
  eylem        text not null,
  nesne_tip    text not null,
  nesne_id     text,
  detay        jsonb not null default '{}'::jsonb,
  access_class erisim_sinifi not null default 'kurum_ici'
);

create index denetim_nesne on denetim (nesne_tip, nesne_id);
create index denetim_zaman on denetim (zaman desc);


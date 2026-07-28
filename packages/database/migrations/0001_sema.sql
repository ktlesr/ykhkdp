-- 0001 — çekirdek şema.
--
-- Brief §4: KVKK/kimlik ayrımı İLK migration'da kurulur. Öneriler kişiye değil,
-- değişmez `submitter_ref` anahtarına bağlanır; kişisel veri ayrı `kimlik`
-- tablosunda durur. Silme talebinde kimlik pseudonimleştirilir, karar zinciri
-- bozulmaz. `denetim` append-only kalır.
--
-- rls-first: her tabloda `access_class` sütunu ve RLS politikası vardır (0002).

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ── enum'lar ───────────────────────────────────────────────────────────────

create type erisim_sinifi as enum ('kamuya_acik', 'kurum_ici', 'kisitli', 'gizli');

create type rol as enum (
  'birey', 'ajans_uzmani', 'sektor_uzmani', 'kurul_uyesi',
  'gozlemci', 'denetci', 'sistem_yoneticisi', 'ai_yonetisim'
);

create type oneri_durumu as enum (
  'taslak', 'kanit_bekliyor', 'triyaj', 'uzman_incelemesinde',
  'revizyon_istendi', 'konu_adayi', 'birlestirildi', 'reddedildi'
);

create type donem_durumu as enum ('hazirlik', 'oneri_acik', 'degerlendirme', 'kilitli');

create type dogrulama_durumu as enum (
  'beyan', 'ai_bulgusu', 'uzman_onayli', 'reddedildi', 'celiskili'
);

create type koken as enum ('mevcut', 'yeni');

create type oneri_turu as enum ('yeni', 'koruma', 'kapsam');

create type kriter as enum (
  'plan_uyumu', 'yerel_potansiyel', 'pazar_talep', 'deger_zinciri',
  'istihdam_katma_deger', 'uygulanabilirlik', 'yatirimci_ilgisi', 'surdurulebilirlik'
);

create type iddia_iliskisi as enum ('destekler', 'celisir');

create type is_durumu as enum ('bekliyor', 'calisiyor', 'tamam', 'hata');

-- ── kimlik ayrımı ──────────────────────────────────────────────────────────

-- Değişmez anahtar. Öneri, kanıt, destek, denetim — hepsi buna bağlanır.
create table gonderen (
  ref            uuid primary key default gen_random_uuid(),
  rol            rol not null default 'birey',
  -- brief §4: kurum/sektör/uzmanlık DOĞRULANMAMIŞ beyandır, puana etki etmez
  beyan_kurum    text,
  beyan_sektor   text,
  beyan_uzmanlik text,
  access_class   erisim_sinifi not null default 'kurum_ici',
  olusturuldu    timestamptz not null default now()
);

comment on column gonderen.beyan_kurum is
  'Doğrulanmamış beyan. Her yerde doğrulanmamış olarak gösterilir, puana etki etmez (brief §4).';

-- Kişisel veri YALNIZCA burada. Silme talebinde bu satır pseudonimleşir,
-- gonderen.ref ve ona bağlı karar zinciri olduğu gibi kalır.
create table kimlik (
  gonderen_ref        uuid primary key references gonderen(ref) on delete restrict,
  eposta              citext,
  ad_soyad            text,
  parola_hash         text,
  eposta_dogrulandi   boolean not null default false,
  dogrulama_kodu      text,
  pseudonimlestirildi boolean not null default false,
  pseudonim_zamani    timestamptz,
  access_class        erisim_sinifi not null default 'gizli',
  olusturuldu         timestamptz not null default now()
);

create unique index kimlik_eposta_uniq on kimlik (eposta) where pseudonimlestirildi = false;

create table oturum (
  token_hash   text primary key,
  gonderen_ref uuid not null references gonderen(ref) on delete cascade,
  gecerlilik   timestamptz not null,
  access_class erisim_sinifi not null default 'gizli',
  olusturuldu  timestamptz not null default now()
);

create index oturum_gonderen on oturum (gonderen_ref);

-- ── coğrafya ve dönem ──────────────────────────────────────────────────────
-- Kodda hiçbir il, ajans veya bölge sabitlenmez (brief §5). Hepsi veridir.

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

-- Sürümlü kriter/ağırlık kaydı — (ajans, dönem) anahtarlı (brief §5).
create table agirlik_seti (
  surum           text primary key,
  ajans_kod       text not null references ajans(kod),
  donem_yil       text not null,
  agirliklar      jsonb not null,
  devamlilik_payi integer not null,
  kanit_esigi     integer not null,
  devir_siniri    integer not null,
  slot_sayisi     integer not null,
  access_class    erisim_sinifi not null default 'kamuya_acik',
  olusturuldu     timestamptz not null default now(),
  constraint agirlik_seti_pay_araligi check (devamlilik_payi between 0 and 100),
  constraint agirlik_seti_esik_araligi check (kanit_esigi between 0 and 100),
  constraint agirlik_seti_slot check (slot_sayisi >= 1)
);

create table donem (
  id                 bigserial primary key,
  il_kod             text not null references il(kod),
  yil                text not null,
  durum              donem_durumu not null default 'hazirlik',
  agirlik_seti_surum text not null references agirlik_seti(surum),
  access_class       erisim_sinifi not null default 'kamuya_acik',
  olusturuldu        timestamptz not null default now(),
  unique (il_kod, yil)
);

-- ── öneri ve aday ──────────────────────────────────────────────────────────

create table oneri (
  id               bigserial primary key,
  donem_id         bigint not null references donem(id),
  gonderen_ref     uuid not null references gonderen(ref) on delete restrict,
  tur              oneri_turu not null default 'yeni',
  baslik           text not null,
  tanim            text not null default '',
  ilce             text,
  neden            text not null default '',
  nace             text,
  nace_onayli      boolean not null default false,
  durum            oneri_durumu not null default 'taslak',
  birlestirildi_id bigint references oneri(id),
  access_class     erisim_sinifi not null default 'kamuya_acik',
  olusturuldu      timestamptz not null default now(),
  guncellendi      timestamptz not null default now(),
  arama            tsvector generated always as (
    to_tsvector('simple', coalesce(baslik, '') || ' ' || coalesce(tanim, '') || ' ' || coalesce(nace, ''))
  ) stored
);

create index oneri_donem on oneri (donem_id);
create index oneri_gonderen on oneri (gonderen_ref);
create index oneri_arama on oneri using gin (arama);

-- Sıralamaya giren aday. Mevcut konu (oneri_id null) ve yeni öneri aynı tabloda,
-- aynı kriter setiyle yarışır (brief §2).
create table aday (
  id           bigserial primary key,
  donem_id     bigint not null references donem(id),
  oneri_id     bigint unique references oneri(id),
  ad           text not null,
  koken        koken not null,
  nace         text,
  access_class erisim_sinifi not null default 'kamuya_acik',
  olusturuldu  timestamptz not null default now()
);

create index aday_donem on aday (donem_id);

-- ── kanıt ──────────────────────────────────────────────────────────────────

create table kanit (
  id                bigserial primary key,
  -- kamuya açık künye kodu; UI ve raporda bu görünür
  kod               text not null unique,
  donem_id          bigint not null references donem(id),
  -- Kanıt bir adaya (konuya) bağlanır. `oneri_id` yalnızca kanıtı getiren
  -- öneri dosyasını işaret eder; mevcut konuların önerisi yoktur.
  aday_id           bigint references aday(id) on delete cascade,
  oneri_id          bigint references oneri(id),
  kaynak_kurum      text not null,
  belge             text not null,
  belge_surum       text,
  sayfa_tablo       text,
  yayim_tarihi      date,
  cografi_kapsam    text,
  veri_donemi       text,
  url               text,
  dosya_yolu        text,
  alinti            text,
  sinirlilik        text,
  -- kanıt yeterliliğine katkısı; yalnızca uzman onaylıysa toplanır
  katki_puani       integer not null default 0,
  dogrulama_durumu  dogrulama_durumu not null default 'beyan',
  dogrulayan_ref    uuid references gonderen(ref),
  dogrulama_zamani  timestamptz,
  -- span: belge metni içinde alıntının yeri; doğrulayıcı bunu kontrol eder
  span_baslangic    integer,
  span_bitis        integer,
  belge_metni       text,
  access_class      erisim_sinifi not null default 'kamuya_acik',
  olusturuldu       timestamptz not null default now(),
  constraint kanit_katki_araligi check (katki_puani between 0 and 100),
  constraint kanit_span_tutarli check (
    (span_baslangic is null and span_bitis is null) or
    (span_baslangic is not null and span_bitis is not null and span_bitis > span_baslangic)
  ),
  -- fail-closed: uzman onaylı kanıt doğrulayan ve zaman taşımak zorunda
  constraint kanit_onay_izi check (
    dogrulama_durumu <> 'uzman_onayli' or (dogrulayan_ref is not null and dogrulama_zamani is not null)
  )
);

create index kanit_oneri on kanit (oneri_id);
create index kanit_aday on kanit (aday_id);
create index kanit_donem on kanit (donem_id);

create table iddia (
  id           bigserial primary key,
  aday_id      bigint not null references aday(id) on delete cascade,
  metin        text not null,
  access_class erisim_sinifi not null default 'kamuya_acik',
  olusturuldu  timestamptz not null default now()
);

create index iddia_aday on iddia (aday_id);

create table iddia_kanit (
  iddia_id     bigint not null references iddia(id) on delete cascade,
  kanit_id     bigint not null references kanit(id) on delete cascade,
  iliski       iddia_iliskisi not null default 'destekler',
  access_class erisim_sinifi not null default 'kamuya_acik',
  primary key (iddia_id, kanit_id)
);

-- Kriter puanı: yalnızca doğrulanmış girdiler puana girer (§1.3).
create table kriter_puani (
  id             bigserial primary key,
  aday_id        bigint not null references aday(id) on delete cascade,
  kriter         kriter not null,
  puan           integer not null,
  dogrulandi     boolean not null default false,
  degerlendiren_ref uuid references gonderen(ref),
  gerekce        text,
  access_class   erisim_sinifi not null default 'kurum_ici',
  olusturuldu    timestamptz not null default now(),
  constraint kriter_puani_araligi check (puan between 0 and 100),
  unique (aday_id, kriter)
);

-- ── AI bulgusu ─────────────────────────────────────────────────────────────

create table bulgu (
  id               bigserial primary key,
  oneri_id         bigint references oneri(id) on delete cascade,
  aday_id          bigint references aday(id) on delete cascade,
  tip              text not null,
  icerik           jsonb not null,
  -- brief §3: model snapshot ve prompt sürümü her analizle kaydedilir
  model_snapshot   text not null,
  prompt_surum     text not null,
  kanit_id         bigint references kanit(id),
  dogrulama_durumu dogrulama_durumu not null default 'ai_bulgusu',
  access_class     erisim_sinifi not null default 'kurum_ici',
  olusturuldu      timestamptz not null default now(),
  -- 'latest' alias üretimde kullanılmaz
  constraint bulgu_snapshot_pinli check (model_snapshot <> 'latest')
);

create index bulgu_oneri on bulgu (oneri_id);

-- ── destek (puan girdisi DEĞİL) ────────────────────────────────────────────

create table destek (
  oneri_id     bigint not null references oneri(id) on delete cascade,
  gonderen_ref uuid not null references gonderen(ref) on delete restrict,
  access_class erisim_sinifi not null default 'kamuya_acik',
  olusturuldu  timestamptz not null default now(),
  primary key (oneri_id, gonderen_ref)
);

comment on table destek is
  'İlgi sinyali. Hiçbir kod yolu bu tabloyu puanlama girdisine bağlamaz (brief §2).';

-- ── karar ve denetim ───────────────────────────────────────────────────────

create table karar (
  id             bigserial primary key,
  donem_id       bigint not null references donem(id),
  surum          text not null,
  icerik         jsonb not null,
  gerekceler     jsonb not null default '[]'::jsonb,
  kilitleyen_ref uuid not null references gonderen(ref),
  kilit_zamani   timestamptz not null default now(),
  access_class   erisim_sinifi not null default 'kamuya_acik',
  unique (donem_id, surum)
);

-- Append-only. Update/delete 0003'te trigger ile engellenir.
create table denetim (
  id          bigserial primary key,
  zaman       timestamptz not null default now(),
  aktor_ref   uuid references gonderen(ref),
  aktor_rol   rol,
  eylem       text not null,
  nesne_tip   text not null,
  nesne_id    text,
  detay       jsonb not null default '{}'::jsonb,
  access_class erisim_sinifi not null default 'kisitli'
);

create index denetim_nesne on denetim (nesne_tip, nesne_id);
create index denetim_zaman on denetim (zaman desc);

-- ── iş kuyruğu (apps/worker) ───────────────────────────────────────────────

create table is_kuyrugu (
  id           bigserial primary key,
  tip          text not null,
  yuk          jsonb not null default '{}'::jsonb,
  durum        is_durumu not null default 'bekliyor',
  deneme       integer not null default 0,
  hata         text,
  access_class erisim_sinifi not null default 'kisitli',
  olusturuldu  timestamptz not null default now(),
  guncellendi  timestamptz not null default now()
);

create index is_kuyrugu_bekleyen on is_kuyrugu (durum, id) where durum = 'bekliyor';

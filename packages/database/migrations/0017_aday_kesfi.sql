-- ── Aday keşfi: belgelerden yatırım konusu adayı ────────────────────────────
--
-- Keşif PUANLAMAZ ve SEÇMEZ. Belgelerden aday üretir; her aday sıradan bir
-- `oneri` olarak `degerlendiriliyor` durumuna girer ve mevcut değerlendirme
-- hattından (8 kriter, alıntı doğrulama, karşı görüş) AYRI bir model
-- çağrısıyla geçer. Karar yine ajansındır.
--
-- İki aşama:
--   1. kanıt defteri — her belge parçası BİR KEZ taranır (il bağımsız) ve
--      birebir doğrulanmış pasajlar `kanit` tablosuna yazılır. Ulusal belge
--      81 il için bir kez taranır.
--   2. aday üretimi — il başına; model YALNIZCA defterdeki doğrulanmış
--      kanıtlara numarayla atıf yapabilir, yeni alıntı yazamaz.

-- Parçanın taranmış olması kanıt çıkmamasından ayrıdır: "boş" bir sonuçtur.
create table kanit_tarama (
  belge_id       bigint not null references belge(id) on delete cascade,
  prompt_surum   text not null,
  model_snapshot text not null check (model_snapshot <> 'latest'),
  kanit_sayisi   int not null,
  tarandi        timestamptz not null default now(),
  access_class   erisim_sinifi not null default 'kurum_ici',
  primary key (belge_id, prompt_surum, model_snapshot)
);

create table kanit (
  id             bigserial primary key,
  belge_id       bigint not null references belge(id) on delete cascade,
  prompt_surum   text not null,
  model_snapshot text not null check (model_snapshot <> 'latest'),
  tur            text not null check (tur in ('yerel_olgu', 'firsat', 'oncelik', 'kisit')),
  konu           text not null check (char_length(konu) between 3 and 160),
  -- Modelin yazdığı değil, KAYNAKTAN sunucunun kestiği özgün metin.
  alinti         text not null,
  olusturuldu    timestamptz not null default now(),
  access_class   erisim_sinifi not null default 'kurum_ici'
);
create index kanit_belge on kanit (belge_id, prompt_surum, model_snapshot);
-- İki worker aynı ulusal parçayı aynı anda tarayabilir; aynı pasaj iki kanıt
-- olursa tek metin adayın "iki farklı kanıt" şartını karşılardı.
create unique index kanit_tekil on kanit (belge_id, prompt_surum, model_snapshot, md5(alinti));

create table kesif (
  id             bigserial primary key,
  donem_id       bigint not null references donem(id),
  tetikleyen_ref uuid not null references gonderen(ref),
  durum          text not null default 'bekliyor'
                 check (durum in ('bekliyor', 'calisiyor', 'tamam', 'hata')),
  asama          text check (asama is null or asama in ('envanter', 'tarama', 'aday', 'kayit')),
  toplam_parca   int not null default 0,
  taranan_parca  int not null default 0,
  kanit_sayisi   int not null default 0,
  yerel_kanit    int not null default 0,
  aday_sayisi    int not null default 0,
  deneme         int not null default 0,
  mesaj          text,
  model_snapshot text check (model_snapshot is null or model_snapshot <> 'latest'),
  prompt_surum   text,
  olusturuldu    timestamptz not null default now(),
  guncellendi    timestamptz not null default now(),
  access_class   erisim_sinifi not null default 'kurum_ici'
);
-- Aynı dönemde aynı anda tek koşu: çift tıklama iki kez model maliyeti doğurmaz.
create unique index kesif_tek_aktif on kesif (donem_id) where durum in ('bekliyor', 'calisiyor');

alter table oneri
  add column kesif_id bigint references kesif(id),
  -- Adayı doğuran doğrulanmış kanıtlar: belge, çıpa, özgün pasaj, yerel mi.
  add column kesif_kanit jsonb,
  add constraint oneri_kesif_izi check ((kesif_id is null) = (kesif_kanit is null));
-- Yeniden deneme aynı adayı ikinci kez yazmaz.
create unique index oneri_kesif_tekil on oneri (kesif_id, lower(baslik)) where kesif_id is not null;

-- ── RLS ────────────────────────────────────────────────────────────────────

/**
 * Bu il, oturumdaki kişinin kapsamında mı: yönetici her il, ajans yalnızca
 * kendi bölgesi. Bölgesi atanmamış ajans hiçbir ilde keşif açamaz (fail-closed,
 * toplu raporla aynı kural).
 */
create or replace function app_il_kapsaminda(p_il text) returns boolean
language sql stable as $$
  select app_rol() = 'yonetici'
      or (app_rol() = 'ajans' and exists (
            select 1 from gonderen g join il i on i.ajans_kod = g.ajans_kod
            where g.ref = app_ref() and i.kod = p_il))
$$;

alter table kanit_tarama enable row level security;
alter table kanit_tarama force row level security;
create policy kanit_tarama_oku on kanit_tarama for select using (app_onaylayabilir());
create policy kanit_tarama_yaz on kanit_tarama for all
  using (app_rol() = 'yonetici') with check (app_rol() = 'yonetici');

alter table kanit enable row level security;
alter table kanit force row level security;
create policy kanit_oku on kanit for select using (app_onaylayabilir());
create policy kanit_yaz on kanit for all
  using (app_rol() = 'yonetici') with check (app_rol() = 'yonetici');

alter table kesif enable row level security;
alter table kesif force row level security;
create policy kesif_oku on kesif for select using (app_onaylayabilir());
create policy kesif_ac on kesif for insert with check (
  app_onaylayabilir() and tetikleyen_ref = app_ref()
  and app_il_kapsaminda((select d.il_kod from donem d where d.id = donem_id))
);
-- İlerleme ve sonuç worker'ın (servis bağlamı, yönetici) işidir.
create policy kesif_guncelle on kesif for update
  using (app_rol() = 'yonetici') with check (app_rol() = 'yonetici');

comment on table kesif is 'Belgelerden aday keşfi koşusu; durum kolonu kuyruğun kendisidir.';
comment on table kanit is 'Belge parçasından çıkarılmış, kaynakta birebir doğrulanmış pasaj.';

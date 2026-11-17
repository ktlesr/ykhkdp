-- ── Konu kapsamı ve çoklu NACE ──────────────────────────────────────────────
--
-- Tek ürün ("airbag") yatırımcı havuzunu daraltır; çıplak sektör adı
-- ("otomotiv") "neden burada?" sorusunu cevaplamaz. İyi konu çoğu zaman ilin
-- kabiliyetine dayanan bir ürün AİLESİDİR. Bu migration iki şey ekler:
--
--   oneri.kapsam            ürün grupları, yapılandırılmış: [{ad, kanit_id[]}]
--                           keşifte her grup KENDİ kanıtına bağlıdır; kullanıcı
--                           girdiyse kanıt dizisi boştur ve "doğrulanmadı" görünür.
--   degerlendirme.kapsam_notu  {tur, aciklama} — PUANA ETKİ ETMEZ. Kapsamın
--                           genişliği talep kanıtı değildir; not ajansın
--                           kararına girer, sıralamaya girmez.
--   oneri_nace              EK NACE kodları — her biri bir ürün grubuna bağlı.
--                           Ana kod `oneri.nace_kod` olarak kalır: sıralama,
--                           rapor ve ekranlar değişmez.

alter table oneri
  add column kapsam jsonb,
  add constraint oneri_kapsam_dizi check (kapsam is null or (jsonb_typeof(kapsam) = 'array' and jsonb_array_length(kapsam) <= 8));

alter table degerlendirme
  add column kapsam_notu jsonb,
  add constraint degerlendirme_kapsam_notu check (
    kapsam_notu is null or kapsam_notu->>'tur' in ('dar', 'urun_ailesi', 'asiri_genis', 'kanit_yetersiz')
  );

create table oneri_nace (
  oneri_id     bigint not null references oneri(id) on delete cascade,
  nace_kod     text not null references nace(kod),
  urun_grubu   text not null check (char_length(urun_grubu) between 2 and 120),
  gerekce      text,
  guven        text check (guven in ('dusuk', 'orta', 'yuksek')),
  kaynak       nace_kaynagi not null,
  sira         int not null check (sira between 1 and 8),
  olusturuldu  timestamptz not null default now(),
  access_class erisim_sinifi not null default 'kamuya_acik',
  primary key (oneri_id, nace_kod)
);

alter table oneri_nace enable row level security;
alter table oneri_nace force row level security;
-- Görünürlük öneriden miras: öneriyi göremeyen ek kodlarını da göremez.
create policy oneri_nace_oku on oneri_nace for select
  using (exists (select 1 from oneri o where o.id = oneri_id));
-- AI ataması servis bağlamında (yönetici), düzeltme ajansta.
create policy oneri_nace_yaz on oneri_nace for all
  using (app_onaylayabilir()) with check (app_onaylayabilir());

comment on column oneri.kapsam is 'Ürün grupları [{ad, kanit_id[]}]; keşifte her grup kendi kanıtına bağlı.';
comment on column degerlendirme.kapsam_notu is 'Konu ölçeği notu; puana ve sıralamaya ETKİ ETMEZ.';
comment on table oneri_nace is 'Ek NACE kodları; her biri bir ürün grubuna bağlı. Ana kod oneri.nace_kod.';

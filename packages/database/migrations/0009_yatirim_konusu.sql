-- ── resmî yerel yatırım konuları listesi ─────────────────────────────────────
--
-- Sanayi ve Teknoloji Bakanlığı "Yerel Yatırım Konuları Listesi Tebliği" —
-- her il için o yılın dört yatırım konusu. Bu bir ÖNERİ DEĞİL, yayımlanmış
-- resmî listedir; `oneri` tablosuna zorlanmaz.
--
-- Zorlansaydı iki şey uydurmak gerekirdi: `gonderen_ref` (kimse önermedi,
-- Bakanlık ilan etti) ve `onaylayan_ref` (ajans onaylamadı). Bu ürünün tam
-- olarak reddettiği türden uydurma olurdu.
--
-- Karar modelindeki `koken='mevcut'` adayları BURADAN türetilir: bir dönem
-- açıldığında o ilin o yılki resmî konuları sıralamaya mevcut aday olarak
-- girer. Türetme açık ve denetlenebilir bir işlemdir, veri iki yerde
-- kopyalanmaz.

create table yatirim_konusu (
  id           bigserial primary key,
  il_kod       text not null references il(kod),
  yil          integer not null,
  /** listedeki sıra — tebliğdeki dizilim korunur */
  sira         integer not null,
  baslik       text not null,
  /** 2025 tebliğinde gerekçe yok, 2026'da var; boş olabilir */
  gerekce      text not null default '',
  /** tebliğ künyesi — "hangi belge böyle diyor" kaybolmaz */
  kaynak       text not null,
  access_class erisim_sinifi not null default 'kamuya_acik',
  olusturuldu  timestamptz not null default now(),
  constraint yatirim_konusu_tekil unique (il_kod, yil, sira),
  constraint yatirim_konusu_baslik check (char_length(baslik) >= 8),
  constraint yatirim_konusu_yil check (yil between 2000 and 2100)
);

create index yatirim_konusu_il_yil on yatirim_konusu (il_kod, yil);

alter table yatirim_konusu enable row level security;
alter table yatirim_konusu force row level security;

-- Resmî liste kamuya açık; yalnızca ajans yükler.
create policy yatirim_konusu_oku on yatirim_konusu for select using (app_gorebilir(access_class));
create policy yatirim_konusu_yaz on yatirim_konusu for all
  using (app_onaylayabilir()) with check (app_onaylayabilir());

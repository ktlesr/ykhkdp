-- ── kurumsal ayarlar ─────────────────────────────────────────────────────────
--
-- Tek satırlık genel ayar değil, anahtar/değer: ileride başka ayar eklendiğinde
-- şema değişmesin. İlk anahtar `palet` — arayüz renk paleti.
--
-- KURUMSAL karar: yöneticinin belirlediği tek görünüm herkes için geçerlidir.
-- Kişisel tercih olsaydı "bende böyle görünüyor" tartışması çıkar ve ekran
-- görüntüsünün kanıt değeri düşerdi. Değişiklik denetime yazılır.

create table ayar (
  anahtar        text primary key,
  deger          text not null,
  guncelleyen_ref uuid references gonderen(ref),
  guncellendi    timestamptz not null default now(),
  access_class   erisim_sinifi not null default 'kamuya_acik'
);

alter table ayar enable row level security;
alter table ayar force row level security;

-- Palet herkesin gördüğü bir şey: okuma kamuya açık.
create policy ayar_oku on ayar for select using (app_gorebilir(access_class));
-- Yalnızca yönetici yazar; ajans bile değiştiremez.
create policy ayar_yaz on ayar for all
  using (app_rol() = 'yonetici') with check (app_rol() = 'yonetici');

insert into ayar (anahtar, deger) values ('palet', 'temel');

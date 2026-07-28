-- 0003 — veritabanı düzeyinde iş kuralları.
--
-- Buradaki kısıtlar uygulama kodundan bağımsız olarak geçerlidir: bir kod
-- yolu unutulsa bile veritabanı kuralı çiğnemez.

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

-- ── kilitli dönem salt okunur (§1.7) ───────────────────────────────────────

create or replace function donem_kilitli_mi(p_donem_id bigint) returns boolean
language sql stable as $$
  select durum = 'kilitli' from donem where id = p_donem_id
$$;

create or replace function kilitli_donem_yazma_engeli() returns trigger
language plpgsql as $$
declare
  d bigint;
begin
  d := coalesce(new.donem_id, old.donem_id);
  if donem_kilitli_mi(d) then
    raise exception 'Dönem kilitli; sürüm dondurulmuştur. Değişiklik yeni sürüm açılarak yapılır.';
  end if;
  return coalesce(new, old);
end $$;

create trigger oneri_kilit_engel before insert or update or delete on oneri
  for each row execute function kilitli_donem_yazma_engeli();

create trigger aday_kilit_engel before insert or update or delete on aday
  for each row execute function kilitli_donem_yazma_engeli();

create trigger kanit_kilit_engel before insert or update or delete on kanit
  for each row execute function kilitli_donem_yazma_engeli();

-- ── kilitten geri dönüş yok ────────────────────────────────────────────────

create or replace function donem_kilit_tek_yon() returns trigger
language plpgsql as $$
begin
  if old.durum = 'kilitli' and new.durum <> 'kilitli' then
    raise exception 'Kilitli dönem geri açılamaz; yeni sürüm açın.';
  end if;
  return new;
end $$;

create trigger donem_kilit_tek_yon_trg before update on donem
  for each row execute function donem_kilit_tek_yon();

-- ── kanıt yeterliliği: yalnızca uzman onaylı kanıt toplanır (§1.3) ─────────

create or replace function kanit_yeterliligi(p_aday_id bigint) returns integer
language sql stable as $$
  select least(100, greatest(0, coalesce(sum(katki_puani), 0)))::integer
  from kanit
  where aday_id = p_aday_id and dogrulama_durumu = 'uzman_onayli'
$$;

comment on function kanit_yeterliligi is
  'Puanlamaya yalnızca uzman onaylı kanıt girer. AI bulgusu ve beyan toplanmaz (README §1.3).';

-- Doğrulanmamışlar dahil edilseydi ne olurdu — yalnızca gösterim için.
create or replace function kanit_potansiyeli(p_aday_id bigint) returns integer
language sql stable as $$
  select least(100, greatest(0, coalesce(sum(katki_puani), 0)))::integer
  from kanit
  where aday_id = p_aday_id and dogrulama_durumu <> 'reddedildi'
$$;

-- Öneri dosyasının kanıt yeterliliği (Blok 3 · dosya güçlendirme).
create or replace function oneri_kanit_yeterliligi(p_oneri_id bigint) returns integer
language sql stable as $$
  select least(100, greatest(0, coalesce(sum(katki_puani), 0)))::integer
  from kanit
  where oneri_id = p_oneri_id and dogrulama_durumu = 'uzman_onayli'
$$;

/**
 * Stratejik puan — ağırlıklı toplam.
 *
 * Yayımlanan karar puanı taşır; kırılımı ve değerlendirici gerekçesi taşımaz.
 * Bu yüzden TOPLAM kamuya açıktır (security definer), `kriter_puani` satırları
 * ise RLS altında kalır. Aksi hâlde kamu görünümü, uzman görünümünden FARKLI
 * bir sıralama gösterirdi — ürünün doğruluk iddiasını çökertir.
 */
create or replace function aday_taban_puani(p_aday_id bigint, p_agirliklar jsonb)
returns integer language sql stable security definer
set search_path = public as $$
  select coalesce(round(sum(kp.puan * (p_agirliklar ->> kp.kriter::text)::numeric)), 0)::integer
  from kriter_puani kp
  where kp.aday_id = p_aday_id and kp.dogrulandi = true
$$;

revoke all on function aday_taban_puani(bigint, jsonb) from public;
grant execute on function aday_taban_puani(bigint, jsonb) to ykh_app;

-- Epistemik durum — README §4. Tek kaynak burada, UI türetmez.
create or replace function aday_epistemik(p_aday_id bigint, p_esik integer)
returns text language sql stable as $$
  select case
    when kanit_yeterliligi(p_aday_id) >= p_esik then 'onay'
    when exists (
      select 1 from kanit
      where aday_id = p_aday_id and dogrulama_durumu in ('beyan', 'ai_bulgusu', 'celiskili')
    ) then 'ai'
    else 'yok'
  end
$$;

-- ── destek sayısı: ilgi sinyali, puan girdisi değil ────────────────────────

create or replace function destek_sayisi(p_oneri_id bigint) returns integer
language sql stable as $$
  select count(*)::integer from destek where oneri_id = p_oneri_id
$$;

comment on function destek_sayisi is
  'İlgi sinyali. Puanlama zincirinde bu fonksiyonu çağıran hiçbir yol yoktur (brief §2).';

-- ── kanıt künyesi görünümü: belge içeriği maskeli ─────────────────────────
-- Tasarım §6: "Kamuya açık künye · belge içeriği yalnızca uzmanlarda".

create or replace view kanit_kunye
with (security_invoker = true) as
select
  k.id, k.kod, k.donem_id, k.aday_id, k.oneri_id,
  k.kaynak_kurum, k.belge, k.belge_surum, k.sayfa_tablo, k.yayim_tarihi,
  k.cografi_kapsam, k.veri_donemi, k.url,
  k.alinti, k.sinirlilik, k.katki_puani,
  k.dogrulama_durumu, k.dogrulayan_ref, k.dogrulama_zamani,
  k.access_class, k.olusturuldu,
  case when app_uzman() then k.belge_metni else null end as belge_metni,
  case when app_uzman() then k.dosya_yolu else null end as dosya_yolu,
  case when app_uzman() then k.span_baslangic else null end as span_baslangic,
  case when app_uzman() then k.span_bitis else null end as span_bitis
from kanit k;

grant select on kanit_kunye to ykh_app;

-- ── kimlik doğrulama kapıları ──────────────────────────────────────────────
--
-- Giriş anında henüz bir bağlam yoktur; RLS altında `kimlik` okunamaz (ki bu
-- doğru davranıştır). Bu üç fonksiyon RLS'i YALNIZCA kimlik doğrulama için,
-- açıkça sınırlanmış çıktıyla aşar. Başka hiçbir kolonu dışarı vermezler.

create or replace function giris_kimlik(p_eposta citext)
returns table (gonderen_ref uuid, parola_hash text)
language sql security definer stable
set search_path = public as $$
  select k.gonderen_ref, k.parola_hash
  from kimlik k
  where k.eposta = p_eposta and k.pseudonimlestirildi = false
$$;

create or replace function eposta_kayitli(p_eposta citext)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from kimlik where eposta = p_eposta and pseudonimlestirildi = false)
$$;

create or replace function oturum_coz(p_token_hash text)
returns table (ref uuid, rol rol, eposta citext, ad_soyad text)
language sql security definer stable
set search_path = public as $$
  select g.ref, g.rol, k.eposta, k.ad_soyad
  from oturum o
  join gonderen g on g.ref = o.gonderen_ref
  left join kimlik k on k.gonderen_ref = g.ref
  where o.token_hash = p_token_hash and o.gecerlilik > now()
$$;

/**
 * Hesap açma. `insert ... returning` RLS altında SELECT politikasına takılır
 * (yeni satır henüz kimseye ait değildir) — kayıt bu yüzden tek, atomik ve
 * sınırlı bir fonksiyondan geçer. Yalnızca `birey` rolü açılabilir; yetkili
 * roller davetle atanır (brief §4).
 */
create or replace function hesap_ac(p_eposta citext, p_ad text, p_hash text, p_dogrulandi boolean)
returns uuid language plpgsql security definer
set search_path = public as $$
declare
  r uuid;
begin
  if exists (select 1 from kimlik where eposta = p_eposta and pseudonimlestirildi = false) then
    raise exception 'eposta_kayitli' using errcode = 'unique_violation';
  end if;
  insert into gonderen (rol) values ('birey') returning ref into r;
  insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash, eposta_dogrulandi)
  values (r, p_eposta, p_ad, p_hash, p_dogrulandi);
  return r;
end $$;

revoke all on function hesap_ac(citext, text, text, boolean) from public;
grant execute on function hesap_ac(citext, text, text, boolean) to ykh_app;

revoke all on function giris_kimlik(citext) from public;
revoke all on function eposta_kayitli(citext) from public;
revoke all on function oturum_coz(text) from public;
grant execute on function giris_kimlik(citext) to ykh_app;
grant execute on function eposta_kayitli(citext) to ykh_app;
grant execute on function oturum_coz(text) to ykh_app;

-- ── kimlik pseudonimleştirme (KVKK silme talebi) ───────────────────────────
-- Öneri ve karar zinciri bozulmadan kişisel veri silinir.

create or replace function kimlik_pseudonimlestir(p_ref uuid) returns void
language plpgsql security definer as $$
begin
  update kimlik set
    eposta = null,
    ad_soyad = null,
    parola_hash = null,
    dogrulama_kodu = null,
    pseudonimlestirildi = true,
    pseudonim_zamani = now()
  where gonderen_ref = p_ref;

  update gonderen set
    beyan_kurum = null, beyan_sektor = null, beyan_uzmanlik = null
  where ref = p_ref;

  delete from oturum where gonderen_ref = p_ref;

  insert into denetim (aktor_ref, eylem, nesne_tip, nesne_id, detay)
  values (p_ref, 'kimlik_pseudonimlestirildi', 'gonderen', p_ref::text,
          jsonb_build_object('not', 'Öneri ve karar zinciri korundu; kişisel veri silindi.'));
end $$;

revoke all on function kimlik_pseudonimlestir(uuid) from public;
grant execute on function kimlik_pseudonimlestir(uuid) to ykh_app;

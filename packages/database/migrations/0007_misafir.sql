-- ── misafir gönderen ─────────────────────────────────────────────────────────
--
-- "Kayıt olmadan devam et": yatırımcı kişisel veri vermeden öneri gönderebilir.
--
-- Veri modeli bunu zaten destekliyor: öneri kişiye değil değişmez `gonderen.ref`
-- anahtarına bağlı, kişisel veri ayrı `kimlik` tablosunda. Misafir = `kimlik`
-- satırı HİÇ oluşturulmayan bir gönderen. Toplanan kişisel veri sıfır; KVKK
-- silme talebi için pseudonimleştirilecek bir şey yok.
--
-- `misafir` kolonu ayrıca tutuluyor çünkü ajans "kimin önerdiği" bilgisini
-- görmek zorunda: `kimlik` gizli sınıfta ve ajans onu okuyamaz. Kolon
-- `gonderen` üzerinde (kurum_ici) ve ajans görüyor. Kimin önerdiği ajans
-- kararında saklanmaz.

alter table gonderen add column misafir boolean not null default false;

/**
 * Misafir gönderen açar. RLS'i aşar çünkü bağlam henüz yok — `hesap_ac` ile
 * aynı gerekçe. Yalnızca `yatirimci` rolü açılabilir ve `kimlik` yazılmaz.
 */
create or replace function misafir_ac() returns uuid
language plpgsql security definer set search_path = public as $$
declare r uuid;
begin
  insert into gonderen (rol, misafir) values ('yatirimci', true) returning ref into r;
  return r;
end $$;

revoke all on function misafir_ac() from public;
grant execute on function misafir_ac() to ykh_app;

-- `oturum_coz` misafir işaretini de döndürsün: arayüz "Misafir" yazabilsin ve
-- öneri sayfası kayıt çağrısını yalnızca misafire göstersin. Dönüş tipi
-- değiştiği için önce düşürülüyor.
drop function if exists oturum_coz(text);

create or replace function oturum_coz(p_token_hash text)
returns table (ref uuid, rol rol, eposta citext, ad_soyad text, misafir boolean)
language sql security definer stable set search_path = public as $$
  select g.ref, g.rol, k.eposta, k.ad_soyad, g.misafir
  from oturum o
  join gonderen g on g.ref = o.gonderen_ref
  left join kimlik k on k.gonderen_ref = g.ref
  where o.token_hash = p_token_hash and o.gecerlilik > now()
$$;

revoke all on function oturum_coz(text) from public;
grant execute on function oturum_coz(text) to ykh_app;

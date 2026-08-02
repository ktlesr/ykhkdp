-- ── ajans kullanıcısının bölgesi + KVKK denetim aktörü ─────────────────────
--
-- İki ayrı kusur, tek migration: ikisi de "kim yaptı / kim görebilir"
-- sorusunun cevabını kaybediyordu.

-- 1 ─ `gonderen` bir ajans kullanıcısının HANGİ ajansta olduğunu tutmuyordu.
--
-- Şimdiye kadar gerek olmamıştı: `app_onaylayabilir()` rol tabanlı ve tüm
-- ajans kullanıcıları aynı yetkiyi taşıyordu. Toplu rapor bunu kırdı —
-- "ajans yalnızca kendi illerini görsün" bir ROL kuralı değil, BÖLGE kuralı.
--
-- Nullable, çünkü:
--   yatirimci · misafir → ajansı yok
--   yonetici            → tüm bölgeler (null = sınırsız)
--   ajans               → dolu olmalı; boşsa rapor FAIL-CLOSED davranır ve
--                         hiçbir satır göstermez (yanlışlıkla hepsini
--                         göstermektense hiçbirini göstermek doğru).
--
-- RLS'e DOKUNULMUYOR. Bu kolon şu an yalnızca rapor kapsamını daraltıyor;
-- onay kuyruğunu ve belge yüklemeyi bölgeye bağlamak ayrı bir üründür ve
-- sessizce yapılmaz.
alter table gonderen add column ajans_kod text references ajans(kod);

comment on column gonderen.ajans_kod is
  'Ajans kullanıcısının bölgesi (NUTS-2). yonetici/yatirimci için null.';

-- 2 ─ KVKK silme talebinde denetim SİLİNEN KİŞİYİ aktör yazıyordu.
--
-- `aktor_ref = p_ref` yani kaydın anlamı "bu kişi kendi verisini sildi" idi.
-- Oysa silmeyi yönetici yürütüyor. Denetim izinin tek işi bu soruyu
-- cevaplamak; yanlış cevap veren bir iz, iz olmaktan çıkar.
--
-- `security definer` fonksiyon içinde de `app_ref()` çağıranın bağlamını
-- okur (SET LOCAL transaction kapsamında), yani aktör doğru gelir.
create or replace function kimlik_pseudonimlestir(p_ref uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update kimlik set
    eposta = null, ad_soyad = null, parola_hash = null,
    pseudonimlestirildi = true
  where gonderen_ref = p_ref;
  delete from oturum where gonderen_ref = p_ref;
  insert into denetim (aktor_ref, eylem, nesne_tip, nesne_id, detay)
  values (app_ref(), 'kimlik_pseudonimlestirildi', 'gonderen', p_ref::text,
          jsonb_build_object(
            'ozne', p_ref::text,
            'not', 'Öneri ve sıralama zinciri korundu; kişisel veri silindi.'));
end $$;

revoke all on function kimlik_pseudonimlestir(uuid) from public;
grant execute on function kimlik_pseudonimlestir(uuid) to ykh_app;

-- ── Dayanak eşiği yönetici ayarı ────────────────────────────────────────────
--
-- Eşik ağırlık setinde (`agirlik_seti.dayanak_esigi`) duruyordu ve değiştirmek
-- yeni bir set sürümü yayımlamayı gerektiriyordu. Eşik ise puanlayan MODELE
-- bağlı çıkıyor: aynı belgelerle bir model sekiz kriterin sekizini belgeye
-- bağlıyor (dayanak 83–95), bir başkası yalnızca gerçekten ilgili gördüğü
-- üç-dördünü (55–59). Model değişince eşiğin de ayarlanabilmesi gerekiyor.
--
-- Yönetici `/ayarlar`'dan `ayar.dayanak_esigi` yazar (0–100). Değer varsa BÜTÜN
-- ağırlık setlerinin eşiğinin yerine geçer; yoksa ya da geçersizse setin kendi
-- değeri kullanılır. Gizli katsayı değildir: ekranlar geçerli eşiği ve
-- kaynağını ("yönetici ayarı; ağırlık setindeki değer N") yazar, değişiklik
-- denetime düşer (`ayar_degistirildi`).
--
-- `security definer`: eşik herkes için AYNI olmalı. Ayar satırı kurum içi
-- olduğundan yatırımcı bağlamı onu okuyamaz ve kendi önerisinin sayfasında
-- farklı bir eşik görürdü. Fonksiyon yalnızca tek bir sayı döndürür.
create or replace function dayanak_esigi_gecerli(p_set integer) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select deger::integer from ayar
      where anahtar = 'dayanak_esigi' and deger ~ '^[0-9]{1,3}$' and deger::integer between 0 and 100),
    p_set)
$$;

revoke all on function dayanak_esigi_gecerli(integer) from public;
grant execute on function dayanak_esigi_gecerli(integer) to ykh_app;

-- Geri alma TÜRETİLMİŞ VERİYİ SİLER ve bunu sessizce yapmaz, burada yazar:
-- ulusal varsayılana bağlı dönemler ve o dönemlere bağlı öneriler kaldırılır.
-- Bu öneriler resmî tebliğ listesinden türetilmişti (`koken='mevcut'`), yani
-- `pnpm db:reset` ile yeniden üretilebilirler. Yatırımcı gönderimleri
-- (`koken='yeni'`) pilot dönemlerde durur ve etkilenmez.
delete from oneri where donem_id in (
  select d.id from donem d
  join agirlik_seti s on s.surum = d.agirlik_seti_surum
  where s.ajans_kod is null
);
delete from donem where agirlik_seti_surum in (select surum from agirlik_seti where ajans_kod is null);
delete from agirlik_seti where ajans_kod is null;
alter table agirlik_seti alter column ajans_kod set not null;

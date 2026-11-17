alter table kesif drop column if exists taranamayan;
delete from kanit_tarama where durum = 'reddedildi';
alter table kanit_tarama drop column if exists neden;
alter table kanit_tarama drop column if exists durum;

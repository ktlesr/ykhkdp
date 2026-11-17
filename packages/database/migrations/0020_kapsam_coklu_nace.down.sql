drop table if exists oneri_nace;
alter table degerlendirme drop constraint if exists degerlendirme_kapsam_notu;
alter table degerlendirme drop column if exists kapsam_notu;
alter table oneri drop constraint if exists oneri_kapsam_dizi;
alter table oneri drop column if exists kapsam;

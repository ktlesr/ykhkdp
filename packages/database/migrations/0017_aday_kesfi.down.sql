drop index if exists oneri_kesif_tekil;
alter table oneri drop constraint if exists oneri_kesif_izi;
alter table oneri drop column if exists kesif_kanit;
alter table oneri drop column if exists kesif_id;
drop table if exists kesif;
drop table if exists kanit;
drop table if exists kanit_tarama;
drop function if exists app_il_kapsaminda(text);

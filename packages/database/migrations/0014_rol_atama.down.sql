drop policy gonderen_guncelle on gonderen;

-- Açığı geri açar: herkes kendi rolünü değiştirebilir.
create policy gonderen_guncelle on gonderen for update
  using (ref = app_ref() or app_rol() = 'yonetici')
  with check (ref = app_ref() or app_rol() = 'yonetici');

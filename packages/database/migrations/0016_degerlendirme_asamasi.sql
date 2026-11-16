-- ── Değerlendirme aşaması: arka plan işi görünür olsun ───────────────────────
--
-- `degerlendiriliyor` durumu kuyruğun kendisi; ama kullanıcı yalnızca "deneme
-- 1/3" görüyordu ve işin hangi adımda olduğunu bilmiyordu. Aşama ayrı bir
-- kolon: durum makinesi DEĞİŞMEZ (dört durum aynen), bu yalnızca ilerleme
-- bilgisidir. Ayrı iş tablosu yok — ilke aynı (brief §4).
--
--   null         sırada, henüz alınmadı
--   alindi       numune kabul: öneri kuyruktan alındı
--   nace         NACE ataması (yalnızca kod girilmediyse)
--   belge        üst ölçekli belge paketi kuruluyor
--   model        sekiz kriterle puanlama
--   karsi_gorus  karşı görüş
--   kayit        alıntı doğrulama ve kayıt
--
-- Başarılı kayıtta null'a döner. Hata olursa kaldığı aşamada kalır: son_hata
-- ile birlikte "nerede durdu" sorusunu cevaplar.

alter table oneri
  add column asama text,
  add column asama_zamani timestamptz,
  add constraint oneri_asama_gecerli check (
    asama is null or asama in ('alindi', 'nace', 'belge', 'model', 'karsi_gorus', 'kayit')
  );

comment on column oneri.asama is 'Değerlendirme koşusunun bulunduğu adım; null = sırada ya da bitti.';

-- ── Belge kategorisi ve kaynak özeti ────────────────────────────────────────
--
-- Kapsam (il / ajans / ulusal) belgenin NEREYE ait olduğunu söyler; kategori
-- NEYİ anlattığını. Konu madenle ilgiliyse maden kaynağı, turizmle ilgiliyse
-- turizm kaynağı devreye girsin diye (bkz. retrieval `konuKategorileri`).
--
-- `kaynak_ozet`: dış kaynaktan (Türk Patent, MTA, TÜİK…) üretilen belgenin
-- içerik özeti (sha256). Periyodik denetim özeti karşılaştırır; yalnızca
-- değişen belge yeniden yazılır ve yalnızca onun parçaları yeniden taranır.

alter table belge
  add column kategori text not null default 'genel'
    check (kategori in ('genel', 'sanayi', 'dis_ticaret', 'maden_enerji', 'turizm',
                        'tarim', 'cografi_isaret', 'tesvik', 'istatistik')),
  add column kaynak_ozet text;

create index belge_kategori on belge (kategori, il_kod);

-- ── yakın kopya tespiti ──────────────────────────────────────────────────────
--
-- Bir ilde iki yatırımcı aynı konuyu ayrı ayrı önerebilir. Ajans 200 öneriyi
-- tek tek okuyup bunu fark etmek zorunda kalmasın: aynı (il, dönem) içinde
-- başlıkları trigram olarak benzeyen öneriler işaretlenir.
--
-- AI YOK. Bu deterministik bir metin ölçüsü; sonucu tekrarlanabilir ve
-- doğrulanabilir. Benzerlik bir karar değil, ajansın bakması gereken yeri
-- gösteren bir işaret — birleştirme veya ret kararını insan verir.

create extension if not exists pg_trgm;

-- Başlık üzerinden karşılaştırıyoruz, gerekçe üzerinden değil: gerekçeler uzun
-- ve serbest metin, benzerliği seyreltiyor. Aynı KONUYU iki kez önermek
-- ajansın görmesi gereken durumdur.
create index oneri_baslik_trgm on oneri using gin (baslik gin_trgm_ops);

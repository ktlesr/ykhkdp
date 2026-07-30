-- ── ajans kısa adı ───────────────────────────────────────────────────────────
--
-- `ajans.kod` NUTS-2 (İBBS-2) bölge kodudur ve öyle kalır: ağırlık seti sürümü
-- (`TR33-2027-v1`) ve `agirlik_seti.ajans_kod` buna bağlı. 26 kalkınma ajansı
-- 26 NUTS-2 bölgesine birebir denk düşer.
--
-- Ajansın günlük adı ise kısaltmasıdır (ZAFER, AHİKA, DOĞAKA). Kodun yerine
-- geçmez, ekranda kodun yanında görünür. Kısaltmalar Türkçe harf taşıdığı için
-- anahtar olarak kullanılmaz.

alter table ajans add column kisa_ad text;

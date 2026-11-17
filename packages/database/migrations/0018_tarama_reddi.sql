-- ── Taranamayan parça kaydı ─────────────────────────────────────────────────
--
-- Okunamayan bir parça bütün keşfi sonsuza dek kilitliyordu: "tarama
-- tamamlanmadan aday üretilmez" kuralı, her yeniden başlatmada aynı parçaya
-- takılıyordu (canlıda 922 parçanın 24'ü). Ret artık NEDENİYLE kayda geçer;
-- keşif kalan parçalarla tamamlanır ve eksik kapsamı ekranda AÇIKÇA yazar.
-- Reddedilen parça her keşifte bir kez daha denenir (geçici hata olabilir);
-- ön tarama onu atlar (maliyet döngüsü olmasın).

alter table kanit_tarama
  add column durum text not null default 'tamam' check (durum in ('tamam', 'reddedildi')),
  add column neden text;

alter table kesif add column taranamayan int not null default 0;

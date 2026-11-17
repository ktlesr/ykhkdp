/**
 * Kanıt taramasına GİRMEYECEK parça: kaynakça, şekil/tablo listesi, künye.
 *
 * Bu parçalardan yatırım kanıtı çıkmaz; modele göndermek yalnızca maliyettir.
 * Kural TEMKİNLİDİR: emin olunmayan parça taranır (yanlış "içerik değil"
 * kararı bir kanıtı kaçırır, yanlış "içerik" kararı birkaç token harcar).
 * İstatistik tabloları İÇERİKTİR ve taranır.
 *
 * Dönen değer neden metnidir (`kanit_tarama.neden`); null = içerik, tara.
 */
export function icerikDegil(metin: string): string | null {
  const paragraflar = metin.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!paragraflar.length) return "boş parça";
  const oran = (kosul: (p: string) => boolean) => paragraflar.filter(kosul).length / paragraflar.length;

  // Kaynakça: paragrafların çoğu bir yayın künyesi — yıl + (URL | erişim | yayınevi | sayfa aralığı).
  const kunye = (p: string) =>
    /\(?(19|20)\d{2}[a-z]?\)?/.test(p) &&
    /(https?:\/\/|www\.|Erişim|erişim tarihi|Retrieved|Yayın(ları|evi)|Press|Journal|Dergisi|ss?\.\s?\d|pp?\.\s?\d|Cilt|Vol\.|doi)/i.test(p) &&
    p.length < 500;
  if (paragraflar.length >= 4 && oran(kunye) >= 0.7) return "kaynakça";

  // Şekil / tablo / grafik listesi: kısa satırlar, hepsi "Tablo 3." ile başlıyor.
  const listeSatiri = (p: string) => /^(Tablo|Şekil|Grafik|Harita|Resim|Fotoğraf|Çizelge)\s*\d+/i.test(p) && p.length < 220 && !/\|/.test(p);
  if (paragraflar.length >= 5 && oran(listeSatiri) >= 0.8) return "şekil/tablo listesi";

  // Künye / iletişim sayfası: ISBN, telefon, faks, e-posta yoğun ve metin kısa.
  const iletisim = (metin.match(/ISBN|Tel\s*:|Faks\s*:|Fax\s*:|E-?posta\s*:|@[\w.-]+\.\w+|Baskı\s*:|Tasarım\s*:|Matbaa/gi) ?? []).length;
  if (iletisim >= 4 && metin.length < 1500) return "künye/iletişim";

  return null;
}

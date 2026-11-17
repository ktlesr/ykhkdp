# Kütüphane belgeleri

Kalkınma Kütüphanesi'nden (kalkinmakutuphanesi.gov.tr) alınıp Markdown'a
çevrilmiş il ve ajans raporları. Kamuya açık belgelerdir.

```
docs/kutuphane/{ajansKod}/{ilKod | bolge}/{belgeNo}-{başlık}.md
manifest.json   yüklenecek belgeler: dosya, ad, tür, yıl, ajansKod, ilKod, kaynak
rapor.json      ne yüklendi, ne atlandı ve NEDEN
```

- **Kapsam sitenin kendi verisinden gelir** (etiket + başlık), tahmin değil,
  ve metinle sınanır: tek ile etiketli ya da başlığı tek ili adlandıran belge
  o ilin altına; bölge başlıklı ("TR71 Düzey 2 Bölgesi…"), birden çok ile
  etiketli ya da metninde bölgenin başka ili de yoğun geçen belge `bolge`
  altına. Tek bir bölgeye bağlanamayan belge (genel müdürlük, bölge kalkınma
  idaresi) alınmaz.
- **Elenenler:** bozuk kodlamalı, Türkçe olmayan, çoğu tablo olan, taranmış
  ve başka belgenin kopyası/eski sürümü olan belgeler — hepsi `rapor.json`da.
- **Yalnızca 2019 ve sonrası.** Eski planlar ve istatistikler güncel olgu gibi
  alıntılanmasın diye; atlananların listesi `rapor.json` içinde ("ikinci dalga").
- **Kalite kapısı:** `pnpm belge:dogrula`. Geçemeyen belge alınmaz.
- **OCR yok.** Metin katmanı olmayan (taranmış) PDF alınmaz: OCR hatası
  belgede olmayan alıntı üretirdi.
- **Yükleme:** `pnpm db:kur` (her dağıtımda) `kutuphaneYukle()` ile yalnızca
  sistemde OLMAYAN belgeleri ekler; var olana dokunmaz — kanıt tarama önbelleği
  dağıtımda silinmez. `/belgeler`den silinen belge sonraki dağıtımda geri gelmez.

Yeniden üretmek: `python tools/kutuphane/envanter.py tools/kutuphane/envanter.json`
sonra `python tools/kutuphane/donustur.py` (PyMuPDF gerekir; PDF'ler depoya girmez).

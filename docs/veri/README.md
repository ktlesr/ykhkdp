# Veri belgeleri

Dış kaynaklardan üretilmiş, il başına birer belge. Kamuya açık verilerdir.
Sıradan belge gibi yüklenir ve taranır; `kategori` ile etiketlidir.

```
docs/veri/{kaynak}/{ilKod}.md
manifest.json   dosya, ad, tür, yıl, ajansKod, ilKod, kategori, kaynak
```

| Klasör | Kaynak | Kategori | Yeniden üretmek |
|---|---|---|---|
| `mta/` | MTA İl Maden Potansiyelleri (PDF) | `maden_enerji` | `python tools/veri/mta.py` |
| `dis-ticaret/` | TÜİK dış ticaret panosu, il × yıl × fasıl ihracat | `dis_ticaret` | `node tools/veri/dis-ticaret.ts [localdocs yolu]` |
| `turizm/` | KTB Turizm Belgeli Tesis İstatistikleri (yıllık bülten) | `turizm` | `python tools/veri/turizm.py <yıl> <bülten.xlsx ya da adresi>` |
| seçilir | il sütunlu herhangi bir Excel (teşvik belgeleri…) | seçilir | `python tools/veri/tablo.py <dosya> --klasor … --kategori … --ad …` |

Coğrafi işaretler (Türk Patent) burada DEĞİL: işleyici günde bir kendisi çeker
ve doğrudan veritabanına yazar (`packages/database/src/kaynak.ts`).

- **Tablo değil cümle.** Her kayıt kendi başına okunur bir cümledir; kanıt
  taraması pasajı birebir keser ve başlıksız tablo satırı kanıt olamaz.
- **Sayılar kaynağın yayımladığı hâliyledir.** Hesaplanan değerler açıktır:
  ihracatta il toplamı ve fasıl payı, turizmde ilçe toplamı.
- **Yükleme:** `pnpm db:kur` (her dağıtımda) dosyanın içerik özetini belgedeki
  `kaynak_ozet` ile karşılaştırır; yalnızca değişen belge yeniden yazılır ve
  yalnızca onun parçaları yeniden taranır. `/belgeler`den silinen geri gelmez.
- Her betik yalnızca kendi klasörünün manifest girdilerini değiştirir.

Yatırım teşvik belgeleri örneği (Excel geldiğinde):

```
python tools/veri/tablo.py tesvik.xlsx --klasor tesvik --kategori tesvik \
  --ad "Yatırım Teşvik Belgeleri" --yil 2026 --il-sutunu "İl" \
  --grupla "Sektör" --sutunlar "Sabit Yatırım (TL),İstihdam" \
  --kaynak "Sanayi ve Teknoloji Bakanlığı yatırım teşvik belgeleri"
```

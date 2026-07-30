# Çalışma protokolü

## Akış

**tartış → plan → onay → kod → göster → commit**

"Göster" adımı gerçek çıktıdır: test sonucu, çalışan sayfa, sorgu çıktısı.
"Yaptım" demek yeterli değil.

## Değişmez kurallar

1. **AI puanı doğrulanmamıştır.** Ajans onayı olmadan hiçbir öneri sıralamaya girmez.
2. **AI ham puanı değişmez.** Ajans düzeltmesi ayrı kolona yazılır; provenance korunur.
3. **Dayanak eşiği sıralamayı ezer.** Belgeye bağlanamayan aday slot dolduramaz.
4. **Boş slot hata değildir.**
5. **Gizli katsayı yok;** devamlılık payı ve yerellik payı ekranda yazıyla ilan edilir.
6. **"Neden burada?" en büyük paydır** — yerellik grubu en az %40 ve her zaman en büyük.
7. **Reddedilen AI çıktısı kaydedilmez;** yalnızca denetime yazılır.
8. Gradyan, glow, gölge, cam efekti, emoji, `border-radius > 3px` yasak.
9. Arayüz dili Türkçe, sade fiil, kısaltma yok.
10. **Ekran eklemeden önce sor.** Ürün beş ekran; altıncısı gerekçe ister.

## Kodda hiçbir zaman

- İl, ajans veya bölge sabitlenmez. `(ajans, dönem)` anahtarlı sürümlü kayıt.
- Slot sayısı sabitlenmez; `agirlik_seti.slot_sayisi`.
- `latest` model alias'ı kullanılmaz.
- RLS politikası olmayan tablo eklenmez.
- NACE kodu `nace` tablosuna bakılmadan yazılmaz (foreign key zorlar).

## Debug protokolü

1. **Yeniden üret.** Testle üret; olmuyorsa en küçük tekrar üreten girdiyi bul.
2. **Katmanı belirle.** SQL'de mi, RLS'te mi, sorguda mı, sayfada mı?
   `docker exec ykhkdp-postgres psql -U ykh_app -d ykhkdp` ile aynı sorguyu elle çalıştır.
3. **Önce testi yaz.** Hatayı gösteren assert olmadan düzeltme yapma.
4. **Kök nedeni düzelt.** `try/catch` ile yutma.
5. **Regresyon testini bırak.**

Bu projede yaşanmış tuzaklar:

- `new row violates row-level security policy` → çoğunlukla `RETURNING` cümlesi
  SELECT politikasına takılıyor. Satır yazılabiliyor ama okunamıyor. Kayıt gibi
  akışlarda `security definer` fonksiyon kullan (`hesap_ac()`).
- `cached plan must not change result type` → migration sonrası hazırlanmış ifade.
  Her iki havuzda `prepare: false`.
- **postgres.js `int8`'i string döndürür.** Sayı karşılaştırması yapan yerlerde
  `Number(...)` ile dönüştür; `belge.id` yüzünden alıntı doğrulaması sessizce
  başarısız olmuştu.
- **`plainto_tsquery` terimleri AND'ler.** Uzun bir öneri başlığında hiçbir kayıt
  eşleşmez; `herhangiBiri()` ile OR'lanmış `websearch_to_tsquery` kullan.
- Kamu görünümü farklı sıralama gösteriyorsa RLS bir puanlama girdisini gizliyordur.
  Toplamı `security definer` ile aç, kırılımı kapalı tut (`oneri_taban_puani`).

## Test komutları

```bash
docker compose up -d                    # Postgres 17 · :5470
pnpm db:reset                           # şema + RLS + NACE + seed
pnpm -r --workspace-concurrency=1 test  # tüm paketler (paralel çalıştırma DB'yi çakıştırır)
pnpm dev                                # :3000
pnpm worker                             # AI değerlendirme döngüsü
```

`pnpm audit --prod` temiz olmadan sürüm çıkılmaz.

## AI komutları

```bash
pnpm ai:test                            # bağlantı sınaması, tek çağrı, DB'ye yazmaz
pnpm ai:eval                            # eval kümesi, örnek × 3 koşu medyanı
YKH_EVAL_TEKRAR=5 pnpm ai:eval          # gürültü şüphesinde tekrarı artır
pnpm db:belgeler                        # docs/ altındaki plan belgelerini yükler
pnpm belge:dogrula [dosya…]             # YÜKLEMEDEN ÖNCE metin kalitesini ölçer
```

**Prompt veya şema değiştirdiysen `pnpm ai:eval` çalıştır.** Birim testler şema ve
doğrulama katmanını tutar, çıktı kalitesini tutmaz. `prompt_surum` her değişiklikte
artar — provenance sürümle taşınır, testler de sürümü kontrol eder.

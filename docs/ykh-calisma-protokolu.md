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
   **Tek istisna tanıtım hero'su** (`.hero-*`) ve kapsamı `tasarim.test.ts`
   ile tutulur; ürünün geri kalanında yasak sürüyor.
9. Arayüz dili Türkçe, sade fiil, kısaltma yok.
10. **Ekran eklemeden önce sor.** Tanıtım sayfası (`/`) ve `/iller` ayrımı
    kullanıcı onayıyla eklendi; öneri sihirbazı yeni ekran DEĞİL, `/oneri`
    içinde dört adım. Yeni bir route gerekçe ister. `/onerilerim` gerekçesi:
    öneriler sahibi ve ajans dışında kapatıldı, yatırımcının kendi
    önerilerine ulaşacağı başka yer kalmadı.
11. **Onay yayın değildir.** Onaylanmış öneri de sahibi ve ajans dışında
    görünmez; kamuya açık olan Bakanlığın resmî listesidir.
12. **Yatırımcının giriş noktası sihirbazdır.** `/iller` ve `/il/[il]` ajans
    ekranıdır; yetkisiz kullanıcı `/oneri`'ye yönlendirilir. Yetkisiz
    yönlendirmeyi `/iller`'e yapmak sonsuz sekme üretir —
    `lib/erisim.test.ts` bunu ve kapıların varlığını ölçer.
13. **Tasarımın başvuru referansı `design_handoff_ykh_kdp/README.md`.**
    §1 değişmez kurallar, §2 token ve animasyon listesi, §4 epistemik gramer
    bağlayıcıdır. Uygulanmış hâli ve bu ürüne özgü kararlar:
    `apps/web/DESIGN.md`. Makineyle denetlenen kısmı `lib/tasarim.test.ts`.
14. **Koyu panel token kullanmaz.** `bg-ink` koyu temada açık renge döner;
    matbu künye alanları `.panel-koyu` ile her iki temada koyu kalır. Sabit
    açık renk metin yalnızca o kapsamda meşrudur.
15. **CSS'te bileşen sınıfı içindeki eleman seçicisi `:where()` ile sarılır.**
    `.sinif eleman` (0,1,1) yardımcı sınıfı (0,1,0) ezer ve sessiz kırılma
    üretir; ölçüldü: iki birincil düğme 1.09:1 kontrastla görünmez kaldı.

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

Testlerde **ret bir kusur değil**: model ezberinden alıntı yaparsa doğrulayıcı
reddeder, öneri `degerlendiriliyor` kalır, üretim üç kez dener. Reddi imkânsız
sayan bir assert modele bağlı olarak rastgele kırılır — üretimle aynı yeniden
deneme mantığını kur.

**Prompt veya şema değiştirdiysen `pnpm ai:eval` çalıştır.** Birim testler şema ve
doğrulama katmanını tutar, çıktı kalitesini tutmaz. `prompt_surum` her değişiklikte
artar — provenance sürümle taşınır, testler de sürümü kontrol eder.

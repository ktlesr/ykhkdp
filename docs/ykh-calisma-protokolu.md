# Çalışma protokolü

## Akış

**tartış → plan → onay → kod → göster → commit**

Kod yazmadan önce dosya planı çıkar ve onaylat. Plan onaylanmadan dosya açma.
"Göster" adımı gerçek çıktıdır: test sonucu, çalışan sayfa, sorgu çıktısı —
"yaptım" demek yeterli değil.

## Değişmez kurallar (ihlal edilirse ürün itibar kaybeder)

1. Dört ölçüt asla birleştirilmez. Tek bir "genel skor" üretmek yasak.
2. Üç epistemik durum her yerde aynı görünür; renk tek başına taşıyıcı olamaz.
3. Puanlamaya yalnızca uzman onaylı kanıt girer.
4. Gizli katsayı yok; devamlılık payı ekranda ve raporda yazıyla ilan edilir.
5. Boş slot bir hata değildir.
6. Destek sayısı puan girdisi değildir.
7. Çalışma alanı ile kilitli karar sürümü asla karışmaz.
8. Gradyan, glow, gölge, cam efekti, emoji, `border-radius > 3px` yasak.
9. Arayüz dili Türkçe, sade fiil, kısaltma yok.
10. Hareket yalnızca durum değişimini anlaşılır kılmak için.

## Kodda hiçbir zaman

- İl, ajans veya bölge sabitlenmez. `(ajans, dönem)` anahtarlı sürümlü kayıt.
- Slot sayısı sabitlenmez; `agirlik_seti.slot_sayisi`.
- Destek sayısı puanlama zincirine bağlanmaz. `stratejikPuan(puanlar, set)`
  imzası bunu derleyici düzeyinde engeller.
- `latest` model alias'ı kullanılmaz.
- RLS politikası olmayan tablo eklenmez.

## Debug protokolü

1. **Yeniden üret.** Testle üret; olmuyorsa en küçük tekrar üreten girdiyi bul.
2. **Katmanı belirle.** Hata SQL'de mi, RLS'te mi, sorguda mı, sayfada mı?
   `docker exec ykhkdp-postgres psql -U ykh_app` ile aynı sorguyu elle çalıştır:
   RLS mi engelliyor, sorgu mu yanlış — bu tek adım çoğu vakayı ayırır.
3. **Önce testi yaz.** Hatayı gösteren assert olmadan düzeltme yapma.
4. **Kök nedeni düzelt.** Belirtiyi susturma; `try/catch` ile yutma.
5. **Regresyon testini bırak.**

Sık karşılaşılanlar:

- `new row violates row-level security policy` → çoğunlukla `RETURNING`
  cümlesi SELECT politikasına takılıyor. Satır yazılabiliyor ama okunamıyor.
- `cached plan must not change result type` → migration sonrası hazırlanmış
  ifade. `prepare: false` ile kapatıldı; yine görülürse havuzu yenile.
- Kamu görünümü uzman görünümünden farklı sıralama gösteriyorsa, RLS bir
  puanlama girdisini gizliyordur. Toplamı `security definer` ile aç, kırılımı kapalı tut.

## Test komutları

```bash
docker compose up -d                    # Postgres 17 · :5470
pnpm -r --filter '@ykh/*' migrate       # şema
pnpm --filter @ykh/database reset       # şema + seed sıfırdan
pnpm -r test                            # tüm paketler
pnpm --filter @ykh/web dev              # :3000
pnpm --filter @ykh/worker start         # iş kuyruğu
```

## PR kuralı

Faz 3'ten itibaren her PR'da `/security-review` çalıştır. `pnpm audit --prod`
temiz olmadan birleştirme yapılmaz.

## İki ajan aynı pakete aynı anda dokunmaz

Paket bazlı sahiplik, ayrı branch, birleşme noktası yalnızca
`packages/domain` tip sözleşmeleri.

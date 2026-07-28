# YKH-KDP

**Yatırım Konusu Hazırlama — Karar Destek Platformu**

Yerel Kalkınma Hamlesi kapsamında her il için dört yatırım konusu belirleniyor.
Bu platform tek bir soruya cevap veriyor: **bu il için hangi konular korunmalı,
hangileri değişmeli, boşalan slotlara hangi yeni konular girmeli?**

Kullanıcılar öneri veriyor; platform önerileri kanıta bağlıyor, mevcut konularla
aynı ölçekte puanlıyor ve gerekçeli bir karar destek çıktısı üretiyor. **Nihai
kararı il değerlendirme kurulu veriyor.**

Platform resmî Portal veya E-TUYS'un yerine geçmez; yatırımcı başvuruları
başlamadan önceki politika hazırlama katmanıdır.

## Ürünün doğruluk iddiası

Bu ürün, birleştirilmiş bir "genel skor" üretmeyi reddetmesiyle ayrışır:

- **Stratejik puan** (0–100) ile **kanıt yeterliliği** (0–100) asla birleşmez.
  Puanı yüksek, kanıtı zayıf konu "güçlü öneri" değil, "yüksek potansiyel —
  ek kanıt gerekli"dir.
- **Kanıt eşiği sıralamayı ezer.** Yüksek puanlı ama kanıtsız aday slot dolduramaz.
- **Boş slot bir hata değildir.** "Bu slot için yeterli kanıtlı aday yok"
  geçerli ve saygın bir sonuçtur.
- **Sabit koruma tabanı yoktur.** Dört konunun tamamı korunabilir, tamamı değişebilir.
- **Puanlamaya yalnızca uzman onaylı kanıt girer.** AI bulgusu ekranda görünür,
  puana katılmaz.
- **Destek sayısı puan girdisi değildir.** İlgi sinyalidir.
- **Gizli katsayı yoktur.** Devamlılık payı ekranda ve raporda yazıyla ilan edilir.

## Hızlı başlangıç

```bash
pnpm install
docker compose up -d          # Postgres 17 · localhost:5470
pnpm db:reset                 # şema + RLS + demo verisi
pnpm dev                      # http://localhost:3000
pnpm worker                   # ayrı terminal — iş kuyruğu (isteğe bağlı)
```

Demo hesapları (parola `ykh-demo-2027`):

| E-posta | Rol | Ne yapabilir |
|---|---|---|
| `uzman@ykh.local` | ajans uzmanı | kanıt doğrular, kriter puanı yazar |
| `sektor@ykh.local` | sektör uzmanı | aynı yetkiler |
| `kurul@ykh.local` | kurul üyesi | kararı kilitler |
| `birey@ykh.local` | birey | öneri verir, kanıt ekler, destekler |
| `denetci@ykh.local` | denetçi | denetim izini ve gizli sınıfı görür |

## Ekranlar

| Yol | Blok | İçerik |
|---|---|---|
| `/iller` | 0 | il ve dönem seçimi |
| `/il/[il]/donem/[donem]` | 1 | karar ekranı — dört slot, sıralama, kilit |
| `/il/[il]/donem/[donem]/konu/[id]` | 2 | iddia-kanıt matrisi, kriter kırılımı |
| `/il/[il]/donem/[donem]/oneri` | 3 | öneri girişi (mobil öncelikli, iki kademe) |
| `/oneri/[id]` | 3.2 | dosya güçlendirme, kanıt kartı, destek |
| `/il/[il]/donem/[donem]/inceleme` | 4 | uzman kanıt doğrulama kuyruğu + triyaj |
| `/kamu/[il]/[donem]` | 7 | kamuya açık yayım (anonim bağlam) |
| `/kamu/[il]/[donem]/rapor` | — | yazdırılabilir karar raporu |
| `/panom` | 7 | kişisel pano |

`?pay=0` her karar ekranında senaryo denemesi açar; sunucu yeniden hesaplar ve
sayfa bunun **kaydedilmediğini** açıkça söyler.

## Mimari

```
apps/web                      Next.js 16 · App Router · sunucu bileşenleri
apps/worker                   iş kuyruğu — AI analizi, rapor üretimi
packages/domain               durum makineleri, roller, karar modeli tipleri
packages/scoring              8 kriter, sürümlü ağırlık, pay, eşik, slot doldurma
packages/database             SQL şema, RLS, migration, veri erişimi
packages/evidence-validation  evidence_id / span / yetki doğrulama · fail-closed
packages/ai-gateway           Zod strict, prompt registry, model istemcisi, eval
packages/retrieval            tsvector arama, kaynak paketi
packages/reporting            yazdırmaya hazır karar raporu
packages/observability        JSON log, maskeleme, maliyet kaydı
```

Sıralama **sunucuda** hesaplanır. İstemcide algoritma kopyası yoktur.

## Güvenlik

Uygulama `ykh_app` rolüyle bağlanır — superuser değil, tablo sahibi değil,
`BYPASSRLS` yok. Her tabloda `FORCE ROW LEVEL SECURITY` açıktır ve her istek
`SET LOCAL app.rol / app.gonderen_ref` ile bağlanır. Ayrıntı:
[docs/ykh-guvenlik.md](docs/ykh-guvenlik.md).

Kişisel veri ayrı `kimlik` tablosundadır; öneriler değişmez `gonderen.ref`
anahtarına bağlanır. Silme talebinde kimlik pseudonimleştirilir, karar zinciri
bozulmaz. Denetim tablosu append-only'dir (RLS + trigger, iki katman).

## Test

```bash
pnpm test          # tüm paketler — 82 test
pnpm typecheck
pnpm audit --prod  # temiz olmadan sürüm çıkılmaz
```

Kapsam: karar modeli, slot doldurma uç durumları, RLS'in gerçekten uygulandığı,
append-only denetim, migration geri alma, AI eval seti (kaynaksız sayı / sahte
kaynak), ve kayıt→öneri→kanıt→doğrulama→aday→kilit→rapor uçtan uca akışı.

## Bağlam dosyaları

- [docs/ykh-brief.md](docs/ykh-brief.md) — ürün brifi (tek doğruluk kaynağı)
- [docs/ykh-alan-sozlugu.md](docs/ykh-alan-sozlugu.md) — terim sözlüğü
- [docs/ykh-guvenlik.md](docs/ykh-guvenlik.md) — RLS, veri sınıfları, maskeleme
- [docs/ykh-calisma-protokolu.md](docs/ykh-calisma-protokolu.md) — çalışma ve debug protokolü
- [design_handoff_ykh_kdp/README.md](design_handoff_ykh_kdp/README.md) — tasarım devri

## Bilinen sınırlar

- **AI**: `OPENAI_API_KEY` yoksa çevrimdışı deterministik istemci çalışır.
  Doğrulama zinciri her iki modda da aynıdır; çevrimdışı mod hiçbir kontrolü gevşetmez.
- **E-posta doğrulama**: SMTP bağlı değil. Geliştirmede hesap doğrulanmış açılır.
- **Dosya yükleme**: kanıt künyesi ve URL destekleniyor; S3/MinIO bağlanmadı.
- **Rapor**: yazdırmaya hazır HTML. `.docx`/`.xlsx` üretimi yok.
- **Blok 5** (senaryo/duyarlılık ekranı) ve **Blok 6** (kurul çalışma alanı tam
  ekranı) arayüz olarak yok; motoru `packages/scoring` içinde hazır ve testli.

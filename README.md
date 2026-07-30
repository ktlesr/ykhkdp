# YKH

**Yerel Kalkınma Hamlesi — yatırım konusu önerileri**

Her il için dört yatırım konusu belirleniyor. Bu platform tek bir akışı yürütür:

```
Yatırımcı öneri verir  →  AI puanlar  →  Ajans onaylar  →  İl sıralamasına girer
```

Yatırımcı yatırım konusu başlığını ve **neden bu ilde/ilçede** yapılması gerektiğini
yazar. NACE kodunu biliyorsa girer, bilmiyorsa yapay zekâ atar. Yapay zekâ öneriyi
üst ölçekli belgelere (bölge planı, kalkınma planı, OVP, il raporları) ve sekiz
kritere göre puanlar. Puan **doğrulanmamış bir taslaktır**; ajans onaylamadan hiçbir
öneri sıralamaya girmez.

## Ürünün doğruluk iddiası

- **En büyük payı "neden burada?" taşır.** Sekiz kriterin yerellik grubu (yerel
  kaynak, mevcut değer zinciri, yerel arazi-enerji-işgücü donanımı) ağırlığın
  **%44'ü**dür ve hiçbir kalibrasyon bunu %40'ın altına indiremez. Aynı konu başka
  bir ilde de aynı şekilde yapılabiliyorsa gerekçesi zayıftır.
- **AI karar vermez.** Puan üretir, ajans onaylar. Onay geri alınabilir.
- **Dayanak eşiği sıralamayı ezer.** Üst ölçekli belgelere bağlanamayan aday, puanı
  yüksek olsa da slot dolduramaz. Kaynağı belirsiz bir sayı dört konuyu seçemez.
- **Boş slot hata değildir.** "Yeterince gerekçelendirilebilir aday yok" geçerli sonuçtur.
- **Alıntı uydurulamaz.** Belgede birebir geçmeyen alıntı tüm değerlendirmeyi reddettirir.
- **AI ham puanı değişmez.** Ajans düzeltmesi ayrı kolona yazılır; "bu sayıyı kim
  koydu" her zaman cevaplanabilir.
- **Gizli katsayı yok.** Devamlılık payı ve yerellik payı ekranda yazıyla ilan edilir.

## Hızlı başlangıç

```bash
pnpm install
cp .env.example .env     # OPENAI_API_KEY satırını doldurun (boş da çalışır)
docker compose up -d     # Postgres 17 · localhost:5470
pnpm db:reset            # şema + RLS + 3190 NACE kodu + demo verisi
pnpm ai:test             # AI bağlantısını sına — hiçbir şey yazmaz
pnpm dev                 # http://localhost:3000
pnpm worker              # ayrı terminal — AI değerlendirme döngüsü
```

Kök dizindeki tek `.env` dosyasını hem web hem worker okur (`--env-file-if-exists`).
`pnpm ai:test` gerçek bir çağrı yapıp zincirin her katmanını ayrı ayrı raporlar:
model erişimi → şema → alıntı doğrulama → dayanak puanı.

Demo hesapları (parola `ykh-demo-2027`):

| E-posta | Rol | Ne yapar |
|---|---|---|
| `yatirimci@ykh.local` | yatırımcı | öneri verir |
| `ajans@ykh.local` | ajans | onaylar, puanı/NACE'yi düzeltir, belge yükler |
| `yonetici@ykh.local` | yönetici | ajansın her şeyi + kişisel veri |

## Ekranlar

| Yol | Kim | Ne |
|---|---|---|
| `/` | herkes | il listesi |
| `/oneri` | yatırımcı | beş alanlı öneri formu |
| `/il/[il]` | herkes | il sıralaması, slotlar, boş slot gerekçesi |
| `/oneri/[id]` | herkes | AI bu puanı neye dayanarak verdi |
| `/onay` | ajans | onay kuyruğu |
| `/belgeler` | ajans | üst ölçekli belge yükleme |

## Mimari

```
apps/web                      Next.js 16 · App Router · sunucu bileşenleri
apps/worker                   AI değerlendirme döngüsü (kuyruk tablosu yok)
packages/domain               roller, öneri durum makinesi, karar modeli tipleri
packages/scoring              8 kriter, sürümlü ağırlık, pay, dayanak eşiği, slot doldurma
packages/database             şema, RLS, migration, NACE yükleme, veri erişimi
packages/evidence-validation  alıntı/sayı doğrulama, dayanak puanı — fail-closed
packages/ai-gateway           Zod strict, prompt registry, model istemcisi, eval seti
packages/retrieval            belge paketi, NACE aday listesi
packages/observability        JSON log, maskeleme, maliyet kaydı
```

Sıralama **sunucuda** hesaplanır; istemcide algoritma kopyası yoktur.
Redis, S3, pgvector, PostGIS yok.

## Güvenlik

Uygulama `ykh_app` rolüyle bağlanır — superuser değil, tablo sahibi değil,
`BYPASSRLS` yok. 13 tablonun hepsinde `FORCE ROW LEVEL SECURITY` açık, her istek
`SET LOCAL app.rol / app.gonderen_ref` ile bağlanıyor. Ayrıntı:
[docs/ykh-guvenlik.md](docs/ykh-guvenlik.md).

Kişisel veri ayrı `kimlik` tablosunda; öneriler değişmez `gonderen.ref` anahtarına
bağlı. Silme talebinde kimlik pseudonimleşir, sıralama zinciri bozulmaz. Denetim
tablosu append-only (RLS + trigger).

## Test

```bash
pnpm -r --workspace-concurrency=1 test   # 91 test
pnpm typecheck
pnpm audit --prod
```

Kapsam: karar modeli ve slot uç durumları, yerellik tabanı, RLS'in gerçekten
uygulandığı, append-only denetim, veritabanı iş kuralları, migration geri alma,
AI eval seti (kaynaksız sayı / uydurulmuş alıntı / listede olmayan NACE), ve
kayıt→öneri→AI puanı→onay→sıralama uçtan uca akışı.

## Bağlam dosyaları

- [docs/ykh-brief.md](docs/ykh-brief.md) — ürün brifi (tek doğruluk kaynağı)
- [docs/ykh-alan-sozlugu.md](docs/ykh-alan-sozlugu.md) — terim sözlüğü
- [docs/ykh-guvenlik.md](docs/ykh-guvenlik.md) — RLS, veri sınıfları, maskeleme
- [docs/ykh-calisma-protokolu.md](docs/ykh-calisma-protokolu.md) — çalışma ve debug protokolü

`design_handoff_ykh_kdp/` tarihsel referans: token seti ve epistemik gramer geçerli,
ama oradaki ekranlar (kanıt bandı, uzman kuyruğu, kurul kilidi) bu üründe yok.

## Bilinen sınırlar

- `OPENAI_API_KEY` yoksa çevrimdışı deterministik istemci çalışır: belgelerden
  birebir alıntı çıkarır ama puanları ve NACE eşleşmesini kaba üretir. Doğrulama
  zinciri her iki modda aynıdır.
- Belge yükleme `.txt`/`.md` veya metin yapıştırma. PDF/docx ayrıştırıcı yok.
- E-posta doğrulama SMTP'ye bağlı değil.
- Rapor/Excel çıktısı yok.

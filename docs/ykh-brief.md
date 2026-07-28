# Claude Code Brief — YKH-KDP

> Bu dosya projenin **tek doğruluk kaynağı**. Çerçeve planı docx'i ile çeliştiği her yerde bu dosya geçerlidir.
> `docs/ykh-brief.md` olarak repoya koy ve `CLAUDE.md` içinden `@import` et.

---

## 1. Ürün tanımı

YKH-KDP, Türkiye'de kalkınma ajansları ve yerel paydaşlar için bir karar destek platformudur.

Yerel Kalkınma Hamlesi kapsamında her il için dört yatırım konusu belirleniyor ve bu liste yılda bir güncellenebiliyor. Platform tek bir soruya cevap veriyor: **bu il için hangi konular korunmalı, hangileri değişmeli, boşalan slotlara hangi yeni konular girmeli?**

Kullanıcılar yatırım konusu önerilerini gerekçeleriyle birlikte giriyor. Platform bu önerileri kanıta bağlıyor, mevcut konularla aynı ölçekte puanlıyor ve gerekçeli bir karar destek çıktısı üretiyor. Nihai kararı il değerlendirme kurulu veriyor.

Platform resmî Portal veya E-TUYS'un yerine geçmez; yatırımcı başvuruları başlamadan önceki politika hazırlama katmanıdır.

## 2. Karar modeli (ajanların uydurmaması gereken çekirdek)

```
Bir (il, dönem) için:

  adaylar = mevcut_konular ∪ yeni_öneriler

  her aday, aynı 8 kriterle ve aynı ağırlık setiyle puanlanır
  mevcut konulara, tanımlıysa, açık ve sürümlü bir devamlılık payı eklenir

  sıralama = adaylar puan azalan

  slot_doldurma:
    sıralamada yukarıdan aşağı git
    aday.kanıt_yeterliliği >= eşik ise slotu doldur
    değilse adayı "koşullu — ek kanıt gerekli" işaretle, slotu atlama sayma
    dört slot dolana veya aday bitene kadar devam et

  sonuç_etiketi:
    mevcut konu ilk dörtte  → KORUNUYOR
    mevcut konu ilk dört dışı → ÇIKIYOR
    yeni öneri ilk dörtte    → EKLENİYOR
    eşiği geçemeyen aday     → KOŞULLU
    doldurulamayan slot      → BOŞ (yeterli kanıtlı aday yok)
```

Değişmez kurallar:

- **Sabit koruma tabanı yoktur.** Dört konunun tamamı korunabilir, tamamı değişebilir. Sıralama söyler.
- **Mevcut konular her dönem yeniden puanlanır.** Aksi hâlde "korunmalı mı" sorusu cevaplanamaz.
- **Kanıt eşiği sıralamayı ezer.** Yüksek puanlı ama kanıtsız aday slot dolduramaz.
- **Devamlılık payı gizli katsayı değildir.** Sürümlü parametredir, çıktıda ve raporda açıkça yazar.
- **Uç durumlar işaretlenir.** "Tamamı değişiyor" ve "hiçbiri değişmiyor" ayrıca vurgulanır ve kuruldan gerekçe ister.
- **Destek sayısı puana dönüşmez.** Hiçbir kod yolu destek/öneri sayısını skora bağlamaz.

## 3. AI'nin sınırları

AI bir **kanıt analiz motorudur**, karar verici değil.

Yapar: öneriyi yapılandırma, atomik iddia çıkarma, kanıt eşleştirme, plan uyumu önerisi, ekosistem analizi, mükerrerlik önerisi, eksik veri ve çelişki tespiti, doğrulanmış bulgulardan gerekçe metni.

Yapmaz: kaynağı olmayan sayı/kapasite/pazar üretmek, kriter puanı veya toplam sıralama hesaplamak, dört konuyu seçmek, belgede olmayan plan hedefi uydurmak, yetkisiz belge kullanmak, belirsizliği gizlemek.

Zorunlu kontroller — hepsi **fail-closed**:

- Kapalı kaynak modu: model yalnızca istekte verilen kaynak paketini kullanır. İnternet erişimi yok.
- Her bulgu geçerli bir `evidence_id` taşır; sunucu tarafında varlık, yetki, bağlama dahil edilmişlik ve sayfa/span eşleşmesi doğrulanır.
- JSON Schema strict + Zod. Şema dışı çıktı reddedilir.
- Kaynaksız sayısal token reddedilir.
- Doğrulanmamış AI bulgusu puanlama girdisine dönüşemez. Uzman onayı zorunlu geçittir.
- Prompt injection: belge içeriği "güvenilmeyen veri" olarak etiketlenir, asla talimat olarak yürütülmez.
- Model snapshot ve prompt sürümü her analizle birlikte kaydedilir; `latest` alias üretimde kullanılmaz.

## 4. Kullanıcı modeli

- **Kurumsal kayıt, kurum doğrulama ve kurum onayı yoktur.** Kullanıcılar bireydir.
- Öneri verme herkese açık (e-posta doğrulamalı hesap yeterli).
- Kurum/sektör/uzmanlık profilde **isteğe bağlı, doğrulanmamış beyan** alanlarıdır; her yerde doğrulanmamış olarak gösterilir ve puana etki etmez.
- Yetkili roller (ajans uzmanı, sektör uzmanı, kurul üyesi, gözlemci, denetçi, sistem yöneticisi, AI yönetişim sorumlusu) davetle atanır.
- Süreç durumundan `INSTITUTION_REVIEW` çıkarılmıştır.

**KVKK/kimlik ayrımı — ilk migration'da kurulmalı:** `proposals` kişiye değil değişmez bir `submitter_ref` anahtarına bağlanır; kişisel veri ayrı kimlik tablosunda durur. Silme talebinde öneri ve karar zinciri bozulmadan kimlik pseudonimleştirilir. Denetim tablosu append-only kalır.

## 5. Ölçek

81 il, 26 kalkınma ajansı, dönem bazlı. Başlangıç pilotu TR33 (Afyonkarahisar, Kütahya, Manisa, Uşak) ama **kodda hiçbir il, ajans veya bölge sabitlenmez**. Kriter setleri ve ağırlıklar global sabit değil, `(ajans, dönem)` anahtarıyla sürümlü kayıttır — TR33 kalibrasyonu "varsayılan" değil `TR33-2027-v1` olarak adlandırılır.

## 6. Yığın

Next.js (App Router) • TypeScript strict • PostgreSQL (RLS, JSONB, PostGIS, pgvector) • Redis • S3/MinIO • OpenAI Responses API + Structured Outputs • Dokploy • pnpm monorepo.

Sürümleri scaffold anında resmî release sayfalarından teyit et ve tam sürümle pinle; `latest` hiçbir yerde kalmasın.

```
apps/web                      Next.js web + sunucu API
apps/worker                   belge işleme, raporlama, uzun AI görevleri
packages/domain               iş kuralları, durum makineleri, karar modeli
packages/database             şema, migration, RLS, veri erişimi
packages/scoring              deterministik puan, slot doldurma, senaryo, duyarlılık
packages/evidence-validation  evidence_id / span / yetki doğrulama
packages/ai-gateway           OpenAI çağrıları, prompt registry, şema, maliyet
packages/retrieval            hibrit arama, kaynak paketi
packages/reporting            Word/PDF/Excel çıktıları
packages/observability        log, metric, trace, audit
```

## 7. Bağlam dosyaları

```
CLAUDE.md                       → sadece @import satırları
docs/ykh-brief.md               → bu dosya
docs/ykh-alan-sozlugu.md        → terim sözlüğü (TR/EN), tablo ve UI etiketi karşılıkları
docs/ykh-guvenlik.md            → RLS politikaları, veri sınıfları, maskeleme
docs/ykh-calisma-protokolu.md   → tartış→plan→onay→kod→göster→commit, debug protokolü
```

Alan sözlüğü en yüksek getirili dosya: `claim/iddia`, `evidence/kanıt`, `finding/bulgu`, `assessment/değerlendirme`, `slot`, `cycle/dönem`, `criterion/kriter` — terim kayması bu projede doğrudan hataya dönüşür.

## 8. Proje skill'leri

Mevcut setine (`/ponytail`, `/impeccable`, `/frontend-design`, `/security-review`, shadcn/ui, tailwind-v4-shadcn) ek iki tane yaz:

- **`evidence-contract`** — `packages/ai-gateway` ve `packages/evidence-validation` altında dosya açıldığında tetiklenir; şema + `evidence_id` doğrulama + fail-closed kalıbını dayatır.
- **`rls-first`** — yeni tablo/migration eklenirken RLS politikası ve `access_class` sütunu olmadan geçilmemesini dayatır.

`/security-review`'ü Faz 3'ten itibaren her PR'da çalıştır.

## 9. Claude Code ↔ Codex iş bölümü

| Claude Code (ağırlıklı) | Codex |
| --- | --- |
| Alan modeli, durum makineleri, karar modeli | Tekrarlı CRUD/route iskeletleri |
| Puanlama ve slot doldurma motoru | Test fixture ve seed veri |
| AI Gateway, retrieval, evidence-validation | Migration boilerplate, tip üretimi |
| Güvenlik/RLS, denetim izi | Rapor şablonu dönüşümleri |
| Mimari kararlar, refactor, review | Sınırları net küçük yamalar |

**İki ajan aynı pakete aynı anda dokunmaz.** Paket bazlı sahiplik, ayrı branch, birleşme noktası yalnızca `packages/domain` tip sözleşmeleri.

## 10. İnşa sırası

1. `packages/domain` — durum makinesi, slot ve karar modeli tipleri. Saf fonksiyon, DB ve UI'dan önce.
2. `packages/scoring` — deterministik puan, devamlılık payı, kanıt eşiği, slot doldurma, senaryo. %100 birim testli, AI'sız çalışır.
3. `packages/database` — şema + RLS. `access_class`, `verification_status`, `submitter_ref` ilk migration'da.
4. `packages/evidence-validation` — **AI Gateway'den önce.** Doğrulayıcı hazır olmadan model çağrısı yazmak, fail-closed'ı geriye takmak demektir.
5. `packages/ai-gateway` + eval seti aynı anda. İlk iki test: kaynaksız sayı, sahte kaynak.
6. `packages/retrieval` → `apps/worker` → `apps/web`.

---

## Hazır başlangıç promptları

### Oturum 1 — Alan modeli

> `docs/` altındaki bağlam dosyalarını oku. `packages/domain` için şunları TypeScript tipleri ve saf fonksiyonlar olarak tasarla: öneri durum makinesi ve izinli geçişler (hangi rol hangi geçişi tetikleyebilir), dönem/slot modeli, aday türü (mevcut konu | yeni öneri), karar sonucu türleri (korunuyor | çıkıyor | ekleniyor | koşullu | boş slot).
> Brief'teki karar modelini birebir uygula, kendi yorumunu ekleme. Önce plan çıkar, onayımı bekle. Migration veya UI yazma.

### Oturum 2 — Puanlama motoru

> `packages/scoring`: sekiz kriterli ağırlıklı puan, sürümlü ağırlık seti, devamlılık payı, kanıt yeterliliği eşiği ve slot doldurma algoritmasını uygula. Brief bölüm 2'deki sözde kod normatiftir.
> Her kural için birim test yaz — özellikle: eşiği geçemeyen yüksek puanlı aday slot doldurmaz; devamlılık payı 0 iken sıralama değişir; dört slotun tamamı boş kalabilir; dört slotun tamamı yeni adayla dolabilir.
> Bu paket AI olmadan tek başına çalışmalı ve hiçbir yerde destek sayısını girdi almamalı.

### Oturum 3 — Şema ve RLS

> `packages/database`: brief bölüm 4 ve 5'e uygun şema. `submitter_ref` ile kimlik ayrımı, `access_class`, `verification_status`, `(ajans, dönem)` anahtarlı sürümlü kriter/ağırlık kayıtları, append-only audit.
> Her tablo için RLS politikası yaz; politikasız tablo bırakma. Migration'ı geri alma testiyle birlikte ver.

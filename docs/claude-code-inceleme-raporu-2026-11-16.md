# YKH-KDP — kapsamlı inceleme ve Claude Code iyileştirme raporu

Tarih: 16 Kasım 2026 · İncelenen commit: `782bca3`

## 1. Değerlendirme

Uygulama, yatırım konusu önerilerini belgeyle ilişkilendirip ajans incelemesine hazırlayan **kullanılabilir bir pilot temeline** sahip. Puanlama, veri erişimi, alıntı doğrulama ve arayüzün ayrılması; ham AI puanının korunması; ajans onayı; RLS; sürümlü ağırlıklar ve gerçek PostgreSQL testleri güçlü tarafları.

**Mevcut hâliyle geniş katılımlı üretime açılmasını önermiyorum.** Bağımlılık taraması temiz değil; doğrulayıcı bazı uydurma alıntıları ve eksik kriter kümelerini kabul ediyor; değerlendirme ve onay işlemlerinde yarış koşulları var. Bunlar ürünün temel güvenilirlik iddiasını etkiliyor. Başarılı testler bu senaryoları kapsamıyor.

**Uygulanabilirlik açısından:** belge destekli politika hazırlama ve uzman ön incelemesi için uygun; yatırımın ekonomik/teknik fizibilitesini kanıtlayan bir sistem olarak yeterli değil. Planlarda bir sektörün geçmesi, belirli bir yatırımın talebini, maliyetini, kaynak yeterliliğini veya gerçekleşme olasılığını tek başına doğrulamaz. Bu sınır ürün konumlandırmasında korunmalı.

Bu çalışma kod değişikliği içermez. Aşağıdaki çözümler uygulama talimatı önerileridir; iş kuralı, kimlik doğrulama, şema veya dağıtım değişikliği için mevcut yetki sınırları ayrıca gözetilmelidir.

## 2. Kapsam ve doğrulama

İncelenen alanlar: web sayfaları/eylemleri, oturum ve roller, SQL/RLS ve migration'lar, worker, AI gateway, retrieval, kanıt doğrulama, puanlama, rapor, mevcut testler, Docker dosyaları ve ürün/dağıtım belgeleri.

| Kontrol | Sonuç |
|---|---|
| `pnpm typecheck` | Başarılı |
| `pnpm build` | Başarılı; Next.js üretim çıktısı oluştu |
| `pnpm -r --workspace-concurrency=1 test` | **164 geçti, 0 başarısız** |
| `pnpm audit --prod --json` | **Başarısız:** 5 kritik, 11 yüksek, 5 orta, 1 düşük uyarı kaydı |
| Dar doğrulayıcı/puanlama tekrar üretimleri | Aşağıdaki B02, B03, B07, B12 senaryoları mevcut fonksiyonlarla yeniden üretildi |
| PostgreSQL sıralama deneyi | B05 için mevcut boolean/NULL sıralamasının ulusal → ajans → il olduğu doğrulandı |

Veritabanı testleri bu çalışma için oluşturulan **ayrı, geçici PostgreSQL 17 konteynerinde**, süreç düzeyinde açıkça verilen bağlantılarla çalıştırıldı; mevcut uygulama veritabanı sıfırlanmadı. Testler ortam yapılandırmasındaki gerçek model istemcisini de kullandı; sonuç, sabit/offline bir AI kalite garantisi değildir. Ayrı `pnpm ai:eval` kalite koşusu yapılmadı.

Tarayıcıda uçtan uca etkileşim, mobil/ekran okuyucu doğrulaması, yük testi, canlı sunucu/WAF incelemesi, yedekten dönüş tatbikatı ve saldırı istismarı yapılmadı. Kaynak koddan çıkarılan riskler ile çalıştırılarak doğrulanan hatalar aşağıda ayrılıyor. Belirtilen satırlar incelenen commit'e aittir.

## 3. Öncelik tanımı

- **P0:** Yayına çıkışı durduran güvenlik kapısı; hemen ele alınmalı.
- **P1:** Karar doğruluğu, veri bütünlüğü veya temel kullanıcı akışını etkileyen sorun; pilot genişletilmeden giderilmeli.
- **P2:** Kontrollü pilotta planlanabilecek işlev, izlenebilirlik ve işletim eksikleri.
- **Ürün önerisi:** Mevcut gereksinimin ihlali olduğu iddia edilmeyen, ayrıca kararlaştırılacak geliştirme.

## 4. Öncelikli bulgular ve uygulanabilir görevler

### B01 — P0: Üretim bağımlılığı güvenlik kapısı geçilemiyor

**Kanıt:** `apps/web/package.json:35` çevresinde Next.js `16.2.12`; `packages/ai-gateway/package.json` içinde Zod `4.4.3`; kilit dosyası ve çalıştırılan audit çıktısı. Audit Next.js, sharp, Zod ve geçişli bağımlılıklarda toplam 22 uyarı kaydı bildiriyor.

Bu sayı 22 ayrı, bu uygulamada istismar edildiği kanıtlanmış açık anlamına gelmez. Örneğin Windows sunucusu, belirli görüntü işleme biçimleri ve `use cache` kullanan kod gibi bazı uyarıların ek koşulları var. Docker çalışma ortamı Alpine/Linux. Buna karşılık uygulama App Router ve Server Actions kullanıyor; bu kullanım için bildirilen hizmet engelleme koşulu doğrudan ilgili.

Üretici bildirimi: [Next.js Server Actions hizmet engelleme duyurusu](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r), etkilenen 16.x aralığı için `16.4.1` düzeltmesini belirtiyor. Bu, bütün audit kayıtlarını tek başına çözen sürüm önerisi değildir; uygulama anında tüm kayıtlar yeniden kontrol edilmeli.

**Dar görev:** Bağımlılık ve kilit dosyasını odaklı güncelle; her uyarının kullanım koşulunu değerlendir; rastgele `--force` veya büyük sürüm sıçraması yapma. Yeni kütüphane ekleme.

**Kabul:** `pnpm audit --prod` temiz; typecheck, build ve mevcut testler başarılı. Ürün protokolündeki temiz audit şartı sağlanmadan dağıtım yapılmamalı.

### B02 — P1: Kısa uydurma alıntı parçası doğrulanmış sayılıyor

**Kanıt:** `packages/evidence-validation/src/index.ts:121`. Üç noktayla ayrılan parçaların 12 karakterden kısa olanları atılıyor; doğrulanan kayıtta orijinal alıntı tutuluyor.

**Tekrar üretim:** Gerçek, uzun bir kaynak ifadesinin sonuna ` ... UYDURMA` eklenince alıntı `dogrulanan` listesine kabul edildi. `paketteGeciyor()` aynı yardımcıyı kullandığı için eval'in ikinci kontrolü de bunu yakalamıyor.

**Dar görev:** Boş olmayan kısa parçaları da doğrula veya yalnızca doğrulanmış metni sakla. Mevcut tipografi normalizasyonunu ve gerçek kısaltılmış alıntı desteğini koru.

**Kabul:** Gerçek ifade + kısa uydurma parça reddedilir/düşer; tamamen kaynakta geçen kısaltılmış alıntı geçer; saklanan metinde doğrulanmamış ek kalmaz.

### B03 — P1: Sekiz farklı kriter yerine aynı kriter sekiz kez kabul ediliyor

**Kanıt:** `packages/ai-gateway/src/sema.ts:39`, `packages/evidence-validation/src/index.ts:333`, `packages/degerlendirme/src/index.ts:141`.

**Tekrar üretim:** Sekiz kez `plan_uyumu` içeren çıktı şemadan geçti. `Object.fromEntries` bunu tek kritere indiriyor. Doğrulayıcı mevcut kriter ağırlıklarını tekrar normalize ettiği için kurulan örnek tek kriterle **100 dayanak** üretti.

**Dar görev:** Sekiz kriterin her birinin tam bir kez bulunduğunu şema sonrası doğrula; doğrudan doğrulayıcı kullanımını da koru. Structured Outputs için JSON Schema üretimini bozma.

**Kabul:** Tekrarlı veya eksik kriter çıktısı kaydedilmez; sekiz farklı geçerli kriter geçer. Eval kontrolü yalnızca dizi uzunluğunu ölçmez.

### B04 — P1: Worker ve elle değerlendirme aynı işi eşzamanlı yapabiliyor

**Kanıt:** `apps/worker/src/index.ts:24`, `:52`; `packages/degerlendirme/src/index.ts:24`, `:199`; `apps/web/lib/eylem.ts:149`.

`SKIP LOCKED` kilidi kısa iş alma transaction'ı bitince kalkıyor. Model çağrısı daha sonra başlıyor; öneri hâlâ `degerlendiriliyor`. İkinci worker veya elle tetikleme aynı öneriyi tekrar işleyebilir. Kayıt aşaması eski değerlendirmeyi siliyor; geç gelen işlem daha yeni sonucu/kararı etkileyebilir. Bu bulgu kod akışıyla doğrulandı; eşzamanlı çalışan iki worker deneyi yapılmadı.

**Dar görev:** Ortak değerlendirme sınırında tek iş sahipliği sağla; sonuç yazılırken durum/sürümün geçerliliğini denetle. Uzun model çağrısı boyunca transaction açık tutmayı otomatik çözüm seçme. Şema değişmeden yapılabilecek yolu önce incele.

**Kabul:** İki eşzamanlı tetik yalnızca bir model zinciri çalıştırır; tamamlanmadan verilen yeni ajans kararı sessizce ezilmez; yarıda kesilen iş için kurtarma davranışı belirli olur.

### B05 — P1: Retrieval yerel belgeyi önceliklendirmiyor

**Kanıt:** `packages/retrieval/src/index.ts:47`. Nullable boolean karşılaştırmaları `DESC` ile sıralanıyor. Gerçek PostgreSQL deneyi mevcut ifadenin **ulusal → ajans → il** sırası verdiğini gösterdi. İstenen sıra bunun tersi.

**Etki:** İlk 12 eşleşme ulusal parçalarla dolarsa ilgili yerel kaynak paket dışında kalabilir; ürünün en önemli sorusu olan “neden burada?” zayıflar.

**Dar görev:** İki karşılaştırmaya `NULLS LAST` veya eşdeğer açık boolean sıralaması ekle.

**Kabul:** 12'den fazla ulusal eşleşme, bir ajans ve bir il eşleşmesiyle il → ajans → ulusal sırası doğrulanır. Retrieval paketinde mevcut test koşusu **0 test** üretiyor; ilgili SQL regresyonu mevcut DB test düzenine eklenebilir.

### B06 — P1: Onay geçişi gerçek mevcut durumu doğrulamıyor

**Kanıt:** `apps/web/lib/eylem.ts:181`, `packages/database/src/sorgu.ts:775`. Mevcut durum formdan alınıyor; güncellemede yalnızca öneri kimliği koşulu var.

**Etki:** Yetkili ajans değiştirilmiş `mevcut` alanıyla geçiş kuralını atlayabilir; eski açık form daha yeni ret/onay kararını ezebilir. Bu, anonim kullanıcının onay verebildiği iddiası değildir.

**Dar görev:** Gerçek durumu DB'den oku, geçişi aynı transaction içinde doğrula ve koşullu güncelle; çakışmayı kullanıcıya açıkça bildir.

**Kabul:** Sahte eski durum ve iki çakışan karar testi reddedilir; başarısız işlem başarı denetimi üretmez.

### B07 — P1: Az adayda boş slotlar kayboluyor; bazı dayanaksız adaylar yanlış etiketleniyor

**Kanıt:** `packages/scoring/src/siralama.ts:39`, `:65`, `:77`.

**Tekrar üretim:** Dört slot ayarında `hesapla([])` → `ilkDort=[]`, `bosSlot=0`, `ucDurum=null`. 1–3 adayda da eksik pozisyonlar üretilmiyor. İlk slot döngüsü dışında kalan adaylara ise dayanağına bakılmadan `dayanaksiz:false` veriliyor.

**Dar görev:** Aday sayısından bağımsız olarak yapılandırılmış slot sayısını gerekçeli boş satırlarla tamamla; her kalan adayın eşik durumunu kendisinden hesapla.

**Kabul:** 0/1/3 yeterli adayda boş slot sayısı 4/3/1; toplam slot sayısı ayarla aynı; dışarıdaki eşik altı aday da `dayanaksız`.

### B08 — P1: Boş puan düzeltmesi gerçek sıfır sayılıyor

**Kanıt:** `apps/web/lib/eylem.ts:216`, `apps/web/components/onay-kutusu.tsx:89`. `Number("")` ve `Number(null)` sıfır üretir; input zorunlu değil.

**Dar görev:** Dönüşümden önce her kriterin mevcut ve dolu olduğunu doğrula; arayüzde `required` kullan.

**Kabul:** Eksik/boş alan reddedilir ve DB korunur; bilerek yazılan `0` kabul edilir.

### B09 — P1: Web belge yüklemesi bölgesel kapsamı ve uzun belge işlemeyi karşılamıyor

**Kanıt:** `apps/web/components/belge-formu.tsx:89`, `apps/web/lib/eylem.ts:259`, `packages/database/src/sorgu.ts:846`; karşılaştırma: `packages/database/src/belge-yukle.ts:214`.

Form yalnızca ulusal veya il kapsamı seçtiriyor; ajans kapsamı yok. Varsayılan tür bölge planı, varsayılan kapsam ulusal. Bu hâliyle bölge planı yanlışlıkla bütün illere açılabilir. CLI parçalarken web yolu bütün metni tek satıra kaydediyor; aynı kaynak farklı yoldan yüklenince paket büyüklüğü ve arama davranışı değişiyor.

**Dar görev:** Mevcut form içinde kapsamı açık seçtir; bölgesel kaynakta ajans seçimini destekle. Web yüklemesinde mevcut parçalama fonksiyonunu kullan; kopya ayrıştırıcı yazma. Metin kalitesi/uzunluğu kontrolünü model çağrısından önce uygula.

**Kabul:** Bölgesel belge başka ajans paketine girmez; uzun metin parçalanır ve atıf çıpası korunur; UI/CLI aynı kaynak için tutarlı sonuç verir. PDF/DOCX desteği bu düzeltmenin şartı değildir.

### B10 — P1: Sınırsız giriş ve misafir gönderimi kaynak tüketebilir

**Kanıt:** `apps/web/lib/eylem.ts:21`, `:51`, `:91`; `packages/database/src/sorgu.ts:25`, `:64`. Depoda giriş, kayıt, misafir oluşturma ve öneri gönderimi için hız/kota sınırı görülmedi.

**Etki:** Pahalı parola hash'i, DB bağlantısı ve AI kuyruğu kötüye kullanılabilir. Canlı ortamda harici WAF/kota olup olmadığı doğrulanmadı.

**Dar görev:** Önce mevcut altyapı kontrolünü doğrula; gerekiyorsa giriş ve öneri için ayrı sınırlama uygula. Değerleri trafik ve kullanım politikasına göre belirle; yeni servis zorunlu varsayma.

**Kabul:** Limit aşımında yeni hesap/öneri veya model işi oluşmaz; normal kullanıcıya anlaşılır tekrar deneme bilgisi verilir; farklı kullanıcıların haksız engellenmesi ölçülür.

## 5. Diğer somut eksikler

Her satır ayrı ve küçük bir görev olarak ele alınmalı. “Kod kanıtı” doğrudan HTTP istismarı veya canlı ortam ölçümü anlamına gelmez.

| Kimlik / öncelik | Eksik ve kaynak | Dar çözüm ve kabul ölçütü |
|---|---|---|
| B11 / P1 | Misafire sonradan hesap açma vaadi var; `/kayit` misafir oturumunu da geri gönderiyor. `oneri-sihirbazi.tsx:297`, `app/kayit/page.tsx:25`, `lib/eylem.ts:29`. | Desteklenmeyen vaadi hemen düzelt. Gerçek hesap dönüşümü ayrı ürün/auth görevi: aynı gönderen ref'i korunmalı, başka cihazdan eski öneriye ulaşılmalı, başkasının önerisi sahiplenilememeli. |
| B12 / P2 | Gerçek alıntıya bağlı karşı görüşte kaynaksız `987654321` iddiası kabul edildi. `evidence-validation/src/index.ts:467`. | Sayısal kaynak kontrolünü karşı görüş iddiasına da uygula; sorunlu itirazı düşür, geçerli ana değerlendirmeyi engelleme. |
| B13 / P2 | Aynı planın parçaları bağımsız belge çeşitliliği sayılıyor. `evidence-validation/src/index.ts:424`, `database/src/belge-yukle.ts:220`. | Kaynak ile parça ayrımını mevcut künyeden kur. Bir planın dört parçası dört ayrı plan kadar çeşitlilik kredisi vermemeli. Kalıcı kimlik gerekirse şema görevi ayrı planlanmalı. |
| B14 / P1, DB savunması | Kişisel veri silen SECURITY DEFINER fonksiyonunda yönetici kontrolü yok. `migrations/0013_gonderen_ajans.sql:35`, `sorgu.ts:957`. Web eyleminde kontrol var. | Yeni migration içinde fonksiyon yetkisini sınırla; eski migration'ı değiştirme. Anonim/yatırımcı/ajans bağlamı hiçbir kimlik veya oturum silememeli. HTTP bypass kanıtı bulunmadı. |
| B15 / P1, DB savunması | Oturum politikası koşulsuz; gönderen eklemede rol sınırlaması yok. `migrations/0002_rls.sql:71`, `:83`, `:92`. | Doğrudan tablo yetkilerini daralt; meşru kayıt/oturum işlemlerini sınırlı fonksiyonlarla koru. Başkası adına oturum oluşturma ve yönetici gönderen ekleme negatif SQL testleriyle engellenmeli. SQL injection saptanmadı; risk ek SQL erişimi varsayımına bağlı. |
| B16 / P2 | Başarılı girişte `hedef` doğrudan `redirect` alıyor. `lib/eylem.ts:25`. | Sadece uygulama içi güvenli yollar; dış URL, `//` ve bozuk hedefler varsayılan sayfaya düşmeli. |
| B17 / P2 | Durum/puan/NACE güncellemesinde etkilenen satır kontrol edilmiyor. `sorgu.ts:768`. | `UPDATE ... RETURNING` sonucunu doğrula. Olmayan kayıtta başarı mesajı ve başarı denetimi oluşmamalı. |
| B18 / P1 | Excel ham ve düzeltilmiş puanı birleştiriyor, künyede “AI ham puanı” diyor. `sorgu.ts:1021`, `app/rapor/route.ts:55`, `:120`; brief ayrı sütun istiyor. | Ham ve düzeltmeyi ayrı getir/yaz; düzeltme yoksa düzeltme sütunları boş. Farklı iki puan Excel'den yeniden okunup doğrulanmalı. |
| B19 / P2 | Üretimde demo parola paneli koşulsuz gösteriliyor. `app/giris/page.tsx:70`. Üretim kurucusu demo hesap yaratmıyor. | Paneli geliştirme/demo ortamına sınırla; seed edilmiş üretim için hesap kontrolünü ayrıca yap. Mevcut canlıda demo hesabın açık olduğu kanıtlanmadı. |
| B20 / P2 | İl seçimine dönmek öneri formunu unmount edip taslağı siliyor. `oneri-sihirbazi.tsx:274`, `oneri-formu.tsx:23`. | Taslağı üst bileşende tut veya kayıp davranışını açıklaştır. Metin yaz → il değiştir → geri dön senaryosu veri kaybı yaratmamalı. Sunucu taslak altyapısı şart değil. |
| B21 / P2 | Geciken eski NACE araması yeni sonucu ezebilir. `components/nace-secici.tsx:22`. | İstek sırası/güncel sorgu kontrolü; ikinci sorgu önce bitse de ekranda son sorgunun sonucu kalmalı. Debounce tek başına yeterli değil. |
| B22 / P2 | İlçe seçilmeden ilk ilçe kaydediliyor. `components/oneri-formu.tsx:81`. | Boş “il düzeyi” seçeneği; bilinçli seçim yoksa `null`, seçilmişse doğru ilçe. |
| B23 / P2 | Onay kuyruğunda eşik `55` sabit. `app/onay/page.tsx:80`. | İlgili dönem ağırlık setinin eşiğini sorgudan getir. Eşik 70/dayanak 60 örneği detayla aynı etiketi vermeli. |
| B24 / P2 | Yatırımcı detayında erişemeyeceği il listesi/sıralama bağlantıları var. `app/oneri/[id]/page.tsx:62`, `:310`. | Mevcut ajans koşulunu bağlantılara uygula; yatırımcıya “Önerilerim”. Statik kaynak eşleşmesi yerine rol başına render/navigasyon doğrula. |
| B25 / P2 | Model `fetch` çağrısında uygulama süre sınırı yok. `ai-gateway/src/istemci.ts:143`. | İptal edilebilir süre sınırı; askıda çağrı worker'ı süresiz durdurmamalı. Karşı görüş zaman aşımı geçerli ana puanı kaybettirmemeli. |
| B26 / P2 | Ücretli ama reddedilen cevaplar 0 token loglanıyor. `ai-gateway/src/gateway.ts:76`, `degerlendirme/src/index.ts:52`, `:117`, `:170`. | Cevap alınan retlerde usage'ı koru; ağ hatasını ayır. Geçersiz JSON/alıntı cevabının tüketimi logda görünmeli. |
| B27 / P2 | Yeniden değerlendirmede eski gerekçe, alıntılar, eşlemeler ve ajans düzeltmesi tam arşivlenmiyor. `degerlendirme/src/index.ts:199`. | Silmeden önce eski kaydı mevcut denetimde eksiksiz koru. Önceki puan ve dayanak zinciri yeniden kurulabilmeli. Yeni tablo şart değil. |
| B28 / P2 | CLI belge yenilemesi silme + toplu eklemeleri tek transaction'da yapmıyor; adla silme farklı kapsamları etkileyebilir. `database/src/belge-yukle.ts:217`, `sorgu.ts:865`. | Yenilemeyi atomik yap; belge kimliğinde kapsam/yıl çakışmasını denetle. Ekleme ortasında hata olunca eski kaynak eksiksiz kalmalı. |
| B29 / P2 | Test başında hedef DB zorunlu doğrulanmadan `sifirla()` çalışıyor. `database.test.ts:38`, `database/package.json:19`, `migrate.ts:145`. Uzak adres koruması var. | Ayrı test hedefi doğrula; eksik test ayarında DDL'den önce dur. Localhost geliştirme DB'si veya tünel yalnız adresine göre güvenli sayılmamalı. |
| B30 / P2 | README/PRODUCT ve brief'in sonu mevcut rapor, gizlilik ve ekranlarla çelişiyor. `README.md:125`, `apps/web/PRODUCT.md:58`, `docs/ykh-brief.md:513`; dağıtım belgesinde rol ataması hâlâ SQL. | Mevcut davranışa göre belgeleri eşitle; Excel'i yeniden geliştirme görevi çıkarma. Yönetici arayüzündeki rol atamasını belgeye geçir. |
| B31 / P2 | Depoda CI workflow'u ve lint script'i yok; mevcut “e2e” testleri HTTP/tarayıcı katmanını çalıştırmıyor. `package.json`, `apps/web/lib/e2e.test.ts`, `erisim.test.ts:78`. | Mevcut test/build/typecheck/audit için izole DB'li CI planla; en riskli form/rol senaryolarını dar doğrula. Yeni test aracı veya bağımlılık gerekiyorsa ayrıca onay al; sırf metrik için geniş altyapı kurma. |

## 6. Uygulanabilirlik ve ürünün daha yararlı olması için öneriler

### 6.1 Kontrollü ajans pilotuyla ilerlemek

**Görüş:** Güvenilirlik düzeltmeleri sonrası bir ajans ve sınırlı sektör kümesiyle pilot mantıklı. 81 ilde ekranın açılması, 81 il için aynı kalitede değerlendirme yapılabildiğini göstermiyor.

**Kanıt:** `docs/ykh-brief.md:343` çevresinde 77 ilde ilçe verisinin bulunmadığı yazıyor. Mevcut belge kümesi TR33 bölge planı ve iki ulusal belgeye dayanıyor. `packages/degerlendirme/src/ornekler.ts:62` kalite kümesi dört örnekten oluşuyor; tamamı TR33 kapsamında. Bu, ülke ve sektör çeşitliliği için yeterli doğrulama değil.

**Önerilen ilk pilot çıktısı:** Ajansça seçilmiş farklı nitelikte öneriler, uzmanların bağımsız kriter değerlendirmeleri ve kaynak listesi. AI sonuçlarıyla uzmanlar arasındaki farklar kayıt altına alınmalı. Pilot “en yüksek puanı buldu mu?” yanında “uzmanın işini hızlandırdı mı, yanlış güven üretti mi?” sorularını ölçmeli.

### 6.2 Plan uyumu ile yatırım fizibilitesini ayırmak

Sekiz kriter içinde pazar, istihdam/katma değer, uygulanabilirlik ve yatırımcı ilgisi var. Form ise başlık, gerekçe, konum ve isteğe bağlı NACE topluyor. Bu girdiler ve plan belgeleri gerçek sipariş, kapasite, yatırım tutarı, finansman, enerji/su ihtiyacı ve operasyon koşullarını sistematik olarak sağlamıyor.

**Öneri:** Mevcut kapsamda sonucu “belge destekli ön değerlendirme” olarak sunmaya devam et. Ajansın ihtiyaç duyduğu eksik bilgiyi kriter bazında görünür kıl. Yeni kapsam istenirse az sayıda isteğe bağlı alanı pilot geri bildirimiyle seç; kapsamlı finansal model veya uzun başvuru formunu peşinen ekleme.

**En küçük değerli geliştirme:** Model zaten `puanlar[].not` ve `eksik_veri` üretiyor (`ai-gateway/src/sema.ts:46`, `:61`), fakat kayıt yolu bunları saklamıyor (`degerlendirme/src/index.ts:141`, `:209`). Önce mevcut açıklamaların korunmasını ve ajansın mevcut detay ekranında görmesini planla. Şema değişikliği gerekiyorsa ayrı yetkilendir.

**Kabul önerisi:** Ajans her kriter için puanın gerekçesini, ilgili alıntıyı ve eksik bilgiyi aynı yerde görebilmeli; yatırımcı beyanı ile bağımsız kaynak birbirine karışmamalı.

### 6.3 Belge kapsamını saymaktan kaynak yeterliliğini ölçmeye geçmek

Bir ilde tek belge bulunması yeterli yerel kanıt olduğu anlamına gelmez. Parça sayısı, ayrı kaynak sayısı, güncellik ve kriter kapsaması farklı ölçülerdir. Mevcut kapsam ekranı yararlı bir başlangıç; B05, B09 ve B13 düzeltmeleri bunun ön koşulu.

**Öneri:** Her pilot ajans için kaynak sahibi, güncelleme tarihi/dönemi, coğrafi kapsam ve kapsadığı kriterler belirlenmeli. Yeni route yerine mevcut Belgeler ekranında eksikler görünür kılınabilir. PDF/DOCX desteği önce ölçülen yükleme iş yüküne göre kararlaştırılmalı; başlangıçta kalite kontrolünden geçen metin yükleme yeterli olabilir.

**Kabul önerisi:** Pilot kapsamındaki her il için yerel veri eksikleri listelenmiş olmalı; eski ve farklı bölge kaynağı güncel yerel kanıt izlenimi vermemeli. Yetersiz kanıt için eşikleri gevşetmek çözüm sayılmamalı.

### 6.4 Puan ve ağırlıkları uzmanlarla kalibre etmek

Mevcut ağırlıklar sürümlü ve yerellik tabanı korunuyor; bu güçlü bir tasarım. Fakat sürüm etiketi, puanın uzmanlarla kalibre edildiğini tek başına kanıtlamaz. Tam metin eşleşmesi alıntının gerçekliğini sınar; alıntının o kriter sonucunu gerçekten desteklediğini garanti etmez. Brief bu yargı sınırını açıkça kabul ediyor.

**Öneri:** Pilot için iyi/zayıf/eksik/yanıltıcı yerel gerekçe örnekleri oluştur; aynı önerinin tekrar koşularındaki değişimini ve uzman düzeltme nedenlerini izle. Aynı modelin karşı görüş üretmesini bağımsız uzman doğrulaması sayma. `pnpm ai:eval` kümesini pilot sektörleri ve bölgeleri kapsayacak biçimde büyüt; prompt/şema değişiminde çalıştır.

**Önerilen ölçüler:** Uzman düzeltmesi gereken kriter oranı; uzman inceleme süresi; yeniden deneme/ret oranı; aynı örnekte puan ve ilk slot değişimi; yanlış bölge kaynağı kullanımı; dayanağı zayıf ama yüksek puanlı öneri oranı. Hedefleri pilot başlamadan ajans belirlemeli; bu rapor ölçülmemiş başarı yüzdesi atamıyor.

### 6.5 Ajans iş yükünü ve karar izini iyileştirmek

**Öneri:** Önce Excel'deki ham/düzeltme ayrımını ve geçmiş kaydı düzelt. Sonra mevcut Onay ekranında dönem/il/durum filtresi, eksik veriye göre inceleme sırası ve gerekli ise sayfalama planla. Toplu onay ilk geliştirme olmamalı; belge incelemesini atlayarak mevcut insan kontrolünü zayıflatabilir.

Pilot sırasında “kim inceliyor, kaç gündür bekliyor, hangi bilgi bekleniyor?” soruları izlenmeli. İş atama ve yeni durumlar gerekiyorsa bunlar mevcut dört durumlu modeli değiştiren ayrı ürün kararlarıdır.

### 6.6 Veri sahipliği ve kullanıcı devamlılığı

Misafir akışı katılımı kolaylaştırıyor; tarayıcı verisi kaybolunca erişimin bitmesi belgelenmiş bir ürün kararı. B11'deki yanlış vaat kaldırılmalı veya güvenli hesap dönüşümü geliştirilmeli. Parola kurtarma ve e-posta doğrulama mevcut akışta tamamlanmış değil; giriş ekranındaki “e-posta doğrulamalı” söylemi düzeltilmeli.

**Öneri:** Pilot için destek ve erişim kaybı süreci tanımla. Açık katılım hedeflenirse hesap kurtarma/doğrulamayı ayrıca yetkilendirilmiş auth işi yap. Kişisel veriyi ve ticari önerileri loglama; mevcut gizlilik modelini koru. Bu rapor hukuki uygunluk denetimi değildir.

### 6.7 Üretim işletimi

Dağıtım belgesinde günlük yedekleme önerisi **zaten var** (`docs/ykh-dagitim.md:429`); eksik olanın canlıda uygulanıp uygulanmadığı doğrulanmadı. Üretim compose'unda uygulama sağlık kontrolü yok; web, worker şema kurarken geçici hata verebiliyor. Worker kurulum için sahip bağlantısını taşıyor.

**Öneri:** Ayrı işlerle sağlık/hazır olma kontrolü, kuyruk yaşı ve tükenen deneme alarmı, model gecikmesi/tüketim takibi, yedekten dönüş tatbikatı ve ölçülmüş eşzamanlı kullanım testi planla. Kurulum yetkilerinin sürekli çalışan worker'da kalması gereğini incele; Dokploy'da önceki kurulum servisi sorunu belgelenmiş olduğu için dağıtımı körlemesine değiştirme.

İşlem hacmi ölçülmeden Redis, vektör veritabanı, mikroservis veya yeni kuyruk eklemek gerekmiyor. İlk darboğazlar mevcut SQL sıralaması, tek iş sahipliği, kaynak kapsamı ve insan inceleme süreci.

## 7. Claude Code için uygulama sırası

Her satır bir çalışma grubu; grup içindeki her bulgu ayrı atomik değişiklik olmalı. Kesin süre tahmini verilmedi: şema/auth/altyapı kararları ve pilot geri bildirimi eforu değiştirir.

| Sıra | İşler | Bitiş kanıtı |
|---|---|---|
| 1 | B01 bağımlılık güvenliği | Temiz audit + build/typecheck/test |
| 2 | B02, B03, B05, B07 | Yeniden üretim senaryoları önce kırılır, düzeltmeden sonra geçer |
| 3 | B04, B06, B08 | Eşzamanlı değerlendirme/karar ve boş puan testleri |
| 4 | B09, B12, B13, B18, B27, B28 | Kapsam, kaynak, eski karar ve Excel zinciri yeniden kurulabilir |
| 5 | B10, B14, B15, B16, B19, B29 | Negatif erişim/kota/test izolasyonu kontrolleri |
| 6 | B11, B17, B20–B24, B25–B26, B30–B31 | Kullanıcı etkileşimi, timeout, doğru log ve CI kanıtı |
| 7 | Bölüm 6'daki pilot ve ürün kararları | Uzman geri bildirimi ve önceden belirlenmiş pilot ölçümleri |

**Pilot genişletme kapısı:** İlgili P0/P1'ler kapanmış; yerel belge paketi doğrulanmış; AI kalite koşusu çalıştırılmış; rol/rapor kapsamları doğrulanmış; yedek dönüşü ve operasyon sorumlusu belirlenmiş olmalı. Bu koşulların sağlandığı bu incelemede iddia edilmiyor.

## 8. Claude Code'a verilecek başlangıç komutu

```text
Bu depoda docs/claude-code-inceleme-raporu-2026-11-16.md raporunu oku.
CLAUDE.md, güncel AGENTS.md talimatları ve docs/ykh-brief.md ile karşılaştır.
Raporu değişmez gerçek veya bütün görevler için uygulama izni sayma.

İlk çalışma: yalnız B02 alıntı doğrulama hatasını doğrula ve düzelt.
İlgili fonksiyonları ve mevcut test örüntüsünü oku. Gerçek bir kaynak
ifadesine " ... UYDURMA" ekleyerek hatayı gösteren dar regresyon testi yaz.
En küçük düzeltmeyi yap; gerçek kısaltılmış alıntıları ve normalizasyonu koru.
İlgili testleri çalıştır; prompt/şema değiştiyse mevcut protokole göre ai:eval yap.
Bu görevde UI, auth, şema, migration veya deployment değiştirme.

Her sonraki görevde önce ilgili B numarasını ve kapsamı belirt.
İlgisiz refactor, dosya yeniden yazımı, format değişikliği veya yeni bağımlılık ekleme.
Şema/auth/dağıtım değişikliği gereken görevleri ayrı somut plan olarak hazırla;
kullanıcının mevcut yetkisini aşan değişiklikleri uygulama.
Testten önce hedefin ayrı test veritabanı olduğunu doğrula; gerçek veride reset yapma.
İş kuralları için varsayım üretme. Ajansların bölgeler arası onay yetkisi
mevcut brief'te bilinçli karardır; kendiliğinden daraltma.
AI puanını karar sayma, onayı yayın sayma, dayanak eşiğini gevşetme.
Her görev sonunda: sorun, minimal değişiklik, dosyalar, çalıştırılan kontroller,
sonuçlar ve kalan sınırlamaları bildir. Geçmeyen/çalışmayan testi geçmiş sayma.
```

## 9. Bu incelemede değişen dosyalar

Yalnızca bu rapor eklendi: `docs/claude-code-inceleme-raporu-2026-11-16.md`.
Uygulama kaynakları, bağımlılıklar, şema, migration, kimlik doğrulama ve dağıtım ayarları değiştirilmedi. Derleme/testlerin ürettiği yok sayılan yerel çıktılar teslimatın parçası değildir.

## 10. Model 

Modeli gpt-5.4-mini ile değiştirelim.

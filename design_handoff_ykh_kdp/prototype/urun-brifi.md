# Claude Design Prompt — YKH-KDP

> Blok 0'ı tek başına gönder, tasarım dilini onayla, sonra blokları sırayla iste.
> MVP çekirdeği: Blok 1–3. Tamamlayıcı: Blok 4–6. Sonraki faz: Blok 7.

---

## BLOK 0 — Ürün bağlamı ve tasarım dili (ilk mesaj)

Türkiye'de kalkınma ajansları ve yerel paydaşlar için bir **karar destek platformu** tasarlıyorum: YKH-KDP.

**Ürünün tek işi:** Her il için belirlenen dört yatırım konusundan hangilerinin korunacağına, hangilerinin değişeceğine ve boşalan slotlara hangi yeni konuların gireceğine kanıta dayalı karar desteği vermek.

**Nasıl çalışıyor:**
- Kullanıcılar yatırım konusu önerilerini gerekçeleriyle birlikte giriyor.
- Mevcut dört konu da her dönem yeniden puanlanıyor — yani mevcut konular ve yeni öneriler **aynı listede, aynı sekiz kriterle** yarışıyor.
- İlk dörde girenler o yılın listesi oluyor. Mevcut bir konu ilk dörtte kalırsa "korunuyor", düşerse "çıkıyor", yeni bir öneri girerse "ekleniyor".
- Sabit bir koruma tabanı yok: dört konunun tamamı korunabilir de, tamamı değişebilir de. Analiz söyler.
- Yeterli kanıtı olmayan bir aday, puanı yüksek olsa bile slot dolduramaz. **"Bu slot için yeterli kanıtlı aday yok"** geçerli bir sonuçtur.

**Kullanıcılar iki sınıf.** Bir yanda **bireyler** — öneri verebilen herkes. Kurumsal kayıt, kurum doğrulama, kurum onayı yok; kişi kendi adına hesap açıyor. Diğer yanda **yetkili kullanıcılar** — ajans uzmanları, sektör uzmanları, il değerlendirme kurulu üyeleri, gözlemciler, denetçiler; davetle gelen kapalı bir grup.

Bunun tasarıma etkisi belirleyici: **öneri tarafı halka açık bir ürün gibi** davranmalı (düşük sürtünme, mobilde çalışan, kendini anlatan), **değerlendirme tarafı kapalı bir profesyonel araç** gibi. Aynı görsel dil, çok farklı bilgi yoğunluğu.

**Ölçek:** 81 il, 26 kalkınma ajansı. Her ekranda "hangi il, hangi dönem" bağlamı kaybolmamalı. Başlangıç pilotu TR33 (Afyonkarahisar, Kütahya, Manisa, Uşak) ama hiçbir yerde il sabitlenmemeli.

### Tasarımın çözmesi gereken asıl problem

Ekrandaki her bilgi parçasının **üç epistemik durumdan** birinde olduğu göz ucuyla anlaşılmalı:

1. **AI bulgusu** — yapay zekâ üretti, insan doğrulamadı. Asla nihaiymiş gibi görünmemeli.
2. **Uzman onaylı** — bir insan kaynağıyla doğruladı. Puanlamaya yalnızca bunlar girer.
3. **Kanıt yok / yetersiz** — gizlenmez, görünür kılınır. "Veri yetersiz" bu üründe hata değil, saygın bir sonuçtur.

Bu üçlü ayrım tüm ürüne yayılan **bir görsel gramer** olmalı; her tabloda, her kartta, her raporda birebir aynı çalışmalı. Renk tek başına taşıyıcı olmasın (erişilebilirlik + siyah-beyaz çıktı): kenarlık karakteri, doku, işaret ve etiket birlikte çalışsın.

### İkinci kural

Sistem dört ayrı ölçüt üretiyor: stratejik öncelik puanı (0–100), kanıt yeterliliği puanı (0–100), hazır olma/risk profili (boyut bazlı), sıralama sağlamlığı (0–100). **Bunları tek bir "genel skor" halkasına birleştiren tasarım kabul edilmez.** Stratejik puanı yüksek ama kanıtı zayıf bir konu "güçlü öneri" değil, "yüksek potansiyel — ek kanıt gerekli"dir. Tasarım bu gerilimi göstermeli.

### Estetik yön

- Kurumsal, editoryal, arşiv/kayıt hissi. Referans dünyası: resmî tebliğ metinleri, denetim raporları, plan belgeleri, istatistik yıllıkları — dashboard şablonları değil.
- Koyu mürekkep / lacivert ağırlıklı nötr iskelet, son derece kısıtlı aksan. Aksan rengi yalnızca durum taşıdığında görünsün.
- Tipografi: karakterli bir serif başlık yüzü + nötr gövde yüzü + sayı/etiket işleri için utility yüz. **Tüm sayılar tabular numerals**, sütunlarda hizalı.
- Saç teli ayraçlar, düşük border-radius, sıkı ızgara, yoğun ama okunur bilgi paketleme.
- **Kaçınılacaklar:** gradyanlar, renkli glow/shadow, cam efekti, yuvarlak "AI asistan" balonları, emoji ikonografi, dekoratif illüstrasyon, gereksiz mikro-animasyon. Jenerik AI-dashboard görünümü bu ürün için itibar kaybıdır.
- Hareket yalnızca durum değişimini anlaşılır kılmak için. `prefers-reduced-motion` desteklenir.
- Arayüz dili **Türkçe**. Sade fiiller, cümle düzeni, kısaltma yok. Buton ne yapıyorsa onu yazsın ("Kanıtı onayla", "Kararı kilitle"). Boş durumlar eyleme davet etsin; hata mesajları ne olduğunu ve nasıl düzeltileceğini söylesin.

### Teknik zemin

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, grafikler Recharts. Üretilecek her şey shadcn kompozisyonu olarak ifade edilebilir olmalı. Masaüstü öncelikli (1440px hedef), 1280'de bozulmasın, öneri tarafı mobilde tam çalışsın.

### İlk mesajdan beklediğim çıktı

Kod yazma. Önce şunu ver:

1. 5–6 adlandırılmış hex ile renk sistemi (nötr iskelet + durum renkleri ayrı), her birinin kullanım kuralı.
2. Tipografi: üç rol için yüz önerisi, tip skalası, ağırlıklar.
3. Üç epistemik durumun görsel gramerini tanımlayan spesifikasyon (kenarlık, doku, işaret, etiket, renk birlikte).
4. Ürünün hatırlanacağı **tek imza öğesi** ve gerekçesi.
5. Blok 1 ekranının ASCII wireframe'i.

Sonra planı kendi kendine eleştir: hangi kısım "her kurumsal panelde olacak jenerik cevap"a benziyor, neyi neden değiştirdin? Onaylamadan koda geçme.

---

## BLOK 1 — İl Karar Ekranı (ana ekran)

Ürünün tamamının cevabını verdiği ekran. Bir il, bir dönem, dört slot.

**Örnek içerik kullan** (yer tutucu metin değil): Uşak, 2027 dönemi.

Ekranın omurgası **tek bir sıralı liste**. Mevcut konular ve yeni öneriler aynı listede, aynı ölçekte:

```
1.  A yatırım konusu            mevcut   78   → korunuyor
2.  Geri dönüştürülmüş elyaf    yeni     74   → ekleniyor
3.  B yatırım konusu            mevcut   71   → korunuyor
4.  Tarımsal kurutma tesisi     yeni     69   → kanıt yetersiz, koşullu
──────────────── ilk dört sınırı ────────────────
5.  C yatırım konusu            mevcut   58   → çıkıyor
6.  Diğer öneri                 yeni     55   → yedek
```

Bu listede olması gerekenler:

- **İlk dört sınırı** görsel olarak güçlü bir kesim çizgisi olsun — ama 4 ile 5 arasındaki fark küçükse bu belirsizlik de görünsün. "Bu sınır sağlam mı?" sorusu ekrandan cevaplanmalı.
- Her satırda: mevcut/yeni ayrımı, stratejik puan, kanıt yeterliliği (ayrı gösterge), sonuç etiketi (korunuyor / ekleniyor / çıkıyor / koşullu / yedek).
- **Kanıt eşiğinin altındaki aday slot dolduramaz.** Böyle bir durumda slot "boş — yeterli kanıtlı aday yok" olarak görünmeli. Bu ekranın en önemli tasarım anlarından biri; boş slot bir hata gibi değil, dürüst bir sonuç gibi görünmeli.
- **Devamlılık payı** uygulanmışsa listenin üstünde açıkça yazsın: "Mevcut konulara +5 devamlılık payı uygulandı — sürüm TR33-2027-v1". Gizli katsayı olmayacak.
- **Uç durum uyarısı:** dört konunun tamamı değişiyorsa veya hiçbiri değişmiyorsa bu ayrıca vurgulansın. İkisi de meşru ama yüksek sonuçlu çıktılar; kurulun gerekçe yazması gereken durumlar.
- Slot bazlı bir özet bandı: korunanlar / eklenenler / çıkanlar / boş kalanlar.
- Yan panelde ilin bağlamı: gelen öneri sayısı, kanıt sağlığı, veri boşlukları.

Bir satıra tıklandığında Blok 2'ye gidiliyor.

---

## BLOK 2 — Konu Detayı ve İddia-Kanıt Matrisi

Bir konunun **neden o puanı aldığının** kanıtlı açıklaması. Mevcut konu da yeni öneri de aynı şablonu kullanır.

**Örnek:** *"Tekstil kırpıklarının mekanik ve kimyasal yöntemlerle yüksek kaliteli geri dönüştürülmüş elyafa dönüştürülmesi"* — Uşak.

- Konu tanımı, öneri sahibi sayısı ve destek sayısı, NACE/GTİP etiketleri, süreç durumu rozeti.
- **İddia-Kanıt Matrisi** — sayfanın omurgası. Her satır bir atomik iddia:
  - iddia metni, türü (yerel ihtiyaç / kaynak / pazar / istihdam / ekosistem / politika / uygulanabilirlik), önem derecesi
  - değerlendirme: destekleniyor / kısmen / çelişiyor / desteklenmiyor / kanıt yetersiz
  - destekleyen kanıtlar ve **karşıt kanıtlar** ayrı ayrı — karşıt kanıt asla gizlenmez
  - sınırlılıklar (tarih, coğrafi kapsam, yöntem), "uzman incelemesi gerekli" işareti
  - her kanıt tıklanabilir: kaynak kurum, belge ve sürümü, sayfa/tablo, yayım tarihi, coğrafi kapsam
- **Kanıt kaynağı paneli** (yan çekmece): künye + kaynaktan kısa alıntı + doğrulama durumu.
- **Eksik veri** ve **çelişki** listeleri — kenara itilmiş uyarılar değil, birinci sınıf bölümler.
- **Kriter kırılımı:** sekiz kriterin her birinde bu konu kaç aldı, hangi kanıta dayanarak.
- Mevcut konular için ek bölüm: **geçen döneme göre ne değişti** — hangi kanıt yenilendi, hangi gösterge düştü, yatırımcı ilgisi veya gerçekleşme sinyali var mı.
- Dört ölçüt (birleştirme yok) ve karar/gerekçe alanı.

---

## BLOK 3 — Öneri Girişi (herkese açık)

Ürünün dönüşüm noktası. Öneren kişi bir kurum değil, bir insan — ilk kez giriyor, muhtemelen telefonundan. **Yedi bölümlü zorunlu form burada işe yaramaz.**

**İki kademe:**

1. **Hızlı öneri** — konu başlığı, birkaç cümlelik tanım, il/ilçe, "neden burada" gerekçesi. Beş dakikada bitmeli, kanıt zorunlu değil. `kanıt bekliyor` statüsüyle sisteme girer.
2. **Dosya güçlendirme** — kişi sonradan dönüp kanıt kartı ekliyor, sınıflandırmayı netleştiriyor, uygulanabilirlik alanlarını dolduruyor. Sistem ona ne eksik olduğunu ve **bunun sıralamayı nasıl etkilediğini** açıkça söylüyor: "Bu öneri şu an kanıt yeterliliği düşük; yatırımcı ilgisine dair bir belge eklerseniz uzman incelemesine girebilir."

Kanıt bir bariyer değil, **görünür bir ilerleme çubuğu**. Öneriyi güçlendirmek kullanıcının kendi çıkarına olmalı ve bu ekranda hissedilmeli.

- Üç öneri türü: yeni yatırım konusu / mevcut konunun korunması / kapsam değişikliği. Tür seçimi formu değiştirir.
- **Kanıt kartı** bileşeni buranın yıldızı: kaynak kurum, belge, sayfa/tablo, tarih, URL/dosya, gizlilik. "Bu iddia için hangi kanıt gerekir?" yardımı.
- **Benzer öneri uyarısı gönderim anında** — "yeni öneri açmak yerine buna destek ver" yolu her zaman daha kolay olsun.
- AI tarafından üretilen metin (ör. NACE önerisi) açıkça işaretli, kullanıcı onayı zorunlu.
- Kişisel veri ve gizlilik uyarısı yükleme öncesinde.
- **Destek sayısı bir puan girdisi değildir.** Arayüz onu ilgi sinyali olarak gösterir, oylama sonucu gibi değil.

---

## BLOK 4 — Uzman İnceleme

Ajans uzmanının içinde yaşayacağı ekran. AI bulgularını tek tek kabul / reddet / düzelt ediyor.

- Üçlü bölünme: solda bulgu kuyruğu (önem ve durum filtreli), ortada incelenen bulgu, sağda kaynak kanıtın kendisi.
- Karar üç seçenek + zorunlu gerekçe (reddet ve düzelt için).
- Klavye kısayolları görünür; hızlı ilerleme mümkün.
- "Bu bulgu onaylanmazsa hangi kriter puanı hesaplanamaz" ilişkisi görünsün.
- **Otomasyon yanlılığına karşı:** varsayılan seçim "kabul" olmasın, kabul butonu görsel olarak avantajlı olmasın.

---

## BLOK 5 — Puanlama, Senaryo ve Duyarlılık

- Sekiz kriter ve ağırlıkları (%15/%15/%15/%15/%10/%10/%10/%10), kullanıcı tarafından oynatılabilir.
- Ağırlık değiştikçe sıralama anlık güncellenir; ancak bunun **çalışma alanı** olduğu, karar sürümünü etkilemediği tasarımdan net anlaşılmalı. Kaydedilmemiş senaryo ile kilitli karar sürümü asla karışmamalı.
- **Devamlılık payı** burada ayarlanır ve etkisi anında görülür: pay 0 olduğunda hangi mevcut konu düşüyor?
- Hazır senaryolar: istihdam odaklı, teknoloji ve katma değer, ithalat bağımlılığını azaltma, adil geçiş, kırsal kalkınma, yeşil dönüşüm, OSB ve kümelenme, dengeli temel.
- Duyarlılık: ağırlık ±%10/±%20 oynatıldığında ilk dörtte kalma istikrarı. Amaç güzel grafik değil, **sıralamanın ne kadar kırılgan olduğunu dürüstçe göstermek**.
- 4. ile 5. arasındaki farkın anlamlı olup olmadığı özel olarak işaretlensin.

---

## BLOK 6 — Kurul Çalışma Alanı ve Karar Kilidi

- Gündem, ilk dört + yedekler, üye görüşleri, çıkar çatışması beyanı (çatışma bildiren üye ilgili puanlamada pasif görünür).
- **Sistem sıralamasından sapma:** kurul farklı karar verirse zorunlu gerekçe. Bu ekranın en ciddi anı; tasarım hafifletmemeli.
- **Kararı kilitle:** geri alınamazlığın net anlatıldığı onay adımı; kilit sonrası sayfanın salt okunur + sürüm damgalı hâli.

---

## BLOK 7 — Kişisel Hesap, Triyaj ve Kamu Portalı

**Hesap:** e-posta doğrulamalı basit kayıt. Profilde isteğe bağlı beyan alanları (kurum, sektör, uzmanlık) — hepsi doğrulanmamış, arayüzde "kişinin kendi beyanı" olarak etiketli. Kişisel pano: gönderdiğim öneriler, durumları, benden istenenler. Kamuya açık yayımda ad görünürlüğü tercihi (varsayılan: görünmez).

**Triyaj** (uzman için): yeni öneriler, otomatik benzerlik kümeleri, konu seviyesinde olmayanlar, spam işaretleri. Toplu işlem — birleştir, konu dışı kapat, revizyon iste; her biri gerekçeli ve öneri sahibine görünür.

**Kamu portalı** (giriş gerektirmeyen): il seçimiyle yayımlanmış dört konu, özet gerekçeler, kamuya açık kanıt künyeleri; yıllar arası değişim (hangi konu korundu, hangisi değişti, neden); metodoloji sayfası (kriterler, ağırlıklar, devamlılık payı, puanlamanın işleyişi). **Kamuya açık görünüm ile kurum içi görünüm arasındaki sınır görsel olarak kesin olmalı.**

---

## Her blok için teslim biçimi

Çalışan React + Tailwind + shadcn prototipi, gerçek örnek içerikle. Boş / yükleniyor / hata durumları dahil. Klavye odağı görünür, kontrast AA. Tasarım kararlarının kısa gerekçesi — özellikle jenerik çözümden neden saptığın.

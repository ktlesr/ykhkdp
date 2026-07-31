# YKH-KDP — ürün bağlamı

> Bu dosya **özet ve işaret**tir. Ürünün tek doğruluk kaynağı
> [`docs/ykh-brief.md`](../../docs/ykh-brief.md); çeliştiği yerde o geçerlidir.
> Buraya içerik kopyalanmaz — iki doğruluk kaynağı bir doğruluk kaynağı değildir.

## Platform

web

## Register

Karışık, yüzeye göre:

| Yüzey | Register | Neden |
|---|---|---|
| `/` tanıtım sayfası | **brand** | tasarım ürünün kendisi; ziyaretçinin izlenimi üretilen şey |
| diğer sekiz ekran | **product** | tasarım ürüne hizmet eder; ajans ve yatırımcı iş yapar |

Varsayılan `product`. Tanıtım sayfasında çalışırken `brand` referansı geçerlidir
ama **§1 değişmez kuralları ve §2 token'ları orada da bağlar** (bkz. `DESIGN.md`).

## Ne yapar

Yerel Kalkınma Hamlesi kapsamında her il için dört yatırım konusu belirleniyor.
Bu platform o kararın hazırlık katmanı:

```
Yatırımcı öneri verir → AI puanlar → Ajans onaylar → İl sıralamasına girer
```

Yapay zekâ **puan üretir, karar vermez**. Ürettiği her puan doğrulanmamış bir
taslaktır ve ajans onayından geçmeden sıralamaya giremez.

## Kimler kullanır

| Rol | Ne yapar |
|---|---|
| Yatırımcı | öneri verir, kendi önerisinin puanını ve dayanağını görür. Kayıt zorunlu değil (misafir). |
| Kalkınma ajansı | onaylar, reddeder, puanı ve NACE kodunu düzeltir, üst ölçekli belge yükler |
| Yönetici | ajansın her şeyi + denetim izi ve kişisel veri erişimi |

Kullanıcılar kamu görevlisi ve yatırımcı; masaüstü ağırlıklı, mobil destekli.
Ekran uzun süre açık kalır ve içeriği okunur, taranmaz.

## Ürünün doğruluk iddiası

Arayüz bu iddiaların görsel karşılığıdır; tasarım kararları buradan türer:

1. **Dört ölçüt asla birleştirilmez.** Tek bir "genel skor" rozeti yasak.
2. **Kaydedilen her alıntı, modele verilmiş bir belgede birebir geçer.**
3. **Gizli katsayı yok.** Ağırlık, devamlılık payı ve eşik ekranda yazar.
4. **Boş slot bir hata değil**, geçerli bir sonuçtur ve öyle görünür.
5. **Eksik dayanak gizlenmez.** "Dayanaksız kriter" ekranda yazar.

## Kapsam dışı

Resmî başvuru portalının veya E-TUYS'un yerine geçmez. Rapor/Excel çıktısı,
PDF/docx ayrıştırıcı, e-posta gönderimi yok.

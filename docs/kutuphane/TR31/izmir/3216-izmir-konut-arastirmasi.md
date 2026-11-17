1 / 110

## İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## --------

## 2 0 2 6

2 / 110

İZMİR’DE KONUT ARZ-TALEP DİNAMİKLERİNİN ANALİZİ VE KONUT İHTİYACININ BELİRLENMESİNE YÖNELİK BİR MODEL ÖNERİSİ 2026, İZMİR

Yayın Sahibi İzmir Kalkınma Ajansı Megapol Çarşı Kule, Halkapınar Mahallesi, 1203/11. Sk. No: 5-7, Kat: 19 35170 Konak/İzmir Tel : 0232 489 81 81 Faks : 0232 489 85 05 E-posta : bilgi@izka.org.tr

Çalışma Ekibi Prof. Dr. Ö. Burcu ÖZDEMİR SARI (Yürütücü, Orta Doğu Teknik Üniversitesi) Prof. Dr. Nil UZUN (Araştırmacı, Orta Doğu Teknik Üniversitesi) Doç. Dr. Esma AKSOY KHURAMİ (Araştırmacı, Muğla Sıtkı Koçman Üniversitesi) Simge DEMİRCİ (Bursiyer)

Grafik Tasarım Hasan Can ÇAKIR

© 2026, İZKA. Tüm hakları saklıdır. Bu eserin tamamı ya da bir bölümü, 4110 sayılı Yasa ile değişik 5846 sayılı Fikir ve Sanat Eserleri Kanunu uyarınca, kullanılmazdan önce hak sahibinden 52. maddeye uygun yazılı izin alınmadıkça, hiçbir şekil ve yöntemle işlenmek, çoğaltılmak, çoğaltılmış nüshaları yayılmak, satılmak, kiralanmak, ödünç verilmek, temsil edilmek, sunulmak, telli/telsiz ya da başka teknik, sayısal ve/veya elektronik yöntemlerle iletilmek suretiyle kullanılamaz.

Hazırlanmış olan çalışmanın tüm hakları İzmir Kalkınma Ajansı’na aittir. Bu İZKA eserinden kaynak gösterilmek suretiyle alıntı yapılabilir.

3 / 110

## İ Z M I R ’ D E KO N UT A R Z -TA L E P

D I N A M I K L E R I N I N A N A L I Z I VE KO N UT İ H T I YA C I N I N B E L I R L E N M E S I N E YÖ N E L I K B I R M O D E L Ö N E R I S I

## ________ 2026

4 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 2

## İÇINDEKILER

## 1. GİRİŞ 9

## 2. MATERYAL VE YÖNTEM 13

2.1. Makro Düzey Analiz: Veri ve Yöntem 13

2.2. Mikro Düzey Analiz: Veri ve Yöntem 16

2.3. Tematik Konular: İkincil Konutlar, Gecekondu ve Kentsel Dönüşüm 16

2.4. Konut İhtiyaç Modeli: Veri ve Yöntem 18

## 3. TR31 İZMİR BÖLGESİ’NDE KONUT SORUNLARINA İLİŞKİN MAKRO DÜZEYDE BİR

## DEĞERLENDİRME 23

3.1. Konutun Karşılanabilirliği 23

3.2. Konut Kullanım Yoğunluğu 28

3.3. Enerji Yoksulluğu 31

3.4. Konut Yoksunluğu 34

3.5. Genel Değerlendirme 38

## 4. İZMİR KENTİNDE ARZ-TALEP EĞİLİMLERİNİN İNCELENMESİ 41

4.1. Talep Tarafı: Hane Halkı Eğilimleri 41

4.2. Arz Tarafı: Konut Üretimi, Mevcut Konut Stoku, Konut Fiyatları ve El Değiştirme 48

4.3. Genel Değerlendirme 58

## 5. TR31 BÖLGESİ'NDE İKİNCİL KONUT ALANLARI VE ORANLARINA İLİŞKİN

## DEĞERLENDİRME 61

5.1. İlçe Düzeyinde İkincil Konut Alanları ve Değişimi 62

5.2. Seçilmiş İlçeler için Mahalle Kırılımında İkincil Konut Stoku Değişimi 66

5.3. Genel Değerlendirme 70

5 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 6. İZMİR'DE GECEKONDU VE KENTSEL DÖNÜŞÜM ALANLARINA İLİŞKİN

## DEĞERLENDİRME 73

6.1. Gecekondu Alanlarının Gelişimi 73

6.2. Kentsel Dönüşüm 76

6.3. Genel Değerlendirme 81

## 7. İZMİR'DE KONUT GEREKSİNİMİ VE KONUT İHTİYACI 83

7.1. İzmir ve İlçelerinde Konut Gereksinimi ve Konut İhtiyacı 83

7.2. İzmir için Konut Alanında Öncelikli Araştırma Konuları ve Alt Ölçekli Veri

Gereksinimleri 88

7.3. Genel Değerlendirme 89

## 8. DEĞERLENDİRME VE SONUÇ 93

## EK 1 95

## KAYNAKÇA 105

6 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 4

## ŞEKİL LİSTESİ

ŞEKİL 1. Hane halkı bütçesinin %30'undan fazlasını konut harcamalarına ayıran hanelerin

Düzey-2 bölgeleri içindeki oranı 24

ŞEKİL 2. Gelir gruplarının konutla ilişkili harcamalar için bütçelerinden ayırdıkları pay (%) 26 ŞEKİL 3. Hane halkı yaş gruplarına göre konut harcamalarının hane bütçesindeki payı (%) 27 ŞEKİL 4. Konut kullanım yoğunluğu aşırı ve düşük olan hanelerin Düzey-2 bölgeleri içindeki oranı (%) 29 ŞEKİL 5. %20’lik eşdeğer gelir gruplarının konut kullanım yoğunluğu (%) 30 ŞEKİL 6. Hane halkı yaş gruplarının konut kullanım yoğunluğu (%) 30 ŞEKİL 7. Ekonomik açıdan oturduğu konutun ısınma ihtiyacını karşılayamayacak durumdaki

hanelerin oranı (%) 32

ŞEKİL 8. Konut yoksunu hanelerin Düzey-2 bölgeleri içindeki oranı (%) 35 ŞEKİL 9. Türkiye’de ve İzmir Bölgesi’nde konut yoksunluğunun alt boyutlarından etkilenen haneler (%) 36 ŞEKİL 10. İzmir il bütününde ve stokun düşük nitelikli kısmında konut yoksunluğunun alt boyutlarından etkilenen haneler (%) 36 ŞEKİL 11. İzmir’de 2014-2024 döneminde hane halkı sayısı değişim oranı (%) 43 ŞEKİL 12. İzmir’de seçilmiş ilçelerin 2014-2024 döneminde hane halkı sayıları 44 ŞEKİL 13. İzmir’de üretilen konut birimi sayısı ve nüfusa eklenen hane sayısı (2014-2024) 48 ŞEKİL 14. İzmir’de yeni hane başına düşen yeni konut birimi sayısı (2014-2024) 49 ŞEKİL 15. İzmir’de üretilen konut birimlerinin ortalama konut alanı (2014-2024) 50 ŞEKİL 16. İzmir’de ilçeler bazında yeni konutlarda ortalama alan ve ilçe içinde 1 ve 2 kişilik hanelerin payı 51 ŞEKİL 17. Türkiye ve İzmir’de hane halkının ikamet ettiği binanın inşa yılı (%) 52 ŞEKİL 18. Türkiye ve İzmir’de hane halkının ikamet ettiği binanın oda sayısı (%) 52 ŞEKİL 19. 2014-2024 yılları arasında konut stoku değişim oranları (%) 54 ŞEKİL 20. 2024 yılı itibarıyla ilçeler düzeyinde kaba stok boşluk oranları (%) 55 ŞEKİL 21. 2024 yılı itibarıyla ilçeler düzeyinde net stok boşluk oranları (%) 56 ŞEKİL 22. 2025 yılı itibarıyla ilçeler düzeyinde metrekare kira ve konut satış değerleri 57 ŞEKİL 23. 2015-2024 döneminde toplam konut satışları ve toplam konut sayısı 58 ŞEKİL 24. 2024 yılı ikincil konut stoku oranı (%) 62 ŞEKİL 25. 2018-2024 yılları arasında ilçe düzeyinde ikincil konut stoku oranı değişimi (%) 64 ŞEKİL 26. 2024 yılı mahalle kırılımında ikincil konut stoku oranı (%) 65 ŞEKİL 27. Kınık ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%) 66 ŞEKİL 28. Dikili ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%) 67 ŞEKİL 29. Menderes ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%) 68 ŞEKİL 30. Çeşme ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%) 69 ŞEKİL 31. Kiraz ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%) 70 ŞEKİL 32. 1960'lı yılların sonunda İzmir merkez ilçelerde gecekonduların düzenli konuttan fazla

olduğu mahalleler 74

ŞEKİL 33. İzmir merkez ilçelerde gecekondu alanlarının gelişimi 75 ŞEKİL 34. İzmir merkez ilçelerde dönüşüm projeleri ile yenileme ve sağlıklaştırma alanları 80

7 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## TABLOLAR LİSTESİ

TABLO 1. Konut yoksunluğu göstergeleri ve ağırlıkları 15 TABLO 2. %20’lik eşdeğer gelir grupları özelinde Türkiye ve İzmir’de konut mülkiyeti biçimi 25 TABLO 3. TR31 İzmir Bölgesi’nde ev sahibi ve kiracı hanelerin konutla ilişkili harcamalar için büt-

çelerinden ayırdıkları paya göre dağılımı (%) 25

TABLO 4. TR31 İzmir Bölgesi’nde ev sahibi ve kiracı hanelerin konut kullanım yoğunluğuna göre

dağılımı (%) 29

TABLO 5. TR31 İzmir Bölgesi’nde ekonomik açıdan oturduğu konutun ısınma ihtiyacını karşılaya-

mayacak durumdaki hanelerin (enerji yoksulları) dağılımı (%) 33

TABLO 6. TR31 İzmir Bölgesi’nde oturulan konutta sızdıran çatı, nemli duvarlar veya çürümüş

pencere çerçeveleri gibi sorunların varlığı (%) 34

TABLO 7. Türkiye ve İzmir’de farklı konut yoksunluğu kategorileri (%) 36 TABLO 8. TR31 İzmir Bölgesi’nde konut yoksunluğu kategorilerinin dağılımı (%) 37 TABLO 9. İlçeler düzeyinde 2014-2024 yılları nüfus, hane halkı sayısı ve ortalama hane büyüklüğü

ile değişim oranları 42

TABLO 10. İlçeler düzeyinde 2014-2024 yılları konut birimi sayısı ve değişim oranları 53 TABLO 11. 1/25.000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı “Sağlıklaştırma-Yenileme

Program Alanları” 76

TABLO 12. 6306 sayılı yasa doğrultusunda Çevre, Şehircilik ve İklim Değişikliği Bakanlığı tarafın-

dan ilan edilen ve önerilen riskli alanlar 78

TABLO 13. 5393 Sayılı Yasanın 73. maddesi kapsamında ilan edilen kentsel dönüşüm ve gelişim

proje alanları 79

TABLO 14. Modelin Temel Değişken ve Bileşenleri 89

8 / 110

6 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Mithatpaşa, Konak

9 / 110

## YÖNE TICI ÖZ E TI

Bu çalışma, TR31 İzmir Bölgesi’nde konut sorununun yalnızca konut üretim miktarıyla açıklanamayacak, çok boyutlu ve mekânsal olarak farklılaşan bir yapı sergilediğini ortaya koymaktadır. Karşılanabilirlik, konut kullanım yoğunluğu, enerji yoksulluğu ve konut yoksunluğu başlıkları altında gerçekleştirilen analizler; özellikle kiracı haneler, düşük gelir grupları ve genç hane halkları açısından konut koşullarının giderek kırılganlaştığını göstermektedir. İzmir’de konut harcamalarının gelir içindeki payının artması, barınmanın sürdürülebilirliğini tehdit eden temel unsurlardan biri olarak öne çıkmaktadır.

Diğer yandan, hane halkı yapısındaki değişimler ve konut arzının bu dönüşüme uyum sağlayamaması, İzmir’de konut talebinin niteliğini dönüştüren bir diğer kritik faktördür. Küçülen haneler ve çeşitlenen yaşam biçimleri, daha küçük ve esnek konutlara olan ihtiyacı artırırken; mevcut üretim deseninin bu ihtiyacı yeterince karşılamadığı görülmektedir. İlçeler arasında hem konut ihtiyacının büyüklüğü hem de türü açısından belirgin farklılıklar bulunmaktadır. Özellikle merkezi ilçelerde dönüşüm ve sosyal konut ihtiyacı öne çıkmaktadır.

İkincil konutlara ilişkin bulgular, konutun kullanım biçiminde yaşanan dönüşümün İzmir’de mekânsal ve toplumsal etkiler yarattığını göstermektedir. Kıyı ve kırsal ilçelerde artan ikincil konut kullanımı, konut piyasasında fiili kullanım ile resmi stok verileri arasındaki farkı derinleştirmekte; uzaktan çalışma ve esnek yaşam pratikleri bu dönüşümü hızlandırmaktadır. Bu durum, konut politikalarının yalnızca üretim miktarına değil, konutun nasıl ve kimler tarafından kullanıldığına da odaklanması gerektiğine işaret etmektedir.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Gecekondu alanları, İzmir özelinde kentin mekânsal gelişiminde hâlen belirleyici bir rol oynamakta; özellikle dönüşüm, yenileme ve yeniden yapılaşma süreçlerinin merkezinde yer almaktadır. Bugün bu alanlar, yalnızca fiziksel riskler açısından değil, aynı zamanda mülkiyet yapısı, piyasa değeri ve sosyal kırılganlıklar bakımından da kent politikalarının öncelikli müdahale alanlarını oluşturmaktadır. Dolayısıyla gecekondu alanları, İzmir’de konut politikalarının şekillenmesinde hem risk hem de potansiyel barındıran, güncel ve stratejik bir mekânsal olgu olarak önemini korumaktadır.

Çalışmanın son aşamasında geliştirilen konut ihtiyaç modeli, mevcut piyasa dinamiklerinin İzmir’de uzun vadeli konut gereksinimini karşılamada yetersiz kalacağını ve kamu müdahalesinin kaçınılmaz olduğunu ortaya koymaktadır. Model çıktıları, sosyal konut üretimi, dönüşüm, kira destekleri ve karşılanabilirlik odaklı araçların ilçe ölçeğinde farklılaştırılarak uygulanması gerektiğini göstermektedir. Bu rapor, İzmir’de konutun yalnızca fiziksel bir üretim alanı değil, toplumsal eşitsizliğin ve mekânsal dönüşümlerin temel bir bileşeni olduğunu vurgulamakta; konut politikalarının bütüncül, hedefe duyarlı ve uzun vadeli bir perspektifle ele alınması gerektiğine işaret etmektedir.

10 / 110

8 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Yeni Girne, Karşıyaka

11 / 110

## 1. GIRIŞ

Konut, bireylere sağladığı barınma işlevinin ötesinde hem toplum hem ekonomi açısından kentsel ve bölgesel sistemlerin vazgeçilmez bir unsurudur. Konut piyasalarında yaşanan sorunlar sadece bireyleri veya toplumu değil, kentlerin ve bölgelerin ekonomik kalkınma süreçlerini de olumsuz etkilemektedir. Bu sebeple, konut piyasalarında ortaya çıkan sorunların tespiti ve ivedilikle çözümü hayatidir. Günümüzde, dünyada ve Türkiye’de ciddi bir konut krizi gözlenmektedir. Bu dönemde, diğer tüm büyük kentler ve bölgeler gibi İzmir de farklı konut sorunlarına ev sahipliği yapmaktadır. TR31 İzmir Bölgesi 2024-2028 Bölge Planı ‘Toplumsal Dirençliliğin Sürdürülebilirlik Temelinde Arttırılması’ önceliği doğrultusunda İzmir’de yaşam kalitesinin arttırılması hedefine katkı sağlamak ve diğer toplumsal ve ekonomik hedeflere destek sunmak amacı ile bu çalışma, farklı sorun ve ihtiyaçlar arasından öncelikli olanların belirlenmesi ve hedeflerin somutlaştırılabilmesi için konut sorunlarına ve ihtiyacına ilişkin güvenilir ve güncel bilgi üretmeyi amaçlamaktadır. İzmir’de Konut Arz-Talep Dinamiklerinin Analizi ve Konut İhtiyacının Belirlenmesine Yönelik Bir Model Önerisi adlı çalışma böyle bir arka planla geliştirilmiştir.

Bu çalışma, öncelikle TR31 İzmir Bölgesi için hane halkı ve konut nitelikleri üzerinden konutla ilişkili temel sorunların değerlendirmesini yapmayı ve ülke geneline kıyasla bölgede iyileştirilmesi gereken alanları ortaya koymayı hedeflemektedir. Makro ölçekli değerlendirme sonrasında, İzmir için kent ölçeğinde öncelik verilmesi gereken sorun alanlarının tarif edilmesi ve ilçeler düzeyinde konut ihtiyacını belirlemek üzere arz ve talep dinamiklerindeki eğilimler ele alınmaktadır. Konut ihtiyacı kavramı daha çok plancılar tarafından kullanılan bir kavramdır (Türel, 2012; Bramley vd., 2004). Burada ihtiyaç ile kastedilen sadece konuttan tamamen yoksun olma durumu değil (evsizler ya da yeni konut ihtiyacı gibi), aynı zamanda oturduğu konutta kabul edilebilir yaşam koşullarında bulunmama durumudur (Clarke, 2012).

Diğer bir deyişle, konut ihtiyacı, yeterli ya da kabul

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

edilebilir standartlara sahip konutlarda yaşamayan hane halkı sayısını ve yeni konut ihtiyacını bir arada gösteren bir kavramdır.

Konut ihtiyacı normatif bir kavramdır çünkü kabul edilebilir standartların tarifi toplumsal değer yargıları içerir ve bu yargılar toplumdan topluma değişir (Bramley vd., 2010; Clarke, 2012). Geleneksel olarak konut ihtiyacının ölçümünde ‘birikmiş ihtiyaç’ ve ‘yeni oluşmakta olan ihtiyaç’ şeklinde iki temel ayrım yapılır. Birikmiş ihtiyaç, mevcut durumda bir konutta oturan hane halkları arasından konut kullanım yoğunluğu yüksek olanlar (aşırı kalabalıklık), standartların altında yaşayanlar ve gizli hane halkları (aile yanında oturan haneler) gibi hane halkı – stok eşleşmesinde sorunlu olan hane halklarının ihtiyaçlarına işaret eder (Heath, 2014). Yeni oluşmakta olan ihtiyaç ise temelde yeni hane halkı oluşumu ve göç gibi konularla ilişkilidir. Bu geleneksel kavrayış doğrultusunda konut ihtiyacının hesaplanması, hesaplama yapılan dönemin sonu itibarıyla planlama yapılan alanda yaşaması ön görülen hane halkı sayısının tahmin edilmesi, hane halkı sayısındaki artışa kıyasla mevcut stokun sayı ve niteliğinin değerlendirilmesi ve belirli bir miktar (genellikle %4) boş konut sayısının da eklenerek planlama yapılan dönem sonuna kadar inşa edilmesi gereken konut sayısının hesaplanmasına dayanır (Türel, 2012).

Bu çalışmada, planlama süreçlerine altlık oluşturabilecek ve yeni konut ihtiyacıyla beraber birikmiş konut ihtiyacını da dikkate alan bir konut ihtiyaç modeli geliştirilmiştir. Bu kapsamda; göç ve yeni hane oluşumunu gözeten yeni ortaya çıkan konut ihtiyacı, standartların altında, dönüşüme ihtiyaç duyan ya da gecekondu niteliğindeki konutlardan kaynaklı birikmiş konut ihtiyacı, boş ve kullanılabilir durumdaki konut varlığı, ikincil konutların düzeyi ve yeni konut üretim performansını göz önüne alan bir model kurgulanmıştır.

12 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 10

## 1.1. Çalışmanın Önemi ve Amacı

Konut ihtiyacının tespiti, yerel ve bölgesel düzeyde konut için ayrılacak kamu kaynaklarının doğru yönlendirilmesini sağlamak için bir gerekliliktir. Konut için harcanacak kamu kaynaklarının doğru yerlerde, doğru türde ve uygun miktarda kullanılması gerekir.

Kentsel ve bölgesel planlama kapsamında yeni konut ihtiyacı, karşılanabilir konut ihtiyacı, sosyal konut ihtiyacı ile tahsis öncelikleri ve mevcut konut stokunda iyileştirme ve yenileme ihtiyacı gibi bir dizi karar kanıta dayalı olarak verilmelidir.

Ülkemizde, özellikle Kalkınma Planları kapsamında yapılan konut ihtiyacı tahminleri incelendiğinde konunun nüfus artışı kaynaklı konut ihtiyacına indirgendiği görülmekte, hane halklarının demografik kompozisyonu, mevcut stokun niteliği ve sayısı gibi konuların önemine değinilmekle birlikte bu konuların konut ihtiyaç hesabına katılmadığı anlaşılmaktadır.

Oysa konut ihtiyacını belirlemede birikmiş ihtiyacın tespiti çok önemlidir ve yeni konut üretiminin yanı sıra mevcut stokun olanaklarını ve kısıtlarını da değerlendiren bir konut ihtiyacı tahmini yapmak gerekir.

Ülkemizde gerek akademik yazında gerekse politika belgelerinde hane halkı sayısındaki artışın üretim performansı ile kıyaslanmasının ötesine geçen bir konut ihtiyaç tahmini yapılmamakta, kaba hesaplarla ortaya konulan ihtiyaç tahminlerinin ise mekânsal boyutu incelenmemektedir. Şüphesiz bu durumda veri kısıtlarının rolü büyüktür.

Veri kısıtları tüm konut araştırmaları gibi bu çalışma için de en temel sorunu oluşturmuştur. Ancak, çalışmanın temel amaçları olan TR31 İzmir Bölgesinde baskın olan konut sorunlarının ve bu sorunlardan etkilenen toplum kesimlerinin ortaya konulması, İzmir kentinde konut arz ve talep dinamiklerinin belirlenmesi, ilçeler düzeyinde konut ihtiyaç analizinin modellenmesi ve konut politikalarına yol göstermek amacıyla alt ölçeklerde yürütülmesi gereken konut araştırmaları için bir model oluşturulması kapsamı doğrultusunda çok çeşitli veri tabanı, farklı yöntemler ve araçlar kullanılarak bir araya getirilmiştir.

Çalışmada kullanılan verilerden özellikle konut stokunun sayısı, ikincil konut olarak kullanılan kısmı, ikincil

konutlardaki artma ve azalma eğilimleri ile stok boşluk oranlarının belirlenmesinde yararlanılan elektrik faturalarına ilişkin veriler büyük veri niteliğindedir.

İlçeler ve mahalleler bazında belirtilen bilgilerin derlenebilmesi için 2 farklı yıla ait, her biri 2 milyon civarında aboneden gelen yaklaşık 48 milyon satırlık fatura verisinin işlenmesi gerekmiştir. Kullanılan veri ve yöntemler çalışmanın ilgili bölümünde detaylandırılmaktadır. İZKA adına yürütülen bu çalışma, konut ihtiyacını kent ve ilçeler düzeyinde bu derece kapsamlı ve kanıta dayalı olarak ele alan ilk konut araştırmasıdır. Çalışma kapsamında, İzmir’de ilçeler düzeyinde aktif olarak kullanılan konut birimi sayısının, ikincil konut birimlerinin ve boş stok miktarının niceliksel olarak tespit edilmesi mümkün olmuştur.

Üretilen bu bilgiler, konut ihtiyacının hesaplanmasında mevcut konut stokunun olanakları ve kısıtlarını değerlendirmede oldukça kıymetli bir altlık sağlamıştır.

Çalışmada ele alınan temel araştırma soruları şunlardır:

1. TR31 İzmir Bölgesinde baskın olan konut sorunları nelerdir? 26 Düzey-2 bölgesi içinde İzmir’in bu sorun alanlarındaki konumu nedir?

2. TR31 İzmir Bölgesinde temel konut problemleri açısından hangi toplum kesimleri daha kırılgandır?

3. İzmir kentinde konut arzı ve talebi açısından ne tür sorunlar tespit edilmektedir?

4. İzmir kentinde kaçak yapılaşmış alanların birikmiş konut ihtiyacı içindeki payı nedir?

5. İzmir kentinde ikincil konut alanları ve kentsel dönüşüm potansiyeli olan alanların gelecekte konut ihtiyacının giderilmesinde ne boyutta bir katkısı olabilir?

6. İzmir ili için ilçeler düzeyinde güncel ve projeksiyon konut ihtiyacı ne düzeydedir?

7. Alt ölçekli çalışmalar yoluyla öncelikle bilgi ve veri toplanması gereken konutla ilişkili alt sorun alanları ve konular nelerdir?

13 / 110

Çalışmanın amaçlarına ulaşmak ve araştırma sorularını cevaplamak üzere altı aylık proje süresince dört temel faaliyet gerçekleştirilmiştir. Çalışmanın ilk aşaması makro ölçekli analizler yoluyla TR31 İzmir Bölgesinde konutun karşılanabilirliği, konut kullanım yoğunluğu, enerji yoksulluğu ve konut yoksunluğu konularının irdelenmesidir. Bu faaliyeti, kent düzeyinde arz-talep eğilimlerinin incelenmesi izlemiş, bu kapsamda yeni konut üretiminin nitelikleri, mevcut konut stokunun özellikleri, stok boşluk oranları, hane halkı eğilimleri, konut satışları ile konut fiyat ve kira değerleri ele alınmıştır. Üçüncü aşama, ikincil konut alanlarının ve dönüşüm alanlarının değerlendirilmesidir. İzmir, gecekondu tipi konut stokunun yoğun olduğu ve kentin özellikle sahil kesimlerinde ikincil konutların yer seçtiği bir kenttir. Bu sebeple,

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

gecekondu alanlarında, ikincil konut alanlarında ve kentsel dönüşüme konu alanlardaki konut stokunun sayısını bilmek önemli görülmüştür. Çalışmanın dördüncü faaliyeti konut ihtiyaç modelinin ve araştırma programının hazırlanmasını içermektedir. Bu kapsamda, birikmiş ve yeni konut ihtiyacı modellenmiş ve konut araştırmalarına yönelik araştırma ihtiyaçları için bir program çıkartılmıştır.

14 / 110

12 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Alpaslan, Bayraklı

15 / 110

## 2. MATERYAL VE YÖNTEM

Bu çalışma, İzmir’de mevcut durumdaki konut sorunlarını ve konut ihtiyacını ortaya koymak ve gelecekte ortaya çıkacak konut ihtiyacını belirlemek amacıyla farklı aşamalar üzerinden tasarlanmıştır. Konut konusunda iller düzeyinde konut sorunlarını bütüncül bir biçimde irdelemeye olanak sağlayacak ve konut ihtiyacının hesaplanmasında kullanılabilecek kapsamlı bir veri tabanı bulunmadığından, bu çalışmada ele alınan konular farklı veri setlerinden yararlanılarak aşama aşama incelenmiş ve son aşamada bir konut ihtiyacı modeli kapsamında bir araya getirilmiştir.

Uluslararası akademik yazında ve politika belgelerinde konut talebi (housing demand), konut ihtiyacı (housing need) ve konut gereksinimi (housing requirement) kavramları arasındaki sınırlar her zaman açık bir biçimde tanımlanmamaktadır. Bu nedenle, bu alanda gerçekleştirilen her çalışmada söz konusu kavramların nasıl ele alındığının ve çalışmanın hangi kavramsal çerçeveye dayandığının açıkça belirtilmesi gerekmektedir. Buna ek olarak, Türkçe literatürde “ihtiyaç” ve “gereksinim” kavramlarının sıklıkla eş anlamlı kullanılması kavramsal bir belirsizlik yaratmaktadır.

Bu çalışmada, söz konusu belirsizliği önlemek amacıyla analizler konut ihtiyacı genel başlığı altında ele alınmıştır. İhtiyaç kavramı, ‘birikmiş konut ihtiyacı’ (backlog housing need) ve ‘yeni ortaya çıkan konut ihtiyacı’ (newly arising need) ayrımı gözetilerek incelenmiştir.

Birikmiş konut ihtiyacı; mevcut konut stokunda aşırı kalabalık koşullarda yaşayan haneleri, konut yoksunluğu yaşayan hane halklarını ve konutun karşılanabilirliği ile ilgili sorunlar yaşayan haneleri kapsamaktadır.

Buna karşılık, yeni ortaya çıkan konut ihtiyacı, hane sayısındaki artıştan kaynaklanan konut gereksinimini ve bunun ne kadarının karşılanabilir konuta ve sosyal konuta yönelik ihtiyaç olduğunu ortaya koymayı amaçlamakta; böylece konut piyasasının geleceğine ilişkin niceliksel bir çerçeve sunmaktadır. Çalışmanın ilk aşamasında, mevcut veri tabanları kullanılarak makro ölçekte de olsa konutun karşılanabilirliği, aşırı kalabalıklık durumu, enerji yoksulluğu ve konut

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

yoksunluğu gibi birikmiş konut ihtiyacına ilişkin göstergeleri ortaya koyan bir analiz gerçekleştirilmiştir.

İkinci aşamada, kentteki arz ve talep dinamiklerinin anlaşılmasına yönelik bir değerlendirme yapılmıştır.

Bu kapsamda, hane halkı eğilimleri, konut üretim düzeyi, mevcut konut stokunun büyüklüğü ve konutların el değiştirme dinamikleri ele alınmıştır. Üçüncü aşamada, İzmir kenti için önem arz eden ikincil konut kullanımı, gecekondu alanları ve kentsel dönüşüm süreçleri incelenmiş; konut stokunun aktif olarak kullanılan bölümü, boşluk oranları ve stokun niteliğine ilişkin bilgi üretilmiştir. Son aşamada ise, elde edilen tüm bu bulgular bir araya getirilerek konut ihtiyaç modeli kurgulanmıştır. Çalışma, süreç boyunca tespit edilen veri ve bilgi eksiklikleri doğrultusunda bir konut araştırması programının geliştirilmesi önerisiyle sonuçlandırılmıştır.

## 2.1. Makro Düzey Analiz: Veri ve Yöntem

Çalışmanın birinci amacı olan TR31 İzmir Bölgesi’nde baskın olan konut sorunlarının ve bu sorunlardan etkilenen toplum kesimlerinin ortaya konulması ile ilişkili makro düzey analizleri gerçekleştirmek için, Türkiye İstatistik Kurumu (TÜİK) tarafından yaklaşık yirmi yıldır düzenli olarak uygulanan Gelir ve Yaşam Koşulları Araştırması’nın (GYKA) 2024 yılı kesit verileri kullanılmıştır. Bu veri seti, konutla ilgili çok sayıda temanın Düzey-2 bölgeleri bazında karşılaştırılmasına olanak tanımaktadır. Veri kapsamında; konuttaki mülkiyet durumu, oda sayısı, taban alanı, konut tipi, aylık konut harcaması gibi doğrudan konutla ilgili değişkenlerin yanı sıra, hane halkı büyüklüğü, tipi, fertlerin yaşı ve kullanılabilir gelir gibi sosyoekonomik bilgiler de yer almaktadır. Bunlara ek olarak, veri seti hane halklarının konut ve çevresine ilişkin öznel değerlendirmelerini de içermektedir. Ancak veri setinde, İzmir için önemli konulardan biri olan gecekondu konut tipine ilişkin doğrudan bir değişken

16 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 14

sunulmamaktadır. Buna karşın, bir dizi değişkenin bir arada incelenmesi ile gecekondu konut tipine ilişkin birtakım değerlendirmelerde bulunmak mümkün olabilmektedir. Bu kapsamda, çalışmada konut tipi, oda sayısı ve taban alanı, hane halkı gelir durumu ile konutun kira değeri göstergeleri kullanılarak konut stokunun görece en düşük nitelikli alt grubu ayrıştırılmıştır. Bu alt grubun, büyük ölçüde gecekondu niteliği taşıyan konutlardan oluştuğu ve ek olarak sınırlı sayıda kırsal nitelikli konutu da içerdiği değerlendirilmektedir. 2024 yılı GYKA verisi, ülke genelinde yaklaşık 26,9 milyon haneyi temsil etme kapasitesine sahiptir.

İzmir özelinde ise yaklaşık 1,58 milyon haneyi temsil etmektedir. Veri setinden ayrıştırılan görece düşük nitelikli stok alt grubu ise 250 bin civarında haneyi ve 680 bin civarında nüfusu kapsamaktadır.

Çalışmadaki makro düzey analizlerin her biri farklı bir analiz yaklaşımı gerektirmektedir. Bu sebeple, yönteme ilişkin açıklamalara aşağıda ilgili alt başlıklar altında ayrı ayrı yer verilmektedir.

(i) Konutun Karşılanabilirliği Bu çalışmada konutun karşılanabilirliği, oransal yöntem kullanılarak değerlendirilmiştir. Bu çerçevede, konut harcaması ile hane halkı geliri arasındaki oran esas alınarak, hane düzeyinde hesaplamalar yapılmıştır. Hanelerin kira, konut kredisi ödemesi, aidat, bakım-onarım gibi düzenli konut harcamalarının toplamı, ilgili hanenin kullanılabilir gelirine oranlanmış ve elde edilen değer %30 eşiği üzerinden değerlendirilmiştir.

Hane bütçesinin %30’undan fazlasını konut harcamalarına ayıran haneler, karşılanabilirlik sorunu yaşayan gruplar olarak sınıflandırılmıştır.

(ii) Konut Kullanım Yoğunluğu İzmir’de konut kullanım yoğunluğunun incelenebilmesi amacıyla, Eurostat yöntemi benimsenmiş ve buna uygun şekilde konut kullanım yoğunluğu değişkeni oluşturulmuştur. Eurostat tanımına göre bir hanenin yaşadığı konutun kullanım yoğunluğunun ‘uygun’ kabul edilebilmesi için aşağıdaki oda standartlarını karşılaması gerekir:

▶Hane için bir oda, ▶Her çift için bir oda,

▶18 yaş ve üzeri her bekâr birey için bir oda, ▶12-17 yaş grubundaki aynı cinsiyetten her iki birey için bir oda, ▶12-17 yaş grubunda olup yukarıdaki kategoriye uymayan her birey için bir oda, ▶12 yaşından küçük her iki çocuk için bir oda.

Bu oda standartlarını karşılayamayan haneler aşırı kalabalık, standartları 2 oda veya daha fazla aşan haneler ise düşük konut kullanım yoğunluğuna sahip olan haneler olarak sınıflandırılmaktadır (WHO, 2018).

(iii) Enerji Yoksulluğu Avrupa Birliği Enerji Yoksulluğu Danışma Merkezi (EPAH), enerji yoksulluğunu ölçmek amacıyla üç temel göstergeyi esas almaktadır. Bunlar:

▶Hanelerin konutlarını yeterince sıcak tutamaması, ▶Son 12 ay içinde ısıtma, elektrik, gaz, su vb. hizmetlere ilişkin faturalarını ödeyememesi, ▶Oturulan konutta sızdıran çatı, nemli duvarlar veya çürümüş pencere çerçeveleri gibi fiziksel sorunların varlığıdır (Gouveia vd., 2022).

Bu göstergeler GYKA verilerinde hane beyanlarına dayalı olarak doğrudan sunulan değişkenler arasında yer almaktadır. Bu çalışmada bu göstergelere ek olarak, konutlarda mevcut olan ısıtma sistemleri de ayrıca değerlendirilmiştir.

(iv) Konut Yoksunluğu Bu çalışmada, konut yoksunluğunun çok boyutlu ve göreli bir olgu olduğu dikkate alınarak, Birleşmiş Milletler Kalkınma Programı’nın (UNDP) çok boyutlu yoksulluk analizlerinde de kullanılan Alkire-Foster (2011) yöntemi ile bir konut yoksunluğu endeksi geliştirilmiştir. Bu yöntem çerçevesinde, GYKA verileri kullanılarak 3 konut yoksunluğu boyutu kapsamında 11 gösterge belirlenmiştir (Tablo 1). Alkire-Foster yaklaşımına uygun olarak, seçilen göstergelere belirli ağırlıklar atanmış ve her hane için bir yoksunluk puanı hesaplanmıştır. Yoksunluğun üç boyutunun da eşit öneme sahip olduğu varsayımıyla, her üç boyuta da toplam ağırlık eşit olarak (1/3) paylaştırılmıştır.

17 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

TABLO 1. Konut yoksunluğu göstergeleri ve ağırlıkları

| Boyut | Gösterge | Açıklama | Ağırlık |
| --- | --- | --- | --- |
| Hane-konut Eşleşmesi | Konutun karşılanabilirliği | Konut harcamaları hane bütçesinin %30’unu aşan haneler yoksun kabul edilir | 1/6 |
|  | Konut kullanım yoğunluğu | Aşırı kalabalık koşullarda yaşayan haneler yoksun kabul edilir | 1/6 |
| Konut | Isıtma sistemi | Soba, kalorifer veya klima dışındaki ısıtma sistemlerine sahip haneler yoksun kabul edilir. | 1/18 |
|  | Banyo/duş varlığı | Konut içinde müstakil ya da paylaşılan bir banyosu/duşu bulunmayan haneler yoksun kabul edilir | 1/18 |
|  | Tuvalet varlığı | Konut içinde müstakil ya da paylaşılan tuvaleti bulunmayan haneler yoksun kabul edilir | 1/18 |
|  | Sızdıran çatı, nemli duvarlar, çürümüş pencere çerçevelerinin varlığı | İlgili sorun alanında sorun beyan eden haneler yoksun kabul edilir | 1/18 |
|  | İzolasyondan kaynaklı ısınma sorunu | İlgili sorun alanında sorun beyan eden haneler yoksun kabul edilir | 1/18 |
|  | Odaların karanlık olması ya da yeterli ışık alamaması | İlgili sorun alanında sorun beyan eden haneler yoksun kabul edilir | 1/18 |
| Çevre | Yakın çevrede gürültü sorunu | İlgili sorun alanında sorun beyan eden haneler yoksun kabul edilir | 1/9 |
|  | Yakın çevrede hava ve çevre kirliliği sorunu | İlgili sorun alanında sorun beyan eden haneler yoksun kabul edilir | 1/9 |
|  | Yakın çevrede suç ve şiddet varlığı | İlgili sorun alanında sorun beyan eden haneler yoksun kabul edilir | 1/9 |

Yoksunluk puanına göre haneler şu şekilde sınıflandırılmaktadır:

▶%20 ve altında puana sahip haneler – Yoksun değil ▶%20-%33,33 arası puana sahip haneler – Yoksunluk riski altında ▶%33,33 ve üzeri puana sahip haneler – Konut yoksunu ▶%50 ve üzeri puana sahip haneler – Ağır konut yoksunu

18 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 16

## 2.2. Mikro Düzey Analiz: Veri ve Yöntem

Çalışmanın ikinci amacı olan İzmir kentinde konut arz ve talep dinamiklerinin belirlenmesi kapsamında, farklı ölçeklerde (il, ilçe, mahalle düzeyinde) çok sayıda ikincil veri kaynağından yararlanılmış; veriler karşılaştırmalı, betimsel ve mekânsal analiz yöntemleriyle değerlendirilmiştir. Çalışmada kullanılan başlıca ikincil veri kaynakları aşağıda özetlenmiştir.

▶TÜİK Adrese Dayalı Nüfus Kayıt Sistemi (ADNKS) Verileri: İlçeler düzeyinde ve yıllar itibarıyla nüfus, hane halkı sayısı, ortalama hane büyüklüğü ve hane halkı tipi verilerini incelemeye olanak sağlamaktadır.

▶TÜİK Yapı İzin İstatistikleri: İlçeler düzeyinde yapı ruhsatları temelinde, yıllar itibarıyla yapımına başlanan daire sayısı ve üretilen konut alanını incelemeye olanak sağlamaktadır.

▶TÜİK Bina ve Konut Nitelikleri Araştırması (2021):

İl düzeyinde mevcut konut stokunun kat sayısı, yaşı ve oda sayısı bilgilerini incelemeye olanak sağlamaktadır.

▶TÜİK Konut Satış İstatistikleri (2015-2024): İlçeler düzeyinde ve yıllar itibarıyla satışa konu olan konut birimlerinin sayısını ve ne kadarının ipotek kredisine konu olduğunu incelemeye olanak sağlamaktadır.

▶Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü Ulusal Adres Veri Tabanı (UAVT): Mahalleler düzeyinde ve yıl bazında konut birimi sayısını incelemeye olanak sağlar.

▶Endeksa Veri Seti (2025): İlçeler düzeyinde piyasada dolaşımda olan satılık ve kiralık konut stokunun miktarını, metrekare bazında satış ve kira değerlerini, ortalama konut yaşı ve ortalama konut alanını incelemeye olanak sağlar.

Elde edilen veriler Microsoft Excel ve SPSS programları aracılığıyla işlenmiş ve analiz edilmiştir. Bu süreçte; betimsel istatistikler (ortalama, yüzde, frekans) kullanılmıştır. Frekans tabloları ve çapraz tablolar aracılığıyla hane halkı yapısı, konut arzı ve talebindeki değişimler sistematik olarak incelenmiştir. Değişim

oranları hesaplanarak 2014-2024 döneminde ilçeler arasındaki farklılaşmalar ortaya konmuştur.

Analiz sonuçlarının daha anlaşılır kılınması için farklı görselleştirme yöntemleri kullanılmıştır. Yıllar ve ilçeler arasındaki karşılaştırmaları göstermek için sütun grafikler ve dağılım grafikleri kullanılmıştır. 30 ilçe ve 11 yıllık dönemde ortalama konut alanının mekânsal farklılıklarını göstermek amacıyla ısı haritası üretilmiş, bu süreçte yapay zekâ (ChatGPT) desteğine başvurulmuştur. Ayrıca, konut arzı ve talebine ilişkin mekânsal dağılımları göstermek amacıyla QGIS programı kullanılarak tematik haritalar hazırlanmıştır.

## 2.3. Tematik Konular: İkincil Konutlar, Gecekondu ve Kentsel Dönüşüm

## İkincil Konutların İncelenmesi: Veri ve Yöntem

Çalışmada, arz ve talep dinamiklerine yönelik irdelemenin devamı olarak ve ilçeler düzeyinde konut ihtiyacının modellenmesine katkı sağlamak amacıyla ikincil konutlara ilişkin bilgi üretilmiştir. İkincil konut, yılın tamamında kullanılmayan ve birincil konuta kıyasla daha kısa süre kullanılan konutları ifade etmektedir. Bu kapsamdaki konutlar; yazlık konut birimleri, yayla evleri ve bağ evleri gibi türevleri içermektedir. Türkiye’de ikincil konutların tespitine olanak tanıyan birincil veri kaynaklarının bulunmaması, benzer birçok çalışmada olduğu gibi bu araştırmanın da önemli bir kısıtını oluşturmaktadır. Bu nedenle İzmir’deki ikincil konut stokunun sorgulanabilmesi amacıyla GDZ Elektrik'ten temin edilen elektrik faturaları ve tüketim verileri kullanılarak çok aşamalı bir analiz süreci yürütülmüştür.

Birinci aşamada, GDZ Elektrik’ten temin edilen sayaç numarası bazlı, ilçe ve mahalle kırılımındaki elektrik tüketim verileri 2018 ve 2024 yılları için incelenmiştir.

Kesitsel nitelikteki ham veri, aynı sayacın farklı aylarda gözlemlenmesine imkân tanıyacak şekilde, sayaç

19 / 110

numarası temelinde yeniden düzenlenmiş ve 2018 ile 2024 yılları için iki ayrı panel veri seti oluşturulmuştur.

2018 yılına ait Balçova ve Bayraklı ilçelerine ilişkin verilere ulaşılamaması nedeniyle bu iki ilçe yalnızca 2024 yılı kapsamında değerlendirilmiştir. Analizde mesken (konut ve şehit-gazi konutları) abone grubunda yer alan kullanıcılar dikkate alınmış; sayaç numarası eksik olan faturalamalar veri setinden çıkarılmıştır. Bu eleme sonucunda, örneğin Çeşme ilçesinde 2024 yılına ait 48432 adet mesken abonesinden 154'ü sayaç numarası bulunmaması nedeniyle panel veri setinden çıkarılmış, kalan 48278 sayaç analize dahil edilmiştir. Bu sayı ilçelere göre farklılık göstermekle birlikte, oransal olarak sınırlı düzeydedir. Sonuç olarak il genelinde, 2018 ve 2024 yıllarına ait toplam 2 milyonun üzerinde sayaç, 24 aylık bir dönem boyunca incelenmiştir.

Veri seti kapsamında çok sayıda yeni değişken üretilmiştir. İlk olarak elektrik tüketiminin gerçekleştiği aylar (1) ve gerçekleşmediği aylar (0) ikili (binary) bir sistemle yeniden kodlanmıştır. Ardından, sayaç numarası bazında bir yıl içerisinde tüketimin gerçekleştiği ay (fatura) sayısı hesaplanmıştır. Tüketimin gerçekleştiği ay sayısı ile bu ayların yıl içindeki dağılımı birlikte değerlendirilerek, hangi konut birimlerinin ikincil konut niteliği taşıdığı belirlenmiştir. İkincil konutların tespitinde temel varsayım, ikincil konut olarak kullanılan bir birimin yıllık kullanım süresinin birincil konutu aşmaması gerektiği yaklaşımına dayanmaktadır. Bu doğrultuda, ikincil konut olarak kullanılan bir birimde yıllık fatura sayısının 6'yı geçmemesi beklenmektedir. İkinci varsayım ise İzmir Su ve Kanalizasyon İdaresi’nden temin edilen aylık su tüketim verileri aracılığıyla ikincil konut kullanımının dönemsel olarak belirlenmesine dayanmaktadır. Bu kapsamda, özellikle kıyı ilçelerinde su tüketiminin artış gösterdiği, en yüksek düzeye ulaştığı ve ardından belirgin bir düşüşün gözlemlendiği aylar dikkate alınarak İzmir'de ikincil konut kullanım dönemi Mayıs-Eylül ayları arası olarak tanımlanmıştır. Bu bulgu, ikincil konut kullanımının yalnızca Haziran – Ağustos aylarını kapsayan dar bir yaz sezonu ile sınırlı olmadığını, daha geniş bir dönem boyunca sürdüğünü göstermektedir.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Bir konut biriminin ikincil konut olarak kabul edilebilmesi için, elektrik tüketiminin gözlemlendiği ayların çoğunluğunun (en az %50’sinin) Mayıs-Eylül dönemine denk gelmesi koşulu aranmıştır. Bu doğrultuda, oluşturulan panel veri setinde ikincil konut birimlerinin varlığı aşağıdaki mantıksal ifade kullanılarak sorgulanmıştır:

Mantıksal ifade 1: (р1 ∩ q1) р1∩q1: (Toplam fatura sayısı≤6) ∩ (Yaz dönemi fatura sayısı≥(0,5 x Toplam fatura sayısı))

Bu ifade doğrultusunda, ikincil konut olarak kullanılan bir konut biriminin yıllık fatura sayısının 6'yı geçmemesi ve bu faturaların en az yarısının Mayıs- Eylül döneminde gerçekleşmesi gerekmektedir. Bu yöntem aracılığıyla konut birimlerinin ikincil konut niteliği taşıyıp taşımadığı ve yıl içindeki fatura sayıları belirlenmiştir.

## Gecekondu ve Kentsel Dönüşüm Alanlarının İncelenmesi: Veri ve Yöntem

Çalışmanın İzmir’de gecekondu ve kentsel dönüşüm alanlarına ilişkin değerlendirme bölümü, ağırlıklı olarak nitel araştırma yöntemlerinden doküman taraması ve ikincil veri analizi yaklaşımına dayanmaktadır. Bu kapsamda, Türkiye’de ve İzmir özelinde gecekondu alanlarının ortaya çıkışı, gelişimi ve dönüşümünü ele alan akademik yayınlar, kitaplar, doktora ve yüksek lisans tezleri ile kurumsal raporlar sistematik olarak incelenmiştir. Literatür taraması sürecinde, gecekondu olgusunun tarihsel gelişimi, yasal düzenlemeler, planlama yaklaşımları ve kentsel dönüşüm politikaları temel tematik başlıklar olarak ele alınmış; ulusal ölçekteki dönüşüm süreçleri ile İzmir’deki mekânsal yansımalar birlikte değerlendirilmiştir.

Doküman taramasına ek olarak, kamu kurumları ve yerel yönetimlere ait resmi internet siteleri önemli bir veri kaynağı olarak kullanılmıştır. Bu doğrultuda, İzmir Büyükşehir Belediyesi’nin plan raporları, kentsel dönüşüm ve yenileme alanlarına ilişkin açıklamaları, Çevre, Şehircilik ve İklim Değişikliği Bakanlığı tarafından ilan edilen riskli alan kararları ve ilgili mevzuat metinleri incelenmiştir. Özellikle 2009 yılında hazırlanan 1/25.000 ölçekli İzmir Kentsel Bölge Nazım İmar

20 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 18

Planı açıklama raporu ile 6306 sayılı Kanun kapsamında yayımlanan riskli alan verileri, İzmir’de gecekondu alanlarının planlama sistemi içerisindeki konumunun ve dönüşüm süreçlerinin ortaya konulmasında temel referanslar olarak değerlendirilmiştir.

Elde edilen yazılı ve dijital veriler, tarihsel dönemler ve yasal-kurumsal kırılma noktaları dikkate alınarak karşılaştırmalı ve bütüncül bir çerçevede analiz edilmiştir.

Bu analiz sürecinde, gecekondu alanlarının yalnızca mekânsal bir sorun olarak değil; toplumsal, ekonomik ve yönetsel boyutlarıyla ele alınması hedeflenmiştir.

Böylece İzmir’de gecekondu alanlarının tarihsel sürekliliği, dönüşüm pratikleri ve güncel kentsel dönüşüm politikaları arasındaki ilişkiler, mevcut planlama belgeleri ve literatür ışığında değerlendirilmiştir.

## 2.4. Konut İhtiyaç Modeli: Veri ve Yöntem

Çalışmanın önceki aşamalarında elde edilen veri ve bulgular, konut ihtiyacını ve konut üretim gereksinimini ilçeler düzeyinde ele alan; mevcut durumu analiz etmenin yanı sıra 25 yıllık bir planlama dönemi için öngörüler üreten bir modelin geliştirilmesinde kullanılmıştır. Model, birikmiş konut ihtiyaçları ile gelecekte ortaya çıkması beklenen ihtiyaçları birlikte ele alan bütünleşik bir çerçeveye sahiptir. Bu çerçevede konut sorunu yalnızca yeni konut üretimi üzerinden değil; mevcut konut stokunun niteliği, kullanım biçimleri ve hane halklarının sosyo-ekonomik koşulları ile birlikte değerlendirilmektedir.

Bu yaklaşım, konut ihtiyacını "kaç konut üretileceği" sorusunun ötesine taşıyarak, hangi tür konutlara, hangi müdahale biçimleriyle ve hangi önceliklerle ihtiyaç duyulduğunu ortaya koymayı amaçlamaktadır.

Model, piyasa koşullarında gerçekleşen konut üretimi ile kamu müdahalesini (sosyal konut, karşılanabilirlik destekleri, dönüşüm ve yenileme uygulamaları) birlikte değerlendiren bir karar destek aracı olarak kurgulanmıştır.

İlçeler düzeyinde konut ihtiyacının modellenmesi, kullanılması gerekli olan veri setlerinin çeşitliliği ve kapsamı nedeniyle oldukça karmaşık bir süreçtir.

Ayrıca modelde yer alan bazı bileşenlerin (örneğin sosyal konut miktarı) doğrudan politika ve planlama kararlarına bağlı olması, modelleme sürecini daha da zorlaştırmaktadır. Bu nedenle öncelikle modelde kullanılan değişkenlerin ve temel bileşenlerin tanımlanması, ardından ise modelin dayandığı varsayımların açık biçimde ortaya konulması gerekli görülmüştür.

Model, mevcut konut stokunu ve hane halkı yapısını başlangıç noktası alan; zaman içinde ortaya çıkan yeni hane oluşumları, stok kayıpları ve yenileme gereksinimleri ile şekillenen bir stok-akış yaklaşımına dayanmaktadır. Bu kapsamda aşağıda sunulan değişkenler ve bileşenler, modelin hesaplama mantığını oluşturmaktadır.

## Stok Değişkenleri

Konut Birimi Sayısı: Konut birimi sayısı, GDZ Elektrik Verileri üzerinden yapılan analizler sonucunda elde edilmiştir. Bu değişken, 2024 yılı itibarıyla elektrik sayacı bulunan bağımsız birimleri ifade etmektedir.

UAVT verilerinin aksine, metruk durumda olan ya da inşaatı henüz tamamlanmamış konut birimleri GDZ Elektrik Verileri içerisinde yer almamaktadır. Bu sayade, konut stokunun fiilen kullanılan kısmının daha sağlıklı biçimde tespit edilmesi mümkün olabilmektedir. Konut birimi sayısı, ikincil konutları ve boş durumdaki konut stokunu da kapsamaktadır.

İkincil Konut Sayısı: İkincil konut sayısı, GDZ Elektrik Verileri kullanılarak Bölüm 2.3'te açıklanan yöntem doğrultusunda elde edilmiştir. Bu konutlar, yılın sınırlı bir bölümünde kullanılan ve ana konut işlevi görmeyen birimleri ifade etmektedir. Dolayısıyla model kapsamında kullanılabilir konut stokunun hesaplanmasında, toplam konut birimi sayısından düşülmesi gereken bir değişken olarak ele alınmıştır.

Gecekondu Nitelikli Konut Sayısı: İzmir'de ilçeler düzeyinde gecekondu sayısına doğrudan erişmeyi sağlayan güncel bir veri tabanı bulunmamaktadır.

Mevcut bilgiler büyük ölçüde eski çalışmalara ya da çeşitli tahminlere dayanmaktadır. Bu çalışmada, İzmir Büyükşehir Belediyesi tarafından 2009 yılında 1/25.000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı Revizyonu Açıklama Raporu kapsamında derlenen

21 / 110

veriler, mevcut bilgiler içerisinde en kapsamlı ve tutarlı kaynak olarak değerlendirilmiştir. Ancak verinin 2009 tarihli olması ve kent genelinde yürütülen kentsel dönüşüm uygulamalarına ilişkin detaylı yıkım/ yapım bilgilerinin eksikliği nedeniyle bu veri modelde doğrudan bir girdi olarak kullanılmamıştır. Bunun yerine gecekondu yoğunluğu bilinen ilçelerin ayırtedilmesi ve bu ilçelere özgü karşılanabilirlik, konut yoksunluğu ve aşırı kalabalıklık oranlarının uygulanması amacıyla referans alınmıştır.

Boş Stok Tahmini: Boş stok miktarı, 2024 yılı konut birimi sayısından ikincil konutlar çıkarıldıktan sonra elde edilen ana konut stokundan, yine 2024 yılına ait hane halkı sayısının düşülmesiyle tahmin edilmiştir.

Bu değişken, analiz edilen dönemde kullanımda olmayan ancak fiziksel olarak kullanılabilir durumdaki konutları ifade etmektedir.

Ortalama Yıllık Konut Birimi Üretimi: Ortalama yıllık konut birimi üretiminin belirlenmesinde TÜİK tarafından yayımlanan Yapı İzin İstatistiklerinden yararlanılmıştır. İkamet amaçlı binalarda yapı ruhsatına göre daire sayıları 2010-2024 dönemi için derlenmiş ve bu döneme ilişkin yıllık ortalama üretim hesaplanmıştır.

Konutun Yaşına İlişkin Tahminler: Konut yapılarının yaşına ilişkin en güncel veri, il düzeyinde bilgi üreten 2021 Bina ve Konut Nitelikleri Araştırması'ndan elde edilmiştir. Bu verinin ilçeler düzeyine aktarımında, tüm ilçelerin il geneline benzer bir yaş dağılımı gösterdiği varsayımı benimsenmiştir. Bununla birlikte, kentin görece çeperinde yer alan ve daha geç gelişen ilçelerde eski stok oranının fiili durumda daha düşük olması beklenmektedir. 1984 ve 2000 bina sayımları da incelenmiş; ancak zaman içinde gerçekleşen idari sınır değişiklikleri nedeniyle, en tutarlı yaklaşımın il düzeyindeki yaş dağılım oranlarının ilçelere uygulanması olduğu değerlendirilmiştir. Bu kapsamda 1980 öncesi, 1981-2000 dönemi ve 2001 sonrası inşa edilmiş konut birimleri ayrı ayrı tahmin edilmiştir.

## Hane Halkı Değişkenleri

Hane Halkı Sayısı: Hane halkı sayıları, 2024 yılı itibarıyla TÜİK Adrese Dayalı Nüfus Kayıt Sistemi (ADNKS) verilerinden elde edilmiştir.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

2025-2050 Dönemi Hane Halkı Projeksiyonları: 25 yıllık planlama dönemine ilişkin hane halkı artış projeksiyonları, beşer yıllık alt dönemler halinde İZKA nüfus projeksiyonlarından (İZKA, 2024) alınmıştır.

Bu çalışmada projeksiyonlarda yer alan resmi göç senaryosu (S2) kullanılmıştır. Söz konusu senaryo, İzmir'in ulusal ve uluslararası göç hareketlerini net göç yaklaşımıyla ele almakta, ancak Suriyeli geçici koruma altındaki nüfusu kapsam dışı bırakmaktadır.

Projeksiyonlar seçilmiş 6 ilçe, 12 ilçeden oluşan metropol alan ve İzmir il bütünü için üretilmiştir. Metropol alan içerisindeki 12 ilçe ile hakkında doğrudan projeksiyon bulunmayan ilçelerin hane halkı sayıları, 2024 yılı ilçe hane halkı payları esas alınarak dağıtılmıştır.

## Modelin Temel Bileşenleri

Yeni Hane Kaynaklı Gereksinim: Yeni hane kaynaklı gereksinim, 25 yıllık planlama dönemi sonunda beklenen toplam hane halkı artışına eşit kabul edilmiştir.

Karşılanabilir Konut İhtiyacı (Mevcut Haneler ve 25 Yıllık Dönem): Çalışmada konutun karşılanabilirliği, konutla ilişkili harcamaların (kira, kredi ödemesi, aidat vb.) hane halkı bütçesinin %30'unu aşmaması ölçütü üzerinden tanımlanmıştır. Karşılanabilirlik sorunu yaşayan hanelerin oranları, çalışmanın 2.1 bölümünde sunulan makro düzey analizlerden elde edilmiştir. Bu kapsamda, stokun tamamı ile görece düşük nitelikli kesimi için iki ayrı oran kullanılmıştır. Karşılanabilir konut ihtiyacı hesaplanırken, karşılanabilirlik sorunu yaşayan hanelerin tamamının değil, %85'inin bu kapsamda bir müdahaleye ihtiyaç duyduğu varsayılmıştır. Ülkemizde mevcut yasal ve kurumsal çerçeve dikkate alındığında, bu ihtiyacın önemli bir bölümünün yeni konut üretiminden ziyade kira yardımı, kira denetimi gibi politika araçlarıyla karşılanabileceği değerlendirilmektedir.

Sosyal Konut İhtiyacı (Mevcut Haneler ve 25 Yıllık Dönem): Sosyal konut ihtiyacı, mevcut haneler arasında konutun karşılanabilirliği, aşırı kalabalıklık ve konut yoksunluğu sorunlarını eş zamanlı olarak yaşayan hanelerden kaynaklanan normatif bir ihtiyaç olarak tanımlanmıştır. Bu hanelere ilişkin oranlar yine çalışmanın 2.1 bölümündeki makro düzey analizlerden türetilmiş; stokun geneli ve düşük nitelikli kesimi

22 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 20

için ayrı oranlar kullanılmıştır. Sosyal konut ihtiyacı içerisinde değerlendirilen bu kesim, tüm konut ihtiyacı bileşenleri içerisinde aciliyet düzeyi en yüksek olan temel konut ihtiyacı sahiplerini temsil etmektedir. İzmir örneğinde evsizliğin de bu kapsamda değerlendirilmesi gerekmekle birlikte, evsizliğe ilişkin sağlıklı ve güncel veri bulunmadığından modele dahil edilememiştir. Türkiye'de sosyal konut üretimi ağırlıklı olarak sübvanse edilmiş satılık konut biçiminde gerçekleşmektedir. Bununla birlikte, TOKİ'nin 2025 yılında İstanbul için başlattığı sosyal kiralık konut uygulaması ile bazı belediyelerin sınırlı sayıdaki kiralık sosyal konut denemeleri, sosyal kiralık konut üretiminin de mümkün olabileceğine işaret etmektedir.

Dönüşüm / Yenileme İhtiyacı: Dönüşüm ve yenileme ihtiyacı, mevcut konut stokunun yaşına bağlı olarak belirlenmiştir. Afet riskleri yüksek olan İzmir kenti için özellikle güncel deprem yönetmeliğine uygun olmayan 2000 yılı öncesi yapılmış konutların yenilenme gereksinimi öncelikli olarak değerlendirilmiştir.

Bu kategori, yeni imarlı alanlar açılmasından ziyade mevcut yapılaşmış alanlarda yıkım ve yeniden yapımı kapsamaktadır. Bu süreçte, yapılacak yıkımların kısa vadede mevcut konut stoku üzerinde baskı yaratabileceği göz önünde bulundurulmalıdır. Bayraklı, Buca ve Gaziemir ilçelerinde ise dönüşüm ve yenileme ihtiyacı, yapı yaşı kriterinden ziyade gecekondu niteliğindeki yapıların yoğunluğu temel alınarak değerlendirilmiştir. Bunun nedeni, söz konusu ilçelerde yapı yaşı esas alınarak yapılan hesaplamaların, gecekondu alanlarının dönüşüm ihtiyacını yeterince yansıtmamasıdır.

Kullanılabilir Boş Stok Miktarı: Tahmin edilen boş stok, analiz edilen dönemde kullanılmayan ancak kullanılabilir durumdaki konutları ifade etmektedir.

Bununla birlikte, bu konutların bir kısmının dönüşüm veya yenileme kapsamında yıkılması gereken stokla çakışabileceği varsayılmıştır. Bu nedenle tahmin edilen boş stokun tamamı değil, %50'sinin konut gereksiniminin karşılanmasında kullanılabileceği kabul edilmiştir. Ayrıca, her konut piyasasında hane halkı hareketliliği ve beklenmedik talep artışlarına yanıt verebilmek amacıyla belirli bir boşluk oranının korunması gerektiği varsayılmış; bu oran

uluslararası yazında yaygın biçimde kabul edilen %4 olarak alınmıştır.

Yeni Hane ve Yenileme Kaynaklı Gereksinim: Bu bileşen, 25 yıllık dönem boyunca ortaya çıkması beklenen yeni hane kaynaklı gereksinim ile dönüşüm/ yenileme ihtiyacının toplamını ifade etmektedir.

2050'ye Kadar Özel Sektör Üretimi İle Karşılanacak Gereksinim Düzeyi: Yeni hane ve yenileme kaynaklı toplam gereksinimden, kamu tarafından karşılanması öngörülen 25 yıllık sosyal konut ihtiyacının düşülmesiyle elde edilen gereksinim düzeyidir.

## Modelin Çıktıları

Mevcut Üretim Düzeyi ve Boş Stokla Karşılanan / Karşılanmayan Gereksinim: Bu çıktı, 2050'ye kadar özel sektör tarafından karşılanması beklenen gereksinim düzeyinin, kullanılabilir boş stok ve 25 yıllık piyasa üretimi ile karşılaştırılması sonucu elde edilmiştir. Pozitif değerler, ilgili konut piyasasında mevcut üretim düzeyinin ve boş stok miktarının gereksinimi karşılamaya yetmeyeceğini; negatif değerler ise piyasa koşullarında bu gereksinimin karşılanabileceğini göstermektedir. Bu sonuçlar, "kaç konut üretileceği" sorusundan ziyade, herhangi bir müdahale yapılmaması durumunda konut gereksiniminin piyasa koşullarında karşılanıp karşılanamayacağını irdelemek amacıyla değerlendirilmelidir.

2050'ye Kadar Karşılanması Gereken Sosyal Konut İhtiyacı: Bu çıktı, mevcut stokta birikmiş sosyal konut ihtiyacı ile 25 yıllık dönemde ortaya çıkması beklenen sosyal konut ihtiyacının toplamını ifade etmektedir.

Sunulan değerler, sosyal konut ihtiyacının en acil şekilde karşılanması gereken hane halkı kesimlerini temsil etmektedir.

2050'ye Kadar Politika Tedbiri Geliştirilmesi Gereken Hane / Stok Düzeyi: Bu gruptaki haneler ve konutlar, toplam gereksinim hesapları içerisinde yer almakta; bu kesim için ayrıca yeni konut ya da sosyal konut üretimi öngörülmemektedir. Ancak bu hane halklarının mevcut konutlarında konutla ilişkili giderlerini karşılayabilmeleri için ekonomik destek ve düzenleyici politika araçlarına ihtiyaç duyduğu değerlendirilmektedir.

23 / 110

## Modelin Varsayımları

1. Yeni hane kaynaklı gereksinim, gelecek dönemlerde oluşması beklenen hane halkı sayısına eşittir.

2. Mevcut karşılanabilir konut ihtiyacı, il veya ilçede karşılanabilirlik sorunu yaşayan hanelerin %85'ini kapsamaktadır.

3. Sosyal konut ihtiyacı, karşılanabilirlik, aşırı kalabalıklık ve konut yoksunluğu sorunlarını bir arada yaşayan hanelerin %85'ini içermektedir.

4. Gelecek döneme ait karşılanabilir konut ihtiyacı, il veya ilgili ilçedeki karşılanabilirlik oranı kullanılarak ve bu sorunu yaşaması muhtemel hanelerin %85'i esas alınarak hesaplanmıştır.

5. Dönüşüm / yenileme ihtiyacının, 25 yıllık dönemde 1980 öncesi yapılmış konutların %50'si, 1981-2000 döneminde yapılmış konutların ise %20'si için geçerli olduğu varsayılmıştır. Bayraklı, Buca ve Gaziemir ilçeleri için gecekondu nitelikli konut birimi sayısı, dönüşüm/ yenileme ihtiyacı yerine kullanılmıştır.

6. Boş stokun bir bölümünün dönüşüm/yenileme ihtiyacı ile örtüşebileceği dikkate alınarak, tahmin edilen boş stokun %50'sinin konut gereksinimini karşılamada kullanılabilir olduğu kabul edilmiştir.

7. Konut piyasasının işleyişini sürdürebilmesi için her dönemde %4 oranında zorunlu konut boşluğu bulunması gerekli görülmüştür.

Varsayımlarda kullanılan oranların, yönetimlerin politika tercihleri, finansman olanakları ve uygulama kapasitesine bağlı olarak artırılması ya da azaltılması

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

mümkündür. Yenileme veya dönüşüm kapsamında üretilen konutların bir bölümünün sosyal konut olarak değerlendirilmesi halinde, bu üretiminin hem sosyal konut ihtiyacını hem de yenileme ihtiyacını karşılayacağı; dolayısıyla hesaplamalarda mükerrer sayımdan kaçınılması gerektiği vurgulanmalıdır. Gecekondu niteliğinde konutların yoğunlaştığı ilçelerde mevcut durum hesaplarında, düşük nitelikli konut piyasasına özgü karşılanabilirlik, aşırı kalabalıklık ve konut yoksunluğu oranları uygulanmıştır.

Bu çalışma kapsamında geliştirilen konut ihtiyaç modeli, hesaplama sürecinin bütün aşamalarını içerecek biçimde bir elektronik tablo (Excel) ortamına aktarılmıştır. Söz konusu dosyada, modelde kullanılan tüm stok ve hane halkı değişkenleri, temel bileşenler, çıktı göstergeleri, kullanılan oranlar ve varsayımlar açık biçimde yer almakta; İzmir il bütünü ile birlikte 30 ilçe için ayrı ayrı hesaplamalar yapılabilmektedir.

Dosya, her bir değişkene ilişkin hesaplama formüllerini hücre bazında içerecek şekilde kurgulanmış olup, modelin işleyişinin izlenmesine, varsayımların değiştirilmesi durumunda sonuçların nasıl farklılaştığının görülmesine ve alternatif politika senaryolarının değerlendirilmesine imkân tanımaktadır.

24 / 110

22 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Bayraklı

25 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 3. TR31 İZMIR BÖLGESI’NDE KONUT SORUNLARINA İLIŞKIN MAKRO DÜZEYDE BIR DEĞERLENDIRME

Bu bölümde, TR31 İzmir Bölgesi’nde öne çıkan konut sorunları ile bu sorunlar karşısında daha kırılgan olan toplum kesimlerinin hangileri olduğu incelenmektedir. Değerlendirmeler, birbiriyle yakından ilişkili dört ana tema çerçevesinde yapılmaktadır. Bunlardan ilki, konutun karşılanabilirliğidir. Bu kapsamda, hane halklarının konutun fiyatını, kirasını ve yaşam döngüsü maliyetlerini karşılamada güçlük yaşayıp yaşamadıkları ele alınmaktadır. İkinci tema, konut kullanım yoğunluğudur. Bu başlık altında, hane halklarının ödedikleri bedele karşılık yaşadıkları konutların sunduğu yaşam alanının büyüklük açısından yeterliliği değerlendirilmektedir. Üçüncü tema ise enerji yoksulluğudur. Bu bağlamda, hane halklarının konutlarını ısıtma maliyetlerini karşılamada yaşadıkları zorluklar irdelenmektedir. Son olarak, konut yoksunluğu başlığı altında; konutun ve çevresinin fiziksel nitelikleri ile hane-konut eşleşmesinden kaynaklanan ekonomik ve fiziksel sorunların genel bir değerlendirmesini sunan yoksunluk endeksine yer verilmektedir.

Bu bölümde sunulan analizlerin bir kısmı hem TR31 İzmir Bölgesi’ndeki tüm konut stokunu hem de bu stok içerisinde yer alan en düşük nitelikli konut kesimini kapsayacak şekilde hazırlanmıştır. Orijinal veri setinde gecekondu niteliğindeki konutların doğrudan tespitine olanak veren bir değişken bulunmamakla birlikte; konut tipi, oda sayısı ve taban alanı, hane halkı gelir durumu ile konutun kira değeri gibi göstergeler kullanılarak konut stokunun görece en düşük nitelikli alt grubu ayrıştırabilmektedir. Bu alt grubun, büyük ölçüde gecekondu niteliği taşıyan konutlardan oluştuğu ve ek olarak sınırlı sayıda kırsal nitelikli konutu da içerdiği değerlendirilmektedir.

## 3.1. Konutun Karşılanabilirliği

## Tanım ve Kavramsal Çerçeve

Konutun karşılanabilirliği, bireylerin veya hane halklarının gelir düzeylerine bağlı olarak bir konutu satın alabilme ya da kiralayabilme kapasitesini ifade etmektedir. Herhangi bir konut piyasasında konut arzı fiziksel olarak yeterli düzeyde olsa bile, bu konutların erişilebilir fiyatlarda olmaması durumunda konut ihtiyacını gidermek mümkün olamamaktadır. Bu nedenle, OECD ve UN-Habitat gibi uluslararası kuruluşlar, konut ihtiyacına yönelik modellerde karşılanabilirlik ölçütlerinin mutlaka dikkate alınması gerektiğini vurgulamaktadır. Konutun karşılanabilirliği, konut hakkı kapsamında tarif edilen yeterli konutun yedi temel koşulundan biridir (Birleşmiş Milletler, 1991).

Konutun karşılanabilirliğinin tanımı ve ölçümüne ilişkin uluslararası düzeyde tam bir uzlaşı bulunmamaktadır (OECD, 2021). Bunun en temel sebebi, konutun karşılanabilirliğinin konut masrafları, konutun kalitesi, hane geliri gibi birden fazla konuyu kapsaması ve kiracılar, kendi evinde oturanlar ve ilk kez ev sahibi olacaklar için farklı anlamlar taşımasıdır (Özdemir Sarı ve Aksoy Khurami, 2023). Karşılanabilirlik, genel olarak belirli bir konut standardının hane halkı gelirine aşırı yük getirmeksizin sağlanabilmesi biçiminde tanımlanmaktadır (Maclennan ve Williams, 1990).

Bununla birlikte, yalnızca konut harcamasının düzeyi değil, aynı zamanda hane halklarının konut dışı diğer temel harcamalar için ayırabildiği bütçe de önem taşımaktadır (Hancock, 1993; Stone, 2006). Diğer bir ifadeyle, gelirlerinin belirli bir oranından fazlasını konut için harcamak zorunda kalan hanelerde karşılanabilirlik sorunu ortaya çıkmaktadır (Hulchanski, 1995). Bu kapsamda OECD ve AB ülkelerinde karşılanabilirliği ölçmek amacıyla çeşitli yöntemler

26 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 24

kullanılmaktadır. Bunlar arasında; konut fiyatı/gelir oranı, kira/gelir oranı ve konut harcaması/gelir oranı gibi ‘oransal yaklaşımlar’, ‘artık gelir yaklaşımı’ (konut harcamaları sonrasında elde kalan gelir düzeyi), konut kalitesi göstergeleri ve öznel göstergeler (hane halkı beyanları) yer almaktadır (OECD, 2021). Pek çok ülke, bu yöntemlerden bir veya birkaçını konutun karşılanabilirliğini izlemek ve değerlendirmek amacıyla kullanmaktadır.

Türkiye’de ise bu türden ölçütlerin kamu politikaları kapsamında sistematik biçimde uygulanmadığı bilinmektedir. Ancak, özellikle TOKİ tarafından sunulan sosyal nitelikli konut projelerinde, aylık ödeme tutarlarının hane halkı bütçesinin %30’unu aşmaması gerektiği yönündeki yaklaşım dikkat çekmektedir.

OECD (2021), kamu politikalarının etkinliğinin artırılabilmesi amacıyla, konut harcamalarının mülkiyet türü, bölgesel farklılıklar ve gelir dağılımı temelinde ayrıştırılmasını önermektedir.

## Bulgular

Bu çalışmada, hane bütçesinin %30’undan fazlasını konut harcamalarına ayıran haneler karşılanabilirlik sorunu yaşayan gruplar olarak ayırt edilmiştir.

Bu doğrultuda, 2024 yılı itibarıyla Türkiye genelinde hane halklarının %19,9’unun karşılanabilirlik sorunu yaşadığı görülmektedir. TR31 İzmir bölgesinde ise bu oran %23,3’e ulaşarak ülke ortalamasının üzerinde seyretmektedir. 26 Düzey-2 bölgesi arasında İzmir, konutun karşılanabilirliği açısından en sorunlu 5. bölge konumundadır (Şekil 1). İzmir konut stokunun görece daha düşük nitelikli kesiminde ise hanelerin %28,6’sının karşılanabilirlik sorunu yaşadığı görülmektedir.

ŞEKİL 1. Hane halkı bütçesinin %30'undan fazlasını konut harcamalarına ayıran hanelerin Düzey-2 bölgeleri içindeki oranı

20 %

0 TR61

TR10 TRC1 TR22 TR31

TR42

TR52

TR32

Türkiye

TR62

TRC2 TR51 TR21 TR33 TR63 TR71

TRB1 TR41

TR90

TRA1

TR81

TRB2

TR82

TR72 TRC3

TR83 TRA2

27 / 110

İzmir Bölgesi %52,5 ev sahipliği oranıyla ülke ortalamasının (%54,4) bir miktar altında kalmaktadır. Bölgede hane halklarının %30,5’i kiracı konumundayken, bunu %16,3 ile ev sahibi olmayan ancak ailesine/akrabasına ait bir konutta kira ödemeden oturan haneler izlemektedir. Türkiye gibi ev sahipliğine geçişte konut kredisi kullanımının sınırlı olduğu ve kiracı oranlarının yüksek seyrettiği konut piyasalarında karşılanabilirlik sorunlarının daha belirgin olması beklenen bir durumdur. Diğer yandan, konut stokunun görece daha düşük nitelikli kesiminde ev sahipliği oranının il geneline kıyasla daha düşük olduğu (%42,1), buna karşın hanelerin %33,7’sinin kiracı, %24,2’sinin ise ailesine/akrabasına ait bir konutta kira ödemeden oturduğu görülmektedir. Büyük ölçüde gecekondu niteliği taşıyan konutlardan oluştuğu değerlendirilen bu kesimde, kiracılık oranlarının yanı sıra

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

kira ödemeden oturan hane halklarının yüksek oranları da dikkat çekmektedir. Bu durum, gecekondu alanlarında birden fazla konut sahipliğinin ya da ana yapıya sonradan eklenmiş bağımsız bölümlerin varlığına işaret edebilecek bir gösterge olarak değerlendirilmektedir.

Tablo 2’de, 2024 yılı itibarıyla %20’lik eşdeğer hane halkı gelir grupları bazında konut mülkiyet durumu Türkiye ve İzmir için sunulmaktadır. Tablo 2 incelendiğinde, İzmir bölgesinde özellikle en düşük iki gelir grubunda (1. ve

2. %20’lik dilimler) ev sahipliği oranlarının ülke geneline kıyasla belirgin şekilde düşük olduğu görülmektedir.

En alt %20’lik gelir grubunda ise kiracılık baskın konut mülkiyet biçimi olarak öne çıkmaktadır. Gelir dilimi en alt %20’lik gelir grubundan en üst %20’lik gelir grubuna doğru giderken ev sahipliği oranlarının düzenli bir şekilde arttığı, kiracılık oranlarının ise azaldığı görülmektedir.

TABLO 2. %20’lik eşdeğer gelir grupları özelinde Türkiye ve İzmir’de konut mülkiyeti biçimi (satır yüzdeleri*)

|  | Türkiye |  | İzmir |  |
| --- | --- | --- | --- | --- |
| Gelir Grupları | Ev Sahibi | Kiracı | Ev Sahibi | Kiracı |
| 1. %20 (en alt) | 45,3 | 36,2 | 37,3 | 47,1 |
| 2. %20 | 54,8 | 27,1 | 45,9 | 32,2 |
| 3. %20 | 55,7 | 27,6 | 55,5 | 25,6 |
| 4. %20 | 57 | 26,9 | 58,2 | 26,9 |
| 5. %20 (en üst) | 59,2 | 28 | 58,8 | 26,8 |

Kaynak: GYKA 2024 ham verilerinden üretilmiştir. * %100’e tamamlanmayan satırlarda fark ‘lojman’ ve ‘diğer’ mülkiyet kategorilerinden kaynaklanmaktadır.

Konut mülkiyet biçimlerine göre yapılan ayrıştırılmış analizler (Tablo 3), TR31 bölgesindeki kiracı hanelerin %48’inin konutun karşılanabilirliği açısından sorun yaşadığını, buna karşılık kendi evinde oturan hanelerde bu oranın yalnızca %1,2 düzeyinde kaldığını ortaya koymaktadır. Diğer bir deyişle, İzmir bölgesinde ev sahibi

olan hanelerin büyük ölçüde konutun yaşam döngüsü maliyetlerini karşılayabildiği görülmektedir. Buna karşın kiracı hanelerin yaklaşık yarısı, bütçelerinin %30’undan fazlasını konut harcamalarına ayırmak zorunda kalmaktadır.

TABLO 3. TR31 İzmir Bölgesi’nde ev sahibi ve kiracı hanelerin konutla ilişkili harcamalar için bütçelerinden ayırdıkları paya göre dağılımı (%)

| Mülkiyet | %0-19 | %20-29 | %30-39 | %40 ve üstü | Toplam |
| --- | --- | --- | --- | --- | --- |
| Ev Sahibi | 98,3 | 0,5 | 0,6 | 0,6 | 100 |
| Kiracı | 30,3 | 21,7 | 16,7 | 31,3 | 100 |
| Toplam | 66,1 | 10,6 | 8,3 | 15 | 100 |

28 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 26

Tablo 3’de, eşik değer olan %30’un altındaki %20-29 bandı, karşılanabilirlik sorunu yaşama riski taşıyan grupları temsil etmektedir. Bu gruplar hâlihazırda sorun yaşamıyor olsalar da, gelir kaybı ya da konut harcamalarında artış gibi olumsuz durumlar karşısında kırılgan hale gelebilirler. TR31 Bölgesi’nde kiracı hanelerin %21,7’si bu risk altındaki grupta yer almaktadır. Özetle, kiracılar arasında önemli bir kesim, ekonomik kırılganlık eşiğinde yer almakta ve gelir ya da kira düzeyinde yaşanabilecek olumsuz değişimlerden doğrudan etkilenme riski taşımaktadır. Öte yandan, kiracılar arasında konut harcamalarının bütçedeki payının %40 ve üzerinde olduğu büyük bir kesim dikkat çekmektedir. Kiracılar arasında karşılanabilirlik sorununun bu denli yaygın olması, İzmir konut piyasasında ev sahipliğine geçişin birçok hane için erişilemez hale geldiğini göstermektedir.

Şekil 2, eşdeğer gelir gruplarının konutla ilişkili harcamalar için bütçelerinden ayırdıkları payı göstermektedir. Buna göre, en düşük gelir grubundaki hanelerin yarısından fazlası (%54,3), ikinci %20’lik gelir grubundaki hanelerin ise önemli bir bölümü (%38,3) konut harcamaları için bütçelerinin %30’undan fazlasını ayırmaktadır. Buna karşılık, en yüksek %20’lik gelir grubundaki hanelerin %85,2’si konuta bütçelerinin %20 ’sinden daha azını harcamaktadır. Gelir düzeyi arttıkça konut harcamalarının hane bütçesindeki yükünün giderek azaldığı görülmektedir. Bu bulgular, düşük gelirli hane halkları açısından konut harcamalarının orantısız bir mali yük oluşturduğunu, barınma maliyetlerinin bu gruplar için gelirle karşılanabilirliğinin oldukça düşük seviyede olduğunu göstermektedir.

ŞEKİL 2. Gelir gruplarının konutla ilişkili harcamalar için bütçelerinden ayırdıkları pay (%)

%20 %20

%20 1. 2. 3. 4. 5. %20 %20 Eşdeğer Gelir Grupları

% 0-19 % 20-29 % 30-39 % 40 ve üstü

29 / 110

Hane halklarının yaş gruplarına göre konut harcamalarının bütçeleri içindeki payları incelendiğinde (Şekil 3), özellikle genç hanelerin (15-24 yaş ve 25-34 yaş arası) konut harcamaları açısından ciddi bir karşılanabilirlik sorunu yaşadığı görülmektedir. 15-24 yaş aralığındaki genç hanelerin yalnızca %28’i konuta bütçelerinin %0-19’unu ayırmakta; buna karşın yaklaşık %70’i eşik değer olan %30’un üzerinde konut harcaması yapmaktadır. Bu oran, genç yetişkin hanelerde de (25-34 yaş) oldukça yüksektir. Bu gruptaki

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

hanelerin %37,2’si bütçelerinin %30’undan fazlasını konut harcamalarına ayırmaktadır.

Şekil 3’ten ayrıca, yaş ilerledikçe konut harcamalarının bütçedeki yükünün azaldığı görülmektedir. Özellikle 65 yaş ve üzeri hanelerin yaklaşık %80’i, konut harcamaları için bütçelerinin yalnızca %0-19’unu ayırmakta ve yüksek harcama yapan hane oranı belirgin bir biçimde düşmektedir. Bu eğilim, yaşla birlikte artan ev sahipliği oranı ile ilişkilendirilebilir.

ŞEKİL 3. Hane halkı yaş gruplarına göre konut harcamalarının hane bütçesindeki payı (%)

15-24 yaş 25-34 yaş 35-44 yaş

45-64 yaş 65 yaş ve üstü

Hane Halkı Yaşı

% 0-19 % 20-29 % 30-39 % 40 ve üstü

30 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 28

## 3.2. Konut Kullanım Yoğunluğu

## Tanım ve Kavramsal Çerçeve

Konutun karşılanabilirliği kadar, konut için yapılan harcamalar karşılığında elde edilen konut niteliği ve yaşam standardı da önemlidir. OECD’ye göre konut niteliğinin önemli boyutlarından biri, oturulan konutun hanedeki bireylere sağladığı yaşam alanıdır (OECD, 2025). Konutun bireylere yeterli fiziksel alan sunması, aynı zamanda konut hakkının bir bileşeni olan ‘yaşamaya elverişlilik’ ilkesinin de bir parçasıdır (Birleşmiş Milletler, 1991). Konut kullanım yoğunluğu, konutun oda sayısının hane halkının büyüklüğü ve kompozisyonu açısından yeterli alan sağlayıp sağlamadığını ölçen bir göstergedir (Aksoy Khurami ve Özdemir Sarı, 2025). Bu bağlamda, hem aşırı kalabalık kullanım hem de düşük kullanım yoğunluğu temel sorun alanları olarak değerlendirilir. Ancak, konut ihtiyacının belirlenmesinde esas olarak odaklanılan konu aşırı kalabalık yaşam koşullarıdır (Clarke, 2012).

Bunun başlıca nedeni, aşırı kalabalıklığın bireylerin fiziksel ve ruhsal sağlığı üzerindeki olumsuz etkilerinin doğrudan gözlemlenebilir olmasıdır (Myers vd. 1996).

Ülkeler konut kullanım yoğunluğunu izlemek için farklı ölçütler benimsemiştir. Bazı göstergeler yalnızca oda başına düşen kişi sayısı gibi yalın oranlara dayanırken, bazıları hane yapısı, bireylerin yaşı ve cinsiyeti ile konutun oda sayısı arasındaki daha karmaşık ilişkileri dikkate alır (Aksoy Khurami ve Özdemir Sarı, 2025). Türkiye’de bu konuda resmi olarak benimsenmiş bir ölçüt bulunmamaktadır. Ancak Avrupa Birliği İstatistik Ofisi (Eurostat), GYKA verilerini kullanarak aşırı kalabalıklık ve düşük kullanım yoğunluğu göstergelerini yıllar bazında ülke düzeyinde hesaplamaktadır.

## Bulgular

Bu çalışmada, konut kullanım yoğunluğunun belirlenmesinde Eurostat yöntemi benimsenmiştir. Bu doğrultuda, 2024 yılı itibarıyla Türkiye’deki hanelerin %23,6’sı aşırı kalabalık konut koşullarına, %17,6’sı ise düşük konut kullanım yoğunluğuna sahiptir. Diğer bir deyişle, hanelerin yaklaşık %41’i yaşadıkları konutla uygun bir eşleşme sağlayamamaktadır (Şekil 4). İzmir özelinde bakıldığında, aşırı kalabalık konut koşullarında yaşayan hanelerin oranı %18,6 ile ülke ortalamasının altındayken, düşük kullanım yoğunluğuna sahip hanelerin oranı %19,6 ile ülke ortalamasının üzerindedir. Etkilenen nüfus açısından bakıldığında ise İzmir’de nüfusun %31,5’i aşırı kalabalık, %11,7’si düşük kullanım yoğunluğu koşullarından etkilenmektedir.

Bu çerçevede, İzmir’de hanelerin %38,2’si, nüfusun ise %43’ü hane-konut eşleşmesi açısından sorunlu koşullarda yaşamaktadır. Görece daha düşük nitelikli konut stoku incelendiğinde, bu stokta yaşayan haneler için aşırı kalabalıklık oranının %36,4’e yükseldiği, söz konusu olumsuz konut koşullarından etkilenen nüfus oranının ise %60,5’e ulaştığı görülmektedir.

Buna karşılık, bu konut stokunda yaşayan haneler arasında düşük kullanım yoğunluğuna sahip hane bulunmamaktadır. Bu bulgular, gecekondu niteliği taşıdığı değerlendirilen konut alanlarında aşırı kalabalık yaşam koşullarının oldukça yaygın olduğuna işaret etmektedir.

31 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

ŞEKİL 4. Konut kullanım yoğunluğu aşırı ve düşük olan hanelerin Düzey-2 bölgeleri içindeki oranı (%)

35 %

TR90

TRC3

TRC2

TRB2

TRC1 TR63

TRA2

TRB1

TR72

TR51

TR71 TR82 TR83 TRA1 Türkiye

TR52

TR62

TR31

TR10

TR81

TR42

TR21

TR33

TR61

TR32

TR22

TR41

Aşırı Kalabalık Düşük Yoğunluklu

Tablo 4’te İzmir’de ev sahipleri ve kiracılar için konut kullanım yoğunluğu verileri sunulmaktadır. Kiracılar, beklenebileceği gibi, ev sahiplerine kıyasla daha yüksek oranda aşırı kalabalık koşullarda yaşamaktadır.

Ancak mülkiyet türüne göre yapılan karşılaştırmalar, özellikle ev sahiplerinin düşük konut kullanım yoğunluğu açısından dikkat çekici bir farka sahip olduğunu göstermektedir. Piyasadaki konut seçeneklerinin

kısıtlı ya da finansal mekanizmaların işleyişi açısından konut değiştirmenin kolay olmadığı durumlarda, ev sahiplerinin yaşam döngüsü değişikliklerinin (çocukların evden ayrılması gibi) konut tercihlerine yansıyamadığı ve düşen hane halkı büyüklüğüne rağmen hanelerin mevcut konut büyüklüğünü koruduğu bilinmektedir.

TABLO 4. TR31 İzmir Bölgesi’nde ev sahibi ve kiracı hanelerin konut kullanım yoğunluğuna göre dağılımı (%)

| Mülkiyet | Aşırı Kalabalık | Uygun | Düşük Yoğun | Toplam |
| --- | --- | --- | --- | --- |
| Ev Sahibi | 17,1 | 58,7 | 24,2 | 100 |
| Kiracı | 19,4 | 68,7 | 11,9 | 100 |
| Toplam | 18,6 | 61,8 | 19,6 | 100 |

32 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 30

Şekil 5’te eşdeğer gelir gruplarının aşırı kalabalıklık ve düşük konut kullanım yoğunluğu oranları sunulmaktadır. Buna göre, en düşük %20’lik gelir grubundaki hanelerin aşırı kalabalıklık oranı %29,2 ile en yüksektir.

En yüksek %20’lik gelir grubunda ise düşük kullanım

yoğunluğu oranı %30,5 ile en yüksek düzeydedir.

Başka bir ifadeyle, konut harcamalarına bütçelerinden en fazla payı ayıran en düşük %20’lik gelir grubu, ödedikleri bedel karşılığında diğer gruplara kıyasla daha kalabalık koşullarda yaşamaktadırlar.

ŞEKİL 5. %20’lik eşdeğer gelir gruplarının konut kullanım yoğunluğu (%)

20 % 15

%20 1. 2. 3. 4. 5. %20 %20

%20 %20

Eşdeğer Gelir Grupları Aşırı Kalabalık Düşük Yoğun

ŞEKİL 6. Hane halkı yaş gruplarının konut kullanım yoğunluğu (%)

20 % 15

15-24 yaş 25-34 yaş 35-44 yaş Hane Halkı Yaşı 45-64 yaş 65 yaş ve üstü Aşırı Kalabalık Düşük Yoğun

33 / 110

Şekil 6’da konut kullanım yoğunluğu hane halkı yaş gruplarına göre incelenmektedir. Aşırı kalabalık konut koşullarının özellikle 35-44 yaş (%26,1) ve 45-64 (%22,6) yaş aralığındaki orta yaşlı haneler arasında daha yaygın olduğu görülmektedir. Bu hane halklarının çoğunlukla çocuklu çekirdek ailelerden oluştuğu düşünüldüğünde, aşırı kalabalıklığın özellikle çocukları olumsuz etkileyebileceği söylenebilir. Ortalama hane büyüklüğü daha düşük olan genç ve yaşlı haneler için ise düşük konut kullanım yoğunluğu daha yaygındır. Genç (15-24 yaş) ve genç yetişkin (25-34 yaş) hanelerde düşük konut kullanım yoğunluğunun oranı %21,5 civarındayken, 65 yaş ve üzeri hanelerde bu oran %31’i aşmaktadır.

Şekil 6’daki bulgular, konutun karşılanabilirliği konusundaki bulgularla birlikte değerlendirildiğinde, düşük konut kullanım yoğunluğuna sahip 65 yaş ve üstü grubun konutta fazladan alana sahip olmasının ekonomik açıdan bir sorun oluşturmadığı, buna karşılık konut harcamalarının gelir içindeki payı oldukça yüksek seyreden 15-24 yaş ve 25-34 yaş aralığındaki genç haneler için bu durumun daha büyük bir ekonomik yük getirdiği söylenebilir. Konutun karşılanabilirliği açısından sorun yaşadığı bilinen genç hanelerin yaklaşık beşte birinin düşük konut kullanım yoğunluğuna sahip olması, aynı zamanda konut stokunun oda sayısı açısından yeterince çeşitlenmemesinin de bir sonucu olarak değerlendirilmektedir.

## 3.3. Enerji Yoksulluğu

## Tanım ve Kavramsal Çerçeve

Enerji yoksulluğu, gelişmiş ülkeler açısıdan genellikle konutlarda enerji harcamasının hane halkı gelirine oranla yüksek olması ya da hanelerin ekonomik nedenlerle enerji tüketimini kısıtlamak zorunda kalması durumunu ifade eder. Konut harcamalarının hane bütçesi üzerindeki aşırı yükü ile enerji yoksulluğu arasında güçlü bir ilişki bulunmaktadır. Artan konut maliyetleri ve binalardaki enerji verimliliği sorunları, kırılgan haneler için maddi yükü artırmakta ve temel enerji hizmetlerine erişimi sınırlamaktadır (Ozdemir ve Koukoufikis, 2025). Bu çerçevede enerji yoksulluğu,

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

hanelerin temel sosyal ve maddi ihtiyaçlarını karşılayacak düzeyde ve kalitede enerjiye mevcut gelirleriyle erişememesi durumudur. Bu kavram; elektrik, yakıt ve doğalgaz yoksulluğu gibi alt başlıkları da içermektedir. (Erdoğdu, 2024).

Avrupa Birliği Enerji Yoksulluğu Gözlemevi (EPOV), enerji yoksulluğunu ölçmek amacıyla harcamaya dayalı, hane halkı beyanına dayalı ve doğrudan ölçüme dayalı olmak üzere üç başlık altında 28 gösterge belirlemiştir. Bu göstergeler daha sonra Avrupa Birliği Enerji Yoksulluğu Danışma Merkezi (EPAH) tarafından güncellenmiştir. Bu kapsamda Avrupa Birliği’nde enerji yoksulluğu özellikle ekonomik nedenlerle konutunu yeterince ısıtamayan hanelerin oranı, enerji faturalarını ödemekte zorlanan hanelerin oranı ve konutun fiziksel durumu gibi göstergelerle izlenmektedir. Bir konut piyasasında enerji yoksulluğunun düzeyinin belirlenmesi, hem konutun yaşam döngüsü maliyetlerinin karşılanabilirliğini değerlendirmek hem de konutun fiziksel özellikleri sebebiyle enerji yoksulluğuna yol açıp açmadığını analiz etmek açısından önemlidir.

## Bulgular

İzmir’de hanelerin büyük çoğunluğu (%55,6) ısıtma sistemi olarak kat kaloriferi veya kombi gibi bireysel sistemlere sahiptir. Müşterek ya da merkezi ısıtma türünden kalorifer sistemlerine sahip hanelerin oranı sadece %7 civarındadır. Buna karşın, hanelerin %11,5’i klima kullanmakta, %25,1’i ise soba-kömür, gaz, doğalgaz, elektrik vb. ile evinin ısınmasını sağlamaktadır. Diğer türden bir ısıtma sistemine sahip ya da hiç ısıtma sistemi olmayan hanelerin oranı ise %0,8’dir.

Konut stokunun görece düşük nitelikli kesiminde ise ısıtma sistemi olarak %80,1 oranında soba-kömür, gaz, doğalgaz, elektrik vb. kullanılmaktadır. Isınma ihtiyacını karşılamak için bireysel sistemlere bağımlı olan kentlerde enerji yoksulluğunun izini sürmek görece daha zordur. Bunun en temel sebebi, hanelerin gelir kısıtları doğrultusunda bireysel sistemleri yönetmesi ve gelirleri ölçüsünde ısınma ihtiyaçlarını kısıtlamasıdır. Diğer yandan, İzmir görece daha ılıman iklim özelliklerine sahip olduğu için enerji yoksulluğunun daha az gözlenmesi olasıdır.

34 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 32

GYKA verileri ile enerji yoksulluğu göstergelerinden ilki olan hane halkı beyanlarına dayalı olarak hanelerin ekonomik açıdan ısınma ihtiyacını karşılayabilecek durumda olup olmadığı incelendiğinde, İzmir’de hanelerin %14,8’inin (stokun düşük nitelikli kesiminde %39’unun) ekonomik açıdan ısınma ihtiyacını karşılayabilecek durumda olmadığı görülmektedir (Şekil 7). Bu oran her ne kadar Türkiye ortalaması (%14,2) ile fazla farklılaşmasa da, İzmir Bölgesi ülke sıralamasında bu gösterge açısından en kötü 12. bölge durumundadır.

Enerji yoksulluğunun bu göstergesi ısıtma sisteminin türüne göre değerlendirildiğinde, ekonomik açıdan

konutun ısınma ihtiyacını karşılayamayacak durumda olduğunu beyan eden hanelerin en yüksek oranla (%29) konutunun ısınmasını bireysel olarak soba, kömür, gaz, doğalgaz, elektrik vb. ile sağlayanlar arasında görüldüğü, bunu ısınmak için klima kullanan hanelerin (%23,4) takip ettiği görülmektedir. Diğer yandan, bireysel kalorifer, kat kaloriferi veya kombi kullanan hanelerin %8,2’si, merkezi ısıtma kullanan hanelerin ise sadece %2,5’i bu konuda olumsuzluk beyan etmiştir. Konutunda ısıtma sistemi olmadığını beyan eden tüm haneler aynı zamanda ısınma masraflarını karşılayamayacak durumunda olduğunu da belirtmiştir.

ŞEKİL 7. Ekonomik açıdan oturduğu konutun ısınma ihtiyacını karşılayamayacak durumdaki hanelerin oranı (%)

TRA1

TRB2

TRC2

TRA2

TRC1

TRC3

TR63 TR71 TR62 TR90

TR33 TR31

Türkiye

TR10 TR10 TR61

TR83

TR72

TR81

TR22

TR21

TR82

TR51

TR42

TR41 TRB1

TR32

35 / 110

TR31 İzmir Bölgesi’nde ekonomik açıdan oturduğu konutun ısınma ihtiyacını karşılayamayacak durumdaki hanelerin (enerji yoksulları) dağılımı farklı kırılımlarda incelendiğinde (Tablo 5), mülkiyet türleri içinde en çok ev sahibi olmayan ama kira da ödemeyen haneler (%20,4) ile kiracı hanelerin (%17,3) enerji yoksulluğu

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

açısından sorun bildirdiği; gelir grupları açısından ise özellikle en dar gelirli kesimlerde konutunun ısınma ihtiyacını ekonomik sebeplerle karşılayamayacak durumda olan hanelerin oranının yüksek olduğu (%35,2 ve %22,5) görülmektedir.

TABLO 5. TR31 İzmir Bölgesi’nde ekonomik açıdan oturduğu konutun ısınma ihtiyacını karşılayamayacak durumdaki hanelerin (enerji yoksulları) dağılımı (%)

| Enerji Yoksulluğu Gösterge 1 | Enerji Yoksulu | Enerji Yoksulu Değil | Toplam |
| --- | --- | --- | --- |
| Ev Sahibi | 11,8 | 88,2 | 100 |
| Kiracı | 17,3 | 82,7 | 100 |
| Ev sahibi değil ama kira ödemiyor | 20,4 | 79,6 | 100 |
| 1. %20 | 35,2 | 64,8 | 100 |
| 2. %20 | 22,5 | 77,5 | 100 |
| 3. %20 | 16,1 | 83,9 | 100 |
| 4. %20 | 7,9 | 92,1 | 100 |
| 5. %20 | 1,6 | 98,4 | 100 |
| 15-24 yaş | 13,3 | 86,7 | 100 |
| 25-34 yaş | 12,3 | 87,7 | 100 |
| 35-44 yaş | 18,3 | 81,7 | 100 |
| 45-64 yaş | 14,7 | 85,3 | 100 |
| 65 yaş ve üstü | 13,4 | 86,6 | 100 |

Hane yaşı açısından bu gösterge için çok belirgin farklılaşmalar gözlenmemekle birlikte, özellikle 35- 44 yaş grubu için ısınma ihtiyacının karşılanmasında diğer gruplara göre daha fazla zorluk yaşandığı görülmektedir. İzmir özelinde, bu grubun yaklaşık %70’ini çocuklu çekirdek ailelerin oluşturduğu ve çocuklu hanelerde ısınma ihtiyacının görece daha fazla olduğu bilinmektedir.

Enerji yoksulluğunun diğer bir göstergesi olan enerji faturalarını ödemekte zorlanan hanelerin oranı incelendiğinde TR31 İzmir Bölgesi’nin (%6,7) Türkiye ortalamasının (%13) oldukça altında seyrettiği görülmektedir. Bu gösterge mülkiyet biçimleri ve gelir grupları açısından irdelendiğinde, farklı hane tipleri açısından

değerlerin çok fazla farklılaşmadığı ancak kiracıların ev sahiplerine kıyasla ve en dar gelirli kesimlerin diğer gelir gruplarına kıyasla fatura ödemelerinde daha sık sorunlar yaşadığı görülmüştür. Diğer yandan, stokun görece daha düşük nitelikli kesiminde yaşayan haneler arasında enerji faturalarını ödemekte zorlananların oranı %12,7’dir.

Enerji yoksulluğu açısından konutun fiziksel durumunun bir sorun yaratıp yaratmadığını incelemek açısından GYKA verilerinde hane beyanlarına dayalı olarak sunulan oturulan konutta sızdıran çatı, nemli duvarlar veya çürümüş pencere çerçeveleri gibi fiziksel sorunların varlığı da ayrıca incelenmiştir. Bu gösterge açısından TR31 İzmir Bölgesi’nin (%22,4)

36 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 34

Türkiye ortalamasına (%29) kıyasla iyi durumda olduğu görülmektedir. Ancak stokun görece daha düşük nitelikli kesiminde bu sorunu yaşayan hanelerin

oranının %48’e ulaştığı görülmektedir. Tablo 6’da bu gösterge farklı hane halkı kırılımlarında detaylı incelenmektedir.

TABLO 6. TR31 İzmir Bölgesi’nde oturulan konutta sızdıran çatı, nemli duvarlar veya çürümüş pencere çerçeveleri gibi sorunların varlığı (%)

| Konutta sızdıran çatı, nemli duvarlar veya çürümüş pencere çerçeveleri varlığı | Sorun Var | Sorun Yok | Toplam |
| --- | --- | --- | --- |
| Ev Sahibi | 19,5 | 80,5 | 100 |
| Kiracı | 24,8 | 75,2 | 100 |
| Ev sahibi değil ama kira ödemiyor | 27,3 | 72,7 | 100 |
| 1. %20 | 35,4 | 64,6 | 100 |
| 2. %20 | 31 | 69 | 100 |
| 3. %20 | 25,9 | 74,1 | 100 |
| 4. %20 | 15,7 | 84,3 | 100 |
| 5. %20 | 10,8 | 89,2 | 100 |
| 15-24 yaş | 18,3 | 81,7 | 100 |
| 25-34 yaş | 17,4 | 82,6 | 100 |
| 35-44 yaş | 23,1 | 76,9 | 100 |
| 45-64 yaş | 25,8 | 74,2 | 100 |
| 65 yaş ve üstü | 19,7 | 80,3 | 100 |

Bu kapsamda, özellikle ev sahibi olmayan hanelerin, düşük gelirli grupların ve orta yaşlı hanelerin enerji yoksulluğuna yol açabilecek konut koşullarına sahip olduğu görülmektedir. Her ne kadar bölge ortalaması Türkiye geneline kıyasla daha iyi bir portre çizse de özellikle dar gelirli gruplar açısından konut niteliğinin hem doğrudan sağlığı tehdit edebilecek özelliklere sahip olduğu hem de enerji kayıpları nedeniyle enerji yoksulluğuna yol açtığı görülmektedir.

## 3.4. Konut Yoksunluğu

## Tanım ve Kavramsal Çerçeve

Konut yoksunluğu, çalışmanın bu bölümünde ele alınan diğer temaları kapsayıcı ve bütünleştirici bir üst çerçevedir. Karşılanabilirlik, konut kullanım yoğunluğu ve enerji yoksulluğu konularının her biri tek başına konut ihtiyacının bir yönünü yansıtsa da, birlikte ele alındıklarında bir hanenin barınma açısından ne derece dezavantajlı durumda olduğunu çok boyutlu bir biçimde ortaya koyarlar. Bu nedenle, konut yoksunluğu bu göstergeleri bir araya getirerek bileşik bir gösterge sunar.

37 / 110

Tıpkı karşılanabilirlik gibi, konutun kendisine ve bulunduğu yere ait özellikler de konut hakkı kapsamında tanımlanan yeterli konut koşulları arasında yer alır.

Bu bağlamda, bir hanenin yaşadığı konutun ve bu konutun sunduğu hizmetlerin toplumun geneline kıyasla daha düşük standartlara sahip olması konut yoksunluğu olarak değerlendirilir. Kabul edilebilir yaşam koşullarını karşılamayan bir konutta oturmak, konut ihtiyacının bir göstergesi sayılır (Clarke, 2012;

Heath, 2014).

Çok boyutlu bir olgu olan konut yoksunluğu, genellikle şu üç eksende ele alınır:

▶konutun fiziksel/yapısal nitelikleri, ▶konut çevresindeki koşullar ve ▶hane ile konut arasındaki fiziksel ya da ekonomik uyumsuzluklar (Özdemir Sarı, 2025).

Bu doğrultuda, konut yoksunluğunu ölçen çalışmalarda, hane halklarının sahip olmadığı belirli unsurlar sıklıkla ‘aritmetik toplama’ yoluyla birleştirilir (Güven ve Özdemir Sarı, 2023). Ancak bu yaklaşımlar, toplumu yalnızca ‘yoksun’ ve ‘yoksun olmayan’ şeklinde ikiye ayırdığı için eleştirilmektedir. Oysa yoksunluk, farklı düzey ve derecelerde ortaya çıkan çok boyutlu bir durumdur (Betti vd., 2015).

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## Bulgular

Bu çalışmada, konut yoksunluğunun çok boyutlu ve göreli bir olgu olduğu kabul edilerek, Alkire-Foster (2011) yöntemi ile bir konut yoksunluğu endeksi geliştirilmiştir. Endeks; hane-konut eşleşmesi göstergeleri ile konutun ve çevresinin niteliklerini temel alan değişkenlerin bileşiminden oluşmaktadır. 2024 yılı itibarıyla, Türkiye genelinde hane halklarının %18,5’inin konut yoksunu olduğu görülmektedir. TR31 İzmir Bölgesi’nde ise bu oran %16,8 düzeyinde olup, Türkiye ortalamasının biraz altındadır. Ancak İzmir, 26 Düzey-2 bölgesi içinde en yüksek konut yoksunlunluğu oranına sahip 9. bölge konumundadır (Şekil 8).

Bu durum, İzmir’in konut koşulları açısından Türkiye ortalamasına göre daha avantajlı olsa da, bölgeler arasında ortalama düzeyde bir konuma sahip olduğunu göstermektedir. Nitekim %25 düzeyinde konut yoksunu hane oranına sahip İstanbul’a kıyasla İzmir daha iyi durumdayken, %12 seviyesindeki Ankara’ya göre ise belirgin biçimde daha olumsuz bir tablo sergilemektedir. Diğer yandan, İzmir’in görece daha düşük nitelikli konut stokunda yaşayan haneler arasında konut yoksunluğu oranı %34 düzeyindedir.

ŞEKİL 8. Konut yoksunu hanelerin Düzey-2 bölgeleri içindeki oranı (%)

% 15

0 TRC3

TR63

TRA2

TRC1

Türkiye

TR31

TR41

TRA1

TR62

TR10

TRB2 TR61

TR83

TR33

TR42

TRB1

TR71

TR82

TR81

TR90

TR52

TR72

TR21

TR32

TR51

TR22

38 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 36

ŞEKİL 9. Türkiye’de ve İzmir Bölgesi’nde konut yoksunluğunun alt boyutlarından etkilenen haneler (%)

Konutun karşılanabilirliği

Yakın çevrede suç ve şiddet varlığı 25

Aşırı kalabalıklık

20 15

Yakın çevrede hava ve çevre kirliliği sorunu

Isıtma sistemleri

10 5 0

Yakın çevrede gürültü sorunu

Banyo/duş

Odaların karanlık olması veya yeterli ışık almaması

Tuvalet

Sızdıran çatı, nemli duvarlar çürümüş pencere çerçevesi

İzolasyon kaynaklı ısınma sorunu

Türkiye İzmir

Şekil 9’da sunulan radar grafiği, Türkiye ve İzmir’de konut yoksunluğunun farklı boyutlarını karşılaştırmalı olarak ortaya koymaktadır. Hane-konut eşleşmesi boyutunda konutun karşılanabilirliği İzmir’de Türkiye ortalamasının üzerinde seyrederken, aşırı kalabalık konut oranı ülke ortalamasına kıyasla daha düşüktür.

Konutun fiziksel koşullarında ise Türkiye, sızdıran çatı, nemli duvarlar ve izolasyon kaynaklı ısınma sorunlarında İzmir’e göre daha olumsuz bir tablo çizmektedir.

Buna karşılık İzmir, konut çevresine ilişkin faktörlerde (özellikle hava kirliliği ve suç/şiddet algısı gibi alanlarda), Türkiye ortalamasının üzerinde yoksunluk yaşamaktadır. Bu durum, İzmir’in konutun karşılanabilirliği ve çevre kalitesi açısından daha dezavantajlı olduğunu, ancak fiziksel konut koşullarında Türkiye ortalamasına göre biraz daha iyi durumda olduğunu göstermektedir. Diğer yandan, İzmir’in görece

daha düşük nitelikli konut stoku ayrıca irdelendiğinde, özellikle karşılanabilirlik, aşırı kalabalıklık, sızdıran çatı, izolasyondan kaynaklı ısınma sorunları ve karanlık odaların varlığı konularında İzmir geneline kıyasla olumsuz yönde farklılaşmalar olduğu görülmektedir (Şekil 10).

ŞEKİL 10. İzmir il bütününde ve stokun düşük nitelikli kısmında konut yoksunluğunun alt boyutlarından etkilenen haneler (%)

Konutun karşılanabilirliği 50

Aşırı kalabalıklık

Yakın çevrede suç ve şiddet varlığı

40 30

Yakın çevrede hava ve çevre kirliliği sorunu

Isıtma sistemleri

20 10 0

Yakın çevrede gürültü sorunu

Banyo/duş

Odaların karanlık olması veya yeterli ışık almaması

Tuvalet

Sızdıran çatı, nemli duvarlar çürümüş pencere çerçevesi İzolasyon kaynaklı ısınma sorunu

İl Bütünü Düşük Nitelikli Konutlar

Tablo 7’de Türkiye ve İzmir Bölgesi için dört farklı konut yoksunluğu kategorisinin dağılımı sunulmaktadır.

Bu doğrultuda, İzmir Bölgesi’nde konut yoksunu olmayan hanelerin oranının ülke genelinden bir miktar yüksek olduğu ve yoksunluk riski altındaki hanelerin oranının ülke ortalamasına göre daha düşük olduğu görülmektedir. Genel olarak konut yoksunluğunun farklı kategorilerinin İzmir’de ülke genelinden çok fazla farklılaşmadığı görülmektedir.

TABLO 7. Türkiye ve İzmir’de farklı konut yoksunluğu kategorileri (%)

|  | Yoksun Değil | Yoksunluk Riski Altında | Yoksun | Ciddi Yoksun |
| --- | --- | --- | --- | --- |
| Türkiye | 63,7 | 17,8 | 13,4 | 5,1 |
| İzmir | 68,2 | 15 | 11,6 | 5,2 |

39 / 110

Tablo 8’de endeks değerleri ile oluşturulan dört yoksunluk kategorisi farklı hane halkı özelliklerine göre sunulmaktadır. Konuttaki mülkiyet biçimi açısından bakıldığında konut yoksunluğunun ve ciddi yoksunluğun en çok kiracı hane halkları arasında yaygın olduğu görülmektedir. Gelir grupları açısından yapılan incelemeler en dar gelirli gruplar arasında yoksunluğun ve ciddi yoksunluğun en yaygın

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

görüldüğünü ortaya koymaktadır. Buna karşın en üst gelir grubunda ciddi yoksunluk oranı sıfırdır. Hane yaş gruplarına göre ise orta yaşlı hanelerin (45-64 yaş) görece yoksunluk oranlarının daha yüksek olduğu görülmektedir. 35-44 yaş aralığındaki haneler konut yoksunluğuna en fazla maruz kalan yaş grubudur.

65 yaş üstü hanelerde ise ciddi yoksunluk en düşük düzeydedir.

TABLO 8. TR31 İzmir Bölgesi’nde konut yoksunluğu kategorilerinin dağılımı (%)

|  | Yoksun Değil | Yoksunluk Riski Altında | Yoksun | Ciddi Yoksun |
| --- | --- | --- | --- | --- |
| Ev Sahibi | 76,2 | 11,9 | 9,5 | 2,5 |
| Kiracı | 58,8 | 18,5 | 14,7 | 8,1 |
| Ev sahibi değil ama kira ödemiyor | 75,1 | 13,3 | 7,7 | 3,9 |
| 1. %20 | 45,1 | 21,7 | 21,3 | 11,8 |
| 2. %20 | 60,3 | 15,4 | 17,3 | 7 |
| 3. %20 | 67,5 | 15,8 | 10,3 | 6,4 |
| 4. %20 | 76,2 | 11,8 | 8,1 | 3,9 |
| 5. %20 | 81,2 | 12,9 | 6 | - |
| 15-24 yaş | 70,7 | 19,8 | 9,5 | - |
| 25-34 yaş | 67,5 | 16,2 | 10,8 | 5,6 |
| 35-44 yaş | 62,5 | 15,4 | 13,2 | 9 |
| 45-64 yaş | 66,4 | 16,1 | 13 | 4,5 |
| 65 yaş ve üstü | 81,8 | 9,8 | 7,1 | 1,3 |
| Toplam | 68,2 | 15 | 11,6 | 5,2 |

40 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 38

## 3.5. Genel Değerlendirme

Bu rapor kapsamında TR31 İzmir Bölgesi’nde karşılanabilirlik, konut kullanım yoğunluğu, enerji yoksulluğu ve konut yoksunluğu başlıkları altında yapılan analizler, bölgedeki barınma koşullarının çok boyutlu ve eşitsizlik içeren bir yapı sergilediğini ortaya koymaktadır. Konutun karşılanabilirliği açısından İzmir Bölgesi Türkiye ortalamasının üzerinde bir sorun düzeyine sahiptir ve bu durum özellikle kiracı haneler ile düşük gelirli ve genç hane halkları arasında daha belirgin şekilde hissedilmektedir. Konut harcamalarının gelir içindeki payının artması, bu kesimler açısından barınmanın sürdürülebilirliğini tehdit etmektedir.

Konut kullanım yoğunluğu verileri ise İzmir’de aşırı kalabalık konut koşullarında yaşayan hanelerin oranının ülke ortalamasına göre daha düşük olmasına karşın, düşük kullanım yoğunluğunun görece daha yaygın olduğunu göstermektedir. Bu durum, konutun hane ile mekânsal uyumunun bozulduğuna ve konut stokunun hane yaşı, geliri ve yaşam döngüsüne uygun çeşitlilikten yoksun olduğuna işaret etmektedir.

Enerji yoksulluğu göstergeleri, İzmir’de ılıman iklim koşullarına rağmen, her yedi haneden birinin ekonomik sebeplerle konutunu yeterince ısıtamadığını ortaya koymaktadır. Isıtma sistemi bulunmayan ya da bireysel soba ve klima gibi yüksek maliyetli sistemlere bağımlı olan haneler arasında bu sorun daha yaygındır. Enerji faturalarını ödemekte zorlanan hane oranı düşük görünmekle birlikte, bu durumun altında gelirle uyumlu düşük enerji tüketimi gibi görünmeyen riskler yatmaktadır. Konutun fiziksel nitelikleri açısından ise her beş haneden biri yapısal sorunlar içeren bir konutta yaşamaktadır.

Son olarak, konut yoksunluğu endeksi bu tematik alanları bütüncül biçimde bir araya getirerek İzmir’de her altı haneden birinin çok boyutlu konut yoksunluğu yaşadığını göstermektedir. Özellikle kiracılar, düşük gelirli gruplar ve orta yaşlı çekirdek aileler bu yoksunluklardan orantısız biçimde etkilenmektedir.

En üst gelir grubunda ciddi yoksunluk oranının sıfır olması, konut piyasasındaki eşitsizlikleri çarpıcı biçimde yansıtmaktadır. Bu bulgular, İzmir’de konut sorunlarının yalnızca fiziksel konut arzıyla sınırlı olmadığını, aynı zamanda ekonomik, mekânsal ve altyapısal yönleriyle çok katmanlı ve kırılganlığa açık bir yapıda olduğunu ortaya koymaktadır. Politika yapıcılar açısından bu durum, konut politikalarının daha bütüncül, hedefe duyarlı ve gelir düzeyine göre farklılaştırılmış biçimde tasarlanması gerektiğine işaret etmektedir.

41 / 110

39 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Alsancak, Konak

42 / 110

40 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Sahilevleri , Narlıdere

43 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 4. İZMIR KENTINDE ARZ-TALEP EĞILIMLERININ İNCELENMESI

Türkiye’de 2000’li yılların başından itibaren gözlenen demografik değişimler İzmir’i de etkilemiştir. İzmir genel olarak nüfus kazanan bir ildir. Her ne kadar nüfus artış hızı geçmiş dönemlere kıyasla azalmış olsa da, kentin ülke nüfusu içindeki payı onu üçüncü büyük il konumunda tutmaktadır. Nüfus eğilimleri, hane halkı oluşum oranları ve hane halkı kompozisyonu gibi talep yönlü dinamikler konut alanında önemli girdiler sunmaktadır. Arz tarafının ise üretilen yeni konutların sayısı ve büyüklüğü bakımından bu değişimlere yanıt vermesi beklenir. Diğer yandan mevcut konut stokunun da güncel koşullara uyum sağlayacak şekilde yenilenmesi ve iyileştirilmesi gerekmektedir. Ancak Türkiye genelinde konut üretimi demografik eğilimlere duyarsız görünmektedir. Bu durum, arz-talep uyumsuzluğuna yol açmakta, arz tarafında yüksek boş konut oranları, talep tarafında ise karşılanabilirlik sorunları doğurmaktadır.

Bu bölümde İzmir’de konut arzı ve talebi açısından öne çıkan sorunlar ele alınmaktadır. Talep tarafında özellikle nüfus ve hane halkı eğilimleri incelenmektedir.

Hane halkı sayıları, hane büyüklüğündeki değişimler ve hane halkı kompozisyonu hem yeni konut ihtiyacını hem de mevcut stokun hanelerin gereksinimlerini ne ölçüde karşıladığını değerlendirebilmek açısından kritik önemdedir. Arz tarafında ise yeni konut üretiminin düzeyi ve büyüklüğü, mevcut stokun nitelikleri, satış eğilimleri ile fiyat ve kira göstergeleri analiz edilmektedir. Elde edilen bulgular mekânsal olarak da ele alınmakta, böylece kentin farklı bölgelerinde hangi tür sorunların ve ihtiyaçların öne çıktığı tespit edilmeye çalışılmaktadır.

Bu çalışma kapsamında yapılan ilçe düzeyindeki analizlerde 2014 yılı temel alınmıştır. Bunun temel nedeni, büyükşehirlerde idari sınırların en güncel şeklini 6360 sayılı Kanun sonrasında 2014 yılı itibarıyla almış olmasıdır. Böylece incelemelerin idari sınır değişikliklerinden etkilenmesi önlenmiştir.

## 4.1. Talep Tarafı: Hane Halkı Eğilimleri

2014-2024 dönemi için İzmir’in ilçelerinde gözlenen demografik eğilimler, konut ihtiyacının değerlendirilmesi açısından önemli bulgular sunmaktadır. Tablo 9’da ilçeler düzeyinde nüfus, hane halkı sayısı, ortalama hane halkı büyüklüğü ve bunlara ilişkin yüzde değişim oranları gösterilmektedir.

İzmir’in 30 ilçesinin tamamında ortalama hane büyüklüğünün bu dönemde küçülme eğiliminde olduğu görülmektedir. Hane büyüklüğündeki azalma, hane sayısına artış olarak yansımaktadır. Dolayısıyla, İzmir’in tüm ilçelerinde hane halkı sayısındaki artış oranı nüfus artış oranını aşmıştır. Nüfus kazanan ilçelerde bu eğilim, konut talebinde belirgin bir artış anlamına gelmektedir. Özellikle Seferihisar, Torbalı, Menemen ve Karaburun gibi nüfusu hızla artan ilçelerde bu baskı daha güçlü hissedilecektir. Ortalama hane büyüklüğünün azalmasıyla birlikte değerlendirildiğinde, söz konusu ilçelerde küçük dairelere olan talebin arttığı ve bu eğilimin devam edeceği öngörülmektedir. Stokta 3 ve 4 odalı konutların ağırlıkta olması, konut tipinde çeşitlenme ihtiyacını ortaya koymakta ve farklı hane tiplerine uygun seçenekler üretilmesi gerektiğine işaret etmektedir. Bu durumun piyasa yansıması ise, küçük konutların fiyat ve kiralarında talep doğrultusunda artış beklentisidir.

Diğer yandan, Konak, Balçova, Bayındır, Bayraklı, Kiraz, Beydağ, Karabağlar ve Narlıdere ilçeleri az da olsa nüfus kaybetmiştir. Ancak ortalama hane büyüklüğündeki düşüş, Konak dışındaki tüm bu ilçelerde hane sayısında artışa yol açmıştır. Bu nedenle, nüfusta azalma gözlense dahi konut talebinde düşüş beklenmemektedir. Bu ilçelerde konut talebinin mevcut stokun yenilenmesi ve küçük konutlara yönelim şeklinde ortaya çıkması daha muhtemeldir. Ayrıca, nüfus azalmasında ilçelerin bir kısmında mevcut kentsel dönüşüm çalışmalarının etkili olduğu da vurgulanmalıdır.

44 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 42

TABLO 9. İlçeler düzeyinde 2014-2024 yılları nüfus, hane halkı sayısı ve ortalama hane büyüklüğü ile değişim oranları

|  | Nüfus |  |  | Hane Halkı Sayısı |  |  | Ortalama Hane Büyüklüğü |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| İlçeler | 2014 | 2024 | Değişim (%) | 2014 | 2024 | Değişim (%) | 2014 | 2024 | Değişim (%) |
| Aliağa | 83366 | 108701 | 30,4 | 24281 | 32777 | 35,0 | 3,16 | 2,97 | -6,0 |
| Balçova | 77311 | 76613 | -0,9 | 26135 | 28324 | 8,4 | 2,78 | 2,51 | -9,7 |
| Bayındır | 40310 | 40054 | -0,6 | 13939 | 14319 | 2,7 | 2,88 | 2,77 | -3,8 |
| Bayraklı | 310765 | 299859 | -3,5 | 92721 | 100749 | 8,7 | 3,31 | 2,9 | -12,4 |
| Bergama | 101813 | 107347 | 5,4 | 34926 | 39523 | 13,2 | 2,87 | 2,65 | -7,7 |
| Beydağ | 12457 | 11959 | -4,0 | 4439 | 4637 | 4,5 | 2,8 | 2,57 | -8,2 |
| Bornova | 431149 | 448737 | 4,1 | 127145 | 149601 | 17,7 | 3,23 | 2,86 | -11,5 |
| Buca | 461761 | 523193 | 13,3 | 134929 | 174469 | 29,3 | 3,29 | 2,85 | -13,4 |
| Çeşme | 39243 | 50828 | 29,5 | 13642 | 19431 | 42,4 | 2,82 | 2,56 | -9,2 |
| Çiğli | 176864 | 215697 | 22,0 | 56966 | 77113 | 35,4 | 3,03 | 2,7 | -10,9 |
| Dikili | 41999 | 48647 | 15,8 | 16430 | 20960 | 27,6 | 2,54 | 2,3 | -9,4 |
| Foça | 30002 | 36688 | 22,3 | 9015 | 13789 | 53,0 | 2,67 | 2,39 | -10,5 |
| Gaziemir | 130870 | 136930 | 4,6 | 38654 | 44990 | 16,4 | 3,25 | 2,95 | -9,2 |
| Güzelbahçe | 28470 | 38500 | 35,2 | 8868 | 13506 | 52,3 | 2,95 | 2,77 | -6,1 |
| Karabağlar | 473741 | 473058 | -0,1 | 146332 | 162481 | 11,0 | 3,18 | 2,85 | -10,4 |
| Karaburun | 9456 | 13473 | 42,5 | 3952 | 5933 | 50,1 | 2,33 | 2,23 | -4,3 |
| Karşıyaka | 325717 | 341580 | 4,9 | 117934 | 135966 | 15,3 | 2,71 | 2,47 | -8,9 |
| Kemalpaşa | 99626 | 120375 | 20,8 | 28743 | 38727 | 34,7 | 3,44 | 3,08 | -10,5 |
| Kınık | 28072 | 28859 | 2,8 | 8159 | 8948 | 9,7 | 3,42 | 3,21 | -6,1 |
| Kiraz | 43971 | 43401 | -1,3 | 13582 | 14852 | 9,4 | 3,23 | 2,91 | -9,9 |
| Konak | 380295 | 322393 | -15,2 | 129245 | 126185 | -2,4 | 2,86 | 2,5 | -12,6 |
| Menderes | 81297 | 111453 | 37,1 | 24652 | 37538 | 52,3 | 3,23 | 2,92 | -9,6 |
| Menemen | 148662 | 214409 | 44,2 | 42653 | 68168 | 59,8 | 3,43 | 3,05 | -11,1 |
| Narlıdere | 64599 | 61732 | -4,4 | 20401 | 22315 | 9,4 | 2,95 | 2,64 | -10,5 |
| Ödemiş | 129407 | 132942 | 2,7 | 43894 | 47742 | 8,8 | 2,91 | 2,69 | -7,6 |
| Seferihisar | 35960 | 60914 | 69,4 | 11947 | 23968 | 100,6 | 2,87 | 2,49 | -13,2 |
| Selçuk | 35281 | 38688 | 9,7 | 11583 | 13845 | 19,5 | 3,01 | 2,74 | -9,0 |
| Tire | 81315 | 87858 | 8,0 | 28568 | 32675 | 14,4 | 2,82 | 2,66 | -5,7 |
| Torbalı | 150127 | 218744 | 45,7 | 42351 | 67715 | 59,9 | 3,5 | 3,18 | -9,1 |
| Urla | 59166 | 79610 | 34,6 | 19026 | 28357 | 49,0 | 2,91 | 2,62 | -10,0 |

Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi verilerinden üretilmiştir.

45 / 110

Şekil 11’de İzmir’de 2014-2024 döneminde hane halkı sayısındaki değişim mekânsal olarak gösterilmektedir. Konak, Bayındır ve Beydağ ilçeleri, hane halkı değişim oranının en düşük olduğu ilçelerdir. Bu ilçelerden yalnızca Konak’ta incelenen dönemde hane halkı sayısında azalma yaşanmıştır. Konak’ta gözlenen bu düşüşün, kentin ticari işlevleri nedeniyle konutların ticari kullanıma dönüşmesi ve kentsel dönüşüm kapsamında yıkılan ancak henüz inşa edilmemiş veya ikamet edilmeyen konutlarla ilişkili olduğu düşünülebilir. Bayındır ve Beydağ gibi görece daha kırsal karakterli ilçelerde ise eğitim ve istihdam olanaklarının sınırlı olması, nüfusun daha merkezi

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

ilçelere yönelmesine yol açmaktadır. Buna karşılık, Seferihisar, Urla, Karaburun, Menderes, Güzelbahçe, Torbalı, Foça ve Menemen ilçelerinde hane halkı artış oranları oldukça yüksektir. Bu ilçelerden ikincil konut niteliği ile öne çıkan Seferihisar, Urla, Karaburun, Menderes ve Foça’daki artışın, merkez ve çeperdeki ilçelerle kıyaslandığında daha yüksek olması, pandemi ve deprem süreçlerinin bu eğilimde payı olup olmadığı sorusunu gündeme getirmektedir. Bu durumu daha ayrıntılı incelemek amacıyla, Şekil 12’de hane halkı değişim oranları en düşük ve en yüksek olan ilçelerin 2014-2024 dönemindeki hane halkı sayıları karşılaştırmalı olarak sunulmaktadır.

ŞEKİL 11. İzmir’de 2014-2024 döneminde hane halkı sayısı değişim oranı (%)

Seferihisar

Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi verilerinden üretilmiştir.

46 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 44

ŞEKİL 12. İzmir’de seçilmiş ilçelerin 2014-2024 döneminde hane halkı sayıları

130.000

120.000

1100.000

100.000

90.000

80.000

70.000

Hane Halkı Sayısı

60.000

50.000

40.000

30.000

20.000

10.000

Foça

Karaburun

Bayındır

Beydağ

Güzelbahçe

Konak

Menderes

Menemen

Torbalı

Seferihisar

Urla

2014 2016 2018 2020 2022 2024

Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi verilerinden üretilmiştir.

Şekil 12’de hane sayısındaki en yüksek değişim oranlarına sahip ilçelerin yıllara göre hane halkı sayıları incelendiğinde, bu ilçelerdeki hane sayısının uzun yıllardır düzenli bir artış eğilimi sergilediği görülmektedir. Başka bir ifadeyle, söz konusu ilçelerde gözlenen artış yalnızca pandemi ya da deprem etkisiyle tetiklenmiş geçici bir talebe değil, daha uzun vadeli ve yapısal bir talep artışına işaret etmektedir. Bununla birlikte, pandemi ve depremi kapsayan 2020-2021 döneminde özellikle Menemen, Seferihisar ve Urla ilçelerinde hane sayısındaki artışın diğer dönemlere kıyasla daha belirgin olduğu vurgulanmalıdır.

İlçelerde 2014-2024 döneminde hane halkı kompozisyonundaki değişim ve 2024 yılındaki kompozisyon dağılımı (Bkz. Ek 1) incelendiğinde aşağıdaki eğilimler tespit edilmektedir.

Aliağa Aliağa ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailedir (%40). Bunu %18’lik oranla tek kişilik haneler izlemektedir. Ancak 2014- 2024 dönemindeki değişimler, özellikle tek ebeveynli çekirdek aileler, aile olmayan haneler, tek kişilik haneler ve geniş ailelerde belirgin bir artış yaşandığını göstermektedir. Mevcut eğilimlerin devam etmesi halinde, gelecek on yılda çocuklu çekirdek ailelerin yanı sıra tek kişilik hanelerin de baskın hale gelmesi beklenmektedir.

47 / 110

Balçova Balçova’da baskın hane tipi eşler ve çocuklardan oluşan çekirdek aile (%29) ile tek kişilik hanelerdir (%26).

2014-2024 döneminde çocuklu çekirdek aileler ve sadece eşlerden oluşan çekirdek aileler azalma eğilimi gösterirken, diğer tüm hane tipleri artış eğilimindedir.

Özellikle aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek ailelerde belirgin bir artış görülmüştür. Bu eğilimlerin sürmesi durumunda gelecek on yılda Balçova ilçesinde tek kişilik hanelerin baskın hale geleceği, çocuklu çekirdek ailelerin oranının ise azalacağı öngörülmektedir.

Bayındır Bayındır ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek aile (%28) ve tek kişilik hanelerdir (%27). 2014-2024 döneminde çocuklu çekirdek ailelerin ve sadece eşlerden oluşan çekirdek ailelerin oranı azalma eğilimindedir. Diğer hane tipleri içerisinde aile olmayan haneler ve tek ebeveynli çekirdek ailelerin artış oranı dikkat çekicidir. Mevcut eğilimler ışığında Bayındır ilçesinde yakın gelecekte tek kişilik haneler baskın hane türü olacak ve çocuklu çekirdek ailelerin oranı azalacaktır.

Bayraklı Bayraklı ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailedir (%35). Ancak, 2014-2024 dönemi verileri bu hane tipinin ve geniş ailelerin azalma eğiliminde olduğunu göstermektedir. Buna karşın aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek aileler belirgin bir artış göstermiştir. Bu eğilimler doğrultusunda Bayraklı’da gelecek dönemde çocuklu çekirdek aileler kadar tek kişilik hanelerin de baskın hale gelmesi beklenmektedir.

Bergama Bergama ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailedir (%33). Bunu %24’lük oranla tek kişilik haneler izlemektedir. 2014-2024 döneminde çocuklu çekirdek ailelerin oranı azalırken tek ebeveynli çekirdek aileler, aile olmayan haneler ve tek kişilik haneler belirgin bir artış göstermiştir. Mevcut eğilimlerin sürmesi durumunda Bergama’da önümüzdeki on yılda tek kişilik hanelerin baskın hane tipi olacağı öngörülmektedir.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Beydağ Beydağ’da baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailedir (%33). Bunu tek kişilik haneler (%25) ve sadece eşlerden oluşan çekirdek aileler (%24) takip etmektedir. 2014-2024 döneminde çocuklu çekirdek ailelerin azalma eğiliminde olduğu, buna karşılık aile olmayan haneler, tek ebeveynli çekirdek aileler ve tek kişilik hanelerin artış gösterdiği görülmektedir.

Bu çerçevede, ilerleyen yıllarda Beydağ’da tek kişilik hanelerin baskın hane tipi haline gelmesi, çocuklu çekirdek aileler ile yalnızca eşlerden oluşan çekirdek ailelerin ise bunu izlemesi beklenmektedir.

Bornova Bornova ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailedir (%35). Tek kişilik haneler ise %22 payla ikinci sıradadır. 2014-2024 döneminde çocuklu çekirdek ailelerin oranı azalırken tek kişilik haneler, tek ebeveynli çekirdek aileler ve aile olmayan haneler belirgin bir artış göstermiştir. Bu eğilimlerin sürmesi durumunda gelecek dönemde Bornova’da tek kişilik hanelerin baskın hale gelmesi olasıdır.

Buca Buca ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailedir (%35). Bunu tek kişilik haneler %22 ile izlemektedir. 2014-2024 döneminde aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek ailelerin oranı belirgin şekilde artmıştır. Bu eğilimlerin devam etmesi durumunda gelecek dönemde Buca’da tek kişilik hanelerin, çocuklu çekirdek ailelerin oranını geçmesi beklenmektedir.

Çeşme Çeşme ilçesinde baskın hane tipi tek kişilik hanelerdir (%32). Bunu %24 oranla çocuklu çekirdek aileler izlemektedir. 2014-2024 dönemi eğilimleri, tek kişilik hanelerin gelecek dönemde de baskın olacağını göstermektedir.

Çiğli Çiğli ilçesinde baskın hane tipi %36 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. Tek kişilik haneler %22 ile ilçede ikinci sıradadır. 2014-2024 döneminde aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek aileler artmıştır. Mevcut eğilimlerin sürmesi durumunda, tek kişilik hanelerin oranı çocuklu çekirdek aileleri aşacaktır.

48 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 46

Dikili Dikili ilçesinde baskın hane tipi tek kişilik hanelerdir (%32). Bunu %25 ile sadece eşlerden oluşan çekirdek aileler ve %22 ile çocuklu çekirdek aileler izlemektedir.

2014-2024 dönemi eğilimleri, tek kişilik hanelerin baskınlığını sürdüreceğini, bunu iki kişilik hane halkları olan sadece eşlerden oluşan çekirdek ailelerin izleyeceğini göstermektedir. Çocuklu çekirdek ailelerin ise azalma eğiliminde olduğu görülmektedir.

Foça Foça’da baskın hane tipi tek kişilik hanelerdir (%30).

Eşler ve çocuklardan oluşan çekirdek ailelerin oranı %25, sadece eşlerden oluşan çekirdek ailelerin oranı ise %22’dir. 2014-2024 dönemi verileri tek kişilik hanelerin gelecekte de baskın olacağını, ardından sadece eşlerden oluşan çekirdek ailelerin geleceğini göstermektedir.

Gaziemir Gaziemir ilçesinde baskın hane tipi %44 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. 2014-2024 döneminde tek kişilik haneler, tek ebeveynli çekirdek aileler ve aile olmayan haneler artsa da gelecek on yılda çocuklu çekirdek ailelerin baskın konumu korunacaktır.

Güzelbahçe Güzelbahçe ilçesinde baskın hane tipi eşler ve çocuklardan oluşan çekirdek ailelerdir (%35). 2014-2024 döneminde tüm hane tiplerinde artış gözlenmiştir Eğilimler, çocuklu çekirdek ailelerin ilçede payını koruyacağını göstermektedir.

Karabağlar Karabağlar ilçesinde baskın hane türü %36 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. 2014-2024 döneminde bu grupta azalma gözlenmiş, buna karşılık tek kişilik haneler, aile olmayan haneler ve tek ebeveynli çocuklu ailelerde belirgin bir artış olmuştur. Mevcut eğilimlerin devam etmesi durumunda ilçede tek kişilik haneler de çocuklu çekirdek aileler gibi baskın hane tipi olacaktır.

Karaburun Karaburun ilçesinde baskın hane tipi %36 ile tek kişilik hanelerdir. İkinci sırada %24 ile sadece eşlerden oluşan çekirdek aileler gelmektedir. 2014-2024 döneminde aile olmayan haneler, geniş aileler, tek ebeveynli çekirdek aileler ve tek kişilik hanelerde belirgin artış gözlenmiştir. Eğilimlerin devamı halinde, Karaburun’da tek kişilik hanelerin önümüzdeki dönemde de baskın hane tipi olmaya devam edeceği öngörülmektedir.

Karşıyaka Karşıyaka’da baskın hane tipleri eşler ve çocuklardan oluşan çekirdek aileler (%27) ile tek kişilik hanelerdir (%27). 2014-2024 döneminde tek kişilik haneler artış, çocuklu çekirdek aileler ise azalma eğilimindedir. Bu eğilimlerin sürmesi durumunda, Karşıyaka ilçesinde tek kişilik haneler baskınlığını korurken çocuklu çekidek ailelerin payı düşmeye devam edecektir.

Kemalpaşa Kemalpaşa ilçesinde baskın hane tipi %40 ile eşler ve çocuklardan oluşan çekirdek ailedir. 2014-2024 döneminde en yüksek artış tek ebeveynli aileler, tek kişilik haneler ve aile olmayan hanelerde görülmüştür. Buna karşın, mevcut eğilimler çocuklu çekirdek ailelerin gelecek dönemde de ilçede baskın konumunu koruyacağını göstermektedir.

Kınık Kınık’ta baskın hane tipi %32 ile eşler ve çocuklardan oluşan çekirdek ailedir. Ancak 2014-2024 döneminde çocuklu çekirdek ailenin oranı azalma eğilimindeyken, tek ebeveynli çekirdek aileler, aile olmayan haneler ve tek kişilik haneler artış göstermiştir. Mevcut eğilimler ışığında, önümüzdeki on yılda ilçede hem çocuklu çekirdek aileler hem de tek kişilik haneler baskın hane tipleri olacaktır.

Kiraz Kiraz ilçesinde baskın hane tipi %37 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. 2014-2024 döneminde çocuklu çekirdek ailelerin oranı azalma eğilimindeyken, tek ebeveynli çekirdek aileler, tek kişilik haneler ve aile olmayan haneler belirgin artış göstermiştir. Mevcut eğilimler devam ederse, ilçede gelecek dönemde çocuklu çekirdek ailelerin yanı sıra tek kişilik haneler de baskın konuma yükselecektir.

49 / 110

Konak Konak’ta baskın hane tipi %31 ile tek kişilik hanelerdir.

İkinci sırada %24 ile eşler ve çocuklardan oluşan çekirdek aileler yer almaktadır. 2014-2024 döneminde çocuklu çekirdek aileler, geniş aileler ve sadece eşlerden oluşan çekirdek ailelerin oranı azalmış, buna karşılık aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek aileler artış göstermiştir. Eğilimlerin sürmesi halinde, Konak ilçesinde gelecek on yılda tek kişilik haneler baskın hane tipi olarak kalmaya devam edecektir.

Menderes Menderes ilçesinde baskın hane tipi %34 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. Onları %22 ile tek kişilik haneler izlemektedir. 2014-2024 döneminde tek ebevenli çekirdek aileler, tek kişilik haneler ve aile olmayan hanelerde belirgin artış görülmüştür. Mevcut eğilimlerin devam etmesi durumunda, tek kişilik hanelerin payının çocuklu çekirdek ailelerin önüne geçmesi beklenmektedir.

Menemen Menemen’de baskın hane tipi %42 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. 2014-2024 döneminde aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek ailelerin oranında belirgin bir artış yaşanmıştır. Buna rağmen mevcut eğilimler, çocuklu çekirdek ailelerin önümüzdeki dönemde de baskın hane tipi olacağını göstermektedir.

Narlıdere Narlıdere ilçesinde baskın hane tipi %33 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. İkinci sırada %22 ile tek kişilik haneler yer almaktadır. 2014-2024 döneminde çocuklu çekirdek ailelerin payı azalırken, aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek aileler artış göstermiştir. Mevcut eğilimlerin sürmesi halinde, gelecek on yılda tek kişilik hanelerin ilçede baskın hale gelmesi beklenmektedir.

Ödemiş Ödemiş’te baskın hane tipi %33 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. İkinci sırada %24 ile tek kişilik haneler gelmektedir. 2014-2024 döneminde çocuklu çekirdek aileler ve geniş ailelerin payı azalmış, buna karşılık aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek aileler artış göstermiştir. Mevcut

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

eğilimler, önümüzdeki dönemlerde ilçede tek kişilik hanelerin baskın konuma geçeceğini göstermektedir.

Seferihisar Seferihisar ilçesinde baskın hane tipleri eşler ve çocuklardan oluşan çekirdek aileler (%28) ile tek kişilik hanelerdir (%28). 2014-2024 döneminde çocuklu çekirdek ailelerin oranı düşerken, tek ebeveynli çekirdek aileler, tek kişilik haneler ve aile olmayan haneler artış göstermiştir. Mevcut eğilimler, gelecek on yılda tek kişilik hanelerin baskınlığını koruyacağını, çocuklu çekirdek ailelerin payının ise belirgin şekilde azalacağını göstermektedir.

Selçuk Selçuk’ta baskın hane tipi %33 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. İkinci sırada %23 ile tek kişilik haneler gelmektedir. 2014-2024 döneminde çocuklu çekirdek aileler azalma eğilimindeyken, tek ebeveynli çekirdek aileler, aile olmayan haneler ve tek kişilik haneler artış eğilimi göstermiştir. Bu eğilimlerin sürmesi halinde, gelecek on yılda ilçede baskın hane tipinin tek kişilik haneler olması beklenmektedir.

Tire Tire’de baskın hane tipi %35 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. Onları %24 ile tek kişilik haneler izlemektedir. 2014-2024 döneminde çocuklu çekirdek ailelerin oranını azalmış, buna karşılık aile olmayan haneler, tek ebeveynli çekirdek aileler ve tek kişilik haneler artış göstermiştir. Eğilimlerin devamı halinde, tek kişilik haneler de çocuklu çekirdek ailelerle birlikte baskın konuma yükselecektir.

Torbalı Torbalı ilçesinde baskın hane tipi %41 ile eşler ve çocuklardan oluşan çekirdek ailelerdir. 2014-2024 döneminde özellikle tek ebeveynli çekirdek aileler, aile olmayan haneler ve tek kişilik hanelerde belirgin artış yaşanmıştır. Buna rağmen mevcut eğilimler, çocuklu çekirdek ailelerin ilerleyen dönemde de ilçede baskınlığını sürdüreceğini göstermektedir.

Urla Urla ilçesinde baskın hane tipleri eşler ve çocuklardan oluşan çekirdek aileler (%27) ile tek kişilik hanelerdir (%26). 2014-2024 döneminde aile olmayan haneler, tek kişilik haneler ve tek ebeveynli çekirdek ailelerde artış

50 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 48

gözlenmiştir. Mevcut eğilimlerin devam etmesi durumunda, tek kişilik hanelerin ilçede baskın hale gelmesi beklenmektedir.

Özetle, İzmir’in 30 ilçesinin büyük bölümünde eşler ve çocuklardan oluşan çekirdek ailelerin oranı azalma eğilimindedir. Buna karşılık tek ebeveynli çekirdek ailelerin, sadece eşlerden oluşan çekirdek ailelerin, tek kişilik hanelerin ve aile olmayan hanelerin payı artmaktadır.

Bazı ilçelerde 2024 itibarıyla tek kişilik haneler baskın

hale gelmiştir ve pek çok ilçede mevcut eğilimlerin sürmesi halinde baskın hale gelmesi beklenmektedir. Bu kompozisyon değişiminin konut ihtiyacı ve talebi üzerinde önemli etkiler yaratacağı açıktır. Yeni üretim ve mevcut stoktaki iyileştirmeler bu değişimi dikkate almadığı takdirde, İzmir’de konut kullanım yoğunluğunda düşüş, buna bağlı olarak konutun karşılanabilirliğinde sorunlar ve enerji yoksulluğunda artış kaçınılmaz olacaktır.

## 4.2. Arz Tarafı: Konut Üretimi, Mevcut Konut Stoku, Konut Fiyatları ve El Değiştirme

## Yeni Konut Üretimi

Türkiye genel olarak konut üretim performansı ile öne çıkan bir ülkedir. Şekil 13 incelendiğinde, İzmir’in de 2014-2024 dönemindeki ruhsatlı konut üretim performansının nüfusa eklenen hane halkı sayılarına kıyasla oldukça yüksek olduğu görülmektedir. Yapı ruhsatlarına ilişkin kayıtlar boş arsalarda üretilen konutların yanı sıra mevcut stokta yıkılıp yeniden yapılan yapıları da kapsamaktadır. 30 ilçe içinde sadece Bornova’da

yapımına başlanan yeni konut sayısı nüfusa eklenen hane sayısına yetişememiştir. Ancak, her ne kadar 2014-2024 döneminde üretilen yeni konut birimi sayısı yeni hane oluşumuna kıyasla yüksek görünse de İzmir’in geçmişten gelen bir ruhsatlı konut açığı olduğu ve bu açığın kaçak yapılaşma, özellikle gecekondu üretimi yoluyla kapatılmaya çalışıldığı bilinmektedir.

ŞEKİL 13. İzmir’de üretilen konut birimi sayısı ve nüfusa eklenen hane sayısı (2014-2024)

50.000 45.000 40.000

35.000 30.000 25.000

20.000 15.000

10.000 5.000 0 -5.000 Beydağ Bayındır Kınık Kiraz Narlıdere Selçuk Balçova Güzelbahçe Karaburun Tire Gaziemir Foça Bergama

Konak Ödemiş Urla Çeşme Dikili Aliağa Menderes Kemalpaşa Bornova Karabağlar Seferihisar Bayraklı Çiğli Torbalı Karşıyaka Buca Menemen

Yeni Konut Birimi Üretimi Eklenen Hane Sayısı

Kaynak: TÜİK Yapı İzin İstatistikleri: Yapı Ruhsatına Göre Daire Sayısı ve ADNKS verilerinden üretilmiştir.

51 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

ŞEKİL 14. İzmir’de yeni hane başına düşen yeni konut birimi sayısı (2014-2024)

Kaynak: TÜİK Yapı İzin İstatistikleri: Yapı Ruhsatına Göre Daire Sayısı ve ADNKS verilerinden üretilmiştir.

Şekil 14’te yeni konut birimi üretiminin, yeni oluşan hane halkı sayılarına oranı verilmektedir. Bu oranın 1’den küçük olduğu tek ilçe yukarıda da bahsedildiği gibi Bornova’dır. Bunun dışındaki 29 ilçede konut üretim düzeyleri yeni hane sayılarına kıyasla oldukça yüksektir. Özellikle Dikili, Bayraklı, Konak, Bayındır, Ödemiş ve Beydağ ilçelerinde nüfusa eklenen her hane başına 2,5’dan fazla konut biriminin yapımına başlanmış durumdadır. Bu oldukça yüksek düzeyde bir üretim yapıldığının göstergesidir. Ruhsat verileri üretim artışının kullanım türüne ilişkin kesin çıkarımlar yapmaya imkân vermemekle birlikte, ilçe bazındaki mekânsal ve işlevsel dinamikler dikkate alındığında, Dikili’de bu üretimin bir kısmının ikincil konut kullanımına, Konak’taki yüsek üretim düzeyinin ise kentsel dönüşüm uygulamalarına bağlı olabileceği düşünülmektedir.

2014-2024 döneminde İzmir’de üretilen yeni konutların ortalama alanı incelendiğinde (Şekil 15) ilçelerin çoğunda metrekare konut alanında düşüş eğilimi izlenebilmektedir. Ancak özellikle Güzelbahçe, Ödemiş, Beydağ, Narlıdere ve Kiraz ilçelerinde yıllar içinde oldukça büyük konutlar üretildiği görülmektedir.

Önümüzdeki dönemde tek kişilik hanelerin baskın tip olacağı Ödemiş, Narlıdere ve hatta Kiraz için arz tarafının küçülen hane profiline yeterli tepkiyi oluşturmadığı söylenebilir. Bu çerçevede, söz konusu ilçelerde gözlenen büyük metrekareli konut üretiminin, demografik eğilimlerden bağımsız olarak, piyasa dinamikleri ve geliştirici tercihleri doğrultusunda, daha yüksek metrekareli konut talep eden sosyo-ekonomik kesimlere hitap edecek biçimde gerçekleştiği değerlendirilmektedir. Buna karşın Balçova, Bergama, Bornova, Buca, Çiğli, Karabağlar ve Menemen ilçelerinde üretilen yeni konutların kullanım alanında belirgin bir küçülme eğilimi görülmektedir. Karabağlar ve

52 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 50

Menemen ilçelerinde çocuklu çekirdek ailelerin hala baskın hane tipi içinde yer aldığı düşünüldüğünde bu ilçelerde küçülen konutlar aşırı kalabalıklaşmaya sebep olabilecek niteliktedir. Bununla birlikte, konut piyasasının kapalı bir sistem olmadığı ve hanelerin yer değiştirmesi ile alt piyasalar arasında geçişlerin mümkün olduğu göz önünde bulundurulmalıdır. Özellikle merkez ilçelerde, zaman içinde farklı sosyo-ekonomik

grupların yer değiştirmesine dayalı olarak farklı dinamiklerin işlemesi olasıdır. Ancak mevcut üretim eğilimlerinin devam etmesi ve çocuklu hanelerin bu ilçelerdeki baskınlığını koruması durumunda, yeni üretilen konutların hane profili ile uyumsuzluğu, yer değiştirme süreçlerinden bağımsız olarak aşırı kalabalıklaşma riskini artırabilecek bir unsur olarak değerlendirilmektedir.

ŞEKİL 15. İzmir’de üretilen konut birimlerinin ortalama konut alanı (2014-2024)

İzmir İlçeleri Ortlama Konut Alanı (2014 - 2024)

| Buca Balçova Seferihisar Menemen Karabağlar Konak Çiğli Bornova Karaburun Karşıyaka Bayraklı Foça Menderes Çeşme Gaziemir İlçe Aliağa Bergama Selçuk Torbalı Dikili Kemalpaşa Bayındır Tire Kınık Urla Narlıdere Beydağ Kiraz Ödemiş Güzelbahçe |  |
| --- | --- |
|  | 2014 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 Yıl |

m2

Kaynak: TÜİK Yapı İzin İstatistikleri verilerinden yapay zekâ desteğiyle üretilmiştir.

53 / 110

Şekil 16’da ilçeler düzeyinde yeni konutların ortalama metrekare alanına göre 1-2 kişilik hanelerin payı birlikte sunulmaktadır. Bu doğrultuda, uyumlu bir dağılım görmek için grafiğin sol üst köşesinde ve sağ alt köşesinde yığılmalar olması beklenir. Diğer bir deyişle, 1 ve 2 kişilik hanelerin payının yüksek olduğu ilçelerde arzın görece daha küçük konutlara yönelmesi ve tersine bu payın düşük olduğu ilçelerde (daha kalabalık hanelerin payı yüksek olacağı için) arzın daha büyük konutlara yönelmesi beklenir. Ancak Şekil 16’da Buca, Karabağlar, Menemen, Bayraklı, Bornova, Çiğli

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

ve Menderes ilçelerinde 1-2 kişilik hanelerin payı düşük seyrettiği halde konutların 100 metrekareden küçük üretildiği görülmektedir. Bu eğilimin sürmesi yakın gelecekte bu ilçelerde çekirdek ve geniş aileler arasında aşırı kalabalıklaşmanın artmasına yol açacaktır. Benzer şekilde Urla, Kiraz, Ödemiş ve Beydağ ilçelerinde 1-2 kişilik hanelerin payı %40-50 düzeyinde ulaşmasına karşın konut üretimi 125-145 metrekare aralığında seyretmektedir. Bu ilçelerde ise düşük hane büyüklüğüne karşın büyük konut üretimi karşılanabilirlik sorunlarını beraberinde getirecektir.

ŞEKİL 16. İzmir’de ilçeler bazında yeni konutlarda ortalama alan ve ilçe içinde 1 ve 2 kişilik hanelerin payı

|  |  | Karabu | run |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | Di | kili |  |  |  |  |
|  |  | Fo | ça |  |  |  |  |  |
|  | Sefe | rihisar | Çeşme | Bayınd | ır | Beyda | ğ |  |
|  | Balçova | Konak Karşıya | Berga ka | ma Tir | e Urla | Kira | Ödemi z | ş |
|  |  | M Çiğli Bornova | Selç enderes | uk K | Narlı ınık | dere |  | Güzelbahçe |
|  | Buca Karabağ Men | lar Bayrak emen Gaziemir | lı Aliağa Tor | Kemalpaşa balı |  |  |  |  |

1 - 2 Kişilik Hanelerin Payı (%)

30 70 80 90 100 110 120

130 140 150 160

Konut Alanı (m2)

Kaynak: TÜİK Yapı İzin İstatistikleri verilerinden üretilmiştir.

## Mevcut Konut Stoku

Türkiye’de mevcut konut stokunun durumuna ve özelliklerine ilişkin detaylı bilgi sağlayabilecek kapsamlı bir veri seti yoktur. Bina ve Konut Nitelikleri Araştırması (2021) ise ancak il düzeyinde mevcut stokun kat sayısı, konut yaşı ve oda sayısına ilişkin bilgiler sunmaktadır. Bu doğrultuda, İzmir’de binaların yaklaşık %30’u 6 ve daha çok katlı, yaklaşık %35’i ise 4-5 katlıdır. Ülke geneline kıyasla 3, 4 ve 5 katlı konut yapılarının oranının daha yüksek olduğu görülmektedir.

Yapı stokunun yaş dağılımı Şekil 17’de sunulmaktadır.

Yapı yaşına ilişkin verinin ilçe düzeyinde bulunmaması önemli bir eksikliktir ancak stokun %14,2’sinin 1980 ve öncesinde yapılmış olması başlı başına önemli bir girdidir. Stokun bu kısmında yenileme ve iyileştirme yatırımları bir gerekliliktir. Ayrıca Bina ve Konut Nitelikleri Araştırması kapsamında yapının ruhsat durumu gözetilmediği için bu yapıların bir kısmının kaçak olma ihtimali de bulunmaktadır. Diğer yandan 1981-2000 döneminde yapılmış yapıların oranının %37 olduğu görülmektedir. Bu stokta ise özellikle deprem

54 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 52

yönetmeliği açısından bir inceleme yapılması gerekmektedir. Mevcut stokun türüne (ruhsatlı/ruhsatsız) ve mekânsal dağılımına (ilçe/mahalle bazında) ilişkin verinin olmaması oldukça önemli bir kısıttır. Gelecek

çalışmalar için bu türden bir verinin toplanması, yeni konut üretiminin ve yenileme girişimlerinin sağlıklı bir şekilde planlanabilmesi açısından hayati önem taşımaktadır.

ŞEKİL 17. Türkiye ve İzmir’de hane halkının ikamet ettiği binanın inşa yılı (%)

50 45 40 35 30 25

% Hane

20 15 10 5 0 1980 ve öncesi 1981 - 2000 2001 ve sonrası Bilinmeyen İzmir Türkiye

Kaynak: Bina ve Konut Nitelikleri Araştırması (2021) verilerinden üretilmiştir.

ŞEKİL 18. Türkiye ve İzmir’de hane halkının ikamet ettiği binanın oda sayısı (%)

50 45 40 35 30 25

% Hane

20 15 10 5 0 1 - 2 3 4 5+ İzmir Türkiye

Kaynak: Bina ve Konut Nitelikleri Araştırması (2021) verilerinden üretilmiştir.

Şekil 18’de hane halklarının oturdukları konutun oda sayısına göre dağılımı sunulmaktadır. Bu doğrultuda İzmir genelinde stokun %90’ının 3 ve 4 odalı konutlardan oluştuğu, 1-2 odalı konutların payının sadece %6,5 olduğu görülmektedir. 2024 itibarıyla hane halklarının %38’ini 1-2 kişilik hanelerin oluşturduğu düşünüldüğünde hem yeni konut üretimindeki eğilimler

hem de mevcut stokun özellikleri hane-konut eşleşmesi açısından ciddi bir uyumsuzluğun varlığına işaret etmektedir. Bu sadece düşük konut yoğunluğu açısından düşünülmesi gereken bir sorun değil, konut maliyetlerinin gereksiz artması ve dolayısıyla karşılanabilirliğin düşmesi yönünden de ele alınması gereken bir sorundur.

55 / 110

İzmir’de mevcut konut stokunun ilçeler düzeyinde sayısının tespiti Ulusal Adres Veri Tabanı (UAVT) üzerinden yapılabilmektedir. UAVT verileri mahalleler bazında konut birimi sayısı için genel bir bilgi sunmaktadır. Ancak bu veri tabanında belirtilen konut birimi sayısının ruhsatsız, inşaatı henüz bitmemiş, metruk

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

vb. konutları da sayıma dâhil ettiği bilinmektedir. Yine de bu veri tabanı ile ilçelerdeki stokun yıllar içinde değişimi ve kaba bir stok boşluk oranı hesaplamak mümkündür. Tablo 10’da ilçeler düzeyinde konut birimi sayıları ve değişim oranları 2014-2024 dönemi için sunulmaktadır.

TABLO 10. İlçeler düzeyinde 2014-2024 yılları konut birimi sayısı ve değişim oranları

| İlçeler | 2014 Konut Birimi Sayısı | 2024 Konut Birimi Sayısı | Değişim (%) |
| --- | --- | --- | --- |
| Aliağa | 32732 | 49485 | 51,2 |
| Balçova | 31691 | 34371 | 8,5 |
| Bayındır | 22718 | 24207 | 6,6 |
| Bayraklı | 117220 | 136082 | 16,1 |
| Bergama | 51531 | 58385 | 13,3 |
| Beydağ | 7260 | 7791 | 7,3 |
| Bornova | 159408 | 203052 | 27,4 |
| Buca | 174403 | 227238 | 30,3 |
| Çeşme | 43739 | 53885 | 23,2 |
| Çiğli | 69769 | 101701 | 45,8 |
| Dikili | 47438 | 59533 | 25,5 |
| Foça | 22827 | 32956 | 44,4 |
| Gaziemir | 47809 | 57616 | 20,5 |
| Güzelbahçe | 14960 | 20271 | 35,5 |
| Karabağlar | 187316 | 203978 | 8,9 |
| Karaburun | 13752 | 21162 | 53,9 |
| Karşıyaka | 150159 | 168990 | 12,5 |
| Kemalpaşa | 41224 | 64437 | 56,3 |
| Kınık | 12347 | 13631 | 10,4 |
| Kiraz | 17723 | 23281 | 31,4 |
| Konak | 175913 | 185159 | 5,3 |
| Menderes | 48795 | 68725 | 40,8 |
| Menemen | 57358 | 115444 | 101,3 |
| Narlıdere | 25203 | 27907 | 10,7 |
| Ödemiş | 65985 | 73121 | 10,8 |
| Seferihisar | 31352 | 53914 | 72,0 |
| Selçuk | 16645 | 21728 | 30,5 |
| Tire | 41251 | 50086 | 21,4 |
| Torbalı | 57096 | 101959 | 78,6 |
| Urla | 46104 | 54976 | 19,2 |

Kaynak: UAVT verilerinden üretilmiştir.

56 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 54

Bu doğrultuda, 2014-2024 döneminde konut birimi sayısının en az arttığı ilçe % 5,3 ile Konak, en fazla arttığı ilçe ise %101,3 ile Menemen’dir. Konut sayısı %50’nin üzerinde artan ilçelerin artış büyüklüğüne göre sırasıyla Menemen, Torbalı, Seferihisar, Kemalpaşa, Karaburun ve Aliağa olduğu görülmektedir. 2014- 2024 döneminde İzmir’in konut stoku açısından en çok gelişen ilçelerini görebilmek amacıyla Tablo 10’un değişimi gösteren son sütunu ilçeler düzeyinde görselleştirilmiştir (Şekil 19). Bu doğrultuda, konut stoku en çok artan ilçelerin çoğunlukla İzmir’in merkezini çevreleyen ilçeler olduğu, bunlardan Aliağa, Kemalpaşa, Torbalı gibi yerleşimlerin özellikle sanayi

sektöründeki gelişmeler sebebiyle ortaya çıktığı bilinmektedir. Seferihisar ve Karaburun gibi alanlarda ikincil konutlar artan stokun temel sebebi olarak görülebilir. Merkezde ve çeperde ise çoğunlukla stok artışının sınırlı olduğu görülmektedir. Kentsel gelişmeyi bu şekilde yönlendiren faktörler arasında imarlı arsa varlığı ve arsa fiyatları da vardır. Özellikle 1/100.000 ölçekli İzmir-Manisa Bölgesi Çevre Düzeni Planı Plan Açıklama Raporu incelendiğinde İzmir’de pek çok ilçede ihtiyacın ötesinde konut alanı planladığı ve gerçekçi olmayan nüfus artışları öngörüldüğünü söylemek mümkündür.

ŞEKİL 19. 2014-2024 yılları arasında konut stoku değişim oranları (%)

Menemen

Kaynak: UAVT verilerinden üretilmiştir.

Yukarıda aktarılan stok gelişimi doğrultusunda ilçelerde konut stoku ve hane halkı sayılarının kıyaslanması yoluyla üretilen boşluk oranlarını incelemek anlamlıdır (Şekil 20). Ancak bu oranlar inşaatı

tamamlanmamış, metruk, kentsel dönüşüm amacıyla boşaltılmış, ruhsatsız, ikincil konut gibi oturulamaz durumda ya da sürekli kullanımda olmayan stok ayrıştırılarak daha rafine hale getirilmelidir. Bu

57 / 110

sebeple hesaplanan oranlar kaba boşluk oranları olarak adlandırılmaktadır. Şekil 20’de gösterilen kaba boşluk oranlarının özellikle ikincil konut kullanımı yoğun olan ilçelerde yüksek çıkması anlamlıdır. Görece daha kırsal yerleşimlerde, örneğin Beydağ ve Kiraz’da,

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

yukarıda da tartışıldığı gibi hane yapısı ile uyumsuz üretilen stok sebebiyle yüksek boşluk oranları gözleniyor olabilir. Diğer yandan, konut stoku artış oranı da görece az olan kent merkezinde, boşluk oranlarının da düşük olduğu görülmektedir.

ŞEKİL 20. 2024 yılı itibarıyla ilçeler düzeyinde kaba stok boşluk oranları (%)

Kaynak: UAVT verilerinden üretilmiştir.

Şekil 21’de, çalışmanın Bölüm 2.3 başlığı altında veri seti ve yöntemi ayrıntılı biçimde tartışılan elektrik sayaç verileri kullanılarak hesaplanan net boşluk oranları sunulmaktadır. Elektrik sayaç verileri, UAVT içerisinde yer alan metruk ve inşaat halinde bulunan konut stokunu doğrudan dışlamakta; ayrıca ikincil konutların ayrıştırılmasına olanak sağlamaktadır. Bu nedenle Şekil 21’de sunulan konut stoku boşluk oranları, ikincil konutları, metruk konutları ve inşaatı devam eden konutları kapsamamaktadır. Elektrik sayaç verisinin kullanılmasıyla boşluk oranlarının tespitinde belirgin bir iyileşme sağlandığı görülmektedir. Bu

doğrultuda, UAVT verileri kullanılarak %72 düzeyinde hesaplanan boşluk oranı üst sınırı, GDZ Elektrik verileri ile %28,8 seviyesine gerilemiştir. Ayrıca stok boşluk oranlarının ilçeler arasındaki dağılımında da anlamlı bir farklılaşma gözlenmektedir. Bu bulgular ışığında, çalışmanın ilerleyen bölümlerinde konut ihtiyaç modelinin uygulanmasında UAVT verileri yerine GDZ Elektrik verilerinin kullanılması uygun görülmüştür.

Şekil 20’de sunulan kaba boşluk oranları ile Şekil 21’de gösterilen net boşluk oranları birlikte değerlendirildiğinde, UAVT verilerine dayalı kaba boşluk oranlarının, ikincil konutlar, metruk yapılar ve inşaat

58 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 56

halindeki konutları içermesi nedeniyle, özellikle kıyı ilçeleri ile görece düşük yoğunluklu ve kırsal nitelik taşıyan yerleşimlerde boşluk oranlarını yüksek gösterdiği anlaşılmaktadır. Buna karşılık, elektrik sayaç verileri kullanılarak hesaplanan net boşluk oranları, fiilen kullanılan konut stokunu daha doğru biçimde yansıtarak boşluk oranlarının üst sınırını önemli ölçüde aşağı çekmekte ve ilçeler arasındaki farkları daha

sınırlı bir bantta ortaya koymaktadır. Bu karşılaştırma, konut stokuna ilişkin değerlendirmelerde veri setinin niteliğinin sonuçlar üzerinde belirleyici olduğunu ve boşluk oranlarının yorumlanmasında kullanılan verinin kapsamının mutlaka dikkate alınması gerektiğini göstermektedir.

ŞEKİL 21. 2024 yılı itibarıyla ilçeler düzeyinde net stok boşluk oranları (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

## Konut Fiyatları ve El Değiştirme

Arz tarafında, yeni konut üretimi ve mevcut stokun durumu kadar, konutların kira ve satış değerleri ile stoktaki el değiştirme düzeyi de alt konut piyasalarındaki sorun ve olanakları anlamak açısından önemlidir. Ülkemizde ilçeler düzeyinde fiyat ve kira verileri için resmi bir istatistik kaynağı bulunmamakta, bu tür bilgiler genellikle özel emlak

platformlarından derlenmektedir. Bu çalışma kapsamında, Endeksa’dan elde edilen veriler kullanılmış;

Mayıs 2025 ve Ağustos 2025 dönemlerinde satışa ve kiralamaya konu olan konut birimlerinin ortalama metrekare satış fiyatları ve kira değerleri ilçeler bazında hesaplanmıştır.

59 / 110

Şekil 22’de sunulan dağılım grafiği, ilçelerin ortalama satış fiyatı – kira ilişkisini göstermektedir. Şekil 23 ise TÜİK Konut Satış İstatistikleri kullanılarak 2015-2024 dönemine ait toplam satış hacimlerini ve 2024 yılındaki konut stokunun boyutlarını ortaya koymaktadır.

Konut Satış İstatistikleri kapsamında ilçe düzeyinde erişilebilen en eski veri 2015 yılına aittir. Bu veriler ışığında birkaç önemli bulgu öne çıkmaktadır. İzmir’de kira ve satış fiyatlarının aralığı oldukça geniştir. Bu durum, farklı sosyo-ekonomik gruplara hitap eden birden fazla alt konut piyasasının bulunduğunu

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

göstermektedir. Genel olarak konut satış fiyatı ile kira arasında güçlü bir ilişki gözlenmektedir. Ancak bu ilişki tam olarak doğrusal değildir ve öne çıkan bazı istisnalar vardır. Örneğin; Urla, Güzelbahçe ve Karaburun ilçelerinde yüksek satış fiyatlarının yanı sıra kira değerleri de orantısız şekilde yüksektir.

Çeşme’de ise çok yüksek satış fiyatlarına rağmen kira performansı göreli olarak düşüktür. Bu ilçelerde satış hacmi orta düzeyde, konut stoku ise sınırlıdır.

İkincil konut oranlarının yüksekliği, yüksek fiyat-düşük hacim kombinasyonunu açıklamaktadır.

ŞEKİL 22. 2025 yılı itibarıyla ilçeler düzeyinde metrekare kira ve konut satış değerleri

|  |  |  | Gü | Urla zelbahçe | Çeşme |
| --- | --- | --- | --- | --- | --- |
|  |  | K | araburun |  |  |
| Balçov Konak Born | a Çiğli ova Buca | Karşıyaka Foç Dikili Seferihisar Gaziemir | Narlıdere a |  |  |
| Alia Selç Bergama | ğa Menem uk Bayr Karabağlar | Menderes en aklı |  |  |  |
| Tire Ba Beydağ | Kemalpaşa Torbalı yındır |  |  |  |  |
| Kınık K | Ödemiş iraz |  |  |  |  |

TL/m2 Kira 200

100 10.000 30.000 70.000 90.000 110.000 130.000

TL/m2 Fiyat

Kaynak: Endeksa verilerinden üretilmiştir.

60 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 58

ŞEKİL 23. 2015-2024 döneminde toplam konut satışları ve toplam konut sayısı

120.000

100.000

80.000

60.000

40.000

250.000

200.000

150.000

Konut Birimi

100.000

20.000 50.000

Bergama

Foça

Urla

Kemalpaşa

Çeşme

Güzelbahçe Karaburun

Gaziemir

Tire

Balçova

Narlıdere

Bayındır

Selçuk

Kınık Kiraz

Beydağ

Toplam Satış (2015 - 2024)

Kaynak: TÜİK Konut Satış İstatistikleri ve UAVT verilerinden üretilmiştir.

Karşıyaka, Narlıdere ve Foça ilçeleri de yüksek kira düzeyleri ile dikkat çekmektedir. Narlıdere ve Foça’da satış hacmi görece sınırlıyken, Karşıyaka’da satış hacmi yüksektir. İzmir’de merkezi konumu ve büyük konut stoku sayesinde Karşıyaka, konut piyasasının belkemiği olan ilçelerden biridir. Karşıyaka gibi İzmir konut stokunun büyük bölümünü oluşturan Konak, Bornova, Çiğli, Menemen, Karabağlar, Torbalı ve Buca gibi büyük merkez ilçelerde satış fiyatları benzer düzeylerde seyrederken kira değerleri arasında belirgin farklar vardır. Bu durum, merkez içindeki alt piyasaların çeşitlendiğini göstermektedir.

Düşük konut fiyatı ve düşük kira grubundaki ilçeler ise Kiraz, Kınık, Ödemiş, Beydağ ve Bayındır ilçeleridir.

Özellikle Kiraz, Kınık, Beydağ ve Bayındır ilçelerinde stok kısıtlı, satış hacmi düşüktür. Diğer bir deyişle, bu düşük hacimli piyasalarda talep daha ziyade yerel kullanıcılardan gelmektedir. Özellikle Beydağ ilçesinde satış hacminin son 10 yıldır yıllık 20 konutun altında kalması nedeniyle TÜİK istatistiklerinde değerlendirme yapılmamaktadır.

Konak

Seferihisar Bayraklı

Karabağlar

Torbalı Karşıyaka Buca

Aliağa Menderes

Çiğli

Dikili

Bornova

Menemen

Ödemiş

Toplam Konut Sayısı (2024)

## 4.3. Genel Değerlendirme

İzmir kentinde 2014-2024 döneminde hane halkı yapısındaki değişimler, konut talebinin niteliğinde önemli bir dönüşümü işaret etmektedir. Çekirdek ailelerin payındaki azalma ve tek kişilik, tek ebeveynli ve aile olmayan hanelerin artışı kent genelinde küçük konutlara olan talebin giderek yükseldiğini göstermektedir. Bu eğilim, özellikle nüfus artışı yüksek olan Seferihisar, Torbalı, Menemen ve Karaburun gibi ilçelerde daha belirgindir. Diğer yandan, nüfus kaybı gözlenen ilçelerde bile hane sayısındaki artış, mevcut stokun yenilenmesi ve çeşitlenmesi ihtiyacını ortaya koymaktadır. Dolayısıyla, İzmir’de konut talebinin sadece sayısal artışla değil, hane tipine uygun çeşitlilik ve esneklikle karşılanması gerektiği açıkça görülmektedir.

Arz tarafında ise, üretilen yeni konut birimlerinin sayısal olarak hane artışını karşıladığı görülse de, konut büyüklüğü ve hane yapısı uyumu açısından ciddi uyumsuzluklar mevcuttur. 1-2 kişilik hanelerin payının yüksek olduğu ilçelerde büyük konut üretimi,

61 / 110

daha kalabalık hanelerin yoğun olduğu yerlerde ise küçük konutların tercih edilmesi, konut kullanım yoğunluğu ve karşılanabilirlik açısından riskler doğurmaktadır. Bu değerlendirme, hane halkı yapısındaki değişimlerin son yıllarda gerçekleşen yer değiştirme süreçlerini de içeren eğilimler üzerinden okunmasına dayanmaktadır. Gelişme alanı niteliğindeki bazı ilçelerde üretilen konutların metropoliten alan genelindeki talebe yanıt verdiği kabul edilmekle birlikte, mevcut üretim eğilimlerinin baskın hane profilleriyle uyumsuzluğunun, yer değiştirme dinamiklerinden bağımsız olarak belirli riskler üretebileceği değerlendirilmektedir. Bu durum, önümüzdeki dönemde konut planlamasında hane kompozisyonuna dayalı üretim ve yenileme stratejilerinin kritik önem taşıdığını ve arz-talep dengesinin sürdürülebilirliği için daha hassas mekânsal ve tipolojik planlamaya ihtiyaç olduğunu göstermektedir.

Yeni Girne, Karşıyaka

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

İzmir’de konut fiyatları ve kira değerleri oldukça geniş bir aralıkta seyretmektedir. Bu durum, farklı sosyo-ekonomik gruplara hitap eden birden fazla alt konut piyasasının varlığına işaret etmektedir. Genel olarak satış fiyatı ile kira arasında güçlü bir ilişki gözlenmekle birlikte, bazı ilçelerde istisnalar öne çıkmaktadır. İzmir konut piyasası, hem merkezi hem kırsal alanlarda farklı alt piyasaların varlığıyla karakterizedir. Merkezi ilçeler yüksek stok ve el değiştirme hacmi ile piyasanın belkemiğini oluştururken, sahil kesimlerinde ikincil konut talebinin etkisiyle fiyat-kira ilişkisi farklılaşmaktadır. Kırsal ve küçük ilçelerde ise düşük hacim ve sınırlı stok piyasayı daha dar ve yerel talep odaklı hale getirmektedir. Bu durum, hem arz planlaması hem de konut ihtiyacının karşılanması açısından önemli girdiler sunmaktadır.

62 / 110

60 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

## Sahil Yerleşimi, Çandarlı

63 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 5. TR31 BÖLGESI'NDE İKINCIL KONUT ALANLARI VE ORANLARINA İLIŞKIN DEĞERLENDIRME

Türkiye’de süregelen konut satış hacmine kıyasla ev sahipliği oranının artmaması çoklu konut sahipliği tartışmalarını gündeme taşımıştır (Aksoy Khurami ve Balaban, 2024). Aynı kentte biri ikamet, diğer(ler)i kira geliri elde etme amacı ile sahip olunan konutların yanı sıra, çoklu konut sahipliğinde bilinen ve gelenekselleşen formlardan bir diğeri kışlık ve yazlık kullanım amacıyla farklı lokasyonlarda konut birimlerine sahip olunmasıdır. Bu birimlerin sadece sahil kasabalarında değil, yaylada, köyde, farklı mevsimlerde daha konforlu bir iklim ve yaşam sunan çeşitli yerlerde olması mümkündür. Ayrıca iklim değişikliğinin de etkisiyle söz konusu birimlerin kullanım aralığının ve tercih edilen konumlarının da değişime uğraması muhtemeldir. Bu sebeple uluslararası literatürde yazlık konut birimlerinden ziyade ikincil konutlar kavramı üzerinden yürütülen çok sayıda çalışma bulunmaktadır. Bu çalışmalar, ikincil konut birimlerinin konut piyasası (Wind, Dewilde ve Doling, 2020), kırsal alanlar ve karakterleri (Halfacree, 2012), belirli demografik gruplar (Breuer, 2005) ve nüfus dinamikleri (Benson ve O'Reilly, 2009) üzerindeki etkilerini incelemektedir.

Konut stokunun mevcut durumu ve projeksiyon nüfusuna ilişkin konut ihtiyacının tespitine yönelik irdelemeler beraberinde konut kullanım sürelerinin incelenmesi gerekliliğini doğurmaktadır. Uluslararası çalışmalar konut stok kullanımını stok verimliliği, boşluk oranları ve kısmi kullanım biçimleriyle ilişkilendirmektedir. Konut stokunun dayanıklı bir varlık olması, özellikle boşlukların ve kısmi kullanımın piyasa uyum süreçlerini geciktirdiğini göstermektedir (Glaeser ve Gyourko, 2005). Benzer şekilde, yüksek boşluk oranları ve atıl kullanım, yerel konut piyasalarında mekânsal dengesizliklerin ve verimlilik kayıplarının temel göstergeleri olarak değerlendirilmektedir (Mallach, 2018). Avrupa ve OECD literatürü de boş konutlar, ikinci konutlar ve mevsimsel kullanım biçimlerinin konut stokunun bütüncül verimliliğini azalttığını vurgulamaktadır (OECD, 2021). Özellikle ikinci konutlar ve atıl kullanım üzerine yapılan çalışmalar, bu tür kısmi

kullanım pratiklerinin, konut stokunun etkin tahsisini sınırlayarak fiili stok verimliliğini düşürdüğünü ortaya koymaktadır (Clarke vd., 2010).

Stok verimliliği tartışmalarının yanı sıra COVİD-19 pandemisi ile beraber ikincil konut stoku ve bulundukları idari sınırlara eklenen nüfus yükü yeniden gündeme gelmiştir. Pek çok hane halkının birincil konutlarında erişemediği doğal ve yapılı çevre niteliklerine ikincil konut birimlerinde erişmesi sebebiyle pandemi süresince bu birimlere gözlenen geçiş ile beraber bu konutların stok içindeki payları da konut ihtiyacı projeksiyonlarının önemli bir bileşeni olmuştur. Bir diğer ifade ile, ikincil konut birimi olarak kullanılan pek çok konut biriminin güncel koşullarda birincil konut birimine dönüşme olasılığı sorgulamaya değer hale gelmiştir. Bu tartışmalar çerçevesinde yürütülen incelemelerde araştırmacılar ülkelerinde sunulan birincil veri setleri sayesinde birincil ve ikincil konut ayrımını rahatlıkla yapabilmektedir.

Araştırmanın bu kısmında kısmi kullanım; İzmir ilinde özgün ve öncelik verilmesi gereken sorun alanları ve çalışma konularının başında gelen ikincil konut alanları üzerinden şekillenmektedir. Bu kapsamda ikincil konut bir yılın tamamında kullanılmayan ve birincil konuta kıyasla daha kısa süre kullanılan konutları işaret etmektedir. Bu konutlar; yazlık konut birimleri, yayla evleri ve bağ evleri benzeri türevlerde değerlendirilmektedir. Türkiye’de ikincil konutların tespit edilmesinde yararlanılacak birincil veri kaynaklarının bulunmaması benzer pek çok çalışmanın olduğu gibi bu araştırmanın da kısıtıdır. Bu sebeple İzmir’de ikincil konut stokunun sorgulanması amacıyla bir dizi analiz yürütülmüştür.

64 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 62

## 5.1. İlçe Düzeyinde İkincil Konut Alanları ve Değişimi

İzmir kentinde ikincil konut stokunun ilçe düzeyinde tespit edilmesi amacıyla gerçekleştirilen analizlerde elde edilen temel sonuç, ilçeler arasında ikincil konut oranlarının önemli ölçüde farklılaştığıdır. İkincil veri kullanımının yanı sıra sonuçların saha çalışmalarıyla desteklenmesi gerekliliği nedeniyle, mahalle düzeyinde bulgular elde edilmiş olmasına karşın bu oranlar doğrudan sunulmamıştır. Bunun yerine görselleştirmeler ve metinsel ifadeler, belirlenen kırılım değerlerinin altında ya da üstünde olma durumuna göre belirtilmiştir. Şekil 24’te de ifade edildiği üzere,

ŞEKİL 24. 2024 yılı ikincil konut stoku oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

2024 yılı elektrik tüketimine dayalı ikincil konut stok oranı tahminlerine göre İzmir’de en yüksek oranlar Dikili, Karaburun ve Çeşme ilçelerinde gözlenmektedir.

Kınık, Foça, Seferihisar ve Menderes ilçeleri ise konut stokunun %20-30 aralığındaki bölümünün ikincil konutlardan oluştuğu ilçeler olarak tespit edilmiştir. En düşük oranlara ise kentsel yerleşik alanda yer alan ilçelerde rastlanmaktadır. Bu ilçelerde dahi ikincil konut oranlarının %2,5-5 aralığında olması, İzmir’de yılın belirli dönemlerinde kullanılan konutların sadece kıyı alanlarıyla sınırlı olmadığını ortaya koymaktadır.

65 / 110

İkincil konut stoku varlığının Yarımada Alt Bölgesi gibi kıyı ile ilişkisi güçlü olan ilçelerde yüksek olması beklenen bir sonuçtur. Ancak Bölge Planı kapsamında Kuzey İzmir Alt Bölgesi olarak anılan Aliağa, Dikili, Bergama ve Kınık ilçeleri ve bunların komşuluğunda yer alan Foça ilçesinde ve Güney İzmir Alt Bölgesi olarak anılan Selçuk, Tire, Ödemiş, Beydağ, Kiraz, Bayındır ve bunların komşuluğundaki Kemalpaşa ilçesinde de önemli düzeyde ikincil konut varlığı saptanmıştır.

Ulusal ve uluslararası literatürde ikincil konut stokunda yer alan birimlerin oranının hangi eşiğin üstünde ya da altında yer alması koşulunda stokun verimsiz kullanımına ilişkin bir yargıya varılacağı konusunda net bir ifade bulunmamaktadır. Ancak bu araştırmanın gereği olarak ikincil konut birimlerinin birincil konut birimlerine dönüşme potansiyeli oransal ve konum bazlı tartışılmaktadır. Bu sayede güncel gelişmeler ile birlikte COVİD-19 pandemisi sonrasında stok kullanım durumunda gözlemlenebilir bir değişikliğin varlığının ortaya konması hedeflenmiştir. Bu değişikliğin ortaya çıkışında birden fazla etkenin rol oynadığı düşünülmektedir. Özellikle, normal şartlar altında kısmi kullanıma sahip konutların artan kira düzeyleri sebebiyle gelir getirici bir varlık olarak değerlendirilmesine yönelik ekonomik motivasyonların hane halkı davranışlarını etkilediği varsayılabilir. Bununla birlikte, söz konusu eğilimin ampirik olarak incelenmesini mümkün kılacak doğrudan bir veri bulunmamaktadır.

Sorguya tabi olan faktörlerin ilki aynı kentte birden fazla konut birimine sahip olan hanehalklarının yaşamayı tercih ettiği konut birimini COVİD-19 pandemisi

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

süresince daha esnek bir yaşam alanı sunan ikincil konut birimlerine aktarması kaynaklıdır. Bu nedenle bazı ilçelerde ikincil konut birimi oranında azalma gözlenebilir. İkinci faktör ise hanehalklarının ikincil konut tercihlerini özellikle iklim değişikliği etkisi ile kıyı kesimden ziyade yaz aylarında daha serin bir iklim sunan yüksek rakımlı alanlara kaydırması üzerinden şekillenmektedir. Bu faktörün sonucu olarak bazı ilçelerde ikincil konut birimi oranında ve birim sayısında artış gözlenmesi beklenmektedir. Bu kapsamda 2018-2024 yılları arasında ikincil konut stok oranı değişim düzeyleri incelendiğinde 28 ilçenin 24 adedinde azalma gözlenirken sadece 4 ilçede ikincil konut stok oranının artma eğiliminde olduğu sonucuna ulaşılmıştır. Şekil 25’te ilçelerin mekânsal dağılımı ve stok değişim oranları verilmiştir. Artışın gözlemlendiği ilçeler Aliağa, Seferihisar, Kınık ve Menderes olarak tespit edilmiştir. Mukayesenin yapıldığı yıllar zarfında Kınık ve Menderes ilçeleri ikincil konut stok oranı %10’un üstünde artan ilçeler olarak bu anlamda öncü konumdadır. İkincil konut stokunun tüm konut stoku içinde oranının azalmasının en yoğun gözlemlendiği ilçeler ise %10 üstü azalış ile Kiraz, Dikili, Karaburun ve Çeşme ilçeleri olmuştur. Söz konusu ilçeler içerisinde Çeşme, Karaburun ve Dikili’de yer alan bu dönüşümlerin yazlık türünde kullanılan ikincil konutların birincil konutlara dönüşmesi ve sürekli kullanıma geçmesi aracılığıyla olduğu tahmin edilmektedir.

66 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 64

ŞEKİL 25. 2018-2024 yılları arasında ilçe düzeyinde ikincil konut stoku oranı değişimi (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

Tarım faaliyetleri ile öne çıkan Kiraz ilçesinde ise gözlemlenen azalış özgün niteliktedir. Kıyı ile doğrudan ilişkili olmayan bu ilçede hangi konumlarda yer alan ikincil konutların birincil konuta dönüşümünün gerçekleştiği ve bu dönüşümün ardında yer alan sebepler detaylı şekilde saha çalışmalarıyla analiz edilmelidir.

İkincil konut stok oranında yüksek artışın gözlemlendiği Menderes ve Kınık ilçelerinde ise diğer ilçelerde gözlemlenenin aksine stokun ilgili yıllar içerisinde daha fazla kesiminin kısmi kullanılmaya başlandığı sonucuna ulaşılmıştır. Kınık ilçesi hem İzmir’in diğer ilçeleri hem de Manisa’da yer alan iş sahalarına yakın olmasına karşın mevcut konut stokunun bu sahalarda

çalışan işgücü tarafından birincil stok olarak kullanım oranında 2018-2024 yılları arasında beklenen dönüşümü yaşamamıştır. İlçenin çevresine göre yüksek bir rakıma sahip olması Kınık’ın yayla ve bağ evleri şeklinde ikincil konut birimlerine sahip olma ihtimalini güçlendirmektedir. Menderes ilçesinde gözlemlenen ikincil stok oranı artışını ise hem sahip olduğu kıyı şeridi hem de Adnan Menderes Havalimanı ve IZBAN gibi ulaşım altyapısı ile açıklamak mümkündür. İzmir kenti içinde ve diğer iller ile güçlü bir bağlantı kurabilen Menderes’in son yıllarda ikincil konut stoku oranındaki artıştan da gözlemlendiği üzere tercih edilir bir konum haline geldiği düşünülmektedir.

67 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

ŞEKİL 26. 2024 yılı mahalle kırılımında ikincil konut stoku oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

2024 yılı için ikincil konut stok oranının payı %5’in üstünde olan ilçelerin mahalle kırılımında irdelendiği sonuçlar Şekil 26’da gösterilmiştir. Aynı ilçelerin farklı mahalleleri arasındaki ikincil konut stok oranları arasında önemli farklılıklar gözlenmiştir. Selçuk’tan başlayıp Güzelbahçe’ye kadar olan güney-batı ve batı koridoru boyunca kıyı mahallerinde saptanan yüksek ikincil konut stok oranı, kıyının İzmir için belirleyici rolünü ortaya koymaktadır. Ancak benzer etkinin denize kıyısı olan ilçelerin iç bölgelerine ulaşamadığı tespit edilmiştir. Foça ve Dikili hattı boyunca ise denizin belirleyici rolü güney-batı ve batı aksı kadar olmasa da aşikardır. İzmir’in ikincil konut stok oranının mahalle

düzeyinde dağılımında iç bölgelerde yer alan ilçelerin özgün bir dağılım sergilediği sonucuna ulaşılmıştır.

Sadece yüksek rakım ile açıklanamayan ve ilçenin önemli bir kesimine yayılan yüksek ikincil konut stok oranı daha detaylı saha çalışmaları ile incelemeyi gerekli kılmaktadır.

68 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 66

## 5.2. Seçilmiş İlçeler için Mahalle Kırılımında İkincil Konut Stoku Değişimi

İkincil konut stok oranı kadar bu oranın gözlem yılları arasındaki değişimi de önemlidir. Bu kapsamda, İzmir’in Kınık, Dikili, Menderes, Çeşme ve Kiraz ilçelerinde 2018– 2024 döneminde mahalle düzeyinde hesaplanan ikincil konut stok oranı değişimleri gösterdikleri farklı eğilimler sebebiyle ele alınmaktadır. Görsellerde sunulan ve lejantta yer alan değerler, 2024 yılı ikincil konut stok oranından 2018 yılı oranının çıkarılmasıyla elde edilmiştir.

## Kınık İlçesi

Kınık ilçesinde ikincil konut stokundaki değişim, ilçenin genelinde pozitif değerlerin baskın olduğu bir mekânsal örüntü sergilemektedir. Özellikle bazı mahallelerde %10–25 ve %25–75 aralığında artışlar belirginleşirken, sınırlı sayıdaki mahallede düşük ya da negatif değişimler

Bu nedenle negatif değerler, ikincil konutların bir bölümünün birincil konut kullanımına geçişini; pozitif değerler ise ikincil konut stokunun oranca artması ve varlığını güçlendirmesini ifade etmektedir. Söz konusu 5 ilçe için ikincil konut stoku oranındaki değişimler aynı zamanda 2018-2024 yılları arasında mahalle düzeyinde hane halkı sayısı değişimi ile bir arada irdelenmiştir.

gözlenmektedir. Artışların daha çok ilçe merkezine görece yakın veya ana ulaşım akslarıyla ilişkili mahallelerde yoğunlaştığı; buna karşılık tarımsal karakteri daha baskın, dağınık yerleşim yapısına sahip mahallelerde değişimin sınırlı kaldığı görülmektedir.

ŞEKİL 27. Kınık ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

Bu durum, ikincil konut stokundaki artışın homojen bir yayılma göstermediğini, belirli mahalle kümelerinde yoğunlaştığını ortaya koymaktadır (Şekil 27). Kınık’ta ikincil konut stokundaki artış hususunda belirleyici olan bir diğer faktör ise ilçenin tarıma dayalı ekonomik faaliyetleridir. Sonuç olarak ilçe genelinde ikincil konutların birincil konutlara dönüşmesi/çözülmesinden ziyade görece kırsal alanlarda güçlendiği bir yapı söz konusudur. Kınık’ta Fatih, Osmaniye, Türkcedit, Poyracık ve

Yeni mahallelerinde hane halkı artışı ile ikincil konut stokunun eş yönlü artışı dikkat çekmektedir. Bu mahalleler, ilçede yerleşik kullanımın görece güçlendiği alanları oluşturmaktadır. Buna karşılık Yukarı, Yayakent, Cumalı, Dündarlı ve Örtülü gibi mahallelerde hane halkı azalışı ile birlikte ikincil konut stokunun da gerilediği görülmektedir. Bu örüntü, Kınık’ta merkez ve merkez çevresi ile kırsal mahalleler arasında belirgin bir mekânsal ayrışmaya işaret etmektedir.

69 / 110

Dikili İlçesi Dikili ilçesinde ikincil konut stok değişimleri mahalle ölçeğinde büyük oranda %–10 ile %10 aralığında kalsa da, bazı mahallelerdeki daha yüksek negatif değerler nedeniyle ilçe genelinde ikincil konut stoku oranında belirgin bir azalış ortaya çıkmaktadır. Bu nedenle Dikili, ilçe düzeyinde ikincil konut stok oranının en yoğun azaldığı ilçeler arasında yer almakla birlikte, mahalleler arası dağılım açısından görece denge ve süreklilik gösteren bir örüntü sergilemektedir. Şekil 28’de ifade edildiği üzere mahallelerin önemli bir bölümünde %-10 ile %10 aralığında kalan değişimler hâkimdir. Bu aralık, ikincil konut stok oranı değişiminde yıllar arasında gözlenmesi beklenebilecek temel düzeyde bir farklılıktır. Bir diğer ifade ile değişim oranının %-10 ile %10 aralığında olması bu mahallelerde net bir dönüşüm olduğu anlamına

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

gelmemektedir. İncelemeye konu olan yıllardan birinde iklimin kış süresince daha ılıman geçmesi gibi bir etmen bu düzeyde basit değişikliklere sebep olabilmektedir. Buna karşın, kıyı hattına yakın bazı mahallelerde pozitif değerler daha belirgin hale gelmektedir.

Kıyıya yakın mahallelerde ikincil konut stokunun görece arttığı, iç kesimlerde ise değişimin daha zayıf kaldığı görülmektedir. Ancak bu artışlar, Çeşme veya Menderes’te gözlenen yüksek oranlara kıyasla daha sınırlıdır. Bu durum, Dikili’de ikincil konut kullanımının istikrarlı ve görece yerleşik bir karakter taşıdığını düşündürmektedir. Dikili, ikincil konut stokunda ne güçlü bir artış ne de belirgin bir çözülme sergilemektedir. İlçe, mahalleler arası farklılaşmanın sınırlı olduğu, orta düzeyde dengelenmiş bir mekânsal yapı ortaya koymaktadır.

ŞEKİL 28. Dikili ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

Dikili’de Gazipaşa, İsmetpaşa, Salimbey, Cumhuriyet ve Çandarlı mahallelerinde hane halkı artışıyla birlikte ikincil konut stokunun da artış eğiliminde olduğu görülmektedir. Bu mahallelerde iki göstergenin eş yönlü değişimi, ikincil konutların hâlâ güçlü bir kullanım biçimi olarak varlığını sürdürmesi ile beraber yerleşik nüfusta artışı da göstermektedir. İlçede kıyı boyunca gözlemlenen değişiklikler araştırmanın kapsadığı süreçte yapılan

doğalgaz vb. altyapı yatırımlarının etkisi ile açıklanabilir.

Buna karşın Gökçeağıl, Kıratlı, Demirtaş ve Esentepe gibi mahallelerde hane halkı artışının sınırlı olduğu ya da azalış gösterme eğiliminde iken bu mahallelerde eş zamanlı olarak ikincil konut stokun oranı normal sınırların içinde dalgalanma eğilimindedir. Dikili genelinde, hane halkı–ikincil konut ilişkisi daha tutarlı ve homojen, dönüşümden ziyade süreklilik odaklıdır.

70 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 68

Menderes İlçesi Menderes ilçesinde ikincil konut stokundaki artış, özellikle kıyı kesimlerinde ve güney mahallelerinde yoğunlaşmaktadır. Şekil 29‘da ifade edildiği üzere bu

alanlarda %25–75 aralığında artışlar dikkat çekmektedir. İlçenin iç ve kuzey mahallelerinde ise değişimler çoğunlukla daha düşük oranlarda kalmaktadır.

ŞEKİL 29. Menderes ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

Dağılım, Menderes’te belirgin bir mekânsal ayrışmaya işaret etmektedir. Kıyı mahalleleri ile iç kesimler arasında ikincil konut stok değişimi açısından net bir fark oluşmuştur. Bu ayrışma, ilçenin kendi içinde farklı ikincil konut dinamiklerine sahip alt bölgeler barındırdığını göstermektedir. Menderes’te ikincil konut stokundaki değişim, ilçenin tamamına yayılmak yerine, coğrafi konum ve mahalle özelliklerine bağlı olarak kümelenmektedir. Bu durum, ikincil konut artışının mekânsal olarak seçici bir süreç olduğunu ortaya koymaktadır.

Menderes ilçesinde Barbaros, Cüneytbey, Gölcükler, Kemalpaşa, Mithatpaşa, Kasımpaşa ve Çukuraltı gibi çok sayıda mahallede hane halkı artışı ile ikincil konut stokunun eş zamanlı güçlendiği bir yapı hâkimdir.

Bu durum, Menderes’te konut kullanım biçimlerinin birbirini dışlamadığını; yerleşik kullanım artarken ikincil kullanımın da varlığını koruduğunu göstermektedir. Buna karşılık Efemçukuru, Karakuyu ve bazı iç kesim mahallelerinde hane halkı artışının sınırlı kalmasıyla birlikte ikincil konut stokunun da zayıfladığı görülmektedir. İlçe genelinde baskın örüntü, dönüşümden ziyade genişleme ve çeşitlenme yönündedir.

71 / 110

Çeşme İlçesi Çeşme ilçesi, ikincil konut stokundaki değişim açısından en heterojen örüntüyü sunmaktadır. Bazı mahallelerde %-40 ile %-10 aralığında negatif değerler görülürken, bazı mahallelerde pozitif değişimler devam etmektedir (Şekil 30). Negatif değerlerin özellikle

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

yerleşik dokunun güçlü olduğu mahallelerde yoğunlaşması, ikincil konutların bir bölümünün birincil konut kullanımına dönüştüğünü göstermektedir. Buna karşılık, ilçenin bazı çevresel mahallelerinde ikincil konut stokunun artmaya devam ettiği görülmektedir.

ŞEKİL 30. Çeşme ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

Çeşme, ikincil konut stokunun hem arttığı hem de çözüldüğü alanların bir arada bulunduğu karmaşık bir mekânsal yapı sergilemektedir. Bu yönüyle ilçe, diğer kıyı ilçelerinden ayrışmakta ve ikincil konutların kullanım biçimindeki dönüşümü en açık biçimde yansıtmaktadır. Bu dönüşümün temel nedenlerinden biri olarak dijital göçebelerin varlığı ve yıl boyu kullanılan konut stokunun artış eğilimine geçmesi örnek olarak verilebilir.

Çeşme’de mahalleler arasında iki yönlü bir ayrışma dikkat çekmektedir. Alaçatı, Ilıca, Dalyan, Şifne ve Altınyunus gibi mahallelerde hane halkı artışı ile birlikte ikincil konut stokunda gerileme ya da sınırlı artış gözlenmektedir. Bu örüntü, konutların kullanımının daha sürekli hale geldiğini ve kısmi kullanım eğiliminin azaldığını düşündürmektedir. Buna karşılık

Ovacık, Germiyan, Ildır ve Çiftlik gibi mahallelerde hem hane halkı artışı hem de ikincil konut stokunun eş yönlü biçimde arttığı bir yapı görülmektedir.

Bu durum, Çeşme’de ikincil konut kullanımının tamamen çözülmediğini; bazı mahallelerde yerleşik nüfusun, bazı mahallelerde ise hem kısmi hem de sürekli kullanımın birlikte var olduğunu göstermektedir. Musalla, İsmet İnönü ve Cumhuriyet mahalleleri ise bu iki eğilim arasında geçiş alanları olarak öne çıkmaktadır.

72 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 70

Kiraz İlçesi Kiraz ilçesinde mahallelerin büyük bölümünde negatif ya da çok düşük pozitif değişimler gözlenmektedir.

İkincil konut stokundaki artışlar sınırlıdır ve belirgin kümelenmeler oluşturmamaktadır (Şekil 31). İlçenin genelinde ikincil konut stokunun çözülmesi, mevcut yapıların birincil konut kullanımına yönelmesiyle ilişkilendirilebilir. Bu durum, Kiraz’ın kırsal yerleşim

karakteriyle uyumludur ve ikincil konut kullanımının istikrarlı bir biçimde gerilediğini göstermektedir.

Kiraz, ikincil konut stokunun güçlenmediği; aksine kullanım biçiminin dönüştüğü bir örnek sunmaktadır.

İlçe, çalışmadaki diğer ilçelere kıyasla en sınırlı ikincil konut dinamizmine sahiptir.

ŞEKİL 31. Kiraz ilçesi 2018-2024 yılları arası ikincil konut stoku değişim oranı (%)

Kaynak: GDZ Elektrik ham verilerinden üretilmiştir.

Kiraz ilçesinde Cumhuriyet, İstiklal ve Yeni mahallelerinde sınırlı bir hane halkı artışı görülürken, ikincil konut stokundaki değişimin daha zayıf ve parçalı olduğu anlaşılmaktadır. Şemsiler, Yenikent, Çömlekçi ve Sarısu gibi mahallelerde ise hane halkı azalışı ile

ikincil konut stokunun eş zamanlı olarak zayıfladığı bir refleks dikkat çekmektedir. Kiraz genelinde iki değişken arasındaki ilişki güçlü kümelenmeler üretmemekte; daha çok durağan ve kırılgan bir yapı sergilemektedir.

73 / 110

## 5.3. Genel Değerlendirme

Türkiye’de bir konutun üretim süreci ve imar-iskan izinlerinde ikincil konut olduğunu belirtir bir ibare bulunmamaktadır. Bu da ikincil konutları hem tespit etmeyi hem de değişimlerini gözlemlemeyi zorlaştırmaktadır. 2018 ve 2024 yılı özelinde elektrik tüketimi varlığını baz alarak İzmir’de ikincil konut stokunun sorgulandığı bu bölümde, İzmir’in farklı ilçelerinde gözlenen ikincil konut stok oranındaki artış ve azalışlar, konut piyasasındaki nicel bir genişleme ya da daralmadan ziyade, konutun kullanım biçiminde ve toplumsal anlamında yaşanan dönüşümlere işaret etmektedir. Bu bağlamda ikincil konut sadece yazlık ya da kısmi barınma gibi dönemsel kullanıma sahip bir mekân olmaktan çıkmakta; çalışma, yaşam ve boş zaman pratiklerinin iç içe geçtiği çok işlevli bir ortama dönüşmektedir. Bu değişimde tüm Dünya’da olduğu gibi Türkiye ve İzmir örneğinde de COVİD-19 pandemisinin etkisi yadsınamaz.

İkincil konut stok oranının artması, konutların toplam stok içindeki payı açısından ikincil kullanımın güçlendiğini göstermektedir. İzmir örneğinde bu durum, özellikle kıyı ve kırsal nitelik taşıyan ilçelerde belirginleşmektedir. Literatürde ikincil konut artışı sıklıkla turizm ve mevsimsel mobiliteyle ilişkilendirilse de, son dönemde bu artışın daha parçalı ve süreksiz hareketlilik biçimleriyle birlikte düşünülmesi gerekmektedir. Kıyı konutlarının yalnızca kısa süreli tatil mekânları değil, yıl içinde farklı zamanlarda kullanılan, esnek süreli yaşam alanları haline gelmesi, ikincil konut oranındaki artışları daha karmaşık bir çerçevede ele almayı zorunlu kılmaktadır. Buna karşılık, ikincil konut stok oranındaki azalışlar, konutların ikincil statüsünü kaybederek birincil ya da yarı-sürekli kullanıma yöneldiğini göstermektedir. Bu tür bir dönüşüm, dijital göçebelik, uzaktan çalışma ve mekânsal esneklik kavramlarıyla yakından ilişkilidir. Dijital göçebelik literatüründe vurgulanan yarı-kalıcı yerleşim ve esnek süreklilik kavramları, ikincil konutların yılın büyük bölümünde aktif olarak kullanılan yaşam mekânlarına dönüşmesini açıklamak için işlevsel bir çerçeve sunmaktadır. İzmir’de bazı mahallelerde gözlenen negatif değişimler, bu dönüşümün mekânsal izleri olarak okunabilir.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

İzmir’de ikincil konut stoku bu konutların bulunduğu ilçelerin konum ve coğrafi özellikleri ile bir arada değerlendirildiğinde yayla kültürü ve kırsal alanlara yönelim önemli bir arka plan oluşturmaktadır. Yayla ve kırsal alanlar, tarihsel olarak mevsimsel hareketlilikle ilişkilendirilmiş olsa da, günümüzde bu alanlar uzun süreli ikamet ve çalışma mekânları olarak yeniden anlam kazanmaktadır. İkincil konutların bu alanlarda daha sürekli kullanılması, kırsalın yalnızca geçici bir kaçış alanı değil, gündelik yaşamın bir parçası haline geldiğini göstermektedir. Öte yandan, sanayi odaklı çalışma alanlarına ve üretim merkezlerine görece yakın olma isteği, konut tercihlerinde yeni bir denge arayışını ortaya çıkarmaktadır. Konutun kent merkezine tam bağımlı olmadan, farklı çalışma mekânlarıyla ilişki kurabilmesi, ikincil konutların kullanım süresini uzatan bir faktör olarak değerlendirilebilir. Bu durum, konutun mekânsal konumundan çok zamansal kullanım yoğunluğunu ön plana çıkarmaktadır.

Sonuç olarak, İzmir’de ikincil konut stok oranındaki artış ya da azalış, yalnızca konut sayısındaki değişimi değil, toplumsal hareketlilik, çalışma pratikleri ve mekânsal tercihlerdeki dönüşümü temsil etmektedir.

Bu sonuca ulaşılmasındaki en temel etmenlerden birisi, ikincil konut birimlerinin konumundaki çeşitlenme ile açıklanabilir. İkincil konut birimi olarak kullanıldığı tespit edilen konut alanların önemli bir kısmının, kıyı odaklı rekreasyon alanlarından uzak olmakla birlikte, İzmir metropol alanı içindeki sanayi bölgeleri, üretim alanları ve ana ulaşım akslarıyla daha güçlü mekânsal ilişkiler kurabilen konumlarda yer alması dikkat çekicidir. Bu durum, ikincil konut tercihleri açısından deniz-kum-güneş odaklı kullanımın yanı sıra, çalışma alanlarına görece erişilebilir olma isteğinin de belirleyici olmaya başladığına işaret etmektedir.

Bu değişiklik ve beraberindeki ikincil konut oranları, konutun geçici–kalıcı, tatil–yaşam, çalışma–dinlenme ikilikleri arasındaki sınırların giderek belirsizleştiği bir dönemin mekânsal göstergeleri olarak ele alınmalıdır.

Beş ilçe birlikte değerlendirildiğinde, ikincil konut stokundaki değişimin kıyıya yakınlık, mahallelerin yerleşikliği ve konum farkları üzerinden şekillendiği görülmektedir.

74 / 110

72 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Yeşildere, Konak

75 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 6. İZMIR'DE GECEKONDU VE KENTSEL DÖNÜŞÜM ALANLARINA İLIŞKIN DEĞERLENDIRME

## 6.1. Gecekondu Alanlarının Gelişimi

Türkiye’de gecekondu alanlarının ortaya çıkışı, gelişimi ve dönüşümü, Cumhuriyet’in kuruluşundan itibaren şekillenen kentleşme dinamiklerinin, ekonomik yönelimlerin ve yasal çerçevelerin bütünsel bir sonucu olarak değerlendirilebilir. 1923 sonrasında yaşanan hızlı kentleşme, konut arzı yetersizliği ve kırdan kente göç hareketleri, özellikle 1950’lerden itibaren Ankara, İstanbul, İzmir gibi büyük kentlerin çeperlerinde ve sanayi alanları çevresinde gecekondu alanlarının ortaya çıkmasına yol açmıştır. 1960’lara kadar, savaş sonrası yeniden yapılanma gereksinimleri, mübadele yoluyla gelen nüfusun yerleştirilmesi ve kırsal alanlardan sanayi merkezlerine göç eden nüfus gecekondu alanlarının ortaya çıkmasında önemli etkenler olmuştur. Kırdan kente göçün hızlanmasıyla konut sunumu yetersiz kalmış ve gecekondu gayriresmî bir çözüm olarak ortaya çıkmıştır. 1965 tarihli Kat Mülkiyeti Kanunu ile kat mülkiyetine yönelik uygulamaların temeli atılıp konut üretimi yasal bir zemine otururken yap-sat modeli ile konut üretiminin de önü açılmıştır. Mülkiyet sistemi parçalı yapıya geçerek kat mülkiyeti yaygınlaşmış, bu da kent merkezinde apartmanlaşmayı hızlandırırken gecekondu alanlarının dönüşümüne zemin hazırlamıştır.

İlerleyen süreçte gecekondu alanları sosyal bir olgu olarak tanınmış, planlama sistemine dâhil edilmiş ve gecekondunun yasallaşmasının ilk adımları atılmıştır.

Birinci Beş Yıllık Kalkınma Planı’nda gecekondular ilk kez toplumsal bir sorun olarak ele alınırken 1966 tarihli Gecekondu Kanunu ile gecekondu bölgeleri yasallaştırılmış ve bu alanlar için önleme, ıslah ve tasfiye süreçleri tanımlanmıştır. Gecekondu, kentlileşme sürecinin ilk basamağını simgelerken apartman mülkiyeti şehirli olmanın somut göstergesi hâline gelmiştir. Dolayısıyla gecekondu alanları yalnızca mekânsal değil, toplumsal ve sınıfsal dönüşümlerin

de belirleyicisi olmuştur. 1980 sonrasında neoliberal politikaların da etkisiyle, piyasa odaklı konut yaklaşımının ve kentsel dönüşümün ilk örnekleri ortaya çıkmıştır. 1983 tarihli 2805 ve 1984 tarihli 2981 sayılı yasalar, gecekondu ve kaçak yapıların tespiti, yasallaştırılması ve ıslah imar planları yoluyla dönüşümüne yönelik düzenlemeleri içermiştir. Bu politikalar gecekonduyu geçici barınma alanı olmaktan çıkararak yatırım aracına dönüştürmüş; spekülatif yap-sat modelinin gecekondu bölgelerinde yaygınlaşması ile gecekondu alanlarında apartmanlaşma hız kazanmıştır. Türkiye’nin ilk kentsel dönüşüm uygulamaları ise 1980lerin sonunda Ankara’da gerçekleştirilmiştir.

2002 yılı sonrası neoliberal yeniden yapılanmaya ve inşaat sektörünün ön plana çıkmasına paralel olarak TOKİ geniş yetkilerle güçlendirilmiş, belediyeler konut ve arsa üretiminde özel sektörle işbirliği yapabilir hâle gelmiş ve kentsel dönüşüm politikaları ulusal kalkınma stratejilerinin önemli bir bileşeni olmuştur. 5366 sayılı yasa ile tarihi kent dokuları dönüşüm kapsamına alınmış, 6306 sayılı yasa ile de planlama sisteminde kritik bir değişiklik olmuş ve afet riski kavramı üzerinden gecekondu dâhil tüm yapı stokunun dönüşümü yasal zemine oturtulmuştur. Böylece gecekondu alanları piyasa odaklı dönüşüm modelinin en önemli hedefi hâline gelirken deprem riskinin yanı sıra emlak değeri, getirim ve stratejik konum faktörleri dönüşüm kararlarını belirlemiştir. Genel olarak bakıldığında, Türkiye’de gecekondu alanları tarihsel süreçte af yasaları, mülkiyet dönüşümü, planlama uygulamaları ve kentsel dönüşüm politikalarıyla sürekli yeniden şekillenmiştir. Gecekondular başlangıçta devletin karşılayamadığı barınma ihtiyacına yönelik toplumsal bir çözüm olarak ortaya çıkmış; zamanla hukuki meşruiyet kazanmış, dönüşüm projeleriyle ise gecekonduların ekonomik değeri yükseltilmiş

76 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 74

ve gecekondu alanları özellikle son kırk yılda piyasa odaklı kentleşme stratejilerinin merkezine oturmuştur (Uzun, 2022).

İzmir’de de gecekondu olgusu, Türkiye’nin toplumsal dönüşümlerini doğrudan yansıtan tarihsel bir süreç olarak ortaya çıkmıştır. Cumhuriyet yıllarında Türk kentlerinin çoğunda olduğu gibi, İzmir’deki gecekondu dinamikleri de; göç hareketleri, ekonomik politikalar, sanayileşme, demografik değişimler ve yasal düzenlemelerin etkisi altında şekillenmiştir. Kentte gecekondular 1920’lerin sonunda ortaya çıkmaya başlamış, özellikle 1950’lerden itibaren de kentin mekânsal yapısını etkileyerek, dönüştürerek kalıcı bir karakter kazanmıştır.

Cumhuriyet’in ilk yıllarında İzmir’deki ilk gecekondu yerleşimleri; İkinci Kadriye, Yeni İstiklal, Zeytinlik ve Yeşildere çevresinde Basmane–Buca ekseninde ortaya çıkmış; ilerleyen yıllarda Cumhuriyet Mahallesi ve Naldöken gibi bölgelerde de gelişmiştir. İkinci Dünya Savaşı döneminin ekonomik yoksunlukları ve kırdan kente göç eğilimleri, 1940’lı yıllarda gecekondulaşmayı hızlandırmış; Kadifekale ve eteklerinde yeni mahalleler oluşmuştur.

1950’li yıllarda İzmir’de sanayi yatırımlarının yoğunlaşmasıyla, kentte imalat sektöründe çalışan nüfus ülke ortalamasının iki katına çıkmıştır. Sanayi işçiliği, mevsimlik tarım işçiliği ve küçük ticaret, kente göç eden nüfusun temel geçim alanları olmuştur. Bunun sonucunda da gecekondu mahallelerinin sayıları hızla artmaya başlamıştır. Gürçeşme, Samantepe, Boğaziçi, Gültepe, İstiklal gibi mahalleler İzmir’in yoğun gecekondu merkezleri hâline gelmiştir.

1963-1965 yıllarında yapılan araştırmalar İzmir’de yaklaşık 18–24 bin gecekondu bulunduğunu ve gecekonduların kentsel konut stokunun üçte birini oluşturduğunu ortaya koymuştur. Bu dönemde İzmir’in gecekondu alanları kentin güney ve doğu yamaçlarında yoğunlaşırken Yeşildere Vadisi ve Kadifekale çevresi gecekondu kuşağı hâline gelmiştir. Bunun yanı sıra kent çeperinde de Bornova, Buca, Altındağ, Çamdibi gibi bölgeler yeni gecekondu merkezleri olarak güçlenmiştir. 1970’lerde İzmir’de gecekondu alanları yayılırken nitelikleri de değişmiş, gecekondu sahipleri konutlarını kiraya vermeye ve yapılarını büyütmeye başlamıştır (Özdemir, vd., 2005).

ŞEKİL 32. 1960'lı yılların sonunda İzmir merkez ilçelerde gecekonduların düzenli konuttan fazla olduğu mahalleler

Kaynak: Keleş (1973)

77 / 110

1980’li yıllar, İzmir’de gecekondu gelişiminde yeni bir kırılma noktası olurken, ülke çapındaki neoliberal ekonomik dönüşüm burada da etkili olmuş, imar afları, ıslah imar planları ve tapu dağıtım süreçleri ile gecekonduların büyük kısmı yasallaşırken gecekondu alanları apartmanlaşmaya başlamıştır. Kent çeperinde toplu konut projeleri gerçekleştirilirken, merkezi gecekondu bölgeleri de apartman bloklarıyla yeniden yapılanmıştır (Arslan Avar, 2025).

1980’li yıllardan itibaren İzmir’de gecekondu alanları, kentin içine girdiği birikim krizinin aşılmasında

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

önemli bir rol üstlenmiştir. Bu dönemden sonra sürekli genişleyip yoğunlaşan gecekondu alanları, özellikle belediye sınırlarının yeniden düzenlenmesi ve kent içindeki hazine arazilerinin giderek tükenmesi nedeniyle, kentin daha uzak bölgelerine ve yerleşimi güç eğimli alanlara doğru yayılmaya başlamıştır. Söz konusu yayılma; Çiğli, Menemen, Bornova, Gaziemir ve Karabağlar ilçelerinde gözlemlenmiştir. Bu alanların yanı sıra, hisseli tapu olanaklarının bulunduğu ve düşük maliyetli arazilerin erişilebilir olduğu Buca, Narlıdere ve Güzelbahçe bölgeleri de gecekonduların yoğunlaştığı bölgeler haline gelmiştir (Ünverdi, 2002).

ŞEKİL 33. İzmir merkez ilçelerde gecekondu alanlarının gelişimi

Kaynak: Tezcan ve Zengin (2018 s.81)

78 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 76

## 6.2. Kentsel Dönüşüm

2000li yılların başında birçok kentte uygulanmaya başlayan kentsel dönüşüm projeleri İzmir’de ilk olarak İzmir Büyükşehir Belediyesi tarafından 2006 yılında başlatılmıştır. Bu projeler öncelikle “Afet riskini azaltma amacıyla tamamlanan kentsel yenileme projeleri” olarak planlanmış ve Kadifekale, Yeşildere ve Gürçeşme’de uygulanmıştır. Bunların yanı sıra 6306 sayılı yasa ve 5393 sayılı yasanın 73. Maddesi kapsamında dönüşüm projeleri planlanmıştır (Tezcan ve Zengin, 2018).

İzmir Büyükşehir Belediyesi tarafından hazırlanan 1/25000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı kapsamında düşük nitelikli yaşama alanları “Sağlıklaştırma-Yenileme Program Alanları” kapsamında ele alınmış ve bu program ile çevre kalitesinin artırılarak gelişmenin kısıtlı olduğu kent merkezinde nitelikli mekanların, alt yapı olanaklarının yaratılması

ve kent merkezinin yaşam standartlarının yükseltilmesi hedeflenmiştir. Plan raporunda bu alanların toplamda İzmir merkez ilçelerdeki kentsel kullanım alanının %13,7’sini, konut alanlarının ise %39’unu kapsadığı, yapılaşmasını büyük oranda tamamlamış olan 11102,8 hektar kentsel yerleşme alanının 4310 hektarının gecekondu ve imar afları sonucunda gelişmiş alanlar olduğu belirtilmektedir (İzmir Büyükşehir Belediyesi, 2009). Plan kapsamında tanımlanan yenileme alanları Tablo 11'de verilmektedir. Plan kapsamında Tablo 11’de yer verilen alanların dışında 1990’lı Yıllarda Yenileme Planları Yapılan Ancak Geliştirilemeyen Bölge Ve Program Alanları’na da yer verilmiştir. Bu alanlar Altındağ-Çamdibi Yenileme Alanı (613,1ha), Karşıyaka Yeni Girne Batısı-Anadolu Caddesi Çevre Yolu Arası (105,3ha) ve Yenişehir-Gürçeşme-Yeşildere Sağlıklaştırma Yenileme Alanı’dır (284,2 ha).

TABLO 11. 1/25.000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı “Sağlıklaştırma-Yenileme Program Alanları”

| Alan | Alan Büyüklüğü (ha) | Kapsanan Mahalleler | Bina sayısı | Bağımsız bölüm sayısı | 2000 yılı nüfusu |
| --- | --- | --- | --- | --- | --- |
| 1.Etap Yenileme-Sağlıklaştırma Alanı | 36,4 | Cennetçeşme | 1286 | 1744 | 3354 |
| 2.Etap Yenileme-Sağlıklaştırma Alanı | 126,5 | Salih Omurtak, Bahriye Üçok, Limontepe, Ali Fuat Erden | 3664 | 5334 | 14801 |
| 3.Etap Yenileme-Sağlıklaştırma Alanı | 167,5 | Umut, Gazi, Özgür, Yüzbaşı Şerafettin, Yurtoğlu | 5747 | 10134 | 33144 |
| 4.Etap Yenileme-Sağlıklaştırma Alanı | 32,6 | Uzundere | 299 | 601 | 2932 |
| 5.Etap Yenileme-Sağlıklaştırma Alanı | 314,8 | Devrim, Abdi İpekçi, İhsan Alyanak, Peker, Uzundere | 4725 | 9507 | 30353 |
| 6.Etap Yenileme-Sağlıklaştırma Alanı | 154,5 | Aktepe, Emrez | 2381 | 5406 | 11267 |
| 7.Etap Yenileme-Sağlıklaştırma Alanı | 292,5 | Kibar, Günaltay, Barış, Selvili, Yunusemre, Aydın | 11118 | 26954 | 53945 |
| 2-Nolu Sağlıklaştırma Program Alanı | 315,8 | Bayraklı, Alparslan, Çiçek, Fuat Edip Baksı, Cengizhan, M.Erener, R.Şevket, İnce, Çay | 16694 | 38055 | 86491 |

79 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

| Alan | Alan Büyüklüğü (ha) | Kapsanan Mahalleler | Bina sayısı | Bağımsız bölüm sayısı | 2000 yılı nüfusu |
| --- | --- | --- | --- | --- | --- |
| 3-Nolu Yenileme-Sağlıklaştırma Program Alanı | 350,7 | Emek, Gümüşpala, Yamanlar, Orgeneral Nafiz Gürman, Onur | 6084 | 13573 | 72213 |
| 4-Nolu Sağlıklaştırma Program Alanı | 161,3 | Aziziye, Duatepe, 1.Kadriye, 2.Kadriye, Hasan Özdemir, 19 Mayıs, Çimentepe, Kocatepe, Zafertepe | 11503 | 22306 | 40064 |
| 5-Nolu Yenileme-Sağlıklaştırma Program Alanı | 255,6 | Şirintepe, Güzeltepe, Köyiçi | 4426 | 6934 | 17031 |
| 6-Nolu Yenileme-Sağlıklaştırma Program Alanı | 245,5 | Mevlana ve Doğanlar | 5111 | 11330 | 24559 |
| 7-Nolu Yenileme- Sağlıklaştırma Program Alanı | 495,7 | Hürriyet, İnkilap, Osman Aksuner, Aşık Veysel, Akıncılar, Seyhan, Göksu, İnönü, Binbaşı Reşatbey | 15391 | 39670 | 58471 |
| 8-Nolu Sağlıklaştırma Program Alanı | 106,4 | Adalet, Mansuroğlu | 2450 | 6393 | 33399 |
| 9-Nolu Sağlıklaştırma-Dönüşüm Program Alanı | 23,5 | Narlıdere ilçesinde | 1301 | 1722 | 9862 |
| 10-Nolu Yenileme-Sağlıklaştırma Program Alanı | 81,1 | Gültepe, 26 Ağustos, Ulubatlı, Mehmet Akif, Saygı | 5157 | 11517 | 20365 |
| 11-Nolu Yenileme-Sağlıklaştırma Program Alanı | 95,3 | Menemen İlçesinde |  |  |  |
| 12-Nolu Yenileme- Sağlıklaştırma Program Alanı | 52 | Menemen İlçesinde |  |  |  |
| 13-Nolu Yenileme-Sağlıklaştırma Program Alanı | 27 | Menemen İlçesinde |  |  |  |
| 14-Nolu Yenileme-Sağlıklaştırma Program Alanı | 22,5 | Menemen İlçesinde |  |  |  |
| 15-Nolu Yenileme-Sağlıklaştırma Program Alanı | 61 | Menemen İlçesinde |  |  |  |

Kaynak: İzmir Büyükşehir Belediyesi, "1/25.000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı Revizyonu Açıklama Raporu”ndan üretilmiştir.

2012 yılında yürürlüğe giren 6306 sayılı yasa doğrultusunda Çevre, Şehircilik ve İklim Değişikliği Bakanlığı tarafından İzmir’de toplam 918.2 ha riskli alan ilan edilmiş ve bazı alanlar da riskli alan ilan edilmek üzere önerilmiştir (Tablo 12). Bu alanlarda gerçekleştirilecek

dönüşüm projelerinde Karabağlar ilçesi dışındakilerde Çevre, Şehircilik ve İklim Değişikliği Bakanlığı yürütme yetkisini ilgili belediyelere devretmiştir.

80 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 78

TABLO 12. 6306 sayılı yasa doğrultusunda Çevre, Şehircilik ve İklim Değişikliği Bakanlığı tarafından ilan edilen ve önerilen riskli alanlar

|  | İlçe | Mahalle | Alan (Ha.) |
| --- | --- | --- | --- |
| İlan edilen alanlar | Karabağlar | Cennetçeşme, Salih Omurtak, Bahriye Üçok, Limontepe, Ali Fuat Erdem, Umut, Gazi, Özgür, Yüzbaşı Şerafetin Mah. (Tamamı)- Devrim, Yurtoğlu, Abdi İpekçi, İhsan Alyanak, Uzundere Ve Peker Mah. (Kısmen) | 540 |
|  | Menemen | Seydinasrullah (Tamamı) Ahihıdır, Gaybi, Tülbentli ve Kazımpaşa(Kısmen) İlave: Tülbentli, Zafer, Kazımpaşa, Esatpaşa | 62 |
|  | Narlıdere | 2. İnönü, Atatürk, Çatalkaya, Narlı (Kısmen) | 43 |
|  | Karabağlar- Buca | Osman Aksüner, Aşık Veysel, Seyhan(Buca), Aydın (Kısmen) | 191 |
|  | Karşıyaka | Cumhuriyet (Kısmen) | 2,59 |
|  | Kemalpaşa | Soğukpınar, Atatürk | 79,57 |
| Öneri alanlar | Buca | Hürriyet tamamı, İnkılap, Akıncılar Mahallelerinin bir kısmı | 160 |
|  | Buca | Çaldıran Mahallesinin tamamı | 17,5 |
|  | Karşıyaka | Bostanlı Mahallesinin bir kısmı | 0,52 |
|  | Karşıyaka | Alaybey, Tersane ve Tuna Mahallelerinin tamamı ile Donanmacı, Bahariye, Bahriye Üçok Mahallelerinin ise bir kısmı | 93 |
|  | Aliağa | Atatürk Mahallesinin bir kısmı | 5,6 |

Kaynak: https://webdosya.csb.gov.tr/db/izmir/editordosya/sunum(1).pptx adresinde yer alan sunumdan üretilmiştir.

6306 sayılı yasanın yanı sıra 5393 Sayılı Yasanın 73. maddesi kapsamında İzmir’de dokuz kentsel dönüşüm ve gelişim proje alanı ilan edilmiştir (Tablo 13). Bu proje alanlarının bir kısmının 1/25000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı kapsamında

önerilen yenileme ve sağlıklaştırma alanı ile örtüştüğü anlaşılmaktadır. Dönüşüm projeleri ile yenileme ve sağlıklaştırma alanlarının konumları Şekil 34'te verilmektedir.

81 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

TABLO 13. 5393 Sayılı Yasanın 73. maddesi kapsamında ilan edilen kentsel dönüşüm ve gelişim proje alanları

| İlçe | Mahalle | Yürüten Kurum | Alan (Ha.) |
| --- | --- | --- | --- |
| Gaziemir | Aktepe, Emrez | İzmir Büyükşehir Belediyesi | 121,8 |
| Bayındır | Necatı Uza, Yenice, Hatay | Bayındır İlçe Belediyesi | 13 |
| Torbalı | Çaybaşı, Yenimahalle | Torbalı İlçe Belediyesi | 6,3 |
| Karabağlar | Uzun Dere | İzmir Büyükşehir Belediyesi | 31,5 |
| Konak | Ballıkuyu, Kosova, Akarcalı, Yeşildere, Koca Kapı | İzmir Büyükşehir Belediyesi | 48 |
| Karşıyaka | Örnekköy | İzmir Büyükşehir Belediyesi | 17,9 |
| Bayraklı | Alparslan, Cengizhan, Fuat Edip Baksı | İzmir Büyükşehir Belediyesi | 60 |
| Konak | Ege Mahallesi | İzmir Büyükşehir Belediyesi | 7 |
| Çiğli | Güzeltepe | İzmir Büyükşehir Belediyesi | 21 |

Kaynak: https://webdosya.csb.gov.tr/db/izmir/editordosya/sunum(1).pptx adresinde yer alan sunumdan ve https://kentseldonusum.izmir. bel.tr/tr/anasayfa/#proje adresinde yer alan bilgilerden üretilmiştir.

82 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 80

ŞEKİL 34. İzmir merkez ilçelerde dönüşüm projeleri ile yenileme ve sağlıklaştırma alanları

Güzeltepe

Çiğli

Örnekköy

Karşıyaka

İzmir Körfezi

Kadifekale

Bayraklı

Bayraklı

Ege Mahallesi

Konak Bornova

Ballıkuyu

Balçova Karabağlar Buca

Narlıdere

Uzundere

Karabağlar

Kaynak: http://izmirproje.crp.metu.edu.tr/2021/09/07/proje-kitapcigi/

## İki Çeşmelik, Konak

Gaziemir

Gaziemir

83 / 110

## 6.3. Genel Değerlendirme

Türkiye’de gecekondu olgusu, Cumhuriyet sonrası kentleşme sürecinin yapısal sorunlarına verilen toplumsal bir yanıt olarak ortaya çıkmış; zaman içinde ekonomik, hukuki ve mekânsal dinamiklerin etkisiyle sürekli dönüşerek günümüze kadar ulaşmıştır.

Başlangıçta devletin karşılayamadığı barınma ihtiyacını gayriresmî yollarla çözen bir pratik olarak gelişen gecekondular, 1960’lardan itibaren planlama ve hukuk sistemi içinde tanınmış, 1980 sonrasında ise neoliberal politikalar ve imar afları aracılığıyla piyasa mekanizmalarına eklemlenmiştir. Bu süreçte gecekondu alanları yalnızca barınma alanları olmaktan çıkmış; mülkiyet dönüşümü, spekülatif konut üretimi ve kentsel rantın önemli taşıyıcıları hâline gelmiştir.

Özellikle 2000’li yıllar sonrasında kentsel dönüşüm politikalarıyla birlikte gecekondu alanları, afet riski söylemi ve ekonomik değer üretimi üzerinden yeniden tanımlanmış ve kent politikalarının merkezinde yer almıştır.

İzmir özelinde gecekondu gelişimi, kentin sanayileşme süreci, göç dinamikleri ve planlama kararlarıyla paralel biçimde ilerlemiş; gecekondu alanları kentin

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

mekânsal büyümesinde ve yeniden yapılanmasında belirleyici bir rol üstlenmiştir. 1950’lerden itibaren kentin güney ve doğu yamaçlarında yoğunlaşan gecekondu alanları, zamanla merkezden çepere doğru yayılmış; 1980 sonrası dönemde ise imar afları ve yenileme planlarıyla büyük ölçüde yasallaşarak apartmanlaşmıştır. İzmir Büyükşehir Belediyesi’nin planlama belgelerinde geniş yer bulan sağlıklaştırma ve yenileme program alanları, gecekondu alanlarının kent bütününde ne denli yaygın ve yapısal bir olgu olduğunu ortaya koymaktadır. 6306 sayılı yasa kapsamında ilan edilen riskli alanlarla birlikte bu bölgeler, günümüzde yalnızca fiziksel riskler üzerinden değil, aynı zamanda mekânsal değerlenme ve dönüşüm potansiyeli üzerinden ele alınmakta; bu durum, gecekondu alanlarının İzmir’de de piyasa odaklı kentsel dönüşüm politikalarının temel hedeflerinden biri hâline geldiğini göstermektedir.

84 / 110

82 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Çamdibi, Bornova

85 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 7. İZMIR'DE KONUT GEREKSINIMI VE KONUT İHTIYACI

Çalışma kapsamında kurgulanan ve yöntemsel ayrıntıları bu raporun 2.4 başlıklı bölümünde sunulan konut ihtiyaç modeli, İzmir il bütünü ve ilçe ölçeğinde birikmiş konut ihtiyaçlarını ve gelecekte ortaya çıkması öngörülen gereksinimler ve ihtiyaçları birlikte ele alan bütünleşik bir çerçeve sunmaktadır. Modelin tüm hesaplama süreci elektronik tablo (Excel) ortamında oluşturulmuştur. Bu raporun eki niteliğindeki dosyada; modelde kullanılan tüm stok ve hane halkı değişkenleri, temel bileşenler, çıktı göstergeleri, kullanılan oranlar ve varsayımlar açık bir biçimde yer almakta; İzmir il geneli ile birlikte 30 ilçe için ayrı ayrı hesaplamalar yapılabilmektedir. Dosya, her bir değişkene ilişkin hesaplama formüllerini hücre bazında içerecek şekilde kurgulanmış olup, modelin işleyişinin izlenmesine, varsayımlardaki değişikliklerin sonuçlara etkisinin görülmesine ve alternatif politika senaryolarının değerlendirilmesine olanak tanımaktadır. Modelin İzmir geneli ve ilçeler ölçeğinde ortaya koyduğu bulgular, aşağıda hane halkı yapısı ve bu yapıdaki dönüşümler dikkate alınarak yorumlanmaktadır. Sunulan değerlendirmelerin doğru bağlamda ele alınabilmesi amacıyla, modelin dayandığı temel varsayımlar ve kabuller kısaca yeniden hatırlatılmaktadır.

1. Yeni hane kaynaklı gereksinim, gelecek dönemlerde oluşması beklenen hane halkı sayısına eşittir.

2. Mevcut karşılanabilir konut ihtiyacı, il veya ilçede karşılanabilirlik sorunu yaşayan hanelerin %85'ini kapsamaktadır.

3. Sosyal konut ihtiyacı, karşılanabilirlik, aşırı kalabalıklık ve konut yoksunluğu sorunlarını bir arada yaşayan hanelerin %85'ini içermektedir.

4. Gelecek döneme ait karşılanabilir konut ihtiyacı, il veya ilgili ilçedeki karşılanabilirlik oranı kullanılarak ve bu sorunu yaşaması muhtemel hanelerin %85'i esas alınarak hesaplanmıştır.

5. Dönüşüm / yenileme ihtiyacının, 25 yıllık dönemde 1980 öncesi yapılmış konutların %50'si, 1981- 2000 döneminde yapılmış konutların ise %20'si için geçerli olduğu varsayılmıştır. Bayraklı, Buca ve Gaziemir ilçeleri için gecekondu nitelikli konut birimi sayısı, dönüşüm/yenileme ihtiyacı yerine kullanılmıştır.

6. Boş stokun bir bölümünün dönüşüm/yenileme ihtiyacı ile örtüşebileceği dikkate alınarak, tahmin edilen boş stokun %50'sinin konut gereksinimini karşılamada kullanılabilir olduğu kabul edilmiştir.

7. Konut piyasasının işleyişini sürdürebilmesi için her dönemde %4 oranında zorunlu konut boşluğu bulunması gerekli görülmüştür.

## 7.1. İzmir ve İlçelerinde Konut Gereksinimi ve Konut İhtiyacı

Modelin temel bilgi ve bulgularının özeti Tablo 14'te sunulmaktadır. Bu doğrultuda, İzmir'de 2024 yılı itibarıyla aktif olarak kullanımda olan yaklaşık 2 milyon konut birimi olduğu görülmektedir. Bu konutların yaklaşık %8'i ikincil konut niteliğindedir. Aynı yıl itibarıyla hane halkı sayısının yaklaşık 1 milyon 560 bin olduğu dikkate alındığında, konut stokunun yaklaşık %16'sının (ikincil konutlar hariç) boş durumda olduğu anlaşılmaktadır1. Bu boşluğun bir kısmının inşaatı tamamlanmış ancak henüz ikamet edilmeyen konutlardan kaynaklandığı; bir kısmının ise satılık ya da kiralık olarak piyasada dolaşımda olduğu değerlendirilmektedir. Bunun yanı sıra, boş stokun belirli bir bölümünün yatırım amacıyla elde tutulan ve fiilen piyasaya sunulmayan konutlardan oluştuğu öngörülmektedir.

Boş kalan konutların tümüne ilişkin nedenler net olarak tespit edilememekle birlikte, söz konusu stokun

1 Hane halkı sayısının belirlenmesinde ADNKS verileri esas alınmıştır. Söz konusu veriler, geçici koruma statüsüyle ülkede bulunan Suriyeli nüfusu kapsamadığından, bu grup nüfus ve hane halkı hesaplamalarına dâhil edilmemiştir. 2024 yılı itibarıyla İzmir’de geçici koruma kapsamında bulunan Suriyeli nüfusun yaklaşık 120–130 bin kişi olduğu bilinmektedir. Ortalama hane büyüklüğü varsayımıyla bu nüfus yaklaşık 25 bin haneye karşılık gelmektedir. Hane halkı projeksiyonlarında da resmi göç senaryosu esas alındığından, geçici koruma statüsündeki haneler model kapsamı dışında bırakılmıştır.

86 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 84

bir bölümünün konut gereksiniminin karşılanmasında kullanılabileceği değerlendirilmektedir.

İzmir genelinde önümüzdeki 25 yıllık dönemde, yeni hane oluşumları ve göç etkisiyle yaklaşık 985 bin yeni hanenin ortaya çıkacağı tahmin edilmektedir. Buna ek olarak, afet riskleri dikkate alındığında, 2000 yılı öncesinde inşa edilmiş konutların önemli bir kısmının yenilenme ihtiyacı bulunmakta olup, bu kapsamda yaklaşık 380 bin konut biriminin dönüşüm gereksinimi olduğu öngörülmektedir. Bu doğrultuda, İzmir için yeni hane oluşumu ve yenileme ihtiyacından kaynaklı gereksinim 1 milyon 365 bin konut olarak hesaplanmıştır. Bu gereksinimin bir kısmının sosyal konut olarak kamu kesimi tarafından karşılanacağı varsayımı ile özel sektör üretimi ile piyasa koşullarında karşılanması beklenen gereksinim düzeyi 1 milyon 332 bin konut olarak tahmin edilmiştir.

Mevcut boş stok ve yıllık ortalama konut üretim düzeyi birlikte değerlendirildiğinde, il genelinde önümüzdeki 25 yıllık dönemde konut arzının niceliksel olarak gereksinimin gerisinde kalacağı değerlendirilmektedir. Ancak arzın mekânsal dağılımındaki farklılıklar nedeniyle, ilçeler arasında gereksinimin mevcut üretim düzeyi ve boş stok varlığı ile karşılanma düzeyinde farklılıklar görülmektedir (Bkz. Tablo 14, sütun 10). Bununla birlikte, talep tarafında önemli bir karşılanabilirlik sorunu bulunmaktadır.

2024 yılı itibarıyla il genelinde yaklaşık 347 bin hanenin barınma maliyetlerini karşılamakta zorlandığı tahmin edilmektedir. Önümüzdeki 25 yıllık süreçte bu gruba yaklaşık 192 bin hanenin daha eklenmesi beklenmektedir. Özetle, 2050 yılına kadar karşılanabilirlik sorunları yaşayacak toplam hane sayısı 540 bin olarak tahmin edilmiştir. Bu hanelerin büyük bölümünün yeni konut talebi yaratmaktan ziyade, mevcut konutlarında barınabilmelerini sağlayacak destek mekanizmalarına ihtiyaç duyduğu değerlendirilmektedir. Öte yandan, 2024 yılı itibarıyla yaklaşık 85 bin hanenin acil sosyal konut ihtiyacı bulunduğu; bu sayının 25 yıllık dönemde yaklaşık 32 bin hane daha artacağı öngörülmektedir. 2050 yılına kadar yaklaşık 118 bin hane için sosyal konut üretimi planlanması gerektiği değerlendirilmektedir.

Sonuç olarak; İzmir il genelinde yeni hane oluşumu ve yenileme ihtiyacından kaynaklanan konut gereksiniminin, mevcut özel sektör üretim kapasitesi ve mevcut boş stok varlığı ile niceliksel olarak karşılanmasının mümkün olmadığı değerlendirilmektedir. Ayrıca 2050 yılına kadar yaklaşık 118 bin hane için sosyal konut üretiminin öncelikli bir politika alanı olarak ele alınması gerektiği; buna ek olarak yaklaşık 540 bin haneye yönelik olarak kira desteği, konut yardımı ve benzeri karşılanabilirlik odaklı politika araçlarının geliştirilmesinin gerekli olduğu sonucuna ulaşılmaktadır.

İlçeler özelinde yapılan inceleme, konut gereksiniminin mevcut üretim düzeyi ve boş stok varlığıyla karşılanma düzeyinin farklılıklar gösterdiğini ortaya koymaktadır. Çiğli, Karşıyaka, Menemen ve Seferihisar ilçelerinde 2050 yılına kadar ortaya çıkması öngörülen konut gereksiniminin mevcut piyasa koşulları çerçevesinde karşılanabilir olduğu, hatta bu süreçte arz fazlası oluşma olasılığının yüksek olduğu değerlendirilmektedir. Bununla birlikte, söz konusu ilçelerin sosyoekonomik ve mekânsal özelliklerinin birbirinden farklı olduğu; dolayısıyla ortaya çıkabilecek arz fazlasının nedenlerinin her ilçe için aynı niteliği taşımadığı dikkate alınmalıdır. Örneğin Seferihisar’da yazlık amaçlı kullanılan ikincil konut oranının yüksek olması, arz fazlasının temel belirleyicisinin ikincil konut talebiyle ilişkili olduğunu göstermektedir. Buna karşılık Menemen, Çiğli ve Karşıyaka ilçeleri görece yüksek talep düzeyine ve dinamik bir konut piyasasına sahip olup, bu durum konut üretiminde sürekliliği beraberinde getirmektedir.

2050 yılına kadar arz fazlası oluşması öngörülen ilçelerden Çiğli, Karşıyaka ve Seferihisar’da konut üretiminin, hane yapısındaki dönüşümlere büyük ölçüde uyum sağladığı; özellikle küçük hane sayısındaki artışa paralel olarak daha düşük metrekareli konut tiplerinin üretiminin arttığı gözlenmektedir. Buna karşılık, Menemen ilçesinde çocuklu çekirdek ailelerin baskın hane tipi olmaya devam edeceği öngörülmekte olup, konut üretiminin bu demografik yapıya uygun biçimde yönlendirilmesi gerekmektedir.

Öte yandan, sınırlı sayıda ilçede konut gereksiniminin mevcut üretim düzeyi ve boş stok varlığı ile

87 / 110

karşılanma düzeyinin görece dengeli olduğu görülmektedir. Bu kapsamda Bergama, Çeşme, Dikili, Foça, Karaburun, Güzelbahçe ve Ödemiş ilçeleri öne çıkmaktadır. Bu ilçelerden Çeşme, Dikili, Foça ve Karaburun, ikincil konut ağırlıklı yapılarıyla dikkat çekmektedir. Yapılan incelemeler, bu ilçelerde son yıllarda ikincil konutların sürekli kullanım amacıyla değerlendirilmeye başlanmasıyla birlikte, ikincil konut oranlarında göreli bir azalma yaşandığını ortaya koymaktadır. Bu eğilimin önümüzdeki dönemde de sürmesi ve söz konusu ilçelerde konut gereksiniminin genel olarak karşılanabilir düzeyde kalması beklenmektedir. Bununla birlikte, demografik dönüşümün etkisiyle tek kişilik haneler ile yalnızca eşlerden oluşan hane tiplerinin artış göstermesi, yeni üretilecek konutların niteliğinin bu yapıya uygun biçimde planlanmasını gerekli kılmaktadır. Ayrıca, ikincil konutlar dışarıda bırakıldığında dahi görece yüksek seyreden boş konut oranları, mevcut stokta gerek büyüklük gerekse ekonomik erişilebilirlik açısından uyumsuzluklar bulunduğuna işaret etmektedir.

Bazı ilçelerde ise konut gereksiniminin mevcut üretim düzeyi ve boş stok varlığıyla karşılanma düzeyinin orta düzeyde yetersiz kaldığı görülmektedir. Bu kapsamda Aliağa, Beydağ, Buca, Narlıdere ve Tire ilçeleri öne çıkmaktadır. Bu ilçeler, sosyoekonomik ve mekânsal özellikleri bakımından birbirlerinden belirgin biçimde ayrışmaktadır. Sanayi ağırlıklı bir yerleşim olan Aliağa’da 2050 yılına kadar hane sayısının yaklaşık iki katına çıkması beklenmektedir.

İlçede çocuklu çekirdek ailelerin yanı sıra tek kişilik hanelerin de artacağı öngörülmekte olup, üretilen konutların ortalama büyüklüğünün genel olarak bu demografik eğilimle uyumlu olduğu görülmektedir.

Bununla birlikte, konutların ekonomik açıdan erişilebilirliği bakımından desteklenmesi gereken hanelerin varlığı dikkat çekmektedir.

Narlıdere ile daha kırsal nitelik taşıyan Beydağ ve Tire ilçelerinde ise hem niceliksel yetersizlik hem de niteliksel uyumsuzluk öne çıkmaktadır. Özellikle tek kişilik hane sayısındaki artışa karşın yeni konut üretiminde ortalama birim büyüklüğünün yüksek kalması, üretimin demografik dönüşüme yeterince yanıt veremediğini göstermektedir. Buca ilçesinde

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

ise niceliksel yetersizliğe ek olarak nitelik sorunları ve riskli yapı stokunun fazlalığı dikkat çekmektedir. Bu nedenle, Buca ilçesine ilişkin sağlıklı ve bütüncül değerlendirmelerin yapılabilmesi için konut stokunun niteliği ve kentsel dönüşüm süreçlerine yönelik daha ayrıntılı saha çalışmalarına ihtiyaç duyulmaktadır.

Bununla birlikte, ilçede planlanan kentsel dönüşüm kapsamında gerçekleşecek yeni üretimin gereksinimi karşılamaya yeteceği değerlendirilmektedir.

Son olarak, Balçova, Bayındır, Bayraklı, Bornova, Gaziemir, Karabağlar, Kemalpaşa, Kınık, Kiraz, Konak, Menderes, Selçuk, Torbalı ve Urla ilçelerinde 2050 yılına kadar ortaya çıkması öngörülen konut gereksiniminin mevcut eğilimler doğrultusunda piyasa koşulları çerçevesinde karşılanmasının mümkün olmadığı ve bu ilçelerde yüksek düzeyde konut açığı ortaya çıkacağı değerlendirilmektedir. Karabağlar, Konak, Gaziemir ve Bayraklı ilçelerinde riskli yapı stokunun ve gecekondu niteliğinde konutların yaygın olduğu bilinmekte ve bu alanlarda halihazırda kentsel dönüşüm uygulamaları planlanmaktadır. Kentsel dönüşüm kapsamında üretilecek stok bu ilçelerdeki konut açığını kapatmak için bir potansiyel sağlayabilir.

2050 yılına kadar konut açığı olacağı öngörülen ilçeler arasında yer alan Bayındır, Kınık, Kiraz, Torbalı ve Urla’da, konut üretiminin hane yapısındaki dönüşümlere yeterince uyum sağlayamadığı görülmektedir.

Bayındır, Kınık, Kiraz ve Urla ilçelerinde tek kişilik hane oranlarının artış eğilimi göstermesi, mevcut konut stokunun bu değişimi karşılayacak biçimde çeşitlendirilmesini gerekli kılmaktadır. Bu kapsamda, söz konusu ilçelerde 1+1 ve 2+1 konut tiplerinin üretiminin artırılması önem arz etmektedir. Buna karşılık, Torbalı ilçesinde çocuklu çekirdek ailelerin baskın hane türü olmaya devam edeceği öngörüldüğünden, konut üretiminin bu demografik yapıya uygun biçimde planlanması gerekmektedir.

88 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 86

TABLO 14. Modelin Temel Değişken ve Bileşenleri

| İlçeler | Konut Birimi Sayısı (2024) | İkincil Konut Sayısı (2024) | Boş Stok Tahmini (ikincil konutlar hariç) | Hane Halkı Sayısı (2024) | 2025-2050 Döneminde Eklenecek Hane Sayısı |
| --- | --- | --- | --- | --- | --- |
| Aliağa | 41292 | 3810 | 4705 | 32777 | 35648 |
| Balçova | 36817 | 934 | 7559 | 28324 | 13308 |
| Bayındır | 17087 | 1083 | 1685 | 14319 | 17663 |
| Bayraklı | 122051 | 3768 | 17534 | 100749 | 47337 |
| Bergama | 49496 | 2759 | 7214 | 39523 | 14673 |
| Beydağ | 6007 | 554 | 816 | 4637 | 5720 |
| Bornova | 192981 | 7601 | 35779 | 149601 | 70291 |
| Buca | 228033 | 9457 | 44107 | 174469 | 81975 |
| Çeşme | 48278 | 19119 | 9728 | 19431 | 23969 |
| Çiğli | 93784 | 2440 | 14231 | 77113 | 36232 |
| Dikili | 50552 | 18460 | 11132 | 20960 | 25855 |
| Foça | 27359 | 5700 | 7870 | 13789 | 17009 |
| Gaziemir | 53713 | 1483 | 7240 | 44990 | 21139 |
| Güzelbahçe | 17147 | 801 | 2840 | 13506 | 6346 |
| Karabağlar | 201989 | 6578 | 32930 | 162481 | 76343 |
| Karaburun | 14594 | 5517 | 3144 | 5933 | 7319 |
| Karşıyaka | 166844 | 4383 | 26495 | 135966 | 63884 |
| Kemalpaşa | 52066 | 4944 | 8395 | 38727 | 47771 |
| Kınık | 14175 | 4051 | 1176 | 8948 | 11038 |
| Kiraz | 17174 | 1089 | 1233 | 14852 | 18321 |
| Konak | 153972 | 5818 | 23736 | 126185 | 59289 |
| Menderes | 59967 | 14333 | 8096 | 37538 | 46305 |
| Menemen | 84126 | 3160 | 12798 | 68168 | 32029 |
| Narlıdere | 27174 | 836 | 4023 | 22315 | 10485 |
| Ödemiş | 61740 | 6524 | 7474 | 47742 | 18156 |
| Seferihisar | 45943 | 13396 | 8579 | 23968 | 29566 |
| Selçuk | 17673 | 1327 | 2501 | 13845 | 17078 |
| Tire | 41056 | 2281 | 6100 | 32675 | 21121 |
| Torbalı | 85408 | 3548 | 14145 | 67715 | 79416 |
| Urla | 41663 | 7263 | 6043 | 28357 | 30091 |
| İzmir (Toplam) | 2070161 | 163017 | 337541 | 1569603 | 985376 |

89 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

TABLO 14. Modelin Temel Değişken ve Bileşenleri (devamı)

| İlçeler | Dönüşüm/ Yenileme İhtiyacı | Yeni Hane ve Yenileme Kaynaklı Gereksinim | Mevcut Üretim Düzeyi ve Boş Stokla Gereksinimin Karşılanma Düzeyi | 2050'ye Kadar Karşılanması Gereken Sosyal Konut ihtiyacı | 2050'ye Kadar Karşılanabilirlik Açısından Politika Tedbiri Geliştirilmesi Gereken Hane/Stok Düzeyi |
| --- | --- | --- | --- | --- | --- |
| Aliağa | 5990 | 41638 | Orta Düzey Açık | 2228 | 13377 |
| Balçova | 5341 | 18649 | Yüksek Düzeyde Açık | 1355 | 8139 |
| Bayındır | 2479 | 20142 | Yüksek Düzeyde Açık | 1041 | 6252 |
| Bayraklı | 58021 | 65042 | Yüksek Düzeyde Açık | 8906 | 33747 |
| Bergama | 7180 | 21853 | Görece Dengeli | 1764 | 10595 |
| Beydağ | 871 | 6591 | Orta Düzey Açık | 337 | 2025 |
| Bornova | 27994 | 98285 | Yüksek Düzeyde Açık | 13224 | 50110 |
| Buca | 50823 | 115054 | Orta Düzey Açık | 15422 | 58440 |
| Çeşme | 7003 | 30972 | Görece Dengeli | 1413 | 8485 |
| Çiğli | 13604 | 49836 | Arz Fazlası | 6816 | 25830 |
| Dikili | 7333 | 33188 | Görece Dengeli | 1524 | 9152 |
| Foça | 3969 | 20978 | Görece Dengeli | 1003 | 6021 |
| Gaziemir | 29116 | 28930 | Yüksek Düzeyde Açık | 3977 | 15070 |
| Güzelbahçe | 2487 | 8833 | Görece Dengeli | 646 | 3881 |
| Karabağlar | 29301 | 105643 | Yüksek Düzeyde Açık | 14363 | 54424 |
| Karaburun | 2117 | 9436 | Görece Dengeli | 431 | 2591 |
| Karşıyaka | 24202 | 88087 | Arz Fazlası | 6506 | 39071 |
| Kemalpaşa | 7553 | 55324 | Yüksek Düzeyde Açık | 2816 | 16910 |
| Kınık | 2056 | 13094 | Yüksek Düzeyde Açık | 651 | 3907 |
| Kiraz | 2491 | 20812 | Yüksek Düzeyde Açık | 1080 | 6485 |
| Konak | 22335 | 81624 | Yüksek Düzeyde Açık | 11154 | 42267 |
| Menderes | 8699 | 55003 | Yüksek Düzeyde Açık | 2729 | 16391 |
| Menemen | 12203 | 44232 | Arz Fazlası | 3262 | 19589 |
| Narlıdere | 3942 | 14427 | Orta Düzey Açık | 1973 | 7475 |
| Ödemiş | 8956 | 27112 | Görece Dengeli | 2145 | 12883 |
| Seferihisar | 6664 | 36230 | Arz Fazlası | 1743 | 10466 |
| Selçuk | 2564 | 19642 | Yüksek Düzeyde Açık | 1007 | 6046 |
| Tire | 5956 | 27077 | Orta Düzey Açık | 1751 | 10517 |
| Torbalı | 12389 | 91805 | Yüksek Düzeyde Açık | 4790 | 28764 |
| Urla | 6044 | 36135 | Yüksek Düzeyde Açık | 1903 | 11427 |
| İzmir (Toplam) | 379683 | 1365059 | Orta Düzey Açık | 117961 | 540335 |

90 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 88

Öte yandan, Balçova ve Bornova ilçelerinde boş konut stokunun görece yüksek düzeylerde seyrettiği görülmektedir. Bornova’da kentsel dönüşüm beklentisi ile üniversitenin varlığından kaynaklanan konut piyasası hareketliliği bu durumu açıklayıcı nitelikte olabilir.

Balçova’da ise konut stokunun el değiştirme hızının ve işlem hacminin görece yüksek olması, buna ek olarak kira/satış değer oranlarının il geneline kıyasla daha yüksek seyretmesi, konut piyasasının ağırlıklı olarak yatırım odaklı bir yapı sergilediğine işaret etmektedir.

Bu bağlamda, ilçede gözlenen yüksek boş konut oranlarının bir bölümünün talep tarafındaki karşılanabilirlik sorunlarından kaynaklandığı değerlendirilmektedir.

Boş stokun düzeyi ile konut gereksinimini karşılama potansiyelinin daha sağlıklı biçimde ortaya konulabilmesi ise ancak ayrıntılı saha çalışmalarıyla mümkün olabilecektir.

İlçeler ölçeğinde 2050 yılına kadar karşılanması gereken acil sosyal konut gereksinimi değerlendirildiğinde, özellikle Buca, Karabağlar, Bornova ve Konak ilçelerinin her birinde 10 bin birimin üzerinde sosyal konut ihtiyacı bulunduğu görülmektedir. Bu ilçelerde aynı zamanda karşılanabilirlik sorunu yaşayan hane sayısının da diğer ilçelere kıyasla daha yüksek olduğu dikkat çekmektedir. Bayraklı ilçesi ise yaklaşık 9 bin birimlik sosyal konut ihtiyacı ve 34 bine yaklaşan karşılanabilirlik sorunu yaşayan hane sayısı ile söz konusu ilçeleri izlemektedir. Anılan ilçelerin büyük bölümünde konut gereksiniminin mevcut piyasa koşullarıyla karşılanmasında ciddi güçlükler bulunduğu dikkate alındığında, konut politikalarının bu alanlara öncelik verecek biçimde kurgulanması gerektiği değerlendirilmektedir.

Bu çalışma kapsamında geliştirilen sayısal model, konut politikalarının oluşturulmasında bir karar destek aracı olarak önemli bir çerçeve sunmaktadır. Bununla birlikte, modelin gerçeği yüksek doğrulukla yansıtabilmesi ve politika üretim süreçlerine etkin biçimde katkı sağlayabilmesi, kullanılan veri setlerinin kapsamı, güncelliği ve güvenilirliği ile doğrudan ilişkilidir. Bu nedenle, çalışmada tespit edilen veri eksiklikleri ve sınırlılıklar bir sonraki bölümde ayrıntılı biçimde ele alınarak değerlendirilmiştir.

## 7.2. İzmir için Konut Alanında Öncelikli Araştırma Konuları ve Alt Ölçekli Veri Gereksinimleri

Bu çalışma, İzmir ve ilçeleri ölçeğinde konut arzı ve talebi, konut gereksinimi ve ihtiyacı, ikincil konut oranları ve konut piyasalarının işleyişine ilişkin önemli bulgular ortaya koymakla birlikte, konut alanında daha sağlıklı politika ve planlama kararlarının üretilebilmesi için alt ölçekli, nitelik odaklı ve mekânsal olarak ayrıntılandırılmış yeni araştırmalara duyulan gereksinimi de açık biçimde ortaya koymaktadır. Bu kapsamda, aşağıda sıralanan başlıkların gelecekte yürütülecek çalışmalarda öncelikli araştırma alanları olarak ele alınması önem taşımaktadır.

## Mekânsal Olarak Ayrıştırılmış Yapı Envanterinin Oluşturulması

Bu çalışmada konut stokunun aktif olarak kullanılan bölümü, elektrik sayaç verileri aracılığıyla tahmin edilebilmiştir. Ancak bu yaklaşım, her ne kadar inşaatı tamamlanmamış ya da terk edilmiş yapıların dışlanmasını mümkün kılsa da, deprem riski taşıyan, fiziksel açıdan yıpranmış ya da fiilen yaşanabilirliğini yitirmiş konutların tespitine olanak vermemektedir. Bu nedenle, ilçe ölçeğinde konutların yapısal durumu, inşa yılı, deprem güvenliği ve fiziksel yeterlilikleri dikkate alınarak “gerçek anlamda kullanılabilir konut stoku”nun belirlenmesine yönelik ayrıntılı saha çalışmalarına ihtiyaç duyulmaktadır.

Bu kapsamda, 2020 depremi sonrasında gerçekleştirilen tespit çalışmalarından üretilen verilerin, gizlilik ilkeleri gözetilerek mahalle ölçeğinde paylaşılması büyük önem taşımaktadır. Özellikle kullanılabilir yapı sayısı, bağımsız bölüm sayısı, yapı yaşı ve mülkiyet durumu gibi bilgilerin açık veri formatında sunulması, konut politikalarının bilimsel temelde geliştirilmesine önemli katkı sağlayacaktır. Böyle bir veri setinin bulunmadığı alanlarda ise, dönüşüm ve iyileştirme gereksinimi bulunan yapıların ve bu yapılardaki bağımsız birim sayısının saha çalışmaları yoluyla belirlenmesi gerekmektedir.

91 / 110

## Boş Konut Stokunun Niteliğine Yönelik Veri Üretimi

Mevcut çalışmada boş konut stoku, konut sayısı ile hane sayısı arasındaki farktan ve sayaç verilerinden hareketle tahmin edilmiştir. Ancak bu yöntem, boş konutların fiziksel durumu, kullanılabilirliği, yatırım amaçlı tutulup tutulmadığı ya da piyasa koşullarına sunulabilirliği gibi niteliksel unsurları ortaya koymamaktadır. Bu nedenle, örneklem temelli alan araştırmaları aracılığıyla boş konutların kullanım durumu, fiziksel yeterliliği ve mekânsal dağılımına ilişkin doğrudan gözleme dayalı verilerin üretilmesi gerekmektedir. Bu tür çalışmalar, konut arzının niceliği kadar niteliğini de değerlendirebilmek açısından kritik öneme sahiptir.

## Konutun Karşılanabilirliğine İlişkin Mekânsal Analizler

Konutun karşılanabilirliği yalnızca üretim miktarıyla değil, hane gelir düzeyleri ile kira ve satış fiyatları arasındaki ilişkiyle belirlenmektedir. Bu çerçevede, ilçe ve mahalle ölçeğinde gelir düzeyleri, kira bedelleri ve satış fiyatları arasındaki uyumun analiz edilmesi; hangi bölgelerde konutun ekonomik açıdan erişilebilir, hangi bölgelerde ise dışlayıcı nitelik kazandığının ortaya konulması gerekmektedir. Bu tür mekânsal analizler, özellikle sosyal konut politikalarının hedef kitlesinin ve mekânsal önceliklerinin belirlenmesi açısından kritik bir veri altyapısı sunacaktır.

## Hane Yapısı – Konut Tipi Uyumunun İncelenmesi

Hane büyüklüğü, hane türü (tek kişilik, çekirdek aile, geniş aile vb.) ile konut tipleri (oda sayısı, büyüklük) arasındaki ilişkinin ilçe ve mahalle düzeyinde bilinmediği görülmektedir. İlçe ve mahalle ölçeğinde hane yapıları ile mevcut konut stokunun uyumunun analiz edilmesi, hem yeni üretilecek konutların niteliğinin belirlenmesi hem de mevcut stokun dönüşümüne yönelik politikaların geliştirilmesi açısından önem taşımaktadır.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## İkincil Konut Stokunun Niteliği ve Kullanım Biçimleri

Bu çalışmada ikincil konut sayıları, ağırlıklı olarak elektrik sayaç verilerine dayalı olarak tahmin edilmiştir. Ancak bu yöntem, ikincil konutların kullanım biçimlerine ilişkin ayrıntılı bilgi sunmamaktadır. Kıyı alanlarında yazlık amaçlı kullanılan konutlar ile kırsal alanlarda yer alan bağ evi ya da mevsimlik konutlar farklı dinamiklere sahiptir. Ayrıca, çoklu mülkiyet yapısının yaygın olduğu büyük kentlerde hanelerin birden fazla konutu eş zamanlı olarak kullanabildiği de bilinmektedir. Bu nedenle, ikincil konutların kullanım sıklığı, sürekliliği ve işlevine ilişkin daha ayrıntılı verilerin üretilmesi, konut gereksiniminin doğru değerlendirilmesi açısından büyük önem taşımaktadır.

Bu çerçevede, konut alanına ilişkin politika ve planlama süreçlerinin yalnızca üretim miktarına odaklanmak yerine; konutun niteliğini, erişilebilirliğini, mekânsal dağılımını ve hane yapısıyla uyumunu birlikte ele alan çok boyutlu bir veri altyapısına dayanması gerekmektedir. Böyle bir yaklaşım, İzmir özelinde daha dengeli, kapsayıcı ve sürdürülebilir bir konut politikasının geliştirilmesine güçlü bir zemin oluşturacaktır.

92 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 90

## 7.3. Genel Değerlendirme

Çalışmanın bu bölümü, İzmir genelinde konut arzı, talebi ve konut piyasasının işleyişine ilişkin çok boyutlu bir değerlendirme sunarak, mevcut konut üretim dinamiklerinin ve mekânsal dağılımın, hane yapısındaki dönüşümlerle ve sosyoekonomik gereksinimlerle ne ölçüde örtüştüğünü ortaya koymuştur. Elde edilen bulgular, konut gereksiniminin yalnızca niceliksel bir açık olarak değil; nitelik, erişilebilirlik ve mekânsal uyum boyutlarıyla birlikte ele alınması gerektiğini göstermektedir. Özellikle mevcut stokun önemli bir bölümünün ya fiziksel olarak yetersiz, ya ekonomik açıdan erişilemez ya da demografik dönüşümlere uyumsuz olduğu görülmektedir.

Çalışma, İzmir genelinde yeni hane oluşumu ve yapı stokunun yenilenme gereksinimi dikkate alındığında, önümüzdeki 25 yıllık dönemde önemli bir konut açığının ortaya çıkacağını ortaya koymaktadır. Bu açık, yalnızca yeni konut üretimiyle giderilemeyecek ölçekte olup, sosyal konut politikaları, kira destek mekanizmaları ve dönüşüm odaklı müdahalelerin eş zamanlı olarak ele alınmasını zorunlu kılmaktadır. Özellikle Buca, Karabağlar, Bornova, Konak ve Bayraklı gibi ilçelerde hem niceliksel hem de niteliksel konut yetersizliklerinin yoğunlaşması, bu alanların öncelikli müdahale bölgeleri olarak ele alınmasını gerektirmektedir. Buna karşılık bazı ilçelerde arz fazlası görünümü bulunmakla birlikte, bu durumun çoğu zaman uygun olmayan konut tipleri ya da karşılanabilirlik sorunlarından kaynaklandığı anlaşılmaktadır.

Çalışma kapsamında geliştirilen model, konut ihtiyacının mekânsal ve sosyoekonomik bileşenlerini birlikte ele alan önemli bir karar destek aracı sunmaktadır.

Ancak modelin sağlıklı biçimde işletilebilmesi, kullanılan veri setlerinin güncelliği, kapsamı ve ayrıntı düzeyi ile doğrudan ilişkilidir. Bu nedenle, yapı stokunun niteliği, boş konutların gerçek kullanım durumu, hane yapıları ve gelir düzeyleri gibi alanlarda daha ayrıntılı, düzenli ve mekânsal olarak ayrıştırılmış veri üretimine ihtiyaç duyulmaktadır. Bu tür veriler, yalnızca mevcut durumun doğru okunmasını değil, aynı zamanda geleceğe yönelik politika senaryolarının gerçekçi biçimde test edilmesini de mümkün kılacaktır.

Sonuç olarak, İzmir için sürdürülebilir ve kapsayıcı bir konut politikasının geliştirilebilmesi; yalnızca üretim miktarına odaklanan yaklaşımların ötesine geçerek, konutun karşılanabilirliği, niteliği, mekânsal dağılımı ve toplumsal ihtiyaçlarla uyumu temelinde bütüncül bir perspektifin benimsenmesini gerektirmektedir.

Bu doğrultuda, yerel yönetimler, merkezi idare ve ilgili tüm paydaşlar arasında veri temelli, çok aktörlü ve uzun vadeli bir planlama yaklaşımının geliştirilmesi kritik önem taşımaktadır.

93 / 110

91 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Süvari Caddesi, Bornova

94 / 110

92 İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE

Uzundere Toki Konutları, Karabağlar

95 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## 8. DEĞERLENDIRME VE SONUÇ

İzmir’de Konut Arz-Talep Dinamiklerinin Analizi ve Konut İhtiyacının Belirlenmesine Yönelik Bir Model Önerisi adlı bu çalışma, İzmir'in farklı konut sorunları ve ihtiyaçları arasından öncelikli olanlarının belirlenmesi ve hedeflerin somutlaştırılabilmesi için güvenilir ve güncel bilgi üretmeyi amaçlamıştır. Çalışmada, öncelikle TR31 İzmir Bölgesi için hane halkı ve konut nitelikleri üzerinden konutla ilişkili temel sorunların değerlendirmesi yapılmış ve bölgede iyileştirilmesi gereken sorun alanları ortaya konulmaya çalışılmıştır.

Sonrasında, İzmir için kent ölçeğinde öncelik verilmesi gereken sorun alanlarının tarif edilmesi ve ilçeler düzeyinde konut ihtiyacını belirlemek üzere arz ve talep dinamiklerindeki eğilimler incelenmiştir. Çalışma kapsamında, planlama süreçlerine altlık oluşturabilecek ve yeni konut ihtiyacıyla beraber birikmiş konut ihtiyacını da dikkate alan bir konut ihtiyaç modeli geliştirilmiştir. Bu doğrultuda; göç ve yeni hane oluşumunu göz önüne alan yeni konut ihtiyacı, standartların altında, dönüşüme ihtiyaç duyan ya da gecekondu niteliğindeki konutlardan kaynaklı birikmiş konut ihtiyacı, boş ve kullanılabilir durumdaki konut varlığı, ikincil konutların düzeyi ve yeni konut üretim performansını göz önüne alan bir model kurgulanmıştır.

Bu rapor kapsamında gerçekleştirilen analizler, İzmir’de konut sorununun tek boyutlu bir arz-talep meselesi olmadığını; aksine ekonomik kırılganlıklar, mekânsal uyumsuzluklar, hane halkı yapısındaki dönüşümler ve konutun kullanım biçimindeki değişimlerle iç içe geçmiş çok katmanlı bir yapı sergilediğini ortaya koymaktadır. Karşılanabilirlik göstergeleri, İzmir’in Türkiye ortalamasına kıyasla daha yüksek bir risk düzeyine sahip olduğunu; özellikle kiracı haneler, düşük gelir grupları ve genç haneler açısından barınma maliyetlerinin giderek sürdürülemez hale geldiğini göstermektedir. Konut kullanım yoğunluğu ve enerji yoksulluğu bulguları ise, konut stokunun niceliksel varlığına rağmen hanelerin ihtiyaçlarıyla mekânsal ve ekonomik uyumun zayıfladığını, yapısal ve altyapısal sorunların barınma kalitesini doğrudan etkilediğini ortaya koymaktadır.

Hane halkı yapısındaki dönüşüm, İzmir’de konut talebinin niteliğinde belirleyici bir kırılmaya işaret etmektedir. Küçülen hane büyüklükleri ve tek kişilik ya da aile dışı hanelerin artışı, daha küçük, esnek ve karşılanabilir konutlara olan ihtiyacı artırırken; mevcut konut arzının bu talep yapısıyla uyumlu biçimde çeşitlenemediği görülmektedir. İlçeler arası analizler, hem arz hem de talep tarafında belirgin mekânsal ayrışmalar bulunduğunu; merkezi ilçelerde dönüşüm ve sosyal konut ihtiyacının, çeper ve kırsal ilçelerde ise karşılanabilirlik ve yaşam maliyetlerine yönelik politika tedbirlerine olan ihtiyacın öne çıktığını göstermektedir. Bu durum, İzmir’de konut sorunlarının il geneli için tek tip çözümlerle ele alınamayacağını açık biçimde ortaya koymaktadır.

İkincil konutlara ilişkin bulgular, konutun kullanım biçiminde yaşanan dönüşümün İzmir’de mekânsal ve toplumsal etkiler yarattığını göstermektedir. İkincil konutlar, yalnızca mevsimsel ya da turizm amaçlı kullanılan yapılar olmaktan çıkarak; uzaktan çalışma, esnek yaşam pratikleri ve yarı-kalıcı yerleşim biçimleriyle ilişkilenen çok işlevli mekânlara dönüşmektedir. Bu dönüşüm, kıyı ve kırsal nitelikli ilçelerde daha belirgin hale gelirken, konut stokunun fiili kullanımı ile resmi sınıflandırmalar arasındaki farkların politika üretimi açısından önemli bir belirsizlik alanı yarattığı görülmektedir.

Son olarak, konut ihtiyaç modeli çıktıları, mevcut konut üretim yapısının hem nicelik hem de nitelik açısından önemli sınırlılıklar taşıdığını ortaya koymaktadır.

Bulgular, özellikle yeni hane oluşumu, yenileme gereksinimi ve sosyoekonomik dönüşüm birlikte değerlendirildiğinde, mevcut piyasa mekanizmalarının konut gereksinimini ve ihtiyacını tek başına karşılamada yetersiz kaldığını göstermektedir. Özellikle bazı ilçelerde konut açığının derinleştiği, bazılarında ise niceliksel olarak yeterli görünen stokun nitelik, karşılanabilirlik ve uygunluk açısından sorunlu olduğu tespit edilmiştir.

Bu durum, konut sorununun yalnızca üretim miktarı üzerinden değil, mekânsal dağılım, karşılanabilirlik ve hane yapılarıyla uyum çerçevesinde ele alınması gerektiğini ortaya koymaktadır.

96 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 94

Bu çerçevede, İzmir için geliştirilen analiz, konut politikalarının sosyal konut üretimi, dönüşüm uygulamaları ve karşılanabilirlik odaklı destek mekanizmalarıyla birlikte ele alınması gerektiğini göstermektedir. Özellikle düşük ve orta gelir gruplarının konuta erişiminin güçlendirilmesi, riskli ve niteliksiz yapı stokunun dönüştürülmesi ve mekânsal eşitsizliklerin azaltılması öncelikli politika alanları olarak öne

Mavişehir, Karşıyaka

çıkmaktadır. Çalışma, aynı zamanda sağlıklı veri altyapısına dayalı, mekânsal olarak ayrıştırılmış ve uzun vadeli bir planlama yaklaşımının gerekliliğini vurgulayarak, İzmir için sürdürülebilir, kapsayıcı ve dengeli bir konut politikasının oluşturulmasına yönelik güçlü bir analitik çerçeve sunmaktadır.

97 / 110

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

## EK 1

2024 yılı itibarıyla hane halkı kompozisyonunun dağılımı (%) ve 2014-2024 döneminde kompozisyondaki değişim (%)

Aliağa

10 20 30 40 50 60 70 80 90 100 110

0 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Sadece Eşler) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Balçova

80 70 60 50 40

30 20 10 0 -10 -20

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Sadece Eşler) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

-20 -10 0 10 20 30 40 50 60 70 80 90 100 Bayındır

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

98 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 96

90 Bayraklı

80 70 60 50

40 30 20 10 0 -10 -20

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Bergama

% 30

-10 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Beydağ

-20 -10 0 10 20 30 40 50 60 70 80 90 100 110 120

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar)

Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

99 / 110

Bornova

90 80 70 60 50 40

% 30 20 10 0 -10

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Buca

130 120 110 100 90 80 70

% 60

50 40 30 20 10 0 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Çeşme

100 90 80 70 60 50 %

40 30 20 10 0 -10 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

100 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 98

Çiğli

160 140 120 100 %

80 60 40 20 0 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Dikili

90 80 70 60 50

% 40 30 20 10 0 -10

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Foça

0 10 20 30 40 50 60 70 80 90 100 110 120 130 140

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

101 / 110

Gaziemir

80 70 60 50 %

40 30 20 10 0 -10

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Güzelbahçe

120 110 100 90 80 70

% 60 50 40 30 20 10 0

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Karabağlar

70 60 50 40

% 30 20 10 0 -10 -20

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

102 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 100

Karaburun

110 100 90 80 70

60 50 40 30 20 10 0 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Karşıyaka

80 70 60 50 %

40 30 20 10 0 -10 -20

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Kemalpaşa

120 110 90 100 80 60 70

40 50 30 10 20 0 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

103 / 110

80 70 60 50 40

% 30 20 10 0 -10

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Kınık

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Kiraz

% 30

-10 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

50 Konak

20 %

-10

-20

-30

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

104 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 102

Menderes

0 10 20 30 40 50 60 70 80 90 100 110 120 130

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Menemen

220 200 180 160 140

% 120 100 80 60 40 20 0

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Narlıdere

70 60 50 40 %

30 20 10 0 -10 -20

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

105 / 110

% 20

-10

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Ödemiş

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

220 Seferihisar 200 180 160 140 %

120 100 80 60 40 20 0

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Selçuk

40 % 30

-10

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

106 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 104

Tire

% 30

0 -10 Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Torbalı

0 10 20 30 40 50 60 70 80 90 100 110 120 130 140 150

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler) 2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Urla

0 10 20 30 40 50 60 70 80 90 100 110 120 130

Aile Olmayan Haneler Geniş Aileler Çekirdek Aile (Eşler ve Çocuklar) Çekirdek Aile (Tek Ebeveyn) Tek Kişilik Haneler Çekirdek Aile (Sadece Eşler)

2014 - 2024 Döneminde Değişim 2024 Yılında Dağılım

Kaynak: TÜİK Adrese Dayalı Nüfus Kayıt Sistemi verilerinden üretilmiştir.

107 / 110

## KAYNAKÇA

Aksoy Khurami, E., Balaban, M. (2024). Spatial analysis of the housing market through investigating housing transaction volumes in Menteşe, Muğla.

Pamukkale University Journal of Social Sciences Institute, 61, 151–167. https://doi.org/10.30794/ pausbed.1413000

Aksoy Khurami, E., Özdemir Sarı, Ö.B. (2025). Hanekonut eşleşmesindeki uyumsuzluklar üzerine ampirik bir inceleme: Türkiye Örneği. İdealkent, 47(17), 8-30.

Alkire, S., Foster, J. (2011). Counting and multidimensional poverty measurement. Journal of Public Economics, 95(7-8), 476-487.

Arslan Avar, A. (2025). Yaygın görüşe bir itiraz: İmar afları sonrasında İzmir’de gecekondu ve kaçak yapılaşma araştırması ve sonrası. N. Kiper (Ed.), Planlama, Politika, Uygulama ve Deneyimler içinde (ss. 117-135). Ankara: İdealkent Yayınları.

Benson, M., O’Reilly, K. (2009). Lifestyle migration:

Escaping to the good life? M. Benson ve K.

O’Reilly (Ed.), Lifestyle Migration: Expectations, Aspirations and Experiences içinde (pp. 1-13).

London: Ashgate.

Betti, G., Gagliardi, F., Lemmi, A., Verma, V. (2015).

Comparative Measures of Multidimensional Deprivation in the European Union. Empirical Economics, 49, 1071-1100.

Birleşmiş Milletler (1991). CESCR General Comment No.4: The Right to Adequate Housing (Art. 11 (1) of the Covenant). https://www.refworld.org/pdfid/47a7079a1.pdf. Erişim tarihi: 04 Temmuz 2025.

Bramley, G., Munro, M., Pawson, H. (2004). Key Issues in Housing (1. Basım). New York: Palgrave Macmillan.

Bramley, G., Pawson, H., White, M., Watkins, D.

(2010). Estimating Housing Need. https://assets.publishing.service.gov.uk/government/ uploads/system/uploads/attachment_data/ file/6338/1776873.pdf. Erişim tarihi: 15 Temmuz 2025.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

Breuer, T. (2005). Retirement migration or rather second‐home tourism? German senior citizens on the Canary Islands. Tourism Geographies, 7(2), 212–

235. https://doi.org/10.1080/14616680500072435

Clarke, A. (2012). Housing Need in the United Kingdom.

S. J. Smith (Ed.), International Encyclopedia of Housing and Home içinde (ss. 538-543).

Amsterdam: Elsevier.

Clarke, A., Monk, S., Tang, C., Whitehead, C., Lyall Grant, F. (2010). Under-utilisation of the housing stock:

Eight local case studies. Cambridge Centre for Housing and Planning Research / Shelter. https://www.landecon.cam.ac.uk/sites/default/files/2024-03/research-report_0.pdf. Erişim tarihi:

15 Aralık 2025.

Çevre, Şehircilik ve İklim Değişikliği İl Müdürlüğü. (2017, Ağustos 17). 17 Ağustos 1999 Gölcük Depreminin

18. Yılı. https://izmir.csb.gov.tr/tam-18-yil-oldu...haber-199791. Erişim tarihi: 10 Ekim 2025.

Erdoğdu, S. (2024). Türkiye’de Enerji Yoksulluğu 2023.

Türkiye’nin Enerji Görünümü (ss. 39-52), Makina Mühendisleri Odası Raporu, 2024.

Glaeser, E. L., Gyourko, J. (2005). Urban decline and durable housing. Journal of Political Economy, 113(2), 345-375. https://doi.org/10.1086/427465

Gouveia, J.P., Palma, P., Bessa, S., Mahoney, K., Sequeria, M. (2022). Energy Poverty National Indicators:

Insights for a more effective measuring. Energy Poverty Advisory Hub, European Commission Directorate General for Energy, Brussels. https:// data.europa.eu/doi/10.2833/4331480. Erişim tarihi: 20 Eylül 2025.

Güven, A. E., Özdemir Sarı, Ö. B. (2023). Türkiye’de konut ve yaşam çevresi yoksunluğu üzerine bir değerlendirme. Ö. B. Özdemir Sarı (Ed.), Konut ve Yaşam Çevreleri içinde (ss.223-242). Ankara:

İdealkent Yayınları.

108 / 110

KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI 106

Halfacree, K. (2012). Heterolocal identities? Counter‐ urbanisation, second homes and rural consumption in the era of mobilities. Population, Space and Place, 18(2), 209–224. https://doi.org/10.1002/ psp.665

Hancock, K. E. (1993). Can’t pay? Won’t pay? The economic principles of affordability. Urban Studies, 30(1), 127–145.

Heath, S. (2014). Housing Demand and Need (England). https://commonslibrary.parliament. uk/research-briefings/sn06921/. Erişim tarihi: 6 Temmuz 2025.

Hulchanski, J. D. (1995). The concept of housing affordability: Six contemporary uses of the housing expenditure- to-income. Housing Studies, 10(4), 471–492.

İZKA (2024). İzmir İli İçin Metropol ve Seçilmiş İlçelerde Nüfus Projeksiyonları Sonuç Raporu: 2022-2050. https://izka.org.tr/wp-content/uploads/pdf/izmir-ili-nufus-projeksiyonlari-2.pdf. Erişim tarihi:

15 Eylül 2025.

İzmir Büyükşehir Belediyesi (2009). 1/25000 ölçekli İzmir Kentsel Bölge Nazım İmar Planı Revizyonu Açıklama Raporu. İzmir Büyükşehir Belediyesi İmar ve Şehircilik Daire Başkanlığı Nazım Plan Şube Müdürlüğü.

Keleş, R. (1973). İzmir’in Mahalleleri. Ankara: Türk Sosyal Bilimler Derneği Yayını.

Maclennan, D., Williams, R. (1990). Affordable housing in Europe. York: Joseph Rowntree Foundation.

Mallach, A. (2018). The empty house next door:

Understanding and reducing vacancy and hypervacancy in the United States. Lincoln Institute of Land Policy. https://www.lincolninst.edu/ app/uploads/legacy-files/pubfiles/empty-house-next-door-full.pdf. Erişim tarihi: 10 Temmuz 2025.

Myers, D., Baers, W.C., Choi, S. (1996). The changing problem of overcrowded housing. Journal of the American Planning Association, 62(1), 66-84.

OECD. (2021). Building for a better tomorrow: Policies to make housing more affordable, Employment, Labour and Social Affairs Policy Briefs, OECD, Paris, http://oe.cd/affordable-housing-2021.

Erişim tarihi: 8 Ağustos 2025.

OECD Affordable Housing Database (2025, 16 Temmuz). HC2.1. Living space. https://webfs.oecd. org/Els-com/Affordable_Housing_Database/ HC2-1-Living-space.pdf

OECD. (2021). Brick by brick: Building better housing policies. OECD Publishing. https://doi.org/10.1787/ b453b043-en

Ozdemir, E., Koukoufikis, G. (2025). Addressing Housing Affordability and Energy Poverty: A Dual Challenge for the EU, European Commission, Petten. https://publications.jrc.ec.europa.eu/ repository/handle/JRC140895. Erişim tarihi: 18 Temmuz 2025.

Özdemir, S., vd. (2005). İmar afları sonrasında İzmir’de gecekondulaşma: Sosyo-ekonomik, mekansal bir çözümleme. Ankara, TÜBİTAK. https://search.trdizin.gov.tr/tr/yayin/detay/607377/imar-aflari-sonrasinda-izmirde-gecekondulasma-sosyo-ekonomik-mekansal-bir-cozumleme Erişim tarihi: 2 Aralık 2025

Özdemir Sarı, Ö. B. (2025). Türkiye’de Konut Yoksunluğu Profilleri. L. Alkan Gökler (Ed.), Konutun Dünü, Bugünü, Yarını: Bir Ali Türel Kitabı içinde. İdealkent Yayınları.

Stone, M. E. (2006). What is housing affordability? The case for the residual income approach. Housing Policy Debate, 17(1), 151-184.

Tezcan, S., Zengin, H. (2017). İzmir Büyükşehir Belediyesi Tarafından Uygulanan Kentsel Dönüşüm Projeleri Üzerine Bir İnceleme. M.

Güler, M. Turan (Ed.), Belediyelerin Geleceği ve Yeni Yaklaşımlar içinde (ss.72-95). İstanbul:

Marmara Belediyeler Birliği Kültür Yayınları.

TÜİK. (2021) Bina ve Konut Nitelikleri Araştırması, 2021. https://data.tuik.gov.tr/Bulten/ Index?p=Survey-on-Building-and-Dwelling- Characteristics2021-45870

109 / 110

Türel, A. (2012). Konut Gereksinimi ve Konut Talebi.

M. Ersoy (Ed.), Kentsel Planlama Ansiklopedik Sözlük içinde. İstanbul: Ninova Yayıncılık.

Uzun, N. (2022). Gecekondu Alanlarının Dönüşümü ve Dikmen Vadisi Kentsel Dönüşüm Projesi. Ö.B.

Özdemir Sarı, G. P. Sarıoğlu Erdoğdu (Ed.), Konut, Afetler ve Kentleşme Üzerine Yazılar içinde (ss.

61-84). Ankara: İdealkent Yayınları.

Ünverdi, H. (2002). Sosyo-Ekonomik İlişkiler Bağlamında İzmir Gecekondularında Kimlik Yapılanmaları: Karşıyaka-Onur Mahallesi ve Yamanlar Mahallesi Örnekleri. Yayınlanmamış Doktora Tezi, Dokuz Eylül Universitesi.

Wind, B., Dewilde, C., Doling, J. (2020). Housing regimes and housing outcomes in Europe: The role of social and economic inequalities. Journal of European Social Policy, 30(1), 77-92. https://doi. org/10.1177/0958928719855297

World Health Organization. (2018). Housing and health guidelines. https://www.who.int/publications/i/item/9789241550376. Erişim tarihi: 22 Ağustos 2025.

İZMIR’DE KONUT ARZ-TALEP DINAMIKLERININ ANALIZI VE KONUT İHTIYACININ BELIRLENMESINE YÖNELIK BIR MODEL ÖNERISI

110 / 110

Megapol Çarşı Kule, Halkapınar Mahallesi, 1203/11. Sk. No: 5-7, Kat: 19, 35170 Konak/İzmir

T. +90 232 489 81 81 F. +90 232 489 85 05

www.izka.org.tr

Kalkınma Ajansları Yayınları Bedelsizdir, Satılamaz

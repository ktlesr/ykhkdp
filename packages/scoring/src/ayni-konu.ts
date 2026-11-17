/**
 * Aynı konu mu — başlıkları "konunun özüne" indirger ve karşılaştırır.
 *
 * Trigram benzerliği "Emniyet Kemeri Üretimi" ile "Aksaray İli Emniyet Kemeri
 * İmalatı Tesisi"ni ayırıyordu: il adı ve "imalatı tesisi" kalıbı ölçüyü
 * bozuyor; iki aynı konu asıl listeye birlikte girdi (canlıda görüldü). Burada
 * yer adları ve kalıp sözcükler atılır, kalan içerik sözcüklerinin kökleri
 * (5 harf) karşılaştırılır: küçük kümenin en az %80'i büyüğünde ve en az iki
 * ortak kök (tek sözcüklük konuda birebir eşitlik).
 *
 * Saf fonksiyon: veritabanı yok. Sıralama (`hesapla`) ve keşif aynı kuralı
 * kullanır.
 *
 * ponytail: sözcüksel kural, anlamsal değil — "hava yastığı" ile "airbag"
 * aynı konu olduğu hâlde ayrılmaz; eş anlamlı sözlüğü gerekirse buraya girer.
 */

const KALIP = new Set(
  [
    "üretim", "üretimi", "üretimleri", "imalat", "imalatı", "imalatları", "tesis", "tesisi", "tesisleri",
    "yatırım", "yatırımı", "yatırımları", "fabrika", "fabrikası", "işletme", "işletmesi", "kurulumu", "kurulması",
    "il", "ili", "ilinde", "ilçe", "ilçesi", "merkez", "için", "ve", "ile", "yönelik", "amaçlı", "dayalı",
    "konusu", "projesi", "entegre", "modern", "yeni", "kapasite", "kapasiteli", "sektörü", "sektöründe",
    // Resmî listelerdeki kalıp: "Asgari 500 Büyükbaş Kapasiteli … İşleme Tesisi"
    // — ölçüldü, Ağrı/Bingöl/Muş'ta süt ve et tesislerini aynı sanıyordu.
    "asgari", "işleme", "işlenmesi", "işlemesi",
  ].map((x) => x.toLocaleLowerCase("tr-TR")),
);

function kokler(baslik: string, yerAdlari: readonly string[]): Set<string> {
  const yer = new Set(yerAdlari.map((y) => y.toLocaleLowerCase("tr-TR").slice(0, 5)));
  return new Set(
    baslik
      .toLocaleLowerCase("tr-TR")
      .replace(/['’`][\p{L}]*/gu, "") // "Aksaray'da" → "aksaray"
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3 && !KALIP.has(w) && !/\d/.test(w))
      .map((w) => w.slice(0, 5))
      .filter((k) => !yer.has(k)),
  );
}

export function ayniKonuMu(a: string, b: string, yerAdlari: readonly string[] = []): boolean {
  const A = kokler(a, yerAdlari);
  const B = kokler(b, yerAdlari);
  if (!A.size || !B.size) return false;
  const ortak = [...A].filter((k) => B.has(k)).length;
  const kucuk = Math.min(A.size, B.size);
  if (kucuk === 1) return A.size === B.size && ortak === 1;
  return ortak >= 2 && ortak / kucuk >= 0.8;
}

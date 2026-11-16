/**
 * Hız sınırı — süreç içi kayan pencere.
 *
 * ponytail: bellek içi, tek web konteyneri varsayımı (Dokploy). Birden çok
 * kopya çalışırsa her kopya kendi sayacını tutar ve sınır kopya sayısıyla
 * çarpılır; o gün paylaşılan sayaç (Postgres tablosu) gerekir. Pahalı yol olan
 * öneri → model işi ayrıca veritabanında gönderen başına sınırlıdır
 * (`oneriOlustur` kotası), o katman kopya sayısından bağımsızdır.
 */

/** Her anahtar KENDİ penceresini taşır: temizlik başka bir sınırın süresiyle yapılmaz. */
const kayitlar = new Map<string, { pencereMs: number; izler: number[] }>();
let sonTemizlik = 0;

/** Yalnızca SORAR, saymaz: başarısız denemeleri sonradan `sinirSay` ile işaretleyen akışlar için. */
export function sinirDolu(anahtar: string, limit: number, pencereMs: number, simdi = Date.now()): boolean {
  return (kayitlar.get(anahtar)?.izler ?? []).filter((t) => simdi - t < pencereMs).length >= limit;
}

/** Bir denemeyi sayar (ör. başarısız giriş). */
export function sinirSay(anahtar: string, pencereMs: number, simdi = Date.now()): void {
  const izler = (kayitlar.get(anahtar)?.izler ?? []).filter((t) => simdi - t < pencereMs);
  izler.push(simdi);
  kayitlar.set(anahtar, { pencereMs, izler });
}

/** `sinirSay` ile sayılmış son denemeyi geri alır (ör. giriş başarılı oldu). */
export function sinirGeriAl(anahtar: string): void {
  kayitlar.get(anahtar)?.izler.pop();
}

/** true → sınır aşıldı, işlem yapılmamalı. Aşmayan çağrı sayılır. */
export function sinirAsildi(anahtar: string, limit: number, pencereMs: number, simdi = Date.now()): boolean {
  // Süresi dolan kayıtlar ara ara silinir; harita sınırsız büyümez.
  if (simdi - sonTemizlik > 60_000) {
    for (const [k, v] of kayitlar) {
      if (!v.izler.length || simdi - v.izler[v.izler.length - 1] >= v.pencereMs) kayitlar.delete(k);
    }
    sonTemizlik = simdi;
  }
  const izler = (kayitlar.get(anahtar)?.izler ?? []).filter((t) => simdi - t < pencereMs);
  const asildi = izler.length >= limit;
  if (!asildi) izler.push(simdi);
  kayitlar.set(anahtar, { pencereMs, izler });
  return asildi;
}

/** Ortam değişkeninden pozitif tamsayı; geçersizse varsayılan. */
export function ayar(ad: string, varsayilan: number): number {
  const v = Number(process.env[ad]);
  return Number.isInteger(v) && v > 0 ? v : varsayilan;
}

/**
 * İstemci IP'si. `x-forwarded-for` İSTEMCİ tarafından da yazılabilir; güvenilir
 * olan, önümüzdeki proxy'nin (Traefik) EKLEDİĞİ değerdir — listenin sonundan
 * `YKH_PROXY_SAYISI` (varsayılan 1) kadar içerideki öğe. İlk öğeye güvenmek,
 * her istekte başlığı değiştiren birinin sınırı tamamen atlaması demekti.
 */
export function ipSec(xff: string | null, proxySayisi = ayar("YKH_PROXY_SAYISI", 1)): string {
  const liste = (xff ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return liste[liste.length - proxySayisi] ?? liste[0] ?? "bilinmiyor";
}

export const COK_FAZLA = "Çok sayıda deneme yapıldı. Daha sonra yeniden deneyin.";

/**
 * Açık yönlendirmeye karşı: yalnızca uygulama içi yol döner, değilse null.
 * `//evil`, `/\evil` ve kontrol karakteri gizlenmiş `/<TAB>/evil` (URL
 * ayrıştırıcısı TAB'ı siler) dış adrese giderdi. Hedef sabit bir köke göre
 * ayrıştırılır; kök değişirse reddedilir, normalize edilmiş yol döner.
 */
export function icYol(hedef: string): string | null {
  if (!hedef.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(hedef)) return null;
  const KOK = "http://ykh.ic";
  try {
    const u = new URL(hedef, KOK);
    // `/.//evil` normalize edilince `//evil` olur: protokole göre yol, dış adres.
    if (u.origin !== KOK || u.pathname.startsWith("//")) return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

/**
 * Anahtar başına SIRA: çağrılar birbiri ardına, `araMs` aralıkla başlar.
 *
 * Paralel uyuyan istekler hiçbir şeyi sınırlamaz; sıra gerçek bir hız
 * tavanıdır (anahtar başına `araMs`'de bir deneme) ve kimseyi REDDETMEZ —
 * meşru deneme gecikir ama düşmez. Böylece hesap herkesin dolduracağı bir
 * kilit anahtarına dönüşmeden dağıtık tahmin yavaşlar.
 * ponytail: süreç içi; çok kopyada paylaşılan sıra gerekir.
 */
const siralar = new Map<string, Promise<void>>();
export function siraBekle(anahtar: string, araMs: number): Promise<void> {
  const sira = (siralar.get(anahtar) ?? Promise.resolve()).then(
    () => new Promise<void>((r) => setTimeout(r, araMs)),
  );
  siralar.set(anahtar, sira);
  void sira.then(() => {
    if (siralar.get(anahtar) === sira) siralar.delete(anahtar);
  });
  return sira;
}

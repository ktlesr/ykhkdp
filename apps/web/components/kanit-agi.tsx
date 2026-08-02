/**
 * Kanıt ağı — tanıtım sayfasının hero görseli.
 *
 * NE ANLATIYOR. Üç üst ölçekli belgeden önerilere alıntı hatları çiziliyor.
 * Çoğu tutuyor (jade, düz çizgi, ucu parlıyor); bir kısmı çizilip DÜŞÜYOR
 * (ochre, kesikli, soluyor) — pakette birebir bulunamayan alıntı. Ürünün tek
 * pazarlıksız kuralı ekranda hareket hâlinde: alıntı doğrulanmazsa düşer.
 *
 * NEDEN HARİTA DEĞİL. Referans site (yerelkalkinmahamlesi.sanayi.gov.tr)
 * Türkiye silueti üzerine üçgenlenmiş bir ağ kuruyor. Aynısını yapmak hem
 * kopya olurdu hem de yanlış şeyi söylerdi: bu platform coğrafya göstermiyor,
 * bir iddianın belgeye bağlanışını gösteriyor. Görsel ürünün kendi veri
 * modelinden türüyor — belge · alıntı · öneri.
 *
 * TASARIM İSTİSNASI. Handoff §1.8 (glow) ve §2 ("başka animasyon yok") bu
 * bileşende bilerek gevşetildi; karar kullanıcıya ait ve YALNIZCA tanıtım
 * hero'sunu kapsıyor. Ürünün geri kalanı — epistemik gramer, tablo, kart,
 * form — handoff'ta kalır. `lib/tasarim.test.ts` istisnanın kapsamını ölçer:
 * `hero` önekli keyframe ve glow yalnızca `.hero-ag` altında olabilir.
 *
 * HAREKET SIFIRA İNER. `prefers-reduced-motion: reduce` altında ağ tamamen
 * çizili ve durağan görünür — bilgi kaybı yok, yalnızca hareket yok.
 *
 * DETERMİNİST YERLEŞİM. Konumlar tam sayı LCG ile üretiliyor; `Math.random`
 * ve `Math.sin` yok. Sunucuda ve tarayıcıda birebir aynı işaretleme çıkar,
 * yoksa hydration uyuşmazlığı olurdu (transandantal fonksiyonlar motorlar
 * arasında son bitte ayrışabiliyor).
 */

/**
 * viewBox oranı hero'nun gerçek oranına yakın tutuldu (3:1). `slice` ile
 * kaplarken en az kırpma bu oranda oluyor; dar viewBox'ta belge çubukları
 * geniş ekranda kadraj dışında kalıyordu.
 */
const G = 1440;
const Y = 480;

/** Tam sayı LCG — aynı girdi her yerde aynı çıktı. */
function dizi(tohum: number, adet: number): number[] {
  const out: number[] = [];
  let s = tohum >>> 0;
  for (let i = 0; i < adet; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push(s / 4294967296);
  }
  return out;
}

/** Üç üst ölçekli belge — gerçek kümenin karşılığı (TR33 · 12KP · BGUS). */
const BELGELER = [
  { x: 138, y: 116, ad: "Bölge planı" },
  { x: 96, y: 246, ad: "Kalkınma planı" },
  { x: 168, y: 372, ad: "Ulusal strateji" },
];

const DUGUM_SAYISI = 60;

/** Öneri düğümleri: sağa doğru açılan, jitter'lı bir alan. */
const r = dizi(20270730, DUGUM_SAYISI * 3);
const DUGUMLER = Array.from({ length: DUGUM_SAYISI }, (_, i) => {
  const sutun = i % 10;
  const satir = Math.floor(i / 10);
  return {
    x: 430 + sutun * 104 + (r[i * 3] - 0.5) * 74,
    y: 54 + satir * 76 + (r[i * 3 + 1] - 0.5) * 54,
    boy: 1.7 + r[i * 3 + 2] * 2.4,
  };
});

/**
 * Alıntı hatları. Her belge birkaç öneriye bağlanır; beşte biri DÜŞER.
 * Oran uydurma bir istatistik değil, görsel bir vurgu — ürünün metni
 * "yarısından fazlası düşerse çıktı reddedilir" der, burada azınlık düşüyor.
 */
const h = dizi(613144, 120);
const HATLAR = BELGELER.flatMap((b, bi) =>
  Array.from({ length: 9 }, (_, j) => {
    const k = h[bi * 30 + j * 2];
    const d = DUGUMLER[Math.floor(k * DUGUM_SAYISI)];
    return {
      id: `${bi}-${j}`,
      x1: b.x,
      y1: b.y,
      x2: d.x,
      y2: d.y,
      dusen: h[bi * 30 + j * 2 + 1] > 0.8,
      gecikme: (bi * 9 + j) * 0.42,
      sure: 6.2 + h[bi * 30 + j * 2 + 1] * 3.6,
    };
  }),
);

export function KanitAgi() {
  return (
    <div className="hero-ag" aria-hidden="true">
      <svg viewBox={`0 0 ${G} ${Y}`} preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <filter id="hero-parla" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Öneri düğümleri — sessiz alan */}
        <g className="hero-dugumler">
          {DUGUMLER.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.boy} style={{ animationDelay: `${(i % 13) * 0.7}s` }} />
          ))}
        </g>

        {/* Alıntı hatları — çizilir, tutar ya da düşer */}
        <g className="hero-hatlar">
          {HATLAR.map((l) => (
            <line
              key={l.id}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              className={l.dusen ? "hero-hat hero-hat-dusen" : "hero-hat"}
              style={{ animationDelay: `${l.gecikme}s`, animationDuration: `${l.sure}s` }}
            />
          ))}
        </g>

        {/* Belge düğümleri — künye çubukları, ağın kaynağı */}
        <g className="hero-belgeler" filter="url(#hero-parla)">
          {BELGELER.map((b, i) => (
            <g key={b.ad} style={{ animationDelay: `${i * 1.1}s` }}>
              <rect x={b.x - 1.5} y={b.y - 26} width="3" height="52" />
              <circle cx={b.x} cy={b.y} r="4.5" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

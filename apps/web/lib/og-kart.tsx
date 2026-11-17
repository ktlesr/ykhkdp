import { ImageResponse } from "next/og";
import { platformOzeti } from "@ykh/database";
import { GRUP_ETIKET, gruplaraGore, TR33_2027_V1 } from "@ykh/scoring";
import { baglam } from "@/lib/oturum.ts";
import { siteUrl } from "@/lib/site.ts";

/**
 * Paylaşım kartı — uygulamayla aynı "değerlendirme raporu" dünyası.
 *
 * Her açık sayfa kendi başlığıyla kart üretir (`opengraph-image.tsx`
 * dosyaları bu fonksiyonu çağırır). Kartta YALNIZCA kamuya açık veri var:
 * referans sayıları ve sürümlü ağırlık seti. Öneri verisi yok — kapalı
 * ekranlar kök kartı miras alır, kendi kartları yoktur.
 *
 * Sayılar ve ağırlıklar gerçek (veritabanı · `TR33-2027-v1`); veritabanı
 * okunamazsa sayı rafı çizilmez, uydurulmaz.
 */

export const OG_BOYUT = { width: 1200, height: 630 };

const INK = "#16191d";
const SOFT = "#475059";
const MUTE = "#616a73";
const KOBALT = "#1d3fa8";
const KOBALT_TINT = "#eef1fb";
const CIZGI = "#d3d6d2";
const CIZGI_SOFT = "#e6e8e5";
const PAPER = "#fafaf9";

/**
 * Yazı yüzü — uygulamanın kendi yüzleri (Schibsted Grotesk, JetBrains Mono).
 *
 * Google Fonts'tan TTF olarak alınır (Satori woff2 okumaz) ve süreç boyunca
 * bellekte tutulur. İSTEK DÜŞERSE KART YİNE ÇİZİLİR: `next/og`'nin gömülü
 * yüzüne düşülür. Kartı bir ağ isteğine bağlamamak için 3 sn zaman aşımı.
 * ponytail: süreç içi önbellek; çok kopyada her kopya bir kez indirir.
 */
type Yuz = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700; style: "normal" };
let yuzler: Promise<Yuz[]> | null = null;

async function ttf(aile: string, agirlik: number): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${aile}:wght@${agirlik}`, {
      signal: AbortSignal.timeout(3000),
    })
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error("ttf bulunamadı");
  return (await fetch(url, { signal: AbortSignal.timeout(3000) })).arrayBuffer();
}

function yuzleriYukle(): Promise<Yuz[]> {
  yuzler ??= Promise.all([
    ttf("Schibsted+Grotesk", 400).then((data) => ({ name: "Schibsted", data, weight: 400 as const, style: "normal" as const })),
    ttf("Schibsted+Grotesk", 600).then((data) => ({ name: "Schibsted", data, weight: 600 as const, style: "normal" as const })),
    ttf("JetBrains+Mono", 500).then((data) => ({ name: "Mono", data, weight: 500 as const, style: "normal" as const })),
  ]).catch((e) => {
    console.warn(JSON.stringify({ seviye: "uyari", mesaj: "og_yazi_yuzu_yok", sebep: String(e) }));
    yuzler = null; // sonraki istek yeniden denesin
    return [];
  });
  return yuzler;
}

/** Kurumsal işaret — `ui.tsx` Amblem ve `app/icon.svg` ile aynı geometri. */
export function AmblemSvg({ boy }: { boy: number }) {
  return (
    <svg width={boy} height={boy} viewBox="0 0 24 24">
      <rect x="0" y="0" width="24" height="24" rx="3" fill={KOBALT} />
      <path d="M6 7.5h12M6 12h6.5M6 16.5h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <rect x="15" y="10" width="4" height="4" fill="#fff" />
    </svg>
  );
}

export async function ogKart({ etiket, baslik, alt }: { etiket: string; baslik: string; alt: string }) {
  const [fonts, raf] = await Promise.all([
    yuzleriYukle(),
    platformOzeti(await baglam())
      .then((o) => [
        { ad: "il", deger: o.il },
        { ad: "kalkınma ajansı", deger: o.ajans },
        { ad: "NACE kodu", deger: o.nace },
        { ad: "belge parçası", deger: o.parca },
      ])
      .catch(() => []),
  ]);
  const yazi = fonts.length ? "Schibsted" : undefined;
  const mono = fonts.length ? "Mono" : undefined;
  const gruplar = gruplaraGore(TR33_2027_V1.agirliklar);
  const enBuyuk = Math.max(...gruplar.map((g) => g.agirlik));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          color: INK,
          fontFamily: yazi,
        }}
      >
        {/* Üst çubuk — uygulamanın UstBar'ı */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: 92,
            padding: "0 64px",
            borderBottom: `1px solid ${CIZGI}`,
          }}
        >
          <AmblemSvg boy={40} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>YKH</div>
            <div style={{ fontSize: 17, color: MUTE }}>Yerel Kalkınma Hamlesi · karar destek</div>
          </div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 17, color: MUTE, fontFamily: mono }}>
            {siteUrl().host}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, padding: "48px 64px 0", gap: 56 }}>
          {/* Sol: sayfanın kendi başlığı */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 600, color: KOBALT }}>{etiket}</div>
            <div
              style={{
                marginTop: 14,
                fontSize: baslik.length > 48 ? 50 : 58,
                fontWeight: 600,
                lineHeight: 1.06,
                letterSpacing: -1.6,
              }}
            >
              {baslik}
            </div>
            <div style={{ marginTop: 22, fontSize: 24, lineHeight: 1.45, color: SOFT, maxWidth: 600 }}>{alt}</div>
          </div>

          {/* Sağ: rapordaki şekil — gerçek ağırlık seti */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 400,
              alignSelf: "flex-start",
              border: `1px solid ${CIZGI}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 18px",
                backgroundColor: PAPER,
                borderBottom: `1px solid ${CIZGI}`,
                fontSize: 16,
                color: SOFT,
              }}
            >
              <span>Puanın yapısı</span>
              <span style={{ fontFamily: mono, color: MUTE }}>{TR33_2027_V1.surum}</span>
            </div>
            {gruplar.map((g, i) => (
              <div
                key={g.grup}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "13px 18px",
                  borderTop: i ? `1px solid ${CIZGI_SOFT}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18 }}>
                  <span style={{ fontWeight: i === 0 ? 600 : 400 }}>{GRUP_ETIKET[g.grup]}</span>
                  <span style={{ fontFamily: mono }}>%{Math.round(g.agirlik * 100)}</span>
                </div>
                <div style={{ display: "flex", height: 6, backgroundColor: KOBALT_TINT }}>
                  <div
                    style={{
                      width: `${(g.agirlik / enBuyuk) * 100}%`,
                      backgroundColor: i === 0 ? KOBALT : "#5a72c4",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt: gerçek sayılar */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 48,
            margin: "0 64px",
            padding: "20px 0 34px",
            borderTop: `1px solid ${CIZGI}`,
          }}
        >
          {raf.map((x) => (
            <div key={x.ad} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 30, fontFamily: mono }}>{x.deger.toLocaleString("tr-TR")}</div>
              <div style={{ fontSize: 16, color: MUTE }}>{x.ad}</div>
            </div>
          ))}
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 17, color: MUTE }}>
            Yapay zekâ puan üretir, ajans karar verir.
          </div>
        </div>
      </div>
    ),
    { ...OG_BOYUT, fonts },
  );
}

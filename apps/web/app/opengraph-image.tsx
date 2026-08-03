import { ImageResponse } from "next/og";
import { platformOzeti } from "@ykh/database";
import { baglam } from "@/lib/oturum.ts";

/**
 * Paylaşım kartı — WhatsApp, LinkedIn, X, Facebook, Telegram, Slack.
 *
 * 1200×630 hepsinin kabul ettiği ölçü: X'in `summary_large_image` kartı,
 * LinkedIn'in 1.91:1 istediği oran ve WhatsApp'ın küçük önizlemesi aynı
 * görselden çıkıyor. Ayrı ölçü üretmek gerekmiyor.
 *
 * SAYILAR VERİTABANINDAN. Bu ürünün kuralı "uydurma metrik yazılamaz"
 * (DESIGN.md · tanıtım sayfası) ve kart da o kurala tabi: 81 il, 26 ajans,
 * 3190 NACE kodu ve belge parçası sayısı gerçek. Veritabanı okunamazsa
 * sayılar bölümü hiç çizilmiyor — yanlış sayı göstermektense göstermemek.
 *
 * ÖNERİ VERİSİ YOK. Kart yalnızca kamuya açık referans sayılarını taşıyor;
 * `platformOzeti` içindeki `listede`/`bekleyen` alanları KULLANILMIYOR, çünkü
 * onlar öneri kümesinden türüyor ve bu kart anonim bağlamda üretiliyor.
 *
 * Tipografi: `next/og`'nin gömülü yüzü kullanılıyor. Newsreader'ı çalışma
 * anında indirmek kartı bir ağ isteğine bağlardı; istek düşerse paylaşım
 * kartı bozulur ve bunu kimse fark etmez. Marka dokusu ölçü cetveli, ink
 * paneli ve düzenle taşınıyor — yüzle değil.
 */

export const alt = "YKH-KDP · Yerel Kalkınma Hamlesi karar destek platformu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#101419";
const KAGIT = "#F6F4EF";
const SOLUK = "#8E959F";
const CIZGI = "#2A3039";
const JADE = "#2FBF95";

export default async function Image() {
  let raf: Array<{ ad: string; deger: string }> = [];
  try {
    const o = await platformOzeti(await baglam());
    raf = [
      { ad: "il", deger: o.il.toLocaleString("tr-TR") },
      { ad: "kalkınma ajansı", deger: o.ajans.toLocaleString("tr-TR") },
      { ad: "NACE kodu", deger: o.nace.toLocaleString("tr-TR") },
      { ad: "belge parçası", deger: o.parca.toLocaleString("tr-TR") },
    ];
  } catch {
    // Veritabanı yoksa kart yine çizilir, sayılar bölümü boş kalır.
    raf = [];
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: INK,
          color: KAGIT,
          padding: "56px 64px",
          position: "relative",
        }}
      >
        {/* Ölçü cetveli — markanın dokusu. Satori `repeating-linear-gradient`
            desteklemiyor, çizgiler tek tek konuyor. */}
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: i * 52,
              width: 1,
              backgroundColor: "rgba(237,233,224,0.07)",
            }}
          />
        ))}

        {/* Künye şeridi */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            paddingBottom: 22,
            borderBottom: `1px solid ${CIZGI}`,
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 5, color: KAGIT }}>YKH·KDP</div>
          <div style={{ fontSize: 19, letterSpacing: 3, color: SOLUK }}>
            YEREL KALKINMA HAMLESİ · KARAR DESTEK
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 62, lineHeight: 1.1, letterSpacing: -1, maxWidth: 940 }}>
            Dört yatırım konusu,
          </div>
          <div style={{ fontSize: 62, lineHeight: 1.1, letterSpacing: -1, maxWidth: 940 }}>
            gerekçesi gösterilebilir olsun.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30 }}>
            <div style={{ width: 34, height: 3, backgroundColor: JADE }} />
            <div style={{ fontSize: 25, color: "#C9CDD3", maxWidth: 860, lineHeight: 1.4 }}>
              Öneriler üst ölçekli plan belgelerine birebir alıntıyla bağlanır, sekiz kriterle
              puanlanır, ajans onayından geçer.
            </div>
          </div>
        </div>

        {/* Ölçü rafı — gerçek sayılar */}
        {raf.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 56,
              paddingTop: 22,
              borderTop: `1px solid ${CIZGI}`,
            }}
          >
            {raf.map((x) => (
              <div key={x.ad} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 34, color: KAGIT }}>{x.deger}</div>
                <div style={{ fontSize: 17, letterSpacing: 2, color: SOLUK }}>
                  {x.ad.toLocaleUpperCase("tr-TR")}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", flex: 1 }} />
            <div style={{ display: "flex", alignItems: "flex-end", fontSize: 17, color: SOLUK }}>
              Sıralama karar değildir.
            </div>
          </div>
        )}
      </div>
    ),
    size,
  );
}

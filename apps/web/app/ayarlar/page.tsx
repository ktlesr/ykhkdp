import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ayarGetir, bolgeler, kayitliKullanicilar, raporSatirlari } from "@ykh/database";
import { onaylayabilir } from "@ykh/domain";
import { KullaniciListesi } from "@/components/kullanici-listesi.tsx";
import { PaletSecici } from "@/components/palet-secici.tsx";
import { ModelSecici } from "@/components/model-secici.tsx";
import { MODEL_SECENEKLERI } from "@ykh/ai-gateway";
import { RaporTablosu } from "@/components/rapor-tablosu.tsx";
import { Bag, Baslik, Bos, Sayfa, UstBar, Uyari } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { KAPALI } from "@/lib/site.ts";
import { paletGecerli } from "@/lib/palet.ts";

/**
 * Ayarlar — üç bölüm, iki farklı seyirci.
 *
 * `ajans`    → yalnızca toplu rapor, KENDİ BÖLGESİYLE sınırlı
 * `yonetici` → hepsi: palet, kayıtlı kullanıcılar (KVKK), tüm bölgeler
 *
 * Rapor kapsamı burada DEĞİL sorguda kuruluyor (`raporSatirlari`): kapsamı
 * sayfa belirlerse, çağırmayı unutan bir sayfa hepsini gösterir.
 *
 * Neden ayrı ekran değil: rapor bir kurumsal görünüm, `/onay` kuyruk ve
 * `/il/[il]` sıralama ekranı. Protokol §10 yeni route için gerekçe istiyor ve
 * burada gerekçe yok — mevcut ekranın bölümü olarak duruyor.
 */
/**
 * ARAMA MOTORUNA VE PAYLAŞIM KARTINA KAPALI.
 *
 * Bu ekran öneri verisi taşıyor ya da ona götürüyor. Başlık sabit ve
 * içerikten türemiyor: dinamik bir başlık (ör. önerinin kendi adı) sekme
 * adında, tarayıcı geçmişinde ve paylaşılan bir bağlantının önizlemesinde
 * görünürdü — RLS ile kapattığımız şey oradan sızardı.
 */
export const metadata: Metadata = { title: "Ayarlar", robots: KAPALI };

export default async function Ayarlar() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fayarlar");
  if (!onaylayabilir(k.rol)) redirect("/oneri");

  const yonetici = k.rol === "yonetici";
  const b = await baglam();
  const [secili, satirlar, kullanicilar, modelAyari, taramaAyari] = await Promise.all([
    yonetici ? ayarGetir(b, "palet").then(paletGecerli) : Promise.resolve(null),
    raporSatirlari(b),
    yonetici ? kayitliKullanicilar(b) : Promise.resolve([]),
    yonetici ? ayarGetir(b, "ai_model") : Promise.resolve(null),
    yonetici ? ayarGetir(b, "ai_tarama_model") : Promise.resolve(null),
  ]);

  // Ölçüm 2026-11-17: `pnpm ai:eval` (4 örnek × 3 koşu) ve 8 gruplu tarama sınaması.
  const ACIKLAMA: Record<string, string> = {
    "openai:gpt-5.4-mini-2026-03-17": "Eval kırıldı: yerelliği ayırıyor ama alıntılarının %57–77'si belgede bulunamadı ve düştü.",
    "anthropic:claude-opus-5-5": "Eval geçti; düşen alıntı %0, belge dayanağı en yüksek. Sonnet'in iki katı fiyat.",
    "anthropic:claude-sonnet-5-5": "Önerilen. Eval geçti; yerel/genel gerekçe ayrımı 78/36, belgeli/belgesiz konu 80/9. Opus'un yarı fiyatı.",
    "anthropic:claude-haiku-5-5": "Eval kırıldı: yerellik ayrımı zayıf (55/32). Yargı için önerilmez.",
    "zafer:gemma4-26b": "Kurum sunucusundaki model: belge metni kurum dışına çıkmaz, çağrı ücreti yok. Yargı kalitesi henüz ölçülmedi (eval koşturulmadı).",
  };
  const TARAMA_ACIKLAMA: Record<string, string> = {
    "openai:gpt-5.4-mini-2026-03-17": "8 grupta 75 kanıt, 1 reddedilen çağrı, ort. 6,1 sn.",
    "anthropic:claude-opus-5-5": "8 grupta 66 kanıt, 0 ret, ort. 9,6 sn; ≈$0,41. Taramada gereğinden pahalı.",
    "anthropic:claude-sonnet-5-5": "8 grupta yalnızca 13 kanıt, 4 reddedilen çağrı. Tarama için önerilmez.",
    "anthropic:claude-haiku-5-5": "Önerilen. 8 grupta 57 kanıt, 0 ret, ort. 4 sn; ≈$0,009 — Opus'un ~45'te biri.",
    "zafer:gemma4-26b": "Kurum sunucusundaki model: ücret yok, ama dakikada 30 istek sınırıyla tarama yavaş. Kanıt verimi henüz ölçülmedi.",
  };
  const anthropicSecenekleri = MODEL_SECENEKLERI.map((m) => ({
    id: m.id,
    ad: m.ad,
    model: m.model,
    anahtarVar: Boolean(process.env[m.anahtar]),
    aciklama: ACIKLAMA[m.id] ?? "",
  }));
  const taramaSecenekleri = [
    {
      id: "ayni",
      ad: "Yargı modeliyle aynı",
      model: "—",
      anahtarVar: true,
      aciklama: "Tarama da yukarıda seçilen modelle yapılır.",
    },
    ...anthropicSecenekleri.map((m) => ({ ...m, aciklama: TARAMA_ACIKLAMA[m.id] ?? m.aciklama })),
  ];
  const modelSecenekleri = [
    {
      id: "varsayilan",
      ad: "Ortam değişkenine göre",
      model: process.env.YKH_MODEL_SNAPSHOT || (process.env.OPENAI_API_KEY ? "gpt-5.4-mini-2026-03-17" : "çevrimdışı"),
      anahtarVar: true,
      aciklama: "YKH_MODEL_SNAPSHOT ve OPENAI_API_KEY belirler; anahtar yoksa çevrimdışı deterministik istemci.",
    },
    ...anthropicSecenekleri,
  ];

  // ponytail: ajans listesi için ayrı sorgu yazılmadı — `bolgeler()` zaten
  // 26 ajansı getiriyor. İl listesi fazladan geliyor; ölçülebilir bir yük
  // olursa dar bir sorgu eklenir.
  const ajanslar = yonetici ? (await bolgeler(b)).map((x) => ({ kod: x.ajans_kod, ad: x.ajans })) : [];

  const raporBolgeleri = [...new Set(satirlar.map((r) => r.ajans_kod))];
  const degerlendirilen = satirlar.filter((r) => r.dayanak !== null).length;

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: "Onay", yol: "/onay" },
          { ad: "Belgeler", yol: "/belgeler" },
          { ad: "Ayarlar", yol: "/ayarlar", aktif: true },
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket={yonetici ? "Yönetici" : "Ajans"}
          alt={
            yonetici ? (
              <>
                Buradaki ayarlar <b>kurumsal</b>dır: herkes aynı görünümü görür ve değişiklik denetim kaydına
                yazılır. Kişisel tercih yoktur; ekran görüntüsü paylaşıldığında herkeste aynı çıksın diye.
              </>
            ) : (
              <>
                Bölgenizdeki tüm iller için girilmiş her kayıt — kim girdiyse — gerekçesi ve puanlarıyla.
                Kurumsal ayarları yalnızca yönetici değiştirir.
              </>
            )
          }
        >
          {yonetici ? "Ayarlar" : "Bölge raporu"}
        </Baslik>

        {/* ── Toplu rapor ─────────────────────────────────────────────── */}
        <section className="mt-9">
          <h2 className="font-display text-[24px] font-medium leading-[1.15]">Toplu öneri raporu</h2>
          <p className="mt-2 max-w-[78ch] text-[13.5px] leading-[1.55] text-ink-soft">
            {yonetici ? (
              <>
                81 ilin tamamı: yürürlükteki resmî konular ve yatırımcı önerileri, gerekçeleri ve sekiz kriter
                puanıyla birlikte.
              </>
            ) : (
              <>
                <b className="font-medium">{raporBolgeleri.join(", ") || "—"}</b> bölgesindeki illere girilmiş tüm
                kayıtlar. Bölgesi atanmamış bir ajans hesabı hiçbir satır görmez — eksik bilgiyle hepsini
                göstermek yerine hiçbirini göstermek doğru davranıştır.
              </>
            )}{" "}
            Puanlar <b className="font-medium">ajans onaylayana kadar taslaktır</b>; ajans onayı zorunlu geçittir.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="num etiket tracking-widest text-ink-mute">
              {satirlar.length} kayıt · {degerlendirilen} değerlendirildi · {raporBolgeleri.length} bölge
            </span>
            {satirlar.length > 0 && (
              <Bag varyant="dolu" href="/rapor">
                Excel olarak indir (.xlsx)
              </Bag>
            )}
          </div>

          {satirlar.length === 0 ? (
            <Bos baslik="Görünen kayıt yok.">
              {yonetici
                ? "Henüz hiçbir ile öneri girilmemiş."
                : "Hesabınıza bir ajans bölgesi atanmamış görünüyor. Yönetici atadıktan sonra bölgenizdeki kayıtlar burada listelenir."}
            </Bos>
          ) : (
            <RaporTablosu satirlar={satirlar} />
          )}
        </section>

        {/* ── Kayıtlı kullanıcılar · KVKK ─────────────────────────────── */}
        {yonetici && (
          <section className="mt-12 border-t border-t-hairline pt-9">
            <h2 className="font-display text-[24px] font-medium leading-[1.15]">Kayıtlı kullanıcılar</h2>
            <p className="mt-2 max-w-[78ch] text-[13.5px] leading-[1.55] text-ink-soft">
              Kişisel veri <b className="font-medium">maskeli</b> gösterilir; açık değer veritabanından bu ekrana
              hiç gelmez. Tek bir kaydı açmak ayrı bir eylemdir, gerekçe ister ve denetim izine yazılır — KVKK'nın
              istediği yetkiyi kaldırmak değil, kullanımını kayıt altına almaktır.
            </p>

            <Uyari>
              Silme talebinde <b className="font-semibold text-[#5F4A15]">kimlik silinir, öneri zinciri korunur</b>.
              Öneriler kişiye değil değişmez bir takma anahtara (<span className="num">gonderen.ref</span>) bağlıdır;
              kişisel veri gidince sıralama ve denetim izi bozulmaz.
            </Uyari>

            {kullanicilar.length === 0 ? (
              <Bos baslik="Kayıtlı hesap yok.">Misafir gönderenlerin kimlik satırı hiç oluşturulmaz.</Bos>
            ) : (
              <KullaniciListesi kullanicilar={kullanicilar} ajanslar={ajanslar} />
            )}
          </section>
        )}

        {/* ── Görünüm ─────────────────────────────────────────────────── */}
        {yonetici && secili && (
          <section className="mt-12 border-t border-t-hairline pt-9">
            <h2 className="font-display text-[24px] font-medium leading-[1.15]">Görünüm</h2>
            <PaletSecici secili={secili} />
          </section>
        )}

        {/* ── Yapay zekâ modeli ───────────────────────────────────────── */}
        {yonetici && (
          <section className="mt-12 border-t border-t-hairline pt-9">
            <h2 className="font-display text-[24px] font-medium leading-[1.15]">Yapay zekâ modeli</h2>
            <p className="mt-3 max-w-[78ch] text-[13.5px] leading-[1.55] text-ink-soft text-pretty">
              İki iş, iki model. <b className="font-medium text-ink">Yargı</b> az çağrı yapar ama muhakeme ister.{" "}
              <b className="font-medium text-ink">Tarama</b> çağrıların büyük çoğunluğudur (her belge parçası bir kez)
              ve muhakeme istemez: pasaj kaynakta birebir yoksa doğrulayıcı düşürür. Fiyat/performans için taramada
              ucuz ve hızlı, yargıda güçlü model. Doğrulama zinciri ikisinde de aynıdır; her kaydın künyesine yanıtı
              veren model yazılır. Claude'un kullanım limiti dolarsa (hız sınırı, aşırı yük, bakiye) o çağrıyı
              otomatik olarak OpenAI GPT-5.4 mini devralır ve künyeye o yazılır; ret ya da kimlik hatası devredilmez.
              Değişiklik arka plan işleyicisine en geç yarım dakikada yansır.
            </p>
            <ModelSecici
              gorev="yargi"
              baslik="Yargı · değerlendirme, karşı görüş, NACE, aday üretimi"
              aciklama="Sekiz kriter puanı, karşı görüş ve keşif adayları bu modelden gelir."
              secili={modelAyari ?? "varsayilan"}
              secenekler={modelSecenekleri}
            />
            <ModelSecici
              gorev="tarama"
              baslik="Tarama · kanıt çıkarımı"
              aciklama="Belgelerden pasaj seçer; seçilen her pasaj kaynakta birebir doğrulanır. Bir parça hangi modelle taranmış olursa olsun bir kez taranır: model değişince yalnızca henüz taranmamış parçalar yeni modelle taranır."
              secili={taramaAyari ?? "ayni"}
              secenekler={taramaSecenekleri}
            />
          </section>
        )}
      </Sayfa>
    </>
  );
}

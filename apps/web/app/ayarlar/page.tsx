import { redirect } from "next/navigation";
import { ayarGetir, kayitliKullanicilar, raporSatirlari } from "@ykh/database";
import { onaylayabilir } from "@ykh/domain";
import { KullaniciListesi } from "@/components/kullanici-listesi.tsx";
import { PaletSecici } from "@/components/palet-secici.tsx";
import { RaporTablosu } from "@/components/rapor-tablosu.tsx";
import { Bag, Baslik, Bos, Sayfa, UstBar, Uyari } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
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
export default async function Ayarlar() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fayarlar");
  if (!onaylayabilir(k.rol)) redirect("/oneri");

  const yonetici = k.rol === "yonetici";
  const b = await baglam();
  const [secili, satirlar, kullanicilar] = await Promise.all([
    yonetici ? ayarGetir(b, "palet").then(paletGecerli) : Promise.resolve(null),
    raporSatirlari(b),
    yonetici ? kayitliKullanicilar(b) : Promise.resolve([]),
  ]);

  const bolgeler = [...new Set(satirlar.map((r) => r.ajans_kod))];
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
                <b className="font-medium">{bolgeler.join(", ") || "—"}</b> bölgesindeki illere girilmiş tüm
                kayıtlar. Bölgesi atanmamış bir ajans hesabı hiçbir satır görmez — eksik bilgiyle hepsini
                göstermek yerine hiçbirini göstermek doğru davranıştır.
              </>
            )}{" "}
            Puanlar <b className="font-medium">doğrulanmamış taslaktır</b>; ajans onayı zorunlu geçittir.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <span className="num font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              {satirlar.length} kayıt · {degerlendirilen} değerlendirildi · {bolgeler.length} bölge
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
              <KullaniciListesi kullanicilar={kullanicilar} />
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
      </Sayfa>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { kuyrukKopyalari, onayKuyrugu } from "@ykh/database";
import { NACE_KAYNAK_ETIKET, ONERI_DURUM_ETIKET, onaylayabilir } from "@ykh/domain";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { KAPALI } from "@/lib/site.ts";

/** Ajans onay kuyruğu — AI puanladı, onay bekliyor. */
/**
 * ARAMA MOTORUNA VE PAYLAŞIM KARTINA KAPALI.
 *
 * Bu ekran öneri verisi taşıyor ya da ona götürüyor. Başlık sabit ve
 * içerikten türemiyor: dinamik bir başlık (ör. önerinin kendi adı) sekme
 * adında, tarayıcı geçmişinde ve paylaşılan bir bağlantının önizlemesinde
 * görünürdü — RLS ile kapattığımız şey oradan sızardı.
 */
export const metadata: Metadata = { title: "Onay kuyruğu", robots: KAPALI };

export default async function Onay() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fonay");
  if (!onaylayabilir(k.rol)) redirect("/oneri");

  const b = await baglam();
  const [kuyruk, kopyalar] = await Promise.all([onayKuyrugu(b), kuyrukKopyalari(b)]);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: "Onay", yol: "/onay", aktif: true },
          { ad: "Belgeler", yol: "/belgeler" },
          { ad: "Ayarlar", yol: "/ayarlar" },
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket="Ajans"
          alt="Yapay zekâ puanladı ama puan doğrulanmadı. Onaylanmadan hiçbir öneri il sıralamasına girmez. Onay geri alınabilir; kilit yoktur."
        >
          Onay kuyruğu
        </Baslik>

        {kuyruk.length === 0 ? (
          <Bos baslik="Kuyruk boş.">
            Yeni bir öneri geldiğinde yapay zekâ puanlar ve burada onayınıza düşer.
            <div className="mt-3">
              <Bag href="/belgeler">Üst ölçekli belgeleri yönet</Bag>
            </div>
          </Bos>
        ) : (
          <div className="mt-5 border border-hairline bg-surface">
            {kuyruk.map((o) => (
              <div key={o.id} className="border-b border-b-[#E9E5DB] px-5 py-4 last:border-b-0">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/oneri/${o.id}`} className="text-[15px] font-medium text-ink">
                      {o.baslik}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                      <span>
                        {o.il} · {o.ilce ?? "—"} · {o.yil}
                      </span>
                      {o.nace_kod && (
                        <span className="num">
                          NACE {o.nace_kod}
                          {o.nace_kaynagi ? ` · ${NACE_KAYNAK_ETIKET[o.nace_kaynagi]}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                    <Rozet tur={o.durum === "onay_bekliyor" ? "amber" : "notr"} isaret="◌">
                      {ONERI_DURUM_ETIKET[o.durum]}
                    </Rozet>
                    <Rozet tur={o.dayanak >= 55 ? "yesil" : "amber"}>dayanak {o.dayanak}/100</Rozet>
                  </div>
                </div>

                {/* Yakın kopya — AI yok, trigram benzerliği. Karar değil işaret. */}
                {(kopyalar.get(Number(o.id)) ?? []).length > 0 && (
                  <div className="mt-2.5 border-l-[3px] [border-left-style:dashed] border-l-absent pl-3">
                    <div className="font-mono text-[9.5px] uppercase tracking-[.11em] text-ink-mute">
                      Aynı dönemde benzer başlık
                    </div>
                    {(kopyalar.get(Number(o.id)) ?? []).map((y) => (
                      <div key={y.id} className="mt-1 text-[12.5px] leading-[1.45]">
                        <Link href={`/oneri/${y.id}`} className="text-ink underline decoration-hairline">
                          {y.baslik}
                        </Link>
                        <span className="num ml-2 text-[11px] text-ink-mute">
                          #{y.id} · benzerlik {Math.round(y.benzerlik * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-2.5 max-w-[85ch] text-[13px] leading-[1.5] text-ink-soft text-pretty">{o.gerekce}</p>

                {o.ai_gerekce && (
                  <div className="tex-unverified mt-3 border border-unverif-line border-l-[3px] border-l-unverif px-3.5 py-3">
                    <div className="font-mono text-[9.5px] uppercase tracking-[.11em] text-unverif">
                      <span aria-hidden>◌</span> AI değerlendirmesi · doğrulanmadı
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-soft">{o.ai_gerekce}</p>
                  </div>
                )}

                <div className="mt-3">
                  <Bag varyant="dolu" href={`/oneri/${o.id}`}>
                    İncele ve karar ver
                  </Bag>
                </div>
              </div>
            ))}
          </div>
        )}
      </Sayfa>
    </>
  );
}

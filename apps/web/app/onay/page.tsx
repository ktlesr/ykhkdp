import type { Metadata } from "next";
import { AsamaRozeti } from "@/components/degerlendirme-durumu.tsx";
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
            {/* Sıra = geliş sırası (en eski önce); onaylandıkça kayar. Kalıcı
                adres kayıt numarasıdır (#id), yakın kopya satırları da onu kullanır. */}
            {kuyruk.map((o, i) => (
              <div key={o.id} className="border-b border-b-hairline-soft px-5 py-4 last:border-b-0">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="num w-8 shrink-0 pt-px text-[13.5px] text-ink-mute" aria-label={`Sıra ${i + 1}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/oneri/${o.id}`} className="text-[15px] font-medium text-ink">
                      {o.baslik}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2.5 etiket text-ink-mute">
                      <span className="num">#{o.id}</span>
                      <span className="num">
                        {o.gonderildi}
                      </span>
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
                  <div className="flex shrink-0 flex-wrap items-center gap-2.5 max-[720px]:basis-full max-[720px]:pl-11">
                    {o.resmi_yillar && (
                      <Rozet tur="notr" isaret="■">
                        resmî listede: {o.resmi_yillar}
                      </Rozet>
                    )}
                    {o.kesif_id && (
                      <Rozet tur="notr" isaret="◇">
                        belgelerden keşif
                      </Rozet>
                    )}
                    {o.durum === "degerlendiriliyor" ? (
                      <AsamaRozeti asama={o.asama} hatali={o.hatali} />
                    ) : (
                      <Rozet tur="amber" isaret="◌">
                        {ONERI_DURUM_ETIKET[o.durum]}
                      </Rozet>
                    )}
                    {/* Onay bekleyen kayıt YEŞİL olmaz: yeşil doğrulanmış demektir. Eşik
                        durumu renkle değil sözle söylenir. */}
                    {/* Değerlendirilmemiş kayıt 0 YAZMAZ: 0 bir ölçümdür, boş "henüz yok" demektir. */}
                    {o.ai_gerekce === null ? (
                      <Rozet tur="amber" isaret="◌">
                        dayanak henüz yok
                      </Rozet>
                    ) : (
                      <Rozet tur={o.dayanak >= o.dayanak_esigi ? "notr" : "amber"}>
                        dayanak {o.dayanak}/100 · eşik {o.dayanak_esigi} ·{" "}
                        {o.dayanak >= o.dayanak_esigi ? "eşiği geçti" : "eşik altında"}
                      </Rozet>
                    )}
                  </div>
                </div>

                {/* Yakın kopya — AI yok, trigram benzerliği. Karar değil işaret. */}
                {(kopyalar.get(Number(o.id)) ?? []).length > 0 && (
                  <div className="mt-2.5 border-l-[3px] [border-left-style:dashed] border-l-unverif pl-3">
                    <div className="etiket text-ink-mute">
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
                  <div className="tex-unverified mt-3 border border-unverif-line border-l-[3px] border-l-unverif [border-left-style:dashed] px-3.5 py-3">
                    <div className="etiket text-unverif">
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

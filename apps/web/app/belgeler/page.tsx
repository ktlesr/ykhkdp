import { redirect } from "next/navigation";
import { belgeKapsami, belgeleriListele, illeriListele } from "@ykh/database";
import { onaylayabilir } from "@ykh/domain";
import { BelgeFormu } from "@/components/belge-formu.tsx";
import { BelgeSil } from "@/components/belge-sil.tsx";
import { Baslik, Bos, Rozet, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

const TUR_ETIKET: Record<string, string> = {
  bolge_plani: "Bölge planı",
  kalkinma_plani: "Kalkınma planı",
  ovp: "Orta vadeli program",
  strateji: "Strateji belgesi",
  il_raporu: "İl raporu",
  diger: "Diğer",
};

/** Üst ölçekli belgeler — AI değerlendirmesinin dayanağı. */
export default async function Belgeler() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fbelgeler");
  if (!onaylayabilir(k.rol)) redirect("/iller");

  const b = await baglam();
  const [belgeler, iller, kapsam] = await Promise.all([
    belgeleriListele(b),
    illeriListele(b),
    belgeKapsami(b),
  ]);

  // Eyleme dönük ayrım: yerel belgesi olmayan il, yapay zekânın "neden burada?"
  // sorusunu ulusal metinden gerekçelendiremediği ildir.
  const yerelsiz = kapsam.filter((x) => x.il_belgesi + x.ajans_belgesi === 0);
  const yerelli = kapsam.filter((x) => x.il_belgesi + x.ajans_belgesi > 0);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: "Onay", yol: "/onay" },
          { ad: "Belgeler", yol: "/belgeler", aktif: true },
          ...(k.rol === "yonetici" ? [{ ad: "Ayarlar", yol: "/ayarlar" }] : []),
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket="Ajans"
          alt="Yapay zekâ puanlarını yalnızca bu belgelere dayandırır ve alıntıları birebir doğrulanır. Belgeye bağlanamayan öneri, puanı yüksek olsa da slot dolduramaz."
        >
          Üst ölçekli belgeler
        </Baslik>

        <BelgeFormu iller={iller.map((x) => ({ kod: x.il_kod, ad: x.il }))} />

        {/* Kapsama — 81 satır duvar değil, eyleme dönük olan öne */}
        {kapsam.length > 0 && (
          <div className="mt-6 border border-hairline bg-surface">
            <div className="panel-koyu px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em]">
              Belge kapsaması
            </div>
            <p className="border-b border-b-hairline-soft px-4 py-2.5 text-[12.5px] leading-[1.45] text-ink-soft">
              Ulusal belgeler {kapsam.length} ilin tamamında geçerli.{" "}
              {yerelsiz.length === 0 ? (
                <b className="font-medium">Her ilde en az bir yerel belge var.</b>
              ) : (
                <>
                  <b className="font-medium">{yerelsiz.length} ilde yerel belge yok</b>; o illerde “neden burada?”
                  grubu ulusal metinden gerekçelendirilemez ve dayanak düşük kalır.
                </>
              )}
            </p>

            {yerelsiz.length > 0 && (
              <details className="katlanir">
                <summary className="flex min-h-11 items-center gap-3 bg-paper px-4 py-2.5">
                  <span aria-hidden className="katlanir-isaret text-[11px] text-ink-mute" />
                  <span className="font-mono text-[10px] uppercase tracking-[.1em] text-ink">
                    Yerel belgesi olmayan iller
                  </span>
                  <span className="num ml-auto font-mono text-[10px] text-ink-mute">{yerelsiz.length}</span>
                </summary>
                <div className="border-t border-t-hairline-soft px-4 py-3 text-[13px] leading-[1.6] text-ink-soft">
                  {yerelsiz.map((x) => x.il).join(" · ")}
                </div>
              </details>
            )}

            {yerelli.length > 0 && (
              <details className="katlanir border-t border-t-hairline-soft">
                <summary className="flex min-h-11 items-center gap-3 bg-paper px-4 py-2.5">
                  <span aria-hidden className="katlanir-isaret text-[11px] text-ink-mute" />
                  <span className="font-mono text-[10px] uppercase tracking-[.1em] text-ink">
                    Yerel belgesi olan iller
                  </span>
                  <span className="num ml-auto font-mono text-[10px] text-ink-mute">{yerelli.length}</span>
                </summary>
                <div className="border-t border-t-hairline-soft">
                  {yerelli.map((x) => (
                    <div
                      key={x.il_kod}
                      className="flex flex-wrap items-center gap-3 border-b border-b-hairline-soft px-4 py-2.5 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1 text-[13.5px]">{x.il}</span>
                      <span className="num font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                        il {x.il_belgesi} · ajans {x.ajans_belgesi} · ulusal {x.ulusal}
                      </span>
                      <Rozet tur="notr">{x.il_belgesi + x.ajans_belgesi} yerel belge</Rozet>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="mt-6 border border-hairline bg-surface">
          <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
            Belge kapsaması
          </div>
          <p className="border-b border-b-[#E9E5DB] px-4 py-2.5 text-[12px] leading-[1.45] text-ink-soft">
            Ulusal belgeler her ilde geçerli. İle veya ajansa özgü belge yoksa “neden burada?” grubu ulusal metinden
            gerekçelendirilemez ve dayanak düşük kalır.
          </p>
          {kapsam.map((x) => {
            const yerel = x.il_belgesi + x.ajans_belgesi;
            return (
              <div
                key={x.il_kod}
                className="flex flex-wrap items-center gap-3 border-b border-b-[#E9E5DB] px-4 py-2.5 last:border-b-0"
              >
                <span className="min-w-0 flex-1 text-[13.5px]">{x.il}</span>
                <span className="num font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                  il {x.il_belgesi} · ajans {x.ajans_belgesi} · ulusal {x.ulusal}
                </span>
                {yerel === 0 ? (
                  <Rozet tur="amber" isaret="◌">
                    Yerel belge yok
                  </Rozet>
                ) : (
                  <Rozet tur="notr">{yerel} yerel belge</Rozet>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 border border-hairline bg-surface">
          <div className="border-b-2 border-b-ink bg-paper px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em] text-ink">
            Yüklü belgeler ({belgeler.length})
          </div>
          {belgeler.length === 0 ? (
            <Bos baslik="Henüz belge yok.">
              Belge yüklenmeden yapay zekâ hiçbir öneriyi gerekçelendiremez; tüm dayanak puanları 0 kalır ve slotlar
              boş görünür.
            </Bos>
          ) : (
            belgeler.map((x) => (
              <div key={x.ad} className="flex flex-wrap items-center gap-3 border-b border-b-[#E9E5DB] px-4 py-3.5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{x.ad}</div>
                  <div className="mt-1 flex flex-wrap gap-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    <span>{TUR_ETIKET[x.tur] ?? x.tur}</span>
                    {x.yil && <span className="num">{x.yil}</span>}
                    <span className="num">{x.parca.toLocaleString("tr-TR")} parça</span>
                    <span className="num">{x.uzunluk.toLocaleString("tr-TR")} karakter</span>
                  </div>
                </div>
                <Rozet tur="notr">
                  {x.il_kod ? `İl · ${x.il_kod}` : x.ajans_kod ? `Ajans · ${x.ajans_kod}` : "Ulusal"}
                </Rozet>
                <BelgeSil ad={x.ad} parca={x.parca} />
              </div>
            ))
          )}
        </div>
      </Sayfa>
    </>
  );
}

import { type RaporSatiri } from "@ykh/database";
import { NACE_KAYNAK_ETIKET, ONERI_DURUM_ETIKET, type NaceKaynagi } from "@ykh/domain";
import { KRITERLER, KRITER_ETIKET } from "@ykh/scoring";
import { Rozet } from "./ui.tsx";

/**
 * Toplu öneri raporu — ile göre katlanır, gerekçesi ve kriter puanlarıyla.
 *
 * Ekranın işi TARAMAK, Excel'in işi işlemek. Bu yüzden burada her satır tam
 * açık: başlık, "neden burada?" gerekçesi, sekiz kriterin puanı ve dayanak
 * yan yana. Kısaltma yok (protokol §9) — kriter adları tam yazılır.
 *
 * Değerlendirilmemiş satırda 0 YAZILMAZ. 0 bir ölçümdür; boş "henüz
 * ölçülmedi" demektir ve ikisi karıştırılırsa rapor yalan söyler.
 */

const DURUM_TURU = {
  listede: "yesil",
  onay_bekliyor: "amber",
  degerlendiriliyor: "notr",
  reddedildi: "kirmizi",
} as const;

export function RaporTablosu({ satirlar }: { satirlar: RaporSatiri[] }) {
  const iller = satirlar.reduce<Array<{ kod: string; il: string; ajans: string; ajansKod: string; satirlar: RaporSatiri[] }>>(
    (out, r) => {
      const g = out.find((x) => x.kod === r.il_kod);
      if (g) g.satirlar.push(r);
      else out.push({ kod: r.il_kod, il: r.il, ajans: r.ajans, ajansKod: r.ajans_kod, satirlar: [r] });
      return out;
    },
    [],
  );

  return (
    <div className="mt-5 border border-hairline bg-surface">
      {iller.map((g) => {
        const degerlendirilen = g.satirlar.filter((r) => r.dayanak !== null).length;
        return (
          <details key={g.kod} className="katlanir border-b border-b-hairline last:border-b-0">
            <summary className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 bg-paper px-5 py-3">
              <span aria-hidden className="katlanir-isaret shrink-0 text-[11px] text-ink-mute" />
              <span className="num shrink-0 font-mono text-[11px] tracking-[.1em] text-ink-mute">{g.ajansKod}</span>
              <span className="text-[15px] font-medium">{g.il}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-mute">{g.ajans}</span>
              <span className="num shrink-0 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                {g.satirlar.length} kayıt · {degerlendirilen} değerlendirildi
              </span>
            </summary>

            {g.satirlar.map((r) => (
              <article key={r.id} className="border-t border-t-hairline-soft px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <a href={`/oneri/${r.id}`} className="text-[14.5px] font-medium leading-[1.35] text-pretty">
                    {r.baslik}
                  </a>
                  <Rozet tur={r.koken === "mevcut" ? "notr" : "gri"}>{r.koken}</Rozet>
                  <Rozet
                    tur={DURUM_TURU[r.durum]}
                    isaret={r.durum === "listede" ? "■" : r.durum === "reddedildi" ? "▼" : "◌"}
                  >
                    {ONERI_DURUM_ETIKET[r.durum]}
                  </Rozet>
                  {r.misafir && <Rozet tur="gri">misafir</Rozet>}
                  {r.duzeltildi && <Rozet tur="notr">puan ajansça düzeltildi</Rozet>}
                  <span className="num ml-auto font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    {r.dayanak === null ? (
                      "değerlendirilmedi"
                    ) : (
                      <>
                        dayanak {r.dayanak}/100 · {r.alinti} alıntı
                      </>
                    )}
                  </span>
                </div>

                {r.nace_kod && (
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    <span className="num">NACE {r.nace_kod}</span>
                    {r.nace_tanim && <> · {r.nace_tanim}</>}
                    {r.nace_kaynagi && <> · {NACE_KAYNAK_ETIKET[r.nace_kaynagi as NaceKaynagi]}</>}
                  </p>
                )}

                {r.gerekce && (
                  <p className="mt-2 max-w-[78ch] text-[13px] leading-[1.5] text-pretty text-ink-soft">{r.gerekce}</p>
                )}

                {r.puanlar ? (
                  <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-t-hairline-soft pt-2.5">
                    {KRITERLER.map((kr) => (
                      <div key={kr} className="flex items-baseline gap-1.5">
                        <dt className="text-[11.5px] text-ink-mute">{KRITER_ETIKET[kr]}</dt>
                        <dd className="num text-[12.5px] font-medium">{r.puanlar?.[kr] ?? "—"}</dd>
                      </div>
                    ))}
                    {r.model_snapshot && (
                      <div className="num w-full font-mono text-[9.5px] tracking-[.06em] text-ink-mute">
                        {r.model_snapshot} · {r.prompt_surum}
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="tex-absent mt-2.5 border-l-[3px] [border-left-style:dotted] border-l-absent px-3 py-2 text-[12.5px] leading-[1.5] text-ink-soft">
                    Bu kayıt henüz değerlendirilmedi; kriter puanı ve belge dayanağı yok. Sıfır değil, ölçülmemiş.
                  </p>
                )}
              </article>
            ))}
          </details>
        );
      })}
    </div>
  );
}

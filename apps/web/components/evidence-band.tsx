import { cn } from "@/lib/utils.ts";

/**
 * §3 — Kanıt Bandı. Ürünün imza öğesi ve tüm kod tabanında tek bileşen.
 *
 * Kural: stratejik puanın YANINDA durur, içine girmez; halkaya/donut'a
 * dönüştürülmez (§1.1). Dolu hücre sayısı = round(value/100 * cells).
 */

export type BandDurum = "verified" | "unverified" | "absent";

const BOY = {
  /** tablo satırı — ilk dört */
  tablo: "h-[15px] w-[11px] border-[#9AA1AB]",
  /** tablo satırı — 5+ (düşük kontrast) */
  tabloSonik: "h-[13px] w-[11px] border-[#AEB4BC]",
  /** öneri ekranı ilerleme çubuğu */
  oneri: "h-6 w-5 border-[#9AA1AB]",
  /** koyu blok */
  koyu: "h-[18px] w-[14px] border-[#6E757F]",
  /** yan panel — 12 hücreli, satırı doldurur */
  panel: "h-[9px] flex-1 border-hairline",
} as const;

type Props = {
  value: number;
  state: BandDurum;
  cells?: number;
  size?: keyof typeof BOY;
  /** bandın yanındaki mono `82/100`. Değeri çağıran kendi düzeninde
   *  yazıyorsa (yan panel) kapatılır — §3 kuralı yine sağlanır. */
  sessiz?: boolean;
  /** bandın altındaki durum etiketi: `eşiği geçti` / `eşik altı` */
  durum?: string;
  durumSinifi?: string;
  className?: string;
};

export function EvidenceBand({
  value,
  state,
  cells = 5,
  size = "tablo",
  sessiz = false,
  durum,
  durumSinifi,
  className,
}: Props) {
  const dolu = Math.round((value / 100) * cells);
  const doluSinif = state === "unverified" ? "cell-hatch" : "cell-solid";
  const bosSinif = state === "absent" ? "cell-void" : "cell-empty";

  return (
    <div className={className}>
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: cells }, (_, i) => (
          <div key={i} className={cn("border", BOY[size], i < dolu ? doluSinif : bosSinif)} />
        ))}
        {!sessiz && (
          <span className="num ml-1.5 text-[11px] text-ink-soft">
            {value}/100
          </span>
        )}
      </div>
      {durum && (
        <div className={cn("mt-1 font-mono text-[9.5px] uppercase tracking-[.08em]", durumSinifi)}>
          {durum}
        </div>
      )}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";
import type { EpistemikDurum as EpDurum } from "@ykh/domain";

/**
 * §4 — Epistemik gramer. Üç durum, her yerde birebir aynı.
 *
 * §1.2: renk tek başına taşıyıcı olamaz. Kenar karakteri (solid/dashed/dotted)
 * + doku + işaret + metin etiketi birlikte çalışır; siyah-beyaz çıktıda ve
 * renk körlüğünde ayırt edilebilir kalır.
 */

export const EP = {
  onay: {
    etiket: "Uzman onaylı kanıt",
    isaret: "■",
    kural: "puanlamaya girer",
    metin: "#1D5B4A",
    kenar: "border-l-[3px] [border-left-style:solid] border-l-verified",
    doku: "bg-surface",
    yazi: "text-verified",
  },
  ai: {
    etiket: "AI bulgusu · doğrulanmadı",
    isaret: "◌",
    kural: "puana girmez",
    metin: "#8A6A1F",
    kenar: "border-l-[3px] [border-left-style:dashed] border-l-unverif",
    doku: "tex-unverified",
    yazi: "text-unverif",
  },
  yok: {
    etiket: "Kanıt yok / yetersiz",
    isaret: "—",
    kural: "slot dolduramaz",
    metin: "#6B6259",
    kenar: "border-l-[3px] [border-left-style:dotted] border-l-absent",
    doku: "tex-absent",
    yazi: "text-absent",
  },
} as const satisfies Record<EpDurum, unknown>;

type Props = {
  state: EpDurum;
  children: ReactNode;
  /** doku zemini bastır — satır zemini kendi düzenini taşıyorsa */
  dokusuz?: boolean;
  className?: string;
};

export function EpistemicFrame({ state, children, dokusuz = false, className }: Props) {
  const ep = EP[state];
  return <div className={cn(ep.kenar, dokusuz ? undefined : ep.doku, className)}>{children}</div>;
}

/** İşaret + etiket ikilisi. Çerçeveden ayrı da kullanılır (tablo hücresi, künye). */
export function EpistemicEtiket({ state, className }: { state: EpDurum; className?: string }) {
  const ep = EP[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono", ep.yazi, className)}>
      <span aria-hidden>{ep.isaret}</span>
      <span>{ep.etiket}</span>
    </span>
  );
}

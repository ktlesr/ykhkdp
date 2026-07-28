import Link from "next/link";
import { EvidenceBand } from "./evidence-band.tsx";
import { EP, EpistemicFrame } from "./epistemic-frame.tsx";
import { Badge } from "./ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import type { BosSatir, DoluSatir, Sonuc } from "@ykh/domain";

const IZGARA = "grid grid-cols-[52px_1fr_96px_92px_128px_150px] items-center";

/** Brief §2 sonuç etiketleri — işaret + renk + açıklama. */
const SONUC: Record<Sonuc, { isaret: string; sinif: string; alt: string }> = {
  korunuyor: { isaret: "■", sinif: "border-verified-line bg-verified-tint text-verified", alt: "Geçen dönemden devam" },
  ekleniyor: { isaret: "▲", sinif: "border-navy-line bg-navy-tint text-navy", alt: "Listeye yeni giriyor" },
  koşullu: { isaret: "◌", sinif: "border-unverif-line bg-unverif-tint text-unverif", alt: "Kanıt eşiği altında" },
  çıkıyor: { isaret: "▼", sinif: "border-conflict-line bg-conflict-tint text-conflict", alt: "Listeden düşüyor" },
  yedek: { isaret: "·", sinif: "border-hairline bg-absent-tint text-ink-mute", alt: "Sıra dışı" },
};

type Props = {
  satir: DoluSatir;
  pay: number;
  esik: number;
  href: string;
  /** 5+ satırlar düşük kontrast (§5.8) */
  sonik?: boolean;
};

export function KararSatiri({ satir, pay, esik, href, sonik = false }: Props) {
  const ep = EP[satir.ep];
  const sonuc = SONUC[satir.sonuc];
  const yeterli = satir.kanit >= esik;
  const payNot = satir.koken === "mevcut" && pay > 0 ? `${satir.taban} +${pay}` : "pay yok";
  const altMetin = satir.sonuc === "ekleniyor" && satir.esikDevri ? "Eşik devri ile girdi" : sonuc.alt;

  return (
    <EpistemicFrame
      state={satir.ep}
      dokusuz
      className={cn("border-b border-b-[#E9E5DB]", sonik ? "bg-[#FDFCFA]" : "bg-surface")}
    >
      <Link
        href={href}
        className={cn(IZGARA, "hover:bg-paper", sonik ? "px-[22px] py-[13px]" : "px-[22px] py-[15px]")}
      >
        <div className={cn("num font-display", sonik ? "text-[19px] text-ink-mute" : "text-[22px] text-ink")}>
          {satir.sira}
        </div>

        <div className="pr-5">
          <div
            className={cn(
              "font-medium leading-[1.32] text-pretty",
              sonik ? "text-[13.5px] text-ink-soft" : "text-[14.5px] text-ink",
            )}
          >
            {satir.ad}
          </div>
          <div
            className={cn(
              "flex gap-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute",
              sonik ? "mt-1" : "mt-[5px]",
            )}
          >
            <span>{satir.nace}</span>
            <span className="text-hairline" aria-hidden>
              ·
            </span>
            <span className={ep.yazi}>
              <span aria-hidden>{ep.isaret}</span> {ep.etiket}
            </span>
          </div>
        </div>

        <div>
          <Badge
            variant="durum"
            className={
              satir.koken === "mevcut"
                ? "border-navy-line bg-navy-tint text-navy"
                : "border-hairline bg-surface text-ink-mute"
            }
          >
            {satir.koken}
          </Badge>
        </div>

        <div className="pr-[18px] text-right">
          <span className={cn("num", sonik ? "text-[17px] text-ink-soft" : "text-[19px]")}>{satir.puan}</span>
          <div className="num text-[9.5px] text-ink-mute">{payNot}</div>
        </div>

        <EvidenceBand
          value={satir.kanit}
          state={satir.ep === "onay" ? "verified" : satir.ep === "ai" ? "unverified" : "absent"}
          size={sonik ? "tabloSonik" : "tablo"}
          durum={yeterli ? "eşiği geçti" : "eşik altı"}
          durumSinifi={yeterli ? "text-verified" : "text-unverif"}
        />

        <div>
          <Badge variant="durum" boy="md" className={sonuc.sinif}>
            <span className="text-[11px]" aria-hidden>
              {sonuc.isaret}
            </span>
            {satir.sonuc}
          </Badge>
          <div className={cn("text-[11px] text-ink-mute", sonik ? "mt-1" : "mt-[5px]")}>{altMetin}</div>
        </div>
      </Link>
    </EpistemicFrame>
  );
}

/**
 * §1.5 — boş slot bir hata değil. Tam satır yüksekliğinde, dokulu, gerekçeli,
 * eylem çağrılı. Bu ekranın en önemli anı.
 */
export function BosSlotSatiri({ satir }: { satir: BosSatir }) {
  return (
    <EpistemicFrame
      state="yok"
      dokusuz
      className="tex-slot grid grid-cols-[52px_1fr] items-start border-b border-b-[#E9E5DB] px-[22px] py-[18px]"
    >
      <div className="num font-display text-[22px] text-absent">{satir.sira}</div>
      <div>
        <div className="flex items-center gap-2.5">
          <span className="border border-absent bg-surface px-2 py-1 font-mono text-[11px] uppercase tracking-[.12em] text-[#4A443D]">
            Slot boş
          </span>
          <span className="text-[14.5px] font-medium text-ink-soft">Bu slot için yeterli kanıtlı aday yok.</span>
        </div>
        <div className="mt-2 max-w-[80ch] text-[13px] text-ink-soft text-pretty">{satir.gerekce}</div>
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            className="border border-ink bg-ink px-[11px] py-[7px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper"
          >
            Kanıt talebi aç
          </button>
          <button
            type="button"
            className="border border-hairline px-[11px] py-[7px] font-mono text-[10.5px] uppercase tracking-[.1em] text-ink"
          >
            Slotu boş bırakma gerekçesini yaz
          </button>
        </div>
      </div>
    </EpistemicFrame>
  );
}

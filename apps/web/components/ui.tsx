import type { ReactNode } from "react";
import Link from "next/link";
import { ROL_ETIKET, type Rol } from "@ykh/domain";
import { cikisEylemi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Ortak arayüz parçaları. Tek dosya — her biri bir kez tanımlı, her yerde aynı.
 * §1.8: gradyan, gölge, cam efekti, emoji, border-radius > 3px yok.
 */

export const ETIKET = "font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-mute";
export const GIRDI = "min-h-11 w-full border border-hairline bg-[#FDFCFA] px-3 py-[11px] text-[14px] text-ink";
export const ALAN_ETIKET = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute";

export function UstBar({
  kullanici,
  nav = [],
}: {
  kullanici?: { adSoyad: string | null; rol: Rol } | null;
  nav?: Array<{ ad: string; yol: string; aktif?: boolean }>;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-b-black bg-ink text-[#EDE9E0]">
      <div className="mx-auto flex h-[52px] max-w-[1180px] items-center gap-7 px-6">
        <Link href="/" className="flex items-baseline gap-2.5 border-0 text-[#EDE9E0]">
          <span className="font-display text-[17px] font-medium tracking-[.01em]">YKH</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[.14em] text-[#8E959F]">
            Yatırım konusu önerileri
          </span>
        </Link>

        {nav.length > 0 && (
          <nav className="ml-2 flex gap-5 font-mono text-[11px] uppercase tracking-[.1em]">
            {nav.map((n) => (
              <Link
                key={n.yol}
                href={n.yol}
                className={n.aktif ? "border-b border-b-[#454C56] text-[#EDE9E0]" : "border-b border-b-transparent text-[#8E959F]"}
              >
                {n.ad}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3 font-mono text-[10.5px] tracking-[.1em] text-[#8E959F]">
          {kullanici ? (
            <>
              <span>
                {kullanici.adSoyad} · {ROL_ETIKET[kullanici.rol]}
              </span>
              <form action={cikisEylemi}>
                <button type="submit" className="cursor-pointer border border-[#333A43] px-2 py-1 uppercase text-[#8E959F]">
                  Çıkış
                </button>
              </form>
            </>
          ) : (
            <Link href="/giris" className="border border-[#333A43] px-2 py-1 uppercase text-[#8E959F]">
              Giriş
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sayfa({ children, genis = false }: { children: ReactNode; genis?: boolean }) {
  return <section className={cn("mx-auto px-6 pb-16", genis ? "max-w-[1180px]" : "max-w-[720px]")}>{children}</section>;
}

export function Baslik({ ustEtiket, children, alt }: { ustEtiket?: string; children: ReactNode; alt?: ReactNode }) {
  return (
    <div className="border-b-2 border-b-ink pt-8 pb-4">
      {ustEtiket && <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">{ustEtiket}</div>}
      <h1 className="font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">{children}</h1>
      {alt && <p className="mt-2.5 max-w-[70ch] text-[14px] text-ink-soft text-pretty">{alt}</p>}
    </div>
  );
}

/** Boş / bilgi durumu — §10: eyleme davet eder, yalnız bir çizgi değil. */
export function Bos({ baslik, children }: { baslik: string; children?: ReactNode }) {
  return (
    <div className="tex-absent mt-5 border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-4">
      <div className="text-[14.5px] font-medium text-ink">{baslik}</div>
      {children && <div className="mt-1.5 max-w-[70ch] text-[13px] text-ink-soft">{children}</div>}
    </div>
  );
}

export function Uyari({ tur = "amber", children }: { tur?: "amber" | "yesil" | "kirmizi"; children: ReactNode }) {
  const stil = {
    amber: "border-unverif-line border-l-unverif bg-unverif-tint",
    yesil: "border-verified-line border-l-verified bg-verified-tint",
    kirmizi: "border-conflict-line border-l-conflict bg-conflict-tint",
  }[tur];
  return (
    <div className={cn("mt-4 border border-l-[3px] px-4 py-3 text-[13px] leading-[1.5] text-ink-soft", stil)}>
      {children}
    </div>
  );
}

const ROZET_STIL = {
  notr: "border-hairline bg-paper text-ink-mute",
  yesil: "border-verified-line bg-verified-tint text-verified",
  amber: "border-unverif-line bg-unverif-tint text-unverif",
  kirmizi: "border-conflict-line bg-conflict-tint text-conflict",
  gri: "border-hairline bg-absent-tint text-absent",
} as const;

export function Rozet({
  tur = "notr",
  isaret,
  children,
}: {
  tur?: keyof typeof ROZET_STIL;
  isaret?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 border px-[9px] py-[5px] font-mono text-[10px] uppercase tracking-[.09em]",
        ROZET_STIL[tur],
      )}
    >
      {isaret && <span aria-hidden>{isaret}</span>}
      {children}
    </span>
  );
}

export function Dugme({
  varyant = "dolu",
  children,
  ...rest
}: React.ComponentProps<"button"> & { varyant?: "dolu" | "cizgi" | "amber" | "kirmizi" }) {
  const stil = {
    dolu: "border-ink bg-ink text-paper",
    cizgi: "border-hairline bg-transparent text-ink",
    amber: "border-unverif-line bg-unverif-tint text-[#5F4A15]",
    kirmizi: "border-conflict-line bg-conflict-tint text-conflict",
  }[varyant];
  return (
    <button
      {...rest}
      className={cn(
        "min-h-11 cursor-pointer border px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em]",
        stil,
        rest.className,
      )}
    >
      {children}
    </button>
  );
}

export function Bag({
  varyant = "cizgi",
  href,
  children,
}: {
  varyant?: "dolu" | "cizgi";
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center border px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em]",
        varyant === "dolu" ? "border-ink bg-ink text-paper" : "border-hairline text-ink",
      )}
    >
      {children}
    </Link>
  );
}

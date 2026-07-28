import Link from "next/link";
import { ROL_ETIKET, type Rol } from "@ykh/domain";
import { cikisEylemi } from "@/lib/eylem.ts";

/** §5 — 52px sabit koyu bar. Sürüm damgası ve kilit durumu her ekranda görünür (§1.7). */
export function UstBar({
  surum,
  kilitli = false,
  kullanici,
  nav = [],
}: {
  surum?: string;
  kilitli?: boolean;
  kullanici?: { adSoyad: string | null; rol: Rol } | null;
  nav?: Array<{ ad: string; yol: string; aktif?: boolean }>;
}) {
  return (
    <div className="sticky top-0 z-40 border-b border-b-black bg-ink text-[#EDE9E0]">
      <div className="mx-auto flex h-[52px] max-w-[1440px] items-center gap-7 px-7">
        <Link href="/" className="flex items-baseline gap-2.5 border-0 text-[#EDE9E0]">
          <span className="font-display text-[17px] font-medium tracking-[.01em]">YKH-KDP</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[.14em] text-[#8E959F]">
            Karar Destek Platformu
          </span>
        </Link>

        {nav.length > 0 && (
          <nav className="ml-2 flex gap-[22px] font-mono text-[11px] uppercase tracking-[.1em]">
            {nav.map((n) => (
              <Link
                key={n.yol}
                href={n.yol}
                className={
                  n.aktif
                    ? "border-b border-b-[#454C56] text-[#EDE9E0]"
                    : "border-b border-b-transparent text-[#8E959F]"
                }
              >
                {n.ad}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3.5 font-mono text-[10.5px] uppercase tracking-[.1em] text-[#8E959F]">
          {surum && <span className="border border-[#333A43] px-2 py-1">SÜRÜM {surum}</span>}
          {surum && <span>{kilitli ? "KİLİTLİ · SALT OKUNUR" : "TASLAK · KİLİTLENMEDİ"}</span>}
          {kullanici ? (
            <>
              <span className="border-l border-l-[#333A43] pl-3.5 normal-case tracking-normal">
                {kullanici.adSoyad} · {ROL_ETIKET[kullanici.rol]}
              </span>
              <form action={cikisEylemi}>
                <button type="submit" className="cursor-pointer border border-[#333A43] px-2 py-1 text-[#8E959F]">
                  Çıkış
                </button>
              </form>
            </>
          ) : (
            <Link href="/giris" className="border border-[#333A43] px-2 py-1 text-[#8E959F]">
              Giriş
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

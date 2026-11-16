import type { ReactNode } from "react";
import Link from "next/link";
import { ROL_ETIKET, type Rol } from "@ykh/domain";
import { cikisEylemi } from "@/lib/eylem.ts";
import { cn } from "@/lib/utils.ts";

/**
 * Ortak arayüz parçaları — "değerlendirme raporu" dünyası (2026-11).
 *
 * Bir kalkınma ajansı uzmanının günlerce açık tuttuğu bir rapor: soğuk beyaz
 * kâğıt, ince çizgi, tablo disiplini, tek aksan (kobalt = eylem ve seçili
 * durum). §1.8 aynen: gradyan, gölge, cam efekti, emoji, yarıçap > 3px yok.
 * Epistemik gramer (3px sol kenar + doku + işaret + metin) yalnızca
 * doğrulama durumu taşıyan yerde; dekoratif sol şerit yok.
 */

/** Alan adı / küçük başlık. Eski büyük harfli mono etiketin yerine. */
export const ETIKET = "etiket text-ink-mute";
export const GIRDI =
  "min-h-11 w-full rounded-[2px] border border-hairline bg-alan px-3 py-[10px] text-[14.5px] text-ink " +
  "transition-colors placeholder:text-ink-mute hover:border-ink-mute focus:border-navy focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-navy/25";
export const ALAN_ETIKET = "etiket mb-1.5 block text-ink-soft";

/* ── İşaretler ───────────────────────────────────────────────────────────
   Çizilmiş SVG, tek çizgi kalınlığı (1.5). Epistemik işaretler (■ ◌ —)
   handoff §4'ün metin glifleridir ve ayrıdır; bunlar arayüz işaretleri. */

type IsaretAdi = "bilgi" | "uyari" | "hata" | "tamam" | "ok" | "cikis" | "giris";

export function Isaret({ ad, className }: { ad: IsaretAdi; className?: string }) {
  const yol: Record<IsaretAdi, ReactNode> = {
    bilgi: (
      <>
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="M10 9v5M10 6.2v.1" />
      </>
    ),
    uyari: (
      <>
        <path d="M10 3.2 17.4 16H2.6L10 3.2Z" />
        <path d="M10 8.2v3.6M10 13.9v.1" />
      </>
    ),
    hata: (
      <>
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="m7 7 6 6M13 7l-6 6" />
      </>
    ),
    tamam: (
      <>
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="m6.6 10.2 2.3 2.3 4.6-4.9" />
      </>
    ),
    ok: <path d="M4 10h11m-4-4 4 4-4 4" />,
    cikis: (
      <>
        <path d="M8 4H4v12h4" />
        <path d="M12 6.5 15.5 10 12 13.5M15.5 10H8" />
      </>
    ),
    giris: (
      <>
        <path d="M12 4h4v12h-4" />
        <path d="M8 6.5 11.5 10 8 13.5M11.5 10H4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
    >
      {yol[ad]}
    </svg>
  );
}

/** Kurumsal işaret: rapor sayfası çerçevesi + bir bağlanmış satır. */
function Amblem() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0">
      <rect x="1" y="1" width="22" height="22" rx="2" className="fill-navy" />
      <path d="M6.5 7.5h11M6.5 12h6.5M6.5 16.5h8.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="15.5" y="10.5" width="3" height="3" fill="#fff" />
    </svg>
  );
}

export function UstBar({
  kullanici,
  nav = [],
}: {
  kullanici?: { adSoyad: string | null; rol: Rol } | null;
  nav?: Array<{ ad: string; yol: string; aktif?: boolean }>;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-b-hairline bg-surface">
      {/* Dar ekranda gezinme ikinci satıra iner: gizli kaydırma şeridine
          sıkıştırılınca "Ayarlar" görünmez ve ulaşılmaz oluyordu. */}
      <div className="mx-auto flex h-[60px] max-w-[1180px] items-center gap-6 px-6 max-[720px]:h-auto max-[720px]:flex-wrap max-[720px]:gap-x-3 max-[720px]:gap-y-0 max-[720px]:px-4">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 text-ink max-[720px]:min-h-[52px]">
          <Amblem />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-[-.01em]">YKH</span>
            <span className="mt-[3px] text-[11.5px] text-ink-mute max-[560px]:hidden">Yatırım konusu önerileri</span>
          </span>
        </Link>

        {nav.length > 0 && (
          <nav aria-label="Ana gezinme" className="flex h-full min-w-0 items-stretch gap-1 max-[720px]:order-last max-[720px]:-mx-1 max-[720px]:h-auto max-[720px]:min-h-11 max-[720px]:basis-full max-[720px]:flex-wrap max-[720px]:gap-0 max-[720px]:border-t max-[720px]:border-t-hairline-soft">
            {nav.map((n) => (
              <Link
                key={n.yol}
                href={n.yol}
                aria-current={n.aktif ? "page" : undefined}
                className={cn(
                  "etiket-l relative flex shrink-0 items-center px-3 transition-colors",
                  n.aktif
                    ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-navy"
                    : "text-ink-mute hover:text-ink",
                )}
              >
                {n.ad}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {kullanici ? (
            <>
              <span className="flex flex-col items-end leading-tight max-[720px]:hidden">
                <span className="text-[13px] font-medium text-ink">{kullanici.adSoyad ?? "Misafir"}</span>
                <span className="text-[11.5px] text-ink-mute">{ROL_ETIKET[kullanici.rol]}</span>
              </span>
              <form action={cikisEylemi}>
                <button
                  type="submit"
                  className="etiket inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[2px] px-2.5 text-ink-soft transition-colors hover:bg-page hover:text-ink"
                >
                  <Isaret ad="cikis" />
                  Çıkış
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/giris"
              className="etiket inline-flex min-h-11 items-center gap-1.5 rounded-[2px] px-2.5 text-ink-soft transition-colors hover:bg-page hover:text-ink"
            >
              <Isaret ad="giris" />
              Giriş
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Sayfa({ children, genis = false }: { children: ReactNode; genis?: boolean }) {
  return (
    <main className={cn("mx-auto px-6 pb-20 max-[720px]:px-4", genis ? "max-w-[1180px]" : "max-w-[760px]")}>
      {children}
    </main>
  );
}

/**
 * Sayfa başlığı. Başlık kendi ağırlığını taşır; üstünde etiket yok.
 * `ustEtiket` (bağlam: il, dönem, rol) başlığın ALTINDA künye satırı olur.
 */
export function Baslik({ ustEtiket, children, alt }: { ustEtiket?: string; children: ReactNode; alt?: ReactNode }) {
  return (
    <div className="border-b border-b-hairline pt-10 pb-6 max-[720px]:pt-7">
      <h1 className="font-display text-[34px] leading-[1.08] font-semibold tracking-[-.022em] text-ink max-[720px]:text-[27px]">
        {children}
      </h1>
      {ustEtiket && <div className="etiket mt-2.5 text-ink-mute">{ustEtiket}</div>}
      {alt && <p className="mt-3 max-w-[68ch] text-[15px] leading-[1.55] text-ink-soft text-pretty">{alt}</p>}
    </div>
  );
}

/** Boş / bilgi durumu — eyleme davet eder. "Dayanak yok" grameri: noktalı kenar + doku + —. */
export function Bos({ baslik, children }: { baslik: string; children?: ReactNode }) {
  return (
    <div className="tex-absent mt-5 border border-hairline-soft border-l-[3px] [border-left-style:dotted] border-l-absent px-5 py-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="num mt-px text-[13px] text-absent">
          —
        </span>
        <div>
          <div className="text-[15px] font-semibold text-ink">{baslik}</div>
          {children && <div className="mt-1.5 max-w-[68ch] text-[13.5px] leading-[1.55] text-ink-soft">{children}</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * Rapor notu. İlkel renkli kutu değil: işaret + (başlık) + açıklama.
 * Tür epistemik grameri izler — doğrulanmadı kesikli, çelişki/hata düz kenar.
 */
const NOT_STIL = {
  amber: { kutu: "tex-unverified border-unverif-line border-l-unverif [border-left-style:dashed]", renk: "text-unverif", isaret: "uyari" },
  yesil: { kutu: "bg-verified-tint border-verified-line border-l-verified", renk: "text-verified", isaret: "tamam" },
  kirmizi: { kutu: "bg-conflict-tint border-conflict-line border-l-conflict", renk: "text-conflict", isaret: "hata" },
} as const;

export function Uyari({
  tur = "amber",
  baslik,
  children,
  className,
}: {
  tur?: keyof typeof NOT_STIL;
  baslik?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const s = NOT_STIL[tur];
  return (
    <div
      role={tur === "kirmizi" ? "alert" : undefined}
      className={cn("mt-4 flex gap-3 border border-l-[3px] px-4 py-3.5", s.kutu, className)}
    >
      <Isaret ad={s.isaret} className={cn("mt-[2px]", s.renk)} />
      <div className="min-w-0 text-[13.5px] leading-[1.55] text-ink-soft">
        {baslik && <div className="mb-0.5 text-[14px] font-semibold text-ink">{baslik}</div>}
        {children}
      </div>
    </div>
  );
}

const ROZET_STIL = {
  notr: "border-hairline bg-surface text-ink-soft",
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
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-[2px] border px-2 py-[3px] text-[12px] leading-[1.35] font-medium",
        ROZET_STIL[tur],
      )}
    >
      {isaret && (
        <span aria-hidden className="num text-[11px]">
          {isaret}
        </span>
      )}
      {children}
    </span>
  );
}

/** Düğme stilleri — `Gonder` ve `Dugme` aynı tabloyu kullanır. */
export const DUGME_STIL = {
  dolu: "border-navy bg-navy text-white hover:bg-[color-mix(in_oklab,var(--color-navy)_86%,black)]",
  cizgi: "border-hairline bg-surface text-ink hover:border-ink-mute hover:bg-paper",
  amber: "border-unverif-line bg-unverif-tint text-[#5F4A15] hover:border-unverif",
  kirmizi: "border-conflict-line bg-surface text-conflict hover:bg-conflict-tint",
} as const;
export const DUGME_TABAN =
  "etiket-l inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[2px] border px-4 py-[9px] " +
  "transition-[background-color,border-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-55";

export function Dugme({
  varyant = "dolu",
  children,
  ...rest
}: React.ComponentProps<"button"> & { varyant?: keyof typeof DUGME_STIL }) {
  return (
    <button {...rest} className={cn(DUGME_TABAN, DUGME_STIL[varyant], rest.className)}>
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
    <Link href={href} className={cn(DUGME_TABAN, DUGME_STIL[varyant])}>
      {children}
      {varyant === "dolu" && <Isaret ad="ok" className="size-[15px]" />}
    </Link>
  );
}

/**
 * Giriş / kayıt düzeni: solda raporun kapağı (ürünün dört kapısı, gerçek
 * metin), sağda form. Dar ekranda kapak kısalır, form öne geçer.
 */
const KAPILAR = [
  ["Öneri", "Yatırımcı konuyu ve “neden burada?” gerekçesini yazar."],
  ["Taslak puan", "Yapay zekâ sekiz kriteri plan belgelerine birebir alıntıyla bağlar."],
  ["Ajans onayı", "Uzman puanı inceler; onaylar, düzeltir ya da reddeder."],
  ["İl sıralaması", "Yalnızca onaylanan ve belgeye dayanan öneri slot doldurur."],
] as const;

export function KimlikSayfasi({ baslik, alt, children }: { baslik: string; alt: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-16 px-6 pt-14 pb-20 max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[900px]:pt-8 max-[720px]:px-4">
      <section className="max-[900px]:order-2">
        <h1 className="max-w-[16ch] font-display text-[40px] leading-[1.05] font-semibold tracking-[-.025em] text-ink max-[720px]:text-[30px]">
          {baslik}
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15.5px] leading-[1.6] text-ink-soft">{alt}</p>
        <ol className="mt-10 border-t border-t-hairline max-[900px]:mt-6">
          {KAPILAR.map(([ad, metin], i) => (
            <li key={ad} className="grid grid-cols-[40px_160px_minmax(0,1fr)] items-baseline gap-3 border-b border-b-hairline-soft py-3.5 max-[560px]:grid-cols-[32px_minmax(0,1fr)]">
              <span className="num text-[12px] text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[14.5px] font-semibold text-ink">{ad}</span>
              <span className="text-[13.5px] leading-[1.5] text-ink-soft max-[560px]:col-start-2">{metin}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="max-[900px]:order-1">{children}</section>
    </main>
  );
}

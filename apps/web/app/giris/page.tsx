import Link from "next/link";
import { redirect } from "next/navigation";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { UstBar } from "@/components/ui.tsx";
import { girisEylemi } from "@/lib/eylem.ts";
import { kullanici } from "@/lib/oturum.ts";
import { DEMO_HESAPLAR, DEMO_PAROLA } from "@ykh/database/seed";

const ETIKET = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute";
const GIRDI =
  "min-h-11 w-full border border-hairline bg-alan px-3 py-[11px] text-[14px] text-ink";

export default async function Giris({ searchParams }: { searchParams: Promise<{ hedef?: string }> }) {
  if (await kullanici()) redirect("/oneri");
  const { hedef } = await searchParams;

  return (
    <>
      <UstBar />
      <section className="mx-auto max-w-[420px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">Hesap</div>
          <h1 className="font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">Giriş yap</h1>
        </div>

        <EylemFormu eylem={girisEylemi} className="mt-6 border border-hairline bg-surface p-5">
          <input type="hidden" name="hedef" value={hedef ?? "/"} />
          <label className={ETIKET} htmlFor="eposta">
            E-posta
          </label>
          <input id="eposta" name="eposta" type="email" autoComplete="email" required className={GIRDI} />

          <label className={`${ETIKET} mt-4`} htmlFor="parola">
            Parola
          </label>
          <input
            id="parola"
            name="parola"
            type="password"
            autoComplete="current-password"
            required
            className={GIRDI}
          />

          <div className="mt-5">
            <Gonder className="w-full">Giriş yap</Gonder>
          </div>
        </EylemFormu>

        <p className="mt-4 text-[13px] text-ink-soft">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="border-b border-b-navy/35">
            Kayıt olun
          </Link>
          . Öneri vermek için e-posta doğrulamalı bir hesap yeterli; kurum kaydı istenmez.
        </p>

        <div className="mt-6 border border-hairline-soft bg-paper p-3.5">
          <div className="font-mono text-[9.5px] uppercase tracking-[.12em] text-ink-mute">
            Geliştirme ortamı demo hesapları
          </div>
          <ul className="mt-2 space-y-1 font-mono text-[11.5px] text-ink-soft">
            {DEMO_HESAPLAR.map((h) => (
              <li key={h.eposta}>
                {h.eposta} · {h.etiket}
              </li>
            ))}
          </ul>
          <div className="mt-2 font-mono text-[11.5px] text-ink-soft">Parola: {DEMO_PAROLA}</div>
        </div>
      </section>
    </>
  );
}

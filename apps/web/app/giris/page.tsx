import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { ALAN_ETIKET, GIRDI, KimlikSayfasi, UstBar } from "@/components/ui.tsx";
import { girisEylemi } from "@/lib/eylem.ts";
import { kullanici } from "@/lib/oturum.ts";
import { DEMO_HESAPLAR, DEMO_PAROLA } from "@ykh/database/seed";

export const metadata: Metadata = {
  title: "Giriş",
  description: "YKH-KDP hesabınıza girin.",
  alternates: { canonical: "/giris" },
  openGraph: { title: "Giriş", description: "YKH-KDP hesabınıza girin.", url: "/giris" },
  // `card` burada TEKRAR yazılıyor: Next sayfa seviyesindeki `twitter`
  // nesnesini üsttekiyle birleştirmiyor, tamamen eziyor. Ölçüldü — kart
  // `summary_large_image` yerine `summary` çıkıyordu, yani görsel küçük
  // küçük bir kutuda görünüyordu.
  twitter: { card: "summary_large_image", title: "Giriş", description: "YKH-KDP hesabınıza girin." },
};

export default async function Giris({ searchParams }: { searchParams: Promise<{ hedef?: string }> }) {
  if (await kullanici()) redirect("/oneri");
  const { hedef } = await searchParams;

  return (
    <>
      <UstBar />
      <KimlikSayfasi
        baslik="Önerileri belgeye bağlanan bir sıralamaya dönüştürün."
        alt="Yerel Kalkınma Hamlesi için her ilin dört yatırım konusu hazırlanır. Her puan bir taslaktır; ajans onayı olmadan sıralamaya girmez."
      >
        <div className="border border-hairline bg-surface">
          <div className="border-b border-b-hairline-soft px-6 pt-6 pb-4">
            <h2 className="text-[22px] font-semibold tracking-[-.015em] text-ink">Giriş yap</h2>
            <p className="mt-1 text-[13.5px] text-ink-soft">Ajans, yönetici ve kayıtlı yatırımcı hesapları.</p>
          </div>
        <EylemFormu eylem={girisEylemi} className="px-6 pt-5 pb-6">
          <input type="hidden" name="hedef" value={hedef ?? "/"} />
          <label className={ALAN_ETIKET} htmlFor="eposta">
            E-posta
          </label>
          <input id="eposta" name="eposta" type="email" autoComplete="email" required className={GIRDI} />

          <label className={`${ALAN_ETIKET} mt-4`} htmlFor="parola">
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
            <Gonder className="w-full" bekleme="Giriş yapılıyor">Giriş yap</Gonder>
          </div>
        </EylemFormu>
        </div>

        <p className="mt-4 text-[13.5px] text-ink-soft">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="border-b border-b-navy/35">
            Kayıt olun
          </Link>
          . Öneri vermek için bir hesap yeterli; kurum kaydı istenmez.
        </p>

        {/* Demo hesaplar yalnızca geliştirmede: üretim kurucusu onları açmıyor
            ve parolayı üretim sayfasına basmak yanlış güven/erişim üretir. */}
        {process.env.NODE_ENV !== "production" && (
        <div className="mt-6 border border-hairline-soft bg-paper p-3.5">
          <div className="etiket text-ink-mute">
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
        )}
      </KimlikSayfasi>
    </>
  );
}

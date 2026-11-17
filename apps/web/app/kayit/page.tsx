import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { ALAN_ETIKET as ETIKET, GIRDI, KimlikSayfasi, UstBar } from "@/components/ui.tsx";
import { kayitEylemi } from "@/lib/eylem.ts";
import { kullanici } from "@/lib/oturum.ts";
import { acikSayfa } from "@/lib/site.ts";


export const metadata: Metadata = acikSayfa({
  baslik: "Hesap aç",
  aciklama: "YKH-KDP hesabı açın. Öneri vermek için kayıt zorunlu değildir; kurum kaydı ve kurum onayı istenmez.",
  yol: "/kayit",
});

export default async function Kayit() {
  // Misafir de hesap açabilir (yeni hesap; misafir önerileri taşınmaz).
  const k = await kullanici();
  if (k && !k.misafir) redirect("/oneri");

  return (
    <>
      <UstBar />
      <KimlikSayfasi
        baslik="Önerinizi verin; gerekçesi belgeyle sınansın."
        alt="Kişi olarak kaydolursunuz. Kurum kaydı, kurum doğrulama ve kurum onayı yoktur. Önerinizi kayıt olmadan da verebilirsiniz."
      >
        <div className="border border-hairline bg-surface">
          <div className="border-b border-b-hairline-soft px-6 pt-6 pb-4">
            <h2 className="text-[22px] font-semibold tracking-[-.015em] text-ink">Hesap aç</h2>
            <p className="mt-1 text-[13.5px] text-ink-soft">Önerilerinize her cihazdan ulaşırsınız.</p>
          </div>
        <EylemFormu eylem={kayitEylemi} className="px-6 pt-5 pb-6">
          <label className={ETIKET} htmlFor="adSoyad">
            Ad soyad
          </label>
          <input id="adSoyad" name="adSoyad" required minLength={3} className={GIRDI} autoComplete="name" />

          <label className={`${ETIKET} mt-4`} htmlFor="eposta">
            E-posta
          </label>
          <input id="eposta" name="eposta" type="email" required className={GIRDI} autoComplete="email" />

          <label className={`${ETIKET} mt-4`} htmlFor="parola">
            Parola · en az 10 karakter
          </label>
          <input
            id="parola"
            name="parola"
            type="password"
            required
            minLength={10}
            className={GIRDI}
            autoComplete="new-password"
          />

          <div className="mt-4 border border-hairline-soft bg-paper px-3.5 py-3">
            <div className="etiket text-ink-mute">
              Kişisel veri ve gizlilik
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
              Adınız kamuya açık yayımda <b>varsayılan olarak görünmez</b>. Silme talebinizde kimliğiniz silinir;
              önerileriniz ve karar zinciri takma anahtarla korunur.
            </p>
          </div>

          <div className="mt-5">
            <Gonder className="w-full" bekleme="Hesap açılıyor">Hesap oluştur</Gonder>
          </div>
        </EylemFormu>
        </div>

        <p className="mt-4 text-[13.5px] text-ink-soft">
          Hesabınız var mı?{" "}
          <Link href="/giris" className="border-b border-b-navy/35">
            Giriş yapın
          </Link>
          .
        </p>
      </KimlikSayfasi>
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { EylemFormu, Gonder } from "@/components/eylem-formu.tsx";
import { UstBar } from "@/components/ui.tsx";
import { kayitEylemi } from "@/lib/eylem.ts";
import { kullanici } from "@/lib/oturum.ts";

const ETIKET = "mb-1.5 block font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute";
const GIRDI = "min-h-11 w-full border border-hairline bg-alan px-3 py-[11px] text-[14px] text-ink";

export default async function Kayit() {
  if (await kullanici()) redirect("/oneri");

  return (
    <>
      <UstBar />
      <section className="mx-auto max-w-[420px] px-7 pb-18">
        <div className="border-b-2 border-b-ink pt-[34px] pb-[18px]">
          <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[.16em] text-ink-mute">Hesap</div>
          <h1 className="font-display text-[31px] leading-[1.1] font-medium tracking-[-.01em]">Kayıt ol</h1>
          <p className="mt-2.5 text-[13.5px] text-ink-soft">
            Kişi olarak kaydolursunuz. Kurum kaydı, kurum doğrulama ve kurum onayı yoktur.
          </p>
        </div>

        <EylemFormu eylem={kayitEylemi} className="mt-6 border border-hairline bg-surface p-5">
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
            <div className="font-mono text-[9.5px] uppercase tracking-[.12em] text-ink-mute">
              Kişisel veri ve gizlilik
            </div>
            <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
              Adınız kamuya açık yayımda <b>varsayılan olarak görünmez</b>. Silme talebinizde kimliğiniz silinir;
              önerileriniz ve karar zinciri takma anahtarla korunur.
            </p>
          </div>

          <div className="mt-5">
            <Gonder className="w-full">Hesap oluştur</Gonder>
          </div>
        </EylemFormu>

        <p className="mt-4 text-[13px] text-ink-soft">
          Hesabınız var mı?{" "}
          <Link href="/giris" className="border-b border-b-navy/35">
            Giriş yapın
          </Link>
          .
        </p>
      </section>
    </>
  );
}

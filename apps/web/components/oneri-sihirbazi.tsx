"use client";

import { useState, useTransition } from "react";
import type { Bolge } from "@ykh/database";
import { misafirEylemi } from "@/lib/eylem.ts";
import { OneriFormu } from "./oneri-formu.tsx";
import { Bag } from "./ui.tsx";

/**
 * Öneri sihirbazı — dört adım, tek ekran.
 *
 * kimlik → ajans bölgesi → il → öneri
 *
 * Adımlar istemcide yürüyor: coğrafya tek sorguda geldi, her seçimde sunucuya
 * dönmek gereksiz gecikme olurdu. Son adımda mevcut `OneriFormu` ve mevcut
 * `oneriEylemi` çalışıyor — gönderme yolu hiç değişmedi.
 *
 * Adım sayısı ekranı bölmek için değil, KARARI bölmek için: yatırımcı önce
 * nerede olduğuna, sonra ne önerdiğine odaklanıyor. Gerekçe alanı boş bir
 * sayfada değil, seçtiği ilin adının altında açılıyor.
 */

type Adim = "kimlik" | "bolge" | "il" | "oneri";

export function OneriSihirbazi({
  bolgeler,
  girisliMi,
  misafirMi,
  yerellikPayi,
  baslangicIl,
}: {
  bolgeler: Bolge[];
  girisliMi: boolean;
  misafirMi: boolean;
  yerellikPayi: number;
  baslangicIl?: string;
}) {
  // Tek bölge varsa o adımı sormanın anlamı yok; seçimi baştan yapıyoruz.
  const tekBolge = bolgeler.length === 1 ? bolgeler[0].ajans_kod : null;
  const baslangic = baslangicIl
    ? bolgeler.find((x) => x.iller.some((i) => i.kod === baslangicIl))
    : undefined;

  const [bolgeKod, setBolgeKod] = useState<string | null>(baslangic?.ajans_kod ?? tekBolge);
  const [ilKod, setIlKod] = useState<string | null>(baslangicIl ?? null);
  const [adim, setAdim] = useState<Adim>(
    !girisliMi ? "kimlik" : ilKod ? "oneri" : bolgeKod ? "il" : "bolge",
  );
  const [misafirHatasi, setMisafirHatasi] = useState<string | null>(null);
  // Misafir oturumu bu turda açıldıysa sunucudan gelen prop bunu bilmiyor.
  const [misafirOldu, setMisafirOldu] = useState(false);
  const [bekliyor, basla] = useTransition();

  const bolge = bolgeler.find((x) => x.ajans_kod === bolgeKod) ?? null;
  const il = bolge?.iller.find((x) => x.kod === ilKod) ?? null;

  const ADIMLAR: Array<{ id: Adim; ad: string }> = [
    { id: "kimlik", ad: "Kimlik" },
    { id: "bolge", ad: "Bölge" },
    { id: "il", ad: "İl" },
    { id: "oneri", ad: "Öneri" },
  ];
  const sirasi = (a: Adim) => ADIMLAR.findIndex((x) => x.id === a);

  /** Adıma geri dönüş — ileri seçimleri temizler, tutarsız durum kalmasın. */
  const geriDon = (hedef: Adim) => {
    if (hedef === "bolge") {
      setIlKod(null);
      if (!tekBolge) setBolgeKod(null);
    }
    if (hedef === "il") setIlKod(null);
    setAdim(hedef);
  };

  return (
    <div className="mt-6">
      <ol className="flex flex-wrap items-stretch border border-hairline bg-surface">
        {ADIMLAR.map((x, i) => {
          const gecmis = sirasi(adim) > i;
          const simdi = adim === x.id;
          const tiklanabilir = gecmis && !(x.id === "kimlik" && girisliMi);
          return (
            <li key={x.id} className="min-w-[25%] flex-1 border-r border-r-hairline-soft last:border-r-0">
              <button
                type="button"
                disabled={!tiklanabilir}
                onClick={() => geriDon(x.id)}
                aria-current={simdi ? "step" : undefined}
                className={[
                  "flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left",
                  simdi ? "bg-ink text-paper" : gecmis ? "bg-paper text-ink" : "bg-surface text-ink-mute",
                  tiklanabilir ? "cursor-pointer" : "cursor-default",
                ].join(" ")}
              >
                <span className="num text-[10px] opacity-70">{i + 1}</span>
                <span className="font-mono text-[10px] uppercase tracking-[.1em]">{x.ad}</span>
                {gecmis && (
                  <span aria-hidden className="ml-auto text-[11px]">
                    ■
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {/* ── 1. Kimlik ────────────────────────────────────────────────────── */}
      {adim === "kimlik" && (
        <section className="mt-4 border border-hairline bg-surface">
          <h2 className="border-b border-b-hairline-soft bg-paper px-5 py-3 text-[15px] font-medium">
            Nasıl devam etmek istersiniz?
          </h2>
          <div className="grid grid-cols-2 max-[560px]:grid-cols-1">
            <div className="border-r border-r-hairline-soft px-5 py-5 max-[560px]:border-r-0 max-[560px]:border-b max-[560px]:border-b-hairline-soft">
              <h3 className="text-[14px] font-medium">Kayıt olmadan devam et</h3>
              <p className="mt-2 max-w-[46ch] text-[13px] leading-[1.5] text-ink-soft">
                Ad, e-posta veya parola istenmez. Öneriniz kimliğinize değil takma bir anahtara bağlanır; bu
                tarayıcıdan takip edebilirsiniz.
              </p>
              <p className="mt-2 max-w-[46ch] text-[12.5px] leading-[1.45] text-ink-mute">
                Tarayıcı verisini silerseniz önerinize erişiminiz biter. Öneri listede kalır.
              </p>
              <button
                type="button"
                disabled={bekliyor}
                onClick={() =>
                  basla(async () => {
                    const s = await misafirEylemi();
                    if (!s.ok) {
                      setMisafirHatasi(s.mesaj);
                      return;
                    }
                    setMisafirOldu(true);
                    setAdim(bolgeKod ? "il" : "bolge");
                  })
                }
                className="mt-4 min-h-11 w-full cursor-pointer border border-ink bg-ink px-[13px] py-[9px] font-mono text-[10.5px] uppercase tracking-[.1em] text-paper disabled:opacity-60"
              >
                {bekliyor ? "Hazırlanıyor" : "Misafir olarak devam et"}
              </button>
              {misafirHatasi && (
                <p className="mt-2 text-[12.5px] text-conflict">{misafirHatasi}</p>
              )}
            </div>

            <div className="px-5 py-5">
              <h3 className="text-[14px] font-medium">Hesapla devam et</h3>
              <p className="mt-2 max-w-[46ch] text-[13px] leading-[1.5] text-ink-soft">
                E-posta ve parola ile girin. Önerilerinizi hangi cihazdan bakarsanız görürsünüz. Kurum kaydı ve kurum
                onayı istenmez.
              </p>
              <p className="mt-2 max-w-[46ch] text-[12.5px] leading-[1.45] text-ink-mute">
                Adınız kamuya açık listede görünmez. Silme talebinizde kimliğiniz silinir, öneriniz kalır.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Bag varyant="dolu" href="/giris?hedef=%2Foneri">
                  Giriş yap
                </Bag>
                <Bag href="/kayit">Hesap aç</Bag>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Ajans bölgesi ─────────────────────────────────────────────── */}
      {adim === "bolge" && (
        <section className="mt-4 border border-hairline bg-surface">
          <h2 className="border-b border-b-hairline-soft bg-paper px-5 py-3 text-[15px] font-medium">
            Hangi ajans bölgesi?
          </h2>
          {bolgeler.length === 0 ? (
            <p className="px-5 py-5 text-[13.5px] text-ink-soft">
              Açık dönemi olan bir bölge yok. Ajans bir dönem açtığında öneri kabulü başlar.
            </p>
          ) : (
            <ul>
              {bolgeler.map((x) => (
                <li key={x.ajans_kod} className="border-b border-b-hairline-soft last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBolgeKod(x.ajans_kod);
                      setAdim("il");
                    }}
                    className="flex min-h-11 w-full cursor-pointer items-baseline gap-3 px-5 py-4 text-left hover:bg-paper"
                  >
                    <span className="min-w-0 flex-1 text-[15px] font-medium">{x.ajans}</span>
                    <span className="num font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                      {x.ajans_kod} · {x.iller.length} il
                    </span>
                    <span aria-hidden className="text-[13px] text-ink-mute">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── 3. İl ────────────────────────────────────────────────────────── */}
      {adim === "il" && bolge && (
        <section className="mt-4 border border-hairline bg-surface">
          <h2 className="border-b border-b-hairline-soft bg-paper px-5 py-3 text-[15px] font-medium">
            {bolge.ajans} · hangi il?
          </h2>
          <ul>
            {bolge.iller.map((x) => (
              <li key={x.kod} className="border-b border-b-hairline-soft last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setIlKod(x.kod);
                    setAdim("oneri");
                  }}
                  className="flex min-h-11 w-full cursor-pointer items-baseline gap-3 px-5 py-4 text-left hover:bg-paper"
                >
                  <span className="min-w-0 flex-1 text-[15px] font-medium">{x.ad}</span>
                  <span className="num font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                    {x.yil} dönemi
                  </span>
                  <span aria-hidden className="text-[13px] text-ink-mute">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 4. Öneri ─────────────────────────────────────────────────────── */}
      {adim === "oneri" && bolge && il && (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 border border-hairline bg-paper px-4 py-3">
            <span className="font-mono text-[9.5px] uppercase tracking-[.13em] text-ink-mute">Seçilen</span>
            <span className="text-[14px] font-medium">
              {il.ad} · {bolge.ajans}
            </span>
            <span className="num font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
              {il.yil} dönemi
            </span>
            <button
              type="button"
              onClick={() => geriDon("il")}
              className="ml-auto min-h-11 cursor-pointer border-b border-b-navy/40 font-mono text-[10px] uppercase tracking-[.1em] text-ink"
            >
              Değiştir
            </button>
          </div>

          {(misafirMi || misafirOldu) && (
            <p className="mt-3 border border-hairline-soft bg-surface px-4 py-3 text-[12.5px] leading-[1.45] text-ink-soft">
              Misafir olarak devam ediyorsunuz. Öneriniz bu tarayıcıdan takip edilir; kalıcı erişim için sonradan{" "}
              <a href="/kayit" className="border-b border-b-navy/35">
                hesap açabilirsiniz
              </a>
              .
            </p>
          )}

          <OneriFormu il={il} yerellikPayi={yerellikPayi} />
        </>
      )}
    </div>
  );
}

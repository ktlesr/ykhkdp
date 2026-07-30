import Link from "next/link";
import { notFound } from "next/navigation";
import { adaylariGetir, donemGetir } from "@ykh/database";
import { onaylayabilir, type Sonuc } from "@ykh/domain";
import { ayardan, grupAgirligi, hesapla } from "@ykh/scoring";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar, Uyari } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { cn } from "@/lib/utils.ts";

/** İl sıralaması — ürünün cevabını verdiği ekran. */

const SONUC_ROZET: Record<Sonuc, { tur: "yesil" | "notr" | "kirmizi" | "amber" | "gri"; isaret: string }> = {
  korunuyor: { tur: "yesil", isaret: "■" },
  ekleniyor: { tur: "notr", isaret: "▲" },
  çıkıyor: { tur: "kirmizi", isaret: "▼" },
  yedek: { tur: "gri", isaret: "·" },
  dayanaksız: { tur: "amber", isaret: "◌" },
};

export default async function IlSiralamasi({ params }: { params: Promise<{ il: string }> }) {
  const { il } = await params;
  const b = await baglam();
  const k = await kullanici();

  const d = await donemGetir(b, il);
  if (!d) notFound();

  const adaylar = await adaylariGetir(b, d);
  const h = hesapla(adaylar, ayardan(d.set));
  const yerellik = Math.round(grupAgirligi(d.set.agirliklar, "yerellik") * 100);

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/" },
          { ad: d.il, yol: `/il/${il}`, aktif: true },
          { ad: "Öneri ver", yol: `/oneri?il=${il}` },
          ...(k && onaylayabilir(k.rol) ? [{ ad: "Onay", yol: "/onay" }] : []),
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket={`${d.ajans} · ${d.yil} dönemi`}
          alt={
            <>
              {d.set.slotSayisi} slot. Mevcut konular ve yeni öneriler aynı sekiz kriterle sıralanır; puanın en büyük
              payı (<b>%{yerellik}</b>) “neden burada?” sorusuna ait. Mevcut konulara{" "}
              <b className="num">+{h.pay}</b> devamlılık payı uygulanır — gizli katsayı yok, sürüm {d.set.surum}.
            </>
          }
        >
          {d.il} — yatırım konusu sıralaması
        </Baslik>

        {adaylar.length === 0 ? (
          <Bos baslik="Bu ilde henüz onaylanmış öneri yok.">
            Öneriler yapay zekâ değerlendirmesinden ve ajans onayından sonra burada listelenir.
            <div className="mt-3">
              <Bag varyant="dolu" href={`/oneri?il=${il}`}>
                İlk öneriyi ver
              </Bag>
            </div>
          </Bos>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-4 border border-hairline bg-surface max-[640px]:grid-cols-2">
              {[
                { e: "Korunuyor", v: h.ozet.korunuyor, r: "text-verified" },
                { e: "Ekleniyor", v: h.ozet.ekleniyor, r: "text-navy" },
                { e: "Çıkıyor", v: h.ozet.cikiyor, r: "text-conflict" },
                { e: "Boş slot", v: h.ozet.bosSlot, r: "text-absent" },
              ].map((o, i) => (
                <div key={o.e} className={cn("px-4 py-3.5", i < 3 && "border-r border-r-hairline-soft")}>
                  <div className="font-mono text-[9.5px] uppercase tracking-[.14em] text-ink-mute">{o.e}</div>
                  <div className={cn("num mt-1 text-[26px] leading-none", o.r)}>{o.v}</div>
                </div>
              ))}
            </div>

            {h.ucDurum && (
              <Uyari>
                <b className="font-semibold text-[#5F4A15]">Uç durum: {h.ucDurum.baslik}.</b> {h.ucDurum.metin}
              </Uyari>
            )}

            <div className="mt-5 border border-hairline bg-surface">
              <div className="grid grid-cols-[44px_1fr_86px_92px_120px] bg-ink px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[.12em] text-[#C9CDD3] max-[760px]:grid-cols-[44px_1fr_120px]">
                <div>Sıra</div>
                <div>Yatırım konusu</div>
                <div className="max-[760px]:hidden">Köken</div>
                <div className="text-right max-[760px]:hidden">Puan</div>
                <div>Sonuç</div>
              </div>

              {[...h.ilkDort, ...h.kalanlar].map((s, i) =>
                s.bos ? (
                  <div
                    key={`bos-${s.sira}`}
                    className="tex-slot grid grid-cols-[44px_1fr] items-start border-b border-b-[#E9E5DB] border-l-[3px] [border-left-style:dotted] border-l-absent px-4 py-4"
                  >
                    <div className="num font-display text-[20px] text-absent">{s.sira}</div>
                    <div>
                      <div className="text-[14px] font-medium text-ink-soft">
                        Slot boş — yeterince gerekçelendirilebilir aday yok.
                      </div>
                      <p className="mt-1.5 max-w-[78ch] text-[12.5px] leading-[1.5] text-ink-soft text-pretty">
                        {s.gerekce}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={s.id}
                    href={`/oneri/${s.id}`}
                    className={cn(
                      "grid grid-cols-[44px_1fr_86px_92px_120px] items-center border-b border-b-[#E9E5DB] px-4 py-3.5 hover:bg-paper last:border-b-0",
                      "max-[760px]:grid-cols-[44px_1fr_120px]",
                      i >= h.ilkDort.length ? "bg-[#FDFCFA]" : "bg-surface",
                    )}
                  >
                    <div
                      className={cn(
                        "num font-display",
                        i >= h.ilkDort.length ? "text-[17px] text-ink-mute" : "text-[20px] text-ink",
                      )}
                    >
                      {s.sira}
                    </div>
                    <div className="pr-4">
                      <div className="text-[14px] leading-[1.35] font-medium text-pretty">{s.ad}</div>
                      <div className="mt-1 flex flex-wrap gap-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                        {s.nace && <span className="num">NACE {s.nace}</span>}
                        <span>dayanak {s.dayanak}/100</span>
                      </div>
                    </div>
                    <div className="max-[760px]:hidden">
                      <Rozet tur={s.koken === "mevcut" ? "notr" : "gri"}>{s.koken}</Rozet>
                    </div>
                    <div className="num pr-2 text-right text-[17px] max-[760px]:hidden">{s.puan}</div>
                    <div>
                      <Rozet tur={SONUC_ROZET[s.sonuc].tur} isaret={SONUC_ROZET[s.sonuc].isaret}>
                        {s.sonuc}
                      </Rozet>
                    </div>
                  </Link>
                ),
              )}
            </div>

            <p className="mt-4 text-[12.5px] leading-[1.5] text-ink-mute">
              Puanlar yapay zekâ tarafından üretilir ve ajans onayından geçer. Üst ölçekli belgelere bağlanamayan aday,
              puanı yüksek olsa da slot dolduramaz — dayanak eşiği {d.set.dayanakEsigi}/100. Sıralama karar değildir.
            </p>
          </>
        )}
      </Sayfa>
    </>
  );
}

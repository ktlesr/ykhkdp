import Link from "next/link";
import { notFound } from "next/navigation";
import { adaylariGetir, donemGetir, ilGetir, konuluYillar, yatirimKonulari } from "@ykh/database";
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

  /**
   * Sayfa AÇIK DÖNEM OLMADAN da çalışır.
   *
   * Önce `donemGetir` null dönünce `notFound()` veriyordu; 81 ilin 77'sinde
   * dönem yok ve o illerin yürürlükteki resmî listesi yüklü olduğu hâlde
   * görünmüyordu. Dönem yoksa sıralama yok — resmî liste yine var.
   */
  const ilKaydi = await ilGetir(b, il);
  if (!ilKaydi) notFound();

  const d = await donemGetir(b, il);
  const yillar = await konuluYillar(b, il);
  // Sıralama bir sonraki dönem içindir; karşılaştırma zemini bir önceki yılın
  // yürürlükteki listesidir. Dönem yoksa elimizdeki en güncel yıl gösterilir.
  const resmiYil = d ? Number(d.yil) - 1 : (yillar[0] ?? 0);
  const resmi = resmiYil ? await yatirimKonulari(b, il, resmiYil) : [];

  const adaylar = d ? await adaylariGetir(b, d) : [];
  const h = d ? hesapla(adaylar, ayardan(d.set)) : null;
  const yerellik = d ? Math.round(grupAgirligi(d.set.agirliklar, "yerellik") * 100) : 0;

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: ilKaydi.ad, yol: `/il/${il}`, aktif: true },
          { ad: "Öneri ver", yol: `/oneri?il=${il}` },
          ...(k && onaylayabilir(k.rol) ? [{ ad: "Onay", yol: "/onay" }] : []),
        ]}
      />
      <Sayfa genis>
        <Baslik
          ustEtiket={
            d
              ? `${ilKaydi.ajans} · ${d.yil} dönemi`
              : `${ilKaydi.ajans}${ilKaydi.kisa_ad ? ` · ${ilKaydi.kisa_ad}` : ""} · açık dönem yok`
          }
          alt={
            d && h ? (
              <>
                {d.set.slotSayisi} slot. Mevcut konular ve yeni öneriler aynı sekiz kriterle sıralanır; puanın en
                büyük payı (<b>%{yerellik}</b>) “neden burada?” sorusuna ait. Mevcut konulara{" "}
                <b className="num">+{h.pay}</b> devamlılık payı uygulanır; gizli katsayı yok, sürüm{" "}
                <span className="num">{d.set.surum}</span>.{" "}
                {d.kalibre ? (
                  <>Bu ağırlıklar {d.ajans} tarafından yayımlandı.</>
                ) : (
                  <>
                    <b className="font-medium">{d.ajans} henüz kendi ağırlık setini yayımlamadı</b>; ulusal
                    varsayılan uygulanıyor.
                  </>
                )}
              </>
            ) : (
              <>
                Bu ilde henüz açık bir dönem yok, bu yüzden platformun ürettiği bir sıralama da yok. Aşağıda
                yürürlükteki resmî yatırım konuları listesi ve bir önceki yıla göre ne değiştiği görünüyor.
              </>
            )
          }
        >
          {ilKaydi.ad}
          {d ? " — yatırım konusu sıralaması" : " — resmî yatırım konuları"}
        </Baslik>

        {!d || !h ? null : adaylar.length === 0 ? (
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
              <div className="panel-koyu grid grid-cols-[44px_1fr_86px_92px_120px] px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[.12em] text-[#C9CDD3] max-[760px]:grid-cols-[44px_1fr_120px]">
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
              puanı yüksek olsa da slot dolduramaz; dayanak eşiği {d.set.dayanakEsigi}/100. Sıralama karar değildir.
            </p>
          </>
        )}

        {/* Yürürlükteki resmî liste ve yıllar arası süreklilik */}
        {resmi.length > 0 && (
          <div className="mt-8 border border-hairline bg-surface">
            <div className="panel-koyu flex flex-wrap items-baseline gap-x-3 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.13em]">
              <span>Yürürlükteki resmî liste</span>
              <span className="num text-[#C9CDD3]">{resmi[0].kaynak}</span>
            </div>
            <p className="border-b border-b-hairline-soft px-4 py-2.5 text-[12.5px] leading-[1.45] text-ink-soft">
              Sanayi ve Teknoloji Bakanlığı tebliğiyle ilan edilen dört yatırım konusu.{" "}
              {yillar.length > 1 && (
                <>
                  Her konunun yanında <b className="font-medium">bir önceki yıla göre durumu</b> yazıyor: yalnızca
                  başlığı birebir aynı olan konu “aynen korundu” sayılır. Yakın ama yeniden yazılmış başlıklar
                  doğrulanmamış eşleşme olarak gösterilir; kararı okuyan verir.
                </>
              )}
            </p>
            {resmi.map((x) => (
              <div key={x.sira} className="border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  <span className="num shrink-0 text-[12px] text-ink-mute">{String(x.sira).padStart(2, "0")}</span>
                  <h3 className="min-w-0 flex-1 text-[14.5px] font-medium leading-[1.35] text-pretty">{x.baslik}</h3>
                  {yillar.length > 1 &&
                    (x.onceki_durum === "aynen" ? (
                      <Rozet tur="yesil" isaret="■">
                        {resmiYil - 1}’de de aynen vardı
                      </Rozet>
                    ) : x.onceki_durum === "benzer" ? (
                      <Rozet tur="amber" isaret="◌">
                        {resmiYil - 1}’de benzeri · %{Math.round((x.onceki_benzerlik ?? 0) * 100)}
                      </Rozet>
                    ) : (
                      <Rozet tur="notr" isaret="▲">
                        {resmiYil - 1} listesinde yok
                      </Rozet>
                    ))}
                </div>

                {x.onceki_durum === "benzer" && x.onceki_baslik && (
                  <div className="tex-unverified mt-2 ml-[30px] max-w-[78ch] px-3 py-2">
                    <div className="font-mono text-[9.5px] uppercase tracking-[.12em] text-unverif">
                      <span aria-hidden>◌</span> {resmiYil - 1} karşılığı · doğrulanmadı
                    </div>
                    <p className="mt-1 text-[12.5px] leading-[1.45] text-pretty text-ink-soft">{x.onceki_baslik}</p>
                  </div>
                )}

                {x.gerekce && (
                  <p className="mt-2 max-w-[78ch] pl-[30px] text-[13px] leading-[1.5] text-pretty text-ink-soft">
                    {x.gerekce}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!d && (
          <p className="mt-6 text-[12.5px] leading-[1.5] text-ink-mute">
            Ajans bu il için bir dönem açtığında öneri kabulü başlar ve bu konular sıralamaya mevcut aday olarak
            girer.
          </p>
        )}

      </Sayfa>
    </>
  );
}

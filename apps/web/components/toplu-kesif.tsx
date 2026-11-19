"use client";

import { useRouter } from "next/navigation";
import type { TopluKesifDurumu } from "@ykh/database";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { OtoYenile } from "./oto-yenile.tsx";
import { kesifDurdurEylemi, kesifEylemi } from "@/lib/eylem.ts";

const ASAMA: Record<string, string> = { envanter: "belge envanteri", tarama: "kanıt taraması", aday: "aday çıkarımı", kayit: "değerlendirmeye alma" };

/**
 * Kapsamdaki bütün illerde keşfi sıraya koyar (ajans: kendi bölgesi,
 * yönetici: 81 il). Ulusal belgeler bir kez taranır; iller önbelleği paylaşır.
 * Koşu sürerken ilerleme burada kendiliğinden güncellenir ve durdurulabilir.
 */
export function TopluKesif({ yonetici, durum }: { yonetici: boolean; durum: TopluKesifDurumu | null }) {
  const router = useRouter();
  if (durum) {
    const toplam = durum.biten + durum.bekleyen + durum.calisan.length;
    const oran = toplam ? Math.round((durum.biten / toplam) * 100) : 0;
    return (
      <section aria-label="Toplu aday keşfi" className="mt-5 border border-hairline border-l-[3px] border-l-navy bg-surface px-4 py-3">
        <OtoYenile aktif />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <b className="text-[13.5px] font-medium text-ink">
              <span aria-hidden className="num mr-1.5 text-navy analiz-nabiz">◌</span>
              Aday keşfi sürüyor ·{" "}
              <span className="num">
                {durum.biten}/{toplam}
              </span>{" "}
              il tamamlandı
            </b>
            <p aria-live="polite" className="mt-0.5 text-[13px] leading-[1.5] text-ink-soft">
              {durum.calisan.length
                ? durum.calisan.map((c) => `${c.il}: ${ASAMA[c.asama ?? ""] ?? "başlıyor"}${c.asama === "tarama" && c.toplam ? ` ${c.taranan}/${c.toplam} parça` : ""}`).join(" · ")
                : "Arka plan işleyicisi sıradaki ili alacak."}
              {" · "}
              <span className="num">{durum.bekleyen}</span> il sırada · şimdiye dek <span className="num">{durum.aday}</span> aday
            </p>
          </div>
          <EylemFormu eylem={kesifDurdurEylemi} onSonuc={(s) => s.ok && router.refresh()}>
            <Gonder varyant="kirmizi" bekleme="Durduruluyor">
              Durdur
            </Gonder>
          </EylemFormu>
        </div>
        <div className="mt-2.5 h-[3px] bg-hairline-soft" role="progressbar" aria-valuenow={oran} aria-valuemin={0} aria-valuemax={100} aria-label="Tamamlanan il oranı">
          <div className="h-full bg-navy transition-[width] duration-500" style={{ width: `${oran}%` }} />
        </div>
      </section>
    );
  }
  return (
    <>
    <OtoYenile aktif={false} />
    <EylemFormu
      eylem={kesifEylemi}
      onSonuc={(s) => s.ok && router.refresh()}
      className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border border-hairline bg-surface px-4 py-3"
    >
      <p className="min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-soft">
        <b className="font-medium text-ink">Belgelerden aday keşfi.</b>{" "}
        {yonetici ? "81 ilin tamamında" : "Bölgenizdeki bütün illerde"} yüklü belgeler taranır; her il için yerel kanıta
        dayanan adaylar çıkar ve onay kuyruğuna puanlanarak düşer.
      </p>
      <Gonder varyant="cizgi" bekleme="Sıraya alınıyor">
        {yonetici ? "Tüm illerde başlat" : "Bölgemde başlat"}
      </Gonder>
    </EylemFormu>
    </>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { degerlendirEylemi } from "@/lib/eylem.ts";

/**
 * `degerlendiriliyor` durumundaki öneri için aşama göstergesi.
 *
 * İki soruyu cevaplar: başladı mı, hangi aşamada. Arka plan işleyicisi kapalıysa
 * kullanıcı beklemekle kalmasın diye elle tetikleme butonu var — aynı kod yolunu
 * çağırır. Sayfa açıkken 5 saniyede bir kendini yeniler.
 */
export function DegerlendirmeDurumu({
  oneriId,
  deneme,
  maksDeneme,
  sonHata,
}: {
  oneriId: number;
  deneme: number;
  maksDeneme: number;
  sonHata: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [router]);

  const baslamadi = deneme === 0 && !sonHata;
  const tukendi = deneme >= maksDeneme;

  return (
    <div className="tex-unverified mt-6 border border-unverif-line border-l-[3px] border-l-unverif px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[.12em] text-unverif">
        <span aria-hidden>◌</span> Değerlendirme durumu
      </div>

      <table className="mt-2.5 text-[13px] leading-[1.6]">
        <tbody>
          <tr>
            <td className="pr-4 text-ink-mute">Aşama</td>
            <td className="font-medium text-ink">
              {tukendi
                ? "Durdu — deneme sınırı aşıldı"
                : baslamadi
                  ? "Sırada bekliyor · henüz alınmadı"
                  : "Alındı, puanlanıyor"}
            </td>
          </tr>
          <tr>
            <td className="pr-4 text-ink-mute">Deneme</td>
            <td className="num text-ink">
              {deneme} / {maksDeneme}
            </td>
          </tr>
          {sonHata && (
            <tr>
              <td className="pr-4 align-top text-ink-mute">Son hata</td>
              <td className="max-w-[60ch] text-conflict">{sonHata}</td>
            </tr>
          )}
        </tbody>
      </table>

      {baslamadi && (
        <p className="mt-3 max-w-[70ch] text-[12.5px] leading-[1.5] text-ink-soft">
          Öneri kuyrukta ama henüz alınmamış. Arka plan işleyicisi (<span className="num">pnpm worker</span>)
          çalışmıyorsa hiç alınmaz. Beklemek yerine aşağıdaki butonla şimdi çalıştırabilirsiniz.
        </p>
      )}

      <EylemFormu eylem={degerlendirEylemi} className="mt-3">
        <input type="hidden" name="oneriId" value={oneriId} />
        <Gonder>{tukendi ? "Yeniden dene" : "Şimdi değerlendir"}</Gonder>
      </EylemFormu>

      <p className="mt-2 font-mono text-[10px] tracking-[.06em] text-ink-mute">
        Sayfa 5 saniyede bir kendini yeniliyor.
      </p>
    </div>
  );
}

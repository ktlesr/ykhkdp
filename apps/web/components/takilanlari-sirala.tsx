"use client";

import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { takilanlariSiralaEylemi } from "@/lib/eylem.ts";

/**
 * Hatayla durmuş değerlendirmeleri topluca yeniden sıraya alır (ajans ve
 * yönetici). Deneme hakkı dolan öneriyi işleyici bir daha almaz; bu düğme
 * sayaçları sıfırlar, işleyici sırayla yeniden dener. Hiçbir şey silinmez,
 * puan ya da karar değişmez — bu yüzden onay adımı yok. Kapsam ekrandaki süzgeç.
 */
export function TakilanlariSirala({ adet, bolge, il }: { adet: number; bolge: string; il: string }) {
  const router = useRouter();
  if (!adet) return null;
  return (
    <EylemFormu
      eylem={takilanlariSiralaEylemi}
      onSonuc={(s) => s.ok && router.refresh()}
      className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-conflict-line bg-conflict-tint px-4 py-3"
    >
      <input type="hidden" name="bolge" value={bolge} />
      <input type="hidden" name="il" value={il} />
      <p className="min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-soft">
        <b className="font-medium text-ink">
          <span className="num">{adet}</span> önerinin değerlendirmesi hatayla durdu.
        </b>{" "}
        Deneme hakkı dolan öneri kendiliğinden yeniden denenmez. Yeniden sıraya alınca arka plan işleyicisi hepsini
        sırayla değerlendirir; öneri metni ve kararlar değişmez.
      </p>
      <Gonder varyant="cizgi" bekleme="Sıraya alınıyor">
        Hepsini yeniden değerlendir
      </Gonder>
    </EylemFormu>
  );
}

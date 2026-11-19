"use client";

import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { eskiPuanlariYenileEylemi } from "@/lib/puan-eylem.ts";

/**
 * Eski talimat sürümüyle puanlanmış, onay bekleyen önerileri yeniden puanlamaya
 * alır (yalnızca yönetici). Keşfin ürettiği adaylar kalır; değişen yalnızca
 * puanlamadır. Onaylanmış, reddedilmiş ve ajansın puanını düzelttiği kayıtlara
 * dokunulmaz. Silme olmadığı için onay adımı yok. Kapsam ekrandaki süzgeç.
 */
export function EskiPuanlar({ adet, surum, bolge, il }: { adet: number; surum: string; bolge: string; il: string }) {
  const router = useRouter();
  if (!adet) return null;
  return (
    <EylemFormu
      eylem={eskiPuanlariYenileEylemi}
      onSonuc={(s) => s.ok && router.refresh()}
      className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-unverif-line bg-unverif-tint px-4 py-3 [border-style:dashed]"
    >
      <input type="hidden" name="bolge" value={bolge} />
      <input type="hidden" name="il" value={il} />
      <p className="min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-soft">
        <b className="font-medium text-ink">
          <span className="num">{adet}</span> öneri eski puanlama talimatıyla değerlendirilmiş.
        </b>{" "}
        Güncel talimat <span className="num">{surum}</span>. Yeniden puanlamaya alınca adaylar ve metinleri kalır, yalnızca
        puan, dayanak ve notlar yeni kurallarla yeniden üretilir; önceki değerlendirme denetimde saklanır.
      </p>
      <Gonder varyant="cizgi" bekleme="Sıraya alınıyor">
        Eskileri yeniden puanla
      </Gonder>
    </EylemFormu>
  );
}

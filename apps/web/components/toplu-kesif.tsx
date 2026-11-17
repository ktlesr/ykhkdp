"use client";

import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { kesifEylemi } from "@/lib/eylem.ts";

/**
 * Kapsamdaki bütün illerde keşfi sıraya koyar (ajans: kendi bölgesi,
 * yönetici: 81 il). Ulusal belgeler bir kez taranır; iller önbelleği paylaşır.
 */
export function TopluKesif({ yonetici }: { yonetici: boolean }) {
  return (
    <EylemFormu eylem={kesifEylemi} className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border border-hairline bg-surface px-4 py-3">
      <p className="min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-soft">
        <b className="font-medium text-ink">Belgelerden aday keşfi.</b>{" "}
        {yonetici ? "81 ilin tamamında" : "Bölgenizdeki bütün illerde"} yüklü belgeler taranır; her il için yerel kanıta
        dayanan adaylar çıkar ve onay kuyruğuna puanlanarak düşer.
      </p>
      <Gonder varyant="cizgi" bekleme="Sıraya alınıyor">
        {yonetici ? "Tüm illerde başlat" : "Bölgemde başlat"}
      </Gonder>
    </EylemFormu>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { eskiPuanlariYenile } from "@ykh/database";
import { PROMPTLAR } from "@ykh/ai-gateway";
import { log } from "@ykh/observability";
import type { EylemSonucu } from "./eylem.ts";
import { baglam, kullanici } from "./oturum.ts";

/** Eski talimatla puanlanmış, onay bekleyen önerileri yeniden puanlamaya alır (bkz. `eskiPuanlariYenile`). */
export async function eskiPuanlariYenileEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Toplu yeniden puanlamayı yalnızca yönetici başlatabilir." };
  const s = await eskiPuanlariYenile(
    await baglam(),
    { ajansKod: String(f.get("bolge") ?? "") || null, ilKod: String(f.get("il") ?? "") || null },
    PROMPTLAR.degerlendirme.surum,
  );
  if (!s.ok) return s;
  log.info("eski_puanlar_yenileniyor", { adet: s.adet });
  revalidatePath("/onay");
  return {
    ok: true,
    mesaj: s.adet
      ? `${s.adet} öneri yeniden puanlamaya alındı; arka plan işleyicisi sırayla değerlendirecek.`
      : "Eski talimatla puanlanmış öneri kalmamış.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { ayarYaz } from "@ykh/database";
import { log } from "@ykh/observability";
import type { EylemSonucu } from "./eylem.ts";
import { baglam, kullanici } from "./oturum.ts";

/** `ayar` anahtarı; değer "0"–"100" ya da "" (ayar yok: ağırlık setinin eşiği geçerli). */
const ANAHTAR = "dayanak_esigi";

/**
 * Dayanak eşiğini değiştirir — yalnızca yönetici.
 *
 * Değer bütün ağırlık setlerinin eşiğinin yerine geçer
 * (`dayanak_esigi_gecerli`, migration 0024); boş bırakılırsa setlerin kendi
 * değerine dönülür. Sıralama onayla değil HESAPLA oluştuğu için değişiklik
 * hemen etkilidir: eşiğin altında kalan aday slot dolduramaz, üstüne çıkan
 * doldurur. Hiçbir puan, dayanak ya da karar değişmez. Değişiklik
 * `ayar_degistirildi` olarak denetime yazılır (önceki ve yeni değerle).
 */
export async function esikEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Bu ayarı yalnızca yönetici değiştirebilir." };

  const ham = String(f.get("esik") ?? "").trim();
  if (ham !== "" && !(/^\d{1,3}$/.test(ham) && Number(ham) <= 100)) {
    return { ok: false, mesaj: "Eşik 0 ile 100 arasında tam sayı olmalı; ağırlık setindeki değere dönmek için boş bırakın." };
  }
  const yazildi = await ayarYaz(await baglam(), ANAHTAR, ham);
  if (!yazildi) return { ok: false, mesaj: "Ayar yazılamadı; yetki reddedildi." };

  log.info("dayanak_esigi_degistirildi", { esik: ham || null });
  // Eşik sıralamayı ve "dayanaksız" etiketini belirliyor: bütün ekranlar tazelenmeli.
  revalidatePath("/", "layout");
  return {
    ok: true,
    mesaj: ham === "" ? "Eşik ayarı kaldırıldı; ağırlık setlerindeki değer geçerli." : `Dayanak eşiği ${ham} olarak ayarlandı.`,
  };
}

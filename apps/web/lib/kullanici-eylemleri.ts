"use server";

import { revalidatePath } from "next/cache";
import { kullaniciEkle, kullaniciGuncelle } from "@ykh/database";
import { ROLLER } from "@ykh/domain";
import { baglam, kullanici } from "./oturum.ts";
import type { EylemSonucu } from "./eylem.ts";

export async function kullaniciEkleEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Bu işlemi yalnızca yönetici yapabilir." };
  const rol = ROLLER.find((r) => r === f.get("rol"));
  if (!rol) return { ok: false, mesaj: "Tanınmayan rol." };
  const sonuc = await kullaniciEkle(await baglam(), {
    eposta: String(f.get("eposta") ?? ""),
    adSoyad: String(f.get("adSoyad") ?? ""),
    parola: String(f.get("parola") ?? ""),
    rol,
    ajansKod: String(f.get("ajansKod") ?? "") || null,
  });
  if (sonuc.ok) revalidatePath("/ayarlar");
  return sonuc;
}

export async function kullaniciGuncelleEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Bu işlemi yalnızca yönetici yapabilir." };
  const sonuc = await kullaniciGuncelle(await baglam(), String(f.get("ref") ?? ""), {
    eposta: String(f.get("eposta") ?? ""),
    adSoyad: String(f.get("adSoyad") ?? ""),
  });
  if (sonuc.ok) revalidatePath("/ayarlar");
  return sonuc;
}

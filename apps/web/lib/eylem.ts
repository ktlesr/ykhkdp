"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  belgeEkle, belgeSil, cikisYap, donemGetir, girisYap, kayitOl, naceAra, naceDuzelt,
  oneriOlustur, puanDuzelt, durumDegistir,
} from "@ykh/database";
import { gecisIzinli, onaylayabilir, type OneriDurumu } from "@ykh/domain";
import { log } from "@ykh/observability";
import { KRITERLER, type Kriter } from "@ykh/scoring";
import { baglam, cerezSil, COOKIE, kullanici, oturumCerezi } from "./oturum.ts";

export type EylemSonucu = { ok: boolean; mesaj: string };

// ── kimlik ─────────────────────────────────────────────────────────────────

export async function girisEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const r = await girisYap(String(f.get("eposta") ?? ""), String(f.get("parola") ?? ""));
  if (!r.ok) return { ok: false, mesaj: r.hata };
  await oturumCerezi(r.jeton);
  redirect(String(f.get("hedef") ?? "/"));
}

export async function kayitEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const r = await kayitOl(
    String(f.get("eposta") ?? ""),
    String(f.get("parola") ?? ""),
    String(f.get("adSoyad") ?? ""),
  );
  if (!r.ok) return { ok: false, mesaj: r.hata };
  await oturumCerezi(r.jeton);
  redirect("/oneri");
}

export async function cikisEylemi(): Promise<void> {
  await cikisYap((await cookies()).get(COOKIE)?.value);
  await cerezSil();
  redirect("/");
}

// ── NACE arama (yatırımcı biliyorsa girer) ─────────────────────────────────

export async function naceAraEylemi(sorgu: string) {
  return naceAra(await baglam(), sorgu);
}

// ── öneri ──────────────────────────────────────────────────────────────────

export async function oneriEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k) return { ok: false, mesaj: "Öneri vermek için giriş yapın." };

  const baslik = String(f.get("baslik") ?? "").trim();
  const gerekce = String(f.get("gerekce") ?? "").trim();
  const il = String(f.get("il") ?? "");
  const ilce = String(f.get("ilce") ?? "");

  if (baslik.length < 8) return { ok: false, mesaj: "Yatırım konusu başlığı en az 8 karakter olmalı." };
  if (gerekce.length < 40) {
    return {
      ok: false,
      mesaj: "“Neden burada?” gerekçesi en az 40 karakter olmalı — puanın en büyük payı bu alana ait.",
    };
  }
  if (!il) return { ok: false, mesaj: "İl seçin." };

  const b = await baglam();
  const d = await donemGetir(b, il);
  if (!d) return { ok: false, mesaj: "Bu il için açık bir dönem yok." };

  const o = await oneriOlustur(b, {
    donemId: d.donemId,
    baslik,
    gerekce,
    ilce: ilce || "Merkez",
    naceKod: String(f.get("naceKod") ?? "") || null,
  });
  log.info("oneri_olusturuldu", { oneriId: o.id, il });
  redirect(`/oneri/${o.id}`);
}

// ── ajans işlemleri ────────────────────────────────────────────────────────

export async function durumEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };

  const mevcut = String(f.get("mevcut")) as OneriDurumu;
  const yeni = String(f.get("durum")) as OneriDurumu;
  const gerekce = String(f.get("gerekce") ?? "").trim();

  const izin = gecisIzinli(mevcut, yeni, k.rol);
  if (!izin.izinli) return { ok: false, mesaj: izin.sebep };
  if (izin.gecis.gerekceZorunlu && gerekce.length < 10) {
    return { ok: false, mesaj: `“${izin.gecis.eylem}” için gerekçe zorunlu (en az 10 karakter).` };
  }

  await durumDegistir(await baglam(), Number(f.get("oneriId")), yeni, gerekce);
  revalidatePath("/onay");
  revalidatePath(String(f.get("yol") ?? "/"));
  return {
    ok: true,
    mesaj:
      yeni === "listede"
        ? "Onaylandı. Öneri il sıralamasında görünüyor."
        : yeni === "reddedildi"
          ? "Reddedildi. Gerekçe önerinin sayfasında görünür."
          : "Durum güncellendi.",
  };
}

export async function puanEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };

  const gerekce = String(f.get("gerekce") ?? "").trim();
  if (gerekce.length < 10) return { ok: false, mesaj: "Puan düzeltmesi gerekçe ister (en az 10 karakter)." };

  const puanlar = {} as Record<Kriter, number>;
  for (const kr of KRITERLER) {
    const v = Number(f.get(kr));
    if (!Number.isInteger(v) || v < 0 || v > 100) return { ok: false, mesaj: `${kr}: 0–100 arası tam sayı girin.` };
    puanlar[kr] = v;
  }

  await puanDuzelt(await baglam(), Number(f.get("oneriId")), puanlar, gerekce);
  revalidatePath(String(f.get("yol") ?? "/onay"));
  return { ok: true, mesaj: "Puan düzeltildi. AI'nin ham puanı kayıtta korunuyor." };
}

export async function naceEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };
  const kod = String(f.get("naceKod") ?? "").trim();
  if (!kod) return { ok: false, mesaj: "NACE kodu seçin." };

  await naceDuzelt(await baglam(), Number(f.get("oneriId")), kod);
  revalidatePath(String(f.get("yol") ?? "/onay"));
  return { ok: true, mesaj: `NACE ${kod} olarak düzeltildi.` };
}

// ── üst ölçekli belgeler ───────────────────────────────────────────────────

export async function belgeEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Belge yüklemek yalnızca ajans rolünde." };

  const ad = String(f.get("ad") ?? "").trim();
  const dosya = f.get("dosya");
  let metin = String(f.get("metin") ?? "").trim();

  if (dosya instanceof File && dosya.size > 0) {
    if (dosya.size > 5_000_000) return { ok: false, mesaj: "Dosya en çok 5 MB olabilir." };
    // ponytail: metin tabanlı dosya (txt/md). PDF/docx için ayrıştırıcı gerekir;
    // şimdilik metni panodan yapıştırma yolu açık.
    metin = (await dosya.text()).trim();
  }

  if (ad.length < 5) return { ok: false, mesaj: "Belge adı en az 5 karakter olmalı." };
  if (metin.length < 200) {
    return { ok: false, mesaj: "Belge metni en az 200 karakter olmalı — AI alıntı çıkaramaz." };
  }

  const r = await belgeEkle(await baglam(), {
    ad,
    tur: String(f.get("tur") ?? "diger"),
    yil: String(f.get("yil") ?? "") || null,
    ajansKod: String(f.get("ajansKod") ?? "") || null,
    ilKod: String(f.get("ilKod") ?? "") || null,
    metin,
  });
  revalidatePath("/belgeler");
  return { ok: true, mesaj: `“${ad}” eklendi (${metin.length} karakter). Yeni öneriler bu belgeye dayanabilir.` };
}

export async function belgeSilEylemi(id: number): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };
  await belgeSil(await baglam(), id);
  revalidatePath("/belgeler");
  return { ok: true, mesaj: "Belge silindi." };
}

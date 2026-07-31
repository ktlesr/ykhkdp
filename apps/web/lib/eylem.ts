"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  belgeEkle, belgeSil, cikisYap, donemGetir, girisYap, islem, kayitOl, naceAra, naceDuzelt,
  ayarYaz, misafirAc, oneriOlustur, puanDuzelt, durumDegistir,
} from "@ykh/database";
import { gecisIzinli, onaylayabilir, type OneriDurumu } from "@ykh/domain";
import { log } from "@ykh/observability";
import { KRITERLER, type Kriter } from "@ykh/scoring";
import { degerlendirmeYap, SERVIS } from "@ykh/degerlendirme";
import { baglam, cerezSil, COOKIE, kullanici, oturumCerezi } from "./oturum.ts";
import { paletGecerli } from "./palet.ts";

export type EylemSonucu = { ok: boolean; mesaj: string };

// ── kimlik ─────────────────────────────────────────────────────────────────

export async function girisEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const r = await girisYap(String(f.get("eposta") ?? ""), String(f.get("parola") ?? ""));
  if (!r.ok) return { ok: false, mesaj: r.hata };
  await oturumCerezi(r.jeton);
  redirect(String(f.get("hedef") ?? "/iller"));
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

/**
 * Kayıt olmadan devam et.
 *
 * Kişisel veri toplanmaz: `kimlik` satırı hiç oluşturulmaz, yalnızca değişmez
 * `gonderen.ref` ve oturum çerezi. Yatırımcı önerisini bu çerezle takip eder.
 */
export async function misafirEylemi(): Promise<EylemSonucu> {
  const k = await kullanici();
  if (k) return { ok: true, mesaj: "Oturum zaten açık." };
  const { jeton } = await misafirAc();
  await oturumCerezi(jeton);
  log.info("misafir_oturum", {});
  // revalidatePath YOK: sihirbaz adımı istemcide ilerliyor, route'u yenilemek
  // yazılmakta olan formu ve adım durumunu riske atar. Çerez sunucuda hazır;
  // `oneriEylemi` gönderim anında onu okuyor.
  return { ok: true, mesaj: "Misafir olarak devam ediyorsunuz." };
}

// ── kurumsal ayarlar ───────────────────────────────────────────────────────

/**
 * Renk paleti — kurumsal karar, yalnızca yönetici.
 *
 * Rol kontrolü burada VE RLS'te: `ayarYaz` yazma 0 satır etkilerse false
 * döner, yani politika sessizce engellese bile arayüz "kaydedildi" demez.
 */
export async function paletEylemi(id: string): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Bu ayarı yalnızca yönetici değiştirebilir." };
  if (!paletGecerli(id) || paletGecerli(id) !== id) {
    return { ok: false, mesaj: "Tanınmayan palet." };
  }

  // İkinci katman RLS: yetkisiz çağrı hata fırlatır. Rol kontrolü yukarıda
  // yapıldığı için buraya düşen bir hata ilk katmanın atlandığını gösterir —
  // yutulmaz, kullanıcıya bildirilir.
  const yazildi = await ayarYaz(await baglam(), "palet", id);
  if (!yazildi) return { ok: false, mesaj: "Ayar yazılamadı; yetki reddedildi." };

  log.info("palet_degistirildi", { palet: id });
  // Palet <html data-palet> ile sunucudan basılıyor: tüm sayfalar tazelenmeli.
  revalidatePath("/", "layout");
  return { ok: true, mesaj: "Palet değiştirildi." };
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
    // "Merkez" varsayılanı YOK: her ilin Merkez ilçesi yok (Manisa:
    // Şehzadeler / Yunusemre). Uydurma ilçe adı yazmak yerine boş bırakılıyor.
    ilce: ilce || null,
    naceKod: String(f.get("naceKod") ?? "") || null,
  });
  log.info("oneri_olusturuldu", { oneriId: o.id, il });
  redirect(`/oneri/${o.id}`);
}

/**
 * Değerlendirmeyi şimdi çalıştır.
 *
 * Worker'ın çalışmasını beklemeden aynı `degerlendirmeYap()` yolunu tetikler —
 * worker açık olsa da olmasa da öneri tıkanıp kalmaz. Servis bağlamıyla çalışır
 * çünkü AI puanı bir sistem çıktısıdır, kullanıcının yetkisiyle yazılmaz.
 */
/**
 * Elle değerlendirme tetiği — yalnızca ajans ve yönetici.
 *
 * Yatırımcı kendi önerisini yeniden değerlendirtemez: değerlendirme ajansın
 * onaylayacağı bir puan üretir ve model maliyeti doğurur. Otomatik akış
 * değişmedi — worker `degerlendiriliyor` durumundaki öneriyi kendisi alır.
 * Bu düğme yalnızca o akış takıldığında ajansın elle müdahalesidir.
 */
export async function degerlendirEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) {
    return { ok: false, mesaj: "Değerlendirmeyi yalnızca ajans ve yönetici başlatabilir." };
  }

  const oneriId = Number(f.get("oneriId"));
  const b = await baglam();
  const [sahip] = await islem(b, (sql) =>
    sql<{ durum: string }[]>`select durum from oneri where id = ${oneriId}`,
  );
  if (!sahip) return { ok: false, mesaj: "Öneri bulunamadı." };

  const s = await degerlendirmeYap(SERVIS, oneriId);
  revalidatePath(`/oneri/${oneriId}`);
  revalidatePath("/onay");
  if (!s.ok) return { ok: false, mesaj: `${ASAMA_ETIKET[s.asama]}: ${s.mesaj}` };
  return { ok: true, mesaj: `Değerlendirme tamam — ${s.mesaj}` };
}

const ASAMA_ETIKET: Record<string, string> = {
  oneri: "Öneri okunamadı",
  nace: "NACE adımı",
  belge: "Belge adımı",
  model: "Model adımı",
  kayit: "Kayıt adımı",
  tamam: "Tamam",
};

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

export async function belgeSilEylemi(ad: string): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };
  const parca = await belgeSil(await baglam(), ad);
  if (!parca) return { ok: false, mesaj: `“${ad}” bulunamadı.` };
  revalidatePath("/belgeler");
  return { ok: true, mesaj: `“${ad}” silindi (${parca} parça). Yeni değerlendirmeler buna dayanamaz.` };
}

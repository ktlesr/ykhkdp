"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cikisYap, destekVer, donemGetir, girisYap, kanitDurumDegistir, kanitEkle,
  kararKilitle, kayitOl, kriterPuaniYaz, oneriDurumDegistir, oneriOlustur,
  adaylariGetir, benzerOneriler,
} from "@ykh/database";
import { kilitOnayiGecerli, type OneriDurumu } from "@ykh/domain";
import { log } from "@ykh/observability";
import { ayardan, hesapla, type Kriter } from "@ykh/scoring";
import { cookies } from "next/headers";
import { baglam, cerezSil, COOKIE, kullanici, oturumCerezi } from "./oturum.ts";

/**
 * Sunucu eylemleri. Her mutasyon:
 *   1. oturum bağlamını çözer,
 *   2. yetkiyi hem burada hem RLS'te kontrol eder (katmanlı savunma),
 *   3. denetim kaydını @ykh/database içinde yazar.
 */

export type EylemSonucu = { ok: boolean; mesaj: string };

// ── kimlik ─────────────────────────────────────────────────────────────────

export async function girisEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const r = await girisYap(String(form.get("eposta") ?? ""), String(form.get("parola") ?? ""));
  if (!r.ok) return { ok: false, mesaj: r.hata };
  await oturumCerezi(r.jeton);
  redirect(String(form.get("hedef") ?? "/iller"));
}

export async function kayitEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const r = await kayitOl(
    String(form.get("eposta") ?? ""),
    String(form.get("parola") ?? ""),
    String(form.get("adSoyad") ?? ""),
  );
  if (!r.ok) return { ok: false, mesaj: r.hata };
  await oturumCerezi(r.jeton);
  redirect("/panom");
}

export async function cikisEylemi(): Promise<void> {
  await cikisYap((await cookies()).get(COOKIE)?.value);
  await cerezSil();
  redirect("/");
}

// ── öneri ──────────────────────────────────────────────────────────────────

export async function benzerlikKontrolu(donemId: number, baslik: string, nace: string, ilce: string) {
  return benzerOneriler(await baglam(), donemId, baslik, nace || null, ilce || null);
}

export async function oneriEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k) return { ok: false, mesaj: "Öneri vermek için giriş yapın." };

  const baslik = String(form.get("baslik") ?? "").trim();
  const tanim = String(form.get("tanim") ?? "").trim();
  const neden = String(form.get("neden") ?? "").trim();
  if (baslik.length < 8) return { ok: false, mesaj: "Konu başlığı en az 8 karakter olmalı." };
  if (tanim.length < 40) return { ok: false, mesaj: "Kısa tanım en az 40 karakter olmalı." };
  if (tanim.length > 600) return { ok: false, mesaj: "Kısa tanım en çok 600 karakter olabilir." };

  const donemId = Number(form.get("donemId"));
  const o = await oneriOlustur(await baglam(), {
    donemId,
    tur: (String(form.get("tur") ?? "yeni") as "yeni" | "koruma" | "kapsam"),
    baslik,
    tanim,
    ilce: String(form.get("ilce") ?? "Merkez"),
    neden,
    nace: String(form.get("nace") ?? "") || null,
    naceOnayli: form.get("naceOnayli") === "on",
  });
  log.info("oneri_olusturuldu", { oneriId: o.id, donemId });
  revalidatePath("/panom");
  redirect(`/oneri/${o.id}`);
}

export async function destekEylemi(oneriId: number, yol: string): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k) return { ok: false, mesaj: "Destek vermek için giriş yapın." };
  await destekVer(await baglam(), oneriId);
  revalidatePath(yol);
  return {
    ok: true,
    mesaj: "Destek kaydedildi. Destek sayısı puan girdisi değildir; ilgi sinyali olarak görünür.",
  };
}

export async function kanitEkleEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k) return { ok: false, mesaj: "Kanıt eklemek için giriş yapın." };

  const oneriId = Number(form.get("oneriId"));
  const kaynakKurum = String(form.get("kaynakKurum") ?? "").trim();
  const belge = String(form.get("belge") ?? "").trim();
  if (kaynakKurum.length < 3) return { ok: false, mesaj: "Kaynak kurum yazılmalı." };
  if (belge.length < 3) return { ok: false, mesaj: "Belge adı yazılmalı." };

  const r = await kanitEkle(await baglam(), oneriId, {
    kaynakKurum,
    belge,
    sayfaTablo: String(form.get("sayfaTablo") ?? ""),
    yayimTarihi: String(form.get("yayimTarihi") ?? "") || null,
    url: String(form.get("url") ?? "") || null,
    alinti: String(form.get("alinti") ?? ""),
    katkiPuani: Number(form.get("katkiPuani") ?? 10),
  });
  revalidatePath(`/oneri/${oneriId}`);
  return {
    ok: true,
    mesaj: `Kanıt ${r.kod} dosyaya eklendi. Uzman doğrulamasına kadar “beyan” işaretiyle görünür ve puana girmez.`,
  };
}

// ── uzman incelemesi ───────────────────────────────────────────────────────

export async function kanitDogrulaEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !["ajans_uzmani", "sektor_uzmani"].includes(k.rol)) {
    return { ok: false, mesaj: "Kanıtı yalnızca ajans veya sektör uzmanı doğrulayabilir." };
  }
  const durum = String(form.get("durum")) as "uzman_onayli" | "reddedildi" | "celiskili";
  const gerekce = String(form.get("gerekce") ?? "").trim();
  if (durum !== "uzman_onayli" && gerekce.length < 10) {
    return { ok: false, mesaj: "Ret ve çelişki için gerekçe zorunludur (en az 10 karakter)." };
  }
  await kanitDurumDegistir(await baglam(), Number(form.get("kanitId")), durum, gerekce);
  revalidatePath(String(form.get("yol") ?? "/"));
  return { ok: true, mesaj: `Kanıt “${durum}” olarak kaydedildi. Karar defterine yazıldı.` };
}

export async function oneriDurumEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k) return { ok: false, mesaj: "Giriş yapın." };
  const gerekce = String(form.get("gerekce") ?? "").trim();
  if (gerekce.length < 10) return { ok: false, mesaj: "Durum değişikliği gerekçe ister (en az 10 karakter)." };

  await oneriDurumDegistir(await baglam(), Number(form.get("oneriId")), String(form.get("durum")) as OneriDurumu, gerekce);
  revalidatePath(String(form.get("yol") ?? "/"));
  return { ok: true, mesaj: "Öneri durumu güncellendi ve kayda geçti." };
}

export async function kriterPuaniEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !["ajans_uzmani", "sektor_uzmani"].includes(k.rol)) {
    return { ok: false, mesaj: "Kriter puanını yalnızca uzman yazabilir." };
  }
  const gerekce = String(form.get("gerekce") ?? "").trim();
  if (gerekce.length < 10) return { ok: false, mesaj: "Kriter puanı gerekçe ister (en az 10 karakter)." };

  await kriterPuaniYaz(
    await baglam(),
    Number(form.get("adayId")),
    String(form.get("kriter")) as Kriter,
    Number(form.get("puan")),
    gerekce,
  );
  revalidatePath(String(form.get("yol") ?? "/"));
  return { ok: true, mesaj: "Kriter puanı kaydedildi ve sıralama yeniden hesaplandı." };
}

// ── karar kilidi (OV-02) ───────────────────────────────────────────────────

export async function kilitEylemi(_önceki: EylemSonucu | null, form: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k) return { ok: false, mesaj: "Giriş yapın." };
  if (!kilitOnayiGecerli(String(form.get("onay") ?? ""))) {
    return { ok: false, mesaj: "Onay için kutuya KİLİTLE yazmanız gerekiyor." };
  }
  const gerekce = String(form.get("gerekce") ?? "").trim();
  if (gerekce.length < 20) {
    return { ok: false, mesaj: "Kilit, kurul gerekçesi ister (en az 20 karakter). Boş slot ve çıkan konu ayrıca kayda geçer." };
  }

  const il = String(form.get("il"));
  const yil = String(form.get("yil"));
  const b = await baglam();
  const d = await donemGetir(b, il, yil);
  if (!d) return { ok: false, mesaj: "Dönem bulunamadı." };

  const h = hesapla(await adaylariGetir(b, d), ayardan(d.set));
  const icerik = {
    surum: d.set.surum,
    pay: h.pay,
    esik: h.esik,
    slotlar: h.ilkDort.map((s) =>
      s.bos
        ? { sira: s.sira, adayId: null, ad: "Slot boş — yeterli kanıtlı aday yok", sonuc: "boş", gerekce: s.gerekce }
        : { sira: s.sira, adayId: s.id, ad: s.ad, sonuc: s.sonuc, puan: s.puan, kanit: s.kanit },
    ),
    disarda: h.kalanlar.map((s) => ({ sira: s.sira, ad: s.ad, sonuc: s.sonuc, puan: s.puan, kanit: s.kanit })),
    ozet: h.ozet,
  };

  const r = await kararKilitle(b, d.donemId, d.set.surum, icerik, [{ konu: `${d.il} ${d.yil}`, gerekce }]);
  if (!r.ok) return { ok: false, mesaj: r.hata };

  log.info("karar_kilitlendi", { il, yil, surum: d.set.surum });
  revalidatePath(`/il/${il}/donem/${yil}`);
  return { ok: true, mesaj: `${d.yil} dönemi kararı kilitlendi. Sayfa salt okunur; sürüm damgası ${d.set.surum}.` };
}

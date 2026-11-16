"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  belgeEkle, belgeSil, cikisYap, donemGetir, girisYap, islem, kayitOl, naceAra, naceDuzelt,
  ayarYaz, kimlikAc, kimlikSil, KotaAsildi, misafirAc, oneriOlustur, puanDuzelt, durumDegistir, rolAta,
} from "@ykh/database";
import { gecisIzinli, onaylayabilir, ROL_ETIKET, ROLLER, type OneriDurumu, type Rol } from "@ykh/domain";
import { log } from "@ykh/observability";
import { KRITERLER, type Kriter } from "@ykh/scoring";
import { degerlendirmeYap, SERVIS } from "@ykh/degerlendirme";
import { baglam, cerezSil, COOKIE, istemciIp, kullanici, oturumCerezi } from "./oturum.ts";
import { paletGecerli } from "./palet.ts";
import { ayar, COK_FAZLA, icYol, sinirAsildi, sinirDolu, sinirSay } from "./sinir.ts";

const DK = 60_000;

export type EylemSonucu = { ok: boolean; mesaj: string };

// ── kimlik ─────────────────────────────────────────────────────────────────

export async function girisEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  // Parola özeti (scrypt) pahalı: IP başına toplam sınır + hesap başına
  // BAŞARISIZ deneme sınırı.
  //
  // Anahtar veritabanının eşlediği kimlikle AYNI: `kimlik.eposta` citext ve
  // yerelden bağımsız küçültür. `tr-TR` küçültme (I → ı) farklı anahtar üretip
  // sınırı atlatmaya izin veriyordu; aynı dizge `girisYap`'a da gider.
  //
  // Hesap sınırı yalnızca başarısız denemeyi sayar ve IP ile eşlenir: başkası
  // adına bilerek yanlış parola girip o hesabı kilitlemek mümkün olmasın.
  const eposta = String(f.get("eposta") ?? "").trim().toLowerCase();
  const ip = await istemciIp();
  const hesapAnahtari = `giris-hesap:${eposta}|${ip}`;
  const HESAP_PENCERE = 15 * DK;
  if (
    sinirAsildi(`giris-ip:${ip}`, ayar("YKH_SINIR_GIRIS_IP", 20), 10 * DK) ||
    sinirDolu(hesapAnahtari, ayar("YKH_SINIR_GIRIS_HESAP", 10), HESAP_PENCERE)
  ) {
    log.uyari("hiz_siniri", { eylem: "giris" });
    return { ok: false, mesaj: COK_FAZLA };
  }
  const r = await girisYap(eposta, String(f.get("parola") ?? ""));
  if (!r.ok) {
    sinirSay(hesapAnahtari, HESAP_PENCERE);
    return { ok: false, mesaj: r.hata };
  }
  await oturumCerezi(r.jeton);
  // Yalnızca uygulama içi yol (açık yönlendirmeye karşı, bkz. `icYol`).
  redirect(icYol(String(f.get("hedef") ?? "")) ?? "/iller");
}

export async function kayitEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  if (sinirAsildi(`kayit:${await istemciIp()}`, ayar("YKH_SINIR_KAYIT", 5), 60 * DK)) {
    log.uyari("hiz_siniri", { eylem: "kayit" });
    return { ok: false, mesaj: COK_FAZLA };
  }
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
  // Misafir yenilenerek gönderen kotası atlanmasın: misafir açma IP başına sınırlı.
  if (sinirAsildi(`misafir:${await istemciIp()}`, ayar("YKH_SINIR_MISAFIR", 10), 60 * DK)) {
    log.uyari("hiz_siniri", { eylem: "misafir" });
    return { ok: false, mesaj: COK_FAZLA };
  }
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

  // Her öneri bir model işi doğurur. IP sınırı süreç içi; gönderen kotası
  // veritabanında ve atomik (`oneriOlustur`).
  if (sinirAsildi(`oneri-ip:${await istemciIp()}`, ayar("YKH_SINIR_ONERI_IP", 20), 60 * DK)) {
    log.uyari("hiz_siniri", { eylem: "oneri" });
    return { ok: false, mesaj: COK_FAZLA };
  }

  const b = await baglam();
  const d = await donemGetir(b, il);
  if (!d) return { ok: false, mesaj: "Bu il için açık bir dönem yok." };

  const kota = onaylayabilir(k.rol) ? undefined : ayar("YKH_KOTA_ONERI_GUNLUK", 10);
  let o: { id: number };
  try {
    o = await oneriOlustur(b, {
    donemId: d.donemId,
    baslik,
    gerekce,
    // "Merkez" varsayılanı YOK: her ilin Merkez ilçesi yok (Manisa:
    // Şehzadeler / Yunusemre). Uydurma ilçe adı yazmak yerine boş bırakılıyor.
    ilce: ilce || null,
    naceKod: String(f.get("naceKod") ?? "") || null,
  }, kota);
  } catch (e) {
    if (!(e instanceof KotaAsildi)) throw e;
    return { ok: false, mesaj: `Son 24 saatte en fazla ${kota} öneri gönderebilirsiniz. Bu sınıra ulaştınız; daha sonra yeniden deneyin.` };
  }
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
  // Yalnızca kuyruktaki öneri: onaylanmış ya da reddedilmiş bir kararı elle
  // tetik sessizce `onay_bekliyor`a çekemez.
  if (sahip.durum !== "degerlendiriliyor") {
    return { ok: false, mesaj: "Öneri değerlendirme kuyruğunda değil; sayfayı yenileyin." };
  }

  const s = await degerlendirmeYap(SERVIS, oneriId);
  revalidatePath(`/oneri/${oneriId}`);
  revalidatePath("/onay");
  if (!s.ok) return { ok: false, mesaj: `${ASAMA_ETIKET[s.asama]}: ${s.mesaj}` };
  return { ok: true, mesaj: `Değerlendirme tamam — ${s.mesaj}` };
}

const ASAMA_ETIKET: Record<string, string> = {
  oneri: "Öneri okunamadı",
  mesgul: "Zaten çalışıyor",
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

  // Formdaki `mevcut` ön kontrol ve "ekran eskidi mi" işaretidir; asıl geçiş
  // kuralı `durumDegistir` içinde VERİTABANINDAKİ durumla uygulanır.
  const izin = gecisIzinli(mevcut, yeni, k.rol);
  if (!izin.izinli) return { ok: false, mesaj: izin.sebep };
  if (izin.gecis.gerekceZorunlu && gerekce.length < 10) {
    return { ok: false, mesaj: `“${izin.gecis.eylem}” için gerekçe zorunlu (en az 10 karakter).` };
  }

  const r = await durumDegistir(await baglam(), Number(f.get("oneriId")), mevcut, yeni, gerekce);
  if (!r.ok) return { ok: false, mesaj: r.mesaj };
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
    // Boş alan 0 DEĞİLDİR: `Number("")` ve `Number(null)` sıfır verir.
    const ham = f.get(kr);
    if (typeof ham !== "string" || !ham.trim()) return { ok: false, mesaj: `${kr}: puan boş bırakılamaz.` };
    const v = Number(ham);
    if (!Number.isInteger(v) || v < 0 || v > 100) return { ok: false, mesaj: `${kr}: 0–100 arası tam sayı girin.` };
    puanlar[kr] = v;
  }

  if (!(await puanDuzelt(await baglam(), Number(f.get("oneriId")), puanlar, gerekce))) {
    return { ok: false, mesaj: "Değerlendirme bulunamadı; puan düzeltilmedi." };
  }
  revalidatePath(String(f.get("yol") ?? "/onay"));
  return { ok: true, mesaj: "Puan düzeltildi. AI'nin ham puanı kayıtta korunuyor." };
}

export async function naceEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };
  const kod = String(f.get("naceKod") ?? "").trim();
  if (!kod) return { ok: false, mesaj: "NACE kodu seçin." };

  if (!(await naceDuzelt(await baglam(), Number(f.get("oneriId")), kod))) {
    return { ok: false, mesaj: "Öneri bulunamadı; NACE düzeltilmedi." };
  }
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

  // Kapsam AÇIKÇA seçilir: varsayılan "ulusal" bir bölge planını sessizce
  // bütün illerin paketine sokuyordu. Biçim: ulusal | ajans:TR33 | il:usak
  const tur = String(f.get("tur") ?? "");
  const [kapsamTur, kapsamKod] = String(f.get("kapsam") ?? "").split(":");
  if (!tur) return { ok: false, mesaj: "Belge türünü seçin." };
  if (!["ulusal", "ajans", "il"].includes(kapsamTur) || (kapsamTur !== "ulusal" && !kapsamKod)) {
    return { ok: false, mesaj: "Kapsamı seçin: ulusal, bir ajans bölgesi ya da bir il." };
  }
  if (tur === "bolge_plani" && kapsamTur === "ulusal") {
    return { ok: false, mesaj: "Bölge planı ulusal kapsamda yüklenemez; ajans bölgesini seçin." };
  }

  const r = await belgeEkle(await baglam(), {
    ad,
    tur,
    yil: String(f.get("yil") ?? "") || null,
    ajansKod: kapsamTur === "ajans" ? kapsamKod : null,
    ilKod: kapsamTur === "il" ? kapsamKod : null,
    metin,
  });
  if (!r.ok) return { ok: false, mesaj: r.hata };
  revalidatePath("/belgeler");
  return {
    ok: true,
    mesaj: `“${ad}” eklendi (${metin.length} karakter, ${r.parca} parça). Yeni öneriler bu belgeye dayanabilir.`,
  };
}

export async function belgeSilEylemi(ad: string): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) return { ok: false, mesaj: "Bu işlem yalnızca ajans rolünde." };
  const parca = await belgeSil(await baglam(), ad);
  if (!parca) return { ok: false, mesaj: `“${ad}” bulunamadı.` };
  revalidatePath("/belgeler");
  return { ok: true, mesaj: `“${ad}” silindi (${parca} parça). Yeni değerlendirmeler buna dayanamaz.` };
}

// ── KVKK: kişisel veriyi açma ve silme ─────────────────────────────────────

/**
 * Tek bir kimliğin açık hâlini döndürür. Yalnızca yönetici.
 *
 * Listede maskeli duran veriyi açmak ayrı bir eylemdir ve GEREKÇE ister:
 * denetim izine "kim, ne zaman, kimin verisini, NEDEN açtı" yazılır. KVKK'nın
 * istediği amaç sınırlılığı bu — yetkiyi kaldırmak değil, kullanımını
 * kayıt altına almak.
 */
export async function kimlikAcEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Kişisel veriyi yalnızca yönetici açabilir." };

  const ref = String(f.get("ref") ?? "");
  const gerekce = String(f.get("gerekce") ?? "").trim();
  if (gerekce.length < 8) return { ok: false, mesaj: "Erişim gerekçesi yazın (en az 8 karakter); denetime yazılacak." };

  const kimlik = await kimlikAc(await baglam(), ref, gerekce);
  if (!kimlik) return { ok: false, mesaj: "Kayıt bulunamadı." };

  log.info("kimlik_goruntulendi", { ref });
  revalidatePath("/ayarlar");
  return { ok: true, mesaj: `${kimlik.eposta ?? "—"} · ${kimlik.ad_soyad ?? "—"}` };
}

/**
 * KVKK silme talebi. Kimlik silinir, öneri zinciri korunur.
 *
 * Geri alınamaz: e-posta, ad ve parola özeti kalıcı olarak gider, oturumlar
 * kapanır. Onay kutusu bu yüzden var — düğmeye yanlışlıkla basılabilir.
 */
export async function kimlikSilEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Bu işlemi yalnızca yönetici yapabilir." };
  if (f.get("onay") !== "evet") return { ok: false, mesaj: "Geri alınamaz işlem: onay kutusunu işaretleyin." };

  const ref = String(f.get("ref") ?? "");
  if (ref === k.ref) return { ok: false, mesaj: "Kendi kimliğinizi silemezsiniz; oturumunuz kapanır ve işlem sahipsiz kalır." };

  await kimlikSil(await baglam(), ref);
  log.info("kimlik_pseudonimlestirildi", { ref });
  revalidatePath("/ayarlar");
  return { ok: true, mesaj: "Kişisel veri silindi; öneri ve sıralama zinciri korundu." };
}

/**
 * Rol ataması — yalnızca yönetici, kendi rolü hariç.
 *
 * Kendi rolünü değiştirmek tek yöneticiyi kilitleyip sistemi yönetilemez
 * bırakabilir; ikinci bir yönetici hesabından yapılsın.
 */
export async function rolAtaEylemi(_o: EylemSonucu | null, f: FormData): Promise<EylemSonucu> {
  const k = await kullanici();
  if (!k || k.rol !== "yonetici") return { ok: false, mesaj: "Rol atamasını yalnızca yönetici yapabilir." };

  const ref = String(f.get("ref") ?? "");
  if (ref === k.ref) return { ok: false, mesaj: "Kendi rolünüzü değiştiremezsiniz; başka bir yönetici hesabından yapın." };

  const rol = String(f.get("rol") ?? "");
  if (!ROLLER.includes(rol as Rol)) return { ok: false, mesaj: "Tanınmayan rol." };

  const ajansKod = String(f.get("ajansKod") ?? "") || null;
  if (rol === "ajans" && !ajansKod) {
    return { ok: false, mesaj: "Ajans rolü için bölge seçin; bölgesiz hesap toplu raporda hiçbir satır göremez." };
  }

  if (!(await rolAta(await baglam(), ref, rol as Rol, ajansKod))) {
    return { ok: false, mesaj: "Kayıt bulunamadı ya da yetki reddedildi." };
  }
  log.info("rol_atandi", { ref, rol, ajansKod });
  revalidatePath("/ayarlar");
  return { ok: true, mesaj: `Rol ${ROL_ETIKET[rol as Rol]} olarak güncellendi.` };
}

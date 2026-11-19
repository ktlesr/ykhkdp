import postgres from "postgres";
import { ROLLER, type Rol } from "@ykh/domain";
import { denetle, islem, type Baglam } from "./baglanti.ts";
import { parolaOzetle } from "./parola.ts";

type Sonuc = { ok: boolean; mesaj: string };

function epostaGecerli(eposta: string): boolean {
  return eposta.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta);
}

/** Yönetici hesabını değiştirmeden, oturum açılmamış bir kullanıcı oluşturur. */
export async function kullaniciEkle(
  b: Baglam,
  g: { eposta: string; adSoyad: string; parola: string; rol: Rol; ajansKod: string | null },
): Promise<Sonuc> {
  if (b.rol !== "yonetici") return { ok: false, mesaj: "Bu işlemi yalnızca yönetici yapabilir." };
  const eposta = g.eposta.trim().toLowerCase();
  const ad = g.adSoyad.trim();
  if (!epostaGecerli(eposta)) return { ok: false, mesaj: "Geçerli bir e-posta yazın." };
  if (ad.length < 3) return { ok: false, mesaj: "Ad soyad en az 3 karakter olmalı." };
  if (g.parola.length < 10) return { ok: false, mesaj: "Parola en az 10 karakter olmalı." };
  if (!ROLLER.includes(g.rol)) return { ok: false, mesaj: "Tanınmayan rol." };
  if (g.rol === "ajans" && !g.ajansKod) return { ok: false, mesaj: "Ajans rolü için bölge seçin." };

  const ozet = await parolaOzetle(g.parola);
  try {
    return await islem(b, async (sql) => {
      if (g.rol === "ajans") {
        const ajans = await sql`select kod from ajans where kod = ${g.ajansKod}`;
        if (!ajans.length) return { ok: false, mesaj: "Geçerli bir ajans bölgesi seçin." };
      }
      const [k] = await sql<{ ref: string }[]>`
        insert into gonderen (rol, ajans_kod)
        values (${g.rol}::rol, ${g.rol === "ajans" ? g.ajansKod : null}) returning ref
      `;
      await sql`
        insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash)
        values (${k.ref}, ${eposta}, ${ad}, ${ozet})
      `;
      await denetle(sql, b, "kullanici_eklendi", "gonderen", k.ref, { rol: g.rol });
      return { ok: true, mesaj: "Kullanıcı oluşturuldu." };
    });
  } catch (e) {
    if (e instanceof postgres.PostgresError && e.code === "23505" && e.constraint_name === "kimlik_eposta_uniq") {
      return { ok: false, mesaj: "Bu e-posta zaten kayıtlı." };
    }
    throw e;
  }
}

/** Boş alanları korur; maskeli değerler gerçek kimlik alanlarına yazılmaz. */
export async function kullaniciGuncelle(
  b: Baglam,
  ref: string,
  g: { eposta: string; adSoyad: string },
): Promise<Sonuc> {
  if (b.rol !== "yonetici") return { ok: false, mesaj: "Bu işlemi yalnızca yönetici yapabilir." };
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(ref)) return { ok: false, mesaj: "Geçersiz kullanıcı." };
  const eposta = g.eposta.trim().toLowerCase();
  const ad = g.adSoyad.trim();
  if (!eposta && !ad) return { ok: false, mesaj: "Güncellenecek ad soyad veya e-posta yazın." };
  if (eposta && !epostaGecerli(eposta)) return { ok: false, mesaj: "Geçerli bir e-posta yazın." };
  if (ad && ad.length < 3) return { ok: false, mesaj: "Ad soyad en az 3 karakter olmalı." };

  try {
    return await islem(b, async (sql) => {
      const yazilan = await sql`
        update kimlik set eposta = coalesce(${eposta || null}::citext, eposta),
                          ad_soyad = coalesce(${ad || null}::text, ad_soyad)
        where gonderen_ref = ${ref} and not pseudonimlestirildi returning gonderen_ref
      `;
      if (!yazilan.length) return { ok: false, mesaj: "Kayıt bulunamadı veya kimlik silinmiş." };
      await denetle(sql, b, "kullanici_guncellendi", "gonderen", ref, { eposta: Boolean(eposta), ad_soyad: Boolean(ad) });
      return { ok: true, mesaj: "Kullanıcı bilgileri güncellendi." };
    });
  } catch (e) {
    if (e instanceof postgres.PostgresError && e.code === "23505" && e.constraint_name === "kimlik_eposta_uniq") {
      return { ok: false, mesaj: "Bu e-posta zaten kayıtlı." };
    }
    throw e;
  }
}

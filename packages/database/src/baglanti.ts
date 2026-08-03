import postgres from "postgres";
import type { Rol } from "@ykh/domain";

/**
 * Veri erişim katmanı.
 *
 * İki bağlantı vardır ve karıştırılmaları kaza değil, hata olmalıdır:
 *
 *  - `sahip()`   — şema sahibi. YALNIZCA migration ve seed. RLS'i baypas eder.
 *  - `uygulama()` — `ykh_app` rolü. RLS uygulanır. Web ve worker bunu kullanır.
 *
 * Her istek `islem()` içinde çalışır ve `SET LOCAL` ile rol/kimlik bağlar.
 * Bağlamsız sorgu anonim sayılır ve yalnızca kamuya açık satırları görür.
 */

export type Baglam = {
  gonderenRef: string | null;
  rol: Rol | "anonim";
};

export const ANONIM: Baglam = { gonderenRef: null, rol: "anonim" };

const varsayilanSahip = "postgres://ykh_owner:ykh_dev_parola@localhost:5470/ykhkdp";
const varsayilanUygulama = "postgres://ykh_app:ykh_app_parola@localhost:5470/ykhkdp";

const YEREL = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Hata mesajında adresi gösterirken parolayı siler.
 *
 * Açgözlü `.*@` SON `@` işaretine kadar alıyor — bilerek: bozuk adresin sebebi
 * çoğu zaman paroladaki özel karakter ve o parolanın içinde `@` ya da `/`
 * olabiliyor. Dar bir kalıp (`[^:@/]*`) tam da o durumda tutmuyor ve parola
 * log'a düşüyordu (yakalandı: `pa/rola` maskelenmeden yazıldı).
 */
function adresMaskele(adres: string): string {
  return adres.replace(/\/\/([^:/@]*):.*@/, "//$1:***@");
}

/**
 * ÜRETİMDE YEREL ADRESE BAĞLANMAYI REDDEDER.
 *
 * Yaşanmış kusur: üretimde her sayfa 500 döndü ve tarayıcıda yalnızca "A
 * server error occurred" yazdı. Logda `ECONNREFUSED 127.0.0.1:5470` sel gibi
 * akıyordu ama sebebi hiçbir yerde yazmıyordu. İki yoldan biri olmuştu:
 *
 *   1. `DATABASE_URL` hiç verilmemiş → aşağıdaki YEREL VARSAYILAN devreye
 *      giriyor. Geliştirme için doğru, üretim için sessiz bir felaket.
 *   2. Dokploy'un ortam sekmesine yerel `.env` içeriği yapıştırılmış ve
 *      geliştirme adresi üretimi ezmiş.
 *
 * İkisi de artık AÇIK BİR HATAYLA duruyor. Yerel adrese bağlanmayı denemek
 * üretimde hiçbir zaman doğru değil: uygulama ile veritabanı ayrı
 * konteynerler, `localhost` konteynerin kendisi demek.
 *
 * Kural yalnızca `NODE_ENV=production` altında işler; test ve geliştirme
 * yerel veritabanıyla çalışmaya devam eder.
 */
function adresSec(ad: string, varsayilan: string): string {
  const deger = process.env[ad]?.trim();
  if (process.env.NODE_ENV !== "production") return deger || varsayilan;

  if (!deger) {
    throw new Error(
      `${ad} üretimde tanımlı değil. Koddaki varsayılan yerel geliştirme ` +
        "adresidir (localhost:5470) ve üretimde kullanılamaz.",
    );
  }
  let sunucu: string;
  try {
    sunucu = new URL(deger).hostname;
  } catch {
    /**
     * İki ayrı sebep aynı hataya çıkıyor ve ikisi de sık: paroladaki özel
     * karakter, ve sunucu adının boş kalması (compose adresi parçalardan
     * kurarken `YKH_DB_SUNUCU` verilmemişse `…@:5432/…` çıkıyor ve `new URL`
     * bunu da reddediyor). Hangisi olduğunu bilemediğimiz için ikisini de
     * söylüyoruz — tek sebebi suçlamak yanlış yere baktırır.
     */
    throw new Error(
      `${ad} geçerli bir bağlantı adresi değil (${adresMaskele(deger)}). ` +
        "İki sık sebep: (1) paroladaki `/` `@` `:` karakteri adresi bozuyor — " +
        "parolayı harf+rakam yapın; (2) sunucu adı boş, yani `YKH_DB_SUNUCU` " +
        "tanımlı değil. Alternatif: Dokploy'un verdiği tam bağlantı adresini " +
        `${ad} olarak yapıştırın.`,
    );
  }
  if (!sunucu) {
    /**
     * `postgres://ykh_app:parola@:5432/veritabani` — sunucu adı boş.
     * Compose adresi parçalardan kurarken `YKH_DB_SUNUCU` boş kalmışsa böyle
     * çıkıyor ve `new URL` buna itiraz etmiyor. Bağlantı denemesi anlamsız
     * bir hataya (`ECONNREFUSED`) düşerdi; eksik olanı adıyla söylüyoruz.
     */
    throw new Error(
      `${ad} içinde sunucu adı yok. Compose adresi parçalardan kuruyor: ` +
        "`YKH_DB_SUNUCU` ve `YKH_DB_ADI` tanımlı olmalı. Alternatif olarak " +
        `Dokploy'un verdiği tam bağlantı adresini ${ad} olarak yapıştırın.`,
    );
  }
  if (YEREL.has(sunucu)) {
    throw new Error(
      `${ad} üretimde YEREL adrese bakıyor (${sunucu}). Konteynerin içinde ` +
        "`localhost` konteynerin kendisidir; veritabanı orada değil. En sık " +
        "sebep: yerel `.env` dosyasının Dokploy ortam sekmesine yapıştırılması. " +
        "`DATABASE_URL` ve `DATABASE_URL_OWNER` satırlarını oradan SİLİN — " +
        "compose adresi `YKH_DB_SUNUCU` ve parolalardan kendisi kurar.",
    );
  }
  return deger;
}

/**
 * Havuzlar `globalThis` üzerinde tutulur.
 *
 * Modül düzeyi değişken yetmiyor: dev sunucusu her sıcak yenilemede modülü
 * yeniden değerlendiriyor, eski havuz kapanmadan yenisi açılıyor ve Postgres
 * `remaining connection slots are reserved` ile reddedene kadar birikiyor
 * (ölçüldü: 97 boşta bağlantı). Global anahtar yenilemeler arasında yaşar.
 */
const HAVUZ = Symbol.for("ykh.havuz");
type Havuz = { sahip?: postgres.Sql; uygulama?: postgres.Sql };
const havuz: Havuz = ((globalThis as Record<symbol, unknown>)[HAVUZ] ??= {}) as Havuz;

export function sahip(): postgres.Sql {
  // ponytail: prepare:false — migration/seed sık çalışmaz, ama şema değişince
  // hazırlanmış ifadeler eski tip OID'lerine takılıyor ("cache lookup failed").
  havuz.sahip ??= postgres(adresSec("DATABASE_URL_OWNER", varsayilanSahip), {
    onnotice: () => {},
    max: 5,
    prepare: false,
  });
  return havuz.sahip;
}

export function uygulama(): postgres.Sql {
  havuz.uygulama ??= postgres(adresSec("DATABASE_URL", varsayilanUygulama), {
    onnotice: () => {},
    max: 10,
    idle_timeout: 30,
    transform: { undefined: null },
    // ponytail: hazırlanmış ifade önbelleği kapalı. Migration sonrası
    // "cached plan must not change result type" hatasını tamamen kaldırıyor;
    // bedeli sorgu başına bir parse. Ölçülebilir bir darboğaz olursa
    // prepare:true + migration'da havuz yenileme yoluna geçilir.
    prepare: false,
  });
  return havuz.uygulama;
}

export async function kapat(): Promise<void> {
  await Promise.all([havuz.sahip?.end(), havuz.uygulama?.end()]);
  havuz.sahip = undefined;
  havuz.uygulama = undefined;
}

/**
 * Bağlamlı işlem. `SET LOCAL` transaction kapsamındadır; havuzdaki bağlantı
 * bir sonraki isteğe önceki kimliği taşıyamaz.
 */
export async function islem<T>(baglam: Baglam, isGovde: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = uygulama();
  return sql.begin(async (tx) => {
    await tx`select set_config('app.rol', ${baglam.rol}, true)`;
    await tx`select set_config('app.gonderen_ref', ${baglam.gonderenRef ?? ""}, true)`;
    return isGovde(tx as unknown as postgres.Sql);
  }) as Promise<T>;
}

/** Denetim kaydı — append-only tabloya yazar (brief §4). */
export async function denetle(
  sql: postgres.Sql,
  baglam: Baglam,
  eylem: string,
  nesneTip: string,
  nesneId: string | number | null,
  detay: Record<string, unknown> = {},
): Promise<void> {
  await sql`
    insert into denetim (aktor_ref, aktor_rol, eylem, nesne_tip, nesne_id, detay)
    values (
      ${baglam.gonderenRef},
      ${baglam.rol === "anonim" ? null : baglam.rol}::rol,
      ${eylem}, ${nesneTip}, ${nesneId === null ? null : String(nesneId)},
      ${sql.json(detay as never)}
    )
  `;
}

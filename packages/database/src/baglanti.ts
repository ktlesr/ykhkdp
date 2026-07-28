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

let _sahip: postgres.Sql | undefined;
let _uygulama: postgres.Sql | undefined;

export function sahip(): postgres.Sql {
  // ponytail: prepare:false — migration/seed sık çalışmaz, ama şema değişince
  // hazırlanmış ifadeler eski tip OID'lerine takılıyor ("cache lookup failed").
  _sahip ??= postgres(process.env.DATABASE_URL_OWNER ?? varsayilanSahip, {
    onnotice: () => {},
    prepare: false,
  });
  return _sahip;
}

export function uygulama(): postgres.Sql {
  _uygulama ??= postgres(process.env.DATABASE_URL ?? varsayilanUygulama, {
    onnotice: () => {},
    max: 10,
    transform: { undefined: null },
    // ponytail: hazırlanmış ifade önbelleği kapalı. Migration sonrası
    // "cached plan must not change result type" hatasını tamamen kaldırıyor;
    // bedeli sorgu başına bir parse. Ölçülebilir bir darboğaz olursa
    // prepare:true + migration'da havuz yenileme yoluna geçilir.
    prepare: false,
  });
  return _uygulama;
}

export async function kapat(): Promise<void> {
  await Promise.all([_sahip?.end(), _uygulama?.end()]);
  _sahip = undefined;
  _uygulama = undefined;
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

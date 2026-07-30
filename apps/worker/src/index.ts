import { islem, kapat, type Baglam } from "@ykh/database";
import { degerlendirmeYap } from "@ykh/degerlendirme";
import { log } from "@ykh/observability";

/**
 * Worker: `degerlendiriliyor` durumundaki önerileri sırayla değerlendirir.
 *
 * ponytail: ayrı iş kuyruğu tablosu YOK. `oneri.durum = 'degerlendiriliyor'`
 * kuyruğun kendisidir; `for update skip locked` birden çok worker'da da doğru
 * çalışır.
 *
 * Worker olmasa da sistem tıkanmaz: web'deki "şimdi değerlendir" butonu aynı
 * `degerlendirmeYap()` fonksiyonunu çağırır.
 */

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };
const ARALIK = Number(process.env.YKH_WORKER_ARALIK ?? 2000);
export const MAKS_DENEME = 3;

let calisiyor = true;

export async function birOneriAl(): Promise<number | null> {
  return islem(SERVIS, async (sql) => {
    const [o] = await sql<{ id: number }[]>`
      update oneri set deneme = deneme + 1, guncellendi = now()
      where id = (
        select id from oneri
        where durum = 'degerlendiriliyor' and deneme < ${MAKS_DENEME}
        order by olusturuldu
        for update skip locked
        limit 1
      )
      returning id
    `;
    return o ? Number(o.id) : null;
  });
}

export async function hataYaz(oneriId: number, hata: string): Promise<void> {
  await islem(SERVIS, (sql) => sql`update oneri set son_hata = ${hata} where id = ${oneriId}`);
}

async function turAt(): Promise<boolean> {
  const oneriId = await birOneriAl();
  if (oneriId === null) return false;

  try {
    const s = await degerlendirmeYap(SERVIS, oneriId);
    log.info("degerlendirme_turu", { oneriId, asama: s.asama, ok: s.ok, mesaj: s.mesaj });
    // Başarısızsa öneri `degerlendiriliyor` kalır ve MAKS_DENEME'ye kadar
    // tekrar denenir; nedeni hem son_hata'da hem denetim izinde durur.
    if (!s.ok) await hataYaz(oneriId, `${s.asama}: ${s.mesaj}`);
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    await hataYaz(oneriId, mesaj);
    log.hata("degerlendirme_hatasi", { oneriId, hata: mesaj });
  }
  return true;
}

export async function dongu(): Promise<void> {
  log.info("worker_basladi", { aralik: ARALIK, maksDeneme: MAKS_DENEME });
  while (calisiyor) {
    try {
      if (await turAt()) continue;
    } catch (e) {
      log.hata("worker_dongu_hatasi", { hata: e instanceof Error ? e.message : String(e) });
    }
    await new Promise((r) => setTimeout(r, ARALIK));
  }
  await kapat();
  log.info("worker_durdu", {});
}

for (const sinyal of ["SIGINT", "SIGTERM"] as const) {
  process.on(sinyal, () => {
    log.info("worker_kapaniyor", { sinyal });
    calisiyor = false;
  });
}

if (process.argv[1]?.endsWith("index.ts")) await dongu();

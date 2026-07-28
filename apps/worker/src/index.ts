import { islem, kapat, type Baglam } from "@ykh/database";
import { log } from "@ykh/observability";
import { ISLER, type IsKaydi } from "./isler.ts";

/**
 * İş kuyruğu çalıştırıcısı.
 *
 * ponytail: BullMQ/Redis yok. Postgres `select ... for update skip locked`
 * tek makinede de, birden çok worker'da da doğru çalışıyor ve zaten elimizde
 * olan bir bağımlılık. Saniyede binlerce iş gerekirse Redis gelir.
 */

const SERVIS: Baglam = { gonderenRef: null, rol: "sistem_yoneticisi" };
const ARALIK = Number(process.env.YKH_WORKER_ARALIK ?? 2000);
const MAKS_DENEME = 3;

let calisiyor = true;

export async function birIsAl(): Promise<IsKaydi | null> {
  return islem(SERVIS, async (sql) => {
    const [is] = await sql<IsKaydi[]>`
      update is_kuyrugu set durum = 'calisiyor', deneme = deneme + 1, guncellendi = now()
      where id = (
        select id from is_kuyrugu where durum = 'bekliyor'
        order by id for update skip locked limit 1
      )
      returning id, tip, yuk
    `;
    return is ?? null;
  });
}

export async function isiTamamla(id: number, sonuc: string): Promise<void> {
  await islem(SERVIS, (sql) =>
    sql`update is_kuyrugu set durum = 'tamam', hata = ${sonuc}, guncellendi = now() where id = ${id}`,
  );
}

export async function isiBasarisizYap(id: number, hata: string, deneme: number): Promise<void> {
  await islem(SERVIS, (sql) =>
    sql`
      update is_kuyrugu
      set durum = ${deneme >= MAKS_DENEME ? "hata" : "bekliyor"}::is_durumu, hata = ${hata}, guncellendi = now()
      where id = ${id}
    `,
  );
}

export async function isKuyruguna(tip: string, yuk: Record<string, unknown>, b: Baglam = SERVIS): Promise<number> {
  return islem(b, async (sql) => {
    const [r] = await sql<{ id: number }[]>`
      insert into is_kuyrugu (tip, yuk) values (${tip}, ${sql.json(yuk as never)}) returning id
    `;
    return r.id;
  });
}

async function turAt(): Promise<boolean> {
  const is = await birIsAl();
  if (!is) return false;

  const isFn = ISLER[is.tip];
  if (!isFn) {
    await isiBasarisizYap(is.id, `Bilinmeyen iş tipi: ${is.tip}`, MAKS_DENEME);
    return true;
  }
  try {
    const sonuc = await isFn(SERVIS, is.yuk);
    await isiTamamla(is.id, sonuc);
    log.info("is_tamam", { id: is.id, tip: is.tip, sonuc });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    const [{ deneme }] = await islem(SERVIS, (sql) =>
      sql<{ deneme: number }[]>`select deneme from is_kuyrugu where id = ${is.id}`,
    );
    await isiBasarisizYap(is.id, mesaj, deneme);
    log.hata("is_hata", { id: is.id, tip: is.tip, hata: mesaj, deneme });
  }
  return true;
}

export async function dongu(): Promise<void> {
  log.info("worker_basladi", { aralik: ARALIK, isTipleri: Object.keys(ISLER) });
  while (calisiyor) {
    try {
      // Kuyruk doluysa ara vermeden devam et.
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

// Doğrudan çalıştırıldıysa döngüyü başlat (test dosyası import ederse başlatmaz).
if (process.argv[1]?.endsWith("index.ts")) await dongu();

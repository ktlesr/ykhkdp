import { islem, kapat, kaynaklariDenetle, type Baglam } from "@ykh/database";
import { birKesifAl, degerlendirmeYap, kesifHatasi, kesifYap, KILIT, onTarama } from "@ykh/degerlendirme";
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
// `||` bilerek: compose tanımsız bir değişkeni BOŞ DİZGE olarak geçiriyor ve
// `??` boş dizgeyi yakalamaz — `Number("")` sıfır verir, döngü CPU'yu yakardı.
const ARALIK = Number(process.env.YKH_WORKER_ARALIK || 2000);
export const MAKS_DENEME = 3;

let calisiyor = true;

export async function birOneriAl(): Promise<number | null> {
  return islem(SERVIS, async (sql) => {
    const [o] = await sql<{ id: number }[]>`
      update oneri set deneme = deneme + 1, guncellendi = now()
      where id = (
        select id from oneri
        where durum = 'degerlendiriliyor' and deneme < ${MAKS_DENEME}
          -- Elle tetikle şu an işlenen öneri atlanır; yoksa en eski öneri
          -- meşgulken arkasındaki bütün kuyruk onu beklerdi.
          and not exists (
            select 1 from pg_locks l
            where l.locktype = 'advisory' and l.objsubid = 2
              -- pg_locks küme genelidir: yalnızca BU veritabanının kilitleri.
              and l.database = (select oid from pg_database where datname = current_database())
              and l.classid::text::int = ${KILIT} and l.objid::text::int = oneri.id
          )
        -- id ile eşitlik kırılıyor: aynı transaction icinde eklenen öneriler
        -- aynı olusturuldu damgasını taşıyor ve sıra belirsiz kalıyordu.
        order by olusturuldu, id
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

/**
 * Keşif turu. Önce öneriler: keşif uzun sürer (bütün parçaları tarar) ve
 * yatırımcının bekleyen değerlendirmesini arkasında bekletmemeli.
 */
async function kesifTuru(): Promise<boolean> {
  const kesifId = await birKesifAl();
  // Keşif de yoksa boş vakit ön taramaya: yeni yüklenen belgeler keşif
  // başlamadan taranmış olur. Tur sınırlı; yeni öneri beklemez.
  if (kesifId === null) {
    try {
      return (await onTarama()) > 0;
    } catch (e) {
      log.hata("on_tarama_hatasi", { hata: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }
  try {
    const s = await kesifYap(kesifId);
    log.info("kesif_turu", { kesifId, ok: s.ok, mesaj: s.mesaj });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : String(e);
    await kesifHatasi(kesifId, mesaj);
    log.hata("kesif_hatasi", { kesifId, hata: mesaj });
  }
  return true;
}

async function turAt(): Promise<boolean> {
  const oneriId = await birOneriAl();
  if (oneriId === null) return false;

  try {
    const s = await degerlendirmeYap(SERVIS, oneriId);
    if (s.asama === "mesgul") {
      // Elle tetik aynı öneriyi işliyor: bu tur deneme sayılmaz, hata yazılmaz.
      await islem(SERVIS, (sql) => sql`update oneri set deneme = greatest(deneme - 1, 0) where id = ${oneriId}`);
      return false;
    }
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

/**
 * Öneri değerlendirmesi ile keşif BAĞIMSIZ döngülerde yürür. Tek döngüde
 * keşif (binlerce parça, dakikalar) sürerken yeni gelen öneri sırada
 * bekliyordu; toplu keşifte bu saatler demekti. `ESZAMANLI` öneri aynı anda
 * değerlendirilir (kilit havuzu `YKH_DEGERLENDIRME_ESZAMANLI` ile aynı sayı),
 * yanında tek keşif koşusu — keşif kendi içinde zaten eşzamanlı tarar.
 */
const ESZAMANLI = Math.max(1, Number(process.env.YKH_DEGERLENDIRME_ESZAMANLI) || 3);

async function surekli(ad: string, tur: () => Promise<boolean>): Promise<void> {
  while (calisiyor) {
    try {
      if (await tur()) continue;
    } catch (e) {
      log.hata("worker_dongu_hatasi", { dongu: ad, hata: e instanceof Error ? e.message : String(e) });
    }
    await new Promise((r) => setTimeout(r, ARALIK));
  }
}

/**
 * Dış veri kaynakları (coğrafi işaretler…): günde bir yoklanır, yalnızca
 * değişen il belgesi yeniden yazılır. `YKH_KAYNAK_SAAT=0` kapatır.
 */
const KAYNAK_SAAT = Number(process.env.YKH_KAYNAK_SAAT || 24);
async function kaynakDongusu(): Promise<void> {
  while (calisiyor && KAYNAK_SAAT > 0) {
    try {
      const r = await kaynaklariDenetle(SERVIS, KAYNAK_SAAT, () => calisiyor);
      if (r) log.info("kaynak_denetlendi", { sonuc: r });
    } catch (e) {
      log.hata("kaynak_hatasi", { hata: e instanceof Error ? e.message : String(e) });
    }
    // 10 dk; kapanış sinyalini bekletmemek için kısa dilimlerle uyur.
    for (let i = 0; i < 300 && calisiyor; i++) await new Promise((r) => setTimeout(r, 2000));
  }
}

export async function dongu(): Promise<void> {
  log.info("worker_basladi", { aralik: ARALIK, maksDeneme: MAKS_DENEME, eszamanli: ESZAMANLI });
  await Promise.all([...Array.from({ length: ESZAMANLI }, () => surekli("oneri", turAt)), surekli("kesif", kesifTuru), kaynakDongusu()]);
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

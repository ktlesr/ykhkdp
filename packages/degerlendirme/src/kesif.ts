import { adayKesfet, kanitCikar, modelSnapshot, PROMPTLAR, type Maliyet } from "@ykh/ai-gateway";
import { icerikDegil } from "./icerik-degil.ts";
import { modelSec } from "./model-secimi.ts";
import { denetle, islem, type Baglam } from "@ykh/database";
import { dengeliSec, MODEL_METIN_SINIRI, paketKur, yerelMi } from "@ykh/evidence-validation";
import { ayniKonuMu } from "@ykh/scoring";
import { aiMaliyeti, log } from "@ykh/observability";

/**
 * Aday keşfi — belgelerden yatırım konusu ADAYI üretir; puanlamaz, seçmez.
 *
 *   1. envanter  il + ajans + ulusal kapsamdaki BÜTÜN belge parçaları
 *   2. tarama    her parça bir kez taranır (il bağımsız, önbellekli):
 *                birebir doğrulanmış pasajlar → `kanit`
 *   3. aday      ilin kanıt defteri → model yalnızca numarayla atıf yapar;
 *                her aday ≥2 kanıt, ≥1 YEREL (mekanik kontrol)
 *   4. kayıt     aday sıradan `oneri` olur (`degerlendiriliyor`) ve mevcut
 *                değerlendirme hattından AYRI bir çağrıyla geçer
 *
 * Tarama eksik kalırsa aday üretilmez: "bütün belgeler dikkate alındı"
 * diyemeyeceğimiz bir koşu tamamlanmış gösterilmez. Sonraki koşu önbellekten
 * devam eder.
 */

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };

/** Parça metnini modelin gördüğü boyda, örtüşen pencerelere böler. */
const ORTUSME = 400;
export function pencerele(metin: string): string[] {
  if (metin.length <= MODEL_METIN_SINIRI) return [metin];
  const out: string[] = [];
  for (let i = 0; i < metin.length; i += MODEL_METIN_SINIRI - ORTUSME) {
    out.push(metin.slice(i, i + MODEL_METIN_SINIRI));
    if (i + MODEL_METIN_SINIRI >= metin.length) break;
  }
  return out;
}
/** Bir tarama çağrısındaki en çok pencere; pencere başına metin `MODEL_METIN_SINIRI`. */
const TARAMA_GRUBU = 3;
/** Aday aşamasına giren defter: yerel kanıtların tamamı (üst sınırla) + konuyla örtüşen ulusal kanıt. */
const YEREL_SINIR = 120;
/**
 * Tekrar eşikleri — gerçek aday çiftleriyle ölçüldü (2026-11-17):
 *   aynı konu, farklı yazım      0.48 – 0.67
 *   farklı konu                  0.06 – 0.30
 * Başlık eşiği 0.50: brif §7, farklı iki resmî konunun 0.48 alabildiğini
 * belgeliyor (Muş). 0.48'de kalan aynı-konu çifti (Deri OSB arıtma) aynı
 * kanıtlara dayandığı için kanıt örtüşmesi yakalar.
 */
const TEKRAR_BENZERLIK = 0.5;
/** Yeni adayın kanıtlarının en az yarısı önceki bir adayınkiyle aynıysa tekrar. */
const TEKRAR_KANIT = 0.5;
const ONCEKI_BASLIK_SINIRI = 40;
const DIGER_SINIR = 30;

type Kesif = {
  id: number; donem_id: number; il_kod: string; il: string; ajans_kod: string;
  tetikleyen_ref: string; tetikleyen_rol: "ajans" | "yonetici"; slot_sayisi: number;
};
type Parca = { id: number; ad: string; bolum: string | null; tur: string; yil: string | null; metin: string; il_kod: string | null };

export type KesifSonucu = { ok: boolean; mesaj: string; adaySayisi: number };

const durumYaz = (id: number, alanlar: Record<string, string | number | null>) =>
  islem(SERVIS, (sql) => sql`update kesif set ${sql(alanlar)}, guncellendi = now() where id = ${id}`);

const maliyetYaz = (m: Maliyet | undefined, promptSurum: string, ok: boolean) =>
  aiMaliyeti({ model: m?.model ?? modelSnapshot(), girdiToken: m?.girdiToken ?? 0, ciktiToken: m?.ciktiToken ?? 0, promptSurum, sonuc: ok ? "ok" : "red" });

export async function kesifYap(kesifId: number): Promise<KesifSonucu> {
  const [k] = await islem(SERVIS, (sql) =>
    sql<Kesif[]>`
      select k.id, k.donem_id, d.il_kod, i.ad as il, i.ajans_kod, k.tetikleyen_ref,
             g.rol::text as tetikleyen_rol, s.slot_sayisi
      from kesif k
      join donem d on d.id = k.donem_id
      join il i on i.kod = d.il_kod
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      join gonderen g on g.ref = k.tetikleyen_ref
      where k.id = ${kesifId}
    `,
  );
  if (!k) return { ok: false, mesaj: `Keşif bulunamadı: ${kesifId}`, adaySayisi: 0 };

  const bitir = async (ok: boolean, mesaj: string, adaySayisi = 0) => {
    await durumYaz(k.id, { durum: ok ? "tamam" : "hata", asama: null, mesaj });
    await islem(SERVIS, (sql) => denetle(sql, SERVIS, ok ? "kesif_tamamlandi" : "kesif_durdu", "kesif", k.id, { il: k.il_kod, mesaj, adaySayisi }));
    log.info("kesif_bitti", { kesifId: k.id, il: k.il_kod, ok, adaySayisi });
    return { ok, mesaj, adaySayisi };
  };

  // Aday üretimi yargı modeliyle; tarama önbelleği tarama modelinin künyesiyle.
  const { istemci, model } = await modelSec("yargi");
  const { model: taramaModeli } = await modelSec("tarama");
  const taramaSurum = PROMPTLAR.kanit_cikarimi.surum;

  // ── 1. Envanter ──────────────────────────────────────────────────────────
  await durumYaz(k.id, {
    asama: "envanter", mesaj: null, model_snapshot: taramaModeli === model ? model : `${model} · tarama ${taramaModeli}`,
    prompt_surum: `${taramaSurum}+${PROMPTLAR.aday_kesfi.surum}`,
  });
  const parcalar = (
    await islem(SERVIS, (sql) =>
      sql<Parca[]>`
        select id, ad, bolum, tur::text, yil, metin, il_kod from belge
        where il_kod = ${k.il_kod}
           or (il_kod is null and ajans_kod = ${k.ajans_kod})
           or (il_kod is null and ajans_kod is null)
        order by id
      `,
    )
  ).map((p) => ({ ...p, id: Number(p.id) }));
  if (!parcalar.length) return bitir(true, "Bu il için yüklenmiş belge yok; aday çıkarılamaz.");

  const taranmis = new Set(
    (
      await islem(SERVIS, (sql) =>
        sql<{ belge_id: string }[]>`
          select belge_id from kanit_tarama
          where prompt_surum = ${taramaSurum} and model_snapshot = ${taramaModeli} and durum = 'tamam'
            and belge_id in ${sql(parcalar.map((p) => p.id))}
        `,
      )
    ).map((r) => Number(r.belge_id)),
  );
  await durumYaz(k.id, { asama: "tarama", toplam_parca: parcalar.length, taranan_parca: taranmis.size });

  // ── 2. Tarama · önbellekte olmayan parçalar (eşzamanlı) ──────────────────
  const bekleyen = parcalar.filter((p) => !taranmis.has(p.id));
  const { basarisiz, basarisizIdler } = await parcalariTara(bekleyen, {
    kesifId: k.id,
    ilerleme: (n) => durumYaz(k.id, { taranan_parca: taranmis.size + n }),
  });
  /**
   * Okunamayan parça keşfi KİLİTLEMEZ ama GİZLENMEZ de: sayısı ve belgeleri
   * sonuç mesajında yazar, nedeni `kanit_tarama.neden`de durur. Önceki kural
   * ("tarama tamamlanmadan aday üretilmez") her yeniden başlatmada aynı
   * parçaya takılıyor ve il hiç aday üretemiyordu.
   */
  await durumYaz(k.id, { taranamayan: basarisiz });
  const okunamayan = basarisiz
    ? ` ${basarisiz} parça okunamadı ve kapsam dışında kaldı (${[
        ...new Set(basarisizIdler.map((id) => parcalar.find((p) => p.id === id)?.ad).filter(Boolean)),
      ].slice(0, 3).join(", ")}).`
    : "";

  // ── 3. Kanıt defteri ─────────────────────────────────────────────────────
  const [ilceler, kanitlar] = await Promise.all([
    islem(SERVIS, (sql) => sql<{ ad: string }[]>`select ad from ilce where il_kod = ${k.il_kod} order by ad`),
    islem(SERVIS, (sql) =>
      sql<{ id: string; belge_id: string; tur: string; konu: string; alinti: string }[]>`
        select id, belge_id, tur, konu, alinti from kanit
        where prompt_surum = ${taramaSurum} and model_snapshot = ${taramaModeli}
          and belge_id in ${sql(parcalar.map((p) => p.id))}
        order by id
      `,
    ),
  ]);
  const ilceAdlari = ilceler.map((x) => x.ad).filter((a) => a !== "Merkez");
  const hedef = { ilKod: k.il_kod, adlar: [k.il, ...ilceAdlari] };
  const parcaHaritasi = new Map(parcalar.map((p) => [p.id, p]));
  const defterHam = kanitlar.map((x) => {
    const p = parcaHaritasi.get(Number(x.belge_id))!;
    return {
      kanitId: Number(x.id), belgeId: p.id, tur: x.tur, konu: x.konu, metin: x.alinti,
      kaynak: `${p.ad}${p.bolum ? ` · ${p.bolum}` : ""}`,
      yerel: yerelMi({ metin: p.metin, ilKod: p.il_kod }, x.alinti, hedef),
    };
  });
  // Belgeler arasında dengeli: ilk N kanıt, defteri ilk taranan bir iki belgeye bırakıyordu.
  const yerel = dengeliSec(defterHam.filter((d) => d.yerel), (d) => parcaHaritasi.get(d.belgeId)!.ad, YEREL_SINIR);
  await durumYaz(k.id, { asama: "aday", kanit_sayisi: defterHam.length, yerel_kanit: yerel.length });
  if (!yerel.length) {
    return bitir(true, `${parcalar.length - basarisiz} parça tarandı, ${defterHam.length} kanıt bulundu ama hiçbiri bu ile özgü değil; "neden burada?" sorusuna dayanak olmadan aday üretilmez.${okunamayan}`);
  }

  // Yerel olmayan kanıt (ulusal öncelik, kısıt) yerel konularla örtüştüğü ölçüde girer.
  const terimler = new Set(
    yerel.flatMap((d) => d.konu.toLocaleLowerCase("tr-TR").split(/[^\p{L}]+/u).filter((w) => w.length >= 5)),
  );
  const ortusme = (d: (typeof defterHam)[number]) =>
    [...terimler].filter((t) => `${d.konu} ${d.metin}`.toLocaleLowerCase("tr-TR").includes(t)).length;
  const diger = defterHam
    .filter((d) => !d.yerel)
    .map((d) => ({ d, o: ortusme(d) }))
    .filter((x) => x.o > 0)
    .sort((a, b) => b.o - a.o || a.d.kanitId - b.d.kanitId)
    .slice(0, DIGER_SINIR)
    .map((x) => x.d);
  const defter = [...yerel, ...diger].map((d, i) => ({ ...d, no: i + 1 }));

  // ── 4. Aday üretimi ──────────────────────────────────────────────────────
  // Önceki resmî listeler: model bunları BAĞLAM olarak görür (kanıt değil).
  // Yürürlükteki listedeki konular zaten aday; listeden düşmüş bir konu ise
  // kanıtlar destekliyorsa başlığı değiştirilmeden yeniden önerilebilir.
  const resmi = await islem(SERVIS, (sql) =>
    sql<{ yil: number; baslik: string }[]>`
      select yil, baslik from yatirim_konusu where il_kod = ${k.il_kod} order by yil desc, sira
    `,
  );
  const sonYil = Math.max(0, ...resmi.map((r) => r.yil));
  // Bu dönemde zaten önerilmiş başlıklar (resmî konular hariç; onlar ayrıca
  // veriliyor). Model eşdeğerini yeniden önermesin — ilk katman.
  const donemBasliklari = (
    await islem(SERVIS, (sql) =>
      sql<{ baslik: string }[]>`
        select baslik from oneri where donem_id = ${k.donem_id} and koken = 'yeni'
        order by olusturuldu desc limit ${ONCEKI_BASLIK_SINIRI}
      `,
    )
  ).map((r) => r.baslik);
  const a = await adayKesfet(istemci, model, {
    oneriler: donemBasliklari,
    il: k.il,
    ilceler: ilceAdlari,
    defter,
    yururlukte: resmi.filter((r) => r.yil === sonYil).map((r) => r.baslik),
    onceki: resmi.filter((r) => r.yil < sonYil).map((r) => ({ yil: r.yil, baslik: r.baslik })),
  });
  maliyetYaz(a.maliyet, PROMPTLAR.aday_kesfi.surum, a.ok);
  if (!a.ok) {
    await islem(SERVIS, (sql) => denetle(sql, SERVIS, "aday_kesfi_reddedildi", "kesif", k.id, { asama: a.asama, hatalar: a.hatalar.slice(0, 5) }));
    return bitir(false, `Aday üretimi reddedildi (${a.asama}): ${a.hatalar[0] ?? ""}`);
  }

  // ── 5. Kayıt ─────────────────────────────────────────────────────────────
  await durumYaz(k.id, { asama: "kayit" });
  const tetikleyen: Baglam = { gonderenRef: k.tetikleyen_ref, rol: k.tetikleyen_rol };
  const kanitHaritasi = new Map(defter.map((d) => [d.kanitId, d]));
  const sinir = k.slot_sayisi * 2;
  const atlananlar: string[] = [];
  const desteklenen: string[] = [];
  const tekrarlar: Array<{ baslik: string; oncekiId: number; neden: string }> = [];
  let yazilan = 0;
  await islem(tetikleyen, async (sql) => {
    const donemdekiler = await sql<{ id: string; b: string; koken: string; durum: string; puanli: boolean; kanitlar: number[] | null }[]>`
      select o.id, lower(trim(o.baslik)) as b, o.koken::text, o.durum::text,
             exists (select 1 from degerlendirme g where g.oneri_id = o.id) as puanli,
             (select array_agg((x->>'kanit_id')::bigint) from jsonb_array_elements(o.kesif_kanit) x) as kanitlar
      from oneri o where o.donem_id = ${k.donem_id}
    `;
    const mevcut = new Set(donemdekiler.map((r) => r.b));
    for (const aday of a.adaylar) {
      if (yazilan >= sinir) break;
      const anahtar = aday.baslik.toLocaleLowerCase("tr-TR").trim();
      const kanit = aday.kanitIdleri.map((id) => {
        const d = kanitHaritasi.get(id)!;
        const p = parcaHaritasi.get(d.belgeId)!;
        return { kanit_id: id, belge_id: p.id, belge_ad: p.ad, bolum: p.bolum, tur: d.tur, konu: d.konu, alinti: d.metin, yerel: d.yerel };
      });
      /**
       * Yürürlükteki resmî konu OLDUĞU GİBİ önerildiyse kopya açılmaz: kanıtlar
       * o konunun kaydına eklenir (yürürlükteki liste gelecek yıl "önceki"
       * olacak; keşif onun devamını belgeyle destekleyebilmeli). Henüz
       * puanlanmamışsa değerlendirmeye alınır — başlık ve tebliğ gerekçesi
       * değişmez, puanlayıcı keşif kanıtlarını zorunlu görür.
       */
      const resmi = donemdekiler.find((r) => r.b === anahtar && r.koken === "mevcut");
      if (resmi) {
        await sql`update oneri set kesif_id = ${k.id}, kesif_kanit = ${sql.json(kanit as never)}, guncellendi = now() where id = ${resmi.id}`;
        if (resmi.durum === "listede" && !resmi.puanli) {
          await sql`
            update oneri set durum = 'degerlendiriliyor', onaylayan_ref = null, onay_zamani = null,
              deneme = 0, asama = null, son_hata = null, guncellendi = now()
            where id = ${resmi.id} and durum = 'listede'
          `;
          await denetle(sql, tetikleyen, "oneri_degerlendiriliyor", "oneri", resmi.id, {
            onceki: "listede", gerekce: "Keşif yürürlükteki resmî konuyu belgelerle destekledi; belgelere göre değerlendirmeye alındı.",
          });
        }
        desteklenen.push(aday.baslik);
        continue;
      }
      if (mevcut.has(anahtar)) {
        atlananlar.push(aday.baslik);
        continue;
      }
      /**
       * TEKRAR ELEMESİ — keşif tekrarlandıkça kuyruk şişmesin. Aynı dönemdeki
       * herhangi bir öneriyle (reddedilen dahil) aynı konuysa aday yazılmaz:
       *  · başlık benzerliği ≥ TEKRAR_BENZERLIK (pg_trgm), ya da
       *  · kanıt örtüşmesi ≥ TEKRAR_KANIT: aynı konu tekrar çıktığında aynı
       *    pasajlara dayanır; başlığı yeniden yazılsa da kanıt ele verir.
       */
      const [benzer] = await sql<{ id: string; baslik: string; benzerlik: number }[]>`
        select id, baslik, round(similarity(baslik, ${aday.baslik})::numeric, 2)::float8 as benzerlik
        from oneri where donem_id = ${k.donem_id} and similarity(baslik, ${aday.baslik}) >= ${TEKRAR_BENZERLIK}
        order by similarity(baslik, ${aday.baslik}) desc limit 1
      `;
      const yeniKanit = new Set(aday.kanitIdleri);
      const ortak = donemdekiler.find((r) => {
        const eski = (r.kanitlar ?? []).map(Number);
        if (!eski.length) return false;
        const kesisim = eski.filter((x) => yeniKanit.has(x)).length;
        return kesisim / Math.min(eski.length, yeniKanit.size) >= TEKRAR_KANIT;
      });
      // Üçüncü katman: "konunun özü" aynı — il adı ve "üretimi/imalatı/tesisi"
      // kalıbı atılınca aynı sözcükler (canlıda: "Emniyet Kemeri Üretimi" ↔
      // "Aksaray İli Emniyet Kemeri İmalatı Tesisi"; trigram ikisini ayırıyordu).
      const ozu = donemdekiler.find((r) => ayniKonuMu(r.b, anahtar, hedef.adlar));
      if (benzer || ortak || ozu) {
        tekrarlar.push({
          baslik: aday.baslik,
          oncekiId: Number(benzer?.id ?? ortak?.id ?? ozu!.id),
          neden: benzer ? `başlık benzerliği ${benzer.benzerlik}` : ortak ? "aynı kanıtlara dayanıyor" : "konunun özü aynı",
        });
        continue;
      }
      const r = await sql`
        insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, durum, kesif_id, kesif_kanit, kapsam)
        values (${k.donem_id}, ${k.tetikleyen_ref}, 'yeni', ${aday.baslik}, ${aday.gerekce},
                'degerlendiriliyor', ${k.id}, ${sql.json(kanit as never)},
                ${aday.urunGruplari.length ? sql.json(aday.urunGruplari.map((g) => ({ ad: g.ad, kanit_id: g.kanitIdleri, yerel: g.yerel })) as never) : null})
        on conflict do nothing
      `;
      if (r.count) {
        yazilan++;
        mevcut.add(anahtar);
        // Aynı koşunun sonraki adayları da bununla karşılaştırılsın.
        donemdekiler.push({ id: "0", b: anahtar, koken: "yeni", durum: "degerlendiriliyor", puanli: false, kanitlar: aday.kanitIdleri });
      }
    }
    await denetle(sql, tetikleyen, "kesif_adaylari_yazildi", "kesif", k.id, {
      yazilan, atlananlar, desteklenen, tekrarlar, dusenler: a.dusenler.slice(0, 10), model: a.modelSnapshot, promptSurum: a.promptSurum,
      not: "Adaylar doğrulanmamış; her biri ayrıca puanlanır ve ajans onayı bekler.",
    });
  });
  await durumYaz(k.id, { aday_sayisi: yazilan });

  // Düşen ürün grubu aday değildir; sayıya girmez (ayrıntısı denetimde).
  const dusenAday = a.dusenler.filter((m) => !m.startsWith("Ürün grubu")).length;
  const ozet =
    `${parcalar.length - basarisiz} parça tarandı, ${defterHam.length} kanıt (${yerel.length} yerel). ` +
    (yazilan ? `${yazilan} aday değerlendirmeye alındı.` : "Kanıtlara dayanan aday çıkmadı.") +
    (dusenAday ? ` ${dusenAday} aday kanıt kuralına takılıp düştü.` : "") +
    (desteklenen.length ? ` ${desteklenen.length} yürürlükteki resmî konu belgelerle desteklendi.` : "") +
    (atlananlar.length + tekrarlar.length
      ? ` ${atlananlar.length + tekrarlar.length} aday bu dönemde zaten önerilmiş bir konuyla aynı olduğu için alınmadı.`
      : "") +
    okunamayan;
  return bitir(true, ozet, yazilan);
}

/** Aynı anda yapılan tarama çağrısı. Parçalar bağımsız; sınır API hız limiti. */
const ESZAMANLI = Math.max(1, Number(process.env.YKH_TARAMA_ESZAMANLI) || 6);

/**
 * Parçaları tarar ve kanıt defterine yazar. Keşif ve ön tarama AYNI yolu
 * kullanır. Sonuç önbelleğe (`kanit_tarama`) yazılır: bir parça bir kez taranır.
 *
 * Eşzamanlı: grup başına bir çağrı, en çok `ESZAMANLI` çağrı aynı anda.
 * Sıra sonucu değiştirmez — her grup kendi transaction'ında yazılır, aynı
 * pasaj iki kez gelirse `kanit_tekil` ikincisini yok sayar.
 */
export async function parcalariTara(
  bekleyen: readonly Parca[],
  o: { kesifId: number | null; ilerleme?: (taranan: number) => Promise<unknown> },
): Promise<{ taranan: number; basarisiz: number; basarisizIdler: number[] }> {
  const { istemci, model } = await modelSec("tarama");
  const taramaSurum = PROMPTLAR.kanit_cikarimi.surum;
  const nesneId = o.kesifId ?? "on_tarama";

  const tara = async (grup: Parca[]): Promise<{ ok: true } | { ok: false; neden: string }> => {
    // Uzun parça PENCERELERE bölünür: model `MODEL_METIN_SINIRI` karakter
    // görüyor ve tek pencere parçanın kuyruğunu hiç taramadan "taranmış"
    // sayıyordu. Pencereler aynı belge kimliğini taşır ve örtüşür ki bir
    // cümle sınırda bölünmesin.
    const pencereler = grup.flatMap((p) => pencerele(p.metin).map((metin) => ({ ...p, metin })));
    const paket = paketKur(`tarama-${grup[0].id}`, pencereler.map((p) => ({ id: p.id, ad: p.ad, bolum: p.bolum, metin: p.metin })));
    // Modele pakete yerel numara (1…n) gider, veritabanı kimliği değil.
    const r = await kanitCikar(istemci, model, { belgeler: pencereler.map((p, i) => ({ ...p, id: i + 1 })), paket });
    maliyetYaz(r.maliyet, taramaSurum, r.ok);
    if (!r.ok) {
      await islem(SERVIS, (sql) =>
        denetle(sql, SERVIS, "kanit_cikarimi_reddedildi", "kesif", nesneId, { parcalar: grup.map((p) => p.id), asama: r.asama, hatalar: r.hatalar.slice(0, 5) }),
      );
      return { ok: false, neden: `${r.asama}: ${(r.hatalar[0] ?? "").slice(0, 300)}` };
    }
    await islem(SERVIS, async (sql) => {
      for (const x of r.kanitlar) {
        await sql`
          insert into kanit (belge_id, prompt_surum, model_snapshot, tur, konu, alinti)
          values (${x.belge_id}, ${taramaSurum}, ${model}, ${x.tur}, ${x.konu.slice(0, 160)}, ${x.alinti})
          on conflict do nothing
        `;
      }
      for (const p of grup) {
        await sql`
          insert into kanit_tarama (belge_id, prompt_surum, model_snapshot, kanit_sayisi)
          values (${p.id}, ${taramaSurum}, ${model}, ${r.kanitlar.filter((x) => x.belge_id === p.id).length})
          on conflict (belge_id, prompt_surum, model_snapshot) do update
            set durum = 'tamam', neden = null, kanit_sayisi = excluded.kanit_sayisi, tarandi = now()
        `;
      }
      if (r.dusenler.length) {
        await denetle(sql, SERVIS, "kanit_dusuruldu", "kesif", nesneId, { parcalar: grup.map((p) => p.id), dusenler: r.dusenler.slice(0, 10) });
      }
    });
    return { ok: true };
  };

  /** Tek başına da okunamayan parça nedeniyle kayda geçer; keşfi kilitlemez. */
  const reddiYaz = (p: Parca, neden: string) =>
    islem(SERVIS, (sql) => sql`
      insert into kanit_tarama (belge_id, prompt_surum, model_snapshot, kanit_sayisi, durum, neden)
      values (${p.id}, ${taramaSurum}, ${model}, 0, 'reddedildi', ${neden})
      on conflict (belge_id, prompt_surum, model_snapshot) do update
        set durum = 'reddedildi', neden = excluded.neden, tarandi = now()
    `);

  /**
   * İçerik olmayan parça (kaynakça, şekil/tablo listesi, künye) modele
   * GİTMEZ: taranmış sayılır, kanıt 0, neden kayıtta. Ölçüldü: bir sektör
   * raporunda 66 parçanın 6'sı; üç plan belgesinin 594 parçasında 1.
   */
  const taranacak: Parca[] = [];
  let atlanan = 0;
  for (const p of bekleyen) {
    const neden = icerikDegil(p.metin);
    if (!neden) { taranacak.push(p); continue; }
    atlanan++;
    await islem(SERVIS, (sql) => sql`
      insert into kanit_tarama (belge_id, prompt_surum, model_snapshot, kanit_sayisi, durum, neden)
      values (${p.id}, ${taramaSurum}, ${model}, 0, 'tamam', ${"içerik değil: " + neden})
      on conflict (belge_id, prompt_surum, model_snapshot) do nothing
    `);
  }

  // Grup PENCERE sayısıyla kurulur: tek uzun parça tek başına bir çağrı olabilir.
  const gruplar: Parca[][] = [];
  for (const p of taranacak) {
    const son = gruplar.at(-1);
    const dolu = son ? son.reduce((t, x) => t + pencerele(x.metin).length, 0) : TARAMA_GRUBU;
    if (son && dolu + pencerele(p.metin).length <= TARAMA_GRUBU) son.push(p);
    else gruplar.push([p]);
  }

  let taranan = atlanan;
  let basarisiz = 0;
  const basarisizIdler: number[] = [];
  let sira = 0;
  const isci = async () => {
    while (sira < gruplar.length) {
      const grup = gruplar[sira++];
      const r = await tara(grup);
      if (r.ok) {
        taranan += grup.length;
      } else {
        // Grup reddedildiyse parçalar tek tek denenir: bir parçanın kusuru
        // komşularını taranmamış bırakmasın.
        for (const p of grup) {
          const t = grup.length > 1 ? await tara([p]) : r;
          if (t.ok) {
            taranan++;
          } else {
            basarisiz++;
            basarisizIdler.push(p.id);
            await reddiYaz(p, t.neden);
          }
        }
      }
      await o.ilerleme?.(taranan);
    }
  };
  await Promise.all(Array.from({ length: Math.min(ESZAMANLI, gruplar.length) }, isci));
  return { taranan, basarisiz, basarisizIdler };
}

/**
 * Ön tarama — worker boştayken önbellekte olmayan parçaları tarar. Keşif
 * başlatıldığında tarama büyük ölçüde hazır olur. Tur başına sınırlı iş:
 * yeni gelen bir öneri değerlendirmesi dakikalarca beklemesin.
 */
export async function onTarama(enCok = ESZAMANLI * TARAMA_GRUBU): Promise<number> {
  const { model } = await modelSec("tarama");
  const parcalar = (
    await islem(SERVIS, (sql) =>
      sql<Parca[]>`
        select b.id, b.ad, b.bolum, b.tur::text, b.yil, b.metin, b.il_kod from belge b
        -- Reddedilmiş parça da kayıtlıdır: ön tarama onu yeniden denemez
        -- (maliyet döngüsü olmasın); keşif bir kez daha dener.
        where not exists (
          select 1 from kanit_tarama t
          where t.belge_id = b.id and t.prompt_surum = ${PROMPTLAR.kanit_cikarimi.surum} and t.model_snapshot = ${model}
        )
        order by b.id
        limit ${enCok}
      `,
    )
  ).map((p) => ({ ...p, id: Number(p.id) }));
  if (!parcalar.length) return 0;
  const { taranan, basarisiz } = await parcalariTara(parcalar, { kesifId: null });
  log.info("on_tarama", { taranan, basarisiz });
  return taranan + basarisiz;
}

/**
 * Sıradaki keşfi alır. `durum` kuyruğun kendisidir; çökmüş bir koşu
 * (15 dk güncellenmemiş `calisiyor`) yeniden alınabilir, en çok 3 deneme.
 */
export async function birKesifAl(): Promise<number | null> {
  return islem(SERVIS, async (sql) => {
    // Üç kez yarıda kalmış koşu kuyruğu ve dönemin tek-aktif kilidini tutmasın.
    await sql`
      update kesif set durum = 'hata', asama = null, guncellendi = now(),
        mesaj = 'Koşu üç kez yarıda kaldı; yeniden başlatınca taranmış parçalardan devam eder.'
      where durum = 'calisiyor' and deneme >= 3 and guncellendi < now() - interval '15 minutes'
    `;
    const [r] = await sql<{ id: string }[]>`
      update kesif set durum = 'calisiyor', deneme = deneme + 1, guncellendi = now()
      where id = (
        select id from kesif
        where deneme < 3
          and (durum = 'bekliyor' or (durum = 'calisiyor' and guncellendi < now() - interval '15 minutes'))
        order by id
        for update skip locked
        limit 1
      )
      returning id
    `;
    return r ? Number(r.id) : null;
  });
}

/** Beklenmeyen hata: deneme hakkı varsa sıraya geri döner, yoksa durur. Neden kayıtta kalır. */
export async function kesifHatasi(kesifId: number, mesaj: string): Promise<void> {
  await islem(SERVIS, (sql) => sql`
    update kesif set durum = case when deneme < 3 then 'bekliyor' else 'hata' end,
      asama = null, mesaj = ${mesaj.slice(0, 500)}, guncellendi = now()
    where id = ${kesifId}
  `);
}

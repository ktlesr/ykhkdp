import { adayKesfet, istemciSec, kanitCikar, modelSnapshot, PROMPTLAR, type Maliyet } from "@ykh/ai-gateway";
import { denetle, islem, type Baglam } from "@ykh/database";
import { MODEL_METIN_SINIRI, paketKur, yerelMi } from "@ykh/evidence-validation";
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
const YEREL_SINIR = 80;
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

  const istemci = istemciSec();
  const model = modelSnapshot();
  const taramaSurum = PROMPTLAR.kanit_cikarimi.surum;

  // ── 1. Envanter ──────────────────────────────────────────────────────────
  await durumYaz(k.id, {
    asama: "envanter", mesaj: null, model_snapshot: model,
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
          where prompt_surum = ${taramaSurum} and model_snapshot = ${model}
            and belge_id in ${sql(parcalar.map((p) => p.id))}
        `,
      )
    ).map((r) => Number(r.belge_id)),
  );
  await durumYaz(k.id, { asama: "tarama", toplam_parca: parcalar.length, taranan_parca: taranmis.size });

  // ── 2. Tarama · önbellekte olmayan parçalar (eşzamanlı) ──────────────────
  const bekleyen = parcalar.filter((p) => !taranmis.has(p.id));
  const { basarisiz } = await parcalariTara(bekleyen, {
    kesifId: k.id,
    ilerleme: (n) => durumYaz(k.id, { taranan_parca: taranmis.size + n }),
  });
  if (basarisiz) {
    return bitir(false, `${parcalar.length} parçanın ${basarisiz} tanesi taranamadı; tarama tamamlanmadan aday üretilmez. Yeniden başlatınca kalan parçalardan devam eder.`);
  }

  // ── 3. Kanıt defteri ─────────────────────────────────────────────────────
  const [ilceler, kanitlar] = await Promise.all([
    islem(SERVIS, (sql) => sql<{ ad: string }[]>`select ad from ilce where il_kod = ${k.il_kod} order by ad`),
    islem(SERVIS, (sql) =>
      sql<{ id: string; belge_id: string; tur: string; konu: string; alinti: string }[]>`
        select id, belge_id, tur, konu, alinti from kanit
        where prompt_surum = ${taramaSurum} and model_snapshot = ${model}
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
  const yerel = defterHam.filter((d) => d.yerel).slice(0, YEREL_SINIR);
  await durumYaz(k.id, { asama: "aday", kanit_sayisi: defterHam.length, yerel_kanit: yerel.length });
  if (!yerel.length) {
    return bitir(true, `${parcalar.length} parça tarandı, ${defterHam.length} kanıt bulundu ama hiçbiri bu ile özgü değil; "neden burada?" sorusuna dayanak olmadan aday üretilmez.`);
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
  const a = await adayKesfet(istemci, model, { il: k.il, ilceler: ilceAdlari, defter });
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
  let yazilan = 0;
  await islem(tetikleyen, async (sql) => {
    const mevcut = new Set(
      (await sql<{ b: string }[]>`select lower(trim(baslik)) as b from oneri where donem_id = ${k.donem_id}`).map((r) => r.b),
    );
    for (const aday of a.adaylar) {
      if (yazilan >= sinir) break;
      // Yalnızca BİREBİR tekrar atlanır; yakın kopya bir karar değil işaret —
      // onay kuyruğunda "aynı dönemde benzer başlık" olarak görünür.
      if (mevcut.has(aday.baslik.toLocaleLowerCase("tr-TR").trim())) {
        atlananlar.push(aday.baslik);
        continue;
      }
      const kanit = aday.kanitIdleri.map((id) => {
        const d = kanitHaritasi.get(id)!;
        const p = parcaHaritasi.get(d.belgeId)!;
        return { kanit_id: id, belge_id: p.id, belge_ad: p.ad, bolum: p.bolum, tur: d.tur, konu: d.konu, alinti: d.metin, yerel: d.yerel };
      });
      const r = await sql`
        insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, durum, kesif_id, kesif_kanit)
        values (${k.donem_id}, ${k.tetikleyen_ref}, 'yeni', ${aday.baslik}, ${aday.gerekce},
                'degerlendiriliyor', ${k.id}, ${sql.json(kanit as never)})
        on conflict do nothing
      `;
      if (r.count) {
        yazilan++;
        mevcut.add(aday.baslik.toLocaleLowerCase("tr-TR").trim());
      }
    }
    await denetle(sql, tetikleyen, "kesif_adaylari_yazildi", "kesif", k.id, {
      yazilan, atlananlar, dusenler: a.dusenler.slice(0, 10), model: a.modelSnapshot, promptSurum: a.promptSurum,
      not: "Adaylar doğrulanmamış; her biri ayrıca puanlanır ve ajans onayı bekler.",
    });
  });
  await durumYaz(k.id, { aday_sayisi: yazilan });

  const ozet =
    `${parcalar.length} parça tarandı, ${defterHam.length} kanıt (${yerel.length} yerel). ` +
    (yazilan ? `${yazilan} aday değerlendirmeye alındı.` : "Kanıtlara dayanan aday çıkmadı.") +
    (a.dusenler.length ? ` ${a.dusenler.length} aday kanıt kuralına takılıp düştü.` : "") +
    (atlananlar.length ? ` ${atlananlar.length} aday zaten öneriliydi.` : "");
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
  const istemci = istemciSec();
  const model = modelSnapshot();
  const taramaSurum = PROMPTLAR.kanit_cikarimi.surum;
  const nesneId = o.kesifId ?? "on_tarama";

  const tara = async (grup: Parca[]): Promise<boolean> => {
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
      return false;
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
          on conflict do nothing
        `;
      }
      if (r.dusenler.length) {
        await denetle(sql, SERVIS, "kanit_dusuruldu", "kesif", nesneId, { parcalar: grup.map((p) => p.id), dusenler: r.dusenler.slice(0, 10) });
      }
    });
    return true;
  };

  // Grup PENCERE sayısıyla kurulur: tek uzun parça tek başına bir çağrı olabilir.
  const gruplar: Parca[][] = [];
  for (const p of bekleyen) {
    const son = gruplar.at(-1);
    const dolu = son ? son.reduce((t, x) => t + pencerele(x.metin).length, 0) : TARAMA_GRUBU;
    if (son && dolu + pencerele(p.metin).length <= TARAMA_GRUBU) son.push(p);
    else gruplar.push([p]);
  }

  let taranan = 0;
  let basarisiz = 0;
  const basarisizIdler: number[] = [];
  let sira = 0;
  const isci = async () => {
    while (sira < gruplar.length) {
      const grup = gruplar[sira++];
      if (await tara(grup)) {
        taranan += grup.length;
      } else if (grup.length > 1) {
        // Grup reddedildiyse parçalar tek tek denenir: bir parçanın kusuru
        // komşularını taranmamış bırakmasın.
        for (const p of grup) {
          if (await tara([p])) taranan++;
          else (basarisiz++, basarisizIdler.push(p.id));
        }
      } else {
        basarisiz++;
        basarisizIdler.push(grup[0].id);
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
// ponytail: süreç içi; worker yeniden başlayınca bir kez daha denenir.
const onTaramaReddi = new Set<number>();

export async function onTarama(enCok = ESZAMANLI * TARAMA_GRUBU): Promise<number> {
  const model = modelSnapshot();
  const parcalar = (
    await islem(SERVIS, (sql) =>
      sql<Parca[]>`
        select b.id, b.ad, b.bolum, b.tur::text, b.yil, b.metin, b.il_kod from belge b
        where not (b.id = any(${[...onTaramaReddi]}::bigint[]))
          and not exists (
          select 1 from kanit_tarama t
          where t.belge_id = b.id and t.prompt_surum = ${PROMPTLAR.kanit_cikarimi.surum} and t.model_snapshot = ${model}
        )
        order by b.id
        limit ${enCok}
      `,
    )
  ).map((p) => ({ ...p, id: Number(p.id) }));
  if (!parcalar.length) return 0;
  const { taranan, basarisiz, basarisizIdler } = await parcalariTara(parcalar, { kesifId: null });
  // Hep reddedilen parça ön taramayı sonsuz döngüye (ve maliyete) sokmasın:
  // keşif onu yine dener ve "taranamadı" diye raporlar.
  for (const id of basarisizIdler) onTaramaReddi.add(id);
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

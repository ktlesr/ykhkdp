/**
 * Değerlendirme eval koşucusu: `pnpm ai:eval`
 *
 * Gerçek belgelere ve gerçek modele karşı çalışır, VERİTABANINA HİÇBİR ŞEY
 * YAZMAZ. Bir bant veya değişmez ihlal edilirse çıkış kodu 1 olur.
 *
 * Örnek başına birden çok çağrı yapılıp MEDYAN alınır. Tek çağrı yeterli değil:
 * aynı örnek iki koşuda dayanak 52 ve 94 verdi. Tek koşuya bakan bir eval
 * rastgele kırılır, rastgele kırılan eval de görmezden gelinir.
 *
 * ponytail: medyan ve sabit tekrar sayısı. İstatistik yok, güven aralığı yok —
 * yakalanmak istenen şey gürültü değil regresyon. `YKH_EVAL_TEKRAR` ile artar.
 */

import { degerlendir, istemciSec, karsiGorus, modelSnapshot } from "@ykh/ai-gateway";
import { islem } from "@ykh/database";
import { paketteGeciyor } from "@ykh/evidence-validation";
import { belgePaketi } from "@ykh/retrieval";
import { KRITER_GRUBU, KRITERLER, type Kriter } from "@ykh/scoring";
import { SERVIS } from "./index.ts";
import {
  FILO_DUSEN_ESIGI,
  KARSILASTIRMALAR,
  ORNEKLER,
  VARSAYILAN_RET_ORANI,
  type Bant,
  type Ornek,
} from "./ornekler.ts";

type Olcum = {
  ad: string;
  yerellik: number;
  dayanak: number;
  dayanakliKriter: number;
  dusenOrani: number;
  alinti: number;
  karsiGorus: number;
  token: number;
  /** düşen alıntı gerekçeleri — neden düştüğü gizlenmez */
  dusenNeden: string[];
  /** şema sekiz kriter zorluyor; yine de kontrol edilir */
  eksikKriter?: boolean;
};

const YESIL = "geçti";
const KIRMIZI = "KIRILDI";

function bantta(deger: number, bant: Bant): boolean {
  return deger >= bant[0] && deger <= bant[1];
}

/** Yerellik grubunun ortalaması — "neden burada?" sorusunun ölçüsü. */
function yerellikOrtalamasi(puanlar: ReadonlyArray<{ kriter: string; puan: number }>): number {
  const grup = puanlar.filter((p) => KRITER_GRUBU[p.kriter as Kriter] === "yerellik");
  if (!grup.length) return 0;
  return Math.round(grup.reduce((t, p) => t + p.puan, 0) / grup.length);
}

async function agirliklariAl(ilKod: string): Promise<Record<string, number>> {
  const [r] = await islem(SERVIS, (sql) =>
    sql<{ agirliklar: Record<string, number> }[]>`
      select s.agirliklar
      from donem d
      join agirlik_seti s on s.surum = d.agirlik_seti_surum
      where d.il_kod = ${ilKod}
      order by d.yil desc
      limit 1
    `,
  );
  if (!r) throw new Error(`${ilKod} için dönem/ağırlık seti bulunamadı. 'pnpm db:reset' çalıştırın.`);
  return r.agirliklar;
}

/** Tek çağrı. Bantlar burada kontrol edilmez — medyan üzerinden bakılır. */
async function birKosu(o: Ornek): Promise<{ olcum: Olcum; ret: string | null }> {
  const { paket, belgeler } = await belgePaketi(SERVIS, {
    ilKod: o.ilKod,
    ajansKod: o.ajansKod,
    sorgu: `${o.baslik} ${o.gerekce}`,
  });
  if (!belgeler.length) {
    throw new Error(`${o.ad}: belge paketi boş. 'pnpm db:belgeler' çalıştırın.`);
  }

  const s = await degerlendir(istemciSec(), modelSnapshot(), {
    baslik: o.baslik,
    gerekce: o.gerekce,
    il: o.ilKod,
    ilce: o.ilce,
    nace: o.nace,
    belgeler,
    paket,
    agirliklar: await agirliklariAl(o.ilKod),
  });

  if (!s.ok) {
    // Ret bir eval sonucu değil, kırılmadır: örnekler geçerli çıktı üretmeli.
    return {
      olcum: { ad: o.ad, yerellik: 0, dayanak: 0, dayanakliKriter: 0, dusenOrani: 1, alinti: 0, karsiGorus: 0, token: 0, dusenNeden: [] },
      ret: `çıktı reddedildi (${s.asama}): ${s.hatalar.slice(0, 2).join(" | ")}`,
    };
  }

  // Karşı görüş ayrı bir çağrı; puanı etkilemediği için reddi kırılma sayılır
  // ama değerlendirmeyi geçersiz kılmaz.
  const kg = await karsiGorus(istemciSec(), modelSnapshot(), {
    baslik: o.baslik,
    gerekce: o.gerekce,
    il: o.ilKod,
    ilce: o.ilce,
    belgeler,
    paket,
  });

  /**
   * ÜRÜN KURALI — pazarlıksız: kaydedilecek her alıntı pakette birebir geçmeli.
   * Doğrulayıcıya güvenmeden burada tekrar ölçüyoruz; ayrışırlarsa eval kırılır.
   */
  const kaynaksiz = s.dogrulanan.filter((a) => !paketteGeciyor(paket, a.alinti));

  const toplamAlinti = s.dogrulanan.length + s.dusenler.length;
  return {
    ret: kaynaksiz.length
      ? `KAYNAKSIZ ALINTI KAYDEDİLECEKTİ (${kaynaksiz.length}): “${kaynaksiz[0].alinti.slice(0, 70)}…”`
      : null,
    olcum: {
      ad: o.ad,
      yerellik: yerellikOrtalamasi(s.veri.puanlar),
      dayanak: s.dayanak,
      dayanakliKriter: Object.values(s.kriterDayanagi).filter((v) => v.length).length,
      dusenOrani: toplamAlinti ? s.dusenler.length / toplamAlinti : 0,
      alinti: s.dogrulanan.length,
      karsiGorus: kg.ok ? kg.gorusler.length : 0,
      dusenNeden: s.dusenler,
      token:
        s.maliyet.girdiToken + s.maliyet.ciktiToken +
        (kg.ok ? kg.maliyet.girdiToken + kg.maliyet.ciktiToken : 0),
      // Şema katmanı sekiz kriteri zorluyor; yine de kontrol edilir.
      ...(s.veri.puanlar.length === KRITERLER.length ? {} : { eksikKriter: true }),
    },
  };
}

function medyan(sayilar: readonly number[]): number {
  const s = [...sayilar].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Örneği `tekrar` kez çalıştırır, medyanı bantlara vurur. */
async function ornegiCalistir(
  o: Ornek,
  tekrar: number,
): Promise<{ olcum: Olcum; kosular: Olcum[]; retler: string[]; hatalar: string[] }> {
  const hatalar: string[] = [];
  const kosular: Olcum[] = [];
  const retler: string[] = [];

  for (let i = 0; i < tekrar; i++) {
    const { olcum, ret } = await birKosu(o);
    if (ret) retler.push(`koşu ${i + 1}: ${ret}`);
    else kosular.push(olcum);
    if (olcum.eksikKriter) hatalar.push(`koşu ${i + 1}: sekiz kriter dönmedi`);
  }

  const b = o.bekle;
  // Kaynaksız alıntı toleranssızdır: ret oranına girmez, doğrudan kırar.
  const kaynaksiz = retler.filter((r) => r.includes("KAYNAKSIZ ALINTI"));
  if (kaynaksiz.length) hatalar.push(...kaynaksiz);

  const retOrani = (retler.length - kaynaksiz.length) / tekrar;
  const esik = b.enFazlaRetOrani ?? VARSAYILAN_RET_ORANI;
  if (retOrani > esik) {
    hatalar.push(
      `${retler.length}/${tekrar} koşu reddedildi (eşik %${Math.round(esik * 100)}): ${retler[0]}`,
    );
  }
  // Reddedilen koşu medyanı zehirlemez: hiç geçerli koşu yoksa kırılma.
  if (!kosular.length) {
    return {
      olcum: { ad: o.ad, yerellik: 0, dayanak: 0, dayanakliKriter: 0, dusenOrani: 1, alinti: 0, karsiGorus: 0, token: 0, dusenNeden: [] },
      kosular,
      retler,
      hatalar: [...hatalar, "hiçbir koşu geçerli çıktı üretmedi"],
    };
  }

  const olcum: Olcum = {
    ad: o.ad,
    yerellik: medyan(kosular.map((k) => k.yerellik)),
    dayanak: medyan(kosular.map((k) => k.dayanak)),
    dayanakliKriter: medyan(kosular.map((k) => k.dayanakliKriter)),
    dusenOrani: medyan(kosular.map((k) => k.dusenOrani)),
    alinti: medyan(kosular.map((k) => k.alinti)),
    karsiGorus: medyan(kosular.map((k) => k.karsiGorus)),
    token: kosular.reduce((t, k) => t + k.token, 0),
    dusenNeden: kosular.flatMap((k) => k.dusenNeden),
  };

  if (b.yerellik && !bantta(olcum.yerellik, b.yerellik)) {
    hatalar.push(`yerellik medyanı ${olcum.yerellik}, beklenen ${b.yerellik[0]}–${b.yerellik[1]}`);
  }
  if (b.dayanak && !bantta(olcum.dayanak, b.dayanak)) {
    hatalar.push(`dayanak medyanı ${olcum.dayanak}, beklenen ${b.dayanak[0]}–${b.dayanak[1]}`);
  }
  if (b.enAzDayanakliKriter !== undefined && olcum.dayanakliKriter < b.enAzDayanakliKriter) {
    hatalar.push(`${olcum.dayanakliKriter} kriter belgeye bağlandı, en az ${b.enAzDayanakliKriter} olmalı`);
  }
  if (b.enAzKarsiGorus !== undefined && olcum.karsiGorus < b.enAzKarsiGorus) {
    hatalar.push(`${olcum.karsiGorus} karşı görüş üretildi, en az ${b.enAzKarsiGorus} olmalı`);
  }
  return { olcum, kosular, retler, hatalar };
}

async function main(): Promise<void> {
  const tekrar = Math.max(1, Number(process.env.YKH_EVAL_TEKRAR) || 3);
  console.log(`\nDeğerlendirme eval · model ${modelSnapshot()} · istemci ${istemciSec().ad}`);
  console.log(
    `${ORNEKLER.length} örnek × ${tekrar} koşu (medyan), ${KARSILASTIRMALAR.length} karşılaştırma\n`,
  );

  const olcumler = new Map<string, Olcum>();
  let kirilan = 0;

  for (const [i, o] of ORNEKLER.entries()) {
    console.log(`${i + 1}) ${o.ad}`);
    const { olcum, kosular, retler, hatalar } = await ornegiCalistir(o, tekrar);
    olcumler.set(o.ad, olcum);

    // Koşular arası yayılım gizlenmez: sallantı görünür olmalı.
    const aralik = (al: (k: Olcum) => number) => {
      const d = kosular.map(al);
      const [en, ez] = [Math.min(...d), Math.max(...d)];
      return en === ez ? "" : ` (${en}–${ez})`;
    };
    console.log(`   yerellik ${String(olcum.yerellik).padStart(3)}${aralik((k) => k.yerellik)}` +
      `   dayanak ${String(olcum.dayanak).padStart(3)}${aralik((k) => k.dayanak)}` +
      `   dayanaklı kriter ${olcum.dayanakliKriter}/8${aralik((k) => k.dayanakliKriter)}` +
      `   alıntı ${olcum.alinti}` +
      `   karşı görüş ${olcum.karsiGorus}${aralik((k) => k.karsiGorus)}` +
      `   düşen %${Math.round(olcum.dusenOrani * 100)}` +
      (retler.length ? `   ret ${retler.length}/${tekrar}` : ""));
    for (const r of retler) console.log(`   ret: ${r.slice(0, 150)}`);
    for (const d of olcum.dusenNeden.slice(0, 3)) console.log(`   düşen: ${d.slice(0, 150)}`);

    if (hatalar.length) {
      kirilan++;
      for (const h of hatalar) console.log(`   ${KIRMIZI}  ${h}`);
    } else {
      console.log(`   ${YESIL}`);
    }
    console.log();
  }

  // ── filo düzeyi düşen alıntı oranı ──────────────────────────────────────
  const filoDusen = medyan([...olcumler.values()].map((o) => o.dusenOrani));
  const filoGecti = filoDusen <= FILO_DUSEN_ESIGI;
  if (!filoGecti) kirilan++;
  console.log(
    `${filoGecti ? YESIL : KIRMIZI}  filo düşen alıntı medyanı %${Math.round(filoDusen * 100)}, ` +
      `eşik %${Math.round(FILO_DUSEN_ESIGI * 100)}
`,
  );

  // ── ayırt etme: ürün kuralı, modelden bağımsız ──────────────────────────
  console.log("Ayırt etme karşılaştırmaları");
  for (const k of KARSILASTIRMALAR) {
    const y = olcumler.get(k.yuksek);
    const d = olcumler.get(k.dusuk);
    if (!y || !d) {
      kirilan++;
      console.log(`   ${KIRMIZI}  ${k.yuksek} / ${k.dusuk}: örnek bulunamadı`);
      continue;
    }
    const fark = y.yerellik - d.yerellik;
    const gecti = fark >= k.enAzFark;
    if (!gecti) kirilan++;
    console.log(
      `   ${gecti ? YESIL : KIRMIZI}  ${k.yuksek} (${y.yerellik}) − ${k.dusuk} (${d.yerellik})` +
        ` = ${fark}, en az ${k.enAzFark} olmalı`,
    );
    if (!gecti) console.log(`           ${k.neden}`);
  }

  const token = [...olcumler.values()].reduce((t, o) => t + o.token, 0);
  console.log(`\ntoplam ${token} token`);
  if (kirilan) {
    console.log(`\n── EVAL KIRILDI · ${kirilan} kontrol ─────────────────────────────\n`);
    process.exitCode = 1;
  } else {
    console.log("\n── EVAL GEÇTİ ───────────────────────────────────────────────\n");
  }
}

await main();
const { kapat } = await import("@ykh/database");
await kapat();

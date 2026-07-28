import { KRITERLER, type AgirlikSeti, type Kriter } from "./kriterler.ts";

/**
 * Deterministik stratejik puan.
 *
 * Girdi YALNIZCA kriter puanlarıdır. Destek/öneri sayısı bu fonksiyonun
 * imzasında yoktur ve olamaz (brief §2, README §1.6) — derleyici engeli.
 */

export type KriterPuanlari = Record<Kriter, number>;

export type PuanKirilimi = {
  toplam: number;
  kalemler: Array<{ kriter: Kriter; puan: number; agirlik: number; katki: number }>;
};

function kirp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** 0–100 ağırlıklı puan, tam sayıya yuvarlanır. Yuvarlama tek yerde. */
export function stratejikPuan(puanlar: KriterPuanlari, set: AgirlikSeti): number {
  return Math.round(kirilim(puanlar, set).toplam);
}

export function kirilim(puanlar: KriterPuanlari, set: AgirlikSeti): PuanKirilimi {
  const kalemler = KRITERLER.map((kriter) => {
    const puan = kirp(puanlar[kriter] ?? 0);
    const agirlik = set.agirliklar[kriter];
    return { kriter, puan, agirlik, katki: puan * agirlik };
  });
  return { toplam: kalemler.reduce((t, k) => t + k.katki, 0), kalemler };
}

/**
 * Kriter puanı yalnızca doğrulanmış bulgulardan üretilir. Doğrulanmamış
 * girdiyle çağrılırsa `null` döner — puan hesaplanmaz, sıfır sayılmaz (§1.3).
 */
export type KriterGirdisi = { kriter: Kriter; puan: number; dogrulanmis: boolean };

export function kriterPuanlariniTopla(
  girdiler: readonly KriterGirdisi[],
): { puanlar: KriterPuanlari; eksik: Kriter[] } {
  const puanlar = {} as KriterPuanlari;
  const eksik: Kriter[] = [];
  for (const kriter of KRITERLER) {
    const dogrulanmis = girdiler.filter((g) => g.kriter === kriter && g.dogrulanmis);
    if (!dogrulanmis.length) {
      puanlar[kriter] = 0;
      eksik.push(kriter);
      continue;
    }
    const ort = dogrulanmis.reduce((t, g) => t + kirp(g.puan), 0) / dogrulanmis.length;
    puanlar[kriter] = ort;
  }
  return { puanlar, eksik };
}

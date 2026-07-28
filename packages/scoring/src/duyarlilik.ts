import type { Aday, Hesap } from "@ykh/domain";
import { KRITERLER, type AgirlikSeti, type Kriter } from "./kriterler.ts";
import { stratejikPuan, type KriterPuanlari } from "./puan.ts";
import { ayardan, hesapla, slotKimlikleri } from "./siralama.ts";

/**
 * Duyarlılık: sonucun hangi parametreye ne kadar bağlı olduğunu gösterir.
 * Senaryo alanıdır — karar ekranına değil, Blok 5'e aittir (§1.7).
 */

export type AdayGirdisi = Omit<Aday, "taban"> & { kriterPuanlari: KriterPuanlari };

export function adaylariPuanla(girdiler: readonly AdayGirdisi[], set: AgirlikSeti): Aday[] {
  return girdiler.map(({ kriterPuanlari, ...rest }) => ({
    ...rest,
    taban: stratejikPuan(kriterPuanlari, set),
  }));
}

export type KriterDuyarliligi = {
  kriter: Kriter;
  /** ağırlık bu kadar oynatıldığında ilk dört değişiyor mu */
  delta: number;
  ilkDortDegisti: boolean;
};

/**
 * Her kriter için ağırlığı ±delta oynatıp (kalanı orantılı dağıtarak) ilk dördün
 * değişip değişmediğine bakar. Kırılgan kriterleri açığa çıkarır.
 */
export function kriterDuyarliligi(
  girdiler: readonly AdayGirdisi[],
  set: AgirlikSeti,
  delta = 0.05,
): KriterDuyarliligi[] {
  const taban = slotKimlikleri(hesapla(adaylariPuanla(girdiler, set), ayardan(set)));

  return KRITERLER.map((kriter) => {
    const degisti = [delta, -delta].some((d) => {
      const yeni = agirligiOynat(set, kriter, d);
      if (!yeni) return false;
      const k = slotKimlikleri(hesapla(adaylariPuanla(girdiler, yeni), ayardan(yeni)));
      return JSON.stringify(k) !== JSON.stringify(taban);
    });
    return { kriter, delta, ilkDortDegisti: degisti };
  });
}

function agirligiOynat(set: AgirlikSeti, kriter: Kriter, d: number): AgirlikSeti | null {
  const yeniAgirlik = set.agirliklar[kriter] + d;
  if (yeniAgirlik < 0 || yeniAgirlik > 1) return null;
  const digerToplam = 1 - set.agirliklar[kriter];
  if (digerToplam <= 0) return null;
  const olcek = (1 - yeniAgirlik) / digerToplam;
  const agirliklar = { ...set.agirliklar };
  for (const k of KRITERLER) agirliklar[k] = k === kriter ? yeniAgirlik : agirliklar[k] * olcek;
  return { ...set, agirliklar, surum: `${set.surum}+senaryo` };
}

export type Senaryo = {
  ad: string;
  ezme: Partial<Pick<AgirlikSeti, "devamlilikPayi" | "kanitEsigi" | "devirSiniri">>;
};

export type SenaryoSonucu = {
  ad: string;
  hesap: Hesap;
  /** temel sürüme göre ilk dört değişti mi */
  ilkDortDegisti: boolean;
  /** §1.7 — senaryo çıktısı asla karar sürümü değildir */
  kaydedilmez: true;
};

export function senaryolariCalistir(
  adaylar: readonly Aday[],
  set: AgirlikSeti,
  senaryolar: readonly Senaryo[],
): SenaryoSonucu[] {
  const taban = slotKimlikleri(hesapla(adaylar, ayardan(set)));
  return senaryolar.map((s) => {
    const hesap = hesapla(adaylar, ayardan(set, { ...s.ezme, surum: `${set.surum} · senaryo: ${s.ad}` }));
    return {
      ad: s.ad,
      hesap,
      ilkDortDegisti: JSON.stringify(slotKimlikleri(hesap)) !== JSON.stringify(taban),
      kaydedilmez: true,
    };
  });
}

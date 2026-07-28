import type { Rol } from "@ykh/domain";
import { bulguyuDogrula, type KaynakPaketi } from "@ykh/evidence-validation";
import type { z } from "zod";
import { kaynakBloguKur, PROMPTLAR, type KaynakSatiri } from "./prompt.ts";
import { jsonSema, SEMALAR, type SemaAdi } from "./sema.ts";

/**
 * AI Gateway. Model çağrısı, şema doğrulama, kanıt doğrulama, maliyet kaydı.
 *
 * Her katman fail-closed: şema tutmazsa reddet, evidence_id tutmazsa reddet,
 * kaynaksız sayı varsa reddet. Geçen çıktı bile "doğrulanmamış bulgu"dur ve
 * uzman onayı olmadan puanlamaya giremez (§1.3).
 */

export type ModelIstegi = {
  modelSnapshot: string;
  sistem: string;
  kullanici: string;
  jsonSema: unknown;
  semaAdi: SemaAdi;
};

export type ModelCevabi = {
  metin: string;
  girdiToken: number;
  ciktiToken: number;
};

/** Model istemcisi arayüzü — gerçek OpenAI veya çevrimdışı sahte istemci. */
export type ModelIstemcisi = {
  ad: string;
  cagir(istek: ModelIstegi): Promise<ModelCevabi>;
};

export type Maliyet = { girdiToken: number; ciktiToken: number; model: string };

export type AnalizSonucu<T> =
  | { ok: true; veri: T; modelSnapshot: string; promptSurum: string; maliyet: Maliyet }
  | { ok: false; asama: "sema" | "kanit" | "model"; hatalar: string[]; modelSnapshot: string; promptSurum: string };

export type AnalizGirdisi = {
  semaAdi: SemaAdi;
  kullaniciMetni: string;
  kaynaklar: readonly KaynakSatiri[];
  paket: KaynakPaketi;
  rol: Rol;
};

/** `latest` alias üretimde kullanılmaz (brief §3). */
export function modelSnapshotDogrula(snapshot: string): void {
  if (!snapshot || snapshot === "latest" || snapshot.endsWith(":latest")) {
    throw new Error("Model snapshot pinli olmalı; 'latest' üretimde kullanılmaz.");
  }
}

export async function analizEt<A extends SemaAdi>(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: AnalizGirdisi & { semaAdi: A },
): Promise<AnalizSonucu<z.infer<(typeof SEMALAR)[A]>>> {
  modelSnapshotDogrula(modelSnapshot);
  const prompt = PROMPTLAR[girdi.semaAdi];
  const meta = { modelSnapshot, promptSurum: prompt.surum };

  let cevap: ModelCevabi;
  try {
    cevap = await istemci.cagir({
      modelSnapshot,
      sistem: prompt.sistem,
      kullanici: `${kaynakBloguKur(girdi.kaynaklar)}\n\n<gorev>\n${girdi.kullaniciMetni}\n</gorev>`,
      jsonSema: jsonSema(girdi.semaAdi),
      semaAdi: girdi.semaAdi,
    });
  } catch (e) {
    return { ok: false, asama: "model", hatalar: [e instanceof Error ? e.message : String(e)], ...meta };
  }

  // 1. katman — şema
  let ham: unknown;
  try {
    ham = JSON.parse(cevap.metin);
  } catch {
    return { ok: false, asama: "sema", hatalar: ["Çıktı geçerli JSON değil."], ...meta };
  }
  const cozum = SEMALAR[girdi.semaAdi].safeParse(ham);
  if (!cozum.success) {
    return {
      ok: false,
      asama: "sema",
      hatalar: cozum.error.issues.map((i) => `${i.path.join(".") || "(kök)"}: ${i.message}`),
      ...meta,
    };
  }

  // 2. katman — kanıt doğrulama
  const hatalar = kanitHatalari(girdi.semaAdi, cozum.data, girdi);
  if (hatalar.length) return { ok: false, asama: "kanit", hatalar, ...meta };

  return {
    ok: true,
    veri: cozum.data as z.infer<(typeof SEMALAR)[A]>,
    ...meta,
    maliyet: { girdiToken: cevap.girdiToken, ciktiToken: cevap.ciktiToken, model: modelSnapshot },
  };
}

function kanitHatalari(ad: SemaAdi, veri: unknown, girdi: AnalizGirdisi): string[] {
  const hatalar: string[] = [];
  const dogrula = (metin: string, ids: string[], alinti?: string | null) => {
    const s = bulguyuDogrula({ metin, evidenceIds: ids, alinti: alinti ?? undefined }, girdi.paket, girdi.rol);
    if (!s.gecerli) hatalar.push(...s.hatalar.map((h) => h.mesaj));
  };

  if (ad === "iddia_cikarimi") {
    const v = veri as { iddialar: { metin: string; evidence_ids: string[]; alinti: string | null }[] };
    for (const i of v.iddialar) dogrula(i.metin, i.evidence_ids, i.alinti);
  } else if (ad === "gerekce_metni") {
    const v = veri as { metin: string; evidence_ids: string[] };
    dogrula(v.metin, v.evidence_ids);
  }
  // nace_onerisi ve mukerrerlik kaynak iddiası taşımaz; sayısal token da üretmez.
  return hatalar;
}

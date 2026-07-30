import { degerlendirmeyiDogrula, type Paket } from "@ykh/evidence-validation";
import type { z } from "zod";
import { kaynakBloguKur, naceBloguKur, PROMPTLAR, type BelgeSatiri } from "./prompt.ts";
import { jsonSema, SEMALAR, type SemaAdi } from "./sema.ts";

/**
 * AI Gateway. Model çağrısı → şema → alıntı doğrulama → dayanak puanı.
 * Her katman fail-closed.
 */

export type ModelIstegi = {
  modelSnapshot: string;
  sistem: string;
  kullanici: string;
  jsonSema: unknown;
  semaAdi: SemaAdi;
};

export type ModelCevabi = { metin: string; girdiToken: number; ciktiToken: number };
export type ModelIstemcisi = { ad: string; cagir(istek: ModelIstegi): Promise<ModelCevabi> };
export type Maliyet = { girdiToken: number; ciktiToken: number; model: string };

type Meta = { modelSnapshot: string; promptSurum: string };

export type Sonuc<T> =
  | ({ ok: true; veri: T; dayanak: number; maliyet: Maliyet } & Meta)
  | ({ ok: false; asama: "model" | "sema" | "dayanak"; hatalar: string[] } & Meta);

/** `latest` alias üretimde kullanılmaz. */
export function modelSnapshotDogrula(snapshot: string): void {
  if (!snapshot || snapshot === "latest" || snapshot.endsWith(":latest")) {
    throw new Error("Model snapshot pinli olmalı; 'latest' üretimde kullanılmaz.");
  }
}

async function cagir<A extends SemaAdi>(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  semaAdi: A,
  kaynakBlogu: string,
  gorev: string,
): Promise<{ ok: true; veri: z.infer<(typeof SEMALAR)[A]>; maliyet: Maliyet } | { ok: false; asama: "model" | "sema"; hatalar: string[] }> {
  modelSnapshotDogrula(modelSnapshot);
  const prompt = PROMPTLAR[semaAdi];

  let cevap: ModelCevabi;
  try {
    cevap = await istemci.cagir({
      modelSnapshot,
      sistem: prompt.sistem,
      kullanici: `${kaynakBlogu}\n\n<gorev>\n${gorev}\n</gorev>`,
      jsonSema: jsonSema(semaAdi),
      semaAdi,
    });
  } catch (e) {
    return { ok: false, asama: "model", hatalar: [e instanceof Error ? e.message : String(e)] };
  }

  let ham: unknown;
  try {
    ham = JSON.parse(cevap.metin);
  } catch {
    return { ok: false, asama: "sema", hatalar: ["Çıktı geçerli JSON değil."] };
  }
  const c = SEMALAR[semaAdi].safeParse(ham);
  if (!c.success) {
    return {
      ok: false,
      asama: "sema",
      hatalar: c.error.issues.map((i) => `${i.path.join(".") || "(kök)"}: ${i.message}`),
    };
  }
  return {
    ok: true,
    veri: c.data as z.infer<(typeof SEMALAR)[A]>,
    maliyet: { girdiToken: cevap.girdiToken, ciktiToken: cevap.ciktiToken, model: modelSnapshot },
  };
}

/** Bir öneriyi sekiz kriterle puanlar ve üst ölçekli belgelere bağlar. */
export async function degerlendir(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: { baslik: string; gerekce: string; il: string; ilce: string | null; nace: string | null; belgeler: readonly BelgeSatiri[]; paket: Paket },
): Promise<Sonuc<z.infer<typeof SEMALAR.degerlendirme>>> {
  const meta = { modelSnapshot, promptSurum: PROMPTLAR.degerlendirme.surum };

  const gorev =
    `İl: ${girdi.il}\n` +
    `İlçe: ${girdi.ilce ?? "belirtilmedi"}\n` +
    `NACE: ${girdi.nace ?? "belirtilmedi"}\n` +
    `Yatırım konusu: ${girdi.baslik}\n` +
    `Neden burada (yatırımcının gerekçesi): ${girdi.gerekce}`;

  const r = await cagir(istemci, modelSnapshot, "degerlendirme", kaynakBloguKur(girdi.belgeler), gorev);
  if (!r.ok) return { ...r, ...meta };

  const dogrulama = degerlendirmeyiDogrula(r.veri, girdi.paket);
  if (!dogrulama.gecerli) {
    return { ok: false, asama: "dayanak", hatalar: dogrulama.hatalar.map((h) => h.mesaj), ...meta };
  }

  return { ok: true, veri: r.veri, dayanak: dogrulama.dayanak, maliyet: r.maliyet, ...meta };
}

/** Kullanıcı NACE girmediyse aday kodlardan birini önerir. */
export async function naceOner(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: { baslik: string; gerekce: string; adaylar: readonly { kod: string; tanim: string }[] },
): Promise<Sonuc<z.infer<typeof SEMALAR.nace_onerisi>>> {
  const meta = { modelSnapshot, promptSurum: PROMPTLAR.nace_onerisi.surum };
  if (!girdi.adaylar.length) {
    return { ok: false, asama: "dayanak", hatalar: ["Aday NACE listesi boş."], ...meta };
  }

  const r = await cagir(
    istemci,
    modelSnapshot,
    "nace_onerisi",
    naceBloguKur(girdi.adaylar),
    `Yatırım konusu: ${girdi.baslik}\nGerekçe: ${girdi.gerekce}`,
  );
  if (!r.ok) return { ...r, ...meta };

  // Fail-closed: listede olmayan kod önerilirse reddet.
  const gecerli = new Set(girdi.adaylar.map((a) => a.kod));
  const uydurma = r.veri.adaylar.filter((a) => !gecerli.has(a.kod));
  if (uydurma.length) {
    return {
      ok: false,
      asama: "dayanak",
      hatalar: uydurma.map((a) => `Aday listesinde olmayan NACE kodu önerildi: ${a.kod}`),
      ...meta,
    };
  }

  return { ok: true, veri: r.veri, dayanak: 0, maliyet: r.maliyet, ...meta };
}

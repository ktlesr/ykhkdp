import {
  adaylariDogrula,
  degerlendirmeyiDogrula,
  kanitlariDogrula,
  karsiGorusuDogrula,
  type DefterKaydi,
  type DogrulanmisAday,
  type DogrulanmisKanit,
  type DogrulanmisKarsiGorus,
  type Paket,
} from "@ykh/evidence-validation";
import type { z } from "zod";
import { defterBloguKur, kaynakBloguKur, naceBloguKur, PROMPTLAR, type BelgeSatiri } from "./prompt.ts";
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

export type ModelCevabi = {
  metin: string; girdiToken: number; ciktiToken: number;
  /** yanıtı GERÇEKTEN veren model (sunucu tarafı yedek devreye girdiyse farklıdır) */
  model?: string;
};
export type ModelIstemcisi = { ad: string; cagir(istek: ModelIstegi): Promise<ModelCevabi> };
export type Maliyet = { girdiToken: number; ciktiToken: number; model: string };

type Meta = { modelSnapshot: string; promptSurum: string };

export type Sonuc<T> =
  | ({ ok: true; veri: T; dayanak: number; maliyet: Maliyet;
      /** birebir doğrulanmış alıntılar; yalnızca bunlar kaydedilir */
      dogrulanan: Array<{ belge_id: number; alinti: string }>;
      /** hangi kriter hangi doğrulanmış alıntıya dayanıyor */
      kriterDayanagi: Record<string, number[]>;
      /** düşürülen alıntı gerekçeleri — denetime yazılır */
      dusenler: string[];
      /** atfı düzeltilen alıntılar — denetime yazılır */
      duzeltilenler: string[] } & Meta)
  | ({ ok: false; asama: "model" | "sema" | "dayanak"; hatalar: string[];
      /** cevap ALINDIYSA tüketim; ağ hatasında yok. Reddedilen cevap da ücretlidir. */
      maliyet?: Maliyet } & Meta);

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
): Promise<{ ok: true; veri: z.infer<(typeof SEMALAR)[A]>; maliyet: Maliyet } | { ok: false; asama: "model" | "sema"; hatalar: string[]; maliyet?: Maliyet }> {
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

  // Künye yanıtı veren modeldir: yedek devreye girdiyse istenen model değil.
  const maliyet = { girdiToken: cevap.girdiToken, ciktiToken: cevap.ciktiToken, model: cevap.model ?? modelSnapshot };
  let ham: unknown;
  try {
    ham = JSON.parse(cevap.metin);
  } catch {
    return { ok: false, asama: "sema", hatalar: ["Çıktı geçerli JSON değil."], maliyet };
  }
  const c = SEMALAR[semaAdi].safeParse(ham);
  if (!c.success) {
    return {
      ok: false,
      asama: "sema",
      hatalar: c.error.issues.map((i) => `${i.path.join(".") || "(kök)"}: ${i.message}`),
      maliyet,
    };
  }
  return { ok: true, veri: c.data as z.infer<(typeof SEMALAR)[A]>, maliyet };
}

/** Bir öneriyi sekiz kriterle puanlar ve üst ölçekli belgelere bağlar. */
export async function degerlendir(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: { baslik: string; gerekce: string; il: string; ilce: string | null; nace: string | null; belgeler: readonly BelgeSatiri[]; paket: Paket;
    /** kriter → puandaki pay; dayanak kapsamasını ağırlıklandırır */
    agirliklar?: Readonly<Record<string, number>> },
): Promise<Sonuc<z.infer<typeof SEMALAR.degerlendirme>>> {
  const meta = { modelSnapshot, promptSurum: PROMPTLAR.degerlendirme.surum };

  const gorev =
    `İl: ${girdi.il}\n` +
    `İlçe: ${girdi.ilce ?? "belirtilmedi"}\n` +
    `NACE: ${girdi.nace ?? "belirtilmedi"}\n` +
    `Yatırım konusu: ${girdi.baslik}\n` +
    `Neden burada (yatırımcının gerekçesi): ${girdi.gerekce}`;

  const r = await cagir(istemci, modelSnapshot, "degerlendirme", kaynakBloguKur(yereleCevir(girdi.belgeler)), gorev);
  if (r.maliyet) meta.modelSnapshot = r.maliyet.model;
  if (!r.ok) return { ...r, ...meta };

  const dogrulama = degerlendirmeyiDogrula(r.veri, girdi.paket, girdi.agirliklar ?? {});
  if (!dogrulama.gecerli) {
    return { ok: false, asama: "dayanak", hatalar: dogrulama.hatalar.map((h) => h.mesaj), maliyet: r.maliyet, ...meta };
  }

  return {
    ok: true,
    veri: r.veri,
    dayanak: dogrulama.dayanak,
    dogrulanan: dogrulama.dogrulanan,
    kriterDayanagi: dogrulama.kriterDayanagi,
    dusenler: dogrulama.dusenler.map((h) => h.mesaj),
    duzeltilenler: dogrulama.duzeltilenler.map((h) => h.mesaj),
    maliyet: r.maliyet,
    ...meta,
  };
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
  if (r.maliyet) meta.modelSnapshot = r.maliyet.model;
  if (!r.ok) return { ...r, ...meta };

  // Fail-closed: listede olmayan kod önerilirse reddet.
  const gecerli = new Set(girdi.adaylar.map((a) => a.kod));
  const uydurma = r.veri.adaylar.filter((a) => !gecerli.has(a.kod));
  if (uydurma.length) {
    return {
      ok: false,
      asama: "dayanak",
      hatalar: uydurma.map((a) => `Aday listesinde olmayan NACE kodu önerildi: ${a.kod}`),
      maliyet: r.maliyet,
      ...meta,
    };
  }

  return { ok: true, veri: r.veri, dayanak: 0, dogrulanan: [], kriterDayanagi: {}, dusenler: [], duzeltilenler: [], maliyet: r.maliyet, ...meta };
}

/**
 * Karşı görüş: aynı belgelerle önerinin aleyhine en güçlü itiraz.
 *
 * `Sonuc<T>` kullanmıyor: dayanak puanı üretmiyor ve `dogrulanan` taşımıyor —
 * itirazlar alıntılarını kendi içinde taşır. Puanı DEĞİŞTİRMEZ.
 */
export type KarsiGorusCiktisi =
  | ({ ok: true; gorusler: DogrulanmisKarsiGorus[]; dusenler: string[]; duzeltilenler: string[];
      maliyet: Maliyet } & Meta)
  | ({ ok: false; asama: "model" | "sema" | "dayanak"; hatalar: string[]; maliyet?: Maliyet } & Meta);

export async function karsiGorus(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: {
    baslik: string; gerekce: string; il: string; ilce: string | null;
    belgeler: readonly BelgeSatiri[]; paket: Paket;
  },
): Promise<KarsiGorusCiktisi> {
  const meta = { modelSnapshot, promptSurum: PROMPTLAR.karsi_gorus.surum };

  const gorev =
    `İl: ${girdi.il}\n` +
    `İlçe: ${girdi.ilce ?? "belirtilmedi"}\n` +
    `Yatırım konusu: ${girdi.baslik}\n` +
    `Yatırımcının gerekçesi: ${girdi.gerekce}`;

  const r = await cagir(istemci, modelSnapshot, "karsi_gorus", kaynakBloguKur(yereleCevir(girdi.belgeler)), gorev);
  if (r.maliyet) meta.modelSnapshot = r.maliyet.model;
  if (!r.ok) return { ...r, ...meta };

  const d = karsiGorusuDogrula(r.veri, girdi.paket);
  if (!d.gecerli) {
    return { ok: false, asama: "dayanak", hatalar: d.hatalar.map((h) => h.mesaj), maliyet: r.maliyet, ...meta };
  }
  return {
    ok: true,
    gorusler: d.gorusler,
    dusenler: d.dusenler.map((h) => h.mesaj),
    duzeltilenler: d.duzeltilenler.map((h) => h.mesaj),
    maliyet: r.maliyet,
    ...meta,
  };
}

// ── Aday keşfi ─────────────────────────────────────────────────────────────

type Hatali = { ok: false; asama: "model" | "sema" | "dayanak"; hatalar: string[]; maliyet?: Maliyet } & Meta;

/** Tarama: parçalardan birebir doğrulanmış kanıt pasajları. Puan ve aday üretmez. */
export async function kanitCikar(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: { belgeler: readonly BelgeSatiri[]; paket: Paket },
): Promise<({ ok: true; kanitlar: DogrulanmisKanit[]; dusenler: string[]; maliyet: Maliyet } & Meta) | Hatali> {
  const meta = { modelSnapshot, promptSurum: PROMPTLAR.kanit_cikarimi.surum };
  const r = await cagir(
    istemci,
    modelSnapshot,
    "kanit_cikarimi",
    kaynakBloguKur(girdi.belgeler),
    "Bu parçalardaki yatırım konusu belirlemeye yarar pasajları çıkar.",
  );
  if (r.maliyet) meta.modelSnapshot = r.maliyet.model;
  if (!r.ok) return { ...r, ...meta };
  const d = kanitlariDogrula(r.veri.kanitlar, girdi.paket);
  if (!d.gecerli) return { ok: false, asama: "dayanak", hatalar: d.hatalar.map((h) => h.mesaj), maliyet: r.maliyet, ...meta };
  return { ok: true, kanitlar: d.kanitlar, dusenler: d.dusenler.map((h) => h.mesaj), maliyet: r.maliyet, ...meta };
}

/** İl aşaması: defterdeki kanıtlardan aday. Yeni alıntı yazılamaz. */
export async function adayKesfet(
  istemci: ModelIstemcisi,
  modelSnapshot: string,
  girdi: {
    il: string;
    ilceler: readonly string[];
    defter: ReadonlyArray<DefterKaydi & { tur: string; konu: string; kaynak: string }>;
    /** yürürlükteki resmî liste — zaten aday, yeniden önerilmez */
    yururlukte?: readonly string[];
    /** önceki yılların resmî konuları — kanıt destekliyorsa başlığı değişmeden yeniden önerilebilir */
    onceki?: ReadonlyArray<{ yil: number; baslik: string }>;
    /** bu dönemde zaten önerilmiş başlıklar — eşdeğeri yeniden önerilmez */
    oneriler?: readonly string[];
  },
): Promise<({ ok: true; adaylar: DogrulanmisAday[]; dusenler: string[]; maliyet: Maliyet } & Meta) | Hatali> {
  const meta = { modelSnapshot, promptSurum: PROMPTLAR.aday_kesfi.surum };
  const gorev =
    `İl: ${girdi.il}\n` +
    `İlçeler: ${girdi.ilceler.length ? girdi.ilceler.join(", ") : "yüklenmedi"}\n` +
    (girdi.yururlukte?.length
      ? `Yürürlükteki resmî liste: ${girdi.yururlukte.join(" | ")}\n`
      : "") +
    (girdi.onceki?.length
      ? `Önceki yılların resmî konuları: ${girdi.onceki.map((o) => `${o.yil}: ${o.baslik}`).join(" | ")}\n`
      : "") +
    (girdi.oneriler?.length
      ? `Bu dönemde ZATEN ÖNERİLMİŞ konular (bunları ve eşdeğerlerini YENİDEN ÖNERME): ${girdi.oneriler.join(" | ")}\n`
      : "") +
    "Bu ilin yerel kanıtlarına dayanan yatırım konusu adaylarını çıkar.";
  const r = await cagir(istemci, modelSnapshot, "aday_kesfi", defterBloguKur(girdi.defter), gorev);
  if (r.maliyet) meta.modelSnapshot = r.maliyet.model;
  if (!r.ok) return { ...r, ...meta };
  const d = adaylariDogrula(r.veri.adaylar, girdi.defter);
  return { ok: true, adaylar: d.adaylar, dusenler: d.dusenler.map((h) => h.mesaj), maliyet: r.maliyet, ...meta };
}

/**
 * Modele veritabanı kimliği değil PAKETE YEREL numara (1…n) gösterilir —
 * `paketKur` aynı sırayla numaralar.
 *
 * Önceden değerlendirme ve karşı görüş blokları `belge.id`yi taşıyordu
 * (ör. `<belge id="412">`); kural "model asla belge.id görmez" diyordu.
 * OpenAI'de şema `belge_id ≤ 64` sınırını üretimde zorladığı için model
 * yanlış küçük numara yazıyor, doğrulayıcı metinden atfı düzeltiyordu —
 * hata gizliydi. Claude gördüğü kimliği yazdı ve şema reddetti (eval).
 */
function yereleCevir<T extends { id: number }>(belgeler: readonly T[]): T[] {
  return belgeler.map((b, i) => ({ ...b, id: i + 1 }));
}

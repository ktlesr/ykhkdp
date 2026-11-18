import { konuUygunlugu, PROMPTLAR } from "@ykh/ai-gateway";
import { denetle, islem, type Baglam } from "@ykh/database";
import { dengeliSec, yerelMi, type UygunlukKarari } from "@ykh/evidence-validation";
import { aiMaliyeti } from "@ykh/observability";
import { modelSec } from "./model-secimi.ts";

/**
 * Konu uygunluğu — yalnızca BAŞLIK verilir; ilin taranmış kanıtlarından
 * başlıkla örtüşenler bulunur ve model "bu konu bu ile uygun mu?" sorusunu
 * cevaplar. Uygunsa gerekçeyi hazırlar, değilse nedenini söyler.
 *
 * Puanlamaz, kaydetmez, sıralamaya dokunmaz: çıktı ajansın "Konu puanla"
 * formuna taşıyacağı bir TASLAKTIR. Kanıt yoksa model çağrılmaz.
 */

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };
const YEREL_SINIR = 40;
const DIGER_SINIR = 20;
/** Her başlıkta geçen, konuyu ayırt etmeyen kökler. */
const GENEL = new Set(["üreti", "imala", "tesis", "yatır", "sanay", "sektö", "kurul", "merke", "ürünl", "ürünü", "işlem", "katma", "değer", "yükse", "enteg", "asgar", "yönel"]);

export type UygunlukSonucu = {
  karar: UygunlukKarari | "kanit_yok" | "taranmadi" | "hata";
  gerekce: string;
  sentez: string;
  neden: string;
  kanitlar: Array<{ belge: string; bolum: string | null; alinti: string; yerel: boolean }>;
  model: string | null;
};

/** Başlığın ayırt edici kökleri → `kök:* | kök:*` (önek araması). */
export function baslikSorgusu(baslik: string, yerAdlari: readonly string[]): string {
  const yer = new Set(yerAdlari.map((a) => a.toLocaleLowerCase("tr-TR").slice(0, 5)));
  const kokler = [
    ...new Set(
      baslik
        .toLocaleLowerCase("tr-TR")
        .split(/[^\p{L}]+/u)
        .filter((w) => w.length >= 4)
        .map((w) => w.slice(0, 5))
        .filter((k) => !GENEL.has(k) && !yer.has(k)),
    ),
  ].slice(0, 10);
  return kokler.map((k) => `${k}:*`).join(" | ");
}

export async function konuUygunluguYap(b: Baglam, girdi: { ilKod: string; baslik: string }): Promise<UygunlukSonucu> {
  const bos = { gerekce: "", sentez: "", kanitlar: [], model: null };
  const [il] = await islem(SERVIS, (sql) => sql<{ ad: string; ajans_kod: string }[]>`select ad, ajans_kod from il where kod = ${girdi.ilKod}`);
  if (!il) return { ...bos, karar: "hata", neden: "İl bulunamadı." };
  const ilceler = (await islem(SERVIS, (sql) => sql<{ ad: string }[]>`select ad from ilce where il_kod = ${girdi.ilKod} order by ad`))
    .map((x) => x.ad)
    .filter((a) => a !== "Merkez");
  const hedef = { ilKod: girdi.ilKod, adlar: [il.ad, ...ilceler] };
  const { model: taramaModeli } = await modelSec("tarama");
  const surum = PROMPTLAR.kanit_cikarimi.surum;
  const kapsam = (sql: Parameters<Parameters<typeof islem>[1]>[0]) => sql`
    k.prompt_surum = ${surum} and k.model_snapshot = ${taramaModeli}
    and (p.il_kod = ${girdi.ilKod} or (p.il_kod is null and p.ajans_kod = ${il.ajans_kod}) or (p.il_kod is null and p.ajans_kod is null))`;

  const q = baslikSorgusu(girdi.baslik, hedef.adlar);
  const satirlar = q
    ? await islem(SERVIS, (sql) =>
        sql<{ id: string; tur: string; konu: string; alinti: string; ad: string; bolum: string | null; metin: string; il_kod: string | null }[]>`
          select k.id, k.tur, k.konu, k.alinti, p.ad, p.bolum, p.metin, p.il_kod
          from kanit k join belge p on p.id = k.belge_id
          where ${kapsam(sql)}
            and to_tsvector('simple', k.konu || ' ' || k.alinti) @@ to_tsquery('simple', ${q})
          order by ts_rank(to_tsvector('simple', k.konu || ' ' || k.alinti), to_tsquery('simple', ${q})) desc, k.id
          limit 400
        `,
      )
    : [];
  if (!satirlar.length) {
    const [{ n }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`select count(*) as n from kanit k join belge p on p.id = k.belge_id where ${kapsam(sql)}`);
    return Number(n)
      ? { ...bos, karar: "kanit_yok", neden: `${il.ad} için taranmış ${n} kanıt içinde bu başlıkla örtüşen pasaj yok. Konu yüklü belgelerde geçmiyor; belgeye dayanan bir gerekçe hazırlanamaz.` }
      : { ...bos, karar: "taranmadi", neden: `${il.ad} belgeleri seçili tarama modeliyle henüz taranmamış. Önce "Belgelerden aday keşfi"ni başlatın; tarama bitince analiz yapılabilir.` };
  }

  const hepsi = satirlar.map((x) => ({
    kanitId: Number(x.id), tur: x.tur, konu: x.konu, metin: x.alinti, belge: x.ad, bolum: x.bolum,
    kaynak: `${x.ad}${x.bolum ? ` · ${x.bolum}` : ""}`,
    yerel: yerelMi({ metin: x.metin, ilKod: x.il_kod }, x.alinti, hedef),
  }));
  const goster = (idler: readonly number[]) =>
    idler.flatMap((id) => hepsi.filter((d) => d.kanitId === id)).map((d) => ({ belge: d.belge, bolum: d.bolum, alinti: d.metin, yerel: d.yerel }));
  const yerel = dengeliSec(hepsi.filter((d) => d.yerel), (d) => d.belge, YEREL_SINIR);
  if (!yerel.length) {
    return {
      ...bos, karar: "uygun_degil", kanitlar: goster(hepsi.slice(0, 4).map((d) => d.kanitId)),
      neden: `Konu belgelerde geçiyor ama ${il.ad} ya da ilçeleriyle birlikte anıldığı tek bir pasaj yok; "neden burada?" sorusuna belgeden cevap çıkmıyor.`,
    };
  }
  const defter = [...yerel, ...hepsi.filter((d) => !d.yerel).slice(0, DIGER_SINIR)].map((d, i) => ({ ...d, no: i + 1 }));

  const { istemci, model } = await modelSec("yargi");
  const r = await konuUygunlugu(istemci, model, { il: il.ad, ilceler, baslik: girdi.baslik, defter });
  aiMaliyeti({ model: r.maliyet?.model ?? model, girdiToken: r.maliyet?.girdiToken ?? 0, ciktiToken: r.maliyet?.ciktiToken ?? 0, promptSurum: r.promptSurum, sonuc: r.ok ? "ok" : "red" });
  const karar = r.ok ? r.sonuc.karar : "hata";
  await islem(b, (sql) => denetle(sql, b, "konu_uygunlugu", "il", girdi.ilKod, { baslik: girdi.baslik.slice(0, 140), karar, model: r.modelSnapshot, promptSurum: r.promptSurum }));
  if (!r.ok) return { ...bos, karar: "hata", neden: `Analiz tamamlanamadı (${r.asama}): ${(r.hatalar[0] ?? "").slice(0, 200)}`, model: r.modelSnapshot };
  return { ...r.sonuc, kanitlar: goster(r.sonuc.kanitIdleri), model: r.modelSnapshot };
}

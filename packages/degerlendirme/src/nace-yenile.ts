/**
 * Ana NACE'yi yeniden seç — yapay zekânın atadığı ana kodu NACE'nin bütün
 * sınıflarından çıkarımla yeniden seçer (`nace-onerisi` güncel sürümü). Eski talimat kelime
 * aramasıyla gelen 25 aday arasından seçiyordu ve doğru kod çoğu zaman listede
 * yoktu (kaplıca → 84.12, soğan işleme → 46.61).
 *
 *   pnpm --filter @ykh/degerlendirme nace -- --il konya,amasya     kuru koşu: yalnızca gösterir
 *   pnpm --filter @ykh/degerlendirme nace -- --hepsi --yaz         81 il, kayda yazar
 *
 * Yalnızca onay bekleyen ve kodu YAPAY ZEKÂNIN atadığı öneriler (`nace_kaynagi
 * = 'ai'`); yatırımcının girdiği ve ajansın düzelttiği kod, onaylanmış ve
 * reddedilmiş kayıt dokunulmaz. Kod değişince eski kod denetime yazılır ve ek
 * NACE yeni ana koda göre yenilenir. Puan, dayanak ve sıralama değişmez.
 * Yarıda kesilen koşu kaldığı yerden sürer (yeni sürümle seçilmiş olan atlanır).
 */
import { parseArgs } from "node:util";
import { naceOner, PROMPTLAR } from "@ykh/ai-gateway";
import { denetle, islem, kapat, type Baglam } from "@ykh/database";
import { naceSiniflari } from "@ykh/retrieval";
import { ekNaceYenile } from "./kapsam.ts";
import { modelSec } from "./model-secimi.ts";

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };
const ESZAMANLI = 3; // ponytail: kapsam-netlestir ile aynı sabit (sunucu sınırı 8)
const SURUM = PROMPTLAR.nace_onerisi.surum;
const { values: a } = parseArgs({ options: { il: { type: "string" }, hepsi: { type: "boolean" }, yaz: { type: "boolean" } } });
if (!a.il && !a.hepsi) throw new Error("--il <kod,kod> ya da --hepsi verin.");
const iller = a.il?.split(/[\s,]+/).filter(Boolean) ?? null;

const konular = await islem(SERVIS, (sql) => sql<{ id: string; il_kod: string; baslik: string; gerekce: string; nace_kod: string; tanim: string | null; kapsam: { ad: string }[] | null }[]>`
  select o.id, d.il_kod, o.baslik, o.gerekce, o.nace_kod, n.tanim, o.kapsam
  from oneri o join donem d on d.id = o.donem_id left join nace n on n.kod = o.nace_kod
  where o.nace_kaynagi = 'ai' and o.durum = 'onay_bekliyor'
    and ${iller ? sql`d.il_kod = any(${iller})` : sql`true`}
    and not exists (select 1 from denetim x where x.nesne_tip = 'oneri' and x.nesne_id = o.id::text
                    and x.eylem = 'nace_ai_atandi' and x.detay->>'promptSurum' = ${SURUM})
  order by d.il_kod, o.id
`);
const siniflar = await naceSiniflari(SERVIS);
const tanim = new Map(siniflar.map((s) => [s.kod, s.tanim]));
const { istemci, model } = await modelSec("yargi");
console.log(`${konular.length} öneri · ${SURUM} · ${a.yaz ? "KAYDA YAZILACAK" : "kuru koşu, hiçbir şey yazılmaz"}`);
const sayac = { degisti: 0, ayni: 0, hata: 0 };

async function isle(o: (typeof konular)[number]): Promise<void> {
  const id = Number(o.id);
  const bas = `\n[${o.il_kod}] ${id} ${o.baslik}\n  eski : ${o.nace_kod} ${o.tanim ?? ""}`;
  const n = await naceOner(istemci, model, { baslik: o.baslik, gerekce: o.gerekce, adaylar: siniflar });
  if (!n.ok) { sayac.hata++; console.log(`${bas}\n  —    : ${n.hatalar[0] ?? n.asama}`); return; }
  const s = n.veri.adaylar[0];
  const ayni = s.kod === o.nace_kod;
  let sonuc = `${bas}\n  yeni : ${s.kod} ${tanim.get(s.kod) ?? ""} (${s.guven})${ayni ? " · aynı" : ""}\n         ${s.gerekce}`;
  if (a.yaz) {
    // Aynı kod da denetime yazılır: yeni sürümle bakıldı, yeniden koşuda atlanır.
    const yazildi = await islem(SERVIS, async (sql) => {
      const g = ayni ? { count: 1 } : await sql`update oneri set nace_kod = ${s.kod}, guncellendi = now()
        where id = ${id} and nace_kaynagi = 'ai' and nace_kod = ${o.nace_kod} and durum = 'onay_bekliyor'`;
      if (!g.count) return false;
      await denetle(sql, SERVIS, "nace_ai_atandi", "oneri", id, { kod: s.kod, eski: o.nace_kod, guven: s.guven, gerekce: s.gerekce, model: n.modelSnapshot, promptSurum: n.promptSurum, not: "Ana kod bütün NACE sınıflarından yeniden seçildi — doğrulanmamış atama, ajans düzeltebilir." });
      return true;
    });
    if (!yazildi) sonuc += "\n  → yazılmadı: öneri bu arada değişti";
    else if (!ayni) sonuc += `\n  → yazıldı${o.kapsam?.length ? await ekNaceYenile({ id, baslik: o.baslik, naceKod: s.kod }, o.kapsam.map((g) => g.ad), "Ana NACE yeniden seçildikten sonra yenilendi.") : ""}`;
  }
  if (ayni) sayac.ayni++; else sayac.degisti++;
  console.log(sonuc);
}

const sira = [...konular];
await Promise.all(Array.from({ length: Math.min(ESZAMANLI, sira.length) }, async () => {
  for (let o = sira.shift(); o; o = sira.shift()) {
    await isle(o).catch((e: unknown) => { sayac.hata++; console.log(`\n[${o.il_kod}] ${o.id} ${o.baslik}\n  —    : ${e instanceof Error ? e.message : e}`); });
  }
}));
console.log(`\n${konular.length} öneri: ${sayac.degisti} kod değişti${a.yaz ? " (yazıldı)" : ""}, ${sayac.ayni} aynı kaldı, ${sayac.hata} hata`);
await kapat();

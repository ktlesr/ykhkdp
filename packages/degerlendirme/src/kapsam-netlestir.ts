/**
 * Ürün listesini netleştirme — onay bekleyen keşif adaylarının ürün gruplarını
 * tebliğdeki parantez içi gibi somut ürünlere çevirir. Tarama, aday üretimi ve
 * puanlama YENİDEN KOŞMAZ; puan, dayanak ve sıralama değişmez.
 *
 *   pnpm --filter @ykh/degerlendirme kapsam -- --il kutahya,usak     kuru koşu: yalnızca gösterir
 *   pnpm --filter @ykh/degerlendirme kapsam -- --hepsi               81 il, kuru koşu
 *   pnpm --filter @ykh/degerlendirme kapsam -- --hepsi --yaz         81 il, kayda yazar
 *   pnpm --filter @ykh/degerlendirme kapsam -- --il kutahya --baslik "…" --gerekce "…"   elle tek konu
 *
 * `--yaz` yalnızca `oneri.kapsam`ı ve yapay zekânın atadığı ek NACE kodlarını
 * değiştirir; eski liste denetime yazılır (`kapsam_netlestirildi`). Dokunulmaz:
 * ajansın düzelttiği öneri, onaylanmış/reddedilmiş kayıt, daha önce
 * netleştirilmiş öneri (yarıda kesilen koşu kaldığı yerden sürer). En az iki
 * ürün çıkmayan adayda mevcut liste kalır.
 */
import { parseArgs } from "node:util";
import { naceKapsami } from "@ykh/ai-gateway";
import { denetle, islem, kapat, type Baglam } from "@ykh/database";
import { naceAdaylari } from "@ykh/retrieval";
import { urunleriNetlestir } from "./kapsam.ts";
import { modelSec } from "./model-secimi.ts";

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };
const ESZAMANLI = 3; // ponytail: sabit; işleyici aynı anahtarı ayrıca kullanıyor (sunucu sınırı 8)
const { values: a } = parseArgs({
  options: { il: { type: "string" }, baslik: { type: "string" }, gerekce: { type: "string" }, hepsi: { type: "boolean" }, yaz: { type: "boolean" } },
});
if (!a.il && !a.hepsi) throw new Error("--il <kod,kod> ya da --hepsi verin.");
if (a.yaz && a.baslik) throw new Error("--yaz elle verilen konuyla kullanılmaz.");

type Konu = { id: number | null; ilKod: string; baslik: string; gerekce: string; naceKod: string | null; kanitIdleri: number[]; eski: unknown[] };
// PowerShell virgüllü değeri boşlukla birleştirip verir; ikisi de kabul edilir.
const iller = a.il?.split(/[\s,]+/).filter(Boolean) ?? null;
const konular: Konu[] = a.baslik
  ? [{ id: null, ilKod: a.il!, baslik: a.baslik, gerekce: a.gerekce ?? "", naceKod: null, kanitIdleri: [], eski: [] }]
  : (
      await islem(SERVIS, (sql) => sql<{ id: string; il_kod: string; baslik: string; gerekce: string; nace_kod: string | null; kanitlar: string[] | null; kapsam: unknown[] | null }[]>`
        select o.id, d.il_kod, o.baslik, o.gerekce, o.nace_kod, o.kapsam,
               (select array_agg((x->>'kanit_id')::bigint) from jsonb_array_elements(o.kesif_kanit) x) as kanitlar
        from oneri o join donem d on d.id = o.donem_id
        where o.kesif_id is not null and o.koken = 'yeni' and o.durum = 'onay_bekliyor'
          and ${iller ? sql`d.il_kod = any(${iller})` : sql`true`}
          and not exists (select 1 from denetim n where n.nesne_tip = 'oneri' and n.nesne_id = o.id::text
                          and n.eylem in ('oneri_duzeltildi', 'kapsam_netlestirildi'))
        order by d.il_kod, o.id
      `)
    ).map((o) => ({ id: Number(o.id), ilKod: o.il_kod, baslik: o.baslik, gerekce: o.gerekce, naceKod: o.nace_kod, kanitIdleri: (o.kanitlar ?? []).map(Number), eski: o.kapsam ?? [] }));

console.log(`${konular.length} konu · ${a.yaz ? "KAYDA YAZILACAK" : "kuru koşu, hiçbir şey yazılmaz"}`);
const sayac = { yazilan: 0, kalan: 0, hata: 0 };

async function isle(k: Konu): Promise<void> {
  const r = await urunleriNetlestir(k).catch((e: unknown) => ({ ok: false as const, neden: e instanceof Error ? e.message : String(e) }));
  const satir = [`\n[${k.ilKod}] ${k.id ?? ""} ${k.baslik}`];
  const eskiAd = (k.eski as { ad: string }[]).map((g) => g.ad);
  if (eskiAd.length) satir.push(`  eski : ${eskiAd.join(" · ")}`);
  if (!r.ok) {
    sayac.hata++;
    console.log([...satir, `  —    : ${r.neden}`].join("\n"));
    return;
  }
  const isaret = (u: (typeof r.urunler)[number]) => (u.kanitIdleri.length ? (u.yerel ? "●" : "○") : "◌");
  satir.push(`  yeni : ${r.urunler.map((u) => `${isaret(u)} ${u.ad}`).join(" · ") || "(boş)"}`);
  for (const u of r.urunler) satir.push(`         ${u.ad} [unsur ${u.unsur ?? "-"}]: ${u.neden ?? ""}`);
  for (const d of r.dusenler) satir.push(`  düştü: ${d}`);
  if (r.urunler.length < 2) {
    sayac.kalan++;
    console.log([...satir, "  → mevcut liste kalır (iki üründen az)"].join("\n"));
    return;
  }
  if (a.yaz && k.id) {
    const kapsam = r.urunler.map((u) => ({ ad: u.ad, kanit_id: u.kanitIdleri, yerel: u.yerel, neden: u.neden, unsur: u.unsur }));
    const yazildi = await islem(SERVIS, async (sql) => {
      // Karar bu arada verildiyse (onay, ret, düzeltme) dokunma.
      const g = await sql`update oneri set kapsam = ${sql.json(kapsam as never)}, guncellendi = now() where id = ${k.id} and durum = 'onay_bekliyor'`;
      if (!g.count) return false;
      await denetle(sql, SERVIS, "kapsam_netlestirildi", "oneri", k.id, { eski: k.eski, yeni: kapsam, dusenler: r.dusenler.slice(0, 10), model: r.model, promptSurum: r.promptSurum });
      return true;
    });
    if (!yazildi) { sayac.kalan++; console.log([...satir, "  → yazılmadı: öneri artık onay beklemiyor"].join("\n")); return; }
    sayac.yazilan++;
    satir.push(`  → yazıldı${await ekNaceYenile(k, r.urunler.map((u) => u.ad))}`);
  }
  console.log(satir.join("\n"));
}

/** Ek NACE yeni ürün adlarına göre yenilenir (değerlendirme hattındaki adımın aynısı); ajansın kodlarına dokunulmaz. En iyi çaba. */
async function ekNaceYenile(k: Konu, adlar: string[]): Promise<string> {
  try {
    const gruplar = await Promise.all(adlar.map(async (ad) => {
      const [dar, genis] = await Promise.all([naceAdaylari(SERVIS, ad, 8), naceAdaylari(SERVIS, `${k.baslik} ${ad}`, 8)]);
      return { ad, adaylar: [...new Map([...dar, ...genis].map((x) => [x.kod, x])).values()].slice(0, 14) };
    }));
    const { istemci, model } = await modelSec("yargi");
    const e = await naceKapsami(istemci, model, { baslik: k.baslik, anaKod: k.naceKod, gruplar });
    if (!e.ok) return " · ek NACE yenilenemedi (eskisi kaldı)";
    await islem(SERVIS, async (sql) => {
      await sql`delete from oneri_nace where oneri_id = ${k.id} and kaynak = 'ai'`;
      let sira = 1;
      for (const x of e.kodlar) {
        await sql`insert into oneri_nace (oneri_id, nace_kod, urun_grubu, gerekce, guven, kaynak, sira)
                  values (${k.id}, ${x.kod}, ${x.urunGrubu}, ${x.gerekce}, ${x.guven}, 'ai', ${sira++}) on conflict (oneri_id, nace_kod) do nothing`;
      }
      await denetle(sql, SERVIS, "ek_nace_ai_atandi", "oneri", k.id, { kodlar: e.kodlar, model: e.modelSnapshot, promptSurum: e.promptSurum, not: "Ürün listesi netleştirildikten sonra yenilendi." });
    });
    return ` · ${e.kodlar.length} ek NACE`;
  } catch (h) {
    return ` · ek NACE yenilenemedi: ${h instanceof Error ? h.message.slice(0, 80) : h}`;
  }
}

const sira = [...konular];
await Promise.all(Array.from({ length: Math.min(ESZAMANLI, sira.length) }, async () => { for (let k = sira.shift(); k; k = sira.shift()) await isle(k); }));

console.log("\n● ilin kanıtına bağlı   ○ kanıta bağlı, il dışı   ◌ resmî örnek ya da katalogdan, belgeye bağlanmadı");
console.log(`${konular.length} konu: ${a.yaz ? `${sayac.yazilan} yazıldı, ` : ""}${sayac.kalan} mevcut listeyle kaldı, ${sayac.hata} hata`);
await kapat();

import { readFile } from "node:fs/promises";
import { sahip } from "./baglanti.ts";
import { yolCoz } from "./belge-yukle.ts";

/**
 * Resmî Yerel Yatırım Konuları Listesi yükleyici.
 *
 * Kaynak: Sanayi ve Teknoloji Bakanlığı "Yerel Yatırım Konuları Listesi
 * Tebliği" — her il için o yılın dört yatırım konusu.
 *
 * FAIL-CLOSED: doğrulamadan geçmeyen dosya HİÇ yüklenmez. Yatırım konusunu
 * yanlış ile atamak, bu ürünün var olma sebebi olan hatanın kendisidir; eksik
 * veya tanınmayan il varsa yükleme reddedilir ve hangileri olduğu yazılır.
 */

export type KonuKaydi = {
  il: string;
  yil: number;
  sira?: number;
  konu: string;
  gerekce?: string;
  ajans?: string;
};

export type Yukleme = { yil: number; konu: number; il: number; gerekceli: number };

/** Şapkalı harfleri katlar: tebliğ "Elazığ" yazar, il kaydı "Elâzığ" olabilir. */
const SAPKA: Record<string, string> = { â: "a", î: "i", û: "u" };
const anahtar = (s: string) =>
  [...s.trim()].map((h) => SAPKA[h] ?? h).join("").toLocaleLowerCase("tr-TR");

/** İl başına beklenen konu sayısı — ürünün slot sayısıyla aynı (brief §5). */
const IL_BASINA = 4;

export async function konulariYukle(dosya: string, kaynak: string): Promise<Yukleme> {
  const ham = JSON.parse(await readFile(yolCoz(dosya), "utf8")) as unknown;
  if (!Array.isArray(ham)) throw new Error(`${dosya}: kök dizi olmalı.`);
  const kayitlar = ham as KonuKaydi[];
  if (!kayitlar.length) throw new Error(`${dosya}: kayıt yok.`);

  const sql = sahip();
  const iller = await sql<{ kod: string; ad: string }[]>`select kod, ad from il`;
  const eslesme = new Map(iller.map((i) => [anahtar(i.ad), i.kod]));

  // ── doğrulama · hepsi geçmeden tek satır yazılmaz ────────────────────────
  const hata: string[] = [];
  const yillar = new Set<number>();
  const ilKonu = new Map<string, KonuKaydi[]>();

  for (const [i, r] of kayitlar.entries()) {
    const kod = eslesme.get(anahtar(r.il ?? ""));
    if (!kod) {
      hata.push(`${i + 1}. kayıt: tanınmayan il "${r.il}"`);
      continue;
    }
    if (!Number.isInteger(r.yil)) {
      hata.push(`${i + 1}. kayıt (${r.il}): yıl sayı değil`);
      continue;
    }
    if (!r.konu || r.konu.trim().length < 8) {
      hata.push(`${i + 1}. kayıt (${r.il}): konu başlığı çok kısa`);
      continue;
    }
    yillar.add(r.yil);
    ilKonu.set(kod, [...(ilKonu.get(kod) ?? []), r]);
  }

  if (yillar.size !== 1) {
    hata.push(`dosyada tek yıl olmalı, bulunan: ${[...yillar].join(", ") || "yok"}`);
  }

  // Eksik il sessizce geçilmez: 81 ilin tamamı listede olmak zorunda.
  const eksik = iller.filter((i) => !ilKonu.has(i.kod)).map((i) => i.ad);
  if (eksik.length) hata.push(`konusu olmayan il (${eksik.length}): ${eksik.join(", ")}`);

  const yanlisSayi = [...ilKonu].filter(([, k]) => k.length !== IL_BASINA);
  if (yanlisSayi.length) {
    const ad = new Map(iller.map((i) => [i.kod, i.ad]));
    hata.push(
      `il başına ${IL_BASINA} konu olmalı; sapan: ` +
        yanlisSayi.map(([kod, k]) => `${ad.get(kod)}=${k.length}`).join(", "),
    );
  }

  if (hata.length) {
    throw new Error(`${dosya} yüklenmedi — doğrulama başarısız:\n  ${hata.join("\n  ")}`);
  }

  // ── yazma ────────────────────────────────────────────────────────────────
  const yil = [...yillar][0];
  const satirlar = [...ilKonu].flatMap(([kod, k]) =>
    k.map((r, i) => ({
      il_kod: kod,
      yil,
      sira: r.sira ?? i + 1,
      baslik: r.konu.trim(),
      gerekce: (r.gerekce ?? "").trim(),
      kaynak,
    })),
  );

  await sql`delete from yatirim_konusu where yil = ${yil}`;
  for (let i = 0; i < satirlar.length; i += 200) {
    await sql`
      insert into yatirim_konusu ${sql(
        satirlar.slice(i, i + 200),
        "il_kod",
        "yil",
        "sira",
        "baslik",
        "gerekce",
        "kaynak",
      )}
    `;
  }

  return {
    yil,
    konu: satirlar.length,
    il: ilKonu.size,
    gerekceli: satirlar.filter((s) => s.gerekce.length > 0).length,
  };
}

/** `docs/` altındaki resmî tebliğ listeleri — `pnpm db:konular` ile yüklenir. */
export const RESMI_LISTELER = [
  {
    dosya: "docs/yerel_kalkinma_hamlesi_2025_iller.json",
    kaynak: "Yerel Yatırım Konuları Listesi Tebliği · 2025",
  },
  {
    dosya: "docs/yerel_kalkinma_hamlesi_2026_iller.json",
    kaynak: "Yerel Yatırım Konuları Listesi Tebliği · 2026",
  },
] as const;

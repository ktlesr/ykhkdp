import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { sahip } from "./baglanti.ts";

/**
 * Migration çalıştırıcı. Numaralı .sql dosyaları, ileri ve geri.
 *
 * ponytail: migration motoru diye bir bağımlılık yok — sıralı dosya + bir
 * tablo yeter. Geri alma dosyaları `.down.sql` olarak yanında durur ve
 * `pnpm test` içinde gerçekten çalıştırılır.
 */

const KLASOR = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

export type Adim = { ad: string; up: string; down: string | null };

export async function adimlar(): Promise<Adim[]> {
  const dosyalar = await readdir(KLASOR);
  const upler = dosyalar.filter((d) => d.endsWith(".sql") && !d.endsWith(".down.sql")).sort();
  return Promise.all(
    upler.map(async (d) => {
      const ad = d.replace(/\.sql$/, "");
      const downYol = join(KLASOR, `${ad}.down.sql`);
      return {
        ad,
        up: await readFile(join(KLASOR, d), "utf8"),
        down: await readFile(downYol, "utf8").catch(() => null),
      };
    }),
  );
}

/**
 * Hedef veritabanı yoksa oluşturur (bakım veritabanına bağlanarak).
 * Testler ayrı bir veritabanı kullanıyor; ilk çalıştırmada elle kurmak gerekmesin.
 */
async function veritabaniHazirla(): Promise<void> {
  const url = process.env.DATABASE_URL_OWNER;
  if (!url) return;
  const ad = new URL(url).pathname.slice(1);
  if (!ad || ad === "postgres") return;
  try {
    await sahip()`select 1`;
    return; // bağlanıyor, var
  } catch (e) {
    if ((e as { code?: string }).code !== "3D000") throw e; // 3D000 = invalid_catalog_name
  }
  const bakim = postgres(url.replace(/\/[^/]+$/, "/postgres"), { onnotice: () => {}, prepare: false });
  try {
    await bakim.unsafe(`create database ${JSON.stringify(ad).replace(/"/g, '"')}`);
  } finally {
    await bakim.end();
  }
}

async function tabloyuHazirla() {
  await sahip()`
    create table if not exists migration (
      ad text primary key,
      uygulandi timestamptz not null default now()
    )
  `;
}

export async function yukari(): Promise<string[]> {
  await veritabaniHazirla();
  await tabloyuHazirla();
  const sql = sahip();
  const uygulanan = new Set((await sql<{ ad: string }[]>`select ad from migration`).map((r) => r.ad));
  const yeni: string[] = [];

  for (const adim of await adimlar()) {
    if (uygulanan.has(adim.ad)) continue;
    await sql.unsafe(adim.up);
    await sql`insert into migration (ad) values (${adim.ad})`;
    yeni.push(adim.ad);
  }
  return yeni;
}

export async function asagi(kaçAdim = 1): Promise<string[]> {
  await tabloyuHazirla();
  const sql = sahip();
  const uygulanan = (await sql<{ ad: string }[]>`select ad from migration order by ad desc`).map((r) => r.ad);
  const hepsi = await adimlar();
  const geri: string[] = [];

  for (const ad of uygulanan.slice(0, kaçAdim)) {
    const adim = hepsi.find((a) => a.ad === ad);
    if (!adim?.down) throw new Error(`${ad} için geri alma dosyası yok.`);
    await sql.unsafe(adim.down);
    await sql`delete from migration where ad = ${ad}`;
    geri.push(ad);
  }
  return geri;
}

export async function sifirla(): Promise<void> {
  await veritabaniHazirla();
  const sql = sahip();
  await sql.unsafe(`
    drop schema public cascade;
    create schema public;
    grant all on schema public to public;
  `);
  await sql`drop table if exists migration`;
}

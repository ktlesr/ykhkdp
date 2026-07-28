import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { readFile } from "node:fs/promises";
import { islem, kapat, type Baglam } from "@ykh/database";
import { sifirla, yukari } from "@ykh/database/migrate";
import { seed } from "@ykh/database/seed";
import { ISLER } from "./isler.ts";
import { birIsAl, isKuyruguna, isiTamamla } from "./index.ts";

const SERVIS: Baglam = { gonderenRef: null, rol: "sistem_yoneticisi" };

let oneriId: number;
after(async () => { await kapat(); });

// Bu paket kendi durumunu kurar; başka bir test paketinin bıraktığı duruma
// (ör. kilitlenmiş dönem, dolmuş boş slot) bağımlı kalmaz.
before(async () => {
  await sifirla();
  await yukari();
  await seed();
  const [o] = await islem(SERVIS, (sql) =>
    sql<{ id: number }[]>`select id from oneri where durum = 'konu_adayi' order by id limit 1`,
  );
  oneriId = o.id;
});

test("kuyruk: iş alınır, bir kez alınır, tamamlanır", async () => {
  const id = await isKuyruguna("rapor_uret", { il: "usak", yil: "2027" });
  const is = await birIsAl();
  assert.equal(is?.id, id);
  assert.equal(await birIsAl(), null, "aynı iş ikinci kez alınamaz");
  await isiTamamla(id, "test");
});

test("rapor işi diske yazar ve içerik kuralları taşır", async () => {
  const yol = await ISLER.rapor_uret(SERVIS, { il: "usak", yil: "2027" });
  const html = await readFile(yol, "utf8");
  assert.match(html, /Uşak — 2027 dönemi/);
  assert.match(html, /Devamlılık payı/);
  assert.match(html, /Slot boş/);
  assert.match(html, /TR33-2027-v1/);
});

test("iddia çıkarımı doğrulanmamış bulgu olarak kaydeder, puana girmez", async () => {
  const once = await bulguSayisi(oneriId);
  const sonuc = await ISLER.iddia_cikarimi(SERVIS, { oneriId });
  assert.match(sonuc, /kaydedildi|Reddedildi|atlandı/);

  const bulgular = await islem(SERVIS, (sql) =>
    sql<{ dogrulama_durumu: string; model_snapshot: string; prompt_surum: string }[]>`
      select dogrulama_durumu, model_snapshot, prompt_surum from bulgu where oneri_id = ${oneriId}
    `,
  );
  if (bulgular.length > once) {
    assert.ok(bulgular.every((b) => b.dogrulama_durumu === "ai_bulgusu"), "AI bulgusu doğrulanmamış olmalı");
    assert.ok(bulgular.every((b) => b.model_snapshot !== "latest"), "snapshot pinli olmalı");
    assert.ok(bulgular.every((b) => b.prompt_surum.length > 0), "prompt sürümü kaydedilmeli");
  }
});

test("bilinmeyen iş tipi kayıtlıdır ve çalıştırılmaz", () => {
  assert.equal(ISLER["rastgele_is"], undefined);
  assert.deepEqual(Object.keys(ISLER).sort(), ["iddia_cikarimi", "rapor_uret"]);
});

async function bulguSayisi(id: number): Promise<number> {
  const [{ n }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`select count(*) as n from bulgu where oneri_id = ${id}`);
  return Number(n);
}

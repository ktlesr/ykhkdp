import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { islem, kapat, type Baglam } from "@ykh/database";
import { sifirla, yukari } from "@ykh/database/migrate";
import { seed } from "@ykh/database/seed";
import { degerlendirmeYap } from "@ykh/degerlendirme";
import { birOneriAl, MAKS_DENEME } from "./index.ts";

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };

let oneriId: number;
after(async () => { await kapat(); });

// Bu paket kendi durumunu kurar; başka bir test paketinin bıraktığı duruma bağlı kalmaz.
before(async () => {
  await sifirla();
  await yukari();
  await seed();
  const [o] = await islem(SERVIS, (sql) =>
    sql<{ id: number }[]>`select id from oneri where durum = 'degerlendiriliyor' order by id limit 1`,
  );
  oneriId = Number(o.id);  // postgres.js int8'i string döndürür
});

test("kuyruk = degerlendiriliyor durumu; aynı öneri iki kez alınmaz", async () => {
  const alinan = await birOneriAl();
  assert.equal(alinan, oneriId);

  // deneme sayacı arttı; MAKS_DENEME'ye kadar tekrar alınabilir, sonra durur.
  for (let i = 1; i < MAKS_DENEME; i++) assert.equal(await birOneriAl(), oneriId);
  assert.equal(await birOneriAl(), null, "deneme sınırı aşılınca alınmaz");

  // testin geri kalanı için sayacı sıfırla
  await islem(SERVIS, (sql) => sql`update oneri set deneme = 0 where id = ${oneriId}`);
});

test("değerlendirme: NACE atanır, puan yazılır, durum onay_bekliyor olur", async () => {
  const [once] = await islem(SERVIS, (sql) =>
    sql<{ nace_kod: string | null; durum: string }[]>`select nace_kod, durum from oneri where id = ${oneriId}`,
  );
  assert.equal(once.nace_kod, null, "seed'de NACE boş olmalı");
  assert.equal(once.durum, "degerlendiriliyor");

  const sonuc = (await degerlendirmeYap(SERVIS, oneriId)).mesaj;
  assert.match(sonuc, /puan hazır|Reddedildi|belge yok/);

  const [sonra] = await islem(SERVIS, (sql) =>
    sql<{ nace_kod: string | null; nace_kaynagi: string | null; durum: string }[]>`
      select nace_kod, nace_kaynagi, durum from oneri where id = ${oneriId}
    `,
  );
  assert.ok(sonra.nace_kod, "AI NACE atamalı");
  assert.equal(sonra.nace_kaynagi, "ai", "kaynak 'ai' işaretlenmeli");
  assert.equal(sonra.durum, "onay_bekliyor", "puan doğrulanmamış → onay bekler");
});

test("değerlendirme kaydı model künyesi ve dayanak taşır", async () => {
  const [d] = await islem(SERVIS, (sql) =>
    sql<{ dayanak: number; model_snapshot: string; prompt_surum: string; alintilar: unknown[] }[]>`
      select dayanak, model_snapshot, prompt_surum, alintilar from degerlendirme where oneri_id = ${oneriId}
    `,
  );
  assert.ok(d, "değerlendirme kaydı olmalı");
  assert.notEqual(d.model_snapshot, "latest");
  assert.equal(d.prompt_surum, "degerlendirme-v2");
  assert.ok(d.dayanak >= 0 && d.dayanak <= 100);
});

test("AI ham puanı değiştirilemez — trigger reddeder", async () => {
  await assert.rejects(
    () => islem(SERVIS, (sql) => sql`update degerlendirme set puanlar = '{}'::jsonb where oneri_id = ${oneriId}`),
    /değiştirilemez/i,
  );
});

test("değerlendirme sonucu aşama bilgisi taşır", async () => {
  const s = await degerlendirmeYap(SERVIS, oneriId);
  assert.ok(["tamam", "model", "belge", "nace"].includes(s.asama));
  assert.equal(typeof s.mesaj, "string");
});

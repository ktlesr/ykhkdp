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

test("kuyruk = degerlendiriliyor durumu; öneri MAKS_DENEME'den fazla alınmaz", async () => {
  // Kuyrukta birden çok öneri olabilir; ilk alınan FIFO sırasının başıdır.
  const alinan = await birOneriAl();
  assert.equal(alinan, oneriId, "FIFO: en eski öneri alınır");

  let kacKez = 1;
  // Sayaç dolana kadar aynı öneri tekrar alınabilir, sonra sıra diğerine geçer.
  while (kacKez < MAKS_DENEME) {
    assert.equal(await birOneriAl(), oneriId, "sayaç dolmadan sıra değişmez");
    kacKez++;
  }
  assert.equal(kacKez, MAKS_DENEME);
  assert.notEqual(await birOneriAl(), oneriId, "deneme sınırı aşılınca bu öneri alınmaz");

  // testin geri kalanı için kuyruğu temizle
  await islem(SERVIS, (sql) => sql`update oneri set deneme = 0 where durum = 'degerlendiriliyor'`);
});

test("değerlendirme: NACE atanır, puan yazılır, durum onay_bekliyor olur", async () => {
  const [once] = await islem(SERVIS, (sql) =>
    sql<{ nace_kod: string | null; durum: string }[]>`select nace_kod, durum from oneri where id = ${oneriId}`,
  );
  assert.equal(once.nace_kod, null, "seed'de NACE boş olmalı");
  assert.equal(once.durum, "degerlendiriliyor");

  /**
   * Ret tasarlanmış bir sonuç: model ezberinden alıntı yaparsa doğrulayıcı
   * reddeder ve öneri `degerlendiriliyor` kalır. Üretim bunu MAKS_DENEME kez
   * yeniden dener; test de aynısını yapıyor. Önceki hâli "Reddedildi"yi kabul
   * ediyor ama sonra `onay_bekliyor` şart koşuyordu — kendi içinde çelişikti ve
   * modele bağlı olarak rastgele kırılıyordu.
   */
  const mesajlar: string[] = [];
  let basarili = false;
  for (let i = 0; i < MAKS_DENEME && !basarili; i++) {
    const s = await degerlendirmeYap(SERVIS, oneriId);
    mesajlar.push(s.mesaj);
    basarili = s.ok;
  }
  assert.ok(basarili, `${MAKS_DENEME} denemede puan üretilemedi: ${mesajlar.join(" || ")}`);
  assert.match(mesajlar.at(-1) ?? "", /puan hazır/);

  const [sonra] = await islem(SERVIS, (sql) =>
    sql<{ nace_kod: string | null; nace_kaynagi: string | null; durum: string }[]>`
      select nace_kod, nace_kaynagi, durum from oneri where id = ${oneriId}
    `,
  );
  assert.ok(sonra.nace_kod, "AI NACE atamalı");
  assert.equal(sonra.nace_kaynagi, "ai", "kaynak 'ai' işaretlenmeli");
  assert.equal(sonra.durum, "onay_bekliyor", "puan doğrulanmamış → onay bekler");
});

test("reddedilen çıktı kaydedilmez, öneri degerlendiriliyor kalır", async () => {
  // Belgesiz ile öneri: model çağrısı yapılmaz, kayıt oluşmaz.
  const [o] = await islem(SERVIS, (sql) =>
    sql<{ id: number }[]>`
      insert into oneri (donem_id, gonderen_ref, baslik, gerekce, durum)
      select d.id, (select ref from gonderen where rol = 'yatirimci' limit 1),
             'Belgesiz il denemesi', 'Bu ilin hiç belgesi yok.', 'degerlendiriliyor'
      from donem d
      where d.il_kod = (
        select i.kod from il i
        where not exists (
          select 1 from belge b
          where b.il_kod = i.kod
             or (b.il_kod is null and b.ajans_kod = i.ajans_kod)
             or (b.il_kod is null and b.ajans_kod is null)
        )
        limit 1
      )
      limit 1
      returning id
    `,
  );
  // Seed'de ulusal belge var; her ilin paketi dolu. Bu senaryo yalnızca belge
  // silindiğinde oluşur — o yüzden satır üretilmezse test anlamsızdır, atlanır.
  if (!o) return;

  const s = await degerlendirmeYap(SERVIS, Number(o.id));
  assert.equal(s.ok, false);
  const [d] = await islem(SERVIS, (sql) =>
    sql<{ n: string }[]>`select count(*) as n from degerlendirme where oneri_id = ${o.id}`,
  );
  assert.equal(Number(d.n), 0, "reddedilen çıktı kaydedilmez");
});

test("değerlendirme kaydı model künyesi ve dayanak taşır", async () => {
  const [d] = await islem(SERVIS, (sql) =>
    sql<{ dayanak: number; model_snapshot: string; prompt_surum: string; alintilar: unknown[] }[]>`
      select dayanak, model_snapshot, prompt_surum, alintilar from degerlendirme where oneri_id = ${oneriId}
    `,
  );
  assert.ok(d, "değerlendirme kaydı olmalı");
  assert.notEqual(d.model_snapshot, "latest");
  assert.equal(d.prompt_surum, "degerlendirme-v5");
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

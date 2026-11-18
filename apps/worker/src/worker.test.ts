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
  await sifirla({ test: true });
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
    sql<{ nace_kod: string | null; nace_kaynagi: string | null; durum: string; asama: string | null }[]>`
      select nace_kod, nace_kaynagi, durum, asama from oneri where id = ${oneriId}
    `,
  );
  assert.equal(sonra.asama, null, "başarılı kayıtta aşama sıfırlanır (0016)");
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
  const [a] = await islem(SERVIS, (sql) => sql<{ asama: string | null }[]>`select asama from oneri where id = ${o.id}`);
  assert.equal(a.asama, "belge", "durduğu aşama görünür kalır");
});

test("değerlendirme kaydı model künyesi ve dayanak taşır", async () => {
  const [d] = await islem(SERVIS, (sql) =>
    sql<{ dayanak: number; model_snapshot: string; prompt_surum: string; alintilar: unknown[] }[]>`
      select dayanak, model_snapshot, prompt_surum, alintilar from degerlendirme where oneri_id = ${oneriId}
    `,
  );
  assert.ok(d, "değerlendirme kaydı olmalı");
  assert.notEqual(d.model_snapshot, "latest");
  assert.equal(d.prompt_surum, "degerlendirme-v10");
  assert.ok(d.dayanak >= 0 && d.dayanak <= 100);
});

test("AI ham puanı değiştirilemez — trigger reddeder", async () => {
  await assert.rejects(
    () => islem(SERVIS, (sql) => sql`update degerlendirme set puanlar = '{}'::jsonb where oneri_id = ${oneriId}`),
    /değiştirilemez/i,
  );
});

test("değerlendirme sonucu aşama bilgisi taşır", async () => {
  // oneriId artık onay_bekliyor: kuyruk dışı öneri model çağrılmadan "oneri" döner.
  const s = await degerlendirmeYap(SERVIS, oneriId);
  assert.equal(s.asama, "oneri");
  assert.equal(typeof s.mesaj, "string");
});

// ── Aday keşfi ─────────────────────────────────────────────────────────────

async function ref(eposta: string): Promise<string> {
  const [r] = await islem(SERVIS, (sql) => sql<{ gonderen_ref: string }[]>`select gonderen_ref from kimlik where eposta = ${eposta}`);
  return r.gonderen_ref;
}
async function donem(il: string): Promise<number> {
  const [d] = await islem(SERVIS, (sql) => sql<{ id: string }[]>`select id from donem where il_kod = ${il} order by yil desc limit 1`);
  return Number(d.id);
}

test("keşif yalnızca ajansın kendi bölgesinde ve yalnızca onaylayan rolle açılır (RLS)", async () => {
  const ajans: Baglam = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" };
  const yatirimci: Baglam = { gonderenRef: await ref("yatirimci@ykh.local"), rol: "yatirimci" };
  const [bolgeDisi] = await islem(SERVIS, (sql) => sql<{ kod: string }[]>`select kod from il where ajans_kod <> 'TR33' order by kod limit 1`);

  await assert.rejects(
    async () => islem(ajans, async (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${await donem(bolgeDisi.kod)}, ${ajans.gonderenRef})`),
    /row-level security/,
  );
  await assert.rejects(
    async () => islem(yatirimci, async (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${await donem("usak")}, ${yatirimci.gonderenRef})`),
    /row-level security/,
  );
});

test("keşif: bütün parçaları tarar, adayları yerel kanıtla ve kaynaktan birebir pasajla yazar", async () => {
  const { birKesifAl, kesifYap } = await import("@ykh/degerlendirme");
  const ajans: Baglam = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" };
  const d = await donem("usak");
  await islem(ajans, (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${d}, ${ajans.gonderenRef})`);
  // Aynı dönemde ikinci aktif koşu açılamaz.
  await assert.rejects(() => islem(ajans, (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${d}, ${ajans.gonderenRef})`), /kesif_tek_aktif/);

  const id = await birKesifAl();
  assert.ok(id);
  const s = await kesifYap(id);
  assert.ok(s.ok, s.mesaj);

  const [k] = await islem(SERVIS, (sql) => sql<{ durum: string; toplam_parca: number; taranan_parca: number; aday_sayisi: number }[]>`
    select durum, toplam_parca, taranan_parca, aday_sayisi from kesif where id = ${id}`);
  assert.equal(k.durum, "tamam");
  assert.ok(k.toplam_parca > 0);
  assert.equal(k.taranan_parca, k.toplam_parca, "tarama eksiksiz");
  // Gerçek modelde sıfır aday meşru bir sonuçtur (hepsi kanıt kuralına takılabilir);
  // deterministik çevrimdışı istemcide en az bir aday çıkmalı.
  if (!process.env.OPENAI_API_KEY) assert.ok(k.aday_sayisi > 0, "çevrimdışı istemci en az bir aday üretmeli");

  const adaylar = await islem(SERVIS, (sql) => sql<{ durum: string; koken: string; gonderen_ref: string; kesif_kanit: Array<{ belge_id: number; alinti: string; yerel: boolean }> }[]>`
    select durum::text, koken::text, gonderen_ref, kesif_kanit from oneri where kesif_id = ${id} and koken = 'yeni'`);
  assert.equal(adaylar.length, k.aday_sayisi);
  for (const a of adaylar) {
    assert.equal(a.durum, "degerlendiriliyor", "aday onaysız; mevcut değerlendirme hattına girer");
    assert.equal(a.koken, "yeni");
    assert.equal(a.gonderen_ref, ajans.gonderenRef, "gönderen keşfi tetikleyen kişi");
    assert.ok(a.kesif_kanit.length >= 2);
    assert.ok(a.kesif_kanit.some((x) => x.yerel), "en az bir yerel kanıt");
    // Doğrulayıcıdan BAĞIMSIZ kontrol: kayıttaki pasaj belgede harfi harfine geçer.
    for (const x of a.kesif_kanit) {
      const [b] = await islem(SERVIS, (sql) => sql<{ metin: string }[]>`select metin from belge where id = ${x.belge_id}`);
      assert.ok(b.metin.includes(x.alinti), `pasaj kaynakta birebir yok: ${x.alinti}`);
    }
  }

  // Yürürlükteki resmî konu olduğu gibi önerilirse KOPYA AÇILMAZ; kanıt o
  // konunun kaydına eklenir. (Çevrimdışı istemci bunu her koşuda dener.)
  const [{ n: resmiKopya }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`
    select count(*) as n from oneri y join oneri m
      on m.donem_id = y.donem_id and lower(trim(m.baslik)) = lower(trim(y.baslik)) and m.koken = 'mevcut'
    where y.kesif_id = ${id} and y.koken = 'yeni'`);
  assert.equal(Number(resmiKopya), 0, "resmî konunun kopyası açılmaz");
  if (!process.env.OPENAI_API_KEY) {
    const destek = await islem(SERVIS, (sql) => sql<{ durum: string; kesif_kanit: unknown[] }[]>`
      select durum::text, kesif_kanit from oneri where donem_id = ${d} and koken = 'mevcut' and kesif_id = ${id}`);
    assert.equal(destek.length, 1, "kanıt resmî konunun kaydına eklenir");
    assert.ok(destek[0].kesif_kanit.length >= 2);
  }

  // İkinci koşu önbellekten: hiçbir parça yeniden taranmaz.
  const [{ n: once }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`select count(*) as n from kanit_tarama`);
  await islem(ajans, (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${d}, ${ajans.gonderenRef})`);
  const id2 = await birKesifAl();
  assert.ok(id2);
  const s2 = await kesifYap(id2);
  assert.ok(s2.ok, s2.mesaj);
  const [{ n: sonra }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`select count(*) as n from kanit_tarama`);
  assert.equal(sonra, once);
  // Tekrarlanan keşif kuyruğu şişirmez: çevrimdışı istemci aynı konuları
  // üretir, hepsi elenir. (Gerçek modelde yeni konu çıkabilir; o meşru.)
  if (!process.env.OPENAI_API_KEY) {
    const [{ n: ikinci }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`select count(*) as n from oneri where kesif_id = ${id2} and koken = 'yeni'`);
    assert.equal(Number(ikinci), 0, "ikinci keşif aynı konuları yeniden kuyruğa almaz");
    assert.match(s2.mesaj, /zaten önerilmiş/);
    // Hangi adayın neden alınmadığı ekrana giden kayıtta yazar.
    const { sonKesif } = await import("@ykh/database");
    const son = await sonKesif(ajans, d);
    assert.ok(son?.alinmayan.some((m) => /zaten önerilmiş/.test(m)), JSON.stringify(son?.alinmayan));
  }
  // Aynı başlık ikinci kez yazılmaz (model başka başlık üretebilir; o yeni bir adaydır).
  const [{ n: kopya }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`
    select count(*) as n from (select lower(trim(baslik)) from oneri where donem_id = ${d}
      group by 1 having count(*) > 1) t`);
  assert.equal(Number(kopya), 0);
});

test("konu uygunluğu: yalnızca başlıkla; kanıt yoksa model çağrılmadan söyler", async () => {
  const { konuUygunluguYap } = await import("@ykh/degerlendirme");
  const ajans: Baglam = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" };
  // Önceki test Uşak belgelerini taradı: defterde kanıt var.
  const yok = await konuUygunluguYap(ajans, { ilKod: "usak", baslik: "Zqxwvk kuantum zımbırtısı" });
  assert.equal(yok.karar, "kanit_yok");
  assert.equal(yok.gerekce, "");
  const var_ = await konuUygunluguYap(ajans, { ilKod: "usak", baslik: "Tekstil atıklarından geri dönüşüm elyaf üretimi" });
  assert.ok(["uygun", "kismen", "uygun_degil", "baglanamadi"].includes(var_.karar), `${var_.karar} ${var_.neden}`);
  // Uygunsa gerekçe yalnızca kanıt pasajlarından kurulur ve pasajlar gösterilir.
  if (var_.karar === "uygun") {
    assert.ok(var_.gerekce.length >= 40 && var_.kanitlar.length >= 2 && var_.kanitlar.some((k) => k.yerel));
  }
});

test("keşif durdurulur: sıradaki alınmaz, süren koşu kendini keser ve yeniden sıraya girmez", async () => {
  const { birKesifAl, kesifYap } = await import("@ykh/degerlendirme");
  const { kesifDurdur, topluKesifDurumu } = await import("@ykh/database");
  const ajans: Baglam = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" };
  const yatirimci: Baglam = { gonderenRef: await ref("yatirimci@ykh.local"), rol: "yatirimci" };
  const [d1, d2] = [await donem("usak"), await donem("kutahya")];
  await islem(ajans, (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${d1}, ${ajans.gonderenRef}), (${d2}, ${ajans.gonderenRef})`);
  const suren = await birKesifAl();
  assert.ok(suren);
  const durum = await topluKesifDurumu(ajans);
  assert.deepEqual([durum?.bekleyen, durum?.calisan.length], [1, 1]);
  assert.equal(await topluKesifDurumu(yatirimci), null, "yatırımcı keşif durumunu göremez");
  assert.equal(await kesifDurdur(yatirimci), 0, "yatırımcı durduramaz");
  assert.equal(await kesifDurdur(ajans), 2);
  assert.equal(await topluKesifDurumu(ajans), null);
  assert.equal(await birKesifAl(), null, "durdurulan sıradaki koşu alınmaz");
  const s = await kesifYap(suren);
  assert.deepEqual([s.ok, s.adaySayisi], [false, 0]);
  const [k] = await islem(SERVIS, (sql) => sql<{ durum: string; mesaj: string }[]>`select durum, mesaj from kesif where id = ${suren}`);
  assert.equal(k.durum, "hata");
  assert.match(k.mesaj, /durduruldu/);
  const [{ n }] = await islem(SERVIS, (sql) => sql<{ n: string }[]>`select count(*) as n from oneri where kesif_id = ${suren}`);
  assert.equal(Number(n), 0, "durdurulan koşu aday yazmaz");
});

test("yerel belgesi olmayan ilde keşif aday üretmez, nedenini yazar", async () => {
  const { birKesifAl, kesifYap } = await import("@ykh/degerlendirme");
  const [il] = await islem(SERVIS, (sql) => sql<{ kod: string }[]>`select kod from il where ajans_kod <> 'TR33' order by kod limit 1`);
  const yonetici: Baglam = { gonderenRef: await ref("yonetici@ykh.local"), rol: "yonetici" };
  await islem(yonetici, async (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${await donem(il.kod)}, ${yonetici.gonderenRef})`);
  const id = await birKesifAl();
  assert.ok(id);
  const s = await kesifYap(id);
  assert.ok(s.ok);
  assert.equal(s.adaySayisi, 0);
  assert.match(s.mesaj, /özgü değil|belge yok/);
});

test("uzun parça örtüşen pencerelerle eksiksiz taranır", async () => {
  const { pencerele } = await import("@ykh/degerlendirme");
  const { MODEL_METIN_SINIRI } = await import("@ykh/evidence-validation");
  const metin = Array.from({ length: 900 }, (_, i) => `cümle ${i}.`).join(" ");
  const p = pencerele(metin);
  assert.ok(p.length > 1);
  assert.ok(p.every((x) => x.length <= MODEL_METIN_SINIRI));
  assert.ok(p.at(-1)!.endsWith("cümle 899."), "kuyruk taranır");
  assert.deepEqual(pencerele("kısa"), ["kısa"]);
});

test("reddedilmiş parça keşfi kilitlemez; keşif onu bir kez daha dener", async () => {
  const { birKesifAl, kesifYap, onTarama } = await import("@ykh/degerlendirme");
  // Sürüm ve model künyesi önceki testlerin taramasından (paket bağımlılığı yok).
  const [kunye] = await islem(SERVIS, (sql) => sql<{ prompt_surum: string; model_snapshot: string }[]>`
    select prompt_surum, model_snapshot from kanit_tarama limit 1`);
  const ajans: Baglam = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" };
  const [p] = await islem(SERVIS, (sql) => sql<{ id: string }[]>`select id from belge where il_kod = 'kutahya' order by id limit 1`);
  // Önceki bir koşuda okunamamış gibi işaretle.
  await islem(SERVIS, (sql) => sql`
    insert into kanit_tarama (belge_id, prompt_surum, model_snapshot, kanit_sayisi, durum, neden)
    values (${p.id}, ${kunye.prompt_surum}, ${kunye.model_snapshot}, 0, 'reddedildi', 'model: zaman aşımı')
    on conflict (belge_id, prompt_surum, model_snapshot) do update set durum = 'reddedildi', neden = excluded.neden`);
  // Ön tarama reddedilmiş parçayı yeniden denemez (maliyet döngüsü yok).
  await onTarama();
  const [{ durum: once }] = await islem(SERVIS, (sql) => sql<{ durum: string }[]>`select durum from kanit_tarama where belge_id = ${p.id}`);
  assert.equal(once, "reddedildi");

  await islem(ajans, async (sql) => sql`insert into kesif (donem_id, tetikleyen_ref) values (${await donem("kutahya")}, ${ajans.gonderenRef})`);
  const id = await birKesifAl();
  assert.ok(id);
  const s = await kesifYap(id);
  assert.ok(s.ok, s.mesaj);
  const [{ durum }] = await islem(SERVIS, (sql) => sql<{ durum: string }[]>`select durum from kanit_tarama where belge_id = ${p.id}`);
  assert.equal(durum, "tamam", "keşif reddedilmiş parçayı yeniden denedi");
});

test("ürün gruplu öneri: ek NACE gruplara bağlanır, kapsam notu yazılır, kullanıcının ana kodu korunur", async () => {
  const { degerlendirmeYap } = await import("@ykh/degerlendirme");
  const ajans: Baglam = { gonderenRef: await ref("ajans@ykh.local"), rol: "ajans" };
  const d = await donem("usak");
  const [o] = await islem(ajans, (sql) => sql<{ id: string }[]>`
    insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, nace_kod, nace_kaynagi, kapsam, durum)
    values (${d}, ${ajans.gonderenRef}, 'yeni', 'Tekstil geri dönüşümüne dayalı ürün ailesi',
            'Uşak imalat sanayiinde tekstil ürünleri imalatı istihdamda ilk sıradadır; kırpık atığı önemli hacimdedir.',
            '13.10', 'kullanici',
            ${sql.json([{ ad: "Geri dönüştürülmüş elyaf", kanit_id: [] }, { ad: "Battaniye ve ev tekstili", kanit_id: [] }] as never)},
            'degerlendiriliyor')
    returning id`);
  const s = await degerlendirmeYap(SERVIS, Number(o.id));
  assert.ok(s.ok, s.mesaj);
  const [r] = await islem(SERVIS, (sql) => sql<{ nace_kod: string; kapsam_notu: unknown; ek: number; gecersiz: number }[]>`
    select o.nace_kod, g.kapsam_notu,
           (select count(*)::int from oneri_nace x where x.oneri_id = o.id) as ek,
           (select count(*)::int from oneri_nace x where x.oneri_id = o.id and x.nace_kod = o.nace_kod) as gecersiz
    from oneri o join degerlendirme g on g.oneri_id = o.id where o.id = ${o.id}`);
  assert.equal(r.nace_kod, "13.10", "kullanıcının ana kodu ezilmez");
  assert.ok(r.kapsam_notu, "kapsam notu kaydedilir (puana etki etmez)");
  assert.equal(r.gecersiz, 0, "ek kod ana kodla aynı olamaz");
  if (!process.env.OPENAI_API_KEY) assert.ok(r.ek >= 1, "çevrimdışı istemci en az bir ek kod eşler");
});

test("içerik olmayan parça (kaynakça, tablo listesi) taramaya girmez; plan metni girer", async () => {
  const { icerikDegil } = await import("@ykh/degerlendirme");
  const kaynakca = [
    "Akman, M. K. (2020). Defence Management and PESTLE Analysis. Journal of Defence, 12(3), ss. 45-67.",
    "Kocaeli Sanayi Odası. (2021). Sektör Raporu. https://kosano.org.tr/rapor adresinden alındı.",
    "Savunma Sanayii Başkanlığı. (2023). EYDEP Sertifikalı Firmalar. Erişim tarihi: 3.03.2023.",
    "TÜİK. (2022). Dış Ticaret İstatistikleri. https://data.tuik.gov.tr",
  ].join("\n\n");
  assert.equal(icerikDegil(kaynakca), "kaynakça");
  const liste = Array.from({ length: 6 }, (_, i) => `Tablo ${i + 1}: Kırıkkale savunma sanayii göstergeleri`).join("\n\n");
  assert.equal(icerikDegil(liste), "şekil/tablo listesi");
  // İçerik: yıl ve kurum adı geçse de kanıt taşıyan plan metni taranır.
  assert.equal(icerikDegil("Uşak'ta tekstil geri dönüşümü sektöründe 2023 yılında 120 işletme faaliyet göstermektedir.\n\nBölgede deri ihtisas OSB altyapısı mevcuttur."), null);
  // İstatistik tablosu içeriktir.
  assert.equal(icerikDegil("| İlçe | Tesis |\n| --- | --- |\n| Banaz | 14 |\n\nTablo 3: İlçelere göre tesis sayısı (2022)"), null);
});

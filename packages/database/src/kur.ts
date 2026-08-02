import { sahip } from "./baglanti.ts";
import { yukari } from "./migrate.ts";
import { ajanslariYukle, naceYukle, ULUSAL_SURUM } from "./seed.ts";
import { konulariYukle, RESMI_LISTELER } from "./konu-yukle.ts";
import { belgeYukle, RESMI_BELGELER } from "./belge-yukle.ts";
import { parolaOzetle } from "./parola.ts";
import { TR33_2027_V1 } from "@ykh/scoring";

/**
 * ÜRETİM KURULUMU — `seed()` değildir ve onu çağırmaz.
 *
 * `seed()` üretimde ÇALIŞTIRILAMAZ: ilk işi `truncate … cascade`. Bu dosya
 * onun yerine geçiyor ve iki şeyi ayırıyor:
 *
 *   GERÇEK VERİ  → yüklenir  (NACE, 26 ajans, 81 il, resmî tebliğ listeleri,
 *                             üst ölçekli belgeler, ağırlık setleri, dönemler,
 *                             resmî listeden türeyen `mevcut` adaylar)
 *   DEMO VERİ    → yüklenmez (demo hesaplar, varsayımsal öneriler,
 *                             `seed-demo` künyeli sahte değerlendirmeler)
 *
 * TEKRAR ÇALIŞTIRILABİLİR. Her adım ya `on conflict do nothing` ya da kendi
 * anahtarını silip yeniden yazıyor. Her dağıtımda çalışması güvenlidir ve
 * migration'lar gibi otomatik koşturulmak üzere tasarlandı.
 *
 * Tek istisna belge yükleme: `belge` satırları ada göre silinip yeniden
 * yazılıyor, yani `belge.id` değişiyor. Kayıtlı değerlendirmelerin alıntı
 * atıfları `belge_id` taşıdığı için eski kayıtların çıpası kayabilir —
 * doğrulanmış ALINTI METNİ durur, adres eskir. Bu yüzden belgeler yalnızca
 * `YKH_KUR_BELGELER=evet` ile yükleniyor; ilk kurulumda açıp sonra kapatın.
 */

/** Üretimde zorunlu ortam değişkenleri — eksikse kurulum HİÇ başlamaz. */
function gerekli(ad: string): string {
  const d = process.env[ad]?.trim();
  if (!d) throw new Error(`${ad} tanımlı değil. Üretim kurulumu eksik yapılandırmayla başlatılmaz.`);
  return d;
}

export async function kur(): Promise<string> {
  const sql = sahip();
  const rapor: string[] = [];

  // ── 0 · şema ────────────────────────────────────────────────────────────
  const yeni = await yukari();
  rapor.push(yeni.length ? `${yeni.length} migration` : "şema güncel");

  // ── 1 · uygulama rolünün parolası ───────────────────────────────────────
  //
  // `0002_rls.sql` rolü SABİT bir parolayla açıyor ve o parola herkese açık
  // depoda yazılı. Migration idempotent olduğu için parolayı bir daha
  // değiştirmiyor; değiştirmek bu adımın işi. Atlanırsa üretim, kaynağı
  // yayımlanmış bir parolayla çalışır.
  const appParola = gerekli("YKH_APP_PAROLA");
  if (appParola === "ykh_app_parola") {
    throw new Error("YKH_APP_PAROLA varsayılan değerde. Üretimde depoda yazılı parola kullanılamaz.");
  }
  // Parola bir SQL literali olmak zorunda: ALTER ROLE parametre kabul etmiyor.
  // Tek tırnak ikileniyor; parola ortam değişkeninden geliyor ve kullanıcı
  // girdisi değil, ama kaçış yine de yapılıyor.
  await sql.unsafe(`alter role ykh_app with password '${appParola.replace(/'/g, "''")}'`);
  rapor.push("ykh_app parolası ayarlandı");

  // ── 2 · referans veri ───────────────────────────────────────────────────
  const nace = await naceYukle();
  const ajans = await ajanslariYukle();
  rapor.push(`${nace} NACE kodu`, `${ajans} ajans`);

  // İlçe verisi yalnızca elimizde GERÇEK liste olan dört pilot il için var.
  // Kalan 77 il için uydurulmaz; öneri formu o illerde ilçeyi hiç sormaz.
  for (const [il, ilceler] of [
    ["usak", ["Merkez", "Banaz", "Eşme", "Karahallı", "Sivaslı", "Ulubey"]],
    ["kutahya", ["Merkez", "Tavşanlı", "Simav", "Gediz", "Emet"]],
    ["manisa", ["Şehzadeler", "Yunusemre", "Akhisar", "Turgutlu", "Salihli"]],
    ["afyonkarahisar", ["Merkez", "Sandıklı", "Dinar", "Bolvadin", "Emirdağ"]],
  ] as const) {
    for (const ad of ilceler) {
      await sql`insert into ilce (il_kod, ad) values (${il}, ${ad}) on conflict (il_kod, ad) do nothing`;
    }
  }

  // Resmî tebliğ listeleri — fail-closed: 81 il × tam 4 konu şartı sağlanmazsa
  // dosya hiç yüklenmez ve hangi ilin eksik olduğu yazılır.
  let konu = 0;
  const yillar: number[] = [];
  for (const l of RESMI_LISTELER) {
    const r = await konulariYukle(l.dosya, l.kaynak);
    konu += r.konu;
    yillar.push(r.yil);
  }
  rapor.push(`${konu} resmî yatırım konusu`);

  // ── 3 · ağırlık setleri ve dönemler ─────────────────────────────────────
  const set = TR33_2027_V1;
  for (const s of [
    { surum: set.surum, ajans: set.ajans },
    { surum: ULUSAL_SURUM, ajans: null },
  ]) {
    await sql`
      insert into agirlik_seti (surum, ajans_kod, donem_yil, agirliklar, devamlilik_payi,
                                dayanak_esigi, devir_siniri, slot_sayisi)
      values (${s.surum}, ${s.ajans}, ${set.donem}, ${sql.json(set.agirliklar as never)},
              ${set.devamlilikPayi}, ${set.dayanakEsigi}, ${set.devirSiniri}, ${set.slotSayisi})
      on conflict (surum) do nothing
    `;
  }

  // Dönem 81 ilin tamamında açılır (program yıllık ve ulusal); kalibrasyonu
  // olmayan il ulusal varsayılanı kullanır ve ekran bunu yazar.
  const pilot = new Set(["usak", "kutahya", "manisa", "afyonkarahisar"]);
  const iller = await sql<{ kod: string }[]>`select kod from il order by kod`;
  for (const { kod } of iller) {
    await sql`
      insert into donem (il_kod, yil, agirlik_seti_surum)
      values (${kod}, ${set.donem}, ${pilot.has(kod) ? set.surum : ULUSAL_SURUM})
      on conflict (il_kod, yil) do nothing
    `;
  }
  rapor.push(`${iller.length} ilde ${set.donem} dönemi`);

  // ── 4 · ilk yönetici hesabı ─────────────────────────────────────────────
  //
  // `hesap_ac()` yalnızca `yatirimci` açabiliyor — bilerek. İlk yöneticiyi
  // sahip bağlantısı yazar; sonraki roller bu hesaptan yönetilir.
  const eposta = gerekli("YKH_YONETICI_EPOSTA").toLowerCase();
  const [varOlan] = await sql<{ ref: string }[]>`
    select gonderen_ref as ref from kimlik where eposta = ${eposta}
  `;
  let yoneticiRef = varOlan?.ref;
  if (!yoneticiRef) {
    const parola = gerekli("YKH_YONETICI_PAROLA");
    if (parola.length < 12) throw new Error("YKH_YONETICI_PAROLA en az 12 karakter olmalı.");
    const [g] = await sql<{ ref: string }[]>`
      insert into gonderen (rol) values ('yonetici'::rol) returning ref
    `;
    await sql`
      insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash)
      values (${g.ref}, ${eposta}, ${process.env.YKH_YONETICI_AD ?? "Yönetici"}, ${await parolaOzetle(parola)})
    `;
    yoneticiRef = g.ref;
    rapor.push("yönetici hesabı açıldı");
  } else {
    rapor.push("yönetici hesabı zaten var");
  }

  // ── 5 · resmî listeden türeyen mevcut adaylar ───────────────────────────
  //
  // Karar modelinin `koken='mevcut'` adayları bunlar. Uydurma değerlendirme
  // YAZILMAZ: platform onları henüz puanlamadı, dayanakları 0 ve sıralamada
  // "dayanaksız" görünüyorlar — ürünün kendi kuralının gösterimi.
  // Yürürlükteki liste EN GÜNCEL yıldır; yıl dosyanın içinden geliyor.
  const yil = Math.max(...yillar);
  const { count: mevcut } = await sql`
    insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, durum, onaylayan_ref, onay_zamani)
    select d.id, ${yoneticiRef}, 'mevcut'::koken, y.baslik, y.gerekce, 'listede', ${yoneticiRef}, now()
    from yatirim_konusu y
    join donem d on d.il_kod = y.il_kod
    where y.yil = ${yil}
      and not exists (
        select 1 from oneri o
        where o.donem_id = d.id and o.koken = 'mevcut' and o.baslik = y.baslik
      )
  `;
  rapor.push(`${mevcut} mevcut aday`);

  // ── 6 · üst ölçekli belgeler (isteğe bağlı) ─────────────────────────────
  if (process.env.YKH_KUR_BELGELER === "evet") {
    let parca = 0;
    for (const b of RESMI_BELGELER) parca += (await belgeYukle(b)).parca;
    rapor.push(`${parca} belge parçası`);
  } else {
    const [b] = await sql<{ n: string }[]>`select count(*) as n from belge`;
    rapor.push(`belge yüklenmedi (mevcut ${b.n} parça) — YKH_KUR_BELGELER=evet ile yükleyin`);
  }

  return rapor.join(" · ");
}

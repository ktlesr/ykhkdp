import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { KRITERLER, TR33_2027_V1, type Kriter } from "@ykh/scoring";
import { sahip } from "./baglanti.ts";
import { konulariYukle, RESMI_LISTELER } from "./konu-yukle.ts";
import { parolaOzetle } from "./parola.ts";

/** Demo verisi. Sahip bağlantısıyla çalışır (RLS baypas) — seed yönetim işidir. */

export const DEMO_PAROLA = "ykh-demo-2027";

/** Sıralamaya `mevcut` aday olarak giren resmî liste yılı. */
export const RESMI_YIL = 2026;

/**
 * Demo hesapları — tek kaynak. Giriş ekranı bu listeyi gösterir, seed bunu
 * yazar. Rol adı değişirse iki yer birden değişir, ayrışamazlar.
 */
export const DEMO_HESAPLAR = [
  { eposta: "yatirimci@ykh.local", ad: "A. Kaya", rol: "yatirimci", etiket: "yatırımcı — öneri verir" },
  { eposta: "ajans@ykh.local", ad: "S. Aydın", rol: "ajans", etiket: "ajans — onaylar, belge yükler" },
  { eposta: "yonetici@ykh.local", ad: "T. Arslan", rol: "yonetici", etiket: "yönetici — hepsi + kişisel veri" },
] as const;

const VERI = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

/**
 * Varsayımsal yatırımcı önerisi.
 *
 * `koken: 'mevcut'` konular ARTIK BURADA DEĞİL: onlar resmî tebliğ listesinden
 * (`yatirim_konusu`) türetiliyor. Burada kalanlar demo amaçlı yatırımcı
 * gönderimleridir; varsayımsal bir öneriye demo puan vermek kendi içinde
 * tutarlıdır, resmî bir konuya uydurma puan vermek değildi.
 */
type Tohum = {
  id: string;
  baslik: string;
  hedefPuan: number;
  dayanak: number;
  nace: string;
  gerekce: string;
};

const USAK: Tohum[] = [
  { id: "geri-donusum-elyaf", baslik: "Tekstil kırpıklarından geri dönüştürülmüş elyaf", hedefPuan: 74, dayanak: 77, nace: "13.10", gerekce: "Kırpık arzı il içinde toplanıyor ve bugün ağırlıklı olarak il dışına ham satılıyor." },
  { id: "tarimsal-kurutma", baslik: "Tarımsal kurutma ve soğuk zincir tesisi", hedefPuan: 69, dayanak: 41, nace: "10.39", gerekce: "İlçelerde yaş ürün kaybı yüksek; soğuk zincir yatırımı kaybı azaltır." },
  { id: "jeotermal-sera", baslik: "Jeotermal destekli sera ve ısı geri kazanımı", hedefPuan: 58, dayanak: 63, nace: "01.13", gerekce: "Jeotermal saha sıcaklığı sera ısıtması için yeterli; kaynak ilde." },
  { id: "batarya-kalip", baslik: "Batarya kasası için hassas kalıp ve metal şekillendirme", hedefPuan: 57, dayanak: 29, nace: "28.41", gerekce: "Kalıp imalatında hassas işleme kapasitesi var." },
];

const KUTAHYA: Tohum[] = [
  { id: "kut-manyezit", baslik: "Manyezit bazlı refrakter üretimi", hedefPuan: 64, dayanak: 61, nace: "23.20", gerekce: "Manyezit rezervi ilde; refrakter talebi çelik sektörüyle artıyor." },
  { id: "kut-termal", baslik: "Termal turizm destekli sağlık hizmetleri", hedefPuan: 60, dayanak: 57, nace: "86.10", gerekce: "Termal kaynak kapasitesi ve yatak arzı uyumlu." },
  { id: "kut-gida", baslik: "Kuru gıda paketleme ve lojistik", hedefPuan: 55, dayanak: 33, nace: "10.85", gerekce: "Lojistik koridoruna yakınlık avantaj sağlıyor." },
];

/** Ağırlıklı toplamı tam olarak `hedef` olan çeşitli kriter puanları üretir. */
const SAPMA = [8, -6, 4, -3, 5, -7, 2, -3];

export function kriterPuanlariUret(hedef: number, agirliklar: Record<Kriter, number>, kaydir = 0) {
  const sapmalar = KRITERLER.map((_, i) => SAPMA[(i + kaydir) % SAPMA.length]);
  const agirlikliSapma = KRITERLER.reduce((t, k, i) => t + agirliklar[k] * sapmalar[i], 0);
  const out = {} as Record<Kriter, number>;
  KRITERLER.forEach((k, i) => {
    out[k] = Math.round(Math.max(0, Math.min(100, hedef + sapmalar[i] - agirlikliSapma)));
  });
  return out;
}

type AjansKaydi = { kod: string; ad: string; kisaAd: string; iller: Array<{ kod: string; ad: string }> };

/**
 * 26 kalkınma ajansı ve 81 il — `data/ajans.json`.
 *
 * `ajans.kod` NUTS-2 bölge kodudur (ağırlık seti sürümü buna bağlı), `kisa_ad`
 * günlük kısaltma (ZAFER, AHİKA). `il.kod` ASCII katlanmış slug.
 */
export async function ajanslariYukle(): Promise<number> {
  const sql = sahip();
  const kayitlar = JSON.parse(await readFile(join(VERI, "ajans.json"), "utf8")) as AjansKaydi[];

  await sql`
    insert into ajans ${sql(
      kayitlar.map((a) => ({ kod: a.kod, ad: a.ad, kisa_ad: a.kisaAd })),
      "kod",
      "ad",
      "kisa_ad",
    )}
    on conflict (kod) do nothing
  `;
  const iller = kayitlar.flatMap((a) => a.iller.map((i) => ({ kod: i.kod, ad: i.ad, ajans_kod: a.kod })));
  await sql`insert into il ${sql(iller, "kod", "ad", "ajans_kod")} on conflict (kod) do nothing`;
  return kayitlar.length;
}

export async function naceYukle(): Promise<number> {
  const sql = sahip();
  const kayitlar = JSON.parse(await readFile(join(VERI, "nace.json"), "utf8")) as Array<{
    kod: string;
    tanim: string;
    duzey: string;
  }>;

  // Düzey sırasıyla ekle ki ust_kod referansı hep var olsun.
  const sira = ["kisim", "bolum", "grup", "sinif", "faaliyet"];
  for (const d of sira) {
    const grup = kayitlar.filter((k) => k.duzey === d);
    for (let i = 0; i < grup.length; i += 500) {
      const dilim = grup.slice(i, i + 500);
      await sql`
        insert into nace ${sql(
          dilim.map((k) => ({ kod: k.kod, tanim: k.tanim, duzey: k.duzey })),
          "kod",
          "tanim",
          "duzey",
        )}
        on conflict (kod) do nothing
      `;
    }
  }
  // Üst kodları tek sorguda bağla; olmayan üstü null bırak.
  await sql`
    update nace n set ust_kod = u.kod
    from nace u
    where u.kod = nace_ust_kod(n.kod) and n.ust_kod is null
  `;
  return kayitlar.length;
}

export async function seed(): Promise<{ ozet: string }> {
  const sql = sahip();

  /**
   * CASCADE tuzağı: `gonderen`'e yabancı anahtarla bağlı HER tablo da boşalır.
   * `ayar.guncelleyen_ref` bu yüzden `ayar`ı da siliyordu ve migration'ın
   * yazdığı varsayılan palet kayboluyordu. Yeni bir tablo `gonderen`e
   * bağlanırsa aynı şey olur.
   */
  await sql`
    truncate denetim, degerlendirme, oneri, belge, donem, agirlik_seti,
             ilce, il, ajans, nace, oturum, kimlik, gonderen restart identity cascade
  `;
  await sql`insert into ayar (anahtar, deger) values ('palet', 'temel')
            on conflict (anahtar) do nothing`;

  const naceSayisi = await naceYukle();

  // ── kullanıcılar ────────────────────────────────────────────────────────
  const ozet = await parolaOzetle(DEMO_PAROLA);
  const ref: Record<string, string> = {};
  for (const k of DEMO_HESAPLAR) {
    const [g] = await sql<{ ref: string }[]>`insert into gonderen (rol) values (${k.rol}::rol) returning ref`;
    ref[k.eposta] = g.ref;
    await sql`insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash)
              values (${g.ref}, ${k.eposta}, ${k.ad}, ${ozet})`;
  }

  // ── coğrafya ────────────────────────────────────────────────────────────
  //
  // 26 kalkınma ajansı ve 81 il `data/ajans.json` dosyasından yüklenir; resmî
  // veri kodda sabitlenmez (bkz. brief §7). Dönem ve ağırlık seti YÜKLENMEZ:
  // ikisi de ajans politika kararıdır, 25 ajans için uydurulamaz. Pilot TR33
  // dışındaki iller veritabanında var ama açık dönemi yok — sihirbaz bunu
  // "açık dönem yok" olarak gösterir, gizlemez.
  const ajansSayisi = await ajanslariYukle();

  // Resmî Yerel Yatırım Konuları Listesi (tebliğ). `mevcut` adaylar buradan
  // türetilir; seed hiçbir resmî konu uydurmaz.
  for (const l of RESMI_LISTELER) await konulariYukle(l.dosya, l.kaynak);

  // İlçeler yalnızca elimizde gerçek liste olan dört pilot il için. Kalan 77 il
  // için ilçe verisi YOK ve uydurulmaz; öneri formu ilçeyi o illerde sormaz.
  for (const [il, ilceler] of [
    ["usak", ["Merkez", "Banaz", "Eşme", "Karahallı", "Sivaslı", "Ulubey"]],
    ["kutahya", ["Merkez", "Tavşanlı", "Simav", "Gediz", "Emet"]],
    ["manisa", ["Şehzadeler", "Yunusemre", "Akhisar", "Turgutlu", "Salihli"]],
    ["afyonkarahisar", ["Merkez", "Sandıklı", "Dinar", "Bolvadin", "Emirdağ"]],
  ] as const) {
    for (const ad of ilceler) await sql`insert into ilce (il_kod, ad) values (${il}, ${ad})`;
  }

  // ── ağırlık seti ve dönemler ────────────────────────────────────────────
  const set = TR33_2027_V1;
  await sql`
    insert into agirlik_seti (surum, ajans_kod, donem_yil, agirliklar, devamlilik_payi, dayanak_esigi, devir_siniri, slot_sayisi)
    values (${set.surum}, ${set.ajans}, ${set.donem}, ${sql.json(set.agirliklar as never)},
            ${set.devamlilikPayi}, ${set.dayanakEsigi}, ${set.devirSiniri}, ${set.slotSayisi})
  `;
  const donemler: Record<string, number> = {};
  for (const il of ["usak", "kutahya", "manisa", "afyonkarahisar"]) {
    const [d] = await sql<{ id: number }[]>`
      insert into donem (il_kod, yil, agirlik_seti_surum) values (${il}, '2027', ${set.surum}) returning id
    `;
    donemler[il] = d.id;
  }

  // ── üst ölçekli belgeler ────────────────────────────────────────────────
  //
  // ponytail: demo için kısa özet metinler; testler ve dev bunlarla 2 MB gerçek
  // belge olmadan çalışır. Gerçek belge yüklendiğinde bunlar YERİNE geçer —
  // `belgeYukle` aynı `ad`'a sahip satırları siliyor, bu yüzden isimler
  // `RESMI_BELGELER` içindeki adlarla BİREBİR aynı olmalı. Aksi hâlde /belgeler
  // ekranında hem 252 parçalı gerçek plan hem 1 parçalı özeti görünür.
  const belgeler = [
    { ad: "TR33 Bölge Planı 2024-2028", tur: "bolge_plani", yil: "2024", ajans: "TR33", il: null,
      metin: "TR33 Bölgesi'nde tekstil ve hazır giyim, deri, seramik ve gıda işleme öncelikli imalat sektörleridir. Bölgede tekstil geri dönüşümü ve teknik tekstil, katma değeri yükseltecek dönüşüm alanları olarak tanımlanmıştır. Jeotermal kaynakların seracılıkta kullanımı bölgesel öncelikler arasındadır. Uşak'ta deri ve tekstil ihtisas organize sanayi bölgeleri altyapısı mevcuttur. Kütahya'da seramik ve bor türevleri, madencilik temelli ihtisaslaşma alanlarıdır. Tarımsal ürünlerde soğuk zincir ve kurutma altyapısı eksikliği bölgesel bir darboğazdır." },
    { ad: "On İkinci Kalkınma Planı 2024-2028", tur: "kalkinma_plani", yil: "2024", ajans: null, il: null,
      metin: "Yeşil ve dijital dönüşüm, döngüsel ekonomi ve kaynak verimliliği temel eksenlerdir. Tekstil, hazır giyim ve deri sektörlerinde geri dönüşüm oranlarının artırılması ve ikincil hammadde kullanımının yaygınlaştırılması hedeflenmiştir. Yenilenebilir enerji kaynaklarının sanayide ısı amaçlı kullanımı desteklenecektir. Tarımsal ürünlerde hasat sonrası kayıpların azaltılması, soğuk zincir ve depolama kapasitesinin artırılması öngörülmüştür. Kritik hammaddelerde ve ileri malzemelerde yurt içi üretim kapasitesi güçlendirilecektir." },
    { ad: "Orta Vadeli Program 2026-2028", tur: "ovp", yil: "2026", ajans: null, il: null,
      metin: "İhracatta katma değeri yüksek ürün gruplarına geçiş önceliklidir. Enerji verimliliği yatırımları ve atık ısı geri kazanımı teşvik edilecektir. İthalata bağımlılığı yüksek ara mallarda yurt içi üretim özendirilecektir. Bölgesel gelişme farklarının azaltılması için yatırım teşvik sisteminde iller arası farklılaştırma sürdürülecektir." },
    { ad: "Uşak İl Sanayi Durum Raporu 2026", tur: "il_raporu", yil: "2026", ajans: "TR33", il: "usak",
      metin: "Uşak imalat sanayiinde tekstil ürünleri imalatı istihdamda ilk sıradadır. İlde battaniye ve ev tekstili üretimi yoğunlaşmıştır; konfeksiyon atölyelerinden çıkan kırpık atığı önemli hacimdedir ve büyük bölümü il dışına ham olarak satılmaktadır. Deri ihtisas organize sanayi bölgesinde arıtma kapasitesi ilave yatırıma açıktır. Seramik hammaddesi rezervleri il sınırları içindedir. İlçelerde meyve ve sebze üretiminde hasat sonrası kayıp yüksektir; soğuk hava deposu kapasitesi yetersizdir." },
    { ad: "Kütahya İl Sanayi Durum Raporu 2026", tur: "il_raporu", yil: "2026", ajans: "TR33", il: "kutahya",
      metin: "Kütahya'da seramik sağlık gereçleri ve karo üretimi ilin sanayi kimliğini belirlemektedir. Kaolen ve feldspat rezervleri il içindedir. Bor işleme tesisine yakınlık bor türevleri ve ileri malzeme üretimi için girdi avantajı sağlar. Manyezit rezervleri refrakter üretimini destekler. Termal kaynak kapasitesi sağlık turizmi için elverişlidir." },
  ] as const;

  for (const b of belgeler) {
    await sql`
      insert into belge (ad, tur, yil, ajans_kod, il_kod, metin, yukleyen_ref)
      values (${b.ad}, ${b.tur}::belge_turu, ${b.yil}, ${b.ajans}, ${b.il}, ${b.metin}, ${ref["ajans@ykh.local"]})
    `;
  }

  // ── mevcut konular · RESMÎ TEBLİĞ LİSTESİNDEN ───────────────────────────
  //
  // Bu ilin o dönemki dört yatırım konusu uydurulmaz: `yatirim_konusu`
  // tablosundan, gerçek başlık ve gerçek gerekçesiyle türetilir.
  //
  // DEĞERLENDİRME YAZILMAZ. Platform onları henüz puanlamadı; dayanakları 0
  // ve sıralamada "dayanaksız" görünüyorlar. Bu doğru davranış ve ürünün
  // kendi kuralının gösterimi: mevcut konu da belgeye bağlanmak zorunda.
  async function mevcutKonulariKur(ilKod: string, yil: number) {
    const konular = await sql<{ sira: number; baslik: string; gerekce: string; kaynak: string }[]>`
      select sira, baslik, gerekce, kaynak from yatirim_konusu
      where il_kod = ${ilKod} and yil = ${yil} order by sira
    `;
    for (const k of konular) {
      const [o] = await sql<{ id: number }[]>`
        insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce,
                           durum, onaylayan_ref, onay_zamani)
        values (${donemler[ilKod]}, ${ref["ajans@ykh.local"]}, 'mevcut'::koken,
                ${k.baslik}, ${k.gerekce}, 'listede', ${ref["ajans@ykh.local"]}, now())
        returning id
      `;
      // Türetmenin kaynağı denetime yazılır: "bu satır nereden geldi" kaybolmaz.
      await sql`
        insert into denetim (aktor_ref, aktor_rol, eylem, nesne_tip, nesne_id, detay)
        values (${ref["ajans@ykh.local"]}, 'ajans'::rol, 'resmi_konu_alindi', 'oneri', ${String(o.id)},
                ${sql.json({ kaynak: k.kaynak, yil, sira: k.sira } as never)})
      `;
    }
    return konular.length;
  }

  // ── varsayımsal yatırımcı önerileri + demo puanlar ──────────────────────
  //
  // Bunlar gerçek gönderim değil, demo. Model künyesi `seed-demo` yazar:
  // /oneri/[id] ekranında künye satırı bunu açıkça gösterir, hiç kimse bir
  // modelin ürettiğini sanmaz.
  async function onerileriKur(ilKod: string, tohumlar: Tohum[]) {
    for (const [sira, t] of tohumlar.entries()) {
      const [o] = await sql<{ id: number }[]>`
        insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, ilce, nace_kod, nace_kaynagi,
                           durum, onaylayan_ref, onay_zamani)
        values (${donemler[ilKod]}, ${ref["yatirimci@ykh.local"]}, 'yeni'::koken,
                ${t.baslik}, ${t.gerekce}, 'Merkez', ${t.nace}, 'kullanici'::nace_kaynagi,
                'listede', ${ref["ajans@ykh.local"]}, now())
        returning id
      `;
      await sql`
        insert into degerlendirme (oneri_id, puanlar, dayanak, gerekce, alintilar, model_snapshot, prompt_surum)
        values (${o.id}, ${sql.json(kriterPuanlariUret(t.hedefPuan, set.agirliklar, sira) as never)},
                ${t.dayanak},
                ${`${t.gerekce} Üst ölçekli belgelerde bu yönde öncelik tanımlanmıştır.`},
                ${sql.json([{ belge_ad: "TR33 Bölge Planı 2024-2028", alinti: "öncelikli imalat sektörleridir" }] as never)},
                'seed-demo', 'seed-demo')
      `;
    }
  }

  for (const il of ["usak", "kutahya", "manisa", "afyonkarahisar"]) {
    await mevcutKonulariKur(il, RESMI_YIL);
  }
  await onerileriKur("usak", USAK);
  await onerileriKur("kutahya", KUTAHYA);

  // Onay bekleyen taze öneri — /onay kuyruğu boş kalmasın.
  const [bekleyen] = await sql<{ id: number }[]>`
    insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, ilce, nace_kod, nace_kaynagi, durum)
    values (${donemler["usak"]}, ${ref["yatirimci@ykh.local"]}, 'yeni',
            'Atık ısıdan elektrik üretimi (ORC çevrimi)',
            'Seramik ve tekstil tesislerindeki yüksek sıcaklık baca gazı il merkezindeki OSB''de yoğunlaşıyor; atık ısı kaynağı yerinde.',
            'Merkez', '35.12', 'ai', 'onay_bekliyor')
    returning id
  `;
  await sql`
    insert into degerlendirme (oneri_id, puanlar, dayanak, gerekce, alintilar, model_snapshot, prompt_surum)
    values (${bekleyen.id}, ${sql.json(kriterPuanlariUret(64, set.agirliklar, 3) as never)}, 58,
            'Enerji verimliliği ve atık ısı geri kazanımı OVP''de teşvik edilen alanlar arasında; ilde yüksek sıcaklık atık ısı kaynağı mevcut.',
            ${sql.json([
              { belge_ad: "Orta Vadeli Program 2026-2028", alinti: "atık ısı geri kazanımı teşvik edilecektir" },
              { belge_ad: "Uşak İl Sanayi Durum Raporu 2026", alinti: "seramik hammaddesi rezervleri il sınırları içindedir" },
            ] as never)},
            'seed-demo', 'seed-demo')
  `;

  // Değerlendirilmeyi bekleyen öneri — worker kuyruğu göstermek için
  await sql`
    insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, ilce, durum)
    values (${donemler["usak"]}, ${ref["yatirimci@ykh.local"]}, 'yeni',
            'İkincil hammaddeden teknik iplik üretimi',
            'Geri dönüştürülmüş elyaf arzı il içinde oluşuyor; iplik aşaması ilde yok, ürün il dışına gidiyor.',
            'Banaz', 'degerlendiriliyor')
  `;

  /**
   * Yakın kopya — /onay ekranındaki benzerlik işaretini gösterir.
   *
   * Uşak'ta "Tekstil kırpıklarından geri dönüştürülmüş elyaf" zaten listede;
   * bu öneri aynı konuyu farklı sözcüklerle veriyor (benzerlik ~0.50). Seed her
   * ekran durumunu bir kez üretsin ki özellik gözle de doğrulanabilsin.
   */
  await sql`
    insert into oneri (donem_id, gonderen_ref, koken, baslik, gerekce, ilce, durum)
    values (${donemler["usak"]}, ${ref["yatirimci@ykh.local"]}, 'yeni',
            'Tekstil kırpığından geri dönüşüm elyafı üretimi',
            'Konfeksiyon atölyelerinden çıkan kırpık ilde toplanıyor; elyafa çevrilmeden il dışına satılıyor.',
            'Merkez', 'degerlendiriliyor')
  `;

  const [{ count: ilSayisi }] = await sql<{ count: string }[]>`select count(*) from il`;
  const [{ count: konuSayisi }] = await sql<{ count: string }[]>`select count(*) from yatirim_konusu`;
  const [{ count: oneriSayisi }] = await sql<{ count: string }[]>`select count(*) from oneri`;
  const [{ count: belgeSayisi }] = await sql<{ count: string }[]>`select count(*) from belge`;

  return {
    ozet:
      `${naceSayisi} NACE kodu · ${ajansSayisi} ajans · ${ilSayisi} il · ` +
      `${konuSayisi} resmî yatırım konusu · ${belgeSayisi} üst ölçekli belge · ` +
      `${oneriSayisi} öneri · 3 kullanıcı`,
  };
}

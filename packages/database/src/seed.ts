import { KRITERLER, TR33_2027_V1, type AgirlikSeti, type Kriter } from "@ykh/scoring";
import { sahip } from "./baglanti.ts";
import { parolaOzetle } from "./parola.ts";

/**
 * Demo verisi. Sahip bağlantısıyla çalışır (RLS baypas) — seed bir yönetim
 * işidir, uygulama yolu değildir.
 *
 * Veri seti tasarım prototipiyle birebir aynı sonucu üretir: Uşak 2027'de
 * 2 korunuyor · 1 ekleniyor · 2 çıkıyor · 1 boş slot.
 */

// ponytail: demo parolası tek yerde ve açıkça yazılı. Üretimde seed çalışmaz.
export const DEMO_PAROLA = "ykh-demo-2027";

type AdayTohumu = {
  id: string;
  ad: string;
  koken: "mevcut" | "yeni";
  hedefPuan: number;
  kanit: number;
  nace: string;
  /** doğrulanmamış bir bulgusu var mı — epistemik gramer bunu kullanır */
  aiBulgusu: boolean;
  iddia: string;
};

const USAK_ADAYLAR: AdayTohumu[] = [
  { id: "teknik-tekstil", ad: "Teknik tekstil ve dokusuz yüzey üretimi", koken: "mevcut", hedefPuan: 73, kanit: 82, nace: "NACE 13.95", aiBulgusu: false, iddia: "İl imalat sanayiinde teknik tekstil kapasitesi ve nitelikli işgücü mevcut." },
  { id: "geri-donusum-elyaf", ad: "Tekstil kırpıklarından yüksek kaliteli geri dönüştürülmüş elyaf", koken: "yeni", hedefPuan: 74, kanit: 77, nace: "NACE 13.10 · GTİP 5505", aiBulgusu: false, iddia: "Tekstil kırpığı arzı il içinde sürdürülebilir hacimde." },
  { id: "deri-ihtisas", ad: "Deri ve deri ürünlerinde ihtisas üretimi", koken: "mevcut", hedefPuan: 66, kanit: 71, nace: "NACE 15.11", aiBulgusu: false, iddia: "Deri OSB altyapısı ve arıtma kapasitesi ilave yatırıma açık." },
  { id: "tarimsal-kurutma", ad: "Tarımsal kurutma ve soğuk zincir tesisi", koken: "yeni", hedefPuan: 69, kanit: 41, nace: "NACE 10.39", aiBulgusu: true, iddia: "İlçe bazlı yaş ürün kaybı soğuk zincir yatırımıyla azaltılabilir." },
  { id: "jeotermal-sera", ad: "Jeotermal destekli sera ve ısı geri kazanımı", koken: "yeni", hedefPuan: 58, kanit: 63, nace: "NACE 01.13", aiBulgusu: false, iddia: "Jeotermal saha sıcaklığı sera ısıtması için yeterli." },
  { id: "batarya-kalip", ad: "Batarya kasası için hassas kalıp imalatı", koken: "yeni", hedefPuan: 57, kanit: 29, nace: "NACE 25.73", aiBulgusu: false, iddia: "Kalıp imalatında hassas işleme kapasitesi mevcut." },
  { id: "seramik-kaplama", ad: "Seramik kaplama malzemeleri", koken: "mevcut", hedefPuan: 53, kanit: 64, nace: "NACE 23.31", aiBulgusu: false, iddia: "Hammadde rezervi ve enerji maliyeti üretimi destekliyor." },
  { id: "sut-isleme", ad: "Süt ve süt ürünleri işleme", koken: "mevcut", hedefPuan: 49, kanit: 38, nace: "NACE 10.51", aiBulgusu: true, iddia: "Çiğ süt arzı işleme kapasitesinin üzerinde." },
];

const KUTAHYA_ADAYLAR: AdayTohumu[] = [
  { id: "kut-seramik", ad: "Karo ve sıhhi tesisat seramiği", koken: "mevcut", hedefPuan: 78, kanit: 80, nace: "NACE 23.31", aiBulgusu: false, iddia: "Kaolen rezervi ve mevcut tesis altyapısı güçlü." },
  { id: "kut-bor", ad: "Bor türevleri ve ileri malzeme", koken: "mevcut", hedefPuan: 71, kanit: 68, nace: "NACE 20.13", aiBulgusu: false, iddia: "Bor işleme tesisine yakınlık girdi maliyetini düşürüyor." },
  { id: "kut-manyezit", ad: "Manyezit bazlı refrakter üretimi", koken: "yeni", hedefPuan: 64, kanit: 61, nace: "NACE 23.20", aiBulgusu: false, iddia: "Refrakter talebi çelik sektörü büyümesiyle artıyor." },
  { id: "kut-termal", ad: "Termal turizm destekli sağlık hizmetleri", koken: "yeni", hedefPuan: 60, kanit: 57, nace: "NACE 86.10", aiBulgusu: false, iddia: "Termal kaynak kapasitesi ve yatak arzı uyumlu." },
  { id: "kut-gida", ad: "Kuru gıda paketleme ve lojistik", koken: "yeni", hedefPuan: 55, kanit: 33, nace: "NACE 10.85", aiBulgusu: true, iddia: "Lojistik koridoruna yakınlık avantaj sağlıyor." },
];

/**
 * Sekiz kritere, ağırlıklı toplamı tam olarak `hedef` olan çeşitli puanlar dağıtır.
 * Ağırlıklar 1'e toplandığı için tüm puanları sabit bir miktar kaydırmak
 * toplamı aynı miktarda kaydırır — düzeltme tek satır.
 */
const SAPMA = [8, -6, 4, -3, 5, -7, 2, -3];

export function kriterPuanlariUret(hedef: number, set: AgirlikSeti, kaydir = 0): Record<Kriter, number> {
  const sapmalar = KRITERLER.map((_, i) => SAPMA[(i + kaydir) % SAPMA.length]);
  const agirlikliSapma = KRITERLER.reduce((t, k, i) => t + set.agirliklar[k] * sapmalar[i], 0);
  const out = {} as Record<Kriter, number>;
  KRITERLER.forEach((k, i) => {
    out[k] = Math.max(0, Math.min(100, hedef + sapmalar[i] - agirlikliSapma));
  });
  return out;
}

/** Hedef kanıt yeterliliğini 2–3 kanıt kartına böler. */
function kanitDagit(hedef: number): number[] {
  if (hedef <= 0) return [];
  if (hedef <= 20) return [hedef];
  const a = Math.round(hedef * 0.45);
  const b = Math.round(hedef * 0.33);
  return [a, b, hedef - a - b].filter((n) => n > 0);
}

export async function seed(): Promise<{ ozet: string }> {
  const sql = sahip();

  await sql`
    truncate denetim, is_kuyrugu, karar, destek, bulgu, kriter_puani, iddia_kanit, iddia,
             kanit, aday, oneri, donem, agirlik_seti, ilce, il, ajans, oturum, kimlik, gonderen
    restart identity cascade
  `;

  // ── kullanıcılar ────────────────────────────────────────────────────────
  const ozet = await parolaOzetle(DEMO_PAROLA);
  const kullanicilar = [
    { eposta: "uzman@ykh.local", ad: "S. Aydın", rol: "ajans_uzmani" },
    { eposta: "sektor@ykh.local", ad: "M. Yalçın", rol: "sektor_uzmani" },
    { eposta: "kurul@ykh.local", ad: "H. Demir", rol: "kurul_uyesi" },
    { eposta: "birey@ykh.local", ad: "A. Kaya", rol: "birey" },
    { eposta: "gozlemci@ykh.local", ad: "N. Öz", rol: "gozlemci" },
    { eposta: "denetci@ykh.local", ad: "T. Arslan", rol: "denetci" },
  ] as const;

  const ref: Record<string, string> = {};
  for (const k of kullanicilar) {
    const [g] = await sql<{ ref: string }[]>`
      insert into gonderen (rol, beyan_kurum, beyan_sektor)
      values (${k.rol}::rol, ${k.rol === "birey" ? "Uşak Ticaret ve Sanayi Odası" : null}, ${k.rol === "birey" ? "Tekstil" : null})
      returning ref
    `;
    ref[k.eposta] = g.ref;
    await sql`
      insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash, eposta_dogrulandi)
      values (${g.ref}, ${k.eposta}, ${k.ad}, ${ozet}, true)
    `;
  }

  // 12 destekçi — destek sayısı puana girmez, yalnızca ilgi sinyali
  const destekciler: string[] = [];
  for (let i = 0; i < 12; i++) {
    const [g] = await sql<{ ref: string }[]>`insert into gonderen (rol) values ('birey') returning ref`;
    await sql`insert into kimlik (gonderen_ref, eposta, ad_soyad, parola_hash, eposta_dogrulandi)
              values (${g.ref}, ${`destekci${i}@ykh.local`}, ${`Destekçi ${i + 1}`}, ${ozet}, true)`;
    destekciler.push(g.ref);
  }

  // ── coğrafya ────────────────────────────────────────────────────────────
  await sql`insert into ajans (kod, ad) values ('TR33', 'Zafer Kalkınma Ajansı')`;
  await sql`
    insert into il (kod, ad, ajans_kod) values
      ('usak', 'Uşak', 'TR33'),
      ('kutahya', 'Kütahya', 'TR33'),
      ('manisa', 'Manisa', 'TR33'),
      ('afyonkarahisar', 'Afyonkarahisar', 'TR33')
  `;
  for (const [il, ilceler] of [
    ["usak", ["Merkez", "Banaz", "Eşme", "Karahallı", "Sivaslı", "Ulubey"]],
    ["kutahya", ["Merkez", "Tavşanlı", "Simav", "Gediz", "Emet"]],
  ] as const) {
    for (const ad of ilceler) await sql`insert into ilce (il_kod, ad) values (${il}, ${ad})`;
  }

  // ── ağırlık seti ────────────────────────────────────────────────────────
  const set = TR33_2027_V1;
  await sql`
    insert into agirlik_seti (surum, ajans_kod, donem_yil, agirliklar, devamlilik_payi, kanit_esigi, devir_siniri, slot_sayisi)
    values (${set.surum}, ${set.ajans}, ${set.donem}, ${sql.json(set.agirliklar as never)},
            ${set.devamlilikPayi}, ${set.kanitEsigi}, ${set.devirSiniri}, ${set.slotSayisi})
  `;

  // ── dönemler ────────────────────────────────────────────────────────────
  const donemler: Record<string, number> = {};
  for (const il of ["usak", "kutahya"]) {
    const [d] = await sql<{ id: number }[]>`
      insert into donem (il_kod, yil, durum, agirlik_seti_surum)
      values (${il}, '2027', 'degerlendirme', ${set.surum})
      returning id
    `;
    donemler[il] = d.id;
  }

  let kanitSayaci = 0;
  const kanitKodu = () => `KNT-2026-${String(++kanitSayaci).padStart(4, "0")}`;

  async function adaylariKur(ilKod: string, tohumlar: AdayTohumu[]) {
    const donemId = donemler[ilKod];
    for (const [sira, t] of tohumlar.entries()) {
      let oneriId: number | null = null;

      if (t.koken === "yeni") {
        const [o] = await sql<{ id: number }[]>`
          insert into oneri (donem_id, gonderen_ref, tur, baslik, tanim, ilce, neden, nace, nace_onayli, durum)
          values (${donemId}, ${ref["birey@ykh.local"]}, 'yeni', ${t.ad},
                  ${`${t.ad} — ${t.iddia}`}, 'Merkez',
                  ${"Girdi arzı ve mevcut sanayi altyapısı bu konuyu ilde uygulanabilir kılıyor."},
                  ${t.nace}, true, 'konu_adayi')
          returning id
        `;
        oneriId = o.id;
        for (const dRef of destekciler.slice(0, 3 + ((sira * 4) % 9))) {
          await sql`insert into destek (oneri_id, gonderen_ref) values (${oneriId}, ${dRef})`;
        }
      }

      const [a] = await sql<{ id: number }[]>`
        insert into aday (donem_id, oneri_id, ad, koken, nace)
        values (${donemId}, ${oneriId}, ${t.ad}, ${t.koken}::koken, ${t.nace})
        returning id
      `;

      // kriter puanları — hepsi doğrulanmış (uzman değerlendirmesi tamam)
      const puanlar = kriterPuanlariUret(t.hedefPuan, set, sira);
      for (const kriter of KRITERLER) {
        await sql`
          insert into kriter_puani (aday_id, kriter, puan, dogrulandi, degerlendiren_ref, gerekce)
          values (${a.id}, ${kriter}::kriter, ${Math.round(puanlar[kriter])}, true,
                  ${ref["uzman@ykh.local"]}, 'Kanıt dosyası ve saha bilgisi değerlendirildi.')
        `;
      }

      const [iddia] = await sql<{ id: number }[]>`
        insert into iddia (aday_id, metin) values (${a.id}, ${t.iddia}) returning id
      `;

      // uzman onaylı kanıtlar — toplamları t.kanit
      for (const [k, katki] of kanitDagit(t.kanit).entries()) {
        const [kn] = await sql<{ id: number }[]>`
          insert into kanit (
            kod, donem_id, aday_id, oneri_id, kaynak_kurum, belge, belge_surum, sayfa_tablo, yayim_tarihi,
            cografi_kapsam, veri_donemi, alinti, sinirlilik, katki_puani,
            dogrulama_durumu, dogrulayan_ref, dogrulama_zamani, belge_metni, span_baslangic, span_bitis
          ) values (
            ${kanitKodu()}, ${donemId}, ${a.id}, ${oneriId},
            ${k === 0 ? "TÜİK — Bölgesel İstatistikler" : k === 1 ? "Uşak Ticaret ve Sanayi Odası" : "Sanayi ve Teknoloji Bakanlığı"},
            ${k === 0 ? "Bölgesel İmalat Sanayi Katma Değer Tabloları" : k === 1 ? "Sektör Raporu 2026/1" : "OSB Doluluk ve Altyapı Raporu"},
            ${k === 0 ? "2026-R2" : "2026/1"},
            ${k === 0 ? "Tablo 4.2, s. 118" : k === 1 ? "s. 34 · Tablo 6" : "s. 12"},
            ${k === 0 ? "2026-03-12" : "2026-02-04"}::date,
            ${"TR33 · il düzeyi"}, '2019–2024',
            ${`${t.iddia} Kaynak belgede ilgili tabloda bu bulguyu destekleyen seri yer almaktadır.`},
            ${"Veri il düzeyindedir; ilçe kırılımı yoktur. Türetilen büyüklükler uzman incelemesi gerektirir."},
            ${katki}, 'uzman_onayli', ${ref["uzman@ykh.local"]}, now(),
            ${`Belge metni. ${t.iddia} Kaynak belgede ilgili tabloda bu bulguyu destekleyen seri yer almaktadır. Devamı...`},
            ${14}, ${14 + t.iddia.length}
          )
          returning id
        `;
        await sql`insert into iddia_kanit (iddia_id, kanit_id) values (${iddia.id}, ${kn.id})`;
      }

      // doğrulanmamış AI bulgusu — puana GİRMEZ, ekranda görünür
      if (t.aiBulgusu) {
        const [kn] = await sql<{ id: number }[]>`
          insert into kanit (
            kod, donem_id, aday_id, oneri_id, kaynak_kurum, belge, sayfa_tablo, yayim_tarihi,
            cografi_kapsam, alinti, sinirlilik, katki_puani, dogrulama_durumu
          ) values (
            ${kanitKodu()}, ${donemId}, ${a.id}, ${oneriId},
            'Kaynak beyanı — doğrulanmadı', 'Sektör görüşmesi notu', 's. 3', '2026-05-20'::date,
            'İl düzeyi', ${"AI, tanımdan bu iddiayı çıkardı; insan doğrulaması bekliyor."},
            ${"Kaynak künyesi eksik; uzman doğrulaması olmadan puana giremez."},
            ${24}, 'ai_bulgusu'
          )
          returning id
        `;
        await sql`insert into iddia_kanit (iddia_id, kanit_id) values (${iddia.id}, ${kn.id})`;
        await sql`
          insert into bulgu (oneri_id, aday_id, tip, icerik, model_snapshot, prompt_surum, kanit_id)
          values (${oneriId}, ${a.id}, 'iddia_cikarimi',
                  ${sql.json({ iddia: t.iddia, guven: "orta", not: "Kaynak paketi dışında sayı üretilmedi." } as never)},
                  'claude-opus-5-20260101', 'iddia-cikarimi-v3', ${kn.id})
        `;
      }
    }
  }

  await adaylariKur("usak", USAK_ADAYLAR);
  await adaylariKur("kutahya", KUTAHYA_ADAYLAR);

  // Kanıt bekleyen taze bir öneri — triyaj kuyruğunu boş bırakmamak için
  await sql`
    insert into oneri (donem_id, gonderen_ref, tur, baslik, tanim, ilce, neden, nace, durum)
    values (${donemler["usak"]}, ${ref["birey@ykh.local"]}, 'yeni',
            'Atık ısıdan elektrik üretimi (ORC)',
            'Seramik ve tekstil tesislerindeki baca gazı atık ısısının ORC çevrimiyle elektriğe dönüştürülmesi.',
            'Merkez', 'Yüksek sıcaklık atık ısı kaynakları il merkezinde yoğunlaşıyor.',
            'NACE 35.11', 'kanit_bekliyor')
  `;

  const [{ count: adaySayisi }] = await sql<{ count: string }[]>`select count(*) from aday`;
  const [{ count: kanitSayisi }] = await sql<{ count: string }[]>`select count(*) from kanit`;

  return {
    ozet:
      `${kullanicilar.length + destekciler.length} kullanıcı · 4 il · 2 dönem · ` +
      `${adaySayisi} aday · ${kanitSayisi} kanıt`,
  };
}

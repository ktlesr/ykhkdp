import { islem, type Baglam } from "./baglanti.ts";
import { kaynakBelgesiYaz } from "./sorgu.ts";

/**
 * Dış veri kaynakları — periyodik olarak denetlenir, yalnızca değişen işlenir.
 *
 * Her kaynak il başına TEK belge üretir (`kategori` ile etiketli). Veri tablo
 * değil CÜMLE olarak yazılır: kanıt taraması pasajı kaynaktan birebir keser ve
 * başlıksız bir tablo satırı ("Afyon · 3 · 48") tek başına kanıt olamaz.
 * Cümlede il adı geçtiği için pasaj o ile yerel sayılır.
 */

const katla = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/[ıi]/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a").trim();

// ── Türk Patent · coğrafi işaretler ─────────────────────────────────────────

export type CografiIsaret = {
  Id?: number; Name: string; TypeName: string | null; ProductGroupName: string | null; CityName: string | null;
  DistrictName: string | null; StatusName: string | null; RegistrationDate: string | null;
  ApplicantOrRegistrant: string | null;
};

const CI_URL = "https://ci.turkpatent.gov.tr/GeographicalSigns/GetList";

/** Servis sayfa başına 9 kayıt verir; `PageLength` sayfa numarasıdır. */
async function ciSayfa(sayfa: number): Promise<{ liste: CografiIsaret[]; toplam: number }> {
  const y = await fetch(`${CI_URL}?CityId=&TypeId=&ProductGroupId=&PageLength=${sayfa}&Name=`, {
    headers: { accept: "application/json", "user-agent": "YKH-KDP/1.0 (+cografi-isaret)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!y.ok) throw new Error(`Türk Patent HTTP ${y.status}`);
  const j = (await y.json()) as { GeographicalSignAttributeList?: CografiIsaret[]; TotalCount?: number };
  return { liste: j.GeographicalSignAttributeList ?? [], toplam: Number(j.TotalCount) || 0 };
}

const yil = (t: string | null) => {
  const ms = Number(/\d{9,}/.exec(t ?? "")?.[0]);
  return ms ? new Date(ms).getUTCFullYear() : null;
};

/** Bir ilin coğrafi işaretlerini belge metnine çevirir — saf, test edilebilir. */
export function ciMetni(il: string, liste: readonly CografiIsaret[]): string {
  const sirali = [...liste].sort((a, b) => a.Name.localeCompare(b.Name, "tr"));
  const satir = (c: CografiIsaret) => {
    const tur = (c.TypeName ?? "coğrafi işaret").trim().toLocaleLowerCase("tr");
    const durum = (c.StatusName ?? "").trim().toLocaleLowerCase("tr") || "kayıtlı";
    const y = yil(c.RegistrationDate);
    return [
      `${c.Name.trim()}, ${il} ilinde${c.DistrictName?.trim() ? ` ${c.DistrictName.trim()} ilçesinde` : ""} ${durum} bir coğrafi işarettir (${tur}).`,
      c.ProductGroupName?.trim() ? `Ürün grubu: ${c.ProductGroupName.trim()}.` : "",
      y ? `Tescil yılı ${y}.` : "",
      c.ApplicantOrRegistrant?.trim() ? `Tescil ettiren: ${c.ApplicantOrRegistrant.trim()}.` : "",
    ].filter(Boolean).join(" ");
  };
  const gruplar = new Map<string, number>();
  for (const c of sirali) {
    const g = c.ProductGroupName?.trim() || "Diğer";
    gruplar.set(g, (gruplar.get(g) ?? 0) + 1);
  }
  return [
    `# ${il} coğrafi işaretleri`,
    `Kaynak: Türk Patent ve Marka Kurumu Coğrafi İşaretler Portalı (ci.turkpatent.gov.tr).`,
    `${il} ilinde ${sirali.length} coğrafi işaret kaydı vardır. Ürün gruplarına göre: ${[...gruplar].map(([g, n]) => `${g} ${n}`).join("; ")}.`,
    ...sirali.map(satir),
  ].join("\n\n");
}

export type KaynakSonucu = { kaynak: string; yazilan: number; ayni: number; atlanan: string[] };

/**
 * Coğrafi işaretleri çeker ve il belgelerini günceller.
 *
 * ponytail: değişiklik denetimi önce toplam kayıt sayısına bakar (tek istek);
 * sayı aynıysa tam listeyi çekmez. Sayı değişmeden durumu değişen kayıt
 * (başvuru → tescil) bir sonraki sayı değişiminde yakalanır. `zorla` atlar.
 */
export async function cografiIsaretGuncelle(
  b: Baglam, o: { zorla?: boolean; beklemeMs?: number; surdur?: () => boolean } = {},
): Promise<KaynakSonucu> {
  const ilk = await ciSayfa(1);
  // Sayısız ya da boş yanıt "liste tamam" sayılmasın: ilk dokuz kayıt il belgelerini ezerdi.
  if (ilk.toplam <= 0 || !ilk.liste.length) throw new Error("Türk Patent toplam kayıt sayısını vermedi.");
  const [son] = await islem(b, (sql) => sql<{ deger: string }[]>`select deger from ayar where anahtar = 'kaynak_ci_toplam'`);
  if (!o.zorla && son && Number(son.deger) === ilk.toplam) return { kaynak: "cografi_isaret", yazilan: 0, ayni: 0, atlanan: [] };

  // Kimliğe göre tekil: yinelenen sayfa eksik kaydı sayıca örtemesin.
  const tekil = new Map<string, CografiIsaret>();
  const ekle = (l: CografiIsaret[]) => l.forEach((c) => tekil.set(String(c.Id ?? `${c.Name}|${c.CityName}`), c));
  ekle(ilk.liste);
  const sonSayfa = Math.ceil(ilk.toplam / 9) + 5;
  for (let s = 2; tekil.size < ilk.toplam && s <= sonSayfa; s++) {
    if (o.surdur && !o.surdur()) throw new Error("Kaynak denetimi kapanış nedeniyle yarıda kesildi.");
    await new Promise((r) => setTimeout(r, o.beklemeMs ?? 300));
    const { liste } = await ciSayfa(s);
    if (!liste.length) break;
    ekle(liste);
  }
  // Eksik liste "il işaretini kaybetti" diye yazılmasın.
  if (tekil.size < ilk.toplam) throw new Error(`Türk Patent listesi eksik geldi: ${tekil.size}/${ilk.toplam}`);
  const hepsi = [...tekil.values()];

  const iller = await islem(b, (sql) => sql<{ kod: string; ad: string; ajans_kod: string }[]>`select kod, ad, ajans_kod from il`);
  const ilBul = new Map(iller.map((i) => [katla(i.ad), i]));
  const grup = new Map<string, CografiIsaret[]>();
  const atlanan = new Set<string>();
  for (const c of hepsi) {
    const il = ilBul.get(katla(c.CityName ?? ""));
    if (!il) { atlanan.add(c.CityName ?? "(il yok)"); continue; }
    grup.set(il.kod, [...(grup.get(il.kod) ?? []), c]);
  }
  // Ajansın /belgeler'den sildiği belge geri gelmez (kütüphane ve veri belgeleriyle aynı kural).
  const silinen = new Set(
    (await islem(b, (sql) => sql<{ ad: string }[]>`select detay->>'ad' as ad from denetim where eylem = 'belge_silindi' and detay->>'ad' is not null and coalesce((detay->>'parca')::int, 1) > 0`)).map((r) => r.ad),
  );
  let yazilan = 0, ayni = 0;
  for (const il of iller) {
    const liste = grup.get(il.kod);
    // ponytail: işareti sıfıra düşen ilin eski belgesi kalır (tescil geri alınmaz; pratikte olmuyor).
    if (!liste?.length) continue;
    const ad = `${il.ad} Coğrafi İşaretleri (Türk Patent)`;
    if (silinen.has(ad)) continue;
    const r = await kaynakBelgesiYaz(b, {
      ad, tur: "il_raporu", yil: null,
      ajansKod: il.ajans_kod, ilKod: il.kod, kategori: "cografi_isaret", metin: ciMetni(il.ad, liste),
    });
    if (r === "yazildi") yazilan++; else ayni++;
  }
  await islem(b, (sql) => sql`
    insert into ayar (anahtar, deger) values ('kaynak_ci_toplam', ${String(ilk.toplam)})
    on conflict (anahtar) do update set deger = excluded.deger, guncellendi = now()`);
  return { kaynak: "cografi_isaret", yazilan, ayni, atlanan: [...atlanan] };
}

/**
 * Periyodik denetim: son denetimden `saat` geçtiyse kaynakları yoklar.
 * Zaman damgası veritabanında — dağıtımda yeniden başlayan işleyici her
 * seferinde kaynağa gitmez. Başarısız ya da yarıda kesilen denetim (dağıtım
 * sırasında kapanan işleyici) günü yakmaz: damga geri çekilir, bir saat sonra
 * yeniden denenir — çöken kaynak yine de dakikada bir yoklanmaz.
 */
export async function kaynaklariDenetle(b: Baglam, saat = 24, surdur?: () => boolean): Promise<KaynakSonucu[] | null> {
  const [alindi] = await islem(b, (sql) => sql<{ anahtar: string }[]>`
    insert into ayar (anahtar, deger) values ('kaynak_denetim_zamani', now()::text)
    on conflict (anahtar) do update set deger = now()::text, guncellendi = now()
      where ayar.guncellendi < now() - make_interval(hours => ${Math.max(1, Math.round(saat))})
    returning anahtar`);
  if (!alindi) return null;
  try {
    return [await cografiIsaretGuncelle(b, { surdur })];
  } catch (e) {
    await islem(b, (sql) => sql`
      update ayar set guncellendi = now() - make_interval(hours => ${Math.max(0, Math.round(saat) - 1)})
      where anahtar = 'kaynak_denetim_zamani'`);
    throw e;
  }
}

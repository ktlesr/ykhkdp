import Link from "next/link";
import { onerilerim } from "@ykh/database";
import { ONERI_DURUM_ACIKLAMA, ONERI_DURUM_ETIKET, onaylayabilir, type OneriDurumu } from "@ykh/domain";
import { Bag, Baslik, Bos, Rozet, Sayfa, UstBar, Uyari } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";

/**
 * Önerilerim — yatırımcının tek görünümü.
 *
 * Öneriler artık sahibi ve ajans dışında kimseye görünmüyor (RLS `oneri_oku`).
 * O kapatma bir ekran borcu doğurdu: yatırımcının kendi önerilerine ulaşacağı
 * bir yer yoktu, il sıralaması ona kapalı. Protokol §10 altıncı ekran için
 * gerekçe ister — gerekçe bu: gizliliği kapatan değişikliğin kendisi.
 *
 * Kişisel veri yok: liste `gonderen_ref` ile filtrelenir, misafir de aynı
 * sayfayı kullanır.
 *
 * İLE GÖRE GRUPLU: yatırımcı birden çok ile öneri verebiliyor ve düz listede
 * "hangi il" satır içinde kaybolan bir alan kalıyordu. Gruplama okuma sırasını
 * kullanıcının kafasındaki sıraya çeviriyor: önce il, sonra o ile ne verdiği.
 * Sıra en çok öneri verilen ilden başlar; eşitlikte il adı.
 */

const DURUM_TURU = {
  listede: "yesil",
  onay_bekliyor: "amber",
  degerlendiriliyor: "notr",
  reddedildi: "kirmizi",
} as const satisfies Record<OneriDurumu, string>;

const DURUM_ISARET: Record<OneriDurumu, string> = {
  listede: "■",
  onay_bekliyor: "◌",
  degerlendiriliyor: "◌",
  reddedildi: "▼",
};

export default async function Onerilerim() {
  const k = await kullanici();

  if (!k) {
    return (
      <>
        <UstBar nav={[{ ad: "Öneri ver", yol: "/oneri" }]} />
        <Sayfa>
          <Baslik alt="Öneriler yalnızca sahibine ve ajansa görünür. Listeyi görmek için oturum gerekiyor.">
            Önerilerim
          </Baslik>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Bag varyant="dolu" href="/giris">
              Giriş yap
            </Bag>
            <Bag href="/kayit">Hesap aç</Bag>
            <Bag href="/oneri">Kayıt olmadan öneri ver</Bag>
          </div>
        </Sayfa>
      </>
    );
  }

  const liste = await onerilerim(await baglam());

  type Satir = (typeof liste)[number];
  const iller = liste
    .reduce<Array<{ kod: string; ad: string; yil: string; oneriler: Satir[] }>>((out, o) => {
      const g = out.find((x) => x.kod === o.il_kod);
      if (g) g.oneriler.push(o);
      else out.push({ kod: o.il_kod, ad: o.il, yil: o.yil, oneriler: [o] });
      return out;
    }, [])
    .sort((a, b) => b.oneriler.length - a.oneriler.length || a.ad.localeCompare(b.ad, "tr"));

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "Öneri ver", yol: "/oneri" },
          { ad: "Önerilerim", yol: "/onerilerim", aktif: true },
          ...(onaylayabilir(k.rol)
            ? [
                { ad: "İller", yol: "/iller" },
                { ad: "Ayarlar", yol: "/ayarlar" },
              ]
            : []),
        ]}
      />
      <Sayfa>
        <Baslik
          ustEtiket={
            liste.length > 0
              ? `${liste.length} öneri · ${iller.length} il`
              : undefined
          }
          alt="Verdiğiniz öneriler ve her birinin hangi aşamada olduğu. Bir öneri sahibi ve ajans dışında kimseye görünmez; sıralamaya girmesi için ajans onayı gerekir."
        >
          Önerilerim
        </Baslik>

        {k.misafir && (
          <Uyari>
            <b className="font-semibold text-[#5F4A15]">Kayıt olmadan devam ettiniz.</b> Bu liste tarayıcınızdaki
            oturum çerezine bağlı. Çerez silinirse önerilerinize bir daha ulaşamazsınız — ajans onları görmeye
            devam eder ama size bağlanamaz. Kalıcı erişim için hesap açın.
            <div className="mt-2.5">
              <Bag href="/kayit">Hesap aç</Bag>
            </div>
          </Uyari>
        )}

        {liste.length === 0 ? (
          <Bos baslik="Henüz öneri vermediniz.">
            Bir yatırım konusu önerin; yapay zekâ onu üst ölçekli belgelere ve sekiz kritere göre puanlasın.
            <div className="mt-3">
              <Bag varyant="dolu" href="/oneri">
                Öneri ver
              </Bag>
            </div>
          </Bos>
        ) : (
          <div className="mt-6 border border-hairline bg-surface">
            {iller.map((g) => (
              <section key={g.kod} className="border-b border-b-hairline last:border-b-0">
                <h2 className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 border-b border-b-hairline-soft bg-paper px-5 py-3">
                  <span className="text-[15px] font-medium">{g.ad}</span>
                  <span className="num font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">
                    {g.yil} dönemi
                  </span>
                  <span className="num ml-auto font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">
                    {g.oneriler.length} öneri
                  </span>
                </h2>

                {g.oneriler.map((o) => (
                  <Link
                    key={o.id}
                    href={`/oneri/${o.id}`}
                    className="grid grid-cols-[1fr_96px_150px] items-center gap-x-4 gap-y-1.5 border-b border-b-hairline-soft px-5 py-3.5 last:border-b-0 hover:bg-paper max-[640px]:grid-cols-[1fr_150px]"
                  >
                    <div>
                      <div className="text-[14px] font-medium leading-[1.35] text-pretty">{o.baslik}</div>
                      <div className="num mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                        {o.olusturuldu.slice(0, 10)}
                      </div>
                    </div>
                    <div className="num pr-2 text-right text-[15px] max-[640px]:hidden">
                      {o.durum === "degerlendiriliyor" ? (
                        <span className="text-ink-mute">—</span>
                      ) : (
                        <>
                          {o.dayanak}
                          <span className="text-[10px] text-ink-mute">/100</span>
                        </>
                      )}
                    </div>
                    <div>
                      <Rozet tur={DURUM_TURU[o.durum]} isaret={DURUM_ISARET[o.durum]}>
                        {ONERI_DURUM_ETIKET[o.durum]}
                      </Rozet>
                    </div>
                  </Link>
                ))}
              </section>
            ))}
          </div>
        )}

        {liste.length > 0 && (
          <>
            <dl className="mt-5 max-w-[78ch] text-[12.5px] leading-[1.5] text-ink-soft">
              {(Object.keys(ONERI_DURUM_ETIKET) as OneriDurumu[])
                .filter((d) => liste.some((o) => o.durum === d))
                .map((d) => (
                  <div key={d} className="mt-1.5 flex gap-2.5">
                    <dt className="w-[130px] shrink-0 font-medium text-ink">{ONERI_DURUM_ETIKET[d]}</dt>
                    <dd>{ONERI_DURUM_ACIKLAMA[d]}</dd>
                  </div>
                ))}
            </dl>

            <div className="mt-6">
              <Bag varyant="dolu" href="/oneri">
                Yeni öneri ver
              </Bag>
            </div>
          </>
        )}
      </Sayfa>
    </>
  );
}

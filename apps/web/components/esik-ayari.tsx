import { ayarGetir, islem } from "@ykh/database";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { ALAN_ETIKET, GIRDI } from "./ui.tsx";
import { esikEylemi } from "@/lib/esik-eylem.ts";
import { baglam } from "@/lib/oturum.ts";

/**
 * Dayanak eşiği ayarı — yalnızca yöneticiye gösterilir (çağıran sayfa denetler;
 * eylem de ayrıca denetler). Kendi verisini kendisi okur: sayfaya eklemek için
 * `<EsikAyari />` yeter.
 *
 * Eşik neden ayar: puanlayan modele göre değişiyor. Aynı belgelerle bir model
 * sekiz kriterin sekizini belgeye bağlıyor (dayanak 83–95), bir başkası
 * yalnızca gerçekten ilgili gördüğü üç-dördünü (55–59). Gizli katsayı değil:
 * geçerli eşik ve kaynağı il ekranında yazar, değişiklik denetime düşer.
 */
export async function EsikAyari() {
  const b = await baglam();
  const [ayar, setler] = await Promise.all([
    ayarGetir(b, "dayanak_esigi"),
    islem(b, (sql) => sql<{ esik: number }[]>`select distinct dayanak_esigi as esik from agirlik_seti order by 1`),
  ]);
  const gecerli = ayar && /^\d{1,3}$/.test(ayar) && Number(ayar) <= 100 ? ayar : "";
  const setDegerleri = setler.map((s) => s.esik).join(", ");

  return (
    <section aria-labelledby="esik-baslik" className="border border-hairline bg-surface">
      <div className="serit px-4 py-3">
        <h2 id="esik-baslik" className="etiket text-ink">
          Dayanak eşiği
        </h2>
      </div>
      <div className="px-4 py-4">
        <p className="max-w-[68ch] text-[13.5px] leading-[1.55] text-ink-soft text-pretty">
          Belge dayanağı bu eşiğin altında kalan aday, puanı yüksek olsa da slot dolduramaz ve sıralamada “dayanaksız”
          görünür. Eşik puanlayan modele göre ayarlanmalıdır: bazı modeller sekiz kriterin hepsini belgeye bağlar, bazıları
          yalnızca gerçekten ilgili gördüklerini; ikincisinde aynı belgelerle dayanak daha düşük çıkar. Değişiklik hemen
          etkilidir; hiçbir puan, dayanak ya da karar değişmez, yalnızca hangi adayın slot doldurabileceği değişir.
        </p>
        <p className="mt-2 text-[13px] leading-[1.5] text-ink">
          {gecerli ? (
            <>
              Geçerli eşik: <b className="num">{gecerli}</b> (yönetici ayarı). Ağırlık setlerindeki değer:{" "}
              <span className="num">{setDegerleri}</span>.
            </>
          ) : (
            <>
              Ayar yok; ağırlık setlerindeki değer geçerli: <b className="num">{setDegerleri}</b>.
            </>
          )}
        </p>
        <EylemFormu eylem={esikEylemi} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex w-full max-w-[300px] flex-col">
            <span className={ALAN_ETIKET}>Eşik (0–100; boş = ağırlık setindeki değer)</span>
            <input
              name="esik"
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="numeric"
              defaultValue={gecerli}
              placeholder={setDegerleri}
              className={GIRDI}
            />
          </label>
          <Gonder bekleme="Kaydediliyor">Eşiği kaydet</Gonder>
        </EylemFormu>
      </div>
    </section>
  );
}

import { analizEt, istemciSec, MODEL_SNAPSHOT } from "@ykh/ai-gateway";
import { adaylariGetir, denetle, donemGetir, islem, kararGetir, type Baglam } from "@ykh/database";
import { aiMaliyeti, log } from "@ykh/observability";
import { kararRaporu } from "@ykh/reporting";
import { kaynakPaketi } from "@ykh/retrieval";
import { ayardan, grupAgirligi, hesapla } from "@ykh/scoring";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * İş tipleri. Her iş saf girdiden çalışır ve sonucunu veritabanına yazar.
 * Doğrulamadan geçmeyen AI çıktısı KAYDEDİLMEZ (fail-closed).
 */

export type IsKaydi = { id: number; tip: string; yuk: Record<string, unknown> };

export const CIKTI_KLASORU = process.env.YKH_CIKTI ?? join(process.cwd(), ".data", "rapor");

export const ISLER: Record<string, (b: Baglam, yuk: Record<string, unknown>) => Promise<string>> = {
  /** Öneriden atomik iddia çıkarır; sonucu doğrulanmamış bulgu olarak kaydeder. */
  async iddia_cikarimi(b, yuk) {
    const oneriId = Number(yuk.oneriId);
    const [o] = await islem(b, (sql) =>
      sql<{ id: number; donem_id: number; baslik: string; tanim: string }[]>`
        select id, donem_id, baslik, tanim from oneri where id = ${oneriId}
      `,
    );
    if (!o) throw new Error(`Öneri bulunamadı: ${oneriId}`);

    const { paket, satirlar } = await kaynakPaketi(b, o.donem_id, o.baslik, 6, o.id);
    if (!satirlar.length) return "Kaynak paketi boş; analiz atlandı.";

    const sonuc = await analizEt(istemciSec(), MODEL_SNAPSHOT, {
      semaAdi: "iddia_cikarimi",
      kullaniciMetni: `Başlık: ${o.baslik}\nTanım: ${o.tanim}`,
      kaynaklar: satirlar,
      paket,
      rol: b.rol === "anonim" ? "ajans_uzmani" : b.rol,
    });

    aiMaliyeti({
      model: MODEL_SNAPSHOT,
      girdiToken: sonuc.ok ? sonuc.maliyet.girdiToken : 0,
      ciktiToken: sonuc.ok ? sonuc.maliyet.ciktiToken : 0,
      promptSurum: sonuc.promptSurum,
      sonuc: sonuc.ok ? "ok" : "red",
    });

    if (!sonuc.ok) {
      // Doğrulamadan geçmeyen çıktı KAYDEDİLMEZ; yalnızca denetime yazılır.
      await islem(b, (sql) =>
        denetle(sql, b, "ai_cikti_reddedildi", "oneri", oneriId, { asama: sonuc.asama, hatalar: sonuc.hatalar }),
      );
      return `Reddedildi (${sonuc.asama}): ${sonuc.hatalar.slice(0, 3).join(" | ")}`;
    }

    await islem(b, async (sql) => {
      for (const iddia of sonuc.veri.iddialar) {
        await sql`
          insert into bulgu (oneri_id, tip, icerik, model_snapshot, prompt_surum, dogrulama_durumu)
          values (${oneriId}, 'iddia_cikarimi', ${sql.json(iddia as never)},
                  ${sonuc.modelSnapshot}, ${sonuc.promptSurum}, 'ai_bulgusu')
        `;
      }
      await denetle(sql, b, "ai_bulgusu_kaydedildi", "oneri", oneriId, {
        adet: sonuc.veri.iddialar.length,
        model: sonuc.modelSnapshot,
        promptSurum: sonuc.promptSurum,
        not: "Doğrulanmamış bulgu — uzman onayı olmadan puana girmez.",
      });
    });

    return `${sonuc.veri.iddialar.length} iddia kaydedildi (doğrulanmamış).`;
  },

  /** Dönem karar raporunu üretir ve diske yazar. */
  async rapor_uret(b, yuk) {
    const il = String(yuk.il);
    const yil = String(yuk.yil);
    const d = await donemGetir(b, il, yil);
    if (!d) throw new Error(`Dönem bulunamadı: ${il}/${yil}`);

    const adaylar = await adaylariGetir(b, d);
    const h = hesapla(adaylar, ayardan(d.set));
    const karar = await kararGetir(b, d.donemId);

    const html = kararRaporu({
      ajans: d.ajans,
      il: d.il,
      donem: d.yil,
      surum: d.set.surum,
      hesap: h,
      kilitZamani: karar?.kilit_zamani ?? null,
      kilitleyen: karar?.kilitleyen ?? null,
      gerekceler: (karar?.gerekceler as { konu: string; gerekce: string }[]) ?? [],
    yerellikPayi: grupAgirligi(d.set.agirliklar, "yerellik"),
    });

    await mkdir(CIKTI_KLASORU, { recursive: true });
    const yol = join(CIKTI_KLASORU, `${il}-${yil}-${d.set.surum}.html`);
    await writeFile(yol, html, "utf8");
    log.info("rapor_yazildi", { yol, boyut: html.length });
    return yol;
  },
};

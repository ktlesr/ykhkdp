import { istemciSec, MODEL_SECENEKLERI, modelSnapshot, type ModelIstemcisi } from "@ykh/ai-gateway";
import { islem, type Baglam } from "@ykh/database";

const SERVIS: Baglam = { gonderenRef: null, rol: "yonetici" };

/**
 * İki ayar, iki iş türü — fiyat/performans için:
 *
 *  · yargı   değerlendirme, karşı görüş, NACE önerisi, aday üretimi.
 *            Az çağrı, muhakeme ister.
 *  · tarama  kanıt taraması. Çağrıların büyük çoğunluğu (her parça bir kez),
 *            muhakeme istemez: pasaj kaynakta birebir yoksa doğrulayıcı
 *            düşürür. Ucuz ve hızlı model burada güvenli.
 *
 * Değer `MODEL_SECENEKLERI[].id`; yargı için "varsayilan" (ortam değişkeni),
 * tarama için "ayni" (yargı modeliyle aynı) da geçerli.
 */
export const MODEL_AYARI = "ai_model";
export const TARAMA_MODEL_AYARI = "ai_tarama_model";

let onbellek: { yargi: string; tarama: string; zaman: number } | null = null;

/**
 * Seçimi okur. 30 sn süreç içi önbellek: değişiklik worker'a en geç yarım
 * dakikada yansır. Seçilen sağlayıcının anahtarı yoksa çağrı açık hatayla
 * durur; sessizce başka modele düşülmez.
 */
export async function modelSec(gorev: "yargi" | "tarama" = "yargi"): Promise<{ istemci: ModelIstemcisi; model: string }> {
  if (!onbellek || Date.now() - onbellek.zaman > 30_000) {
    const satirlar = await islem(SERVIS, (sql) =>
      sql<{ anahtar: string; deger: string }[]>`
        select anahtar, deger from ayar where anahtar in (${MODEL_AYARI}, ${TARAMA_MODEL_AYARI})
      `,
    );
    const oku = (a: string, v: string) => satirlar.find((r) => r.anahtar === a)?.deger ?? v;
    onbellek = { yargi: oku(MODEL_AYARI, "varsayilan"), tarama: oku(TARAMA_MODEL_AYARI, "ayni"), zaman: Date.now() };
  }
  const id = gorev === "tarama" && onbellek.tarama !== "ayni" ? onbellek.tarama : onbellek.yargi;
  const secim = MODEL_SECENEKLERI.find((m) => m.id === id);
  if (!secim) return { istemci: istemciSec(), model: modelSnapshot() };
  return { istemci: istemciSec(secim.saglayici), model: secim.model };
}

/** Testler ve ayar değişikliği sonrası için. */
export function modelOnbelleginiTemizle(): void {
  onbellek = null;
}

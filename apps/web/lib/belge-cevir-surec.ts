import { join } from "node:path";
import { Worker } from "node:worker_threads";
import type { Ceviri } from "./belge-cevir.ts";

/**
 * Dosya dönüştürmeyi AYRI iş parçacığında, bellek sınırı ve zaman aşımıyla koşar.
 *
 * Neden: yüklenen dosya güvenilmez girdidir. Ayrıştırıcı (pdf.js, mammoth,
 * exceljs) kötü niyetli ya da yalnızca çok büyük bir dosyada dakikalarca
 * işlemci tutabilir ya da belleği şişirebilir; ana süreçte bu bütün siteyi
 * durdurur. Burada en kötü durumda yalnızca işçi sonlanır ve kullanıcı açık
 * bir hata görür. ZIP boyut sınaması (`zipSismesi`) ilk kattır, bu ikinci.
 *
 * ponytail: `resourceLimits` V8 yığınını sınırlar; yığın dışı arabellekleri
 * (açılmış ZIP verisi) sınırlamaz — onları `zipSismesi` (150 MB) ve zaman
 * aşımı tutar. Tam yalıtım için kapsayıcı düzeyinde bellek sınırı gerekir.
 */
const SURE_MS = Number(process.env.YKH_CEVIRI_SURE_MS ?? 90_000);
const YIGIN_MB = Number(process.env.YKH_CEVIRI_YIGIN_MB ?? 768);

export function ayriSurecteCevir(ad: string, veri: Uint8Array, sureMs = SURE_MS): Promise<Ceviri> {
  return new Promise((coz) => {
    // Yol çalışma dizininden: geliştirmede apps/web, üretimde standalone/apps/web
    // (dosyalar oraya `outputFileTracingIncludes` ile kopyalanır).
    const isci = new Worker(join(process.cwd(), "lib", "belge-cevir-isci.mts"), {
      workerData: { ad, veri },
      resourceLimits: { maxOldGenerationSizeMb: YIGIN_MB },
    });
    let bitti = false;
    const bitir = (r: Ceviri) => {
      if (bitti) return;
      bitti = true;
      clearTimeout(sure);
      void isci.terminate();
      coz(r);
    };
    const sure = setTimeout(
      () => bitir({ ok: false, hata: `Dosya ${Math.round(sureMs / 1000)} saniyede çevrilemedi; işlem durduruldu. Daha küçük bir dosya deneyin ya da metni yapıştırın.` }),
      sureMs,
    );
    isci.once("message", (r: Ceviri) => bitir(r));
    isci.once("error", (e: Error & { code?: string }) =>
      bitir({
        ok: false,
        hata:
          e.code === "ERR_WORKER_OUT_OF_MEMORY"
            ? "Dosya çevrilirken bellek sınırı aşıldı; yüklenmedi."
            : `Dosya okunamadı (${e.message}). Metni yapıştırmayı deneyin.`,
      }),
    );
    isci.once("exit", () => bitir({ ok: false, hata: "Dosya çevrilemedi; işlem beklenmedik biçimde sonlandı." }));
  });
}

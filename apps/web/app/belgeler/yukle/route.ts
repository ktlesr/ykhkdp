import { onaylayabilir } from "@ykh/domain";
import { belgeEylemi } from "@/lib/eylem.ts";
import { kullanici } from "@/lib/oturum.ts";

/**
 * Belge yükleme ucu — ekran değil, `/belgeler` formunun gönderim adresi.
 *
 * Sunucu eylemi yerine ayrı uç: eylemlerin gövde sınırı (1 MB) TÜM eylemler
 * için ortaktır ve kimlik doğrulanmadan önce uygulanır; 30 MB'lık dosya için
 * onu yükseltmek anonim isteklere de 30 MB gövde açardı. Burada sıra tersidir:
 * önce oturum ve rol, sonra boyut (başlıktan), gövde EN SON okunur.
 */
const SINIR = 31 * 1024 * 1024;

export async function POST(istek: Request) {
  const k = await kullanici();
  if (!k || !onaylayabilir(k.rol)) {
    return Response.json({ ok: false, mesaj: "Belge yüklemek yalnızca ajans rolünde." }, { status: 403 });
  }
  // Siteler arası istek (CSRF): sunucu eylemlerindeki köken denetimi burada yok, elle yapılır.
  const koken = istek.headers.get("origin");
  const site = istek.headers.get("sec-fetch-site");
  const sunucu = istek.headers.get("x-forwarded-host") ?? istek.headers.get("host");
  if ((site && site !== "same-origin") || !koken || new URL(koken).host !== sunucu) {
    return Response.json({ ok: false, mesaj: "İstek bu siteden gelmiyor." }, { status: 403 });
  }
  const boy = Number(istek.headers.get("content-length"));
  if (!Number.isFinite(boy) || boy <= 0) return Response.json({ ok: false, mesaj: "İstek boyutu bildirilmedi." }, { status: 411 });
  if (boy > SINIR) return Response.json({ ok: false, mesaj: "Dosya en çok 30 MB olabilir." }, { status: 413 });
  return Response.json(await belgeEylemi(null, await istek.formData()));
}

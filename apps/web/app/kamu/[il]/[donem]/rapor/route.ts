import { adaylariGetir, donemGetir, kararGetir } from "@ykh/database";
import { kararRaporu } from "@ykh/reporting";
import { ayardan, hesapla } from "@ykh/scoring";
import { ANONIM_BAGLAM } from "@/lib/kamu.ts";

/**
 * Yazdırılabilir karar raporu.
 *
 * ponytail: PDF kütüphanesi yok — tek dosya HTML + @page kuralları. Tarayıcının
 * "PDF olarak kaydet"i çıktıyı veriyor, Word bu dosyayı doğrudan açıyor.
 */
export async function GET(
  _istek: Request,
  { params }: { params: Promise<{ il: string; donem: string }> },
) {
  const { il, donem } = await params;
  const b = ANONIM_BAGLAM;

  const d = await donemGetir(b, il, donem);
  if (!d) return new Response("Dönem bulunamadı.", { status: 404 });

  const h = hesapla(await adaylariGetir(b, d), ayardan(d.set));
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
  });

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

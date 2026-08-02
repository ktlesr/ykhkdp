import { redirect } from "next/navigation";
import { ayarGetir } from "@ykh/database";
import { PaletSecici } from "@/components/palet-secici.tsx";
import { Baslik, Sayfa, UstBar } from "@/components/ui.tsx";
import { baglam, kullanici } from "@/lib/oturum.ts";
import { paletGecerli } from "@/lib/palet.ts";

/**
 * Kurumsal ayarlar — yalnızca yönetici.
 *
 * Ajans bile değiştiremez: palet herkesin gördüğü tek görünümdür ve ekran
 * görüntüsünün kanıt değerini korumak için kurumsal bir karardır.
 */
export default async function Ayarlar() {
  const k = await kullanici();
  if (!k) redirect("/giris?hedef=%2Fayarlar");
  if (k.rol !== "yonetici") redirect("/oneri");

  const b = await baglam();
  const secili = paletGecerli(await ayarGetir(b, "palet"));

  return (
    <>
      <UstBar
        kullanici={k}
        nav={[
          { ad: "İller", yol: "/iller" },
          { ad: "Onay", yol: "/onay" },
          { ad: "Belgeler", yol: "/belgeler" },
          { ad: "Ayarlar", yol: "/ayarlar", aktif: true },
        ]}
      />
      <Sayfa>
        <Baslik
          ustEtiket="Yönetici"
          alt={
            <>
              Buradaki ayarlar <b>kurumsal</b>dır: herkes aynı görünümü görür ve değişiklik denetim kaydına
              yazılır. Kişisel tercih yoktur; ekran görüntüsü paylaşıldığında herkeste aynı çıksın diye.
            </>
          }
        >
          Ayarlar
        </Baslik>

        <PaletSecici secili={secili} />
      </Sayfa>
    </>
  );
}

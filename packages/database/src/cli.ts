import { kapat } from "./baglanti.ts";
import { asagi, sifirla, yukari } from "./migrate.ts";
import { seed } from "./seed.ts";
import { belgeYukle, RESMI_BELGELER } from "./belge-yukle.ts";

const komut = process.argv[2] ?? "up";

try {
  switch (komut) {
    case "up": {
      const yeni = await yukari();
      console.log(yeni.length ? `Uygulandı: ${yeni.join(", ")}` : "Zaten güncel.");
      break;
    }
    case "down": {
      const geri = await asagi(Number(process.argv[3] ?? 1));
      console.log(`Geri alındı: ${geri.join(", ") || "yok"}`);
      break;
    }
    case "seed": {
      const { ozet } = await seed();
      console.log(`Seed tamam — ${ozet}`);
      break;
    }
    case "belgeler": {
      // docs/ altındaki gerçek plan belgelerini parçalayıp yükler.
      for (const b of RESMI_BELGELER) {
        const r = await belgeYukle(b);
        console.log(`${b.ad}: ${r.parca} parça · ${r.karakter.toLocaleString("tr-TR")} karakter`);
      }
      break;
    }
    case "reset": {
      await sifirla();
      const yeni = await yukari();
      const { ozet } = await seed();
      console.log(`Sıfırlandı · ${yeni.join(", ")} · ${ozet}`);
      break;
    }
    default:
      console.error(`Bilinmeyen komut: ${komut}. up | down [n] | seed | belgeler | reset`);
      process.exitCode = 1;
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await kapat();
}

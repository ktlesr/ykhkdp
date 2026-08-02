import { kapat } from "./baglanti.ts";
import { asagi, sifirla, yukari } from "./migrate.ts";
import { seed } from "./seed.ts";
import { kur } from "./kur.ts";
import { belgeYukle, parcala, RESMI_BELGELER, yolCoz } from "./belge-yukle.ts";
import { belgeDenetle, denetimiYaz } from "./belge-dogrula.ts";
import { konulariYukle, RESMI_LISTELER } from "./konu-yukle.ts";

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
    case "belge-dogrula": {
      // Yeni bir plan belgesini YÜKLEMEDEN önce kalitesini ölçer.
      const yollar = process.argv.slice(3);
      const hedefler = yollar.length ? yollar : RESMI_BELGELER.map((b) => b.dosya);
      let kirilan = 0;
      for (const yol of hedefler) {
        const d = await belgeDenetle(yol);
        const { readFile } = await import("node:fs/promises");
        const ilk = parcala(await readFile(yolCoz(yol), "utf8"))[0]?.metin ?? null;
        denetimiYaz(yol, d, ilk);
        if (!d.gecti) kirilan++;
      }
      if (kirilan) process.exitCode = 1;
      console.log();
      break;
    }
    case "konular": {
      // Resmî Yerel Yatırım Konuları Listesi (tebliğ) — fail-closed doğrulama.
      for (const l of RESMI_LISTELER) {
        const r = await konulariYukle(l.dosya, l.kaynak);
        console.log(
          `${r.yil}: ${r.konu} konu · ${r.il} il · ${r.gerekceli} gerekçeli`,
        );
      }
      break;
    }
    case "kur": {
      // ÜRETİM kurulumu. `seed` DEĞİL: hiçbir şeyi silmez, demo veri yazmaz,
      // tekrar çalıştırılabilir. Her dağıtımda koşturulmak üzere tasarlandı.
      console.log(`Kurulum tamam — ${await kur()}`);
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
      console.error(`Bilinmeyen komut: ${komut}. up | down [n] | kur | seed | belgeler | belge-dogrula [dosya…] | konular | reset`);
      process.exitCode = 1;
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await kapat();
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { NaceSecici } from "./nace-secici.tsx";
import { ALAN_ETIKET, GIRDI } from "./ui.tsx";
import { oneriEylemi } from "@/lib/eylem.ts";

/** Beş alanlı öneri formu. Tüm dokunma hedefleri ≥44px. */
export function OneriFormu({
  iller,
  secili,
  ilceler,
  yerellikPayi,
}: {
  iller: Array<{ kod: string; ad: string }>;
  secili: string;
  ilceler: string[];
  yerellikPayi: number;
}) {
  const router = useRouter();
  const [baslik, setBaslik] = useState("");
  const [gerekce, setGerekce] = useState("");
  const ilAdi = iller.find((x) => x.kod === secili)?.ad ?? "";

  return (
    <EylemFormu eylem={oneriEylemi} className="mt-6 border border-ink bg-surface">
      <div className="flex items-center justify-between bg-ink px-4 py-2.5 font-mono text-[10px] uppercase tracking-[.12em] text-[#C9CDD3]">
        <span>Öneri formu</span>
        <span>5 alan</span>
      </div>

      <div className="px-4 py-5">
        <label className={ALAN_ETIKET} htmlFor="baslik">
          Yatırım konusu başlığı
        </label>
        <input
          id="baslik"
          name="baslik"
          value={baslik}
          onChange={(e) => setBaslik(e.target.value)}
          placeholder="Örnek: Tekstil kırpıklarından geri dönüştürülmüş elyaf"
          className={GIRDI}
          required
          minLength={8}
        />

        <div className="mt-5">
          <label className={ALAN_ETIKET} htmlFor="gerekce">
            Neden burada? · en ağır soru
          </label>
          <textarea
            id="gerekce"
            name="gerekce"
            rows={5}
            value={gerekce}
            onChange={(e) => setGerekce(e.target.value)}
            placeholder="Hangi yerel kaynak, hangi mevcut sanayi, hangi arazi-enerji-işgücü donanımı bu konuyu burada mümkün kılıyor?"
            className="w-full resize-y border border-ink bg-[#FDFCFA] px-3 py-[11px] text-[13.5px] leading-[1.5] text-ink"
            required
            minLength={40}
          />
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <p className="max-w-[62ch] text-[12px] leading-[1.45] text-ink-soft">
              Puanın en büyük payı (<b>%{yerellikPayi}</b>) bu cevaba ait. Aynı konu başka bir ilde de aynı şekilde
              yapılabiliyorsa gerekçe zayıf kalır.
            </p>
            <span className="num shrink-0 text-[10px] text-ink-mute">{gerekce.length} karakter</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <div>
            <label className={ALAN_ETIKET} htmlFor="il">
              İl
            </label>
            <select
              id="il"
              name="il"
              defaultValue={secili}
              onChange={(e) => router.replace(`/oneri?il=${e.target.value}`)}
              className={GIRDI}
            >
              {iller.map((x) => (
                <option key={x.kod} value={x.kod}>
                  {x.ad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={ALAN_ETIKET} htmlFor="ilce">
              İlçe
            </label>
            <select id="ilce" name="ilce" className={GIRDI} defaultValue={ilceler[0] ?? ""}>
              {ilceler.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <NaceSecici />
        </div>

        <div className="mt-5 border border-hairline-soft bg-paper px-3.5 py-3">
          <div className="font-mono text-[9.5px] uppercase tracking-[.12em] text-ink-mute">Gizlilik</div>
          <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-soft">
            Adınız kamuya açık listede <b>görünmez</b>. Silme talebinizde kimliğiniz silinir, öneriniz takma anahtarla
            kalır.
          </p>
        </div>

        <div className="mt-5">
          <Gonder className="w-full">Öneriyi gönder{ilAdi ? ` · ${ilAdi}` : ""}</Gonder>
        </div>
        <p className="mt-2 text-[12px] leading-[1.45] text-ink-mute">
          Gönderdikten sonra yapay zekâ değerlendirir. Puan hazır olduğunda ajans onayına düşer.
        </p>
      </div>
    </EylemFormu>
  );
}

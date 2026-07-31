/**
 * Renk paleti kayıt defteri.
 *
 * Palet YALNIZCA rengi değiştirir. Tipografi, boşluk, yarıçap, gölge ve
 * hareket `design_handoff_ykh_kdp/README.md` §1–§2'ye tabidir ve paletle
 * oynamaz — kaynak dosyalardaki `rounded-lg (8px)`, 250–350ms geçiş ve
 * elevation §1.8'i ihlal ettiği için alınmadı.
 *
 * Epistemik dörtlü (uzman onaylı · doğrulanmadı · dayanak yok · çıkıyor)
 * her palette ayrı doğrulanır; kurallar `tasarim.test.ts` içinde.
 */

export type PaletKimlik = "temel" | "gece" | "antrasit" | "orman";

export type Palet = {
  id: PaletKimlik;
  ad: string;
  /** ne zaman tercih edilir — seçim ekranında görünür */
  aciklama: string;
  /** seçim ekranındaki örnek şerit: zemin · kağıt · marka · onaylı · doğrulanmadı */
  ornek: [string, string, string, string, string];
  /** kalibrasyon notu; boşsa handoff dörtlüsü hiç değişmedi */
  kalibrasyon?: string;
};

export const PALETLER: Palet[] = [
  {
    id: "temel",
    ad: "Kağıt ve mürekkep",
    aciklama:
      "Devir paketinin özgün paleti. Kağıt zemin, mürekkep metin, lacivert kurumsal aksan. " +
      "Basılı tutanak hissini en çok taşıyan set.",
    ornek: ["#EEEBE4", "#F6F4EF", "#1B2A47", "#1D5B4A", "#8A6A1F"],
  },
  {
    id: "gece",
    ad: "Gece ve krem",
    aciklama:
      "Soğuk mavi zemin, neredeyse siyah kurumsal aksan. Uzun süre açık kalan ekranlarda " +
      "gövde metni en yüksek kontrastı verir.",
    ornek: ["#f7f9ff", "#edf4ff", "#041627", "#1D5B4A", "#8A6A1F"],
  },
  {
    id: "antrasit",
    ad: "Antrasit ve alabaster",
    aciklama:
      "Nötr gri-bej. Renk yükü en düşük set; epistemik renkler sayfada tek renkli " +
      "unsurlar olarak öne çıkar.",
    ornek: ["#faf9f6", "#f4f3f1", "#2f312f", "#1D5B4A", "#8A6A1F"],
    kalibrasyon:
      "Kurumsal aksan orta gri yerine koyu antrasitten alındı: orta gri, " +
      "“dayanak yok” renginden ayrışmıyordu (ΔE 0.022). Epistemik dörtlü değişmedi.",
  },
  {
    id: "orman",
    ad: "Orman ve keten",
    aciklama:
      "Koyu yeşil kurumsal aksan, sıcak keten zemin. Kurumsal kimliği renkle " +
      "taşıyan tek set.",
    ornek: ["#fbf9f8", "#f5f3f3", "#163328", "#0f6558", "#8A6A1F"],
    kalibrasyon:
      "“Uzman onaylı” yeşili #1D5B4A → #0f6558 kaydırıldı (sapma ΔE 0.033): " +
      "kurumsal aksan da orman yeşili ve ikisi sıralama ekranında yan yana duruyor.",
  },
];

export const VARSAYILAN_PALET: PaletKimlik = "temel";

export function paletGecerli(deger: string | null | undefined): PaletKimlik {
  return PALETLER.some((p) => p.id === deger) ? (deger as PaletKimlik) : VARSAYILAN_PALET;
}

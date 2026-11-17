/**
 * Nihai liste indirme bağlantıları — Excel ve Word. Sade `<a download>`:
 * istemci kodu yok, dosyayı `/rapor?tur=nihai` üretir. Kapsam sunucuda
 * (`app_il_kapsaminda`): bağlantıyı elle değiştirmek kapsam genişletmez.
 */
export function NihaiIndir({ suzgec, etiket, className }: { suzgec?: { il?: string; bolge?: string }; etiket: string; className?: string }) {
  const q = new URLSearchParams({ tur: "nihai" });
  if (suzgec?.il) q.set("il", suzgec.il);
  if (suzgec?.bolge) q.set("bolge", suzgec.bolge);
  const bag = (bicim: "xlsx" | "docx") => `/rapor?${q.toString()}&bicim=${bicim}`;
  const stil =
    "etiket-l inline-flex min-h-11 items-center gap-2 rounded-[2px] border border-hairline bg-surface px-4 text-ink hover:border-ink-mute hover:bg-paper";
  return (
    <div className={["flex flex-wrap items-center gap-x-3 gap-y-2", className].filter(Boolean).join(" ")}>
      <span className="text-[13.5px] text-ink-soft">{etiket}</span>
      <a href={bag("xlsx")} download className={stil}>
        Excel
      </a>
      <a href={bag("docx")} download className={stil}>
        Word
      </a>
    </div>
  );
}

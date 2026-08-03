"use client";

import { useState } from "react";
import type { KayitliKullanici } from "@ykh/database";
import { ROL_ETIKET, ROLLER } from "@ykh/domain";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { Rozet } from "./ui.tsx";
import { kimlikAcEylemi, kimlikSilEylemi, rolAtaEylemi } from "@/lib/eylem.ts";

/**
 * Kayıtlı kullanıcılar — KVKK sınırlı görünüm.
 *
 * Liste MASKELİ gelir (`k****@ykh.local`) ve açık değer sunucudan hiç
 * gönderilmez; maskeleme SQL'de yapılır. Tek bir kaydı açmak ayrı bir
 * eylemdir, gerekçe ister ve denetim izine yazılır.
 *
 * Açılan değer bu bileşenin STATE'İNDE durur, sayfa yenilenince gider.
 * Kalıcı olarak ekranda tutmak "maskeleme" iddiasını boşa çıkarırdı.
 */
export function KullaniciListesi({
  kullanicilar,
  ajanslar,
}: {
  kullanicilar: KayitliKullanici[];
  ajanslar: Array<{ kod: string; ad: string }>;
}) {
  const [acilan, setAcilan] = useState<Record<string, string>>({});
  /** Seçili rol — ajans bölgesi alanını göstermek için. */
  const [rol, setRol] = useState<Record<string, string>>({});
  const [secili, setSecili] = useState<string | null>(null);

  return (
    <div className="mt-5 border border-hairline bg-surface">
      <div className="panel-koyu grid grid-cols-[1fr_120px_92px_150px] px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[.12em] text-[#C9CDD3] max-[720px]:grid-cols-[1fr_150px]">
        <div>Hesap</div>
        <div className="max-[720px]:hidden">Rol</div>
        <div className="text-right max-[720px]:hidden">Öneri</div>
        <div>Kişisel veri</div>
      </div>

      {kullanicilar.map((u) => (
        <div key={u.ref} className="border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0">
          <div className="grid grid-cols-[1fr_120px_92px_150px] items-center gap-x-4 gap-y-2 max-[720px]:grid-cols-[1fr_150px]">
            <div>
              <div className="num text-[14px] font-medium">
                {acilan[u.ref] ?? u.eposta_maske ?? <span className="text-ink-mute">e-posta yok</span>}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-ink-mute">
                {u.ad_maske ?? "—"}
                {u.ajans_kod && <span className="num"> · {u.ajans_kod}</span>}
                {u.misafir && " · misafir"}
                <span className="num"> · {u.olusturuldu.slice(0, 10)}</span>
              </div>
            </div>

            <div className="max-[720px]:hidden">
              <Rozet tur={u.rol === "yonetici" ? "notr" : "gri"}>{ROL_ETIKET[u.rol]}</Rozet>
            </div>
            <div className="num pr-2 text-right text-[15px] max-[720px]:hidden">{u.oneri}</div>

            <div className="flex flex-wrap gap-2">
              {u.pseudonimlestirildi ? (
                <Rozet tur="gri" isaret="—">
                  silindi
                </Rozet>
              ) : (
                <button
                  type="button"
                  onClick={() => setSecili(secili === u.ref ? null : u.ref)}
                  className="min-h-11 cursor-pointer border border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-[.1em]"
                >
                  {secili === u.ref ? "Kapat" : "Aç · sil"}
                </button>
              )}
            </div>
          </div>

          {secili === u.ref && !u.pseudonimlestirildi && (
            <div className="tex-unverified mt-3 border border-unverif-line border-l-[3px] border-l-unverif px-4 py-3.5">
              <p className="max-w-[74ch] text-[12.5px] leading-[1.5] text-ink-soft">
                Kişisel veriye erişim <b className="font-medium">denetim izine yazılır</b>: kim, ne zaman, kimin
                verisini, hangi gerekçeyle açtı. Gerekçe zorunludur.
              </p>

              {/*
                Rol ataması. Yeni bir "süper yönetici" ROLÜ eklenmedi: yetkiler
                yöneticiyle aynı olacaksa dördüncü bir rol enum'a, RLS'e,
                testlere ve ekranlara yayılan bir maliyet olurdu. RLS zaten
                `gonderen_guncelle` ile yöneticiye izin veriyor.

                Ajans rolünde bölge ZORUNLU: bölgesiz bir ajans hesabı toplu
                raporda hiçbir satır görmez (fail-closed) ve kullanıcı bunu
                "bozuk" sanar.
              */}
              <EylemFormu eylem={rolAtaEylemi} className="mb-4 flex flex-wrap items-end gap-2.5 border-b border-b-hairline pb-4">
                <input type="hidden" name="ref" value={u.ref} />
                <label>
                  <span className="block font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">Rol</span>
                  <select
                    name="rol"
                    defaultValue={u.rol}
                    onChange={(e) => setRol((o) => ({ ...o, [u.ref]: e.target.value }))}
                    className="mt-1 min-h-11 border border-hairline bg-alan px-3 py-2 text-[13.5px]"
                  >
                    {ROLLER.map((r) => (
                      <option key={r} value={r}>
                        {ROL_ETIKET[r]}
                      </option>
                    ))}
                  </select>
                </label>

                {(rol[u.ref] ?? u.rol) === "ajans" && (
                  <label>
                    <span className="block font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">
                      Ajans bölgesi
                    </span>
                    <select
                      name="ajansKod"
                      defaultValue={u.ajans_kod ?? ""}
                      className="mt-1 min-h-11 border border-hairline bg-alan px-3 py-2 text-[13.5px]"
                    >
                      <option value="">— seçin —</option>
                      {ajanslar.map((a) => (
                        <option key={a.kod} value={a.kod}>
                          {a.kod} · {a.ad}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <Gonder varyant="cizgi">Rolü kaydet</Gonder>
              </EylemFormu>

              <EylemFormu
                eylem={kimlikAcEylemi}
                className="mt-3 flex flex-wrap items-end gap-2.5"
                onSonuc={(s) => s.ok && setAcilan((o) => ({ ...o, [u.ref]: s.mesaj }))}
              >
                <input type="hidden" name="ref" value={u.ref} />
                <label className="flex-1 min-w-[240px]">
                  <span className="block font-mono text-[10px] uppercase tracking-[.1em] text-ink-mute">
                    Erişim gerekçesi
                  </span>
                  <input
                    name="gerekce"
                    required
                    minLength={8}
                    placeholder="KVKK başvurusu 2027/14 · kimlik eşleştirme"
                    className="mt-1 min-h-11 w-full border border-hairline bg-alan px-3 py-2 text-[13.5px]"
                  />
                </label>
                <Gonder varyant="cizgi">Kişisel veriyi aç</Gonder>
              </EylemFormu>

              <EylemFormu eylem={kimlikSilEylemi} className="mt-4 border-t border-t-hairline pt-3.5">
                <input type="hidden" name="ref" value={u.ref} />
                <p className="max-w-[74ch] text-[12.5px] leading-[1.5] text-ink-soft">
                  <b className="font-medium">Silme talebi (KVKK).</b> E-posta, ad ve parola özeti kalıcı olarak
                  silinir, oturumlar kapanır. Öneriler ve değerlendirmeler <b className="font-medium">durur</b> —
                  zincir takma anahtara bağlıdır, kişiye değil. Geri alınamaz.
                </p>
                <label className="mt-2.5 flex items-center gap-2.5 text-[13px]">
                  <input type="checkbox" name="onay" value="evet" className="size-4" />
                  Geri alınamayacağını anladım.
                </label>
                <div className="mt-2.5">
                  <Gonder varyant="kirmizi">Kişisel veriyi sil</Gonder>
                </div>
              </EylemFormu>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { KayitliKullanici } from "@ykh/database";
import { ROL_ETIKET, ROLLER } from "@ykh/domain";
import { EylemFormu, Gonder } from "./eylem-formu.tsx";
import { ALAN_ETIKET, GIRDI, Rozet } from "./ui.tsx";
import { kimlikAcEylemi, kimlikSilEylemi, rolAtaEylemi } from "@/lib/eylem.ts";
import { kullaniciEkleEylemi, kullaniciGuncelleEylemi } from "@/lib/kullanici-eylemleri.ts";

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
  const [yeniRol, setYeniRol] = useState("yatirimci");
  const [sayfa, setSayfa] = useState(1);
  const sayfaSayisi = Math.max(1, Math.ceil(kullanicilar.length / 8));
  const aktifSayfa = Math.min(sayfa, sayfaSayisi);

  function acikVeriyiTemizle(ref: string) {
    setAcilan((o) => {
      const yeni = { ...o };
      delete yeni[ref];
      return yeni;
    });
  }

  return (
    <>
      <details className="katlanir mt-5 border border-hairline bg-surface">
        <summary className="min-h-11 cursor-pointer px-4 py-3 text-[14px] font-medium">Yeni kullanıcı ekle</summary>
        <EylemFormu
          eylem={kullaniciEkleEylemi}
          onSonuc={(s) => s.ok && setYeniRol("yatirimci")}
          className="grid gap-4 border-t border-hairline p-4 sm:grid-cols-2"
        >
          <label>
            <span className={ALAN_ETIKET}>Ad soyad</span>
            <input name="adSoyad" required minLength={3} className={GIRDI} autoComplete="off" />
          </label>
          <label>
            <span className={ALAN_ETIKET}>E-posta</span>
            <input name="eposta" type="email" required maxLength={254} className={GIRDI} autoComplete="off" />
          </label>
          <label>
            <span className={ALAN_ETIKET}>Parola · en az 10 karakter</span>
            <input name="parola" type="password" required minLength={10} className={GIRDI} autoComplete="new-password" />
          </label>
          <label>
            <span className={ALAN_ETIKET}>Rol</span>
            <select name="rol" defaultValue="yatirimci" onChange={(e) => setYeniRol(e.target.value)} className={GIRDI}>
              {ROLLER.map((r) => <option key={r} value={r}>{ROL_ETIKET[r]}</option>)}
            </select>
          </label>
          {yeniRol === "ajans" && (
            <label>
              <span className={ALAN_ETIKET}>Ajans bölgesi</span>
              <select name="ajansKod" required defaultValue="" className={GIRDI}>
                <option value="">— seçin —</option>
                {ajanslar.map((a) => <option key={a.kod} value={a.kod}>{a.kod} · {a.ad}</option>)}
              </select>
            </label>
          )}
          <div className="sm:col-span-2"><Gonder>Kullanıcı oluştur</Gonder></div>
        </EylemFormu>
      </details>
    <div className="mt-5 border border-hairline bg-surface">
      <div className="serit grid grid-cols-[minmax(0,1fr)_120px_92px_150px] px-4 py-2.5 etiket text-ink-soft max-[720px]:grid-cols-[minmax(0,1fr)_150px]">
        <div>Hesap</div>
        <div className="max-[720px]:hidden">Rol</div>
        <div className="text-right max-[720px]:hidden">Öneri</div>
        <div>İşlemler</div>
      </div>

      {kullanicilar.slice((aktifSayfa - 1) * 8, aktifSayfa * 8).map((u) => (
        <div key={u.ref} className="border-b border-b-hairline-soft px-4 py-3.5 last:border-b-0">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_92px_150px] items-center gap-x-4 gap-y-2 max-[720px]:grid-cols-[minmax(0,1fr)_150px]">
            <div>
              <div className="num break-words text-[14px] font-medium">
                {acilan[u.ref] ?? u.eposta_maske ?? <span className="text-ink-mute">e-posta yok</span>}
              </div>
              <div className="mt-1 etiket text-ink-mute">
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
                  className="min-h-11 cursor-pointer border border-hairline px-3 py-2 etiket"
                >
                  {secili === u.ref ? "Kapat" : "Yönet"}
                </button>
              )}
            </div>
          </div>

          {secili === u.ref && !u.pseudonimlestirildi && (
            <div className="tex-unverified mt-3 border border-unverif-line border-l-[3px] border-l-unverif px-4 py-3.5">
              <EylemFormu
                eylem={kullaniciGuncelleEylemi}
                onSonuc={(s) => s.ok && acikVeriyiTemizle(u.ref)}
                className="mb-4 grid gap-3 border-b border-hairline pb-4 sm:grid-cols-2"
              >
                <input type="hidden" name="ref" value={u.ref} />
                <p className="text-[12.5px] text-ink-soft sm:col-span-2">Yalnızca değiştireceğiniz alanları doldurun; boş alanlar mevcut değerini korur.</p>
                <label>
                  <span className={ALAN_ETIKET}>Yeni ad soyad</span>
                  <input name="adSoyad" minLength={3} className={GIRDI} autoComplete="off" />
                </label>
                <label>
                  <span className={ALAN_ETIKET}>Yeni e-posta</span>
                  <input name="eposta" type="email" maxLength={254} className={GIRDI} autoComplete="off" />
                </label>
                <div className="sm:col-span-2"><Gonder varyant="cizgi">Bilgileri güncelle</Gonder></div>
              </EylemFormu>
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
                  <span className="block etiket text-ink-mute">Rol</span>
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
                    <span className="block etiket text-ink-mute">
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
                  <span className="block etiket text-ink-mute">
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

              <EylemFormu
                eylem={kimlikSilEylemi}
                onSonuc={(s) => {
                  if (s.ok) {
                    acikVeriyiTemizle(u.ref);
                    setSecili(null);
                  }
                }}
                className="mt-4 border-t border-t-hairline pt-3.5"
              >
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
      {kullanicilar.length === 0 && <p className="px-4 py-5 text-[13.5px] text-ink-soft">Kayıtlı hesap yok.</p>}
      {sayfaSayisi > 1 && (
        <nav aria-label="Kullanıcı sayfaları" className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3 text-[13px]">
          <span>{kullanicilar.length} kullanıcı · Sayfa {aktifSayfa} / {sayfaSayisi}</span>
          <div className="flex gap-2">
            <button type="button" disabled={aktifSayfa === 1} onClick={() => { setSayfa(aktifSayfa - 1); setSecili(null); }} className="min-h-11 border border-hairline px-3 disabled:opacity-40">Önceki</button>
            <button type="button" disabled={aktifSayfa === sayfaSayisi} onClick={() => { setSayfa(aktifSayfa + 1); setSecili(null); }} className="min-h-11 border border-hairline px-3 disabled:opacity-40">Sonraki</button>
          </div>
        </nav>
      )}
    </div>
    </>
  );
}

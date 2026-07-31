-- ── öneri gizliliği ──────────────────────────────────────────────────────────
--
-- Yatırımcı, misafir ve anonim kullanıcı BAŞKASININ önerisini göremez —
-- onaylanmış olsa bile. Önceki politika `durum = 'listede'` olan her öneriyi
-- herkese açıyordu.
--
-- Gerekçe: platform bir KARAR HAZIRLIK katmanı. Yatırımcıların gönderdiği
-- konu başlıkları ticari fikirdir ve rakibine açılmamalı; platformun ürettiği
-- sıralama da bir taslaktır, yayımlanmış bir karar değil. Kamuya açık olan şey
-- Bakanlığın yayımladığı resmî listedir (`yatirim_konusu`) ve o tabloya
-- dokunulmuyor.
--
-- Sıralamayı ajans ve yönetici görür; halk yürürlükteki resmî dört konuyu ve
-- yıllar arası sürekliliği görür.
--
-- TEK İSTİSNA `koken = 'mevcut'`: bu satırlar `yatirim_konusu` tablosundan
-- birebir türetilir, yani zaten kamuya açık olan tebliğ metnidir. Onları
-- gizlemek hiçbir şeyi gizlemez, yalnızca kamu görünümünü tutarsız yapardı.
-- Yatırımcı kendi önerisini `mevcut` açamaz (`oneri_yaz` politikası) — bu
-- köken yalnızca ajansın yayımladığı yürürlükteki konudur.

drop policy oneri_oku on oneri;

create policy oneri_oku on oneri for select using (
  gonderen_ref = app_ref()
  or app_onaylayabilir()
  or koken = 'mevcut'
);

/**
 * `oneri_taban_puani` RLS'i AŞAR (security definer) ve öneriler kamuya açıkken
 * bu zararsızdı: toplam puan zaten görünüyordu. Öneriler kapanınca aynı
 * fonksiyon "id dene, başkasının puanını oku" kapısına dönüşüyor.
 *
 * Görünürlük kontrolü fonksiyonun İÇİNE alınıyor: RLS'i aşma gerekçesi
 * "kırılımı gizle, toplamı aç" idi; "başkasının puanını aç" hiç değildi.
 * Göremediği bir öneri için 0 döner.
 */
create or replace function oneri_taban_puani(p_oneri_id bigint, p_agirliklar jsonb)
returns integer language sql stable security definer
set search_path = public as $$
  select coalesce(round(sum(
    (coalesce(d.duzeltilmis_puanlar, d.puanlar) ->> k.kriter)::numeric
    * (p_agirliklar ->> k.kriter)::numeric
  )), 0)::integer
  from degerlendirme d
  cross join (select unnest(enum_range(null::kriter))::text as kriter) k
  where d.oneri_id = p_oneri_id
    and exists (
      select 1 from oneri o
      where o.id = p_oneri_id
        and (o.gonderen_ref = app_ref() or app_onaylayabilir() or o.koken = 'mevcut')
    )
    and (coalesce(d.duzeltilmis_puanlar, d.puanlar) ->> k.kriter) is not null
$$;

revoke all on function oneri_taban_puani(bigint, jsonb) from public;
grant execute on function oneri_taban_puani(bigint, jsonb) to ykh_app;

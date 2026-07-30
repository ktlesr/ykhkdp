---
name: evidence-contract
description: AI değerlendirme sözleşmesini dayatır. packages/ai-gateway veya packages/evidence-validation altında dosya açılırken, model çağrısı yazılırken, Zod şeması eklenirken veya bir AI çıktısı kaydedilirken kullan.
---

# Değerlendirme sözleşmesi

`packages/ai-gateway` ve `packages/evidence-validation` altındaki her değişiklik bu
sözleşmeye uyar. Testleri geçse bile ihlal eden kod kabul edilmez.

## Zorunlu zincir

model çağrısı → **şema** → **alıntı doğrulama** → **dayanak puanı** → doğrulanmamış
taslak → **ajans onayı** → sıralama

Her ok bir kapıdır ve her kapı fail-closed. Kapı cevap veremiyorsa sonuç
"reddedildi"dir, "belki" değildir.

## Kontrol listesi

- [ ] Yeni şema `z.object({...}).strict()`.
- [ ] Yeni prompt `PROMPTLAR` kaydına **sürümüyle** eklendi (`ad-vN`).
- [ ] Prompt `ORTAK` sınırlar metnini içeriyor.
- [ ] Belge içeriği `kaynakBloguKur()` ile, `guvenilir="hayir"` etiketiyle,
      XML kaçışlı geçiyor. Ham metin prompt'a doğrudan gömülmüyor.
- [ ] Alıntı taşıyan çıktı `degerlendirmeyiDogrula()` üzerinden geçiyor.
- [ ] Model bir listeden seçim yapıyorsa (NACE gibi) liste dışı değer reddediliyor.
- [ ] `modelSnapshotDogrula()` çağrılıyor; `latest` reddediliyor.
- [ ] Sonuç `modelSnapshot` + `promptSurum` taşıyor ve DB'ye yazılıyor.
- [ ] Reddedilen çıktı **kaydedilmiyor**; yalnızca denetime yazılıyor.
- [ ] Eval testi eklendi: kaynaksız sayı, uydurulmuş alıntı, liste dışı değer.

## Yasak kalıplar

```ts
// YASAK — doğrulamayı atlayan yol
const veri = JSON.parse(cevap.metin);
await kaydet(veri);

// YASAK — şema hatasını yutmak
const c = SEMA.safeParse(ham);
await kaydet(c.success ? c.data : varsayilan);

// YASAK — AI puanını doğrudan listeye sokmak
if (s.ok) await sql`update oneri set durum = 'listede' ...`;  // ajans onayı atlandı

// YASAK — ham puanı güncellemek
await sql`update degerlendirme set puanlar = ... `;  // trigger reddeder, provenance ölür
```

## Doğru kalıp

```ts
const s = await degerlendir(istemci, MODEL_SNAPSHOT, girdi);
aiMaliyeti({ ... });
if (!s.ok) {
  await denetle(sql, b, "degerlendirme_reddedildi", "oneri", id, { asama: s.asama, hatalar: s.hatalar });
  return;  // öneri `degerlendiriliyor` kalır, en çok 3 deneme
}
await sql`insert into degerlendirme (..., model_snapshot, prompt_surum) values (...)`;
await sql`update oneri set durum = 'onay_bekliyor' where id = ${id}`;  // ONAY BEKLER
```

## Değiştirirken kırılması gerekenler

`packages/ai-gateway/src/eval.test.ts` ve
`packages/evidence-validation/src/validation.test.ts` bu sözleşmenin testidir.
Sözleşmeyi gevşetiyorsan bu testlerden en az biri kırılmalı. Kırılmıyorsa test
eksiktir — önce testi ekle.

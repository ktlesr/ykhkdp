---
name: evidence-contract
description: AI Gateway ve kanıt doğrulama sözleşmesini dayatır. packages/ai-gateway veya packages/evidence-validation altında dosya açılırken, model çağrısı yazılırken, Zod/JSON şeması eklenirken veya bir AI çıktısı kaydedilirken kullan.
---

# Kanıt sözleşmesi

`packages/ai-gateway` ve `packages/evidence-validation` altındaki her değişiklik
bu sözleşmeye uyar. Sözleşmeyi ihlal eden kod, testleri geçse bile kabul edilmez.

## Zorunlu zincir

Model çağrısı → **şema** → **kanıt doğrulama** → doğrulanmamış bulgu → **uzman onayı** → puan

Her ok bir kapıdır ve her kapı fail-closed'dır. Kapı cevap veremiyorsa sonuç
"reddedildi"dir, "belki" değildir.

## Kontrol listesi

- [ ] Yeni şema `z.object({...}).strict()` — `additionalProperties: false` üretmeli.
- [ ] Kaynak taşıyan her alan `evidence_ids: z.array(...).min(1)`.
- [ ] Yeni prompt `PROMPTLAR` kaydına **sürümüyle** eklendi (`ad-vN`).
- [ ] Prompt `ORTAK_SINIRLAR` metnini içeriyor.
- [ ] Belge içeriği `kaynakBloguKur()` ile, `guvenilir="hayir"` etiketiyle ve
      XML kaçışlı geçiyor. Ham metin prompt'a doğrudan gömülmüyor.
- [ ] Yeni şema kaynak iddiası taşıyorsa `kanitHatalari()` içinde ele alındı.
- [ ] `modelSnapshotDogrula()` çağrılıyor; `latest` reddediliyor.
- [ ] Sonuç `modelSnapshot` + `promptSurum` taşıyor ve `bulgu` tablosuna yazılıyor.
- [ ] Doğrulamadan geçmeyen çıktı **kaydedilmiyor**; yalnızca denetime yazılıyor.
- [ ] Eval testi eklendi: en az bir "kaynaksız sayı" ve bir "sahte kaynak" vakası.

## Yasak kalıplar

```ts
// YASAK — doğrulamayı atlayan yol
const veri = JSON.parse(cevap.metin);
await kaydet(veri);

// YASAK — şema hatasını yutmak
const c = SEMA.safeParse(ham);
await kaydet(c.success ? c.data : varsayilan);

// YASAK — doğrulanmış bulguyu doğrudan puana bağlamak
if (sonuc.ok) await kriterPuaniYaz(...);   // uzman onayı geçidi atlandı
```

## Doğru kalıp

```ts
const sonuc = await analizEt(istemci, MODEL_SNAPSHOT, girdi);
aiMaliyeti({ ...
});
if (!sonuc.ok) {
  await denetle(sql, b, "ai_cikti_reddedildi", ..., { asama: sonuc.asama, hatalar: sonuc.hatalar });
  return;
}
// dogrulama_durumu HER ZAMAN 'ai_bulgusu' — puana girmez
await sql`insert into bulgu (..., dogrulama_durumu) values (..., 'ai_bulgusu')`;
```

## Değiştirirken kırılması gerekenler

`packages/ai-gateway/src/eval.test.ts` ve
`packages/evidence-validation/src/validation.test.ts` bu sözleşmenin testidir.
Sözleşmeyi gevşetiyorsan bu testlerden en az biri kırılmalı. Kırılmıyorsa
test eksiktir — önce testi ekle.

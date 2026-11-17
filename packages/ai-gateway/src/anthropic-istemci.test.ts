import assert from "node:assert/strict";
import test from "node:test";
import { semayiSadelestir } from "./anthropic-istemci.ts";
import { jsonSema, SEMALAR, type SemaAdi } from "./sema.ts";
import { istemciSec } from "./istemci.ts";

const DESTEKSIZ = /"(minLength|maxLength|minimum|maximum|exclusiveMinimum|exclusiveMaximum|multipleOf|minItems|maxItems|pattern|\$schema)"/;

test("Claude'a giden şemada desteklenmeyen kısıt kalmaz; additionalProperties:false korunur", () => {
  for (const ad of Object.keys(SEMALAR) as SemaAdi[]) {
    const ham = JSON.stringify(jsonSema(ad));
    const sade = JSON.stringify(semayiSadelestir(jsonSema(ad)));
    assert.doesNotMatch(sade, DESTEKSIZ, `${ad}: desteklenmeyen kısıt kaldı`);
    // Nesne sayısı kadar additionalProperties:false — hiçbiri düşmedi.
    const say = (s: string) => (s.match(/"additionalProperties":false/g) ?? []).length;
    assert.equal(say(sade), say(ham), `${ad}: additionalProperties:false kayboldu`);
    assert.ok(say(sade) > 0);
  }
});

test("çıkarılan kısıt Zod doğrulamasında YİNE uygulanır (kısıt gevşemez)", () => {
  // Şemadan maxItems çıktı; Zod 8'den fazla aday kabul etmez.
  const fazla = { adaylar: Array.from({ length: 9 }, () => ({ baslik: "Uzun bir aday başlığı", gerekce: "x".repeat(40), kanit_no: [1, 2] })) };
  assert.equal(SEMALAR.aday_kesfi.safeParse(fazla).success, false);
});

test("anahtarsız Anthropic seçimi sessizce başka sağlayıcıya düşmez", async () => {
  const onceki = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const i = istemciSec("anthropic");
    assert.equal(i.ad, "anthropic");
    await assert.rejects(
      () => i.cagir({ modelSnapshot: "claude-opus-5-5", sistem: "", kullanici: "", jsonSema: {}, semaAdi: "nace_onerisi" }),
      /ANTHROPIC_API_KEY/,
    );
  } finally {
    if (onceki !== undefined) process.env.ANTHROPIC_API_KEY = onceki;
  }
});

test("çıkarılan kısıt modele açıklamada sözle bildirilir", () => {
  const s = JSON.stringify(semayiSadelestir(jsonSema("nace_onerisi")));
  assert.match(s, /en çok 300 karakter/);
  assert.match(s, /en çok 3 öğe/);
});

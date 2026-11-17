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

// ── Limit dolunca GPT-5.4 mini devralır ────────────────────────────────────

test("Anthropic limiti dolunca çağrı gpt-5.4-mini'ye geçer ve künyeye o yazılır", async () => {
  const { yedekli, YEDEK_MODEL } = await import("./istemci.ts");
  const { AnthropicLimitHatasi } = await import("./anthropic-istemci.ts");
  const onceki = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test";
  try {
    let gelenModel = "";
    const i = yedekli(
      { ad: "anthropic", cagir: async () => { throw new AnthropicLimitHatasi("429 rate_limit_error"); } },
      () => ({ ad: "openai", cagir: async (r) => { gelenModel = r.modelSnapshot; return { metin: "{}", girdiToken: 1, ciktiToken: 1 }; } }),
    );
    const c = await i.cagir({ modelSnapshot: "claude-sonnet-5-5", sistem: "", kullanici: "", jsonSema: {}, semaAdi: "nace_onerisi" });
    assert.equal(gelenModel, YEDEK_MODEL);
    assert.equal(c.model, YEDEK_MODEL, "künye yanıtı veren model");
  } finally {
    if (onceki === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = onceki;
  }
});

test("limit dışı hata (ret, kimlik, şema) yedeğe devredilmez", async () => {
  const { yedekli } = await import("./istemci.ts");
  let yedekCagrildi = false;
  const i = yedekli(
    { ad: "anthropic", cagir: async () => { throw new Error("Anthropic reddetti (cyber)."); } },
    () => ({ ad: "openai", cagir: async () => { yedekCagrildi = true; return { metin: "{}", girdiToken: 0, ciktiToken: 0 }; } }),
  );
  await assert.rejects(() => i.cagir({ modelSnapshot: "claude-opus-5-5", sistem: "", kullanici: "", jsonSema: {}, semaAdi: "nace_onerisi" }), /reddetti/);
  assert.equal(yedekCagrildi, false);
});

test("limit sınıflaması: 429, 529, bakiye mesajı evet; 401, düz 400 hayır", async () => {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const { limitHatasiMi } = await import("./anthropic-istemci.ts");
  const h = (status: number, mesaj: string) => Anthropic.APIError.generate(status, { error: { message: mesaj } }, mesaj, new Headers());
  assert.equal(limitHatasiMi(h(429, "rate limit")), true);
  assert.equal(limitHatasiMi(h(529, "overloaded")), true);
  assert.equal(limitHatasiMi(h(400, "Your credit balance is too low to access the Anthropic API.")), true);
  assert.equal(limitHatasiMi(h(400, "invalid schema")), false);
  assert.equal(limitHatasiMi(h(401, "invalid x-api-key")), false);
});

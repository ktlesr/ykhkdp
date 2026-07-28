import assert from "node:assert/strict";
import test from "node:test";
import { log } from "./index.ts";

function yakala(is: () => void): string[] {
  const satirlar: string[] = [];
  const asil = console.log;
  console.log = (s: string) => satirlar.push(s);
  try {
    is();
  } finally {
    console.log = asil;
  }
  return satirlar;
}

test("kişisel veri log'a düz yazılmaz", () => {
  const [satir] = yakala(() =>
    log.info("giris", { eposta: "a@b.com", ad_soyad: "A B", jeton: "gizli", oneriId: 5 }),
  );
  const j = JSON.parse(satir);
  assert.equal(j.eposta, "***");
  assert.equal(j.ad_soyad, "***");
  assert.equal(j.jeton, "***");
  assert.equal(j.oneriId, 5);
});

test("iç içe nesnelerde de maskeler", () => {
  const [satir] = yakala(() => log.info("x", { kullanici: { eposta: "a@b.com", rol: "birey" } }));
  const j = JSON.parse(satir);
  assert.equal(j.kullanici.eposta, "***");
  assert.equal(j.kullanici.rol, "birey");
});

test("debug varsayılan eşiğin altında yazılmaz", () => {
  assert.equal(yakala(() => log.debug("gizli")).length, 0);
});

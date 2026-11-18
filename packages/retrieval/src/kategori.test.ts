import assert from "node:assert/strict";
import test from "node:test";
import { konuKategorileri } from "./index.ts";

test("konu kategorileri: kök ve NACE bölümü", () => {
  assert.deepEqual(konuKategorileri("Mermer atıklarından kalsit üretimi"), ["maden_enerji"]);
  assert.deepEqual(konuKategorileri("Teknik seramik imalatı ve yemek sanayi"), ["sanayi"], "seramik sera değil, yemek yem değil");
  assert.ok(konuKategorileri("Jeotermal sera yatırımı").includes("tarim"));
  assert.ok(konuKategorileri("Termal sağlık turizmi tesisi").includes("turizm"));
  assert.ok(konuKategorileri("Koyun-keçi sütü işleme").includes("tarim"));
  assert.deepEqual(konuKategorileri("Yazılım geliştirme merkezi"), []);
  // Metin kategori vermese de NACE bölümü verir.
  assert.deepEqual(konuKategorileri("Veri merkezi", "0811"), ["maden_enerji"]);
  assert.deepEqual(konuKategorileri("Veri merkezi", "5510"), ["turizm"]);
});

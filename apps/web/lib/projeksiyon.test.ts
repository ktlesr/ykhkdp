import assert from "node:assert/strict";
import test from "node:test";
import type { DonemKaydi } from "@ykh/database";
import type { Aday } from "@ykh/domain";
import { TR33_2027_V1 } from "@ykh/scoring";
import { konumaGore, onaylanirsa } from "./projeksiyon.ts";

const D = { donemId: 1, ilKod: "usak", il: "Uşak", ajansKod: "TR33", ajans: "ZAFER", yil: "2027", set: TR33_2027_V1, kalibre: true } as DonemKaydi;
const aday = (id: string, taban: number, dayanak = 80, koken: Aday["koken"] = "yeni"): Aday => ({ id, ad: id, koken, taban, dayanak, nace: null });

test("en iyi en üstte: bekleyen, onaylılarla birlikte karar modeliyle konumlanır", () => {
  const onayli = [aday("o1", 70), aday("o2", 60)];
  const bekleyen = [aday("b-zayif", 40), aday("b-iyi", 90), aday("b-orta", 65), aday("b-dayanaksiz", 95, 10)];
  const k = onaylanirsa(onayli, bekleyen, D);

  assert.equal(k.get("b-iyi")?.tur, "asıl");
  assert.equal(k.get("b-iyi")?.sira, 1, "en yüksek puan en üstte");
  assert.equal(k.get("b-orta")?.tur, "asıl");
  assert.equal(k.get("b-dayanaksiz")?.tur, "dayanaksız", "puanı yüksek ama dayanaksız slot dolduramaz");
  assert.equal(k.has("o1"), false, "yalnızca bekleyenler döner");

  const sirali = konumaGore(bekleyen.map((x) => ({ id: x.id })), k).map((x) => x.id);
  assert.equal(sirali[0], "b-iyi");
});

test("asıl + yedek sınırı: slot kadar yedek, ötesi liste dışı", () => {
  const bekleyen = Array.from({ length: 11 }, (_, i) => aday(`b${String(i).padStart(2, "0")}`, 90 - i));
  const k = onaylanirsa([], bekleyen, D);
  const turler = [...k.values()].map((x) => x.tur);
  assert.equal(turler.filter((t) => t === "asıl").length, TR33_2027_V1.slotSayisi);
  assert.equal(turler.filter((t) => t === "yedek").length, TR33_2027_V1.slotSayisi);
  assert.equal(turler.filter((t) => t === "liste dışı").length, 11 - 2 * TR33_2027_V1.slotSayisi);
});

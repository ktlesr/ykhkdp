import type { Baglam } from "@ykh/database";

/**
 * Kamu portalı her zaman anonim bağlamla okur. Oturum açmış bir uzman bu
 * sayfaya baksa bile yalnızca kamuya açık satırları görür — RLS bunu
 * garanti eder, sayfa kodu değil.
 */
export const ANONIM_BAGLAM: Baglam = { gonderenRef: null, rol: "anonim" };

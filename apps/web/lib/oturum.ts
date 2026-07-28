import { cookies } from "next/headers";
import { baglamdan, oturumCoz, type Kullanici } from "@ykh/database";
import type { Baglam } from "@ykh/database";

export const COOKIE = "ykh_oturum";

export async function kullanici(): Promise<Kullanici | null> {
  const c = await cookies();
  return oturumCoz(c.get(COOKIE)?.value);
}

export async function baglam(): Promise<Baglam> {
  return baglamdan(await kullanici());
}

export async function oturumCerezi(jeton: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, jeton, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function cerezSil(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

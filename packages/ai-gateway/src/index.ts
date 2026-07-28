export * from "./sema.ts";
export * from "./prompt.ts";
export * from "./gateway.ts";
export * from "./istemci.ts";

/** Üretimde kullanılan pinli model. `latest` yasak (brief §3). */
export const MODEL_SNAPSHOT = process.env.YKH_MODEL_SNAPSHOT ?? "claude-opus-5-20260101";

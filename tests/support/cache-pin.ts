/**
 * Source-text contract for "this response is not cached": the route either writes a no-store Cache-Control itself or goes
 * through the central response helpers (src/security/responses.ts). Tests pin the intent, not one spelling of it.
 */
export const CACHE_PIN =
  /Cache-Control["']?\s*:\s*["'](?:private, )?no-store|CACHE\.(?:PRIVATE|PRIVATE_STRICT|NONE)\b|\b(?:privateJson|strictPrivateJson|noStoreJson)\(|withCachePolicy\(/;

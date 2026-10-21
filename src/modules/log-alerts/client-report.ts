import { z } from "zod";
import { redactAlertText, safeAlertPath } from "./redaction";

/** Exactly the eight legacy diagnostic categories, without raw stacks,
 * user-supplied browser strings, filenames or signed object URLs.
 */
export const legacyClientErrorTypes = [
 "JS_ERROR", "UNHANDLED_REJECTION", "CONSOLE_ERROR", "API_FAILURE",
 "RESOURCE_LOAD_FAILURE", "AUTH_FAILURE", "VIDEO_PLAYBACK_FAILURE",
 "FILE_UPLOAD_FAILURE",
] as const;
export type LegacyClientErrorType = typeof legacyClientErrorTypes[number];


export const browserErrorSchema = z.object({
  message: z.string().trim().min(1).max(300).optional(),
  kind: z.enum(["render", "stale_chunk"]).optional(),
  // Legacy unknown enum strings fall back to JS_ERROR. Objects/numbers
  // still fail validation; arbitrary categories never enter operator logs.
  type: z.preprocess((raw) => typeof raw === "string"
    ? normalizeLegacyClientErrorType(raw) : raw,
    z.enum(legacyClientErrorTypes)).optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  buildVersion: z.string().regex(/^[a-zA-Z0-9_.-]{1,64}$/).optional(),
  viewport: z.string().regex(/^\d{2,5}x\d{2,5}$/).optional(),
  endpoint: z.string().trim().max(255).optional(),
  name: z.string().trim().max(80).optional(),
  component: z.string().trim().max(80).optional(),
  event: z.string().trim().max(64).optional(),
  path: z.string().trim().max(255).optional(),
  // GR-05 uses an 8-character reference; retain UUID support for existing clients.
  requestId: z.string().regex(/^(?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f-]{27,})$/i).optional(),
}).strict().refine((value) => Boolean(value.message || value.kind || value.type), {
  message: "An error message or category is required.",
}).transform(value=>({
  ...value,
  // Always discard raw uploaded names, signed URLs, request tokens and
  // sensitive paths BEFORE logging. The route logs only these parsed fields.
  ...(value.message ? {message:redactAlertText(value.message)} : {}),
  ...(value.path ? {path:safeAlertPath(value.path)} : {}),
  ...(value.endpoint ? {endpoint:safeAlertPath(value.endpoint)} : {}),
}));

const hits = new Map<string, { count: number; at: number }>();

/** Untrusted component/name fields may be personal data; allow only known categories. */
export function safeBrowserComponent(input: { component?: string; name?: string }): string {
  const candidates = new Set([
    "root", "global", "page", "widget", "render", "stale_chunk",
    "typeerror", "referenceerror", "chunkloaderror", "syntaxerror", "rangeerror",
  ]);
  const component = input.component?.trim().toLowerCase();
  const name = input.name?.trim().toLowerCase();
  return component && candidates.has(component) ? component :
    name && candidates.has(name) ? name : "browser";
}

/** Per-pod protection. Cloud Run replicas still require a shared ingress
 * token bucket; client-side 60-second fingerprint dedupe is complementary.
 * Keep oldest eviction bounded, never reset every actor's rate budget when
 * one pod exceeds 5,000 identities (legacy's process-map clear-all flaw).
 */
export function acceptClientErrorRate(key: string, now: number, max = 20): boolean {
  if (!Number.isFinite(now) || !Number.isInteger(max) || max < 1) return false;
  if (!hits.has(key) && hits.size >= 5000) {
    for (const [id, value] of hits) {
      if (now - value.at >= 60_000) hits.delete(id);
    }
    if (hits.size >= 5000) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
  }
  const item = hits.get(key);
  if (!item || now - item.at >= 60_000) {
    hits.delete(key);
    hits.set(key, { count: 1, at: now });
    return true;
  }
  if (item.count >= max) return false;
  item.count++;
  return true;
}

/** The new safe report limit is 300 characters (legacy 1000): rejecting
 * oversize payloads rather than silently truncating them protects log storage.
 * Browser and component names are intentionally category-only, and raw
 * 3000-character stacks are never collected. The deploy identity should be
 * set from the trusted server environment, not a forged browser field.
 */
export const CLIENT_ERROR_SAFE_MESSAGE_MAX = 300;

export function browserErrorOperatorCategory(input: {
  type?: LegacyClientErrorType; kind?: "render" | "stale_chunk";
}): string {
  if (input.type) return input.type.replaceAll("_", " ");
  return input.kind === "stale_chunk" ? "RESOURCE LOAD FAILURE" : "JS ERROR";
}

/** Upgrade adapter for the legacy 8-category reporter. Unrecognized types
 * are treated as JS errors, never trusted as arbitrary log severity/metadata.
 */
export function normalizeLegacyClientErrorType(type:unknown):LegacyClientErrorType {
 return typeof type==="string" &&
  (legacyClientErrorTypes as readonly string[]).includes(type)
  ? type as LegacyClientErrorType:"JS_ERROR";
}

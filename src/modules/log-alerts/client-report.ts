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
  type: z.enum(legacyClientErrorTypes).optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  buildVersion: z.string().regex(/^[a-zA-Z0-9_.-]{1,64}$/).optional(),
  viewport: z.string().regex(/^\\d{2,5}x\\d{2,5}$/).optional(),
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

/** Per-pod protection; the ingress also needs a source IP limit for global enforcement. */
export function acceptClientErrorRate(key: string, now: number, max = 10): boolean {
  if (hits.size > 5000) hits.clear();
  const item = hits.get(key);
  if (!item || now - item.at >= 60_000) {
    hits.set(key, { count: 1, at: now });
    return true;
  }
  if (item.count >= max) return false;
  item.count++;
  return true;
}

/** Upgrade adapter for the legacy 8-category reporter. Unrecognized types
 * are treated as JS errors, never trusted as arbitrary log severity/metadata.
 */
export function normalizeLegacyClientErrorType(type:unknown):LegacyClientErrorType {
 return typeof type==="string" &&
  (legacyClientErrorTypes as readonly string[]).includes(type)
  ? type as LegacyClientErrorType:"JS_ERROR";
}

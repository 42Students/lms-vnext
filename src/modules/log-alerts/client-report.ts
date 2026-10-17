import { z } from "zod";

export const browserErrorSchema = z.object({
  message: z.string().trim().min(1).max(300).optional(),
  kind: z.enum(["render", "stale_chunk"]).optional(),
  name: z.string().trim().max(80).optional(),
  component: z.string().trim().max(80).optional(),
  event: z.string().trim().max(64).optional(),
  path: z.string().trim().max(255).optional(),
  // GR-05 uses an 8-character reference; retain UUID support for existing clients.
  requestId: z.string().regex(/^(?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f-]{27,})$/i).optional(),
}).strict().refine((value) => Boolean(value.message || value.kind), {
  message: "An error message or category is required.",
});

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

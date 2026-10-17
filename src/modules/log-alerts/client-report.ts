import { z } from "zod";

export const browserErrorSchema = z.object({
  message: z.string().trim().min(1).max(300),
  name: z.string().trim().max(80).optional(),
  component: z.string().trim().max(80).optional(),
  event: z.string().trim().max(64).optional(),
  path: z.string().trim().max(255).optional(),
  requestId: z.string().uuid().optional(),
}).strict();

const hits = new Map<string, { count: number; at: number }>();

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

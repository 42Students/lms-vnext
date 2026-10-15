import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** Only signed, expiring tokens are accepted. Never use an unverified email query parameter. */
const payloadSchema = z.object({
  version: z.literal(1),
  recipientKey: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.number().int().positive(),
}).strict();
export type UnsubscribeClaim = z.infer<typeof payloadSchema>;

function mac(payload: string, key: string): Buffer {
  if (key.length < 32) throw new Error("UNSUBSCRIBE_KEY_UNAVAILABLE");
  return createHmac("sha256", key).update("campaign-unsubscribe-v1:").update(payload).digest();
}
export function issueUnsubscribeToken(claim: UnsubscribeClaim, key: string): string {
  const payload = Buffer.from(JSON.stringify(payloadSchema.parse(claim))).toString("base64url");
  return `${payload}.${mac(payload, key).toString("base64url")}`;
}
export function verifyUnsubscribeToken(token: string, key: string, nowMs: number): UnsubscribeClaim | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1] || token.length > 2048) return null;
  // Reject noncanonical base64url spellings; token parsing must be unambiguous.
  if (!/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;
  try {
    const expected = mac(parts[0], key);
    const given = Buffer.from(parts[1], "base64url");
    if (given.toString("base64url") !== parts[1]) return null;
    const payload = Buffer.from(parts[0], "base64url");
    if (payload.toString("base64url") !== parts[0]) return null;
    if (given.length !== expected.length || !timingSafeEqual(expected, given)) return null;
    const claim = payloadSchema.parse(JSON.parse(payload.toString("utf8")));
    return claim.expiresAt > nowMs ? claim : null;
  } catch {
    return null;
  }
}
/** GET only checks validity; an explicit same-origin POST must persist the opt-out. */
export function unsubscribeConfirmation(token: string, key: string, nowMs: number) {
  return { canConfirm: verifyUnsubscribeToken(token, key, nowMs) !== null, willUnsubscribeOnView: false as const };
}

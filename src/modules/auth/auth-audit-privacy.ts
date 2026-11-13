import { createHmac } from "node:crypto";

import { env } from "@/config/env";
/**
 * Use purpose-separated keyed identifiers for sensitive authentication events.
 * Plain SHA-256 of IPv4 addresses is enumerable; never log a reversible IP
 * dictionary key. AUTH_SECRET is mandatory for working sign-in. If it has not
 * been configured, logging still has to fail safely without exposing input.
 *
 * 96 bits fits the registered identity_auth_attempts.ip_tag varchar(24).
 */
export function authAuditTag(
  purpose: "ip" | "user",
  value: string,
  secret: string | undefined = env.AUTH_SECRET,
): string {
  if (!secret || secret.length < 32) return "unavailable";
  return createHmac("sha256", secret)
    .update(`42lms:auth-audit:${purpose}:v1\u0000`)
    .update(value)
    .digest("hex")
    .slice(0, 24);
}

export type AuthAuditScalar = string | number | boolean | null;

/**
 * Callers cannot add arbitrary contact, OTP, headers, tokens or raw request
 * data to the permanent audit stream. Only explicit bounded security fields
 * survive; a DB user ID is replaced with a keyed correlation tag.
 */
export function safeAuthAuditFields(
  fields: Record<string, AuthAuditScalar>,
  secret: string | undefined = env.AUTH_SECRET,
): Record<string, AuthAuditScalar> {
  const output: Record<string, AuthAuditScalar> = {};
  for (const [key, value] of Object.entries(fields)) {
    switch (key) {
      case "channel":
        if (value === "PHONE" || value === "EMAIL") output.channel = value;
        break;
      case "requiresSecondFactor":
      case "isSuperAdmin":
      case "accepted":
        if (typeof value === "boolean") output[key] = value;
        break;
      case "durationMs":
      case "elapsedMs":
        if (typeof value === "number" && Number.isFinite(value) &&
            value >= 0 && value <= 3_600_000) output[key] = value;
        break;
      case "requests":
        if (typeof value === "number" && Number.isSafeInteger(value) &&
            value >= 0 && value <= 1_000_000) output.requests = value;
        break;
      case "userId":
        if (typeof value === "string" && value.length > 0 && value.length <= 128) {
          const tag = authAuditTag("user", value, secret);
          if (tag !== "unavailable") output.userTag = tag;
        }
        break;
      default:
        // Unknown metadata can contain PII or secrets; deny by default.
        break;
    }
  }
  return output;
}

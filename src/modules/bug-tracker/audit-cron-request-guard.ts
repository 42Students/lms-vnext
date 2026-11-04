import { timingSafeEqual } from "node:crypto";

export type AuditCronRequestRejection = "UNAUTHORIZED" | "INVALID_REQUEST";

/**
 * Dedicated machine-only audit inbox cron boundary.
 *
 * A browser session, Origin header or a guessed/short scheduler token cannot
 * trigger a privileged importer. The secret is supplied by deployment, not by
 * the caller's URL. This check must happen BEFORE any inbox or DB access.
 *
 * The intentionally retained GET verb is the existing GCP Cloud Scheduler
 * contract; it is not a cacheable/status endpoint.
 */
export function auditCronRequestRejection(
  request: Request,
  secret: string | undefined,
): AuditCronRequestRejection | null {
  if (request.headers.has("origin")) return "UNAUTHORIZED";

  // Keep the configured credential exact: silently trimming spaces causes
  // two different deployed secrets to be treated as the same credential.
  if (!secret || secret !== secret.trim()) return "UNAUTHORIZED";
  const expected = Buffer.from(secret, "utf8");
  if (expected.length < 32 || expected.length > 256) return "UNAUTHORIZED";

  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || Buffer.byteLength(auth, "utf8") > 263) {
    return "UNAUTHORIZED";
  }
  const provided = Buffer.from(auth.slice("Bearer ".length), "utf8");
  if (provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)) return "UNAUTHORIZED";

  // The scheduled job selects no tenant, target, repository or parameters.
  if (new URL(request.url).search || request.body !== null) return "INVALID_REQUEST";
  const contentLength = request.headers.get("content-length");
  if ((contentLength !== null && contentLength !== "0") ||
      request.headers.has("transfer-encoding")) return "INVALID_REQUEST";
  return null;
}

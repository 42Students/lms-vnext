import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getCurrentDeviceSession } from "./current-session";
import { SessionAuthenticationError } from "./session";

// Privileged grants require fresh OTP-backed sign-in, not a five-day-old
// device cookie. Platform Super Admin login already requires independent
// SMS and email OTP verification.
export const PRIVILEGED_AUTH_MAX_AGE_SECONDS = 10 * 60;

export function isRecentDeviceAuthentication(
  createdAt: Date | string | null | undefined,
  now: Date,
  maxAgeSeconds = PRIVILEGED_AUTH_MAX_AGE_SECONDS,
) {
  if (!createdAt || !Number.isFinite(maxAgeSeconds) ||
      maxAgeSeconds <= 0 || maxAgeSeconds > 1800) return false;
  const created = new Date(createdAt).getTime();
  const age = now.getTime() - created;
  // Reject malformed timestamps, times in the future and stale sessions.
  return Number.isFinite(created) && Number.isFinite(age) &&
    age >= 0 && age < maxAgeSeconds * 1000;
}

/**
 * Requires a live, newly OTP-authenticated first-party device session.
 * Client-provided timestamps, membership-role cookies or a bare userId never
 * prove authentication freshness. E2E impersonation is not a privileged
 * authentication factor even on a development host.
 */
export async function requireRecentDeviceAuthentication(expectedUserId: string, maxAgeSeconds = PRIVILEGED_AUTH_MAX_AGE_SECONDS) {
  // A valid recent device belonging to user B must NEVER authorize a request
  // context resolved as user A (e.g. E2E impersonation on a development host,
  // misbound cookies, or future identity/context regressions).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(expectedUserId)) {
    throw new SessionAuthenticationError("SESSION_INVALID");
  }
  const session = await getCurrentDeviceSession();
  if (session.userId !== expectedUserId) {
    throw new SessionAuthenticationError("SESSION_INVALID");
  }
  const result = await getDb().execute(sql`
    SELECT created_at
      FROM identity_device_sessions
     WHERE id = ${session.sessionId}::uuid
       AND user_id = ${session.userId}::uuid
       AND revoked_at IS NULL
       AND expires_at > clock_timestamp()
     LIMIT 1
  `);
  const row = result.rows[0] as { created_at?: Date | string } | undefined;
  if (!isRecentDeviceAuthentication(row?.created_at, new Date(), maxAgeSeconds)) {
    throw new SessionAuthenticationError("RECENT_SIGN_IN_REQUIRED");
  }
  return session;
}

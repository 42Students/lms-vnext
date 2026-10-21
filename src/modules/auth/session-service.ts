import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getAuthConfig } from "./config";
import { generateToken, sessionDigest } from "./crypto";

/**
 * First-party device sessions. The browser keeps an opaque 256-bit token; the
 * database keeps only its keyed digest, so a database leak cannot be replayed
 * as a login. Revocation is per device (or all devices for a user).
 */

export type SessionMeta = {
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceName?: string | null;
};

export type ResolvedSession = {
  sessionId: string;
  userId: string;
  identityUid: string;
  platformStatus: "ACTIVE" | "DISABLED";
};

export type SessionLookupFailure =
  | "SESSION_INVALID"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED";

function rowsOf(result: unknown): Record<string, unknown>[] {
  return (result as { rows: Record<string, unknown>[] }).rows ?? [];
}

function clip(value: string | null | undefined, max: number) {
  return value ? value.slice(0, max) : null;
}

export async function createSession(
  userId: string,
  meta: SessionMeta = {},
) {
  const config = getAuthConfig();
  const token = generateToken();
  const digest = sessionDigest(config.secret, token);

  await getDb().execute(sql`
    INSERT INTO identity_device_sessions (
      user_id, credential_digest, device_name, user_agent, ip_address,
      created_at, last_seen_at, expires_at
    ) VALUES (
      ${userId}, ${digest}, ${clip(meta.deviceName, 255)},
      ${clip(meta.userAgent, 512)}, ${clip(meta.ipAddress, 64)},
      now(), now(), now() + make_interval(secs => ${config.sessionMaxAgeSeconds})
    )
  `);

  return { token, maxAgeSeconds: config.sessionMaxAgeSeconds };
}

export async function resolveSession(
  token: string,
): Promise<
  | { ok: true; session: ResolvedSession }
  | { ok: false; reason: SessionLookupFailure }
> {
  const digest = sessionDigest(getAuthConfig().secret, token);

  const result = await getDb().execute(sql`
    SELECT s.id AS session_id, s.user_id, u.identity_uid,
           u.platform_status,
           (s.revoked_at IS NOT NULL) AS revoked,
           (s.expires_at <= now()) AS expired
    FROM identity_device_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.credential_digest = ${digest}
    LIMIT 1
  `);
  const row = rowsOf(result)[0];

  if (!row) return { ok: false, reason: "SESSION_INVALID" };
  if (row.revoked) return { ok: false, reason: "SESSION_REVOKED" };
  if (row.expired) return { ok: false, reason: "SESSION_EXPIRED" };
  // Account disablement is an immediate session revocation, not merely a UI role gate.
  if (row.platform_status !== "ACTIVE") return { ok: false, reason: "SESSION_REVOKED" };

  // Throttled: at most one write per minute per session.
  await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET last_seen_at = now()
    WHERE id = ${row.session_id as string}
      AND revoked_at IS NULL
      AND expires_at > now()
      AND last_seen_at < now() - interval '60 seconds'
  `);

  return {
    ok: true,
    session: {
      sessionId: row.session_id as string,
      userId: row.user_id as string,
      identityUid: row.identity_uid as string,
      platformStatus: row.platform_status as "ACTIVE" | "DISABLED",
    },
  };
}

export async function revokeSessionByToken(token: string) {
  const digest = sessionDigest(getAuthConfig().secret, token);
  await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET revoked_at = now(),
        revoked_by_user_id = user_id,
        revocation_reason = 'LOGOUT'
    WHERE credential_digest = ${digest} AND revoked_at IS NULL
  `);
}

/** Revokes every live session of a user (suspension, password-like events). */
export async function revokeAllSessionsForUser(
  userId: string,
  actorUserId: string,
  reason: string,
) {
  await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET revoked_at = now(),
        revoked_by_user_id = ${actorUserId},
        revocation_reason = ${reason}
    WHERE user_id = ${userId} AND revoked_at IS NULL
      AND expires_at > now()
  `);
}

/** Bounded own-device listing. Caller must derive userId from the verified session.
 * Defaults to first 25, not an unbounded historical account scan.
 */
export async function listActiveSessions(
  userId: string,
  page = 1,
  pageSize = 25,
) {
  const safePage = Number.isSafeInteger(page) ? Math.min(1000,Math.max(1,page)) : 1;
  const safeSize = Number.isSafeInteger(pageSize) ? Math.min(100,Math.max(1,pageSize)) : 25;
  const result = await getDb().execute(sql`
    SELECT id, device_name, user_agent, created_at, last_seen_at, expires_at
    FROM identity_device_sessions
    WHERE user_id = ${userId} AND revoked_at IS NULL AND expires_at > now()
    ORDER BY last_seen_at DESC, id DESC
    LIMIT ${safeSize} OFFSET ${(safePage-1)*safeSize}
  `);
  return rowsOf(result);
}

/** Revocation history is metadata-only: credential digests never leave the DB. */
export async function listOwnSessionRevocationHistory(
  userId: string, page = 1, pageSize = 25,
) {
  const safePage = Number.isSafeInteger(page) ? Math.min(1000,Math.max(1,page)) : 1;
  const safeSize = Number.isSafeInteger(pageSize) ? Math.min(100,Math.max(1,pageSize)) : 25;
  const result = await getDb().execute(sql`
    SELECT id, device_name, created_at, last_seen_at, revoked_at, revocation_reason
    FROM identity_device_sessions
    WHERE user_id = ${userId} AND revoked_at IS NOT NULL
    ORDER BY revoked_at DESC, id DESC
    LIMIT ${safeSize} OFFSET ${(safePage-1)*safeSize}
  `);
  return rowsOf(result);
}

/** Last-seen is a minute-throttled approximation, not an exact activity event. */
export function sessionLastSeenLabel(lastSeen: Date | string | null): string {
  if (!lastSeen) return "Last active time unavailable";
  const when = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  return Number.isNaN(when.getTime()) ? "Last active time unavailable" :
    "Last active around " + new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
    }).format(when);
}

/** Explicit own-account revoke-all, including this device. This differs from
 * the 'sign out everywhere else' action exposed on the existing devices route.
 * A caller MUST derive userId from a verified device session, not request JSON.
 */
export async function revokeAllOwnSessions(userId: string): Promise<number> {
  const result = await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET revoked_at = now(),
        revoked_by_user_id = ${userId},
        revocation_reason = 'USER_SIGNED_OUT_ALL_DEVICES'
    WHERE user_id = ${userId} AND revoked_at IS NULL
      AND expires_at > now()
    RETURNING id
  `);
  return rowsOf(result).length;
}

/** Ends every live session of the user except the one making the request. */
export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string,
) {
  const result = await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET revoked_at = now(),
        revoked_by_user_id = ${userId},
        revocation_reason = 'USER_SIGNED_OUT_OTHER_DEVICES'
    WHERE user_id = ${userId}
      AND id <> ${currentSessionId}
      AND revoked_at IS NULL
      AND expires_at > now()
    RETURNING id
  `);
  return rowsOf(result).length;
}

/**
 * Revokes one device session. Ownership is the persisted user id of the
 * session itself; there is no role-name bypass (the legacy LMS treated any
 * FACULTY as an admin here, which was a permission bug).
 */
export async function revokeOwnSession(
  sessionId: string,
  userId: string,
) {
  const result = await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET revoked_at = now(),
        revoked_by_user_id = ${userId},
        revocation_reason = 'USER_REVOKED_DEVICE'
    WHERE id = ${sessionId} AND user_id = ${userId} AND revoked_at IS NULL
      AND expires_at > now()
    RETURNING id
  `);
  return rowsOf(result).length === 1;
}

import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getAuthConfig } from "./config";
import { generateToken, sessionDigest } from "./crypto";
import { recordSecurityEvent } from "@/security/audit-store";

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

/** Sliding inactivity caps; the five-day cookie is only an absolute limit.
 * Super Admin identities get the shorter policy across every workspace, not
 * just after choosing their administrative role.
 */
export const SESSION_IDLE_TIMEOUT_SECONDS = 8 * 60 * 60;
export const SUPER_ADMIN_IDLE_TIMEOUT_SECONDS = 30 * 60;
export const SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS = 8 * 60 * 60;

/** Reuse one DB-clock, persisted-role policy in authentication and listings.
 * Do not rely on cookie time, client timestamps or request-provided roles.
 */
const idleSeconds = sql`CASE WHEN EXISTS (
  SELECT 1 FROM system_roles sr
   WHERE sr.user_id = s.user_id AND sr.role = 'SUPER_ADMIN'
) THEN ${SUPER_ADMIN_IDLE_TIMEOUT_SECONDS}::integer
  ELSE ${SESSION_IDLE_TIMEOUT_SECONDS}::integer END`;

/** Even continual activity cannot extend a privileged account past eight
 * hours from original OTP issuance. Persisted role, not the selected cookie,
 * determines the shorter absolute upper bound.
 */
const privilegedLifetimeAllowed = sql`(
  NOT EXISTS (
    SELECT 1 FROM system_roles privileged
     WHERE privileged.user_id = s.user_id AND privileged.role = 'SUPER_ADMIN'
  )
  OR (s.created_at <= clock_timestamp()
    AND s.created_at > clock_timestamp() -
      make_interval(secs => ${SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS}))
)`;

export async function createSession(
  userId: string,
  meta: SessionMeta = {},
) {
  const config = getAuthConfig();
  const token = generateToken();
  const digest = sessionDigest(config.secret, token);

  const deviceName = clip(meta.deviceName, 255);
  const userAgent = clip(meta.userAgent, 512);
  // One statement: the prior-session counts come from the snapshot before the insert, so the new row never
  // counts as its own "known device". A user with earlier sessions and none from this device name + agent
  // is signing in from a new device (SEC-02-011).
  const result = await getDb().execute(sql`
    WITH prior AS (
      SELECT count(*)::int AS total,
             count(*) FILTER (
               WHERE device_name IS NOT DISTINCT FROM ${deviceName}
                 AND user_agent IS NOT DISTINCT FROM ${userAgent}
             )::int AS same_device
        FROM identity_device_sessions
       WHERE user_id = ${userId}
    ), created AS (
      INSERT INTO identity_device_sessions (
        user_id, credential_digest, device_name, user_agent, ip_address,
        created_at, last_seen_at, expires_at
      ) VALUES (
        ${userId}, ${digest}, ${deviceName},
        ${userAgent}, ${clip(meta.ipAddress, 64)},
        now(), now(), now() + make_interval(secs => ${config.sessionMaxAgeSeconds})
      )
      RETURNING 1
    )
    SELECT prior.total, prior.same_device FROM prior, created
  `);
  const prior = (result as { rows?: Array<{ total?: unknown; same_device?: unknown }> } | undefined)?.rows?.[0];
  if (Number(prior?.total ?? 0) > 0 && Number(prior?.same_device ?? 0) === 0) {
    // Never the raw address or agent string: a short device label only.
    recordSecurityEvent({ event: "auth.new_device", outcome: "ok", userId, detail: { deviceName: deviceName ?? "unknown" } });
  }

  return { token, maxAgeSeconds: config.sessionMaxAgeSeconds };
}

/** Digests under which a presented token may be stored: current secret first, then the one being rotated out. */
function sessionDigestCandidates(token: string): string[] {
  const config = getAuthConfig();
  const digests = [sessionDigest(config.secret, token)];
  if (config.previousSecret) digests.push(sessionDigest(config.previousSecret, token));
  return digests;
}

export async function resolveSession(
  token: string,
): Promise<
  | { ok: true; session: ResolvedSession }
  | { ok: false; reason: SessionLookupFailure }
> {
  const digests = sessionDigestCandidates(token);

  // One atomic, row-locking eligibility write. The old SELECT-then-heartbeat
  // sequence could return ok:true even when a concurrent logout committed
  // between the SELECT and the conditional UPDATE (which then updated zero
  // rows). An UPDATE rechecks its predicates after waiting for a revoker's
  // row lock, so no revoked/expired session can win that race.
  //
  // The user SHARE lock also serializes account disablement against the
  // active identity read. We only advance the visible heartbeat once/minute.
  const eligible = await getDb().execute(sql`
    WITH active_user AS MATERIALIZED (
      SELECT u.id, u.identity_uid, u.platform_status
      FROM users u
      JOIN identity_device_sessions candidate ON candidate.user_id = u.id
      WHERE candidate.credential_digest IN ${digests}
        AND u.platform_status = 'ACTIVE'
      FOR SHARE OF u
    )
    UPDATE identity_device_sessions AS s
    SET last_seen_at = CASE
      WHEN s.last_seen_at < clock_timestamp() - interval '60 seconds'
      THEN clock_timestamp()
      ELSE s.last_seen_at
    END
    FROM active_user AS u
    WHERE s.user_id = u.id
      AND s.credential_digest IN ${digests}
      AND s.revoked_at IS NULL
      AND s.expires_at > clock_timestamp()
      AND s.last_seen_at <= clock_timestamp()
      AND s.last_seen_at > clock_timestamp() -
        make_interval(secs => (${idleSeconds}))
      AND ${privilegedLifetimeAllowed}
    RETURNING s.id AS session_id, s.user_id,
              u.identity_uid, u.platform_status
  `);
  const active = rowsOf(eligible)[0];
  if (active) return {
    ok: true,
    session: {
      sessionId: active["session_id"] as string,
      userId: active["user_id"] as string,
      identityUid: active["identity_uid"] as string,
      platformStatus: "ACTIVE",
    },
  };

  // Classification only; this query never issues an authorization grant.
  // A missing, revoked or expired token must have the same fail-closed
  // behavior even if the row changes after the UPDATE above.
  const classified = await getDb().execute(sql`
    SELECT (s.revoked_at IS NOT NULL) AS revoked,
           (s.expires_at <= clock_timestamp()
             OR s.last_seen_at > clock_timestamp()
             OR s.last_seen_at <= clock_timestamp() -
               make_interval(secs => (${idleSeconds}))
             OR NOT ${privilegedLifetimeAllowed}) AS expired,
           u.platform_status
      FROM identity_device_sessions s
      JOIN users u ON u.id = s.user_id
     WHERE s.credential_digest IN ${digests}
     LIMIT 1
  `);
  const row = rowsOf(classified)[0];
  if (!row) return { ok: false, reason: "SESSION_INVALID" };
  if (row["revoked"] || row["platform_status"] !== "ACTIVE")
    return { ok: false, reason: "SESSION_REVOKED" };
  if (row["expired"]) return { ok: false, reason: "SESSION_EXPIRED" };
  // If eligibility changed between statements, never turn that into success.
  return { ok: false, reason: "SESSION_INVALID" };
}

export async function revokeSessionByToken(token: string) {
  const digests = sessionDigestCandidates(token);
  await getDb().execute(sql`
    UPDATE identity_device_sessions
    SET revoked_at = now(),
        revoked_by_user_id = user_id,
        revocation_reason = 'LOGOUT'
    WHERE credential_digest IN ${digests} AND revoked_at IS NULL
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
    FROM identity_device_sessions AS s
    WHERE s.user_id = ${userId} AND s.revoked_at IS NULL
      AND s.expires_at > clock_timestamp()
      AND s.last_seen_at <= clock_timestamp()
      AND s.last_seen_at > clock_timestamp() -
        make_interval(secs => (${idleSeconds}))
      AND ${privilegedLifetimeAllowed}
    ORDER BY s.last_seen_at DESC, s.id DESC
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

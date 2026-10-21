import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { SESSION_MAX_AGE_SECONDS as MAX_AGE } from "@/modules/auth/config";
import {
  resolveSession,
  revokeAllSessionsForUser,
} from "@/modules/auth/session-service";

export const SESSION_COOKIE_NAME = "lms_session";
export const MEMBERSHIP_COOKIE_NAME = "lms_membership";
/** Which single role of the active membership the person is working in (one workspace at a time). */
export const ROLE_COOKIE_NAME = "lms_role";
export const SESSION_MAX_AGE_SECONDS = MAX_AGE;

export class SessionAuthenticationError extends Error {
  constructor(
    public readonly code:
      | "SESSION_MISSING"
      | "SESSION_INVALID"
      | "SESSION_EXPIRED"
      | "SESSION_REVOKED"
      | "RECENT_SIGN_IN_REQUIRED",
  ) {
    super(code);
    this.name = "SessionAuthenticationError";
  }
}

/** Explicit client recovery guidance; never suggests a retired refresh JWT. */
export type SessionRecovery = {
  action: "SIGN_IN" | "STEP_UP";
  clearStoredSession: boolean;
  retryRefresh: false;
  redirectHref: string;
  message: string;
};

export function sessionRecoveryFor(
  code: SessionAuthenticationError["code"],
): SessionRecovery {
  if (code === "RECENT_SIGN_IN_REQUIRED") {
    return { action: "STEP_UP", clearStoredSession: false, retryRefresh: false,
      redirectHref:"/login?reason=step-up",message:"Please sign in again to continue this sensitive action."};
  }
  // Missing, invalid, expired, and revoked sessions require fresh sign-in.
  return { action: "SIGN_IN", clearStoredSession: true, retryRefresh: false,
    redirectHref:"/login?reason=session-expired",
    message: code==="SESSION_EXPIRED"?"Your session has expired. Sign in to continue.":
      code==="SESSION_REVOKED"?"You were signed out of this device. Sign in again to continue.":
      "Please sign in to continue."};
}

/**
 * Verifies the opaque `lms_session` token against the device-session table.
 * Fails closed: an unknown, expired or revoked token, a disabled user, or any
 * database error all reject; there is no cached or bypass path.
 */
export async function verifyIdentitySessionCookie(sessionCookie: string) {
  const resolved = await resolveSession(sessionCookie);

  if (!resolved.ok) {
    throw new SessionAuthenticationError(resolved.reason);
  }

  if (resolved.session.platformStatus !== "ACTIVE") {
    throw new SessionAuthenticationError("SESSION_REVOKED");
  }

  return {
    uid: resolved.session.identityUid,
    sessionId: resolved.session.sessionId,
  };
}

/** Ends every session of the person with this identity UID. */
export async function revokeIdentitySessions(
  identityUid: string,
  reason = "REVOKED_BY_SYSTEM",
) {
  const result = await getDb().execute(sql`
    SELECT id FROM users WHERE identity_uid = ${identityUid} LIMIT 1
  `);
  const userId = result.rows[0]?.id as string | undefined;

  if (userId) {
    await revokeAllSessionsForUser(userId, userId, reason);
  }
}

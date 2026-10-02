import "server-only";

import { getIdentityAdminAuth } from "./firebase-admin";

export const SESSION_COOKIE_NAME = "lms_session";
export const MEMBERSHIP_COOKIE_NAME = "lms_membership";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;
const RECENT_SIGN_IN_SECONDS = 5 * 60;

export class SessionAuthenticationError extends Error {
  constructor(
    public readonly code:
      | "SESSION_MISSING"
      | "SESSION_INVALID"
      | "RECENT_SIGN_IN_REQUIRED",
  ) {
    super(code);
    this.name = "SessionAuthenticationError";
  }
}

export async function createIdentitySessionCookie(idToken: string) {
  const auth = getIdentityAdminAuth();

  const decoded = await auth.verifyIdToken(idToken);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (
    typeof decoded.auth_time !== "number" ||
    nowSeconds - decoded.auth_time > RECENT_SIGN_IN_SECONDS
  ) {
    throw new SessionAuthenticationError("RECENT_SIGN_IN_REQUIRED");
  }

  return auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function verifyIdentitySessionCookie(sessionCookie: string) {
  try {
    return await getIdentityAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
  } catch {
    throw new SessionAuthenticationError("SESSION_INVALID");
  }
}

export async function revokeIdentitySessions(identityUid: string) {
  await getIdentityAdminAuth().revokeRefreshTokens(identityUid);
}

import "server-only";

import { cookies } from "next/headers";
import {
  MEMBERSHIP_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SessionAuthenticationError,
  verifyIdentitySessionCookie,
} from "./session";
import { resolveRequestContext } from "@/modules/identity/context-service";
import {
  ADMIN_SCOPE_COOKIE_NAME,
  decodeAdminScopeCookie,
} from "./admin-scope";

export async function getCurrentRequestContext() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    throw new SessionAuthenticationError("SESSION_MISSING");
  }

  const identity = await verifyIdentitySessionCookie(sessionCookie);
  const activeMembershipId =
    cookieStore.get(MEMBERSHIP_COOKIE_NAME)?.value ?? null;
  const adminScope = decodeAdminScopeCookie(
    cookieStore.get(ADMIN_SCOPE_COOKIE_NAME)?.value,
  );

  return resolveRequestContext({
    identityUid: identity.uid,
    activeMembershipId,
    adminScope,
  });
}

export async function getCurrentIdentityUid() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    throw new SessionAuthenticationError("SESSION_MISSING");
  }

  const identity = await verifyIdentitySessionCookie(sessionCookie);
  return identity.uid;
}

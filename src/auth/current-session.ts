import "server-only";

import { cookies } from "next/headers";
import { resolveSession } from "@/modules/auth/session-service";
import {
  SESSION_COOKIE_NAME,
  SessionAuthenticationError,
} from "./session";

/**
 * The first-party device session behind this request (not the dev/e2e test
 * identity). Used by account-security screens, which are about real sessions.
 */
export async function getCurrentDeviceSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) throw new SessionAuthenticationError("SESSION_MISSING");

  const resolved = await resolveSession(token);
  if (!resolved.ok) throw new SessionAuthenticationError(resolved.reason);
  if (resolved.session.platformStatus !== "ACTIVE") {
    throw new SessionAuthenticationError("SESSION_REVOKED");
  }

  return resolved.session;
}

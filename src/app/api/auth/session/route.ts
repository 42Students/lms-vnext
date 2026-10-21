import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import {
  E2E_IDENTITY_COOKIE_NAME,
  E2E_SECRET_COOKIE_NAME,
} from "@/auth/e2e-identity";
import {
  MEMBERSHIP_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/auth/session";
import { logError } from "@/observability/logger";
import { revokeSessionByToken } from "@/modules/auth/session-service";

export const runtime = "nodejs";

/** Logout: revokes this device's server-side session and clears cookies. */
export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  // Opaque first-party sessions do not use legacy refresh tokens. On expiry,
  // the client must return to sign-in rather than retrying a refresh endpoint.
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  let revokeFailed = false;
  if (token) {
    try {
      await revokeSessionByToken(token);
    } catch (error) {
      // Clearing local cookies is necessary on a shared device but cannot
      // guarantee remote revocation when persistence is unavailable. Return
      // a retryable failure, never a false "signed out everywhere" success.
      logError("auth.logout_revoke_failed", error);
      revokeFailed = true;
    }
  }

  const response = NextResponse.json(
    revokeFailed
      ? { ok: false, error: "LOGOUT_REVOKE_FAILED", message: "Could not complete sign-out. Please retry.", retryable: true, reloginRequired: true }
      : { ok: true, message: "Logged out", reloginRequired: true },
    { status: revokeFailed ? 503 : 200 },
  );
  // PUB-auth-public-38: clear per-person drafts, cached reminders and quiz state
  // across all tabs on this shared device, not merely session cookies.
  // Deliberately exclude the `cookies` Clear-Site-Data directive: explicitly
  // expired first-party auth cookies below are the only intended cookie edits.
  response.headers.set("Clear-Site-Data", '"storage"');
  response.headers.set("Cache-Control", "no-store");
  const secure = process.env.NODE_ENV === "production";

  for (const name of [
    SESSION_COOKIE_NAME,
    MEMBERSHIP_COOKIE_NAME,
    ADMIN_SCOPE_COOKIE_NAME,
    E2E_IDENTITY_COOKIE_NAME,
    E2E_SECRET_COOKIE_NAME,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

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

  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      await revokeSessionByToken(token);
    } catch (error) {
      // The cookie is still cleared below; the token also expires on its own.
      logError("auth.logout_revoke_failed", error);
    }
  }

  const response = NextResponse.json({ ok: true });
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import { MEMBERSHIP_COOKIE_NAME, ROLE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/auth/session";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {privateAuthResponse} from "@/modules/auth/private-response";
import { revokeOwnSession } from "@/modules/auth/session-service";
import { route } from "@/security/route";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ sessionId: string }> };

/**
 * Legacy mapping: DELETE /api/v1/auth/sessions/{jti} now uses
 * DELETE /api/auth/devices/{sessionId}. The opaque current user's UUID
 * device session is required; legacy JTI is never an authorization key.
 * Bulk "revoke-sessions" maps to /api/auth/devices (other sessions only);
 * platform admin revocation uses the separately permissioned college route.
 * Legacy 'Session revoked' copy is returned alongside the vNext {ok:true}
 * receipt without changing owner-only not-found semantics.
 *
 * Revokes one of the caller's own devices. Ownership is decided by the stored
 * user id of the session row, never by role (the legacy LMS let any FACULTY
 * revoke anyone's session).
 */
async function handleDELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return privateAuthResponse(NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 }));
  }

  try {
    const session = await getCurrentDeviceSession();
    const sessionId = z.string().uuid().parse((await params).sessionId);

    if (!(await revokeOwnSession(sessionId, session.userId))) {
      return privateAuthResponse(NextResponse.json({ error: "SESSION_NOT_FOUND", message: "Session not found" }, { status: 404 }));
    }

    const response=privateAuthResponse(privateJson({ ok: true, message: "Session revoked" }));
    // A user may revoke this very device from its security page. A revoked
    // session cannot remain selected in the browser's college/role UI.
    if (sessionId === session.sessionId) {
      for (const name of [
        SESSION_COOKIE_NAME, MEMBERSHIP_COOKIE_NAME,
        ROLE_COOKIE_NAME, ADMIN_SCOPE_COOKIE_NAME,
      ]) {
        response.cookies.set(name, "", {
          httpOnly: true, secure: process.env.NODE_ENV === "production",
          sameSite: "lax", path: "/", maxAge: 0,
        });
      }
      response.headers.set("Clear-Site-Data", '"storage"');
    }
    return response;
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}
export const DELETE = route(
  { auth: "public", publicReason: "Sign-in, recovery and session endpoints run before or independently of a session; each handler enforces its own challenge, device or session-state checks.", csrf: false, csrfExemptReason: "The handler applies its own origin and challenge checks, unchanged by this wrapper.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);

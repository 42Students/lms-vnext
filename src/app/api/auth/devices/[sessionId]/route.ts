import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { ADMIN_SCOPE_COOKIE_NAME } from "@/auth/admin-scope";
import { MEMBERSHIP_COOKIE_NAME, ROLE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/auth/session";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {privateAuthResponse} from "@/modules/auth/private-response";
import { revokeOwnSession } from "@/modules/auth/session-service";

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
export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return privateAuthResponse(NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 }));
  }

  try {
    const session = await getCurrentDeviceSession();
    const sessionId = z.string().uuid().parse((await params).sessionId);

    if (!(await revokeOwnSession(sessionId, session.userId))) {
      return privateAuthResponse(NextResponse.json({ error: "SESSION_NOT_FOUND", message: "Session not found" }, { status: 404 }));
    }

    const response=privateAuthResponse(NextResponse.json({ ok: true, message: "Session revoked" }, { headers: { "Cache-Control": "private, no-store" } }));
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

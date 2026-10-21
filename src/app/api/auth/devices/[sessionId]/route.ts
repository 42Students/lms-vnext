import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDeviceSession } from "@/auth/current-session";
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

    return privateAuthResponse(NextResponse.json({ ok: true, message: "Session revoked" }, { headers: { "Cache-Control": "private, no-store" } }));
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}

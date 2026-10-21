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

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return privateAuthResponse(apiErrorResponse(error));
  }
}

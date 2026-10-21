import { NextResponse } from "next/server";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { previewRecruiterInvite } from "@/modules/placements/tpo-recruiter-invite-service";

/** Legacy PublicRecruiterInviteController route crosswalk (all five methods):
 * GET /api/v1/public/recruiter-invite/{token} => GET here, now {invite}.
 * POST /{token}/send-code => POST /api/public/recruiter-invite/{token}/send-code,
 * sending OTP only to the verified persisted work email (CODE_SENT envelope).
 * POST /{token}/accept => POST /api/public/recruiter-invite/{token}/accept,
 * with a verified one-time code and membership-scoped acceptance result.
 * POST /{token}/not-hiring => same named vNext child path (NOT_HIRING).
 * POST /{token}/unsubscribe => same named child path (UNSUBSCRIBED).
 * Token failures remain quiet 404 INVITE_INVALID; authenticated web sessions
 * and idempotent invite state deliberately replace legacy account assumptions.
 */
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const { token } = await params;
    return NextResponse.json({
      invite: await previewRecruiterInvite(token),
    });
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}

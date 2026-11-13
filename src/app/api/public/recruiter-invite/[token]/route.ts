import { NextResponse } from "next/server";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { previewRecruiterInvite } from "@/modules/placements/tpo-recruiter-invite-service";
import { isRecruiterInviteTokenShape } from "@/modules/placements/tpo-recruiter-invite-policy";
import { route } from "@/security/route";

import { featureReady } from "@/config/features";
import { CACHE } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
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
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": CACHE.PRIVATE, "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } as const;
type RouteContext = { params: Promise<{ token: string }> };

async function handleGET(_request: Request, { params }: RouteContext) {
  if (!featureReady("tpoApi")) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503, headers: privateHeaders });
  }
  try {
    const { token } = await params;
    if (!isRecruiterInviteTokenShape(token)) {
      return NextResponse.json({ error: "INVITE_INVALID" }, { status: 404, headers: privateHeaders });
    }
    return NextResponse.json({
      invite: await previewRecruiterInvite(token),
    }, { headers: privateHeaders });
  } catch (error) {
    const response = tpoRecruiterInviteApiErrorResponse(error);
    for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
    return response;
  }
}
export const GET = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

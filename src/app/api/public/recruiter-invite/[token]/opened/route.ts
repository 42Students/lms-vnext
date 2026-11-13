import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { validateNoArgumentRecruiterInvitePost } from "@/modules/placements/public-recruiter-invite-request";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { recordRecruiterInviteFirstOpen } from "@/modules/placements/tpo-recruiter-invite-service";
import { route } from "@/security/route";

import { featureReady } from "@/config/features";
import { CACHE } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": CACHE.PRIVATE, "Referrer-Policy": "no-referrer" } as const;
type RouteContext = { params: Promise<{ token: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  if (!featureReady("tpoApi")) {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503, headers: noStore });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers: noStore });
  }
  const validated = await validateNoArgumentRecruiterInvitePost(request);
  if (validated !== "OK") {
    return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: validated === "TOO_LARGE" ? 413 : 400, headers: noStore,
    });
  }
  try {
    const { token } = await params;
    return NextResponse.json(await recordRecruiterInviteFirstOpen(token), { headers: noStore });
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);

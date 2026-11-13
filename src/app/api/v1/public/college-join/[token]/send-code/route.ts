import { NextResponse } from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import { legacyCollegeJoinRequest } from "@/modules/placements/public-join/legacy-request-adapter";
import { POST as canonicalPOST } from "@/app/api/public/college-join/send-code/route";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
import { RATE_LIMITS } from "@/security/limits";
export const runtime = "nodejs";

/** Compat POST endpoint. Legacy link tokens must still pass the new
 * explicit expiry, scope and OTP policy; old indefinite links fail closed. */
async function handlePOST(
  request: Request, { params }: { params: Promise<{ token: string }> },
) {
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  const { token } = await params;
  const adapted = await legacyCollegeJoinRequest(request, token);
  if (!adapted) return NextResponse.json(
    { error: "LINK_INVALID" }, { status: 400, headers: { "Cache-Control": CACHE.NONE } },
  );
  return canonicalPOST(adapted);
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: RATE_LIMITS.BULK },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);

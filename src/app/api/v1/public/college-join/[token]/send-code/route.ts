import { NextResponse } from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import { legacyCollegeJoinRequest } from "@/modules/placements/public-join/legacy-request-adapter";
import { POST as canonicalPOST } from "@/app/api/public/college-join/send-code/route";
import { secured } from "@/security/secure-handler";

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
    { error: "LINK_INVALID" }, { status: 400, headers: { "Cache-Control": "no-store" } },
  );
  return canonicalPOST(adapted);
}
export const POST = secured(handlePOST, { csrf: "enforce" });

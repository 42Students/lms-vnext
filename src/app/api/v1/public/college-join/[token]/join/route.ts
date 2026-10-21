import { NextResponse } from "next/server";
import { legacyCollegeJoinRequest } from "@/modules/placements/public-join/legacy-request-adapter";
import { POST as canonicalPOST } from "@/app/api/public/college-join/join/route";

export const runtime = "nodejs";

/** Compat POST endpoint. Legacy link tokens must still pass the new
 * explicit expiry, scope and OTP policy; old indefinite links fail closed. */
export async function POST(
  request: Request, { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const adapted = await legacyCollegeJoinRequest(request, token);
  if (!adapted) return NextResponse.json(
    { error: "LINK_INVALID" }, { status: 400, headers: { "Cache-Control": "no-store" } },
  );
  return canonicalPOST(adapted);
}

import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { validateNoArgumentRecruiterInvitePost } from "@/modules/placements/public-recruiter-invite-request";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { recordRecruiterInviteFirstOpen } from "@/modules/placements/tpo-recruiter-invite-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } as const;
type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (process.env["DB09_TPO_API_READY"] !== "DB09_VERIFIED") {
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

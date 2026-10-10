import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { markRecruiterInviteNotHiring } from "@/modules/placements/tpo-recruiter-invite-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const { token } = await params;
    return NextResponse.json(await markRecruiterInviteNotHiring(token));
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}

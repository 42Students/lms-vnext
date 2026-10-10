import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { issueTpoRecruiterInvite } from "@/modules/placements/tpo-recruiter-invite-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ leadId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body.sendEmail === true) {
      return NextResponse.json(
        { error: "TPO_RECRUITER_INVITE_DELIVERY_PENDING" },
        { status: 503 },
      );
    }
    const context = await getCurrentRequestContext();
    const { leadId } = await params;
    const collegeId = typeof body.collegeId === "string" ? body.collegeId : "";
    const invite = await issueTpoRecruiterInvite(
      context,
      collegeId,
      leadId,
    );
    return NextResponse.json({ invite });
  } catch (error) {
    return tpoRecruiterInviteApiErrorResponse(error);
  }
}

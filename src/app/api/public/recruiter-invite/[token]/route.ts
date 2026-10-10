import { NextResponse } from "next/server";
import { tpoRecruiterInviteApiErrorResponse } from "@/lib/tpo-recruiter-invite-api-error";
import { previewRecruiterInvite } from "@/modules/placements/tpo-recruiter-invite-service";

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

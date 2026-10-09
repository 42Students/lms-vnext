import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { finishTpoFollowup } from "@/modules/placements/tpo-crm-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ followupId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { followupId } = await params;
    const body = await request.json();
    const followup = await finishTpoFollowup(
      context, body.collegeId, followupId,
    );
    return NextResponse.json({ followup });
  } catch (error) {
    return tpoCrmApiErrorResponse(error);
  }
}

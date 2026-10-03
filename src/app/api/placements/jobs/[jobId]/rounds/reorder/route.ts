import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { reorderPlacementRounds } from "@/modules/placements/round-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const rounds = await reorderPlacementRounds(
      context,
      jobId,
      await request.json(),
    );
    return NextResponse.json({ rounds });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

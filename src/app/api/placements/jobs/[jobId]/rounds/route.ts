import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementRound,
  listPlacementRounds,
} from "@/modules/placements/round-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const rounds = await listPlacementRounds(
      context,
      jobId,
    );
    return NextResponse.json({ rounds });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

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
    const round = await createPlacementRound(
      context,
      jobId,
      await request.json(),
    );
    return NextResponse.json(
      { round },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

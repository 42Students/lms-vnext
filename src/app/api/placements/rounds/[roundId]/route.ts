import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getPlacementRound,
  updatePlacementRound,
} from "@/modules/placements/round-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ roundId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { roundId } = await params;
    const round = await getPlacementRound(
      context,
      roundId,
    );
    return NextResponse.json({ round });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
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
    const { roundId } = await params;
    const round = await updatePlacementRound(
      context,
      roundId,
      await request.json(),
    );
    return NextResponse.json({ round });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

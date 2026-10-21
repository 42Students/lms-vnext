import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listPlacementRoundResults,
  stagePlacementRoundResult,
} from "@/modules/placements/result-service";

// HTTP status mapping (legacy mapped every IllegalArgumentException to 404):
// invalid round ID / invalid outcome input -> 400 via ZodError;
// missing round -> 404 via PLACEMENT_ROUND_NOT_FOUND;
// wrong tenant -> 403 via AuthorizationError; invalid Origin -> 403.
// State conflicts remain 409 through the shared apiErrorResponse.
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
    const results =
      await listPlacementRoundResults(
        context,
        roundId,
      );
    return NextResponse.json({ results });
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
    const { roundId } = await params;
    const result =
      await stagePlacementRoundResult(
        context,
        roundId,
        await request.json(),
      );
    return NextResponse.json(
      { result },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

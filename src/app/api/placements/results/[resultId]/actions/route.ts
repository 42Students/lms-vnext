import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { applyPlacementRoundResultInputSchema } from "@/modules/placements/validation";
import { applyPlacementRoundResult } from "@/modules/placements/result-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ resultId: string }>;
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
    const { resultId } = await params;
    applyPlacementRoundResultInputSchema.parse(
      await request.json(),
    );
    const result =
      await applyPlacementRoundResult(
        context,
        resultId,
      );
    return NextResponse.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

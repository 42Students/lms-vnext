import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { recordPlacementJoiningOutcome } from "@/modules/placements/offer-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ offerId: string }>;
};

export async function PUT(
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
    const context =
      await getCurrentRequestContext();
    const { offerId } = await params;
    const joining =
      await recordPlacementJoiningOutcome(
        context,
        offerId,
        await request.json(),
      );
    return NextResponse.json({ joining });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

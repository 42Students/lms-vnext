import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { actOnPlacementOffer } from "@/modules/placements/offer-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ offerId: string }>;
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
    const context =
      await getCurrentRequestContext();
    const { offerId } = await params;
    const offer =
      await actOnPlacementOffer(
        context,
        offerId,
        await request.json(),
      );
    return NextResponse.json({ offer });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

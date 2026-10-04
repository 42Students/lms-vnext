import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { actOnPlacementRequest } from "@/modules/placements/request-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ requestId: string }>;
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
    const { requestId } = await params;
    const placementRequest =
      await actOnPlacementRequest(
        context,
        requestId,
        await request.json(),
      );
    return NextResponse.json({
      request: placementRequest,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

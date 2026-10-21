import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createPlacementRequest } from "@/modules/placements/request-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  try {
    const context =
      await getCurrentRequestContext();
    const placementRequest =
      await createPlacementRequest(
        context,
        await request.json(),
      );
    return NextResponse.json(
      placementRequest,
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

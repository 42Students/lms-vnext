import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { decidePlacementScreening } from "@/modules/placements/screening-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
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
    const { applicationId } = await params;
    const screening =
      await decidePlacementScreening(
        context,
        applicationId,
        await request.json(),
      );
    return NextResponse.json({ screening });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

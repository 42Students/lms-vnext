import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getPlacementScreening } from "@/modules/placements/screening-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { applicationId } = await params;
    const screening =
      await getPlacementScreening(
        context,
        applicationId,
      );
    return NextResponse.json({ screening });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getPlacementApplication } from "@/modules/placements/application-service";

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
    const application =
      await getPlacementApplication(
        context,
        applicationId,
      );
    return NextResponse.json({ application });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

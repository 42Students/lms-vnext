import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const driveDay = await getPlacementDriveDay(
      context,
      jobId,
    );
    return NextResponse.json({ driveDay });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

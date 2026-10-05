import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { markDriveDayAttendance } from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ roundId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { roundId } = await params;
    const body = await request.json();
    const attendance =
      await markDriveDayAttendance(
        context,
        roundId,
        body,
      );
    return NextResponse.json({ attendance });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

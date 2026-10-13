import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
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
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { roundId } = await params;

    // Same shape the handler used before (request.json()); the service validates it.
    let body: Awaited<ReturnType<Request["json"]>>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

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

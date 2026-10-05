import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  assignDriveDayCoordinator,
  listDriveDayCoordinators,
} from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { jobId } = await params;
    const coordinators =
      await listDriveDayCoordinators(
        context,
        jobId,
      );
    return NextResponse.json({
      coordinators,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { jobId } = await params;
    const body = await request.json();
    const assignment =
      await assignDriveDayCoordinator(
        context,
        jobId,
        body,
      );
    return NextResponse.json(
      { assignment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

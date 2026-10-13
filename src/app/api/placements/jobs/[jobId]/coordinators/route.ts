import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
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
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { jobId } = await params;

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

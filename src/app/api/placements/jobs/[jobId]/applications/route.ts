import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  applyToPlacementJob,
  listPlacementJobApplications,
} from "@/modules/placements/application-service";

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
    const applications =
      await listPlacementJobApplications(
        context,
        jobId,
      );
    return NextResponse.json({ applications });
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
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const application = await applyToPlacementJob(
      context,
      jobId,
      await request.json(),
    );
    return NextResponse.json(
      { application },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getPlacementEvaluationConfig,
  replacePlacementEvaluationConfig,
} from "@/modules/placements/evaluation-config-service";

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
    const config =
      await getPlacementEvaluationConfig(
        context,
        jobId,
      );
    return NextResponse.json({ config });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
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
    const config =
      await replacePlacementEvaluationConfig(
        context,
        jobId,
        await request.json(),
      );
    return NextResponse.json({ config });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

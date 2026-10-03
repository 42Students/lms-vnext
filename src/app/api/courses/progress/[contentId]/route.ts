import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getLearnerContentProgress,
  saveLearnerContentProgress,
} from "@/modules/courses/progress-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { contentId } = await params;
    const url = new URL(request.url);
    const progress =
      await getLearnerContentProgress(
        context,
        contentId,
        url.searchParams.get("deliveryId") ??
          "",
      );

    return NextResponse.json({ progress });
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
    const context =
      await getCurrentRequestContext();
    const { contentId } = await params;
    const body = await request.json();
    const progress =
      await saveLearnerContentProgress(
        context,
        contentId,
        body,
      );

    return NextResponse.json({ progress });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  transitionAcademicPeriod,
  updateAcademicPeriod,
} from "@/modules/academics/period-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ periodId: string }>;
};

export async function PATCH(
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
    const { periodId } = await params;
    const body = await request.json();

    const period =
      body &&
      typeof body === "object" &&
      "action" in body
        ? await transitionAcademicPeriod(
            context,
            periodId,
            body,
          )
        : await updateAcademicPeriod(
            context,
            periodId,
            body,
          );

    return NextResponse.json({ period });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

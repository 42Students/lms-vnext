import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  transitionCohort,
  updateCohort,
} from "@/modules/academics/cohort-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ cohortId: string }>;
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
    const { cohortId } = await params;
    const body = await request.json();

    const cohort =
      body &&
      typeof body === "object" &&
      "action" in body
        ? await transitionCohort(
            context,
            cohortId,
            body,
          )
        : await updateCohort(
            context,
            cohortId,
            body,
          );

    return NextResponse.json({ cohort });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

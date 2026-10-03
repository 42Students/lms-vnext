import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  transitionSectionEnrollment,
} from "@/modules/academics/roster-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    sectionEnrollmentId: string;
  }>;
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
    const { sectionEnrollmentId } = await params;
    const body = await request.json();
    const enrollment =
      await transitionSectionEnrollment(
        context,
        sectionEnrollmentId,
        body,
      );

    return NextResponse.json({ enrollment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  transitionLearnerProgramEnrollment,
} from "@/modules/academics/enrollment-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ enrollmentId: string }>;
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
    const { enrollmentId } = await params;
    const body = await request.json();
    const enrollment =
      await transitionLearnerProgramEnrollment(
        context,
        enrollmentId,
        body,
      );

    return NextResponse.json({ enrollment });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

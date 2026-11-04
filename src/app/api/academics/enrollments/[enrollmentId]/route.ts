import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
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
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body = parsedBody.value;
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

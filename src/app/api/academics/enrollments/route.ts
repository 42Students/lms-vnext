import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createLearnerProgramEnrollment,
  listLearnerProgramEnrollments,
} from "@/modules/academics/enrollment-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const enrollments =
      await listLearnerProgramEnrollments(
        context,
        url.searchParams.get("programId") ?? "",
        url.searchParams.get("cohortId"),
      );

    return NextResponse.json({ enrollments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const enrollment =
      await createLearnerProgramEnrollment(
        context,
        body,
      );

    return NextResponse.json(
      { enrollment },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

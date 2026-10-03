import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  assignLearnerToSection,
  listLearnerSectionHistory,
  listSectionRoster,
} from "@/modules/academics/roster-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const sectionId =
      url.searchParams.get("sectionId");
    const learnerEnrollmentId =
      url.searchParams.get("learnerEnrollmentId");

    if (sectionId) {
      const enrollments = await listSectionRoster(
        context,
        sectionId,
      );
      return NextResponse.json({ enrollments });
    }

    const enrollments =
      await listLearnerSectionHistory(
        context,
        learnerEnrollmentId ?? "",
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
      await assignLearnerToSection(
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

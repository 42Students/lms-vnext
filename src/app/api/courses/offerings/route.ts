import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourseOffering,
  listCourseOfferings,
} from "@/modules/courses/offering-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const offerings = await listCourseOfferings(
      context,
      url.searchParams.get("cohortId") ?? "",
      url.searchParams.get("academicPeriodId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );

    return NextResponse.json({ offerings });
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
    const offering = await createCourseOffering(
      context,
      body,
    );

    return NextResponse.json(
      { offering },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

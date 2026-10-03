import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createCourse,
  listCourses,
} from "@/modules/courses/course-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const courses = await listCourses(
      context,
      url.searchParams.get("collegeId") ?? "",
      url.searchParams.get("departmentId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );

    return NextResponse.json({ courses });
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
    const course = await createCourse(
      context,
      body,
    );

    return NextResponse.json(
      { course },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

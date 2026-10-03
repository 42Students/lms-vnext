import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  getLearnerCourseWorkspace,
} from "@/modules/courses/learner-course-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const url = new URL(request.url);
    const workspace =
      await getLearnerCourseWorkspace(
        context,
        url.searchParams.get("deliveryId") ??
          "",
      );

    return NextResponse.json({ workspace });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

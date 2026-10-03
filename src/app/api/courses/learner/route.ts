import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context =
      await getCurrentRequestContext();
    const courses =
      await listLearnerCourseDeliveries(
        context,
      );

    return NextResponse.json({ courses });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { CourseImageError, getCourseImageStatus } from "@/modules/courses/course-image-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const context = await getCurrentRequestContext();
    const { courseId } = await params;
    return NextResponse.json({
      image: await getCourseImageStatus(context, courseId),
    }, { headers });
  } catch (error) {
    if (error instanceof CourseImageError) return NextResponse.json({
      error: error.code,
    }, { status: error.status, headers });
    return apiErrorResponse(error);
  }
}

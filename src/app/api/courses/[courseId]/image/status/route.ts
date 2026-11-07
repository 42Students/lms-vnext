import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { CourseImageError, getCourseImageStatus } from "@/modules/courses/course-image-service";
import { route } from "@/security/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ courseId: string }> };

async function handleGET(_request: Request, { params }: RouteContext) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
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
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Cookie");
    return response;
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { apiErrorResponse } from "@/lib/api-error";
import { CourseImageError, completeCourseImage } from "@/modules/courses/course-image-service";

export const runtime = "nodejs";
const schema = z.object({ receiptId: z.string().uuid() }).strict();
type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers });
  }
  try {
    const body = await readBoundedJsonRequest(request, 2048);
    if (!body.ok) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers });
    }
    const parsed = schema.safeParse(body.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers });
    }
    const context = await getCurrentRequestContext();
    const { courseId } = await params;
    const image = await completeCourseImage(context, courseId, parsed.data.receiptId);
    return NextResponse.json({ image }, { headers });
  } catch (error) {
    if (error instanceof CourseImageError) return NextResponse.json({
      error: error.code,
    }, { status: error.status, headers });
    return apiErrorResponse(error);
  }
}

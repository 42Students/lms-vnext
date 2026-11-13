import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { apiErrorResponse } from "@/lib/api-error";
import { CourseImageError, completeCourseImage } from "@/modules/courses/course-image-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
const schema = z.object({ receiptId: z.string().uuid() }).strict();
type RouteContext = { params: Promise<{ courseId: string }> };

async function handlePOST(request: Request, { params }: RouteContext) {
  const headers = { "Cache-Control": CACHE.PRIVATE, Vary: "Cookie" };
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
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Cookie");
    return response;
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);

import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { readBoundedJsonRequest } from "@/lib/bounded-json-request";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CourseImageError, grantCourseImage, readCourseImage, removeCourseImage,
} from "@/modules/courses/course-image-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ courseId: string }> };
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };

function imageError(error: unknown) {
  if (error instanceof CourseImageError) {
    return NextResponse.json({ error: error.code }, {
      status: error.status, headers: privateHeaders,
    });
  }
  const response = apiErrorResponse(error);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({
    error: "INVALID_ORIGIN",
  }, { status: 403, headers: privateHeaders });
  try {
    const context = await getCurrentRequestContext();
    const { courseId } = await params;
    const body = await readBoundedJsonRequest(request, 4096);
    if (!body.ok) return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: 400, headers: privateHeaders,
    });
    const data: unknown = body.value;
    const grant = await grantCourseImage(context, courseId, data);
    return NextResponse.json({ grant }, { status: 201, headers: privateHeaders });
  } catch (error) { return imageError(error); }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { courseId } = await params;
    const image = await readCourseImage(context, courseId);
    return new Response(image.body, {
      headers: {
        ...privateHeaders,
        "Content-Type": image.contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) { return imageError(error); }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({
    error: "INVALID_ORIGIN",
  }, { status: 403, headers: privateHeaders });
  try {
    const context = await getCurrentRequestContext();
    const { courseId } = await params;
    return NextResponse.json(await removeCourseImage(context, courseId), {
      headers: privateHeaders,
    });
  } catch (error) { return imageError(error); }
}

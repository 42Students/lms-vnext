import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { ActivityServiceError } from "@/modules/activity/errors";
import {
  createStaffNotification,
  listScopedAdminNotificationPage,
} from "@/modules/activity/notification-service";

export const runtime = "nodejs";

const knownInputErrors = new Set([
  "scheduledAt must be a future date",
  "scheduledAt must be yyyy-MM-dd HH:mm:ss",
  "Assessment URL must use http or https",
  "Course not found for slug",
  "classId or courseId required",
  "Title is required",
  "Title cannot exceed 200 characters",
]);

function respondError(error: unknown) {
  if (error instanceof ActivityServiceError && error.code === "NOTIFICATION_SCOPE_MISMATCH") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: "INVALID_REQUEST",
      fieldErrors: Object.fromEntries(error.issues
        .filter((issue) => issue.path.length > 0)
        .map((issue) => [issue.path.join("."), issue.message])),
    }, { status: 400 });
  }
  if (error instanceof Error && knownInputErrors.has(error.message)) {
    return NextResponse.json({ error: "INVALID_REQUEST", message: error.message }, { status: 400 });
  }
  return apiErrorResponse(error);
}

/** Authorised Super Admin browse; never reuse this route for personal inbox. */
export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const params = new URL(request.url).searchParams;
    const result = await listScopedAdminNotificationPage(context, {
      organizationId: params.get("organizationId") || undefined,
      collegeId: params.get("collegeId") || undefined,
      classId: params.get("classId") || undefined,
      courseId: params.get("courseId") || undefined,
      deliveryStatus: (params.get("deliveryStatus") || undefined) as
        "SENT" | "SCHEDULED" | "PROCESSING" | "FAILED" | "DELETED" | undefined,
      pageNo: params.has("pageNo") ? Number(params.get("pageNo")) : undefined,
      pageSize: params.has("pageSize") ? Number(params.get("pageSize")) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return respondError(error);
  }
}

/** Staff composition; service checks assignment and stored course/class. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const result = await createStaffNotification(context, await request.json());
    return NextResponse.json({
      ...result,
      message: result.deliveryStatus === "SCHEDULED"
        ? "Notification scheduled successfully"
        : "Notification created successfully",
    }, { status: 200 });
  } catch (error) {
    return respondError(error);
  }
}

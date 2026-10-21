import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { ActivityServiceError } from "@/modules/activity/errors";
import {
  deleteStaffNotification,
  updateStaffNotification,
} from "@/modules/activity/notification-service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ eventId: string }> };

function respondError(error: unknown) {
  if (error instanceof ActivityServiceError) {
    if (error.code === "NOTIFICATION_SCOPE_MISMATCH") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (error.code === "NOTIFICATION_NOT_FOUND") {
      return NextResponse.json({
        error: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found",
      }, { status: 404 });
    }
  }
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: "INVALID_REQUEST",
      fieldErrors: Object.fromEntries(error.issues
        .filter((issue) => issue.path.length > 0)
        .map((issue) => [issue.path.join("."), issue.message])),
    }, { status: 400 });
  }
  if (error instanceof Error && [
    "scheduledAt must be a future date",
    "scheduledAt must be yyyy-MM-dd HH:mm:ss",
    "Assessment URL must use http or https",
    "Course not found for slug",
    "Title is required",
    "Title cannot exceed 200 characters",
  ].includes(error.message)) {
    return NextResponse.json({ error: "INVALID_REQUEST", message: error.message }, { status: 400 });
  }
  return apiErrorResponse(error);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { eventId } = await params;
    const result = await updateStaffNotification(context, eventId, await request.json());
    return NextResponse.json({
      ...result,
      message: "Notification updated successfully",
    });
  } catch (error) {
    return respondError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { eventId } = await params;
    const result = await deleteStaffNotification(context, eventId);
    return NextResponse.json({
      ...result,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return respondError(error);
  }
}

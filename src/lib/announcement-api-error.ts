import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { AnnouncementError } from "@/modules/announcements/errors";

export function announcementApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (error instanceof AnnouncementError) {
    const status =
      error.code === "FORBIDDEN" ? 403 :
      error.code === "TARGET_NOT_FOUND" ||
      error.code === "ANNOUNCEMENT_NOT_FOUND" ? 404 :
      error.code === "STALE_VERSION" ? 409 : 400;
    return NextResponse.json({ error: error.code }, { status });
  }
  return apiErrorResponse(error);
}

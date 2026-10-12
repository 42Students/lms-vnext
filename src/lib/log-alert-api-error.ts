import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { LogAlertsAdminError } from "@/modules/log-alerts/admin-service";

export function logAlertApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (error instanceof LogAlertsAdminError) {
    return NextResponse.json(
      { error: error.code },
      { status: error.code === "FORBIDDEN" ? 403 : 404 },
    );
  }
  return apiErrorResponse(error);
}

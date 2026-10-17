import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { friendlyApiError } from "@/lib/friendly-error";
import { createRequestId } from "@/lib/request-id";
import { LogAlertsAdminError } from "@/modules/log-alerts/admin-service";

export function logAlertApiError(error: unknown) {
  if (!(error instanceof ZodError) && !(error instanceof LogAlertsAdminError)) {
    return apiErrorResponse(error);
  }
  const status = error instanceof ZodError ? 400 :
    error.code === "FORBIDDEN" ? 403 : 404;
  const code = error instanceof ZodError ? "INVALID_REQUEST" : error.code;
  const requestId = createRequestId();
  return NextResponse.json(
    { error: code, message: friendlyApiError({ status, code }), requestId },
    { status, headers: { "x-request-id": requestId, "Cache-Control": "no-store" } },
  );
}

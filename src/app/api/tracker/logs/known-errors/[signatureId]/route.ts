import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { logAlertApiError } from "@/lib/log-alert-api-error";
import { mutateKnownErrorForAdmin } from "@/modules/log-alerts/admin-service";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ signatureId: string }> },
) {
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_LOG_ALERTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { signatureId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    const item = await mutateKnownErrorForAdmin(context, signatureId, body);
    return NextResponse.json({ item });
  } catch (error) {
    return logAlertApiError(error);
  }
}

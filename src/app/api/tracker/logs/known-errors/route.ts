import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { logAlertApiError } from "@/lib/log-alert-api-error";
import { listKnownErrorsForAdmin } from "@/modules/log-alerts/admin-service";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({error:"DB10_LOG_ALERTS_MIGRATIONS_PENDING",message:"Known Errors are unavailable until the log-alert schema is verified."},
      {status:503,headers:{"Cache-Control":"private, no-store","Retry-After":"60"}});
  }
  try {
    const context = await getCurrentRequestContext();
    const params = new URL(request.url).searchParams;
    const items = await listKnownErrorsForAdmin(context, {
      environment: params.get("environment") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    return NextResponse.json({ items }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return logAlertApiError(error);
  }
}

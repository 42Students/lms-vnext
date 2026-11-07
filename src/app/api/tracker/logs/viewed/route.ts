import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { logAlertApiError } from "@/lib/log-alert-api-error";
import {
  markLogAlertsViewed,
  readLogAlertAdminState,
} from "@/modules/log-alerts/admin-service";
import { logAlertsRuntimeEnabled } from "@/modules/log-alerts/readiness";
import { route } from "@/security/route";

export const runtime = "nodejs";

async function handleGET() {
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_LOG_ALERTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  try {
    const context = await getCurrentRequestContext();
    return NextResponse.json(await readLogAlertAdminState(context), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return logAlertApiError(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  () => handleGET(),
);

async function handlePOST(request: Request) {
  if (!logAlertsRuntimeEnabled()) {
    return NextResponse.json({ error: "DB10_LOG_ALERTS_MIGRATIONS_PENDING" }, { status: 503 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const adminLastViewedAt = await markLogAlertsViewed(context);
    return NextResponse.json({ adminLastViewedAt });
  } catch (error) {
    return logAlertApiError(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);

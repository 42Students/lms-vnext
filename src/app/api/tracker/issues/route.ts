import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json(
      { error: "DB10_TRACKER_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const params = new URL(request.url).searchParams;
    const page = await listBugTrackerIssuesForAdmin(context, {
      status: params.get("status") ?? undefined,
      severity: params.get("severity") ?? undefined,
      environment: params.get("environment") ?? undefined,
      q: params.get("q") ?? undefined,
      sort: params.get("sort") ?? undefined,
      beforeCreatedAt: params.get("beforeCreatedAt") ?? undefined,
      beforeId: params.get("beforeId") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    return bugTrackerApiError(error);
  }
}

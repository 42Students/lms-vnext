import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { listBugTrackerIssuesForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { parseTrackerIssuesApiQuery } from "@/modules/bug-tracker/issues-api-query";

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
    const query = parseTrackerIssuesApiQuery(new URL(request.url).searchParams);
    if (!query) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    const page = await listBugTrackerIssuesForAdmin(context, query);
    return NextResponse.json(page, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return bugTrackerApiError(error);
  }
}

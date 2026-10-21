import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { retestBugTrackerIssueForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json(
      { error: "DB10_TRACKER_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { publicId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }
    const issue = await retestBugTrackerIssueForAdmin(context, publicId, body);
    // The persisted issue is the post-transition result, including its new
    // status and version. Keep the envelope for vNext clients, but expose an
    // explicit refresh token rather than a stale pre-action snapshot.
    return NextResponse.json({ issue, status:issue.status, version:issue.version },
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return bugTrackerApiError(error);
  }
}

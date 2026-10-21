import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { updateBugTrackerWorkflowForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

export const runtime = "nodejs";

export async function PATCH(
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
    const issue = await updateBugTrackerWorkflowForAdmin(
      context, publicId, body,
    );
    // Return the persisted post-CAS workflow snapshot, never the request body.
    // UI must replace stale status/version with this receipt and re-fetch
    // related activities; no intermediate cached envelope may be reused.
    return NextResponse.json({ issue, currentVersion: issue.version }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return bugTrackerApiError(error);
  }
}

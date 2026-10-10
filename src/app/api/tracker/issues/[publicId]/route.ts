import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { getBugTrackerIssueForAdmin } from "@/modules/bug-tracker/admin-service";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json(
      { error: "DB10_TRACKER_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const { publicId } = await params;
    const issue = await getBugTrackerIssueForAdmin(context, publicId);
    return NextResponse.json(issue);
  } catch (error) {
    return bugTrackerApiError(error);
  }
}

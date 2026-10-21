import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { getCurrentRequestContext } from "@/auth/request-context";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { bugTrackerApiError } from "@/lib/bug-tracker-api-error";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { createBugTrackerIssueForAdmin } from "@/modules/bug-tracker/report-service";

export const runtime = "nodejs";

/**
 * Authenticated reporter intake, separate from manager-only list, workflow
 * and issue administration. Intentionally NOT the legacy unauthenticated
 * /api/v1/public/bug-tracker manager API. Platform-account identity and
 * same-origin request checks are mandatory; reporter sessions remain held.
 */
export async function POST(request: Request) {
  if (!trackerAdminRuntimeEnabled()) {
    return NextResponse.json({error:"DB10_TRACKER_MIGRATIONS_PENDING"},{status:503});
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  }
  try {
    const body = await readBoundedJsonBody(request,12_288);
    if(body.kind!=="OK")return NextResponse.json({error:"INVALID_REQUEST"},
      {status:body.kind==="TOO_LARGE"?413:400});
    const context = await getCurrentRequestContext();
    const issue = await createBugTrackerIssueForAdmin(context, body.value);
    return NextResponse.json({issue},{status:201,
      headers:{"cache-control":"private, no-store"}});
  } catch(error) {
    return bugTrackerApiError(error);
  }
}

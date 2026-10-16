import { NextResponse } from "next/server";
import { legacyDriveStatusActionSchema } from "@/modules/placements/tpo-drive-publish-entry-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  closePlacementJob,
} from "@/modules/placements/job-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};


export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const { action } = legacyDriveStatusActionSchema.parse(await request.json());
    // PUBLISH is intentionally not accepted: workspace preflight and a
    // human confirmation are mandatory. The old direct status route was
    // weaker than the TPO lifecycle service and silently skipped its checks.
    if (action !== "CLOSE") throw new Error("INVALID_STATUS_ACTION");
    const job = await closePlacementJob(context, jobId);
    return NextResponse.json(job);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

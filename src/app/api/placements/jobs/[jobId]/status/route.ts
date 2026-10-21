import { NextResponse } from "next/server";
import { z } from "zod";
import { legacyDriveStatusActionSchema } from "@/modules/placements/tpo-drive-publish-entry-model";
import {reopenCollegeDrive} from "@/modules/placements/college-drive-reopen-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  closePlacementJob,
} from "@/modules/placements/job-service";

export const runtime = "nodejs";
const statusCommandSchema=z.union([
 legacyDriveStatusActionSchema,
 z.strictObject({action:z.literal("REOPEN"),confirmed:z.literal(true)}),
 z.strictObject({isActive:z.literal(false)}),
 z.strictObject({isActive:z.literal(true),confirmed:z.literal(true)}),
]);

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
    const command = statusCommandSchema.parse(await request.json());
    // Old isActive=false means close. isActive=true is NOT first publication:
    // reopen needs a confirmed, already-closed drive and passes through the
    // existing audited College Admin service (season/employer checks included).
    // DRAFT -> PUBLISHED is still only available via the separate preflight.
    const reopen="isActive" in command?command.isActive:command.action==="REOPEN";
    const job = reopen
      ? await reopenCollegeDrive(context,jobId,{confirmed:true})
      : await closePlacementJob(context,jobId);
    return NextResponse.json(job,{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

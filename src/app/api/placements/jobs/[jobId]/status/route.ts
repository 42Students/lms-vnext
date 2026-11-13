import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { z } from "zod";
import { legacyDriveStatusActionSchema } from "@/modules/placements/tpo-drive-publish-entry-model";
import {reopenCollegeDrive} from "@/modules/placements/college-drive-reopen-service";
import {
  closePlacementJob,
} from "@/modules/placements/job-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";
const statusCommandSchema=z.union([
 legacyDriveStatusActionSchema,
 z.strictObject({action:z.literal("REOPEN"),confirmed:z.literal(true)}),
 z.strictObject({isActive:z.literal(false)}),
 z.strictObject({isActive:z.literal(true),confirmed:z.literal(true)}),
]);


export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const command = statusCommandSchema.parse(await boundedRequestJson(request));
    const reopen="isActive" in command?command.isActive:command.action==="REOPEN";
    const job = reopen
      ? await reopenCollegeDrive(context,jobId,{confirmed:true})
      : await closePlacementJob(context,jobId);
    return privateJson(job);
  },
);

import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementApplications,placementJobs,placementLearnerRequests} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";

/** Uses an aggregate SQL count; never loads learner request text or contact data. */
export async function getPendingTpoRequestsCount(context:RequestContext):Promise<number>{
 const collegeId=await requireTpoBatchActor(context);
 const [row]=await getDb().select({total:sql<number>`count(*)::int`})
  .from(placementLearnerRequests)
  .innerJoin(placementApplications,eq(placementApplications.id,placementLearnerRequests.applicationId))
  .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
  .where(and(eq(placementJobs.collegeId,collegeId),eq(placementLearnerRequests.status,"PENDING")));
 return row?.total??0;
}

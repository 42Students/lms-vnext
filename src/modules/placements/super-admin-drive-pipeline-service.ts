import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings } from "@/db/schema";
import { placementCollegeApplicationStages } from "@/db/schema/placement-college-application-stages";
import type { RequestContext } from "@/modules/identity/context";
import { getPlacementJob } from "./job-service";
import { projectSuperAdminDrivePipeline } from "./super-admin-drive-pipeline-model";

/** Selected-college authorization is checked before an individual job is queried. */
export async function getSuperAdminDrivePipeline(context: RequestContext, jobId: string) {
  const job = await getPlacementJob(context, jobId);
  const stage = sql<string>`coalesce(${placementCollegeApplicationStages.stage},
    case when ${placementApplicationScreenings.status} = 'SHORTLISTED' then 'SHORTLISTED'
         when ${placementApplicationScreenings.status} = 'REJECTED' then 'REJECTED'
         else 'APPLIED' end)`;
  const counts = await getDb().select({
    stage,
    total: sql<number>`count(*)::integer`.mapWith(Number),
  }).from(placementApplications)
    // An application FK alone does not prove that its learner belongs to
    // the selected job's college. Exclude malformed cross-college imports
    // BEFORE counting pipeline stages.
    .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,job.collegeId),
    ))
    .leftJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id))
    .leftJoin(placementCollegeApplicationStages,
      and(eq(placementCollegeApplicationStages.applicationId, placementApplications.id),
        eq(placementCollegeApplicationStages.jobId, job.id)))
    .where(and(eq(placementApplications.jobId, job.id),
      eq(placementApplications.status, "SUBMITTED")))
    .groupBy(stage);
  // Old Admin metrics are a current-status snapshot, not a conversion
  // cohort. Showing percentages against the preceding stage incorrectly
  // implies every application passed through that stage in this snapshot.
  const snapshot=projectSuperAdminDrivePipeline(counts);
  return {...snapshot,funnel:snapshot.funnel.map(row=>({...row,percentPrevious:null}))};
}

import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementApplications, placementApplicationScreenings } from "@/db/schema";
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
    .leftJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId, placementApplications.id))
    .leftJoin(placementCollegeApplicationStages,
      and(eq(placementCollegeApplicationStages.applicationId, placementApplications.id),
        eq(placementCollegeApplicationStages.jobId, job.id)))
    .where(and(eq(placementApplications.jobId, job.id),
      eq(placementApplications.status, "SUBMITTED")))
    .groupBy(stage);
  return projectSuperAdminDrivePipeline(counts);
}

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementJobs } from "@/db/schema";
import { placementSavedJobs } from "@/db/schema/placement-external";
import type { RequestContext } from "@/modules/identity/context";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { listLearnerPlacementJobs } from "./learner-job-service";
import { PlacementsServiceError } from "./errors";
import { placementTableExists } from "./staged-tables";

export class SavedJobsStorageUnavailableError extends Error {
  // Existing saved-jobs collection route recognizes missing-relation code
  // through its database unavailable adapter.
  readonly code = "42P01";
  constructor() {
    super("SAVED_JOBS_NOT_CONFIGURED");
    this.name = "SavedJobsStorageUnavailableError";
  }
}

const savedJobId = z.string().uuid();

/**
 * Saved jobs are scoped by a persisted (college, membership, job) key.
 * Imported numeric IDs remain read-only migration attributes, never direct
 * authorization inputs or a license to browse other colleges' jobs.
 */
async function requireVisiblePlacements(context: RequestContext) {
  const learner = await requireLearnerPlacementAccess(context);
  if (!await placementTableExists("placement_saved_jobs")) {
    throw new SavedJobsStorageUnavailableError();
  }
  return learner;
}


/**
 * Save only an actual published job in the learner's authorized job feed.
 * The unique (membership_id,job_id) index makes concurrent retries safe.
 */
export async function saveOwnPlacementJob(
  context: RequestContext,
  rawJobId: string,
) {
  const jobId = savedJobId.parse(rawJobId);
  const learner = await requireVisiblePlacements(context);
  const visibleJobs = await listLearnerPlacementJobs(context);
  if (!visibleJobs.some((entry) => entry.job.id === jobId)) {
    throw new PlacementsServiceError("PLACEMENT_SAVED_JOB_UNAVAILABLE");
  }

  const db = getDb();
  await db.insert(placementSavedJobs).values({
    collegeId: learner.collegeId,
    membershipId: learner.id,
    jobId,
  }).onConflictDoNothing();

  const [row] = await db.select().from(placementSavedJobs)
    .where(and(
      eq(placementSavedJobs.collegeId, learner.collegeId),
      eq(placementSavedJobs.membershipId, learner.id),
      eq(placementSavedJobs.jobId, jobId),
    )).limit(1);
  return row;
}

export async function unsaveOwnPlacementJob(
  context: RequestContext,
  rawJobId: string,
) {
  const jobId = savedJobId.parse(rawJobId);
  const learner = await requireVisiblePlacements(context);
  const deleted = await getDb().delete(placementSavedJobs)
    .where(and(
      eq(placementSavedJobs.collegeId, learner.collegeId),
      eq(placementSavedJobs.membershipId, learner.id),
      eq(placementSavedJobs.jobId, jobId),
    ))
    .returning({ id: placementSavedJobs.id });
  return { removed: deleted.length > 0, saved:false as const,
    message:"Job removed from saved" as const };
}

/** Never return another tenant's job data or unpublished/archived job info. */
export async function listOwnPlacementSavedJobs(context: RequestContext) {
  const learner = await requireVisiblePlacements(context);
  const rows = await getDb()
    .select({
      id: placementSavedJobs.id,
      jobId: placementSavedJobs.jobId,
      savedAt: placementSavedJobs.savedAt,
      title: placementJobs.title,
      jobStatus: placementJobs.status,
      applicationDeadline: placementJobs.applicationDeadline,
      employmentType: placementJobs.employmentType,
      workMode: placementJobs.workMode,
      locations: placementJobs.locations,
      openings: placementJobs.openings,
      minimumAnnualCtcInr: placementJobs.minimumAnnualCtcInr,
      maximumAnnualCtcInr: placementJobs.maximumAnnualCtcInr,
      // These are only college-scoped, historically bookmarked job facts.
      // Never return internal eligibility policies, unpublished descriptions,
      // company contacts or candidate fields through a saved-bookmark read.
    })
    .from(placementSavedJobs)
    .innerJoin(placementJobs, eq(placementJobs.id, placementSavedJobs.jobId))
    .where(and(
      eq(placementSavedJobs.collegeId, learner.collegeId),
      eq(placementSavedJobs.membershipId, learner.id),
      eq(placementJobs.collegeId, learner.collegeId),
    ))
    .orderBy(desc(placementSavedJobs.savedAt),desc(placementSavedJobs.id));
  // A saved-row is evidence of a learner's previous access in THIS college.
  // Closed, cancelled and archived jobs remain historical saved items, even
  // after their deadline passes. Still enforce today's eligibility/visibility
  // for any live published job; an old bookmark must not bypass a new policy.
  // Preserve complete, ordered bookmark history (the client paginates
  // displayed cards), but do NOT load the entire college jobs feed for every
  // saved-jobs read. An explicit ID set is still checked against the active
  // learner, cohort, company grant and current publishing rules by the
  // canonical listLearnerPlacementJobs service. Its batch limit is 100.
  const publishedJobIds=[...new Set(rows.filter(row=>row.jobStatus==="PUBLISHED")
    .map(row=>row.jobId))];
  const visibleIds=new Set<string>();
  for(let i=0;i<publishedJobIds.length;i+=100){
    const scoped=await listLearnerPlacementJobs(context,new Date(),undefined,
      publishedJobIds.slice(i,i+100));
    for(const entry of scoped)visibleIds.add(entry.job.id);
  }
  return rows.filter(row=>row.jobStatus!=="PUBLISHED" || visibleIds.has(row.jobId));
}

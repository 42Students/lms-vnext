import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementJobs, collegeMemberships, membershipRoles, users } from "@/db/schema";
import { AuthorizationError } from "@/modules/permissions/policy";
import type { PermissionTransaction } from "@/modules/permissions/persisted-actor";
import { placementSavedJobs } from "@/db/schema/placement-external";
import type { RequestContext } from "@/modules/identity/context";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { listLearnerPlacementJobs } from "./learner-job-service";
import { PlacementsServiceError } from "./errors";
import { placementTableExists } from "./staged-tables";

import { zUuid } from "@/lib/schema-primitives";
export class SavedJobsStorageUnavailableError extends Error {
  // Existing saved-jobs collection route recognizes missing-relation code
  // through its database unavailable adapter.
  readonly code = "42P01";
  constructor() {
    super("SAVED_JOBS_NOT_CONFIGURED");
    this.name = "SavedJobsStorageUnavailableError";
  }
}

const savedJobId = zUuid;

const historicalSavedJobStatuses = new Set(["CLOSED","CANCELLED","ARCHIVED","EXPIRED"]);

/**
 * An existing bookmark proves neither ongoing publication nor consent to
 * reveal a soft-deleted or external-only record. Closed/archived jobs can be
 * historical bookmarks; currently published ones require today's feed grant.
 */
export function isSavedPlacementJobVisible(
  row: {
    jobStatus: string;
    legacyWasDeleted: boolean | null;
    legacyVisibilityType: string | null;
  },
  currentlyVisible: boolean,
): boolean {
  if (row.legacyWasDeleted === true || row.legacyVisibilityType === "EXTERNAL_ONLY")
    return false;
  return row.jobStatus === "PUBLISHED"
    ? currentlyVisible
    : historicalSavedJobStatuses.has(row.jobStatus);
}

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
 * A visible-placement feed preflight may become stale before the bookmark
 * write or private read. Recheck user ownership and LEARNER grant while
 * holding SHARE locks to serialize account suspension or role revocation.
 */
async function assertLiveSavedJobLearner(
  tx: PermissionTransaction,
  context: RequestContext,
  learner: NonNullable<RequestContext["membership"]>,
) {
  const [current] = await tx.select({
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    platformStatus: users.platformStatus,
  }).from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .where(eq(collegeMemberships.id, learner.id))
    .for("share").limit(1);
  if (!current || current.userId !== context.user.id ||
      current.collegeId !== learner.collegeId ||
      current.status !== "ACTIVE" || current.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.read");
  }
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
  const visibleJobs = await listLearnerPlacementJobs(context, new Date(), jobId);
  if (!visibleJobs.some((entry) => entry.job.id === jobId)) {
    throw new PlacementsServiceError("PLACEMENT_SAVED_JOB_UNAVAILABLE");
  }

  return getDb().transaction(async tx => {
    await assertLiveSavedJobLearner(tx, context, learner);
    // The feed check is necessary but not sufficient: publication and legacy
    // visibility may change while the learner's request is in flight.
    const [liveJob] = await tx.select({
      status: placementJobs.status,
      collegeId: placementJobs.collegeId,
      archivedAt: placementJobs.archivedAt,
      legacyWasDeleted: placementJobs.legacyWasDeleted,
      legacyVisibilityType: placementJobs.legacyVisibilityType,
    }).from(placementJobs)
      .where(eq(placementJobs.id, jobId))
      .for("share").limit(1);
    if (!liveJob || liveJob.collegeId !== learner.collegeId ||
        liveJob.status !== "PUBLISHED" || liveJob.archivedAt !== null ||
        liveJob.legacyWasDeleted === true ||
        liveJob.legacyVisibilityType === "EXTERNAL_ONLY") {
      throw new PlacementsServiceError("PLACEMENT_SAVED_JOB_UNAVAILABLE");
    }
    await tx.insert(placementSavedJobs).values({
      collegeId: learner.collegeId,
      membershipId: learner.id,
      jobId,
    }).onConflictDoNothing();
    const [row] = await tx.select().from(placementSavedJobs)
      .where(and(
        eq(placementSavedJobs.collegeId, learner.collegeId),
        eq(placementSavedJobs.membershipId, learner.id),
        eq(placementSavedJobs.jobId, jobId),
      )).limit(1);
    return row;
  });
}

export async function unsaveOwnPlacementJob(
  context: RequestContext,
  rawJobId: string,
) {
  const jobId = savedJobId.parse(rawJobId);
  const learner = await requireVisiblePlacements(context);
  return getDb().transaction(async tx => {
    await assertLiveSavedJobLearner(tx, context, learner);
    const deleted = await tx.delete(placementSavedJobs)
      .where(and(
        eq(placementSavedJobs.collegeId, learner.collegeId),
        eq(placementSavedJobs.membershipId, learner.id),
        eq(placementSavedJobs.jobId, jobId),
      ))
      .returning({ id: placementSavedJobs.id });
    return { removed: deleted.length > 0, saved:false as const,
      message:"Job removed from saved" as const };
  });
}

/** Never return another tenant's job data or unpublished/archived job info. */
export async function listOwnPlacementSavedJobs(context: RequestContext) {
  const learner = await requireVisiblePlacements(context);
  return getDb().transaction(async tx => {
    await assertLiveSavedJobLearner(tx, context, learner);
    const rows = await tx.select({
      id: placementSavedJobs.id,
      jobId: placementSavedJobs.jobId,
      savedAt: placementSavedJobs.savedAt,
      title: placementJobs.title,
      jobStatus: placementJobs.status,
      // Read these only to suppress deleted/non-learner legacy records;
      // do not disclose internal visibility metadata through the API.
      legacyWasDeleted: placementJobs.legacyWasDeleted,
      legacyVisibilityType: placementJobs.legacyVisibilityType,
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
  // A historical bookmark may remain visible after closure, but a deleted,
  // external-only or unpublished draft is not a permitted bookmark read.
  // Strip the visibility flags from the response: they are internal policy
  // inputs, never learner-facing saved-job details.
  return rows.filter(row=>isSavedPlacementJobVisible(row,visibleIds.has(row.jobId)))
    .map(row=>({
      id: row.id,
      jobId: row.jobId,
      savedAt: row.savedAt,
      title: row.title,
      jobStatus: row.jobStatus,
      applicationDeadline: row.applicationDeadline,
      employmentType: row.employmentType,
      workMode: row.workMode,
      locations: row.locations,
      openings: row.openings,
      minimumAnnualCtcInr: row.minimumAnnualCtcInr,
      maximumAnnualCtcInr: row.maximumAnnualCtcInr,
    }));
  });
}

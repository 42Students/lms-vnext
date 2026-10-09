import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementJobs } from "@/db/schema";
import { placementSavedJobs } from "@/db/schema/placement-external";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { getOwnPlacementParticipationAccess } from "./batch-participation-service";
import { listLearnerPlacementJobs } from "./learner-job-service";
import { PlacementsServiceError } from "./errors";

const savedJobId = z.string().uuid();

/**
 * DB08 saved-job source stage only. No routes should call these functions
 * before placement_saved_jobs is added to the numbered Drizzle migration.
 */
function requireLearner(context: RequestContext) {
  if (!context.membership || !hasMembershipRole(context, "LEARNER")) {
    throw new AuthorizationError("placements.read");
  }
  requirePermission(context, "placements.read", {
    collegeId: context.membership.collegeId,
  });
  return context.membership;
}

async function requireVisiblePlacements(context: RequestContext) {
  const learner = requireLearner(context);
  const access = await getOwnPlacementParticipationAccess(context);
  if (!access.showPlacements) {
    throw new AuthorizationError("placements.read");
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
  return { removed: deleted.length > 0 };
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
    })
    .from(placementSavedJobs)
    .innerJoin(placementJobs, eq(placementJobs.id, placementSavedJobs.jobId))
    .where(and(
      eq(placementSavedJobs.collegeId, learner.collegeId),
      eq(placementSavedJobs.membershipId, learner.id),
      eq(placementJobs.collegeId, learner.collegeId),
      eq(placementJobs.status, "PUBLISHED"),
    ))
    .orderBy(desc(placementSavedJobs.savedAt));
  // Jobs no longer in the learner's feed must not leak through bookmarks.
  const feed = await listLearnerPlacementJobs(context);
  const visibleIds = new Set(feed.map((entry) => entry.job.id));
  return rows.filter((row) => visibleIds.has(row.jobId));
}

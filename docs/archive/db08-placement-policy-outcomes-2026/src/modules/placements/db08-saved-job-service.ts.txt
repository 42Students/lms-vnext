import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { placementJobs, placementSavedJobs } from "@/db/schema";
import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";

const jobIdSchema = z.string().uuid();

function learnerMembership(context: RequestContext) {
  if (!hasMembershipRole(context, "LEARNER") || !context.membership) {
    throw new PlacementsServiceError("PLACEMENT_SAVED_JOB_LEARNER_REQUIRED");
  }
  requirePermission(context, "placements.read", {
    collegeId: context.membership.collegeId,
  });
  return context.membership;
}

export async function savePlacementJob(
  context: RequestContext,
  rawJobId: string,
) {
  const jobId = jobIdSchema.parse(rawJobId);
  const member = learnerMembership(context);
  const db = getDb();
  const [job] = await db.select({ id: placementJobs.id, status: placementJobs.status })
    .from(placementJobs)
    .where(and(
      eq(placementJobs.id, jobId),
      eq(placementJobs.collegeId, member.collegeId),
    )).limit(1);
  if (!job || job.status !== "PUBLISHED") {
    throw new PlacementsServiceError("PLACEMENT_SAVED_JOB_NOT_AVAILABLE");
  }
  // Database unique constraint handles parallel save retries.
  await db.insert(placementSavedJobs).values({
    collegeId: member.collegeId,
    membershipId: member.id,
    jobId,
  }).onConflictDoNothing();
  const [row] = await db.select().from(placementSavedJobs)
    .where(and(
      eq(placementSavedJobs.membershipId, member.id),
      eq(placementSavedJobs.jobId, jobId),
    )).limit(1);
  return row;
}

export async function removePlacementSavedJob(
  context: RequestContext,
  rawJobId: string,
) {
  const jobId = jobIdSchema.parse(rawJobId);
  const member = learnerMembership(context);
  const removed = await getDb().delete(placementSavedJobs)
    .where(and(
      eq(placementSavedJobs.collegeId, member.collegeId),
      eq(placementSavedJobs.membershipId, member.id),
      eq(placementSavedJobs.jobId, jobId),
    ))
    .returning({ id: placementSavedJobs.id });
  return { removed: removed.length > 0 };
}

export async function listPlacementSavedJobs(
  context: RequestContext,
) {
  const member = learnerMembership(context);
  return getDb().select({
    id: placementSavedJobs.id,
    jobId: placementSavedJobs.jobId,
    savedAt: placementSavedJobs.createdAt,
    jobTitle: placementJobs.title,
    jobStatus: placementJobs.status,
    applicationDeadline: placementJobs.applicationDeadline,
  }).from(placementSavedJobs)
    .innerJoin(placementJobs, eq(placementSavedJobs.jobId, placementJobs.id))
    .where(and(
      eq(placementSavedJobs.collegeId, member.collegeId),
      eq(placementSavedJobs.membershipId, member.id),
      eq(placementJobs.collegeId, member.collegeId),
    ))
    .orderBy(desc(placementSavedJobs.createdAt));
}

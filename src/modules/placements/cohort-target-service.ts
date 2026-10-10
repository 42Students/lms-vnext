import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { cohorts, colleges, departments, placementJobs, programs } from "@/db/schema";
import { placementJobCohortTargets } from "@/db/schema/placement-job-cohorts";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";

const uuid = z.string().uuid();
const replaceInput = z.object({
  collegeId: uuid,
  jobId: uuid,
  cohortIds: z.array(uuid).min(1).max(100),
}).strict().refine(v => new Set(v.cohortIds).size === v.cohortIds.length, {
  path: ["cohortIds"], message: "Each cohort may be targeted only once",
});

/**
 * Stage only. No application route should call this until W01 has journaled
 * placement_job_cohort_targets and removed the required placement season FK.
 */
export async function replacePlacementJobCohortTargets(
  context: RequestContext,
  raw: unknown,
) {
  const input = replaceInput.parse(raw);
  await requirePlacementManageScope(context, input.collegeId);
  const db = getDb();
  return db.transaction(async tx => {
    // Same college lock ordering as DB08 eligibility and registration writes.
    const [college] = await tx.select({ id: colleges.id }).from(colleges)
      .where(eq(colleges.id, input.collegeId)).for("update").limit(1);
    if (!college) throw new PlacementsServiceError("COLLEGE_NOT_FOUND");

    const [job] = await tx.select({ id: placementJobs.id, status: placementJobs.status })
      .from(placementJobs)
      .where(and(
        eq(placementJobs.id, input.jobId),
        eq(placementJobs.collegeId, input.collegeId),
      )).for("update").limit(1);
    if (!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
    // Changing live targets must notify applicants, which is not yet a
    // verified W06 outbox integration. Fail closed instead of silent changes.
    if (job.status !== "DRAFT") {
      throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
    }

    const allowed = await tx.select({ id: cohorts.id })
      .from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(and(
        inArray(cohorts.id, input.cohortIds),
        eq(departments.collegeId, input.collegeId),
      ));
    if (allowed.length !== input.cohortIds.length) {
      throw new PlacementsServiceError("PLACEMENT_ELIGIBILITY_SCOPE_MISMATCH");
    }

    await tx.delete(placementJobCohortTargets)
      .where(eq(placementJobCohortTargets.jobId, job.id));
    const rows = await tx.insert(placementJobCohortTargets)
      .values(input.cohortIds.map(cohortId => ({
        collegeId: input.collegeId,
        jobId: job.id,
        cohortId,
        createdByUserId: context.user.id,
      }))).returning();
    return { jobId: job.id, cohortIds: rows.map(row => row.cohortId) };
  });
}

export function isPlacementJobTargetCohort(
  cohortId: string | null,
  targetedCohortIds: readonly string[],
): boolean {
  // Empty targets is not "everyone" during the batch migration.
  return cohortId !== null && targetedCohortIds.includes(cohortId);
}

import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { learnerProgramEnrollments } from "@/db/schema";
import { placementBatchLifecycles } from "@/db/schema/placement-batches";
import { placementBatchRegistrations } from "@/db/schema/placement-registration";
import type { RequestContext } from "@/modules/identity/context";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { resolveLearnerRegistrationDisplay } from "./learner-registration-view-model";
import { PlacementRegistrationError } from "./batch-registration-service";

export async function getOwnLearnerRegistration(context: RequestContext) {
  const membership = await requireLearnerPlacementAccess(context);
  const db = getDb();
  const enrollments = await db.select({ cohortId: learnerProgramEnrollments.cohortId })
    .from(learnerProgramEnrollments)
    .where(and(eq(learnerProgramEnrollments.membershipId, membership.id),
      eq(learnerProgramEnrollments.status, "ACTIVE"))).limit(2);
  if (enrollments.length !== 1)
    throw new PlacementRegistrationError("DB08_REGISTRATION_ENROLLMENT_INVALID");
  const cohortId = enrollments[0].cohortId;
  const [batch, registration] = await Promise.all([
    db.select({
      invitedAt: placementBatchLifecycles.invitedAt,
      finishedAt: placementBatchLifecycles.finishedAt,
      deadline: placementBatchLifecycles.registrationDeadline,
    }).from(placementBatchLifecycles)
      .where(and(eq(placementBatchLifecycles.collegeId, membership.collegeId),
        eq(placementBatchLifecycles.cohortId, cohortId))).limit(1).then(rows => rows[0] ?? null),
    db.select({ choice: placementBatchRegistrations.choice })
      .from(placementBatchRegistrations)
      .where(and(eq(placementBatchRegistrations.collegeId, membership.collegeId),
        eq(placementBatchRegistrations.cohortId, cohortId),
        eq(placementBatchRegistrations.membershipId, membership.id)))
      .limit(1).then(rows => rows[0] ?? null),
  ]);
  // A new academic cohort is a new placement cycle. Never silently treat an
  // old season/cohort's choice or consent as current-cycle registration.
  const [previous] = registration ? [] : await db.select({
    cohortId: placementBatchRegistrations.cohortId,
    choice: placementBatchRegistrations.choice,
    recordedAt: placementBatchRegistrations.updatedAt,
  }).from(placementBatchRegistrations).where(and(
    eq(placementBatchRegistrations.membershipId, membership.id),
    eq(placementBatchRegistrations.collegeId, membership.collegeId),
    ne(placementBatchRegistrations.cohortId, cohortId),
  )).orderBy(desc(placementBatchRegistrations.updatedAt)).limit(1);
  return {
    ...resolveLearnerRegistrationDisplay(batch, registration?.choice ?? null, new Date()),
    cohortId,
    // False is the semantic equivalent of legacy GET mine's empty 204 case.
    hasRegistration: registration !== null,
    priorCohortRegistration: previous ? {
      cohortId: previous.cohortId,
      choice: previous.choice,
      recordedAt: previous.recordedAt.toISOString(),
    } : null,
  };
}

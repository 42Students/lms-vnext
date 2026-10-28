import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  cohorts,
  learnerProgramEnrollments,
  membershipRoles,
  sectionEnrollments,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  AcademicsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadAcademicsMembership,
  loadLearnerEnrollmentScope,
  requireAcademicRole,
} from "./a2-scope";
import {
  loadCohortScope,
  loadProgramScope,
} from "./scope";
import {
  cohortIdSchema,
  createLearnerProgramEnrollmentInputSchema,
  learnerEnrollmentIdSchema,
  learnerProgramEnrollmentTransitionSchema,
  programIdSchema,
  type CreateLearnerProgramEnrollmentInput,
} from "./validation";

function mapEnrollmentConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "learner_program_enrollments_membership_program_cohort_uq":
    case "learner_program_enrollments_active_membership_uq":
      return new AcademicsServiceError(
        "LEARNER_ALREADY_ENROLLED",
      );
    default:
      return error;
  }
}

export async function listLearnerProgramEnrollments(
  context: RequestContext,
  programIdInput: string,
  cohortIdInput?: string | null,
) {
  const programId =
    programIdSchema.parse(programIdInput);
  const program = await loadProgramScope(programId);

  requirePermission(context, "academics.read", {
    organizationId: program.organizationId,
    collegeId: program.collegeId,
  });

  const cohortId = cohortIdInput
    ? cohortIdSchema.parse(cohortIdInput)
    : null;

  if (cohortId) {
    const cohort = await loadCohortScope(cohortId);
    if (cohort.programId !== programId) {
      throw new AcademicsServiceError(
        "COHORT_PROGRAM_MISMATCH",
      );
    }
  }

  const db = getDb();
  const conditions = [
    eq(
      learnerProgramEnrollments.programId,
      programId,
    ),
  ];

  if (cohortId) {
    conditions.push(
      eq(
        learnerProgramEnrollments.cohortId,
        cohortId,
      ),
    );
  }

  return db
    .select({
      id: learnerProgramEnrollments.id,
      membershipId:
        learnerProgramEnrollments.membershipId,
      programId:
        learnerProgramEnrollments.programId,
      cohortId:
        learnerProgramEnrollments.cohortId,
      status: learnerProgramEnrollments.status,
      admittedAt:
        learnerProgramEnrollments.admittedAt,
      completedAt:
        learnerProgramEnrollments.completedAt,
      withdrawnAt:
        learnerProgramEnrollments.withdrawnAt,
      displayName: users.displayName,
      membershipStatus:
        collegeMemberships.status,
    })
    .from(learnerProgramEnrollments)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        learnerProgramEnrollments.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(and(...conditions))
    .orderBy(
      asc(users.displayName),
      asc(learnerProgramEnrollments.createdAt),
    );
}

export async function createLearnerProgramEnrollment(
  context: RequestContext,
  rawInput: CreateLearnerProgramEnrollmentInput,
) {
  const input =
    createLearnerProgramEnrollmentInputSchema.parse(
      rawInput,
    );
  const [program, cohort, membership] =
    await Promise.all([
      loadProgramScope(input.programId),
      loadCohortScope(input.cohortId),
      loadAcademicsMembership(input.membershipId),
    ]);

  requirePermission(context, "academics.manage", {
    organizationId: program.organizationId,
    collegeId: program.collegeId,
  });

  requireAcademicRole(membership, "LEARNER");

  if (
    membership.collegeId !== program.collegeId
  ) {
    throw new AcademicsServiceError(
      "ENROLLMENT_COLLEGE_MISMATCH",
    );
  }

  if (cohort.programId !== program.id) {
    throw new AcademicsServiceError(
      "COHORT_PROGRAM_MISMATCH",
    );
  }

  if (
    cohort.status !== "PLANNED" &&
    cohort.status !== "ACTIVE"
  ) {
    throw new AcademicsServiceError(
      "COHORT_NOT_MUTABLE",
    );
  }

  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      // Membership/role can be suspended or revoked after the initial
      // loadAcademicsMembership() preflight. Lock the canonical parent first,
      // matching people/repository.ts role-writer lock order, then SHARE-lock
      // the actual LEARNER grant. A concurrent status UPDATE or role DELETE
      // must commit first or wait for this enrollment transaction; otherwise
      // a formerly authorized learner could acquire a fresh enrollment.
      // A disabled shared identity must not receive a new college enrollment.
      // Lock the user before its membership (the same parent-first order used
      // by identity proof and account lifecycle operations) so a concurrent
      // platform disable commits before this write or waits for its commit.
      const [liveUser] = await tx
        .select({ platformStatus: users.platformStatus })
        .from(users)
        .innerJoin(collegeMemberships,
          eq(collegeMemberships.userId, users.id))
        .where(eq(collegeMemberships.id, input.membershipId))
        .for("share", {of: users})
        .limit(1);
      if (!liveUser || liveUser.platformStatus !== "ACTIVE") {
        throw new AcademicsServiceError("MEMBERSHIP_NOT_ACTIVE");
      }
      const [liveMembership] = await tx
        .select({
          collegeId: collegeMemberships.collegeId,
          status: collegeMemberships.status,
          suspendedAt: collegeMemberships.suspendedAt,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, input.membershipId))
        .for("share")
        .limit(1);
      if (!liveMembership) {
        throw new AcademicsServiceError("MEMBERSHIP_NOT_FOUND");
      }
      if (liveMembership.status !== "ACTIVE" || liveMembership.suspendedAt !== null) {
        throw new AcademicsServiceError("MEMBERSHIP_NOT_ACTIVE");
      }
      if (liveMembership.collegeId !== program.collegeId) {
        throw new AcademicsServiceError("ENROLLMENT_COLLEGE_MISMATCH");
      }
      const [liveLearnerRole] = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(
          and(
            eq(membershipRoles.membershipId, input.membershipId),
            eq(membershipRoles.role, "LEARNER"),
          ),
        )
        .for("share")
        .limit(1);
      if (!liveLearnerRole) {
        throw new AcademicsServiceError("LEARNER_ROLE_REQUIRED");
      }

      // The preflight cohort can become COMPLETED or ARCHIVED before this
      // transaction starts. SHARE both re-reads the latest committed state
      // after a competing status writer and holds the row against a later
      // transition until the enrollment/append-only activity event commits.
      const [liveCohort] = await tx
        .select({ programId: cohorts.programId, status: cohorts.status })
        .from(cohorts)
        .where(eq(cohorts.id, input.cohortId))
        .for("share")
        .limit(1);
      if (!liveCohort || (liveCohort.status !== "PLANNED" &&
                          liveCohort.status !== "ACTIVE")) {
        throw new AcademicsServiceError("COHORT_NOT_MUTABLE");
      }
      if (liveCohort.programId !== input.programId) {
        throw new AcademicsServiceError("COHORT_PROGRAM_MISMATCH");
      }

      const [created] = await tx
        .insert(learnerProgramEnrollments)
        .values({
          membershipId: input.membershipId,
          programId: input.programId,
          cohortId: input.cohortId,
        })
        .returning();

      if (!created) {
        throw new AcademicsServiceError("LEARNER_ENROLLMENT_NOT_ACTIVE");
      }

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.ACADEMICS_LEARNER_ENROLLED,
          collegeId: program.collegeId,
          organizationId:
            program.organizationId,
          subjectType:
            "learner_program_enrollment",
          subjectId: created.id,
          subjectLabel:
            "Learner program enrollment",
          summary:
            "Learner enrolled into an academic program",
          metadata: {
            membershipId:
              created.membershipId,
            programId: created.programId,
            cohortId: created.cohortId,
          },
          groupKey:
            `academics-program:${created.programId}:enrollments`,
          dedupeKey:
            `academics-enrollment:${created.id}:created`,
        },
      );

      return created;
    });
  } catch (error) {
    throw mapEnrollmentConstraint(error);
  }
}

export async function transitionLearnerProgramEnrollment(
  context: RequestContext,
  enrollmentIdInput: string,
  rawInput: unknown,
) {
  const enrollmentId =
    learnerEnrollmentIdSchema.parse(
      enrollmentIdInput,
    );
  const input =
    learnerProgramEnrollmentTransitionSchema.parse(
      rawInput,
    );
  const enrollment =
    await loadLearnerEnrollmentScope(
      enrollmentId,
    );

  requirePermission(context, "academics.manage", {
    organizationId: enrollment.organizationId,
    collegeId: enrollment.collegeId,
  });

  if (enrollment.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "LEARNER_ENROLLMENT_NOT_ACTIVE",
    );
  }

  const db = getDb();
  const endedAt = new Date();
  const nextStatus =
    input.action === "COMPLETE"
      ? "COMPLETED"
      : "WITHDRAWN";
  const sectionStatus =
    input.action === "COMPLETE"
      ? "COMPLETED"
      : "WITHDRAWN";

  return db.transaction(async (tx) => {
    await tx
      .update(sectionEnrollments)
      .set({
        status: sectionStatus,
        endedAt,
        updatedAt: endedAt,
      })
      .where(
        and(
          eq(
            sectionEnrollments.learnerEnrollmentId,
            enrollmentId,
          ),
          eq(sectionEnrollments.status, "ACTIVE"),
        ),
      );

    const [updated] = await tx
      .update(learnerProgramEnrollments)
      .set({
        status: nextStatus,
        completedAt:
          nextStatus === "COMPLETED"
            ? endedAt
            : null,
        withdrawnAt:
          nextStatus === "WITHDRAWN"
            ? endedAt
            : null,
        updatedAt: endedAt,
      })
      .where(
        and(
          eq(
            learnerProgramEnrollments.id,
            enrollmentId,
          ),
          eq(
            learnerProgramEnrollments.status,
            "ACTIVE",
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new AcademicsServiceError(
        "LEARNER_ENROLLMENT_NOT_ACTIVE",
      );
    }

    return updated;
  });
}

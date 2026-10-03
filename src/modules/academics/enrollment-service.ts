import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  learnerProgramEnrollments,
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
    const [created] = await db
      .insert(learnerProgramEnrollments)
      .values({
        membershipId: input.membershipId,
        programId: input.programId,
        cohortId: input.cohortId,
      })
      .returning();

    return created;
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

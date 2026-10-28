import {
  and,
  asc,
  count,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  collegeMemberships,
  learnerProgramEnrollments,
  sectionEnrollments,
  sections,
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
  loadSectionEnrollmentScope,
  requireAcademicRole,
} from "./a2-scope";
import {
  loadAcademicPeriodScope,
  loadSectionScope,
} from "./scope";
import {
  assignLearnerSectionInputSchema,
  learnerEnrollmentIdSchema,
  sectionEnrollmentIdSchema,
  sectionEnrollmentTransitionSchema,
  sectionIdSchema,
  type AssignLearnerSectionInput,
} from "./validation";

function mapSectionEnrollmentConstraint(
  error: unknown,
) {
  if (
    postgresConstraintName(error) ===
    "section_enrollments_active_period_uq"
  ) {
    return new AcademicsServiceError(
      "SECTION_ENROLLMENT_CONFLICT",
    );
  }

  return error;
}

export async function listSectionRoster(
  context: RequestContext,
  sectionIdInput: string,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const section = await loadSectionScope(sectionId);

  requirePermission(context, "academics.read", {
    organizationId: section.organizationId,
    collegeId: section.collegeId,
  });

  const db = getDb();

  return db
    .select({
      id: sectionEnrollments.id,
      learnerEnrollmentId:
        sectionEnrollments.learnerEnrollmentId,
      membershipId:
        learnerProgramEnrollments.membershipId,
      displayName: users.displayName,
      academicPeriodId:
        sectionEnrollments.academicPeriodId,
      status: sectionEnrollments.status,
      startedAt: sectionEnrollments.startedAt,
      endedAt: sectionEnrollments.endedAt,
    })
    .from(sectionEnrollments)
    .innerJoin(
      learnerProgramEnrollments,
      eq(
        learnerProgramEnrollments.id,
        sectionEnrollments.learnerEnrollmentId,
      ),
    )
    .innerJoin(
      cohorts,
      and(
        eq(cohorts.id, learnerProgramEnrollments.cohortId),
        eq(cohorts.programId, learnerProgramEnrollments.programId),
      ),
    )
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
    .where(
      and(
        eq(sectionEnrollments.sectionId, sectionId),
        eq(sectionEnrollments.academicPeriodId, section.academicPeriodId),
        eq(learnerProgramEnrollments.cohortId, section.cohortId),
        eq(collegeMemberships.collegeId, section.collegeId),
      ),
    )
    .orderBy(
      asc(users.displayName),
      asc(sectionEnrollments.startedAt),
    );
}

export async function listLearnerSectionHistory(
  context: RequestContext,
  learnerEnrollmentIdInput: string,
) {
  const learnerEnrollmentId =
    learnerEnrollmentIdSchema.parse(
      learnerEnrollmentIdInput,
    );
  const enrollment =
    await loadLearnerEnrollmentScope(
      learnerEnrollmentId,
    );

  requirePermission(context, "academics.read", {
    organizationId: enrollment.organizationId,
    collegeId: enrollment.collegeId,
  });

  const db = getDb();

  return db
    .select({
      id: sectionEnrollments.id,
      sectionId: sectionEnrollments.sectionId,
      sectionName: sections.name,
      academicPeriodId:
        sectionEnrollments.academicPeriodId,
      status: sectionEnrollments.status,
      startedAt: sectionEnrollments.startedAt,
      endedAt: sectionEnrollments.endedAt,
    })
    .from(sectionEnrollments)
    .innerJoin(
      sections,
      and(
        eq(sections.id, sectionEnrollments.sectionId),
        eq(sections.cohortId, enrollment.cohortId),
        eq(sections.academicPeriodId, sectionEnrollments.academicPeriodId),
      ),
    )
    .innerJoin(
      academicPeriods,
      and(
        eq(academicPeriods.id, sectionEnrollments.academicPeriodId),
        eq(academicPeriods.collegeId, enrollment.collegeId),
      ),
    )
    .where(
      eq(
        sectionEnrollments.learnerEnrollmentId,
        learnerEnrollmentId,
      ),
    )
    .orderBy(
      asc(sectionEnrollments.startedAt),
    );
}

export async function assignLearnerToSection(
  context: RequestContext,
  rawInput: AssignLearnerSectionInput,
) {
  const input =
    assignLearnerSectionInputSchema.parse(rawInput);
  const [enrollment, section] =
    await Promise.all([
      loadLearnerEnrollmentScope(
        input.learnerEnrollmentId,
      ),
      loadSectionScope(input.sectionId),
    ]);

  requirePermission(context, "academics.manage", {
    organizationId: enrollment.organizationId,
    collegeId: enrollment.collegeId,
  });

  if (enrollment.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "LEARNER_ENROLLMENT_NOT_ACTIVE",
    );
  }

  if (
    section.collegeId !== enrollment.collegeId
  ) {
    throw new AcademicsServiceError(
      "ENROLLMENT_COLLEGE_MISMATCH",
    );
  }

  if (section.cohortId !== enrollment.cohortId) {
    throw new AcademicsServiceError(
      "SECTION_COHORT_MISMATCH",
    );
  }

  if (section.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "SECTION_NOT_FOUND",
    );
  }

  const [membership, period] =
    await Promise.all([
      loadAcademicsMembership(
        enrollment.membershipId,
      ),
      loadAcademicPeriodScope(
        section.academicPeriodId,
      ),
    ]);

  requireAcademicRole(membership, "LEARNER");

  if (period.status === "CLOSED") {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      // Serialize every assignment for this learner with completion,
      // withdrawal and college-admin moves. Preflight can go stale while
      // another request exits the program; the parent lock is authoritative.
      const [liveEnrollment] = await tx
        .select({
          status: learnerProgramEnrollments.status,
          cohortId: learnerProgramEnrollments.cohortId,
        })
        .from(learnerProgramEnrollments)
        .where(eq(learnerProgramEnrollments.id, input.learnerEnrollmentId))
        .for("update")
        .limit(1);
      if (!liveEnrollment || liveEnrollment.status !== "ACTIVE") {
        throw new AcademicsServiceError("LEARNER_ENROLLMENT_NOT_ACTIVE");
      }
      if (liveEnrollment.cohortId !== section.cohortId) {
        throw new AcademicsServiceError("SECTION_COHORT_MISMATCH");
      }

      // Period-close writers lock the period before its sections. Match
      // that order and hold a SHARE lock through the placement commit so a
      // CLOSED period cannot be raced in after the initial scope read.
      const [livePeriod] = await tx
        .select({ status: academicPeriods.status })
        .from(academicPeriods)
        .where(eq(academicPeriods.id, section.academicPeriodId))
        .for("share")
        .limit(1);
      if (!livePeriod || livePeriod.status === "CLOSED") {
        throw new AcademicsServiceError("ACADEMIC_PERIOD_CLOSED");
      }

      const [liveSection] = await tx
        .select({
          status: sections.status,
          cohortId: sections.cohortId,
          academicPeriodId: sections.academicPeriodId,
        })
        .from(sections)
        .where(eq(sections.id, input.sectionId))
        .for("update")
        .limit(1);
      if (!liveSection || liveSection.status !== "ACTIVE") {
        throw new AcademicsServiceError("SECTION_NOT_FOUND");
      }
      if (liveSection.cohortId !== liveEnrollment.cohortId) {
        throw new AcademicsServiceError("SECTION_COHORT_MISMATCH");
      }
      if (liveSection.academicPeriodId !== section.academicPeriodId) {
        throw new AcademicsServiceError("ACADEMIC_PERIOD_CLOSED");
      }

      const activePlacements = await tx
        .select({
          id: sectionEnrollments.id,
          sectionId: sectionEnrollments.sectionId,
          academicPeriodId:
            sectionEnrollments.academicPeriodId,
          periodStartDate:
            academicPeriods.startDate,
        })
        .from(sectionEnrollments)
        .innerJoin(
          academicPeriods,
          eq(
            academicPeriods.id,
            sectionEnrollments.academicPeriodId,
          ),
        )
        .where(
          and(
            eq(
              sectionEnrollments.learnerEnrollmentId,
              input.learnerEnrollmentId,
            ),
            eq(
              sectionEnrollments.status,
              "ACTIVE",
            ),
          ),
        );

      const alreadyAssigned =
        activePlacements.find(
          (placement) =>
            placement.sectionId ===
              input.sectionId &&
            placement.academicPeriodId ===
              section.academicPeriodId,
        );

      if (alreadyAssigned) {
        const [existing] = await tx
          .select()
          .from(sectionEnrollments)
          .where(
            eq(
              sectionEnrollments.id,
              alreadyAssigned.id,
            ),
          )
          .limit(1);

        return existing!;
      }

      if (
        activePlacements.some(
          (placement) =>
            placement.periodStartDate >
            period.startDate,
        )
      ) {
        throw new AcademicsServiceError(
          "SECTION_PERIOD_REGRESSION",
        );
      }

      const [capacityRow] = await tx
        .select({
          capacity: sections.capacity,
        })
        .from(sections)
        .where(eq(sections.id, input.sectionId))
        .limit(1);

      if (!capacityRow) {
        throw new AcademicsServiceError(
          "SECTION_NOT_FOUND",
        );
      }

      if (capacityRow.capacity !== null) {
        const [occupancy] = await tx
          .select({
            total: count(),
          })
          .from(sectionEnrollments)
          .where(
            and(
              eq(
                sectionEnrollments.sectionId,
                input.sectionId,
              ),
              eq(
                sectionEnrollments.status,
                "ACTIVE",
              ),
            ),
          );

        if (
          (occupancy?.total ?? 0) >=
          capacityRow.capacity
        ) {
          throw new AcademicsServiceError(
            "SECTION_CAPACITY_REACHED",
          );
        }
      }

      const now = new Date();

      for (const placement of activePlacements) {
        await tx
          .update(sectionEnrollments)
          .set({
            status:
              placement.academicPeriodId ===
              section.academicPeriodId
                ? "MOVED"
                : "COMPLETED",
            endedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(
                sectionEnrollments.id,
                placement.id,
              ),
              eq(
                sectionEnrollments.status,
                "ACTIVE",
              ),
            ),
          );
      }

      const [created] = await tx
        .insert(sectionEnrollments)
        .values({
          learnerEnrollmentId:
            input.learnerEnrollmentId,
          sectionId: input.sectionId,
          academicPeriodId:
            section.academicPeriodId,
        })
        .returning();

      return created!;
    });
  } catch (error) {
    if (error instanceof AcademicsServiceError) {
      throw error;
    }
    throw mapSectionEnrollmentConstraint(error);
  }
}

export async function transitionSectionEnrollment(
  context: RequestContext,
  sectionEnrollmentIdInput: string,
  rawInput: unknown,
) {
  const sectionEnrollmentId =
    sectionEnrollmentIdSchema.parse(
      sectionEnrollmentIdInput,
    );
  const input =
    sectionEnrollmentTransitionSchema.parse(
      rawInput,
    );
  const current =
    await loadSectionEnrollmentScope(
      sectionEnrollmentId,
    );

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (current.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "SECTION_ENROLLMENT_NOT_FOUND",
    );
  }

  const db = getDb();
  const now = new Date();
  const [updated] = await db
    .update(sectionEnrollments)
    .set({
      status:
        input.action === "COMPLETE"
          ? "COMPLETED"
          : "WITHDRAWN",
      endedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          sectionEnrollments.id,
          sectionEnrollmentId,
        ),
        eq(sectionEnrollments.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!updated) {
    throw new AcademicsServiceError(
      "SECTION_ENROLLMENT_NOT_FOUND",
    );
  }

  return updated;
}

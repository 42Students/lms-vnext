import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohortProgressionState,
  cohorts,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  departments,
  learnerProgramEnrollments,
  programTermCourses,
  programTerms,
  programs,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { collegePromotionExecuteSchema, promotionPreviewMatches, promotionReady } from "./college-batch-promotion-model";
import { previewCollegeBatchPromotionInTransaction } from "./college-batch-promotion-service";

export class CollegePromotionExecuteError extends Error {
  constructor(public readonly code:
    "BATCH_NOT_FOUND" | "PROMOTION_STALE" | "PROMOTION_BLOCKED" | "PROMOTION_PREVIEW_CHANGED") {
    super(code);
    this.name = "CollegePromotionExecuteError";
  }
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** Row-lock and CAS the persisted version; all checks and audit share one transaction. */
type TxRunner = <T>(work: (tx: Tx) => Promise<T>) => Promise<T>;

/** Optional runner is an internal test seam for rollback-only DB integration cases. */
export async function executeCollegeBatchPromotion(
  context: RequestContext,
  raw: unknown,
  transaction: TxRunner = (work) => getDb().transaction(work),
) {
  const input = collegePromotionExecuteSchema.parse(raw);
  const member = await resolveActingCollege(context, "academics.manage");

  try {
    return await transaction(async (tx: Tx) => {
    const [batch] = await tx.select({
      id: cohorts.id,
      programId: cohorts.programId,
    }).from(cohorts)
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(
        eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId),
      ))
      .where(and(eq(cohorts.id, input.cohortId), eq(programs.id, input.programId)))
      .for("update", { of: cohorts }).limit(1);
    if (!batch) throw new CollegePromotionExecuteError("BATCH_NOT_FOUND");

    const [previous] = await tx.select().from(cohortProgressionState)
      .where(eq(cohortProgressionState.cohortId, batch.id))
      .for("update").limit(1);
    if (!previous || previous.version !== input.expectedVersion)
      throw new CollegePromotionExecuteError("PROMOTION_STALE");

    // Fix membership and enrollment state before authoritative preview.
    await tx.select({ id: learnerProgramEnrollments.id })
      .from(learnerProgramEnrollments)
      .where(eq(learnerProgramEnrollments.cohortId, batch.id))
      .for("update");

    const preview = await previewCollegeBatchPromotionInTransaction(context, {
      cohortId: batch.id,
      programId: batch.programId,
      yearStart: input.yearStart,
    }, tx);
    if (!promotionReady(preview) ||
      preview.batch.version !== input.expectedVersion ||
      preview.plan.targetTermNumber === null ||
      preview.plan.academicYearStart === null)
      throw new CollegePromotionExecuteError("PROMOTION_BLOCKED");
    if (!promotionPreviewMatches(input,preview))
      throw new CollegePromotionExecuteError("PROMOTION_PREVIEW_CHANGED");

    // Deactivate the previous numbered term's teaching assignments before
    // recording progression. An offering of a course also mapped in the new
    // term stays active; those roles are shared with the destination term.
    const previousCourses = await tx.select({ courseId: programTermCourses.courseId })
      .from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .where(and(eq(programTerms.programId, batch.programId),
        eq(programTerms.termNumber, previous.currentTermNumber)));
    const targetCourses = await tx.select({ courseId: programTermCourses.courseId })
      .from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .where(and(eq(programTerms.programId, batch.programId),
        eq(programTerms.termNumber, preview.plan.targetTermNumber)));
    const targetCourseSet = new Set(targetCourses.map(course => course.courseId));
    const oldOnly = previousCourses.map(course => course.courseId)
      .filter(courseId => !targetCourseSet.has(courseId));
    // Shared courses retain authorized teaching links across the destination
    // term; ending these would strand a live offering used by both terms.
    const sharedCourseIds = [...new Set(previousCourses.map(course => course.courseId)
      .filter(courseId => targetCourseSet.has(courseId)))];
    const retainedSharedTeaching = sharedCourseIds.length ? await tx.select({
      id: courseTeachingAssignments.id,
    }).from(courseTeachingAssignments)
      .innerJoin(courseSectionDeliveries,
        eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .where(and(eq(courseOfferings.cohortId, batch.id),
        inArray(courseOfferings.courseId, sharedCourseIds),
        eq(courseOfferings.status, "ACTIVE"),
        isNull(courseSectionDeliveries.endedAt),
        isNull(courseTeachingAssignments.endedAt)))
      .for("update", { of: courseTeachingAssignments }) : [];
    let endedTeachingAssignments = 0;
    if (oldOnly.length) {
      const currentRoles = await tx.select({ id: courseTeachingAssignments.id })
        .from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries,
          eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .where(and(eq(courseOfferings.cohortId, batch.id),
          inArray(courseOfferings.courseId, oldOnly),
          eq(courseOfferings.status, "ACTIVE"),
          isNull(courseSectionDeliveries.endedAt),
          isNull(courseTeachingAssignments.endedAt)))
        .for("update", { of: courseTeachingAssignments });
      if (currentRoles.length) {
        const ended = await tx.update(courseTeachingAssignments).set({
          endedAt: new Date(), updatedAt: new Date(),
        }).where(and(inArray(courseTeachingAssignments.id, currentRoles.map(row => row.id)),
          isNull(courseTeachingAssignments.endedAt)))
          .returning({ id: courseTeachingAssignments.id });
        endedTeachingAssignments = ended.length;
      }
    }
    const targetMappedCourses = targetCourses.length;
    const activeTargetStaff = targetMappedCourses === 0 ? [] :
      await tx.select({ courseId: courseOfferings.courseId })
        .from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries,
          eq(courseSectionDeliveries.id, courseTeachingAssignments.deliveryId))
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .where(and(eq(courseOfferings.cohortId, batch.id),
          inArray(courseOfferings.courseId, [...targetCourseSet]),
          eq(courseOfferings.status, "ACTIVE"),
          isNull(courseTeachingAssignments.endedAt),
          isNull(courseSectionDeliveries.endedAt)))
        .groupBy(courseOfferings.courseId);
    const facultySetupIncomplete = targetMappedCourses === 0 ||
      activeTargetStaff.length < targetCourseSet.size;
    const [updated] = await tx.update(cohortProgressionState).set({
      currentTermNumber: preview.plan.targetTermNumber,
      currentAcademicYearStart: preview.plan.academicYearStart,
      version: sql`${cohortProgressionState.version} + 1`,
      updatedAt: new Date(),
      updatedByUserId: context.user.id,
    }).where(and(
      eq(cohortProgressionState.cohortId, batch.id),
      eq(cohortProgressionState.version, input.expectedVersion),
      eq(cohortProgressionState.currentTermNumber, previous.currentTermNumber),
    )).returning();
    if (!updated || updated.version !== input.expectedVersion + 1)
      throw new CollegePromotionExecuteError("PROMOTION_STALE");

    // DB-0051 AFTER UPDATE trigger owns the immutable progression event.
    // Inserting a second application event would violate its immutability guard.
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_BATCH_PROMOTED,
      organizationId: member.organizationId,
      collegeId: member.collegeId,
      subjectType: "cohort",
      subjectId: batch.id,
      summary: "Batch promoted to next registered term",
      metadata: {
        previousTerm: previous.currentTermNumber,
        newTerm: updated.currentTermNumber,
        version: updated.version,
        academicYearStart: updated.currentAcademicYearStart,
        learnerCount: preview.checkedLearners,
        endedTeachingAssignments,
        retainedSharedTeachingAssignments: retainedSharedTeaching.length,
        facultySetupIncomplete,
      },
    });
    return {
      cohortId: batch.id,
      currentTermNumber: updated.currentTermNumber,
      academicYearStart: updated.currentAcademicYearStart,
      version: updated.version,
      checkedLearners: preview.checkedLearners,
      endedTeachingAssignments,
      retainedSharedTeachingAssignments: retainedSharedTeaching.length,
      facultySetupIncomplete,
      message: `Batch promoted to semester ${updated.currentTermNumber}`,
    };
    });
  } catch (error) {
    if (error instanceof CollegePromotionExecuteError || error instanceof AuthorizationError) throw error;
    // Drizzle wraps database errors. Always inspect the deepest PostgreSQL cause.
    let cause: unknown = error;
    const seen = new Set<unknown>();
    while (cause instanceof Error && "cause" in cause && cause.cause && !seen.has(cause.cause)) {
      seen.add(cause);
      cause = cause.cause;
    }
    const pgCode = (cause as { code?: unknown } | null)?.code;
    if (pgCode === "23514" || pgCode === "23503") {
      throw new CollegePromotionExecuteError("PROMOTION_BLOCKED");
    }
    throw error;
  }
}

import "server-only";

import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohorts, collegeMemberships, departments,
  learnerProgramEnrollments, membershipRoles, programs,
  sectionEnrollments, sections,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  requiresStudentSectionMove,
  studentSectionMemberIdSchema,
  studentSectionMoveSchema,
} from "./college-student-section-move-model";

export class CollegeStudentSectionMoveError extends Error {
  constructor(public readonly code:
    "STUDENT_NOT_FOUND" | "STUDENT_NOT_ACTIVE" | "STUDENT_NOT_ENROLLED" | "CURRENT_CLASS_REQUIRED" |
    "CLASS_NOT_ELIGIBLE" | "CLASS_FULL" | "CLASS_PLACEMENT_CHANGED") {
    super(code);
    this.name = "CollegeStudentSectionMoveError";
  }
}

async function ownAdmin(context: RequestContext) {
  if(isSuperAdmin(context))return resolveActingCollege(context,"academics.manage");
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.manage", {
      organizationId: membership.organizationId, collegeId: membership.collegeId,
    })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    organizationId: membership.organizationId, collegeId: membership.collegeId,
  });
  return membership;
}

async function loadCurrent(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  membershipId: string, collegeId: string,
) {
  const [membership] = await tx.select({
    id: collegeMemberships.id,
    status: collegeMemberships.status,
  }).from(collegeMemberships).where(and(
    eq(collegeMemberships.id, membershipId),
    eq(collegeMemberships.collegeId, collegeId),
  )).for("update").limit(1);
  if (!membership) throw new CollegeStudentSectionMoveError("STUDENT_NOT_FOUND");
  if (membership.status !== "ACTIVE")
    throw new CollegeStudentSectionMoveError("STUDENT_NOT_ACTIVE");
  const [role] = await tx.select({ id: membershipRoles.id })
    .from(membershipRoles).where(and(
      eq(membershipRoles.membershipId, membershipId),
      eq(membershipRoles.role, "LEARNER"),
    )).for("share").limit(1);
  if (!role) throw new CollegeStudentSectionMoveError("STUDENT_NOT_FOUND");
  const [enrollment] = await tx.select({
    id: learnerProgramEnrollments.id,
    cohortId: learnerProgramEnrollments.cohortId,
    programId: learnerProgramEnrollments.programId,
  }).from(learnerProgramEnrollments)
    .innerJoin(programs, eq(programs.id, learnerProgramEnrollments.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .innerJoin(cohorts, and(
      eq(cohorts.id, learnerProgramEnrollments.cohortId),
      eq(cohorts.programId, programs.id),
    ))
    .where(and(
      eq(learnerProgramEnrollments.membershipId, membershipId),
      eq(learnerProgramEnrollments.status, "ACTIVE"),
    )).for("update", { of: learnerProgramEnrollments }).limit(1);
  if (!enrollment) throw new CollegeStudentSectionMoveError("STUDENT_NOT_ENROLLED");
  const placements = await tx.select({
    id: sectionEnrollments.id,
    sectionId: sectionEnrollments.sectionId,
    academicPeriodId: sectionEnrollments.academicPeriodId,
  }).from(sectionEnrollments)
    .where(and(
      eq(sectionEnrollments.learnerEnrollmentId, enrollment.id),
      eq(sectionEnrollments.status, "ACTIVE"),
    )).for("update");
  const placement = placements[0];
  if (placements.length !== 1 || !placement) throw new CollegeStudentSectionMoveError("CURRENT_CLASS_REQUIRED");
  return { enrollment, placement };
}

export async function collegeStudentSectionOptions(context: RequestContext, rawMembershipId: unknown) {
  const membershipId = studentSectionMemberIdSchema.parse(rawMembershipId);
  const own = await ownAdmin(context);
  return getDb().transaction(async tx => {
    const { enrollment, placement } = await loadCurrent(tx, membershipId, own.collegeId);
    const options = await tx.select({
      id: sections.id, name: sections.name,
      capacity: sections.capacity,
    }).from(sections)
      .innerJoin(academicPeriods, and(
        eq(academicPeriods.id, sections.academicPeriodId),
        eq(academicPeriods.collegeId, own.collegeId),
      ))
      .where(and(
        eq(sections.cohortId, enrollment.cohortId),
        eq(sections.academicPeriodId, placement.academicPeriodId),
        eq(sections.status, "ACTIVE"),
        eq(academicPeriods.status, "ACTIVE"),
      ));
    return { enrollmentId: enrollment.id, current: placement,
      options: options.sort((a, b) => a.name.localeCompare(b.name)) };
  });
}

export async function moveCollegeStudentSection(
  context: RequestContext, rawMembershipId: unknown, raw: unknown,
) {
  const membershipId = studentSectionMemberIdSchema.parse(rawMembershipId);
  const input = studentSectionMoveSchema.parse(raw);
  const own = await ownAdmin(context);
  return getDb().transaction(async tx => {
    const { enrollment, placement } = await loadCurrent(tx, membershipId, own.collegeId);
    if (placement.id !== input.expectedSectionEnrollmentId ||
      !requiresStudentSectionMove(placement.sectionId, input.sectionId))
      throw new CollegeStudentSectionMoveError("CLASS_PLACEMENT_CHANGED");

    const [target] = await tx.select({
      id: sections.id, name: sections.name, capacity: sections.capacity,
      cohortId: sections.cohortId,
      periodId: sections.academicPeriodId,
      status: sections.status,
      periodStatus: academicPeriods.status,
    }).from(sections).innerJoin(academicPeriods, and(
      eq(academicPeriods.id, sections.academicPeriodId),
      eq(academicPeriods.collegeId, own.collegeId),
    )).where(eq(sections.id, input.sectionId)).for("update", { of: sections }).limit(1);
    if (!target || target.status !== "ACTIVE" ||
      target.periodStatus !== "ACTIVE" ||
      target.cohortId !== enrollment.cohortId ||
      target.periodId !== placement.academicPeriodId)
      throw new CollegeStudentSectionMoveError("CLASS_NOT_ELIGIBLE");

    if (target.capacity !== null) {
      const [capacity] = await tx.select({ total: count() })
        .from(sectionEnrollments).where(and(
          eq(sectionEnrollments.sectionId, target.id),
          eq(sectionEnrollments.status, "ACTIVE"),
        ));
      if ((capacity?.total ?? 0) >= target.capacity)
        throw new CollegeStudentSectionMoveError("CLASS_FULL");
    }
    const now = new Date();
    const [moved] = await tx.update(sectionEnrollments).set({
      status: "MOVED", endedAt: now, updatedAt: now,
    }).where(and(eq(sectionEnrollments.id, placement.id),
      eq(sectionEnrollments.status, "ACTIVE"))).returning();
    if (!moved) throw new CollegeStudentSectionMoveError("CLASS_PLACEMENT_CHANGED");
    const [created] = await tx.insert(sectionEnrollments).values({
      learnerEnrollmentId: enrollment.id,
      sectionId: target.id,
      academicPeriodId: target.periodId,
    }).returning();
    if (!created) throw new CollegeStudentSectionMoveError("CLASS_PLACEMENT_CHANGED");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_LEARNER_ENROLLED,
      organizationId: own.organizationId, collegeId: own.collegeId,
      subjectType: "learner_program_enrollment", subjectId: enrollment.id,
      summary: isSuperAdmin(context)?"Super Admin moved learner between classes":"College Admin moved learner between classes",
      metadata: { membershipId, fromSectionId: placement.sectionId,
        toSectionId: target.id, oldPlacementId: moved.id,
        newPlacementId: created.id, action: "SECTION_MOVE",
        learnerProgramEnrollmentId: enrollment.id,
        legacyCurrentClassId: placement.sectionId,
        legacyNextClassId: target.id,
        academicPeriodId: target.periodId,
        // Identity/profile updates and closure belong to the membership
        // lifecycle; move preserves the historical enrollment record.
      },
    });
    return { placement: created, previousPlacementId: moved.id };
  });
}

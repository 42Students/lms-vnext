import "server-only";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { academicPeriods, cohorts, departments, learnerProgramEnrollments, programs, sectionEnrollments, sections,
  collegeMemberships, membershipRoles, users } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";

export async function placeImportedLearnerInSection(context: RequestContext, enrollmentId: string, sectionId: string) {
  const member = await resolveActingCollege(context,"academics.manage");
  requirePermission(context, "academics.manage", {collegeId: member.collegeId, organizationId: member.organizationId});
  return getDb().transaction(async tx => {
    const [target] = await tx.select({
      id: sections.id, cohortId: sections.cohortId, periodId: sections.academicPeriodId,
      status: sections.status, capacity: sections.capacity, periodStatus: academicPeriods.status,
    }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .innerJoin(academicPeriods, eq(academicPeriods.id, sections.academicPeriodId))
      .where(and(eq(sections.id, sectionId), eq(departments.collegeId, member.collegeId),
        eq(academicPeriods.collegeId, member.collegeId)))
      .for("update", {of: sections}).limit(1);
    if (!target || target.status !== "ACTIVE" || target.periodStatus === "CLOSED")
      throw Error("CLASS_UNAVAILABLE");
    // A session captured before College Admin role revocation cannot write to
    // an existing academic section after that actor has lost permission.
    await assertPersistedPlatformPermission(tx,context,"academics.manage",{
      collegeId:member.collegeId,organizationId:member.organizationId,
    });
    const [enrollment] = await tx.select({id:learnerProgramEnrollments.id,cohortId:learnerProgramEnrollments.cohortId})
      .from(learnerProgramEnrollments)
      .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER")))
      .where(and(eq(learnerProgramEnrollments.id,enrollmentId),
        eq(learnerProgramEnrollments.status,"ACTIVE"),
        eq(collegeMemberships.collegeId,member.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"))).for("update",{of:learnerProgramEnrollments}).limit(1);
    if (!enrollment || enrollment.cohortId !== target.cohortId) throw Error("CLASS_BATCH_MISMATCH");
    const [existing] = await tx.select({id:sectionEnrollments.id}).from(sectionEnrollments)
      .where(and(eq(sectionEnrollments.learnerEnrollmentId,enrollment.id),
        eq(sectionEnrollments.academicPeriodId,target.periodId),
        eq(sectionEnrollments.status,"ACTIVE"))).limit(1);
    if (existing) throw Error("ALREADY_PLACED_IN_PERIOD");
    if (target.capacity !== null) {
      const [occupied] = await tx.select({total:count()}).from(sectionEnrollments)
        .where(and(eq(sectionEnrollments.sectionId,sectionId),eq(sectionEnrollments.status,"ACTIVE")));
      if ((occupied?.total ?? 0) >= target.capacity) throw Error("CLASS_FULL");
    }
    const [created] = await tx.insert(sectionEnrollments).values({
      learnerEnrollmentId:enrollment.id, sectionId, academicPeriodId:target.periodId,
    }).returning({id:sectionEnrollments.id});
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED, collegeId:member.collegeId,
      organizationId:member.organizationId, subjectType:"section_enrollment", subjectId:created.id,
      summary:"Student registered into a class", metadata:{sectionId,learnerEnrollmentId:enrollment.id},
    });
    return created;
  });
}

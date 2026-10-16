import "server-only";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, departments, learnerProgramEnrollments, programs, sectionEnrollments, sections } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

export async function placeImportedLearnerInSection(context: RequestContext, enrollmentId: string, sectionId: string) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE") throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
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
    const [enrollment] = await tx.select({id:learnerProgramEnrollments.id,cohortId:learnerProgramEnrollments.cohortId})
      .from(learnerProgramEnrollments).where(and(eq(learnerProgramEnrollments.id,enrollmentId),
        eq(learnerProgramEnrollments.status,"ACTIVE"))).for("update").limit(1);
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

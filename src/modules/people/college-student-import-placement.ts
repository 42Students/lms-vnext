import "server-only";
import { and, count, eq } from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import { academicPeriods, cohorts, departments, learnerProgramEnrollments, programs, sectionEnrollments, sections,
  collegeMemberships, membershipRoles, users } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AcademicsServiceError,postgresConstraintName} from "@/modules/academics/errors";

export async function placeImportedLearnerInSection(context: RequestContext, enrollmentId: string, sectionId: string) {
  const member = await resolveActingCollege(context,"academics.manage");
  requirePermission(context, "academics.manage", {collegeId: member.collegeId, organizationId: member.organizationId});
  const cohortStartPeriod=alias(academicPeriods,"college_import_start_period");
  try { return await getDb().transaction(async tx => {
    const [target] = await tx.select({
      id: sections.id, cohortId: sections.cohortId, periodId: sections.academicPeriodId,
      status: sections.status, capacity: sections.capacity, periodStatus: academicPeriods.status,
    }).from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .innerJoin(academicPeriods, eq(academicPeriods.id, sections.academicPeriodId))
      .innerJoin(cohortStartPeriod,eq(cohortStartPeriod.id,cohorts.startPeriodId))
      .where(and(eq(sections.id, sectionId), eq(departments.collegeId, member.collegeId),
        eq(academicPeriods.collegeId, member.collegeId),
        eq(cohortStartPeriod.collegeId,member.collegeId)))
      .for("update", {of: sections}).limit(1);
    if (!target || target.status !== "ACTIVE" || target.periodStatus === "CLOSED")
      throw new AcademicsServiceError("CLASS_UNAVAILABLE");
    // A session captured before College Admin role revocation cannot write to
    // an existing academic section after that actor has lost permission.
    await assertPersistedPlatformPermission(tx,context,"academics.manage",{
      collegeId:member.collegeId,organizationId:member.organizationId,
    });
    const [enrollment] = await tx.select({id:learnerProgramEnrollments.id,cohortId:learnerProgramEnrollments.cohortId})
      .from(learnerProgramEnrollments)
      // A learner can have independently FK-valid but inconsistent program
      // and cohort IDs. Never admit a forged enrollment into a real class.
      .innerJoin(cohorts,and(
        eq(cohorts.id,learnerProgramEnrollments.cohortId),
        eq(cohorts.programId,learnerProgramEnrollments.programId)))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(
        eq(departments.id,programs.departmentId),
        eq(departments.collegeId,member.collegeId)))
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
    if (!enrollment || enrollment.cohortId !== target.cohortId) throw new AcademicsServiceError("CLASS_BATCH_MISMATCH");
    const [existing] = await tx.select({id:sectionEnrollments.id}).from(sectionEnrollments)
      .where(and(eq(sectionEnrollments.learnerEnrollmentId,enrollment.id),
        eq(sectionEnrollments.academicPeriodId,target.periodId),
        eq(sectionEnrollments.status,"ACTIVE"))).limit(1);
    if (existing) throw new AcademicsServiceError("ALREADY_PLACED_IN_PERIOD");
    if (target.capacity !== null) {
      const [occupied] = await tx.select({total:count()}).from(sectionEnrollments)
        .where(and(eq(sectionEnrollments.sectionId,sectionId),eq(sectionEnrollments.status,"ACTIVE")));
      if ((occupied?.total ?? 0) >= target.capacity) throw new AcademicsServiceError("CLASS_FULL");
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
  }); } catch(error){
    // Two simultaneous class submissions can race on separate section rows.
    // PostgreSQL's unique index is authoritative; return the same friendly
    // conflict as the ordinary pre-insert duplicate check, never a 500/SQL.
    if(postgresConstraintName(error)==="section_enrollments_active_period_uq")
      throw new AcademicsServiceError("ALREADY_PLACED_IN_PERIOD");
    throw error;
  }
}

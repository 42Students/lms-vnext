import "server-only";
import { and, eq, gt, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, collegeMemberships, departments, lectureHalls, membershipRoles, programs, sectionScheduleEvents, sections } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { expandIstSessions, findPreviewConflicts } from "./college-recurring-preview-model";
import { collegeRecurringExecuteSchema, recurringExecutionSummary } from "./college-recurring-execute-model";

export class CollegeRecurringExecutionError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "STALE_SECTION" | "SCHEDULE_CONFLICT") {
    super(code); this.name = "CollegeRecurringExecutionError";
  }
}
export async function executeCollegeRecurringSchedule(context: RequestContext, raw: unknown) {
  const input=collegeRecurringExecuteSchema.parse(raw);
  const member=context.membership;
  if (!member || member.status!=="ACTIVE" || !hasMembershipRole(context,"COLLEGE_ADMIN") ||
    !can(context,"academics.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
    throw new AuthorizationError("academics.manage");
  requirePermission(context,"academics.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  const slots=expandIstSessions(input);
  if (!slots.length) throw new CollegeRecurringExecutionError("SCHEDULE_CONFLICT");
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${member.collegeId}),hashtext(${input.sectionId}))`);
    const [section]=await tx.select({
      id:sections.id,status:sections.status,periodStart:academicPeriods.startDate,periodEnd:academicPeriods.endDate,
    }).from(sections)
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,member.collegeId)))
      .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),eq(academicPeriods.collegeId,member.collegeId)))
      .where(and(eq(sections.id,input.sectionId),
        sql`date_trunc('milliseconds',${sections.updatedAt}) = ${input.expectedSectionUpdatedAt}::timestamptz`))
      .for("update",{of:sections}).limit(1);
    if (!section) {
      const [visible]=await tx.select({id:sections.id}).from(sections)
        .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
        .innerJoin(programs,eq(programs.id,cohorts.programId))
        .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,member.collegeId)))
        .where(eq(sections.id,input.sectionId)).limit(1);
      throw new CollegeRecurringExecutionError(visible?"STALE_SECTION":"NOT_FOUND");
    }
    if (section.status!=="ACTIVE" || input.from<section.periodStart || input.to>section.periodEnd)
      throw new CollegeRecurringExecutionError("NOT_FOUND");
    if (input.lectureHallId) {
      const [hall]=await tx.select({id:lectureHalls.id}).from(lectureHalls)
        .where(and(eq(lectureHalls.id,input.lectureHallId),eq(lectureHalls.collegeId,member.collegeId),eq(lectureHalls.status,"ACTIVE")))
        .for("share").limit(1);
      if (!hall) throw new CollegeRecurringExecutionError("NOT_FOUND");
    }
    if (input.facultyMembershipId) {
      const [faculty]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"FACULTY")))
        .where(and(eq(collegeMemberships.id,input.facultyMembershipId),eq(collegeMemberships.collegeId,member.collegeId),eq(collegeMemberships.status,"ACTIVE")))
        .for("share",{of:collegeMemberships}).limit(1);
      if (!faculty) throw new CollegeRecurringExecutionError("NOT_FOUND");
    }
    const first=new Date(slots[0].startsAt),last=new Date(slots[slots.length-1].endsAt);
    const existing=await tx.select({
      sectionId:sectionScheduleEvents.sectionId,
      facultyMembershipId:sectionScheduleEvents.facultyMembershipId,lectureHallId:sectionScheduleEvents.lectureHallId,
      startsAt:sectionScheduleEvents.startsAt,endsAt:sectionScheduleEvents.endsAt,
    }).from(sectionScheduleEvents).where(and(
      eq(sectionScheduleEvents.status,"SCHEDULED"),lt(sectionScheduleEvents.startsAt,last),
      gt(sectionScheduleEvents.endsAt,first),
      or(eq(sectionScheduleEvents.sectionId,input.sectionId),
        input.facultyMembershipId?eq(sectionScheduleEvents.facultyMembershipId,input.facultyMembershipId):undefined,
        input.lectureHallId?eq(sectionScheduleEvents.lectureHallId,input.lectureHallId):undefined),
    ));
    if(slots.some(slot=>findPreviewConflicts(slot,input,existing).length))
      throw new CollegeRecurringExecutionError("SCHEDULE_CONFLICT");
    const created=await tx.insert(sectionScheduleEvents).values(slots.map(slot=>({
      sectionId:input.sectionId,title:input.title,
      startsAt:new Date(slot.startsAt),endsAt:new Date(slot.endsAt),
      facultyMembershipId:input.facultyMembershipId??null,lectureHallId:input.lectureHallId??null,
    }))).returning({id:sectionScheduleEvents.id});
    // Advance the optimistic section token after creating this series.
    await tx.update(sections).set({
      updatedAt: sql<Date>`greatest(${sections.updatedAt} + interval '1 millisecond', clock_timestamp())`,
    })
      .where(eq(sections.id,section.id));
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED,
      organizationId:member.organizationId,collegeId:member.collegeId,
      subjectType:"section",subjectId:section.id,
      summary:"College Admin created recurring class sessions",
      metadata:{count:created.length,from:input.from,to:input.to},
    });
    return {...recurringExecutionSummary(created.length,slots.length),sessionIds:created.map(row=>row.id)};
  });
}

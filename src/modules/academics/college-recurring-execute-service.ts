import "server-only";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { academicPeriods, cohorts, collegeMemberships, departments, lectureHalls, membershipRoles, programs, sectionScheduleEvents, sections, courseSectionDeliveries, courseOfferings, courses, sectionScheduleEventCourses } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { expandIstSessions, findPreviewConflicts, type PreviewConflict } from "./college-recurring-preview-model";
import { collegeRecurringExecuteSchema, recurringExecutionSummary } from "./college-recurring-execute-model";

export class CollegeRecurringExecutionError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "STALE_SECTION" | "SCHEDULE_CONFLICT") {
    super(code); this.name = "CollegeRecurringExecutionError";
  }
}
export async function executeCollegeRecurringSchedule(context: RequestContext, raw: unknown) {
  const input=collegeRecurringExecuteSchema.parse(raw);
  const member = await resolveActingCollege(context, "academics.manage");
  const slots=expandIstSessions(input);
  if (!slots.length) throw new CollegeRecurringExecutionError("SCHEDULE_CONFLICT");
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${member.collegeId}),hashtext(${input.sectionId}))`);
    const [section]=await tx.select({
      id:sections.id,status:sections.status,periodStart:academicPeriods.startDate,periodEnd:academicPeriods.endDate,
      periodStatus:academicPeriods.status,
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
    if (section.status!=="ACTIVE" || section.periodStatus==="CLOSED" ||
      input.from<section.periodStart || input.to>section.periodEnd)
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
    if (input.deliveryId) {
      const [delivery] = await tx.select({ id: courseSectionDeliveries.id })
        .from(courseSectionDeliveries)
        .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
        .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
        .innerJoin(departments, eq(departments.id, courses.departmentId))
        .where(and(eq(courseSectionDeliveries.id, input.deliveryId),
          eq(courseSectionDeliveries.sectionId, input.sectionId),
          eq(departments.collegeId, member.collegeId),
          eq(courseOfferings.status, "ACTIVE"), eq(courses.status, "ACTIVE"),
          isNull(courseSectionDeliveries.endedAt))).for("share",{of:courseSectionDeliveries}).limit(1);
      if (!delivery) throw new CollegeRecurringExecutionError("NOT_FOUND");
    }
    const firstSlot=slots[0];
    const lastSlot=slots[slots.length-1];
    if (!firstSlot || !lastSlot) throw new CollegeRecurringExecutionError("SCHEDULE_CONFLICT");
    const first=new Date(firstSlot.startsAt),last=new Date(lastSlot.endsAt);
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
    const resolved = slots.map(slot => ({
      ...slot, conflicts: findPreviewConflicts(slot, input, existing),
    }));
    const free = resolved.filter(slot => slot.conflicts.length === 0);
    const skipped: Array<{localDate:string;reasons:PreviewConflict[];error?:string}> =
      resolved.filter(slot => slot.conflicts.length > 0).map(slot => ({
        localDate: slot.localDate, reasons: slot.conflicts,
      }));
    if (!free.length) throw new CollegeRecurringExecutionError("SCHEDULE_CONFLICT");
    const created: Array<{id:string;localDate:string}> = [];
    // A nested Drizzle transaction uses a PostgreSQL SAVEPOINT. A unique or
    // concurrent schedule constraint on one occurrence must not invalidate
    // previously inserted dates. Keep the selected college's advisory lock,
    // section CAS and final audit in the surrounding atomic transaction.
    for (const slot of free) {
      try {
        const saved = await tx.transaction(async occurrenceTx => {
          const [event] = await occurrenceTx.insert(sectionScheduleEvents).values({
            sectionId: input.sectionId, title: input.title,
            startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt),
            facultyMembershipId: input.facultyMembershipId ?? null,
            lectureHallId: input.lectureHallId ?? null,
          }).returning({id:sectionScheduleEvents.id});
          if (!event) throw new Error("Occurrence was not saved");
          if (input.deliveryId) {
            await occurrenceTx.insert(sectionScheduleEventCourses).values({
              scheduleEventId:event.id,deliveryId:input.deliveryId,
            });
          }
          return event;
        });
        created.push({id:saved.id,localDate:slot.localDate});
      } catch {
        // Report a date-local retryable failure; never render raw DB details.
        skipped.push({localDate:slot.localDate,reasons:[],
          error:"Could not save this date. Check conflicts and retry."});
      }
    }
    if (!created.length) throw new CollegeRecurringExecutionError("SCHEDULE_CONFLICT");
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
      metadata:{count:created.length,skippedCount:skipped.length,
        createdDates:created.map(item=>item.localDate),
        failedDates:skipped.map(item=>item.localDate),
        from:input.from,to:input.to,deliveryId:input.deliveryId??null},
    });
    return {...recurringExecutionSummary(created.length,slots.length), skipped,
      sessionIds:created.map(row=>row.id),
      createdDates:created.map(row=>({localDate:row.localDate,sessionId:row.id}))};
  });
}

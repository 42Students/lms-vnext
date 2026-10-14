import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {attendanceRecords,attendanceSessions,academicPeriods,cohorts,
  departments,lectureHalls,programs,sectionScheduleEventCourses,
  sectionScheduleEvents,sections} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {collegeHallCancelSchema} from "./college-hall-cancel-model";
export class CollegeHallCancelError extends Error{
  constructor(public readonly code:"HALL_SESSION_NOT_FOUND"|"HALL_SESSION_STALE"|
    "HALL_SESSION_STARTED"|"HALL_SESSION_HAS_EVIDENCE"){
    super(code);this.name="CollegeHallCancelError";
  }
}
export async function cancelCollegeHallBooking(context:RequestContext,rawHallId:unknown,
  rawSessionId:unknown,raw:unknown){
  const hallId=z.string().uuid().parse(rawHallId);
  const eventId=z.string().uuid().parse(rawSessionId);
  const input=collegeHallCancelSchema.parse(raw);
  const actor=context.membership;
  if(!actor||actor.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    !can(context,"academics.manage",{collegeId:actor.collegeId,organizationId:actor.organizationId}))
    throw new AuthorizationError("academics.manage");
  requirePermission(context,"academics.manage",{collegeId:actor.collegeId,organizationId:actor.organizationId});
  return getDb().transaction(async tx=>{
    const [hall]=await tx.select({id:lectureHalls.id}).from(lectureHalls)
      .where(and(eq(lectureHalls.id,hallId),eq(lectureHalls.collegeId,actor.collegeId)))
      .for("update").limit(1);
    if(!hall)throw new CollegeHallCancelError("HALL_SESSION_NOT_FOUND");
    const [event]=await tx.select({
      id:sectionScheduleEvents.id,title:sectionScheduleEvents.title,
      startsAt:sectionScheduleEvents.startsAt,status:sectionScheduleEvents.status,
      sectionId:sectionScheduleEvents.sectionId,
    }).from(sectionScheduleEvents)
      .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),
        eq(departments.collegeId,actor.collegeId)))
      .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
        eq(academicPeriods.collegeId,actor.collegeId)))
      .where(and(eq(sectionScheduleEvents.id,eventId),
        eq(sectionScheduleEvents.lectureHallId,hallId)))
      .for("update",{of:sectionScheduleEvents}).limit(1);
    if(!event)throw new CollegeHallCancelError("HALL_SESSION_NOT_FOUND");
    if(event.status!=="SCHEDULED")throw new CollegeHallCancelError("HALL_SESSION_STALE");
    const [token]=await tx.select({id:sectionScheduleEvents.id}).from(sectionScheduleEvents)
      .where(and(eq(sectionScheduleEvents.id,event.id),
        sql`date_trunc('milliseconds',${sectionScheduleEvents.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`))
      .limit(1);
    if(!token)throw new CollegeHallCancelError("HALL_SESSION_STALE");
    if(event.startsAt.getTime()<=Date.now())
      throw new CollegeHallCancelError("HALL_SESSION_STARTED");
    const [[attendance],[record],[linkedCourse]] = await Promise.all([
      tx.select({id:attendanceSessions.scheduleEventId}).from(attendanceSessions)
        .where(eq(attendanceSessions.scheduleEventId,eventId)).limit(1),
      tx.select({id:attendanceRecords.id}).from(attendanceRecords)
        .where(eq(attendanceRecords.scheduleEventId,eventId)).limit(1),
      tx.select({id:sectionScheduleEventCourses.scheduleEventId}).from(sectionScheduleEventCourses)
        .where(eq(sectionScheduleEventCourses.scheduleEventId,eventId)).limit(1),
    ]);
    if(attendance||record||linkedCourse)
      throw new CollegeHallCancelError("HALL_SESSION_HAS_EVIDENCE");
    const [updated]=await tx.update(sectionScheduleEvents).set({
      status:"CANCELLED",
      updatedAt:sql<Date>`greatest(${sectionScheduleEvents.updatedAt}+interval '1 millisecond',clock_timestamp())`,
    }).where(and(eq(sectionScheduleEvents.id,eventId),
      eq(sectionScheduleEvents.status,"SCHEDULED")))
      .returning({id:sectionScheduleEvents.id,status:sectionScheduleEvents.status});
    if(!updated)throw new CollegeHallCancelError("HALL_SESSION_STALE");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED,
      collegeId:actor.collegeId,organizationId:actor.organizationId,
      subjectType:"section",subjectId:event.sectionId,
      summary:"College Admin cancelled a scheduled lecture hall session",
      metadata:{hallId,eventId,reason:input.reason,previousStatus:"SCHEDULED"},
    });
    return updated;
  });
}

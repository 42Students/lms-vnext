import "server-only";
import {randomUUID} from "node:crypto";
import {and,eq,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  attendanceSessions,lectureHalls,sections,sectionScheduleEventCourses,sectionScheduleEvents,
} from "@/db/schema";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {CoursesServiceError} from "@/modules/courses/errors";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import {assertPersistedFacultyTeachingMutation} from "@/modules/courses/faculty-persisted-teaching-guard";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {facultyAttendanceScheduleParamsSchema,facultyAttendanceScheduleSchema,facultyScheduleFieldsChanged}
  from "./faculty-schedule-mutation-model";

/** Configurable near-now booking grace (legacy default: five minutes). */
function bookingGraceMs() {
  const minutes=Number(process.env.FACULTY_SCHEDULE_BOOKING_GRACE_MINUTES ?? "5");
  if(!Number.isInteger(minutes)||minutes<0||minutes>30)
    throw new Error("INVALID_FACULTY_SCHEDULE_BOOKING_GRACE");
  return minutes*60_000;
}

/** Scoped course Session CREATE and RESCHEDULE. Marked sessions cannot move. */
export async function commandFacultyAttendanceSchedule(
  context:RequestContext,rawParams:unknown,rawInput:unknown,
){
  const {deliveryId}=facultyAttendanceScheduleParamsSchema.parse(rawParams);
  const input=facultyAttendanceScheduleSchema.parse(rawInput);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const assigned=await listFacultyCourseDeliveries(context);
  const owned=assigned.find(d=>d.deliveryId===deliveryId);
  if(!owned||owned.academicPeriodStatus==="CLOSED")
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const startsAt=new Date(input.startsAt),endsAt=new Date(input.endsAt);
  const lower=Date.parse(owned.periodStartDate+"T00:00:00+05:30");
  const upper=Date.parse(owned.periodEndDate+"T00:00:00+05:30")+86400000;
  if(startsAt<new Date(lower)||endsAt>new Date(upper))
    throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
  if(startsAt.getTime()<Date.now()-bookingGraceMs())
    throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
  return getDb().transaction(async tx=>{
    // Match the College Admin schedule writer's tenant lock. This is the
    // serialization point for bookings created through either role, including
    // different sections competing for one lecture hall.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${membership.collegeId}))`);
    // Lock the actor AND the Section: prevent concurrent conflicts even
    // when co-teachers schedule the same Section at the same instant.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"faculty-schedule:"+membership.id}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"section-schedule:"+owned.sectionId}))`);
    await assertPersistedFacultyTeachingMutation(tx,context,deliveryId,{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    });
    // Recheck time under the same locked transaction: a paused request must
    // not create a class that has since moved beyond the booking grace.
    if(startsAt.getTime()<Date.now()-bookingGraceMs())
      throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
    let current:typeof sectionScheduleEvents.$inferSelect|undefined;
    if(input.action==="RESCHEDULE"){
      [current]=await tx.select({event:sectionScheduleEvents}).from(sectionScheduleEvents)
        .innerJoin(sectionScheduleEventCourses,
          eq(sectionScheduleEventCourses.scheduleEventId,sectionScheduleEvents.id))
        .where(and(
          eq(sectionScheduleEvents.id,input.sessionId),
          eq(sectionScheduleEventCourses.deliveryId,deliveryId),
          eq(sectionScheduleEvents.sectionId,owned.sectionId),
          eq(sectionScheduleEvents.facultyMembershipId,membership.id),
          eq(sectionScheduleEvents.status,"SCHEDULED"),
        )).for("update").limit(1).then(rows=>rows.map(r=>r.event));
      if(!current)throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
      if(current.updatedAt.getTime()!==new Date(input.expectedUpdatedAt).getTime())
        throw new CoursesServiceError("FACULTY_ATTENDANCE_SCHEDULE_STALE_VERSION");
      const [marked]=await tx.select({status:attendanceSessions.status})
        .from(attendanceSessions)
        .where(eq(attendanceSessions.scheduleEventId,current.id)).limit(1);
      if(marked?.status==="MARKED")throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
      if(!facultyScheduleFieldsChanged(current,input))
        throw new CoursesServiceError("FACULTY_ATTENDANCE_SCHEDULE_NO_CHANGE");
    }
    // ClassScheduleDTO.classId -> sectionId, facultyId -> membership.id,
    // courseId/courseSlug -> the assigned deliveryId, hallId -> lectureHallId.
    // The existing sectionScheduleEventCourses FK preserves attendance links.
    // Never treat a free-text location as a reservable hall.
    const lectureHallId = input.lectureHallId === undefined
      ? (current?.lectureHallId ?? null) : input.lectureHallId;
    if (lectureHallId) {
      const [hall] = await tx.select({capacity:lectureHalls.capacity})
        .from(lectureHalls).where(and(
          eq(lectureHalls.id,lectureHallId),
          eq(lectureHalls.collegeId,membership.collegeId),
          eq(lectureHalls.status,"ACTIVE"),
        )).for("update").limit(1);
      const [section] = await tx.select({capacity:sections.capacity})
        .from(sections).where(eq(sections.id,owned.sectionId)).limit(1);
      if (!hall || (section?.capacity != null && section.capacity > hall.capacity))
        throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
    }
    const conflict=await tx.select({
      id:sectionScheduleEvents.id,
      sectionId:sectionScheduleEvents.sectionId,
      facultyMembershipId:sectionScheduleEvents.facultyMembershipId,
      lectureHallId:sectionScheduleEvents.lectureHallId,
    })
      .from(sectionScheduleEvents)
      .where(and(
        eq(sectionScheduleEvents.status,"SCHEDULED"),
        or(
          eq(sectionScheduleEvents.sectionId,owned.sectionId),
          eq(sectionScheduleEvents.facultyMembershipId,membership.id),
          lectureHallId?eq(sectionScheduleEvents.lectureHallId,lectureHallId):undefined,
        ),
        sql`${sectionScheduleEvents.startsAt} < ${endsAt}`,
        sql`${sectionScheduleEvents.endsAt} > ${startsAt}`,
        current?ne(sectionScheduleEvents.id,current.id):undefined,
      )).limit(1);
    if(conflict.length){
      // This existing API has one public conflict code. Never disclose other
      // faculty/section details; the caller can refresh its scoped schedule.
      throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
    }
    let saved:typeof sectionScheduleEvents.$inferSelect|undefined;
    const now=new Date(Math.max(Date.now(),(current?.updatedAt.getTime()??0)+1));
    if(input.action==="CREATE"){
      [saved]=await tx.insert(sectionScheduleEvents).values({
        sectionId:owned.sectionId,facultyMembershipId:membership.id,
        lectureHallId,
        title:input.title,description:input.description,location:input.location,
        startsAt,endsAt,
      }).returning();
      if(!saved)throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
      await tx.insert(sectionScheduleEventCourses).values({
        scheduleEventId:saved.id,deliveryId,
      });
    }else{
      [saved]=await tx.update(sectionScheduleEvents).set({
        title:input.title,description:input.description,location:input.location,
        ...(input.lectureHallId !== undefined ? {lectureHallId} : {}),
        ...(startsAt.getTime()!==current!.startsAt.getTime()?{startsAt}:{}),
        ...(endsAt.getTime()!==current!.endsAt.getTime()?{endsAt}:{}),
        updatedAt:now,
      }).where(and(
        eq(sectionScheduleEvents.id,current!.id),
        eq(sectionScheduleEvents.sectionId,owned.sectionId),
        eq(sectionScheduleEvents.status,"SCHEDULED"),
        sql`date_trunc('milliseconds', ${sectionScheduleEvents.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
      )).returning();
    }
    if(!saved)throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.COURSES_CLASS_SCHEDULED,
      collegeId:membership.collegeId,organizationId:membership.organizationId,
      subjectType:"attendance_session",subjectId:saved.id,
      subjectLabel:saved.title,
      summary:input.action==="CREATE"?"Faculty attendance session scheduled":
        "Faculty attendance session rescheduled",
      metadata:{deliveryId,sessionId:saved.id,
        action:input.action,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString(),
        lectureHallId,sectionId:owned.sectionId,facultyMembershipId:membership.id},
      groupKey:"attendance-session:"+saved.id,
      dedupeKey:"faculty-session:"+saved.id+":"+input.action+":"+randomUUID(),
    });
    return {id:saved.id,status:saved.status,updatedAt:saved.updatedAt,
      sectionId:owned.sectionId,deliveryId,facultyMembershipId:membership.id,
      lectureHallId:saved.lectureHallId};
  });
}

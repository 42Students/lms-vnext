import "server-only";
import {and,eq,gt,lt,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,cohorts,collegeMemberships,departments,lectureHalls,membershipRoles,
  programs,sectionScheduleEvents,sections,users} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {collegeHallBookingSchema,hallBookingWindow,hallCanFitClass,hallFacultyIsEligible} from "./college-hall-booking-model";
export class CollegeHallBookingError extends Error{
  constructor(public readonly code:"HALL_NOT_FOUND"|"SECTION_NOT_FOUND"|"SECTION_STALE"|
    "SECTION_PERIOD_INVALID"|"HALL_CAPACITY_CONFLICT"|"FACULTY_NOT_FOUND"|"SCHEDULE_CONFLICT"){
    super(code);this.name="CollegeHallBookingError";
  }
}
export async function createCollegeHallBooking(context:RequestContext,rawHallId:unknown,raw:unknown){
  const hallId=z.string().uuid().parse(rawHallId),input=collegeHallBookingSchema.parse(raw);
  const member=context.membership;
  if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    !can(context,"academics.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
    throw new AuthorizationError("academics.manage");
  requirePermission(context,"academics.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  const {startsAt,endsAt}=hallBookingWindow(input);
  return getDb().transaction(async tx=>{
    // Lock Section then Hall, matching the recurring-series writer. Concurrent
    // bookings against this hall are serialized until overlap checks finish.
    const [section]=await tx.select({
      id:sections.id,status:sections.status,capacity:sections.capacity,
      periodStart:academicPeriods.startDate,periodEnd:academicPeriods.endDate,
      periodStatus:academicPeriods.status,
    }).from(sections)
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),
        eq(departments.collegeId,member.collegeId)))
      .innerJoin(academicPeriods,and(eq(academicPeriods.id,sections.academicPeriodId),
        eq(academicPeriods.collegeId,member.collegeId)))
      .where(eq(sections.id,input.sectionId)).for("update",{of:sections}).limit(1);
    if(!section||section.status!=="ACTIVE")
      throw new CollegeHallBookingError("SECTION_NOT_FOUND");
    const [token]=await tx.select({id:sections.id}).from(sections).where(and(
      eq(sections.id,section.id),
      sql`date_trunc('milliseconds',${sections.updatedAt}) = ${input.expectedSectionUpdatedAt}::timestamptz`,
    )).limit(1);
    if(!token)throw new CollegeHallBookingError("SECTION_STALE");
    // Planned periods may be scheduled in advance; closed periods are immutable.
    if(section.periodStatus==="CLOSED"||input.date<section.periodStart||input.date>section.periodEnd)
      throw new CollegeHallBookingError("SECTION_PERIOD_INVALID");
    const [hall]=await tx.select({id:lectureHalls.id,capacity:lectureHalls.capacity})
      .from(lectureHalls).where(and(eq(lectureHalls.id,hallId),
        eq(lectureHalls.collegeId,member.collegeId),eq(lectureHalls.status,"ACTIVE")))
      .for("update").limit(1);
    if(!hall)throw new CollegeHallBookingError("HALL_NOT_FOUND");
    if(!hallCanFitClass(hall.capacity,section.capacity))
      throw new CollegeHallBookingError("HALL_CAPACITY_CONFLICT");
    if(input.facultyMembershipId){
      // Different halls/Sections share no scheduling lock. Serialize this
      // writer on the Faculty identity before its fresh overlap query.
      const [teacher]=await tx.select({id:collegeMemberships.id,
        accountStatus:users.platformStatus,membershipStatus:collegeMemberships.status}).from(collegeMemberships)
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"FACULTY")))
        .where(and(eq(collegeMemberships.id,input.facultyMembershipId),
          eq(collegeMemberships.collegeId,member.collegeId),eq(collegeMemberships.status,"ACTIVE")))
        .for("update").limit(1);
      if(!teacher||!hallFacultyIsEligible(teacher.accountStatus,teacher.membershipStatus))
        throw new CollegeHallBookingError("FACULTY_NOT_FOUND");
    }
    const [collision]=await tx.select({id:sectionScheduleEvents.id}).from(sectionScheduleEvents)
      .where(and(eq(sectionScheduleEvents.status,"SCHEDULED"),
        lt(sectionScheduleEvents.startsAt,endsAt),gt(sectionScheduleEvents.endsAt,startsAt),
        or(eq(sectionScheduleEvents.lectureHallId,hallId),
          eq(sectionScheduleEvents.sectionId,input.sectionId),
          input.facultyMembershipId
            ?eq(sectionScheduleEvents.facultyMembershipId,input.facultyMembershipId):undefined)))
      .limit(1);
    if(collision)throw new CollegeHallBookingError("SCHEDULE_CONFLICT");
    const [created]=await tx.insert(sectionScheduleEvents).values({
      sectionId:input.sectionId,lectureHallId:hallId,
      facultyMembershipId:input.facultyMembershipId,
      title:input.title,startsAt,endsAt,
    }).returning({id:sectionScheduleEvents.id});
    if(!created)throw new CollegeHallBookingError("SCHEDULE_CONFLICT");
    await tx.update(sections).set({
      updatedAt:sql<Date>`greatest(${sections.updatedAt} + interval '1 millisecond',clock_timestamp())`,
    }).where(eq(sections.id,section.id));
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_CLASS_UPDATED,
      collegeId:member.collegeId,organizationId:member.organizationId,
      subjectType:"section",subjectId:section.id,
      summary:"College Admin booked a lecture hall for a scheduled class",
      metadata:{hallId,sessionId:created.id,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString()},
    });
    return {sessionId:created.id,hallId,sectionId:section.id,
      startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString()};
  });
}

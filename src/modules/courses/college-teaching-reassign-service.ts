import "server-only";
import {and,eq,gt,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,courseTeachingAssignments,courseSectionDeliveries,
  courseOfferings,courses,departments,membershipRoles,users,
  sectionScheduleEvents,sectionScheduleEventCourses} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {teachingAssignmentConflict} from "./teaching-assignment-guard";
import {postgresConstraintName} from "./errors";
import {collegeTeachingReassignIdSchema,collegeTeachingReassignSchema,teachingMembershipIsActive,teachingScheduleConflict}
  from "./college-teaching-reassign-model";

export class CollegeTeachingReassignError extends Error {
  constructor(public readonly code:"ASSIGNMENT_NOT_FOUND"|"ASSIGNMENT_STALE"|
    "TARGET_NOT_FOUND"|"FACULTY_CONFLICT"|"PRIMARY_CONFLICT"|
    "FACULTY_SCHEDULE_CONFLICT"|"FACULTY_SCHEDULE_TOO_LARGE"){
    super(code);this.name="CollegeTeachingReassignError";
  }
}
export async function reassignCollegeTeaching(context:RequestContext,rawId:unknown,raw:unknown) {
  const id=collegeTeachingReassignIdSchema.parse(rawId);
  const input=collegeTeachingReassignSchema.parse(raw);
  const member=context.membership;
  if(!member||member.status!=="ACTIVE"||!hasMembershipRole(context,"COLLEGE_ADMIN")||
    !can(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
    throw new AuthorizationError("courses.manage");
  requirePermission(context,"courses.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
  try {
    return await getDb().transaction(async tx=>{
      // First resolve the assignment through the current college's course ancestry.
      const [reference]=await tx.select({deliveryId:courseTeachingAssignments.deliveryId})
        .from(courseTeachingAssignments)
        .innerJoin(courseSectionDeliveries,eq(courseSectionDeliveries.id,courseTeachingAssignments.deliveryId))
        .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
        .innerJoin(departments,and(eq(departments.id,courses.departmentId),
          eq(departments.collegeId,member.collegeId)))
        .where(eq(courseTeachingAssignments.id,id)).limit(1);
      if(!reference)throw new CollegeTeachingReassignError("ASSIGNMENT_NOT_FOUND");
      // Hold persisted identity and role locks through commit; a cached context
      // must not survive account suspension, membership suspension or role removal.
      const [actor]=await tx.select({accountStatus:users.platformStatus,
        membershipStatus:collegeMemberships.status})
        .from(collegeMemberships)
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"COLLEGE_ADMIN")))
        .where(and(eq(collegeMemberships.id,member.id),
          eq(collegeMemberships.userId,context.user.id),eq(collegeMemberships.collegeId,member.collegeId)))
        .for("share").limit(1);
      if(!teachingMembershipIsActive(actor))throw new AuthorizationError("courses.manage");
      // Match the canonical create writer's delivery lock to serialize all
      // role swaps with concurrent creates on the same live delivery.
      const [delivery]=await tx.select({id:courseSectionDeliveries.id})
        .from(courseSectionDeliveries)
        .innerJoin(courseOfferings,and(eq(courseOfferings.id,courseSectionDeliveries.offeringId),
          eq(courseOfferings.status,"ACTIVE")))
        .innerJoin(courses,and(eq(courses.id,courseOfferings.courseId),eq(courses.status,"ACTIVE")))
        .innerJoin(departments,and(eq(departments.id,courses.departmentId),
          eq(departments.collegeId,member.collegeId)))
        .where(and(eq(courseSectionDeliveries.id,reference.deliveryId),
          isNull(courseSectionDeliveries.endedAt)))
        .for("update",{of:courseSectionDeliveries}).limit(1);
      if(!delivery)throw new CollegeTeachingReassignError("ASSIGNMENT_NOT_FOUND");
      const [old]=await tx.select({
        id:courseTeachingAssignments.id,deliveryId:courseTeachingAssignments.deliveryId,
        membershipId:courseTeachingAssignments.membershipId,role:courseTeachingAssignments.role,
      }).from(courseTeachingAssignments)
        .where(and(eq(courseTeachingAssignments.id,id),
          eq(courseTeachingAssignments.deliveryId,delivery.id),isNull(courseTeachingAssignments.endedAt)))
        .for("update").limit(1);
      if(!old)throw new CollegeTeachingReassignError("ASSIGNMENT_STALE");
      if(old.membershipId!==input.expectedMembershipId)
        throw new CollegeTeachingReassignError("ASSIGNMENT_STALE");
      const [version]=await tx.select({id:courseTeachingAssignments.id})
        .from(courseTeachingAssignments)
        .where(and(eq(courseTeachingAssignments.id,id),
          sql`date_trunc('milliseconds',${courseTeachingAssignments.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`))
        .limit(1);
      if(!version)throw new CollegeTeachingReassignError("ASSIGNMENT_STALE");
      const [replacement]=await tx.select({id:collegeMemberships.id,
        membershipStatus:collegeMemberships.status,accountStatus:users.platformStatus})
        .from(collegeMemberships)
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(
          eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"FACULTY")))
        .where(and(eq(collegeMemberships.id,input.replacementMembershipId),
          eq(collegeMemberships.collegeId,member.collegeId),eq(collegeMemberships.status,"ACTIVE")))
        .for("share").limit(1);
      if(!replacement||!teachingMembershipIsActive(replacement))
        throw new CollegeTeachingReassignError("TARGET_NOT_FOUND");
      // Only registered linked-delivery sessions and explicitly assigned
      // Faculty sessions have a reliable persisted timetable interpretation.
      // A cap must deny, never silently omit later conflicting sessions.
      const nowForSchedule=new Date();
      const targetSchedule=await tx.select({id:sectionScheduleEvents.id,
        startsAt:sectionScheduleEvents.startsAt,endsAt:sectionScheduleEvents.endsAt})
        .from(sectionScheduleEvents)
        .innerJoin(sectionScheduleEventCourses,eq(sectionScheduleEventCourses.scheduleEventId,sectionScheduleEvents.id))
        .where(and(eq(sectionScheduleEventCourses.deliveryId,delivery.id),
          eq(sectionScheduleEvents.status,"SCHEDULED"),gt(sectionScheduleEvents.endsAt,nowForSchedule)))
        .limit(2001);
      if(targetSchedule.length>2000)
        throw new CollegeTeachingReassignError("FACULTY_SCHEDULE_TOO_LARGE");
      if(targetSchedule.length){
        const busy=await tx.select({id:sectionScheduleEvents.id,
          startsAt:sectionScheduleEvents.startsAt,endsAt:sectionScheduleEvents.endsAt})
          .from(sectionScheduleEvents)
          .where(and(eq(sectionScheduleEvents.facultyMembershipId,replacement.id),
            eq(sectionScheduleEvents.status,"SCHEDULED"),gt(sectionScheduleEvents.endsAt,nowForSchedule)))
          .limit(2001);
        if(busy.length>2000)throw new CollegeTeachingReassignError("FACULTY_SCHEDULE_TOO_LARGE");
        if(teachingScheduleConflict(targetSchedule,busy))
          throw new CollegeTeachingReassignError("FACULTY_SCHEDULE_CONFLICT");
      }
      const live=await tx.select({membershipId:courseTeachingAssignments.membershipId,
        role:courseTeachingAssignments.role})
        .from(courseTeachingAssignments)
        .where(and(eq(courseTeachingAssignments.deliveryId,delivery.id),
          isNull(courseTeachingAssignments.endedAt)));
      const conflict=teachingAssignmentConflict({membershipId:replacement.id,role:old.role},
        live.filter(row=>row.membershipId!==old.membershipId));
      if(conflict)throw new CollegeTeachingReassignError(
        conflict==="PRIMARY_TEACHER_CONFLICT"?"PRIMARY_CONFLICT":"FACULTY_CONFLICT");
      const now=new Date();
      const [ended]=await tx.update(courseTeachingAssignments).set({endedAt:now,updatedAt:now})
        .where(and(eq(courseTeachingAssignments.id,old.id),isNull(courseTeachingAssignments.endedAt)))
        .returning({id:courseTeachingAssignments.id});
      if(!ended)throw new CollegeTeachingReassignError("ASSIGNMENT_STALE");
      const [created]=await tx.insert(courseTeachingAssignments).values({
        deliveryId:old.deliveryId,membershipId:replacement.id,role:old.role,
      }).returning({id:courseTeachingAssignments.id});
      if(!created)throw new CollegeTeachingReassignError("FACULTY_CONFLICT");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.COURSES_TEACHING_ASSIGNED,
        collegeId:member.collegeId,organizationId:member.organizationId,
        subjectType:"course_teaching_assignment",subjectId:created.id,subjectLabel:old.role,
        summary:"College Admin reassigned Faculty teaching responsibility",
        metadata:{previousAssignmentId:old.id,previousMembershipId:old.membershipId,
          replacementMembershipId:replacement.id,deliveryId:old.deliveryId,role:old.role},
      });
      return {previousAssignmentId:old.id,newAssignmentId:created.id,
        replacementMembershipId:replacement.id,role:old.role};
    });
  }catch(error){
    const key=postgresConstraintName(error);
    if(key==="course_teaching_assignments_active_uq")
      throw new CollegeTeachingReassignError("FACULTY_CONFLICT");
    if(key==="course_teaching_assignments_active_primary_uq")
      throw new CollegeTeachingReassignError("PRIMARY_CONFLICT");
    throw error;
  }
}

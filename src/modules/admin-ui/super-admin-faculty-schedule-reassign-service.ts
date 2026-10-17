import "server-only";
import {and,asc,eq,gt,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,departments,membershipRoles,programs,cohorts,sections,
  sectionScheduleEvents,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {planFacultyScheduleReassignment} from "./super-admin-faculty-schedule-reassign-model";

export const superAdminFacultyScheduleReassignSchema=z.object({
  sourceMembershipId:z.string().uuid(),
  replacementMembershipId:z.string().uuid(),
  confirmed:z.literal(true),
}).strict().refine(value=>value.sourceMembershipId!==value.replacementMembershipId,{
  message:"Choose a different replacement faculty member",
});

export class SuperAdminFacultyScheduleReassignError extends Error {
  constructor(public readonly code:"FACULTY_UNAVAILABLE"|"FACULTY_SCHEDULE_LIMIT"|"SCHEDULE_CHANGED"){
    super(code);this.name="SuperAdminFacultyScheduleReassignError";
  }
}

/** SA-academics-people-85: transfer only future, persisted scheduled sessions
 * belonging to the selected college. Conflict skips preserve the old owner,
 * rather than silently double-booking the replacement teacher. */
export async function reassignSuperAdminFacultySchedules(context:RequestContext,raw:unknown) {
  if(!isSuperAdmin(context))throw new AuthorizationError("academics.manage");
  const input=superAdminFacultyScheduleReassignSchema.parse(raw);
  const selected=await resolveActingCollege(context,"academics.manage");
  requirePermission(context,"academics.manage",{
    collegeId:selected.collegeId,organizationId:selected.organizationId,
  });
  return getDb().transaction(async tx=>{
    // Serialize transfers involving these accounts. The old actor may be
    // suspended, but the replacement must have an active FACULTY membership.
    const members=await tx.select({
      id:collegeMemberships.id,status:collegeMemberships.status,
      userStatus:users.platformStatus,
    }).from(collegeMemberships)
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"FACULTY")))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .where(and(eq(collegeMemberships.collegeId,selected.collegeId),
        inArray(collegeMemberships.id,[input.sourceMembershipId,input.replacementMembershipId])))
      .orderBy(asc(collegeMemberships.id))
      .for("update",{of:collegeMemberships});
    const source=members.find(item=>item.id===input.sourceMembershipId);
    const replacement=members.find(item=>item.id===input.replacementMembershipId);
    if(!source||!replacement||replacement.status!=="ACTIVE"||replacement.userStatus!=="ACTIVE")
      throw new SuperAdminFacultyScheduleReassignError("FACULTY_UNAVAILABLE");

    const now=new Date();
    // Cap both views; truncated source/target schedules cannot be used to
    // declare a replacement collision-free.
    const scheduled=await tx.select({
      id:sectionScheduleEvents.id,startsAt:sectionScheduleEvents.startsAt,
      endsAt:sectionScheduleEvents.endsAt,facultyMembershipId:sectionScheduleEvents.facultyMembershipId,
    }).from(sectionScheduleEvents)
      .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
      .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,and(eq(departments.id,programs.departmentId),
        eq(departments.collegeId,selected.collegeId)))
      .where(and(inArray(sectionScheduleEvents.facultyMembershipId,
        [input.sourceMembershipId,input.replacementMembershipId]),
        eq(sectionScheduleEvents.status,"SCHEDULED"),
        gt(sectionScheduleEvents.endsAt,now)))
      .orderBy(asc(sectionScheduleEvents.startsAt),asc(sectionScheduleEvents.id))
      .limit(4001)
      .for("update",{of:sectionScheduleEvents});
    if(scheduled.length>4000)throw new SuperAdminFacultyScheduleReassignError("FACULTY_SCHEDULE_LIMIT");
    const original=scheduled.filter(item=>item.facultyMembershipId===input.sourceMembershipId);
    const occupied=scheduled.filter(item=>item.facultyMembershipId===input.replacementMembershipId);
    const plan=planFacultyScheduleReassignment(original,occupied);
    for(const event of plan.movable){
      const changed=await tx.update(sectionScheduleEvents).set({
        facultyMembershipId:input.replacementMembershipId,updatedAt:new Date(),
      }).where(and(eq(sectionScheduleEvents.id,event.id),
        eq(sectionScheduleEvents.facultyMembershipId,input.sourceMembershipId),
        eq(sectionScheduleEvents.status,"SCHEDULED"),
        gt(sectionScheduleEvents.endsAt,now))).returning({id:sectionScheduleEvents.id});
      if(changed.length!==1)throw new SuperAdminFacultyScheduleReassignError("SCHEDULE_CHANGED");
    }
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.COURSES_CLASS_SCHEDULED,
      collegeId:selected.collegeId,organizationId:selected.organizationId,
      subjectType:"faculty_schedule_reassignment",
      subjectId:input.sourceMembershipId,
      summary:"Super Admin reassigned upcoming faculty schedules",
      metadata:{
        sourceMembershipId:input.sourceMembershipId,
        replacementMembershipId:input.replacementMembershipId,
        total:original.length,reassigned:plan.movable.length,
        skippedConflicts:plan.skipped.length,
      },
    });
    return {total:original.length,reassigned:plan.movable.length,skippedConflicts:plan.skipped.length};
  },{isolationLevel:"serializable"});
}

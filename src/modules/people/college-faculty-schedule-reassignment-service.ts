import "server-only";
import {and,asc,eq,gt,lt,ne,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {activityEvents,collegeMemberships,membershipRoles,sectionScheduleEvents,users,
 sections,cohorts,programs,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
const ids=z.uuid();
export const scheduleReassignInput=z.strictObject({
 replacementMembershipId:ids,confirmed:z.literal(true),
});
function college(ctx:RequestContext){
 const m=ctx.membership;
 if(!m||m.status!=="ACTIVE"||!hasMembershipRole(ctx,"COLLEGE_ADMIN"))
  throw new AuthorizationError("academics.manage");
 requirePermission(ctx,"academics.manage",{collegeId:m.collegeId,organizationId:m.organizationId});
 return m;
}
export async function getFacultyScheduleReassignOptions(ctx:RequestContext,rawId:unknown){
 const m=college(ctx),id=ids.parse(rawId),db=getDb();
 return db.transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"academics.manage",{
   collegeId:m.collegeId,organizationId:m.organizationId,
  });
 const [sourceFaculty]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"FACULTY")))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,m.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!sourceFaculty)throw Error("Faculty not found in this college.");
 const people=await tx.select({id:collegeMemberships.id,name:users.displayName})
 .from(collegeMemberships)
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
  eq(membershipRoles.role,"FACULTY")))
 .where(and(eq(collegeMemberships.collegeId,m.collegeId),
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
  ne(collegeMemberships.id,id)))
 .orderBy(asc(users.displayName)).limit(200);
 const slots=await tx.select({id:sectionScheduleEvents.id})
 .from(sectionScheduleEvents)
 .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
 .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
 .innerJoin(programs,eq(programs.id,cohorts.programId))
 .innerJoin(departments,eq(departments.id,programs.departmentId))
 .where(and(eq(departments.collegeId,m.collegeId),
  eq(sectionScheduleEvents.facultyMembershipId,id),
  eq(sectionScheduleEvents.status,"SCHEDULED"),gt(sectionScheduleEvents.startsAt,new Date())))
 .limit(201);
 return{faculty:people,upcoming:Math.min(slots.length,200),truncated:slots.length>200};
 });
}
/** The legacy success count is about actual writes, not matching sessions. */
export function facultyScheduleReassignmentReceipt(
 results:readonly {id:string;title:string;status:"REASSIGNED"|"SKIPPED";reason:string}[],
) {
 const reassigned=results.filter(item=>item.status==="REASSIGNED").length;
 const total=results.length;
 return {
  summary:`Reassigned ${reassigned} of ${total} upcoming session(s)`,
  warnings:results.filter(item=>item.status==="SKIPPED")
   .map(item=>({sessionId:item.id,title:item.title,reason:item.reason})),
 };
}
export async function reassignFacultyUpcomingSchedules(ctx:RequestContext,rawId:unknown,raw:unknown){
 const m=college(ctx),old=ids.parse(rawId),input=scheduleReassignInput.parse(raw);
 if(old===input.replacementMembershipId)throw Error("Choose a different faculty member.");
 const db=getDb(),now=new Date();
 return db.transaction(async tx=>{
  const principals=await tx.select({id:collegeMemberships.id,status:collegeMemberships.status,
   userStatus:users.platformStatus})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,
     and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"FACULTY")))
   .where(and(eq(collegeMemberships.collegeId,m.collegeId),
     or(eq(collegeMemberships.id,old),eq(collegeMemberships.id,input.replacementMembershipId))))
   // Lock the joined USERS and MEMBERSHIP_ROLES rows too. Locking only the
   // college_memberships record permits disabling a replacement account or
   // removing its FACULTY role during this reassignment transaction.
   .for("share");
  if(!principals.some(p=>p.id===old&&p.status==="ACTIVE"&&p.userStatus==="ACTIVE")||
     !principals.some(p=>p.id===input.replacementMembershipId&&p.status==="ACTIVE"&&p.userStatus==="ACTIVE"))
    throw Error("Source or replacement faculty not available in this college.");
  await assertPersistedPlatformPermission(tx,ctx,"academics.manage",{
   collegeId:m.collegeId,organizationId:m.organizationId,
  });
  // Concurrent moves from different source faculty into the SAME replacement
  // must serialize before checking overlap, or both can observe an empty
  // schedule and commit clashing lectures. Advisory key collisions only
  // over-serialize; the lock is released on transaction commit/rollback.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.replacementMembershipId}))`);
  const sessions=await tx.select({id:sectionScheduleEvents.id,title:sectionScheduleEvents.title,
   sectionId:sectionScheduleEvents.sectionId,startsAt:sectionScheduleEvents.startsAt,
   endsAt:sectionScheduleEvents.endsAt})
   .from(sectionScheduleEvents)
   .innerJoin(sections,eq(sections.id,sectionScheduleEvents.sectionId))
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(and(eq(departments.collegeId,m.collegeId),
    eq(sectionScheduleEvents.facultyMembershipId,old),
    eq(sectionScheduleEvents.status,"SCHEDULED"),
    gt(sectionScheduleEvents.startsAt,now)))
   .orderBy(asc(sectionScheduleEvents.startsAt)).limit(201)
   .for("update",{of:sectionScheduleEvents});
  if(sessions.length>200)throw Error("More than 200 upcoming sessions. Narrow the schedule or contact an administrator.");
  const results:{id:string;title:string;status:"REASSIGNED"|"SKIPPED";reason:string}[]=[];
  for(const session of sessions){
   const [collision]=await tx.select({id:sectionScheduleEvents.id})
    .from(sectionScheduleEvents).where(and(
     ne(sectionScheduleEvents.id,session.id),
     eq(sectionScheduleEvents.facultyMembershipId,input.replacementMembershipId),
     eq(sectionScheduleEvents.status,"SCHEDULED"),
     lt(sectionScheduleEvents.startsAt,session.endsAt),
     gt(sectionScheduleEvents.endsAt,session.startsAt))).limit(1);
   if(collision){results.push({id:session.id,title:session.title,
     status:"SKIPPED",reason:"Replacement faculty has an overlapping session"});continue;}
   const [changed]=await tx.update(sectionScheduleEvents).set({
    facultyMembershipId:input.replacementMembershipId,updatedAt:new Date(),
   }).where(and(eq(sectionScheduleEvents.id,session.id),
     eq(sectionScheduleEvents.facultyMembershipId,old))).returning({id:sectionScheduleEvents.id});
   results.push({id:session.id,title:session.title,status:changed?"REASSIGNED":"SKIPPED",
    reason:changed?"Reassigned":"The session changed before the update"});
  }
  // Replayed forms and collision-only attempts should return the same status
  // without emitting a second "reassigned" audit entry for zero writes.
  if(!results.some(row=>row.status==="REASSIGNED"))
   return {total:results.length,reassigned:0,skipped:results.length,results,
    ...facultyScheduleReassignmentReceipt(results)};
  await tx.insert(activityEvents).values({
   organizationId:m.organizationId,collegeId:m.collegeId,
   actorUserId:ctx.user.id,actorMembershipId:m.id,
   module:"ACADEMICS",eventType:"ACADEMICS_FACULTY_SCHEDULES_REASSIGNED",
   subjectType:"college_membership",subjectId:old,
   summary:"Upcoming faculty class schedules reassigned",
   metadata:{replacementMembershipId:input.replacementMembershipId,
    updated:results.filter(r=>r.status==="REASSIGNED").length,
    skipped:results.filter(r=>r.status==="SKIPPED").length},
  });
  return{total:results.length,reassigned:results.filter(r=>r.status==="REASSIGNED").length,
   skipped:results.filter(r=>r.status==="SKIPPED").length,results,
   ...facultyScheduleReassignmentReceipt(results)};
 });
}

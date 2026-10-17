import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,courseOfferings,courses,departments,
 inAppNotifications,learnerProgramEnrollments,membershipRoles,placementTpoPrepAssignments,
 users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
const uuid=z.string().uuid();
const inputSchema=z.strictObject({
 offeringId:uuid,dueAt:z.iso.datetime({offset:true}),membershipIds:z.array(uuid).min(1).max(100),
}).refine(data=>new Set(data.membershipIds).size===data.membershipIds.length,
 {message:"Select each student only once",path:["membershipIds"]});
export class TpoPrepError extends Error{
 constructor(readonly code:"UNAVAILABLE"|"NO_ACTIVE_OFFERING"|"DUE_DATE_INVALID"|"INVALID_SELECTION"){super(code);}
}
async function requireTpo(ctx:RequestContext){
 const m=ctx.membership;
 if(!m||!hasMembershipRole(ctx,"TPO")||m.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 if(!can(ctx,"placements.manage",{collegeId:m.collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(ctx,"placements.manage",{collegeId:m.collegeId});
 return requirePlacementManageScope(ctx,m.collegeId);
}
async function hasPrepTable(){
 if(!(await placementTableExists("placement_tpo_prep_assignments")))throw new TpoPrepError("UNAVAILABLE");
}
export async function listTpoPrepCourseOptions(ctx:RequestContext){
 const college=await requireTpo(ctx);
 await hasPrepTable();
 return getDb().select({id:courseOfferings.id,courseId:courses.id,name:courses.name,
  code:courses.code,cohortId:courseOfferings.cohortId}).from(courseOfferings)
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,college.id)))
  .where(and(eq(courseOfferings.status,"ACTIVE"),eq(courses.status,"ACTIVE")))
  .orderBy(courses.name,courses.code).limit(300);
}
export async function assignTpoPrepCourse(ctx:RequestContext,raw:unknown){
 const college=await requireTpo(ctx),input=inputSchema.parse(raw);
 await hasPrepTable();
 const due=new Date(input.dueAt);
 if(due.getTime()<=Date.now())throw new TpoPrepError("DUE_DATE_INVALID");
 return getDb().transaction(async tx=>{
  const [lock]=await tx.select({id:colleges.id}).from(colleges)
   .where(eq(colleges.id,college.id)).for("update").limit(1);
  if(!lock)throw new TpoPrepError("INVALID_SELECTION");
  const [offering]=await tx.select({id:courseOfferings.id,cohortId:courseOfferings.cohortId,
   title:courses.name}).from(courseOfferings)
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,college.id)))
   .where(and(eq(courseOfferings.id,input.offeringId),eq(courseOfferings.status,"ACTIVE"),eq(courses.status,"ACTIVE")))
   .limit(1);
  if(!offering)throw new TpoPrepError("NO_ACTIVE_OFFERING");
  const learners=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
   .from(collegeMemberships).innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
   .innerJoin(learnerProgramEnrollments,and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.cohortId,offering.cohortId),eq(learnerProgramEnrollments.status,"ACTIVE")))
   .where(and(inArray(collegeMemberships.id,input.membershipIds),
    eq(collegeMemberships.collegeId,college.id),eq(collegeMemberships.status,"ACTIVE")));
  const available=new Map(learners.map(row=>[row.id,row.userId]));
  const [event]=await tx.insert(activityEvents).values({
   collegeId:college.id,organizationId:college.organizationId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
   eventType:"PLACEMENTS_TPO_PREP_ASSIGNED",
   subjectType:"course_offering",subjectId:offering.id,subjectLabel:offering.title,
   summary:"TPO assigned preparation course to selected learners",
   metadata:{selected:input.membershipIds.length,offeringId:offering.id,dueAt:input.dueAt},
  }).returning({id:activityEvents.id});
  if(!event)throw new TpoPrepError("INVALID_SELECTION");
  const results:{id:string;status:"assigned"|"duplicate"|"skipped"}[]=[];
  for(const id of input.membershipIds){
   const userId=available.get(id);
   if(!userId){results.push({id,status:"skipped"});continue;}
   const [saved]=await tx.insert(placementTpoPrepAssignments).values({
    collegeId:college.id,membershipId:id,offeringId:offering.id,dueAt:due,assignedByUserId:ctx.user.id,
   }).onConflictDoNothing().returning({id:placementTpoPrepAssignments.id});
   if(!saved){results.push({id,status:"duplicate"});continue;}
   await tx.insert(inAppNotifications).values({
    userId,eventId:event.id,title:"New preparation course",
    body:"Your placement cell assigned "+offering.title+". Review it in your courses by the stated due date.",
    actionHref:"/learn/courses",
   }).onConflictDoNothing();
   results.push({id,status:"assigned"});
  }
  return {results,counts:{assigned:results.filter(r=>r.status==="assigned").length,
   duplicate:results.filter(r=>r.status==="duplicate").length,
   skipped:results.filter(r=>r.status==="skipped").length}};
 });
}
export async function listOwnTpoPrepAssignments(ctx:RequestContext){
 const member=ctx.membership;
 if(!member||!hasMembershipRole(ctx,"LEARNER")||member.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.read");
 await hasPrepTable();
 const rows=await getDb().select({id:placementTpoPrepAssignments.id,dueAt:placementTpoPrepAssignments.dueAt,
  offeringId:placementTpoPrepAssignments.offeringId,title:courses.name,courseCode:courses.code,
 }).from(placementTpoPrepAssignments)
  .innerJoin(courseOfferings,eq(courseOfferings.id,placementTpoPrepAssignments.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),eq(departments.collegeId,member.collegeId)))
  .where(and(eq(placementTpoPrepAssignments.collegeId,member.collegeId),
   eq(placementTpoPrepAssignments.membershipId,member.id)))
  .orderBy(placementTpoPrepAssignments.dueAt).limit(100);
 return rows;
}

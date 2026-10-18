import "server-only";
import {and,eq,inArray,isNull,sql} from "drizzle-orm";
import {tpoPrepAssignmentInputSchema} from "./tpo-prep-assignment-model";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,colleges,courseOfferings,courses,departments,
 inAppNotifications,learnerProgramEnrollments,membershipRoles,placementTpoPrepAssignments,
 users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";
import {requirePersistedTpoMembership} from "./tpo-persisted-actor-service";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {placementTableExists} from "./staged-tables";
const inputSchema=tpoPrepAssignmentInputSchema;
export class TpoPrepError extends Error{
 constructor(readonly code:"UNAVAILABLE"|"NO_ACTIVE_OFFERING"|"DUE_DATE_INVALID"|"INVALID_SELECTION"){super(code);}
}
async function requireTpo(ctx:RequestContext){
 const m=ctx.membership;
 if(!m||!hasMembershipRole(ctx,"TPO")||m.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 if(!can(ctx,"placements.manage",{collegeId:m.collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(ctx,"placements.manage",{collegeId:m.collegeId});
 await requirePersistedTpoMembership(ctx,m.collegeId);
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
  .innerJoin(departments,and(eq(departments.id,courses.departmentId),
   eq(departments.collegeId,college.id),isNull(departments.archivedAt)))
  .where(and(eq(courseOfferings.status,"ACTIVE"),eq(courses.status,"ACTIVE")))
  .orderBy(courses.name,courses.code).limit(300);
}
export async function assignTpoPrepCourse(ctx:RequestContext,raw:unknown){
 const college=await requireTpo(ctx),input=inputSchema.parse(raw);
 await hasPrepTable();
 const due=input.dueAt?new Date(input.dueAt):null;
 if(due!==null&&due.getTime()<=Date.now())throw new TpoPrepError("DUE_DATE_INVALID");
 if(due===null){
  // The new nullable schema is proposed until the orchestrator registers
  // its migration. Fail cleanly instead of attempting a NOT NULL insert and
  // returning a raw database error on an older dev deployment.
  const nullable=await getDb().execute<{ready:boolean}>(sql`
   SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='placement_tpo_prep_assignments'
      AND column_name='due_at' AND is_nullable='YES'
   ) AS ready
  `).then(result=>result.rows[0]?.ready===true).catch(()=>false);
  if(!nullable)throw new TpoPrepError("UNAVAILABLE");
 }
 return getDb().transaction(async tx=>{
  // College first, then live persisted TPO membership, to serialize against
  // archive, account suspension and role removal before writing any assignments.
  const [lock]=await tx.select({id:colleges.id,status:colleges.status}).from(colleges)
   .where(eq(colleges.id,college.id)).for("update").limit(1);
  if(!lock||lock.status!=="ACTIVE")throw new TpoPrepError("INVALID_SELECTION");
  const persisted=await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  if(!hasMembershipRole(persisted,"TPO"))throw new AuthorizationError("placements.manage");
  const [offering]=await tx.select({id:courseOfferings.id,cohortId:courseOfferings.cohortId,
   title:courses.name}).from(courseOfferings)
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,and(eq(departments.id,courses.departmentId),
   eq(departments.collegeId,college.id),isNull(departments.archivedAt)))
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
  // Bulk insert first: a retry that assigns nobody new must not create a
  // phantom audit event or duplicate notification for the same assignment.
  const eligibleIds=input.membershipIds.filter(id=>available.has(id));
  const inserted=eligibleIds.length?await tx.insert(placementTpoPrepAssignments)
   .values(eligibleIds.map(membershipId=>({
    collegeId:college.id,membershipId,offeringId:offering.id,dueAt:due,
    assignedByUserId:ctx.user.id,
   }))).onConflictDoNothing()
   .returning({membershipId:placementTpoPrepAssignments.membershipId}):[];
  const newlyAssigned=new Set(inserted.map(row=>row.membershipId));
  const results:{id:string;status:"assigned"|"duplicate"|"skipped"}[]=
   input.membershipIds.map(id=>({
    id,status:!available.has(id)?"skipped":newlyAssigned.has(id)?"assigned":"duplicate",
   }));
  const counts={
   assigned:results.filter(row=>row.status==="assigned").length,
   duplicate:results.filter(row=>row.status==="duplicate").length,
   skipped:results.filter(row=>row.status==="skipped").length,
  };
  if(counts.assigned){
   const [event]=await tx.insert(activityEvents).values({
    collegeId:college.id,organizationId:college.organizationId,
    actorUserId:ctx.user.id,actorMembershipId:ctx.membership!.id,module:"PLACEMENTS",
    eventType:"PLACEMENTS_TPO_PREP_ASSIGNED",
    subjectType:"course_offering",subjectId:offering.id,subjectLabel:offering.title,
    summary:"TPO assigned preparation course to selected learners",
    metadata:{selected:input.membershipIds.length,assigned:counts.assigned,
     duplicate:counts.duplicate,skipped:counts.skipped,offeringId:offering.id,dueAt:input.dueAt??null},
   }).returning({id:activityEvents.id});
   if(!event)throw new TpoPrepError("INVALID_SELECTION");
   await tx.insert(inAppNotifications).values(inserted.map(row=>({
    userId:available.get(row.membershipId)!,
    eventId:event.id,title:"New preparation course",
    body:"Your placement cell assigned "+offering.title+". Review it in your courses"+
     (due?". The due date is recorded in your assignment.":"."),
    actionHref:"/learn/courses",
   }))).onConflictDoNothing();
  }
  return {results,counts};
 });
}
export async function listOwnTpoPrepAssignments(ctx:RequestContext){
 const member=ctx.membership;
 if(!member||!hasMembershipRole(ctx,"LEARNER")||member.status!=="ACTIVE"||ctx.user.platformStatus!=="ACTIVE")
  throw new AuthorizationError("placements.read");
 // Do not trust a cached LEARNER role after account suspension or college
 // unenrollment. Prove the same currently active person and college first.
 const [live]=await getDb().select({id:collegeMemberships.id}).from(collegeMemberships)
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,member.id),eq(collegeMemberships.userId,ctx.user.id),
   eq(collegeMemberships.collegeId,member.collegeId),eq(collegeMemberships.status,"ACTIVE"))).limit(1);
 if(!live)throw new AuthorizationError("placements.read");
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
 // Do not return another learner's assignments if the in-flight session
 // lost its role or its college was archived during the directory join.
 await getDb().transaction(async tx=>{
  const [college]=await tx.select({status:colleges.status,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,member.collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  const persisted=await assertPersistedPlatformPermission(tx,ctx,"placements.read",{
   collegeId:member.collegeId,organizationId:college.organizationId,
  });
  if(!hasMembershipRole(persisted,"LEARNER"))throw new AuthorizationError("placements.read");
 });
 return rows;
}

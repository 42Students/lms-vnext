import "server-only";
import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,membershipRoles,
 placementCompanyRelationships,placementJobs,users} from "@/db/schema";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasPlacementTeamMembership} from "./placement-team-access-model";
import {requirePlacementManageScope} from "./scope";

export const tpoAssignUnownedSchema=z.strictObject({
 targetMembershipId:z.string().uuid(),
});
async function scope(context:RequestContext){
 const member=context.membership;
 if(!member||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 return {member,college};
}
/** Owner is not the creator; no ownership can be inferred before registration. */
async function hasDriveOwnerColumn(){
 try{
  const rows=await getDb().execute<{ready:boolean}>(sql`
   select exists(select 1 from information_schema.columns
   where table_schema='public' and table_name='placement_jobs'
     and column_name='owner_membership_id') as ready`);
  return rows.rows[0]?.ready===true;
 }catch{return false;}
}
export async function readTpoUnownedWork(context:RequestContext){
 const {college}=await scope(context);
 if(!await hasDriveOwnerColumn())return {ready:false as const,drives:0,companies:0};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [jobs]=await tx.select({count:sql<number>`count(*)::integer`})
   .from(placementJobs).where(and(eq(placementJobs.collegeId,college.id),
    inArray(placementJobs.status,["DRAFT","PUBLISHED"]),
    isNull(placementJobs.ownerMembershipId)));
  const [companies]=await tx.select({count:sql<number>`count(*)::integer`})
   .from(placementCompanyRelationships).where(and(
    eq(placementCompanyRelationships.collegeId,college.id),
    eq(placementCompanyRelationships.status,"ACTIVE"),
    isNull(placementCompanyRelationships.ownerMembershipId)));
  return {ready:true as const,drives:Number(jobs?.count??0),
   companies:Number(companies?.count??0)};
 });
}
/** Assign the unowned pool once under the college scope. Two concurrent
 * attempts cannot claim the same row: each UPDATE requires owner IS NULL. */
export async function assignTpoUnownedWork(context:RequestContext,raw:unknown){
 const input=tpoAssignUnownedSchema.parse(raw);
 const {member,college}=await scope(context);
 if(!await hasDriveOwnerColumn())throw new Error("TEAM_OWNERSHIP_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [target]=await tx.select({
   id:collegeMemberships.id,userId:collegeMemberships.userId,
  }).from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
    or(eq(membershipRoles.role,"TPO"),eq(membershipRoles.role,"COLLEGE_ADMIN"))))
   .where(and(eq(collegeMemberships.id,input.targetMembershipId),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .limit(1);
  if(!target)throw new Error("TEAM_MEMBER_NOT_FOUND");
  const jobs=await tx.update(placementJobs).set({
   ownerMembershipId:target.id,updatedAt:new Date(),
  }).where(and(eq(placementJobs.collegeId,college.id),
   inArray(placementJobs.status,["DRAFT","PUBLISHED"]),
   isNull(placementJobs.ownerMembershipId)))
   .returning({id:placementJobs.id});
  const companies=await tx.update(placementCompanyRelationships).set({
   ownerMembershipId:target.id,updatedAt:new Date(),
  }).where(and(eq(placementCompanyRelationships.collegeId,college.id),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   isNull(placementCompanyRelationships.ownerMembershipId)))
   .returning({id:placementCompanyRelationships.id});
  if(!jobs.length&&!companies.length)return {drives:0,companies:0};
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.unowned_assigned",
   subjectType:"team_member",subjectId:target.id,
   summary:"Unowned placement work assigned",
   metadata:{drives:jobs.length,companies:companies.length,
    targetMembershipId:target.id},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("TEAM_ASSIGNMENT_FAILED");
  await tx.insert(inAppNotifications).values({
   eventId:event.id,userId:target.userId,title:"You now own placement work",
   body:"Assigned "+jobs.length+" drive(s) and "+companies.length+" company relationship(s).",
   actionHref:"/tpo/team?tab=people",
  });
  return {drives:jobs.length,companies:companies.length};
 });
}

import "server-only";
import {and,asc,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,users,placementJobs,placementCompanyRelationships,placementTpoLeads,placementTpoFollowups} from "@/db/schema";
import {placementTpoTeamMembers} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasDriveOwnerColumn} from "@/modules/placements/tpo-team-unowned-service";

const memberSchema=z.string().uuid();
async function requireScope(context:RequestContext){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_team_members"))
  throw new Error("PLACEMENT_TEAM_ASSIGNMENTS_UNAVAILABLE");
 return membership;
}
export async function listTpoTeamAssignableStaff(context:RequestContext){
 const actor=await requireScope(context);
 const rows=await getDb().select({
  membershipId:collegeMemberships.id,displayName:users.displayName,
  role:membershipRoles.role,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,["FACULTY","TPO"])))
  .where(and(eq(collegeMemberships.collegeId,actor.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(asc(users.displayName));
 const dedup=new Map<string,{membershipId:string;displayName:string;hasTpoRole:boolean}>();
 for(const row of rows){
  const existing=dedup.get(row.membershipId);
  if(existing){if(row.role==="TPO")existing.hasTpoRole=true;continue;}
  dedup.set(row.membershipId,{membershipId:row.membershipId,
   displayName:row.displayName?.trim()||"Unnamed faculty member",hasTpoRole:row.role==="TPO"});
 }
 return [...dedup.values()];
}
export async function addTpoTeamAssignment(context:RequestContext,raw:unknown){
 const actor=await requireScope(context);
 const {membershipId}=z.strictObject({membershipId:memberSchema}).parse(raw);
 const [candidate]=await getDb().select({
  id:collegeMemberships.id,role:membershipRoles.role,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   inArray(membershipRoles.role,["FACULTY","TPO"])))
  .where(and(eq(collegeMemberships.id,membershipId),
   eq(collegeMemberships.collegeId,actor.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .orderBy(asc(membershipRoles.role)).limit(1);
 if(!candidate)throw new Error("TEAM_MEMBER_INACTIVE_OR_UNAVAILABLE");
 // Faculty coordinators get a team assignment, not an implicit new TPO membership.
 const roles=await getDb().select({role:membershipRoles.role}).from(membershipRoles)
  .where(eq(membershipRoles.membershipId,membershipId));
 const role=roles.some(row=>row.role==="TPO")?"TPO_ADMIN":"FACULTY_COORDINATOR";
 await getDb().insert(placementTpoTeamMembers).values({
  collegeId:actor.collegeId,membershipId,role,
 }).onConflictDoUpdate({
  target:[placementTpoTeamMembers.collegeId,placementTpoTeamMembers.membershipId],
  set:{role},
 });
 return {ok:true};
}
/** Removal previews are advisory; deletion must recheck in its own transaction. */
type RemovalImpact={drives:number;companies:number;recruiterLeads:number;followups:number};
type RemovalTx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function teamRemovalImpact(tx:RemovalTx,collegeId:string,membershipId:string):Promise<RemovalImpact>{
 const [[drives],[companies],[recruiterLeads],[followups]]=await Promise.all([
  tx.select({total:sql<number>`count(*)::int`}).from(placementJobs).where(and(
   eq(placementJobs.collegeId,collegeId),eq(placementJobs.ownerMembershipId,membershipId),
   inArray(placementJobs.status,["DRAFT","PUBLISHED"]))),
  tx.select({total:sql<number>`count(*)::int`}).from(placementCompanyRelationships).where(and(
   eq(placementCompanyRelationships.collegeId,collegeId),
   eq(placementCompanyRelationships.ownerMembershipId,membershipId),
   eq(placementCompanyRelationships.status,"ACTIVE"))),
  tx.select({total:sql<number>`count(*)::int`}).from(placementTpoLeads).where(and(
   eq(placementTpoLeads.collegeId,collegeId),eq(placementTpoLeads.ownerMembershipId,membershipId))),
  tx.select({total:sql<number>`count(*)::int`}).from(placementTpoFollowups).where(and(
   eq(placementTpoFollowups.collegeId,collegeId),eq(placementTpoFollowups.ownerMembershipId,membershipId))),
 ]);
 return {drives:drives?.total??0,companies:companies?.total??0,
  recruiterLeads:recruiterLeads?.total??0,followups:followups?.total??0};
}
export async function readTpoTeamRemovalImpact(context:RequestContext,raw:unknown){
 const actor=await requireScope(context);
 const membershipId=memberSchema.parse(raw);
 if(membershipId===actor.id)throw new Error("CANNOT_REMOVE_OWN_TEAM_ASSIGNMENT");
 if(!await hasDriveOwnerColumn())throw new Error("TEAM_OWNERSHIP_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:actor.collegeId,organizationId:actor.organizationId,
  });
  const [assignment]=await tx.select({id:placementTpoTeamMembers.id})
   .from(placementTpoTeamMembers).where(and(
    eq(placementTpoTeamMembers.collegeId,actor.collegeId),
    eq(placementTpoTeamMembers.membershipId,membershipId))).limit(1);
  if(!assignment)throw new Error("TEAM_ASSIGNMENT_NOT_FOUND");
  return teamRemovalImpact(tx,actor.collegeId,membershipId);
 });
}
export async function removeTpoTeamAssignment(context:RequestContext,raw:unknown){
 const actor=await requireScope(context);
 const {membershipId}=z.strictObject({membershipId:memberSchema}).parse(raw);
 if(membershipId===actor.id)throw new Error("CANNOT_REMOVE_OWN_TEAM_ASSIGNMENT");
 if(!await hasDriveOwnerColumn())throw new Error("TEAM_OWNERSHIP_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:actor.collegeId,organizationId:actor.organizationId,
  });
  const [assignment]=await tx.select({id:placementTpoTeamMembers.id})
   .from(placementTpoTeamMembers).where(and(
    eq(placementTpoTeamMembers.collegeId,actor.collegeId),
    eq(placementTpoTeamMembers.membershipId,membershipId)))
   .for("update").limit(1);
  if(!assignment)throw new Error("TEAM_ASSIGNMENT_NOT_FOUND");
  const impact=await teamRemovalImpact(tx,actor.collegeId,membershipId);
  if(Object.values(impact).some(total=>total>0))
   throw new Error("TEAM_MEMBER_OWNS_WORK");
  const [removed]=await tx.delete(placementTpoTeamMembers).where(and(
   eq(placementTpoTeamMembers.id,assignment.id),
   eq(placementTpoTeamMembers.collegeId,actor.collegeId)))
   .returning({id:placementTpoTeamMembers.id});
  if(!removed)throw new Error("TEAM_ASSIGNMENT_NOT_FOUND");
  return {ok:true};
 });
}

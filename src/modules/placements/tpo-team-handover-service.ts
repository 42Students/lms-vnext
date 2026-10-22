import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {mayHandoverOwnTeamWork,tpoTeamHandoverSchema} from "./tpo-team-handover-model";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,membershipRoles,
 placementJobs,placementCompanyRelationships,placementTpoLeads,placementTpoFollowups,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasPlacementTeamMembership} from "./placement-team-access-model";
import {requirePlacementManageScope} from "./scope";
import {hasDriveOwnerColumn} from "./tpo-team-unowned-service";
import {placementTpoTeamMembers} from "@/db/schema/tpo-collaboration";

/** TPO-inbox-team-36: move work, NEVER silently revoke membership, grant roles,
 * change a private conversation's participants or reassign an unrelated ask.
 * Role changes are a separate, audited College Admin operation.
 */
export async function handoverTpoTeamWork(context:RequestContext,raw:unknown){
 const input=tpoTeamHandoverSchema.parse(raw);
 const actor=context.membership;
 if(!actor||actor.status!=="ACTIVE"||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 if(input.sourceMembershipId===actor.id)
  throw new Error("TEAM_HANDOVER_SELF");
 const college=await requirePlacementManageScope(context,actor.collegeId);
 if(!await hasDriveOwnerColumn())throw new Error("TEAM_OWNERSHIP_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  // Stable member-lock order prevents two opposing handovers from deadlocking.
  const memberIds=[input.sourceMembershipId,input.targetMembershipId].sort();
  const active=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
   .from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(inArray(collegeMemberships.id,memberIds),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .orderBy(collegeMemberships.id).for("update");
  if(active.length!==2)throw new Error("TEAM_MEMBER_NOT_FOUND");
  const roles=await tx.select({membershipId:membershipRoles.membershipId})
   .from(membershipRoles).where(and(
    inArray(membershipRoles.membershipId,memberIds),
    inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])));
  const permanent=new Set(roles.map(row=>row.membershipId));
  // A faculty coordinator may hand over owned work to a permanent TPO/admin.
  if(!permanent.has(input.targetMembershipId))throw new Error("TEAM_MEMBER_NOT_FOUND");
  if(!permanent.has(input.sourceMembershipId)){
   const [coordinator]=await tx.select({id:placementTpoTeamMembers.id})
    .from(placementTpoTeamMembers).where(and(
     eq(placementTpoTeamMembers.collegeId,college.id),
     eq(placementTpoTeamMembers.membershipId,input.sourceMembershipId)))
    .limit(1);
   if(!coordinator)throw new Error("TEAM_MEMBER_NOT_FOUND");
  }
  if(!mayHandoverOwnTeamWork({
   actorMembershipId:actor.id,sourceMembershipId:input.sourceMembershipId,
   targetMembershipId:input.targetMembershipId,sourceActive:true,targetActive:true,
  }))throw new Error("TEAM_HANDOVER_SELF");
  const jobs=await tx.update(placementJobs).set({
    ownerMembershipId:input.targetMembershipId,updatedAt:new Date(),
   }).where(and(eq(placementJobs.collegeId,college.id),
    eq(placementJobs.ownerMembershipId,input.sourceMembershipId)))
   .returning({id:placementJobs.id});
  const companies=await tx.update(placementCompanyRelationships).set({
    ownerMembershipId:input.targetMembershipId,updatedAt:new Date(),
   }).where(and(eq(placementCompanyRelationships.collegeId,college.id),
    eq(placementCompanyRelationships.ownerMembershipId,input.sourceMembershipId),
    eq(placementCompanyRelationships.status,"ACTIVE")))
   .returning({id:placementCompanyRelationships.id});
  const leads=await tx.update(placementTpoLeads).set({
    ownerMembershipId:input.targetMembershipId,updatedAt:new Date(),
   }).where(and(eq(placementTpoLeads.collegeId,college.id),
    eq(placementTpoLeads.ownerMembershipId,input.sourceMembershipId)))
   .returning({id:placementTpoLeads.id});
  const followups=await tx.update(placementTpoFollowups).set({
    ownerMembershipId:input.targetMembershipId,
   }).where(and(eq(placementTpoFollowups.collegeId,college.id),
    eq(placementTpoFollowups.ownerMembershipId,input.sourceMembershipId)))
   .returning({id:placementTpoFollowups.id});
  const counts={drives:jobs.length,companies:companies.length,
   recruiterLeads:leads.length,followups:followups.length};
  // A retried request with no matching source-owned rows is harmless;
  // do not flood the audit log or recipient bell with duplicate handovers.
  if(!Object.values(counts).some(count=>count>0))return {counts,roleRevoked:false as const};
  const [event]=await tx.insert(activityEvents).values({
    organizationId:college.organizationId,collegeId:college.id,
    actorUserId:context.user.id,actorMembershipId:actor.id,
    module:"PLACEMENTS",eventType:"placements.tpo_team.work_handed_over",
    subjectType:"team_member",subjectId:input.sourceMembershipId,
    summary:"Placement ownership handed over",
    metadata:{sourceMembershipId:input.sourceMembershipId,
     targetMembershipId:input.targetMembershipId,counts,roleRevoked:false},
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("TEAM_HANDOVER_FAILED");
  const target=active.find(row=>row.id===input.targetMembershipId);
  if(!target)throw new Error("TEAM_MEMBER_NOT_FOUND");
  await tx.insert(inAppNotifications).values({
    eventId:event.id,userId:target.userId,title:"Placement work handed over to you",
    body:counts.drives+" drives, "+counts.companies+" companies, "+
     counts.recruiterLeads+" recruiter leads and "+counts.followups+" follow-ups.",
    actionHref:"/tpo/team?tab=people",
  }).onConflictDoNothing();
  return {counts,roleRevoked:false as const};
 });
}

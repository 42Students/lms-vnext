import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalMessages} from "@/db/schema/tpo-internal";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {internalMessageSchema} from "./tpo-team-internal-model";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

/** Persist and audit one internal message; participant and both users rechecked inside transaction. */
export async function postTpoInternalMessage(context:RequestContext,raw:unknown){
 const input=internalMessageSchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_messages"))
  throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [thread]=await tx.select({
   id:placementTpoInternalThreads.id,
   startedByMembershipId:placementTpoInternalThreads.startedByMembershipId,
   invitedMembershipId:placementTpoInternalThreads.invitedMembershipId,
  }).from(placementTpoInternalThreads).where(and(
   eq(placementTpoInternalThreads.id,input.threadId),
   eq(placementTpoInternalThreads.collegeId,college.id),
  )).for("update").limit(1);
  if(!thread||![thread.startedByMembershipId,thread.invitedMembershipId].includes(membership.id))
    throw new Error("TEAM_THREAD_NOT_FOUND");
  const memberIds=[thread.startedByMembershipId,thread.invitedMembershipId];
  const active=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,"TPO"),
   )).where(and(
    inArray(collegeMemberships.id,memberIds),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"),
   )).for("share");
  if(new Set(active.map(member=>member.id)).size!==2)throw new Error("TEAM_PARTICIPANT_INACTIVE");
  const [message]=await tx.insert(placementTpoInternalMessages).values({
   threadId:thread.id,collegeId:college.id,
   authorMembershipId:membership.id,body:input.body,
  }).returning({id:placementTpoInternalMessages.id});
  if(!message)throw new Error("TEAM_MESSAGE_FAILED");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.message_sent",
   subjectType:"team_thread",subjectId:thread.id,
   summary:"Private team message created",
   metadata:{messageId:message.id,bodyLength:input.body.length},
  }).returning({id:activityEvents.id});
  const other=active.find(member=>member.id!==membership.id);
  if(!event||!other)throw new Error("TEAM_PARTICIPANT_INACTIVE");
  await tx.insert(inAppNotifications).values({
   eventId:event.id,userId:other.userId,
   title:"New private team message",
   body:"A TPO colleague replied to your private conversation.",
   actionHref:"/tpo/team/"+thread.id,
  });
  return {id:message.id,threadId:thread.id};
 });
}

import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {createHash} from "node:crypto";
import {inArray,and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications,collegeMemberships,membershipRoles,users} from "@/db/schema";
import {placementTpoInternalThreads} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {internalThreadSchema} from "./tpo-team-internal-model";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

/** A new internal thread requires an active, persisted TPO recipient from this college. */
export async function createTpoInternalThread(context:RequestContext,raw:unknown) {
 const input=internalThreadSchema.parse(raw);
 const own=context.membership;
 if(!own||!hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 if(input.recipientMembershipId===own.id)throw new Error("TEAM_RECIPIENT_NOT_FOUND");
 const college=await requirePlacementManageScope(context,own.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [recipient]=await tx.select({id:collegeMemberships.id,userId:collegeMemberships.userId})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])))
   .where(and(eq(collegeMemberships.id,input.recipientMembershipId),
     eq(collegeMemberships.collegeId,college.id),
     eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .for("share").limit(1);
  if(!recipient)throw new Error("TEAM_RECIPIENT_NOT_FOUND");
  const key=input.idempotencyKey?
   "tpo.team.thread:"+college.id+":"+context.user.id+":"+input.idempotencyKey:null;
  const topicHash=createHash("sha256").update(input.topic).digest("hex");
  if(key){
   // One author lock serializes retries even before the thread exists.
   await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
    .where(and(eq(collegeMemberships.id,own.id),eq(collegeMemberships.collegeId,college.id)))
    .for("update").limit(1);
   const [existing]=await tx.select({metadata:activityEvents.metadata})
    .from(activityEvents).where(and(eq(activityEvents.dedupeKey,key),
     eq(activityEvents.actorUserId,context.user.id),
     eq(activityEvents.collegeId,college.id))).limit(1);
   if(existing){
    if(existing.metadata.topicHash!==topicHash||
     existing.metadata.recipientMembershipId!==input.recipientMembershipId||
     typeof existing.metadata.threadId!=="string")throw new Error("TEAM_IDEMPOTENCY_CONFLICT");
    return {id:existing.metadata.threadId};
   }
  }
  const [thread]=await tx.insert(placementTpoInternalThreads).values({
   collegeId:college.id,startedByMembershipId:own.id,
   invitedMembershipId:recipient.id,topic:input.topic,
  }).returning({id:placementTpoInternalThreads.id});
  if(!thread)throw new Error("TEAM_THREAD_CREATE_FAILED");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:own.id,
   module:"PLACEMENTS",eventType:"placements.tpo_team.thread_created",
   subjectType:"team_thread",subjectId:thread.id,
   summary:"Private TPO team thread created",
   metadata:{threadId:thread.id,topicHash,recipientMembershipId:input.recipientMembershipId},
   dedupeKey:key,
  }).returning({id:activityEvents.id});
  if(!event)throw new Error("TEAM_THREAD_CREATE_FAILED");
  const [actor]=await tx.select({displayName:users.displayName})
   .from(users).where(eq(users.id,context.user.id)).limit(1);
  await tx.insert(inAppNotifications).values({
   userId:recipient.userId,eventId:event.id,
   title:(actor?.displayName?.trim()||"TPO colleague")+" added you to a conversation",
   body:input.topic.slice(0,120),
   actionHref:"/tpo/team/"+thread.id,
  });
  return thread;
 });
}

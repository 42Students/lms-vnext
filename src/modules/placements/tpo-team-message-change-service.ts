import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {createHash} from "node:crypto";
import {and,eq,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,inAppNotifications,users} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalMessages} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoTeamCanEdit} from "./tpo-team-message-change-model";

const base=z.strictObject({
 threadId:z.string().uuid(),
 messageId:z.string().uuid(),
 expectedBodyHash:z.string().regex(/^[a-f0-9]{64}$/),
});
export const tpoTeamMessageChangeSchema=z.discriminatedUnion("action",[
 base.extend({action:z.literal("EDIT"),body:z.string().trim().min(1).max(4000)}),
 base.extend({action:z.literal("DELETE")}),
]);
export function tpoTeamMessageBodyHash(body:string){
 return createHash("sha256").update(body).digest("hex");
}
/** No GET mutations; authorization, optimistic body and edit time checked under row locks. */
export async function changeTpoTeamMessage(context:RequestContext,raw:unknown){
 const input=tpoTeamMessageChangeSchema.parse(raw);
 const membership=context.membership;
 if(!membership||membership.status!=="ACTIVE"||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_messages"))throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [thread]=await tx.select({
   id:placementTpoInternalThreads.id,
   startedByMembershipId:placementTpoInternalThreads.startedByMembershipId,
   invitedMembershipId:placementTpoInternalThreads.invitedMembershipId,
  })
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,membership.id),
       eq(placementTpoInternalThreads.invitedMembershipId,membership.id)),
   )).limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  const [message]=await tx.select({
   id:placementTpoInternalMessages.id,body:placementTpoInternalMessages.body,
   createdAt:placementTpoInternalMessages.createdAt,
  }).from(placementTpoInternalMessages).where(and(
   eq(placementTpoInternalMessages.id,input.messageId),
   eq(placementTpoInternalMessages.threadId,thread.id),
   eq(placementTpoInternalMessages.collegeId,college.id),
   eq(placementTpoInternalMessages.authorMembershipId,membership.id),
  )).for("update").limit(1);
  if(!message)throw new Error("TEAM_MESSAGE_NOT_FOUND");
  if(tpoTeamMessageBodyHash(message.body)!==input.expectedBodyHash)
   throw new Error("TEAM_STALE_MESSAGE");
  const [removed]=await tx.select({id:activityEvents.id}).from(activityEvents)
   .where(and(eq(activityEvents.collegeId,college.id),
    eq(activityEvents.subjectId,thread.id),
    eq(activityEvents.eventType,"placements.tpo_team.message_deleted"),
    sql`${activityEvents.metadata}->>'messageId' = ${message.id}`,
   )).limit(1);
  if(removed)throw new Error("TEAM_MESSAGE_REMOVED");
  const now=new Date();
  if(input.action==="EDIT"&&!tpoTeamCanEdit(message.createdAt,now))
   throw new Error("TEAM_EDIT_WINDOW_EXPIRED");
  const updatedBody=input.action==="EDIT"?input.body:"Message removed";
  const [updated]=await tx.update(placementTpoInternalMessages)
   .set({body:updatedBody}).where(and(
    eq(placementTpoInternalMessages.id,message.id),
    eq(placementTpoInternalMessages.threadId,thread.id),
    eq(placementTpoInternalMessages.collegeId,college.id),
    eq(placementTpoInternalMessages.authorMembershipId,membership.id),
    eq(placementTpoInternalMessages.body,message.body),
   )).returning({id:placementTpoInternalMessages.id});
  if(!updated)throw new Error("TEAM_STALE_MESSAGE");
  const [event]=await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",
   eventType:input.action==="EDIT"?"placements.tpo_team.message_edited":
    "placements.tpo_team.message_deleted",
   subjectType:"team_thread",subjectId:thread.id,
   summary:input.action==="EDIT"?"TPO team message edited":"TPO team message removed",
   metadata:{messageId:message.id},
  }).returning({id:activityEvents.id});
  // Keep the recipient informed about edits/removals without exposing a
  // departed teammate's history. Never email or claim delivery to nonmembers.
  const otherId=thread.startedByMembershipId===membership.id?
   thread.invitedMembershipId:thread.startedByMembershipId;
  const [recipient]=await tx.select({userId:collegeMemberships.userId})
   .from(collegeMemberships)
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .where(and(eq(collegeMemberships.id,otherId),
    eq(collegeMemberships.collegeId,college.id),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"))).limit(1);
  if(event&&recipient){
   const [actor]=await tx.select({name:users.displayName}).from(users)
    .where(eq(users.id,context.user.id)).limit(1);
   const who=actor?.name?.trim()||"A teammate";
   await tx.insert(inAppNotifications).values({
    eventId:event.id,userId:recipient.userId,
    title:who+(input.action==="EDIT"?" edited a Team message":" removed a Team message"),
    body:input.action==="EDIT"?"A Team message has been updated.":"Message removed",
    actionHref:"/tpo/team/"+thread.id+"?m="+message.id,
   }).onConflictDoNothing();
  }
  return {id:message.id,action:input.action};
 });
}

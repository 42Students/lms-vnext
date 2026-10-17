import "server-only";
import {and,eq,or,desc,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalMessages} from "@/db/schema/tpo-internal";
import {type RequestContext,hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";

export const tpoTeamDecisionSchema=z.strictObject({
 threadId:z.string().uuid(),messageId:z.string().uuid(),
 mark:z.boolean(),expectedMarked:z.boolean(),
});
/** A decision is a scoped, latest-event state; no GET side effects. */
export async function setTpoTeamDecision(context:RequestContext,raw:unknown){
 const input=tpoTeamDecisionSchema.parse(raw),membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO")||membership.status!=="ACTIVE")
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_messages"))throw new Error("TEAM_TABLES_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [thread]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,input.threadId),
    eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,membership.id),
       eq(placementTpoInternalThreads.invitedMembershipId,membership.id)),
   )).for("update").limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  const [message]=await tx.select({id:placementTpoInternalMessages.id})
   .from(placementTpoInternalMessages).where(and(
    eq(placementTpoInternalMessages.id,input.messageId),
    eq(placementTpoInternalMessages.collegeId,college.id),
    eq(placementTpoInternalMessages.threadId,thread.id),
   )).limit(1);
  if(!message)throw new Error("TEAM_MESSAGE_NOT_FOUND");
  const [last]=await tx.select({eventType:activityEvents.eventType})
   .from(activityEvents).where(and(
    eq(activityEvents.collegeId,college.id),
    eq(activityEvents.subjectType,"team_thread"),
    eq(activityEvents.subjectId,thread.id),
    or(eq(activityEvents.eventType,"placements.tpo_team.decision_marked"),
       eq(activityEvents.eventType,"placements.tpo_team.decision_unmarked")),
    sql`${activityEvents.metadata}->>'messageId' = ${message.id}`,
   )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(1);
  const marked=last?.eventType==="placements.tpo_team.decision_marked";
  if(marked!==input.expectedMarked)throw new Error("TEAM_STALE_DECISION");
  if(marked===input.mark)return {marked};
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorMembershipId:membership.id,actorUserId:context.user.id,
   module:"PLACEMENTS",
   eventType:input.mark?"placements.tpo_team.decision_marked":
    "placements.tpo_team.decision_unmarked",
   subjectType:"team_thread",subjectId:thread.id,
   summary:input.mark?"Team marked message as a decision":"Team unmarked a decision",
   metadata:{messageId:message.id},
  });
  return {marked:input.mark};
 });
}

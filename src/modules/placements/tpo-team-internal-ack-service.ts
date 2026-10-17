import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {and,eq,inArray,isNull,or,like} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {placementTpoInternalThreads,placementTpoInternalReads} from "@/db/schema/tpo-internal";
import {placementTableExists} from "./staged-tables";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {tpoThreadIdSchema} from "./tpo-team-conversation-service";
/** Explicit acknowledgement, never a side effect of GET or opening a page. */
export async function acknowledgeTpoInternalThread(context:RequestContext,rawId:unknown){
 const id=tpoThreadIdSchema.parse(rawId);
 const membership=context.membership;
 if(!membership||!hasPlacementTeamMembership(context))
  throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 const readsReady=await placementTableExists("placement_tpo_internal_reads");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [thread]=await tx.select({id:placementTpoInternalThreads.id})
   .from(placementTpoInternalThreads).where(and(
    eq(placementTpoInternalThreads.id,id),
    eq(placementTpoInternalThreads.collegeId,college.id),
    or(eq(placementTpoInternalThreads.startedByMembershipId,membership.id),
       eq(placementTpoInternalThreads.invitedMembershipId,membership.id)),
   )).for("share").limit(1);
  if(!thread)throw new Error("TEAM_THREAD_NOT_FOUND");
  if(readsReady)await tx.insert(placementTpoInternalReads).values({
   collegeId:college.id,threadId:thread.id,membershipId:membership.id,readThrough:new Date(),
  }).onConflictDoUpdate({
   target:[placementTpoInternalReads.threadId,placementTpoInternalReads.membershipId],
   set:{readThrough:new Date()},
  });
  const ids=await tx.select({id:inAppNotifications.id})
   .from(inAppNotifications)
   .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
   .where(and(
    eq(inAppNotifications.userId,context.user.id),
    or(eq(inAppNotifications.actionHref,"/tpo/team/"+thread.id),
       like(inAppNotifications.actionHref,"/tpo/team/"+thread.id+"?m=%")),
    isNull(inAppNotifications.readAt),
    eq(activityEvents.collegeId,college.id),
    eq(activityEvents.organizationId,college.organizationId),
    eq(activityEvents.module,"PLACEMENTS"),
    or(eq(activityEvents.eventType,"placements.tpo_team.message_sent"),
       eq(activityEvents.eventType,"placements.tpo_team.thread_created")),
   )).limit(500);
  if(!ids.length)return {marked:0};
  const changed=await tx.update(inAppNotifications).set({readAt:new Date()})
   .where(and(inArray(inAppNotifications.id,ids.map(row=>row.id)),
              eq(inAppNotifications.userId,context.user.id),
              isNull(inAppNotifications.readAt)))
   .returning({id:inAppNotifications.id});
  return {marked:changed.length};
 });
}

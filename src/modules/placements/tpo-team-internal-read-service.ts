import "server-only";
import {and,desc,eq,isNull,or,like,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoInternalThreads} from "./tpo-team-staged-schema";
/** Read only threads where the active TPO membership is a named participant. */
export async function listMyTpoInternalThreads(context:RequestContext){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))
  return {status:"NOT_REGISTERED" as const,items:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const items=await tx.select({
   id:tpoInternalThreads.id,topic:tpoInternalThreads.topic,
   createdAt:tpoInternalThreads.createdAt,
  }).from(tpoInternalThreads)
   .where(and(eq(tpoInternalThreads.collegeId,college.id),
    or(eq(tpoInternalThreads.startedByMembershipId,membership.id),
       eq(tpoInternalThreads.invitedMembershipId,membership.id))))
   .orderBy(desc(tpoInternalThreads.createdAt),desc(tpoInternalThreads.id)).limit(50);
  const unread = await tx.select({
   href:inAppNotifications.actionHref,
   total:sql<number>`count(*)::integer`,
  }).from(inAppNotifications)
   .innerJoin(activityEvents,eq(activityEvents.id,inAppNotifications.eventId))
   .where(and(
    eq(inAppNotifications.userId,context.user.id),
    eq(activityEvents.collegeId,college.id),
    eq(activityEvents.organizationId,college.organizationId),
    eq(activityEvents.module,"PLACEMENTS"),
    or(eq(activityEvents.eventType,"placements.tpo_team.message_sent"),
       eq(activityEvents.eventType,"placements.tpo_team.thread_created")),
    isNull(inAppNotifications.readAt),
    like(inAppNotifications.actionHref,"/tpo/team/%"),
   )).groupBy(inAppNotifications.actionHref);
  const unreadByHref=new Map(unread.map(row=>[row.href,Number(row.total)]));
  return {status:"READY" as const,items:items.map(row=>({
   ...row,unreadCount:unreadByHref.get("/tpo/team/"+row.id)??0,
  }))};
 });
}

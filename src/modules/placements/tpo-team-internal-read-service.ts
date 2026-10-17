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
export async function listMyTpoInternalThreads(context:RequestContext,rawSearch="",page=1){
 const safePage=Number.isSafeInteger(page)?Math.max(1,Math.min(1000,page)):1;
 const search=rawSearch.trim().slice(0,120);
 const q=search.length>=2?search:"";
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))
  return {status:"NOT_REGISTERED" as const,items:[]};
 const readsReady=await placementTableExists("placement_tpo_internal_reads");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const lastActivity=sql<Date>`coalesce((select max(m.created_at) from placement_tpo_internal_messages m
   where m.thread_id=${tpoInternalThreads.id} and m.college_id=${college.id}::uuid),
   ${tpoInternalThreads.createdAt})`;
  const items=await tx.select({
   id:tpoInternalThreads.id,topic:tpoInternalThreads.topic,
   createdAt:tpoInternalThreads.createdAt,
   lastActivityAt:lastActivity,
   counterpartName:sql<string|null>`(select coalesce(nullif(btrim(u.display_name),''),'Team member')
    from college_memberships cm join users u on u.id=cm.user_id
    where cm.college_id=${college.id}::uuid and cm.id=
     (case when ${tpoInternalThreads.startedByMembershipId}=${membership.id}::uuid
       then ${tpoInternalThreads.invitedMembershipId} else ${tpoInternalThreads.startedByMembershipId} end)
    limit 1)`,
   kind:sql<"PRIVATE">`'PRIVATE'`,
   lastPreview:sql<string|null>`(select left(m.body,160) from placement_tpo_internal_messages m
     where m.thread_id=placement_tpo_internal_threads.id
     order by m.created_at desc,m.id desc limit 1)`,
   following:readsReady?sql<boolean>`coalesce((select r.following
    from placement_tpo_internal_reads r where r.thread_id=${tpoInternalThreads.id}
    and r.membership_id=${membership.id}::uuid),true)`:sql<boolean>`true`,
   muted:readsReady?sql<boolean>`coalesce((select r.muted_at is not null
    from placement_tpo_internal_reads r where r.thread_id=${tpoInternalThreads.id}
    and r.membership_id=${membership.id}::uuid),false)`:sql<boolean>`false`,
   unreadMessages:readsReady?sql<number>`(select count(*)::integer from placement_tpo_internal_messages m
     where m.thread_id=${tpoInternalThreads.id} and m.college_id=${college.id}::uuid
       and m.author_membership_id<>${membership.id}::uuid
       and m.created_at>coalesce((select r.read_through from placement_tpo_internal_reads r
         where r.thread_id=${tpoInternalThreads.id} and r.membership_id=${membership.id}::uuid),
          '-infinity'::timestamptz))`:sql<number>`0`,
   searchSnippet:q?sql<string|null>`(select left(m.body,160) from placement_tpo_internal_messages m
     where m.thread_id=placement_tpo_internal_threads.id
       and position(lower(${q}) in lower(m.body))>0
     order by m.created_at desc,m.id desc limit 1)`:sql<string|null>`null`,
  }).from(tpoInternalThreads)
   .where(and(eq(tpoInternalThreads.collegeId,college.id),
    or(eq(tpoInternalThreads.startedByMembershipId,membership.id),
       eq(tpoInternalThreads.invitedMembershipId,membership.id)),
    q?or(sql`position(lower(${q}) in lower(${tpoInternalThreads.topic}))>0`,
      sql`exists(select 1 from placement_tpo_internal_messages m
        where m.thread_id=${tpoInternalThreads.id}
        and m.college_id=${college.id}::uuid
        and position(lower(${q}) in lower(m.body))>0)`) : undefined))
   .orderBy(desc(lastActivity),desc(tpoInternalThreads.id)).limit(101).offset((safePage-1)*100);
  const visibleItems=items.slice(0,100);
  const hasMore=items.length>100;
  if(readsReady)return {status:"READY" as const,items:visibleItems.map(row=>({
   ...row,unreadCount:row.following&&!row.muted?Number(row.unreadMessages):0,
  })),page:safePage,hasMore};
  // Legacy fallback while the proposed read-receipt migration is not yet registered.
  // Unread counts are per original recipient: query results never change who may read a thread.
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
  const unreadByHref=new Map<string,number>();
  for(const row of unread){
   if(!row.href)continue;
   const threadHref=row.href.split("?")[0];
   unreadByHref.set(threadHref,(unreadByHref.get(threadHref)??0)+Number(row.total));
  }
  return {status:"READY" as const,items:visibleItems.map(row=>({
   ...row,unreadCount:unreadByHref.get("/tpo/team/"+row.id)??0,
  })),page:safePage,hasMore};
 });
}

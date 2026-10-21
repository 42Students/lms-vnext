import {hasPlacementTeamMembership} from "./placement-team-access-model";
import "server-only";
import {and,desc,eq,isNull,or,like,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,inAppNotifications} from "@/db/schema";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "./scope";
import {placementTableExists} from "./staged-tables";
import {tpoInternalThreads} from "./tpo-team-staged-schema";
export type TpoTeamThreadFilter =
 "following"|"all"|"me"|"asks"|"decisions"|"drives"|"companies"|"topics";

/** Thread filter conditions are evaluated inside the scoped SQL WHERE clause
 * before LIMIT/OFFSET. This keeps counts and filters correct across pages.
 */
export async function listMyTpoInternalThreads(
 context:RequestContext,rawSearch="",page=1,filter:TpoTeamThreadFilter="all",
){
 const safePage=Number.isSafeInteger(page)?Math.max(1,Math.min(1000,page)):1;
 const search=rawSearch.trim().slice(0,120);
 const q=search.length>=2?search:"";
 const membership=context.membership;
 if(!membership||!hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("placement_tpo_internal_threads"))
  return {status:"NOT_REGISTERED" as const,items:[]};
 const readsReady=await placementTableExists("placement_tpo_internal_reads");
 const asksReady=await placementTableExists("placement_tpo_team_asks");
 const groupsReady=await placementTableExists("placement_tpo_internal_thread_participants");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const lastActivity=sql<Date>`coalesce((select max(m.created_at) from placement_tpo_internal_messages m
   where m.thread_id=${tpoInternalThreads.id} and m.college_id=${college.id}::uuid),
   ${tpoInternalThreads.createdAt})`;
  const followed = readsReady ? sql`coalesce((select r.following
     from placement_tpo_internal_reads r where r.thread_id=${tpoInternalThreads.id}
       and r.membership_id=${membership.id}::uuid),true)` : sql`true`;
  const unreadForMe = readsReady ? sql`exists(
     select 1 from placement_tpo_internal_messages m
     where m.thread_id=${tpoInternalThreads.id} and m.college_id=${college.id}::uuid
       and m.author_membership_id<>${membership.id}::uuid
       and m.created_at>coalesce((select r.read_through from placement_tpo_internal_reads r
         where r.thread_id=${tpoInternalThreads.id}
           and r.membership_id=${membership.id}::uuid),'-infinity'::timestamptz))` : sql`false`;
  const openAsks = asksReady ? sql`exists(
     select 1 from placement_tpo_team_asks a
     where a.thread_id=${tpoInternalThreads.id} and a.college_id=${college.id}::uuid
       and a.status='OPEN')` : sql`false`;
  const asksForMe = asksReady ? sql`exists(
     select 1 from placement_tpo_team_asks a
     where a.thread_id=${tpoInternalThreads.id} and a.college_id=${college.id}::uuid
       and a.assignee_membership_id=${membership.id}::uuid and a.status='OPEN')` : sql`false`;
  const decisionExists = sql`exists(
    select 1 from activity_events de
    where de.college_id=${college.id}::uuid and de.subject_type='team_thread'
      and de.subject_id=${tpoInternalThreads.id}::text
      and de.event_type='placements.tpo_team.decision_marked'
      and not exists (
       select 1 from activity_events later
       where later.college_id=${college.id}::uuid and later.subject_type='team_thread'
        and later.subject_id=de.subject_id
        and later.metadata->>'messageId'=de.metadata->>'messageId'
        and later.event_type in ('placements.tpo_team.decision_marked',
          'placements.tpo_team.decision_unmarked','placements.tpo_team.message_deleted')
        and (later.occurred_at,later.id)>(de.occurred_at,de.id)
      )
   )`;
  const filterCondition = filter==="following"?followed:
    filter==="me"?sql`(${asksForMe} or ${unreadForMe})`:
    filter==="asks"?openAsks:
    filter==="decisions"?decisionExists:
    filter==="drives"?(groupsReady?sql`${tpoInternalThreads.kind}='DRIVE'`:sql`false`):
    filter==="companies"?(groupsReady?sql`${tpoInternalThreads.kind}='COMPANY'`:sql`false`):
    filter==="topics"?(groupsReady?sql`${tpoInternalThreads.kind}='TOPIC'`:sql`false`):undefined;
  const threadScope = and(eq(tpoInternalThreads.collegeId,college.id),
    groupsReady
     ? sql`((
         ${tpoInternalThreads.kind} = 'DIRECT'
         and (${tpoInternalThreads.startedByMembershipId} = ${membership.id}::uuid
           or ${tpoInternalThreads.invitedMembershipId} = ${membership.id}::uuid)
       ) or (
         ${tpoInternalThreads.kind} <> 'DIRECT'
         and exists (select 1 from placement_tpo_internal_thread_participants part
           where part.thread_id=${tpoInternalThreads.id}
             and part.college_id=${college.id}::uuid
             and part.membership_id=${membership.id}::uuid and part.left_at is null)
       ))`
     : or(eq(tpoInternalThreads.startedByMembershipId,membership.id),
          eq(tpoInternalThreads.invitedMembershipId,membership.id)),
    q?or(sql`position(lower(${q}) in lower(${tpoInternalThreads.topic}))>0`,
      sql`exists(select 1 from placement_tpo_internal_messages m
        where m.thread_id=${tpoInternalThreads.id}
        and m.college_id=${college.id}::uuid
        and position(lower(${q}) in lower(m.body))>0)`) : undefined,
    filterCondition);
  const [countRow]=await tx.select({total:sql<number>`count(*)::integer`})
    .from(tpoInternalThreads).where(threadScope);
  const totalCount=Number(countRow?.total??0);
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
   kind:groupsReady?sql<"DIRECT" | "TOPIC" | "DRIVE" | "COMPANY">`case
     when ${tpoInternalThreads.id} is not null and
       exists(select 1 from placement_tpo_internal_thread_participants p
         where p.thread_id=${tpoInternalThreads.id} and p.college_id=${college.id}::uuid
           and p.left_at is null)
       then (select coalesce(t.kind,'DIRECT') from placement_tpo_internal_threads t
         where t.id=${tpoInternalThreads.id})
     else 'DIRECT' end`:sql<"DIRECT">`'DIRECT'`,

   openAsks:asksReady?sql<number>`(select count(*)::integer from placement_tpo_team_asks a
    where a.thread_id=${tpoInternalThreads.id} and a.college_id=${college.id}::uuid
     and a.status='OPEN')`:sql<number>`0`,
   asksForMe:asksReady?sql<number>`(select count(*)::integer from placement_tpo_team_asks a
    where a.thread_id=${tpoInternalThreads.id} and a.college_id=${college.id}::uuid
     and a.assignee_membership_id=${membership.id}::uuid and a.status='OPEN')`:sql<number>`0`,
   hasDecisions:sql<boolean>`exists(
    select 1 from activity_events decision_event
    where decision_event.college_id=${college.id}::uuid
      and decision_event.subject_type='team_thread'
      and decision_event.subject_id=${tpoInternalThreads.id}::text
      and decision_event.event_type='placements.tpo_team.decision_marked'
      and not exists (
        select 1 from activity_events later
        where later.college_id=${college.id}::uuid
          and later.subject_type='team_thread'
          and later.subject_id=decision_event.subject_id
          and later.metadata->>'messageId'=decision_event.metadata->>'messageId'
          and later.event_type in ('placements.tpo_team.decision_marked',
            'placements.tpo_team.decision_unmarked','placements.tpo_team.message_deleted')
          and (later.occurred_at,later.id)>(decision_event.occurred_at,decision_event.id)
      )
   )`,
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
   .where(threadScope)
   .orderBy(desc(lastActivity),desc(tpoInternalThreads.id)).limit(101).offset((safePage-1)*100);
  const visibleItems=items.slice(0,100);
  const hasMore=safePage*100<totalCount;
  if(readsReady)return {status:"READY" as const,items:visibleItems.map(row=>({
   ...row,
   // Count actual unread messages independently of a muted/unfollowed badge.
   rawUnreadCount:Number(row.unreadMessages),
   unreadCount:row.following&&!row.muted?Number(row.unreadMessages):0,
  })),page:safePage,hasMore,asksReady,totalCount};
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
   ...row,rawUnreadCount:unreadByHref.get("/tpo/team/"+row.id)??0,
   unreadCount:unreadByHref.get("/tpo/team/"+row.id)??0,
  })),page:safePage,hasMore,asksReady,totalCount};
 });
}

/** Display states shared by the list/lookup entry points. Do not convert a
 * failed authorization or unavailable storage into a misleading empty inbox. */
export function tpoTeamThreadsListState(status:"READY"|"NOT_REGISTERED"|"FAILED",total:number){
 if(status==="NOT_REGISTERED")return {kind:"UNAVAILABLE" as const,message:"Team conversations are not ready for this college."};
 if(status==="FAILED")return {kind:"ERROR" as const,message:"Couldn\u0027t load team conversations. Try again."};
 if(total===0)return {kind:"EMPTY" as const,message:"No team conversations yet."};
 return {kind:"READY" as const,message:""};
}

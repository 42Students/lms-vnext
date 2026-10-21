import Link from "next/link";
import {and,desc,eq,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoInternalThreads} from "@/db/schema/tpo-internal";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {TpoTeamThreadCreate} from "@/components/tpo/tpo-team-forms";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import type {RequestContext} from "@/modules/identity/context";

/** The TPO Team tab remains under Messages, while the existing protected
 * /tpo/team/:threadId page owns the conversation detail and reply actions. */
export async function TpoTeamMessagesDirectory({context,query}:{context:RequestContext;query:string}){
 const member=context.membership;
 if(!member)return null;
 const collegeId=member.collegeId, actorId=member.id;
 await requirePlacementManageScope(context,collegeId);
 const [ready,participantsReady]=await Promise.all([
  placementTableExists("placement_tpo_internal_threads"),
  placementTableExists("placement_tpo_internal_thread_participants"),
 ]);
 if(!ready)return <ErrorState title="Could not load conversations"
  description="Team conversations are temporarily unavailable. The Recruiters tab is still accessible."
  action={<Link href="/tpo/messages?tab=team" className="font-semibold text-link underline">Retry</Link>}/>;
 const rows=await getDb().select({id:placementTpoInternalThreads.id,
  topic:placementTpoInternalThreads.topic,kind:placementTpoInternalThreads.kind,
  createdAt:placementTpoInternalThreads.createdAt})
  .from(placementTpoInternalThreads).where(and(
   eq(placementTpoInternalThreads.collegeId,collegeId),
   participantsReady?sql`((
     ${placementTpoInternalThreads.kind} = 'DIRECT' and
       (${placementTpoInternalThreads.startedByMembershipId} = ${actorId}::uuid or
        ${placementTpoInternalThreads.invitedMembershipId} = ${actorId}::uuid)
    ) or (
      ${placementTpoInternalThreads.kind} <> 'DIRECT' and
      exists (select 1 from placement_tpo_internal_thread_participants p
        where p.thread_id=${placementTpoInternalThreads.id}
          and p.college_id=${collegeId}::uuid and p.membership_id=${actorId}::uuid
          and p.left_at is null)
    ))`:or(eq(placementTpoInternalThreads.startedByMembershipId,actorId),
       eq(placementTpoInternalThreads.invitedMembershipId,actorId)),
  )).orderBy(desc(placementTpoInternalThreads.createdAt)).limit(100);
 const term=query.length<=120?query.trim().toLocaleLowerCase("en-IN"):"";
 const visible=rows.filter(row=>!term||row.topic.toLocaleLowerCase("en-IN").includes(term));
 const roster=await getTpoPlacementTeam(context,collegeId).catch(()=>null);
 const colleagues=roster?.members.filter(row=>row.membershipId!==actorId)
   .map(row=>({membershipId:row.membershipId,displayName:row.displayName}))??[];
 return <section aria-label="Team conversations" role="tabpanel" className="space-y-4">
  <h2 className="text-lg font-semibold">Team conversations</h2>
  <form method="get" action="/tpo/messages" className="flex min-w-0 flex-wrap gap-2">
   <Input type="hidden" name="tab" value="team"/>
   <Input type="search" name="q" maxLength={120} defaultValue={term}
    placeholder="Search team topics" aria-label="Search team topics" className="min-w-0 flex-1"/>
   <Button type="submit">Search</Button>
  </form>
  {visible.length===0?<EmptyState title="No team conversations"
   description={term?"No team topic matches this search. Clear the search to show your conversations.":"Start a private conversation with a placement-team colleague."}/>:
   <ul className="divide-y divide-border">{visible.map(row=><li key={row.id}>
    <Link href={"/tpo/team/"+row.id} className="block min-h-11 py-3 hover:text-link">
     <span className="block font-semibold text-link">{row.topic}</span>
     <span className="block text-xs text-muted-foreground">{row.kind.toLowerCase()} · {new Intl.DateTimeFormat("en-IN",{
      timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
     }).format(row.createdAt)} IST</span>
    </Link>
   </li>)}</ul>}
  {rows.length===100?<p className="text-xs text-muted-foreground">Showing the latest 100 conversations.</p>:null}
  {colleagues.length>0?<TpoTeamThreadCreate members={colleagues} actorUserId={context.user.id}/>:
   <p className="text-sm text-muted-foreground">No other active placement-team colleague is available.</p>}
 </section>;
}

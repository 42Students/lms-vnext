import Link from "next/link";
import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {TpoTeamThreadCreate} from "@/components/tpo/tpo-team-forms";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import type {RequestContext} from "@/modules/identity/context";

/** Same tenant/participant read contract as the original Team inbox, in Messages. */
export async function TpoTeamMessagesDirectory({context,query}:{context:RequestContext;query:string}){
 const member=context.membership;
 if(!member)return null;
 const safeQuery=query.length<=120?query.trim():"";
 const data=await listMyTpoInternalThreads(context,safeQuery).catch(()=>null);
 if(!data||data.status!=="READY")return <ErrorState title="Could not load conversations"
  description="Team conversations are temporarily unavailable. The Recruiters tab remains accessible."
  action={<Link href="/tpo/messages?tab=team" className="font-semibold text-link underline">Retry</Link>}/>;
 const roster=await getTpoPlacementTeam(context,member.collegeId).catch(()=>null);
 const colleagues=roster?.members.filter(row=>row.membershipId!==member.id)
  .map(row=>({membershipId:row.membershipId,displayName:row.displayName}))??[];
 return <section role="tabpanel" aria-label="Team conversations" className="space-y-4">
  <h2 className="text-lg font-semibold">Team conversations</h2>
  <form method="get" action="/tpo/messages" className="flex min-w-0 flex-wrap gap-2">
   <Input type="hidden" name="tab" value="team"/>
   <Input type="search" name="q" maxLength={120} defaultValue={safeQuery}
    placeholder="Search team topics or messages" aria-label="Search team conversations" className="min-w-0 flex-1"/>
   <Button type="submit">Search</Button>
  </form>
  {data.items.length===0?<EmptyState title="No team conversations"
   description={safeQuery?"No conversations match this search. Clear the search to see all conversations.":"Start a private conversation with a placement-team colleague."}/>:
   <ul className="divide-y divide-border">{data.items.map(item=><li key={item.id}>
    <Link href={"/tpo/team/"+item.id} className="block min-h-11 py-3 hover:text-link">
     <span className="block font-semibold text-link">{item.topic}</span>
     <span className="mt-1 block text-xs text-muted-foreground">
      {item.kind.toLowerCase()} · {item.counterpartName??"Team member"} · {new Intl.DateTimeFormat("en-IN",{
       timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
      }).format(item.lastActivityAt)} IST
      {item.unreadCount>0?" · "+item.unreadCount+" unread":""}
     </span>
     {item.lastPreview?<span className="mt-1 block truncate text-sm text-body">{item.lastPreview}</span>:null}
    </Link>
   </li>)}</ul>}
  {data.hasMore?<p className="text-xs text-muted-foreground">Showing the latest 100 conversations. Refine the search to locate older conversations.</p>:null}
  {colleagues.length>0?<TpoTeamThreadCreate members={colleagues} actorUserId={context.user.id}/>:
   <p className="text-sm text-muted-foreground">No other active placement-team colleague is available.</p>}
 </section>;
}

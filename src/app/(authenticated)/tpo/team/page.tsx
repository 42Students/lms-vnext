import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import {TpoTeamSearch} from "@/components/tpo/tpo-team-search";
import {TpoTeamThreadCreate} from "@/components/tpo/tpo-team-forms";
import Link from "next/link";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import {redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {parseTpoTeamTab} from "@/modules/placements/tpo-team-tabs-model";
import {TPO_TEAM_ROLE_LABELS} from "@/modules/placements/tpo-settings-read-model";
import {sortTpoPeople,type TpoPeopleSort} from "@/modules/placements/tpo-team-people-sort-model";
import {filterTpoTeamConversations,tpoTeamConversationCounts,tpoTeamConversationFilterSchema} from "@/modules/placements/tpo-team-conversation-filter-model";

const tabSchema=z.object({tab:z.enum(["conversations","people"]).optional(),sort:z.enum(["WORK","NAME"]).optional(),q:z.string().max(120).optional(),filter:tpoTeamConversationFilterSchema.optional()}).strict();
export default async function TpoTeamPage({searchParams}:{
 searchParams:Promise<{tab?:string|string[];sort?:string|string[];q?:string|string[];filter?:string|string[];c?:string|string[];m?:string|string[]}>}) {
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const threadId=Array.isArray(raw.c)?raw.c[0]:raw.c;
 const messageId=Array.isArray(raw.m)?raw.m[0]:raw.m;
 if(threadId&&z.string().uuid().safeParse(threadId).success){
  const target=messageId&&z.string().uuid().safeParse(messageId).success?
   "?m="+encodeURIComponent(messageId):"";
  redirect("/tpo/team/"+encodeURIComponent(threadId)+target);
 }
 const tabInput=Array.isArray(raw.tab)?raw.tab[0]:raw.tab;
 const parsed=tabSchema.safeParse({tab:tabInput==="members"?"people":tabInput,
  sort:Array.isArray(raw.sort)?raw.sort[0]:raw.sort,
  q:Array.isArray(raw.q)?raw.q[0]:raw.q,
  filter:Array.isArray(raw.filter)?raw.filter[0]:raw.filter});
 const tab=parsed.success?parseTpoTeamTab(parsed.data.tab):"conversations";
 const team=await getTpoPlacementTeam(context,context.membership.collegeId);
 const peopleSort:TpoPeopleSort=parsed.success?(parsed.data.sort??"WORK"):"WORK";
 const people=sortTpoPeople(team.members,peopleSort);
 const search=parsed.success?(parsed.data.q??""):"";
 const conversations=tab==="conversations"?await listMyTpoInternalThreads(context,search)
  .catch(()=>({status:"FAILED" as const,items:[]})):null;
 const filter=parsed.success?(parsed.data.filter??"ALL"):"ALL";
 const conversationCounts=conversations?.status==="READY"?tpoTeamConversationCounts(conversations.items):null;
 const visibleConversations=conversations?.status==="READY"?filterTpoTeamConversations(conversations.items,filter):[];
 return <div className="space-y-6">
  <TpoLiveRefresh intervalMs={30000}/>
  <PageHeader eyebrow="TPO · Internal" title={TPO_OWNER_PAGE_COPY.team}
   description="Who does what, and what you decided. Recruiters and students never see this." />
  <nav aria-label="Team tabs" className="flex flex-wrap gap-2">
   {(["conversations","people"] as const).map(item=><Link key={item} href={"/tpo/team?tab="+item}
     aria-current={tab===item?"page":undefined}
     className={tab===item?"rounded-md bg-primary px-4 py-3 text-sm text-on-primary":"rounded-md border border-border px-4 py-3 text-sm text-body"}>
    {item==="people"?"People":"Conversations"}
   </Link>)}
  </nav>
  {tab==="people"?<section className="space-y-4">
    <p role="status" className="text-sm text-body">{team.summary.total} people in the active placement team</p>
    <nav aria-label="Sort team people" className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold">Sort:</span>
      {([["WORK","Most assigned duties"],["NAME","Name"]] as const).map(([value,label])=>
       <Link key={value} href={"/tpo/team?tab=people&sort="+value}
        aria-current={peopleSort===value?"page":undefined}
        className={peopleSort===value?"rounded-md bg-primary px-3 py-2 text-on-primary":"rounded-md border border-border px-3 py-2 text-body"}>
        {label}
       </Link>)}
      <span className="text-xs text-muted-foreground">Overdue asks are not yet recorded in this roster.</span>
    </nav>
    {people.length?<ul className="grid gap-3 sm:grid-cols-2">
      {people.map(member=><li key={member.membershipId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
       <h2 className="break-words font-semibold text-foreground">{member.displayName}</h2>
       <p className="mt-2 text-sm text-body">{member.roles.map(role=>TPO_TEAM_ROLE_LABELS[role]).join(" · ")}</p>
       {member.studentDuties.length?<p className="mt-2 text-xs text-muted-foreground">
         {member.studentDuties.length} recorded drive-day duties
       </p>:null}
      </li>)}
    </ul>:<EmptyState title="No active team assignments" description="No members match this college's currently active role evidence." />}
  </section>:<section className="rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold text-foreground">Internal conversations</h2>
    <div className="mt-3"><TpoTeamSearch value={search}/></div>
    {conversationCounts?<p className="mt-2 text-xs text-muted-foreground">Counts are for the first 100 conversations currently loaded.</p>:null}
    {conversationCounts?<nav aria-label="Filter team conversations" className="mt-3 flex flex-wrap gap-2">
     {(["ALL","FOLLOWING","UNREAD","TOPICS"] as const).map(key=><Link key={key}
      href={"/tpo/team?"+new URLSearchParams({tab:"conversations",filter:key,...(search?{q:search}:{})}).toString()}
      aria-current={filter===key?"page":undefined}
      className={filter===key?"rounded-md bg-primary px-3 py-2 text-sm text-on-primary":"rounded-md border border-border px-3 py-2 text-sm text-body"}>
      {key==="ALL"?"All":key==="FOLLOWING"?"Following":key==="UNREAD"?"Unread":"Topics"} ({conversationCounts[key]})
     </Link>)}
    </nav>:null}
    <Link href="/tpo/team/everyone" className="mt-3 block rounded-lg border border-border bg-surface-secondary p-4 font-semibold text-primary-text">Everyone → <span className="mt-1 block text-xs font-normal text-body">Everyone in the placement team, including people who join later. You can mute it, not leave it.</span></Link>
    {conversations?.status==="READY"?<TpoTeamThreadCreate actorUserId={context.user.id} members={team.members.filter(
      member=>member.membershipId!==context.membership?.id&&member.roles.includes("TPO"))
      .map(member=>({membershipId:member.membershipId,displayName:member.displayName}))}/>:null}
    {conversations?.status==="FAILED"?<div role="alert" className="mt-3 rounded-lg border border-border p-3 text-sm">
     Could not load conversations right now. Your search has been kept.
     <Link className="ml-2 font-semibold text-primary-text underline" href={"/tpo/team?tab=conversations"+(search?"&q="+encodeURIComponent(search):"")}>Retry conversations</Link>
    </div>:null}
    {conversations?.status==="NOT_REGISTERED"?
      <p role="status" className="mt-2 text-sm text-body">Private placement-team conversations require the unregistered internal messaging migration. No messages were inferred from recruiter conversations.</p>:
      conversations?.status==="FAILED"?null:
      visibleConversations.length?<ul className="mt-3 space-y-2">{visibleConversations.map(row=>
       <li key={row.id} className="rounded-md border border-border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
         <Link className="min-w-0 break-words font-semibold text-primary-text" href={"/tpo/team/"+row.id}>🔒 {row.topic}</Link>
         {row.unreadCount>0 ? <span aria-label={row.unreadCount+" unread updates"}
          className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-primary-text">
          {row.unreadCount} unread
         </span>:null}
        </div>
        <p className="mt-1 truncate text-xs text-body">With {row.counterpartName??"Team member"} · Private conversation</p>
        {row.searchSnippet??row.lastPreview?<p className="mt-1 truncate text-xs text-muted-foreground">{row.searchSnippet??row.lastPreview}</p>:null}
        <p className="mt-1 text-xs text-muted-foreground">Internal thread · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(row.createdAt)}</p>
       </li>)}</ul>:
       <div className="mt-2 space-y-2 text-sm text-body"><p role="status">{search||filter!=="ALL"?"No conversations match these filters. Clear filters to see all.":"No private team conversations yet. Everyone is always available."}</p>{search||filter!=="ALL"?<Link href="/tpo/team?tab=conversations" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>:null}</div>}
    <Link href="/tpo/messages" className="mt-3 inline-flex min-h-11 items-center text-primary-text">
      Open existing recruiter communications
    </Link>
  </section>}
 </div>;
}

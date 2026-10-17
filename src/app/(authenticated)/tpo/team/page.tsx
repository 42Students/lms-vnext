import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import {readTpoTeamAskWorkload} from "@/modules/placements/tpo-team-workload-service";
import {listTpoTeamAway} from "@/modules/placements/tpo-team-away-service";
import {TpoTeamAwayForm} from "@/components/tpo/tpo-team-away-form";
import {TpoTeamAssignUnowned} from "@/components/tpo/tpo-team-assign-unowned";
import {readTpoUnownedWork} from "@/modules/placements/tpo-team-unowned-service";
import {readTpoTeamOwnershipWorkload} from "@/modules/placements/tpo-team-ownership-workload-service";
import {TpoTeamSearch} from "@/components/tpo/tpo-team-search";
import {TpoTeamThreadCreate} from "@/components/tpo/tpo-team-forms";
import Link from "next/link";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import {redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {parseTpoTeamTab} from "@/modules/placements/tpo-team-tabs-model";
import {TPO_TEAM_ROLE_LABELS} from "@/modules/placements/tpo-settings-read-model";
import {sortTpoPeople,type TpoPeopleSort} from "@/modules/placements/tpo-team-people-sort-model";
import {filterTpoTeamConversations,tpoTeamConversationCounts,tpoTeamConversationFilterSchema} from "@/modules/placements/tpo-team-conversation-filter-model";

const tabSchema=z.object({tab:z.enum(["conversations","people"]).optional(),sort:z.enum(["WORK","OVERDUE","NAME"]).optional(),q:z.string().max(120).optional(),filter:tpoTeamConversationFilterSchema.optional(),page:z.coerce.number().int().min(1).max(1000).optional()}).strict();
export default async function TpoTeamPage({searchParams}:{
 searchParams:Promise<{tab?:string|string[];sort?:string|string[];q?:string|string[];filter?:string|string[];page?:string|string[];c?:string|string[];m?:string|string[]}>}) {
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasPlacementTeamMembership(context))redirect("/dashboard");
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
  filter:Array.isArray(raw.filter)?raw.filter[0]:raw.filter,
  page:Array.isArray(raw.page)?raw.page[0]:raw.page});
 const tab=parsed.success?parseTpoTeamTab(parsed.data.tab):"conversations";
 const team=await getTpoPlacementTeam(context,context.membership.collegeId);
 const peopleSort:TpoPeopleSort=parsed.success?(parsed.data.sort??"WORK"):"WORK";
 // Deprecated faculty/student coordinator duties are not placement-team roles.
 const activeTeam=team.members.filter(member=>member.roles.includes("TPO")||
  member.roles.includes("TPO_ADMIN")||member.roles.includes("COLLEGE_ADMIN"));
 const workload=tab==="people"?await readTpoTeamAskWorkload(context).catch(()=>({ready:false as const,items:[]})):null;
 const unowned=tab==="people"?await readTpoUnownedWork(context).catch(()=>({ready:false as const,drives:0,companies:0})):null;
 const workloadByMember=new Map((workload?.items??[]).map(row=>[row.membershipId,row] as const));
 const ownerWorkload=tab==="people"?await readTpoTeamOwnershipWorkload(context).catch(()=>({ready:false as const,drivesReady:false,asksReady:false,items:[]})):null;
 const ownerByMember=new Map((ownerWorkload?.items??[]).map(row=>[row.membershipId,row] as const));
 const people=sortTpoPeople(activeTeam.map(member=>({
  ...member,openAsks:workloadByMember.get(member.membershipId)?.openAsks??0,
  overdueAsks:workloadByMember.get(member.membershipId)?.overdueAsks??0,
  liveDrives:ownerByMember.get(member.membershipId)?.liveDrives??0,
  draftDrives:ownerByMember.get(member.membershipId)?.draftDrives??0,
  companies:ownerByMember.get(member.membershipId)?.companies??0,
  overdueFollowups:ownerByMember.get(member.membershipId)?.overdueFollowups??0,
  waitingOnOthers:ownerByMember.get(member.membershipId)?.waitingOnOthers??0,
 })),peopleSort);
 const awayState=tab==="people"?await listTpoTeamAway(context).catch(()=>({ready:false as const,items:[]})):null;
 const awayByMember=new Map<string,Date>((awayState?.items??[]).map(row=>[row.membershipId,row.awayUntil] as const));
 const search=parsed.success?(parsed.data.q??""):"";
 const conversationPage=parsed.success?(parsed.data.page??1):1;
 const conversations=tab==="conversations"?await listMyTpoInternalThreads(context,search,conversationPage)
  .catch(()=>({status:"FAILED" as const,items:[]})):null;
 const filter=parsed.success?(parsed.data.filter??"FOLLOWING"):"FOLLOWING";
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
    <p role="status" className="text-sm text-body">{people.length} people</p>
    {unowned?.ready?<TpoTeamAssignUnowned drives={unowned.drives} companies={unowned.companies}
      members={activeTeam.filter(member=>member.roles.includes("TPO")||member.roles.includes("COLLEGE_ADMIN"))
       .map(member=>({membershipId:member.membershipId,displayName:member.displayName}))}/>:null}
    <p className="text-xs text-muted-foreground">The college&apos;s TPO and college-admin accounts are always in the team. Everyone in it can do everything in placements.</p>
    <nav aria-label="Sort team people" className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold">Sort:</span>
      {([["WORK","Most assigned duties"],["OVERDUE","Overdue first"],["NAME","Name"]] as const).map(([value,label])=>
       <Link key={value} href={"/tpo/team?tab=people&sort="+value}
        aria-current={peopleSort===value?"page":undefined}
        className={peopleSort===value?"rounded-md bg-primary px-3 py-2 text-on-primary":"rounded-md border border-border px-3 py-2 text-body"}>
        {label}
       </Link>)}
      {!workload?.ready?<span className="text-xs text-muted-foreground">Ask workload is not available yet.</span>:null}
    </nav>
    {people.length?<ul className="grid gap-3 sm:grid-cols-2">
      {people.map(member=><li key={member.membershipId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
       <h2 className="break-words font-semibold text-foreground">{member.displayName}
         {member.membershipId===context.membership?.id?<span className="ml-2 rounded border border-border px-2 py-0.5 text-xs">You</span>:null}
        </h2>
       {awayByMember.get(member.membershipId)?<p className="mt-2 text-xs text-warning-text">
        Away until {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})
         .format(awayByMember.get(member.membershipId)!)} IST
       </p>:null}
       {member.membershipId===context.membership?.id&&awayState?.ready?
        <TpoTeamAwayForm until={awayByMember.get(member.membershipId)?.toISOString()??null}/>:null}
       <p className="mt-2 text-sm text-body">{member.roles.filter(role=>role==="TPO"||role==="TPO_ADMIN"||role==="COLLEGE_ADMIN").map(role=>TPO_TEAM_ROLE_LABELS[role]).join(" · ")}</p>
       {workload?.ready?<p className="mt-2 text-xs text-muted-foreground">
        {member.openAsks} open {member.openAsks===1?"ask":"asks"} · {member.overdueAsks} overdue
       </p>:null}
       {ownerWorkload?.ready?<dl aria-label="Placement workload" className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        {([["Live drives",member.liveDrives],["Draft drives",member.draftDrives],
          ["Companies",member.companies],["Overdue follow-ups",member.overdueFollowups],
          ["Waiting on teammates",member.waitingOnOthers]] as const).map(([label,count])=><div key={label}>
         <dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{label.includes("drives")&&!ownerWorkload.drivesReady?"Unavailable":count}</dd>
        </div>)}
       </dl>:null}
       {member.studentDuties.length?<p className="mt-2 text-xs text-muted-foreground">
         {member.studentDuties.length} recorded drive-day duties
       </p>:null}
      </li>)}
    </ul>:<EmptyState title="No active team assignments" description="No members match this college's currently active role evidence." />}
  </section>:<section className="rounded-xl border border-border bg-surface p-5">
    <h2 className="font-semibold text-foreground">Internal conversations</h2>
    <div className="mt-3"><TpoTeamSearch value={search}/></div>
    {conversationCounts?<p className="mt-2 text-xs text-muted-foreground">Counts are for the conversations on this page.</p>:null}
    {conversationCounts?<nav aria-label="Filter team conversations" className="mt-3 flex flex-wrap gap-2">
     {(["ALL","FOLLOWING","UNREAD","TOPICS","DECISIONS",...(conversations?.status==="READY"&&conversations.asksReady?["ASKS","AT_ME"] as const:[])] as const).map(key=><Link key={key}
      href={"/tpo/team?"+new URLSearchParams({tab:"conversations",filter:key,...(search?{q:search}:{})}).toString()}
      aria-current={filter===key?"page":undefined}
      className={filter===key?"rounded-md bg-primary px-3 py-2 text-sm text-on-primary":"rounded-md border border-border px-3 py-2 text-sm text-body"}>
      {key==="ALL"?"All":key==="FOLLOWING"?"Following":key==="UNREAD"?"Unread":key==="TOPICS"?"Topics":key==="DECISIONS"?"Decisions":key==="ASKS"?"Asks":"@ Me"} ({conversationCounts[key]})
     </Link>)}
    </nav>:null}
    <Link href="/tpo/team/everyone" className="mt-3 block rounded-lg border border-border bg-surface-secondary p-4 font-semibold text-primary-text">Everyone → <span className="mt-1 block text-xs font-normal text-body">Everyone in the placement team, including people who join later. You can mute it, not leave it.</span></Link>
    {conversations?.status==="READY"?<TpoTeamThreadCreate actorUserId={context.user.id} members={team.members.filter(
      member=>member.membershipId!==context.membership?.id&&
      (member.roles.includes("TPO")||member.roles.includes("TPO_ADMIN")||member.roles.includes("COLLEGE_ADMIN")))
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
        {conversations?.status==="READY"&&conversations.asksReady&&row.openAsks>0?<p className="mt-1 text-xs text-body">{row.openAsks} open {row.openAsks===1?"ask":"asks"}{row.asksForMe>0?" · "+row.asksForMe+" assigned to you":""}</p>:null}
        <p className="mt-1 text-xs text-muted-foreground">Last activity · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(row.lastActivityAt)} IST</p>
       </li>)}</ul>:
       <div className="mt-2 space-y-2 text-sm text-body"><p role="status">{search||filter!=="ALL"?"No conversations match these filters. Clear filters to see all.":"No private team conversations yet. Everyone is always available."}</p>{search||filter!=="ALL"?<Link href="/tpo/team?tab=conversations" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>:null}</div>}
    {conversations?.status==="READY" && (conversations.page>1||conversations.hasMore)?
     <nav aria-label="Team conversation pages" className="mt-4 flex flex-wrap items-center gap-3">
      <span className="text-sm text-body">Page {conversations.page}</span>
      {conversations.page>1?<Link className="min-h-11 rounded border border-border px-4 py-3 text-primary-text"
       href={"/tpo/team?"+new URLSearchParams({tab:"conversations",filter,
        ...(search?{q:search}:{}),page:String(conversations.page-1)}).toString()}>Previous</Link>:null}
      {conversations.hasMore?<Link className="min-h-11 rounded border border-border px-4 py-3 text-primary-text"
       href={"/tpo/team?"+new URLSearchParams({tab:"conversations",filter,
        ...(search?{q:search}:{}),page:String(conversations.page+1)}).toString()}>Show older</Link>:null}
     </nav>:null}
    <Link href="/tpo/messages" className="mt-3 inline-flex min-h-11 items-center text-primary-text">
      Open existing recruiter communications
    </Link>
  </section>}
 </div>;
}

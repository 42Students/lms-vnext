import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {TpoHomeReturnRefresh} from "@/components/tpo/tpo-home-return-refresh";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users} from "@/db/schema";
import {tpoHomeGreeting} from "@/modules/placements/tpo-home-greeting-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getPlacementTpoOperations } from "@/modules/placements/tpo-operations-service";
import { listTpoBatches } from "@/modules/placements/tpo-batch-workspace-read-service";
import {buildTpoLegacyHomeRows,tpoHomeNeedsLine} from "@/modules/placements/tpo-home-legacy-rows";
import {buildTpoLegacyNextUp,operationalHomeNeeds} from "@/modules/placements/tpo-home-next-up";
import {deadlineTpoHomeNeeds} from "@/modules/placements/tpo-home-deadline-signals";
import {getTpoBatchEligibilitySummary} from "@/modules/placements/tpo-batch-eligibility-summary-service";
import {getTpoBatchRegistrationSummary} from "@/modules/placements/tpo-batch-registration-summary-service";
import {getPendingTpoRequestsCount} from "@/modules/placements/tpo-pending-requests-count-service";
import {pendingTpoRequestsAction} from "@/modules/placements/tpo-home-request-action-model";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { ErrorState } from "@/components/ui/error-state";
import { hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {getTpoHomeCrmCounts} from "@/modules/placements/tpo-home-quick-counts-service";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
import {getCollegePlacementRules} from "@/modules/placements/tpo-policy-service";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {listPlacementCalendarEvents} from "@/modules/placements/placement-calendar-service";
import {placementCalendarDayKey} from "@/modules/placements/placement-calendar-model";
import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
export const dynamic="force-dynamic";
export default async function TpoHome(){
 const ctx=await getCurrentRequestContext();
 if(!hasTpoTooling(ctx)) return <div className="min-w-0 space-y-4 md:space-y-6">
  <PageHeader title="Home" description="Your college has no TPO account on this sign-in, so placement work is run from the college placements area."/>
  <ul className="divide-y divide-border rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
   {[["Drives","/college/placements/drives"],["Calendar","/college/placements/calendar"],["Placements","/college/placements"]].map(([label,href])=><li key={href} className="p-4"><Link href={href} className="inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{label}</Link></li>)}
  </ul>
 </div>;
 const moduleAccess=await resolveOptionalModuleAccess(ctx);
 if(!moduleAccess.placements.enabled)return <div role="status" className="min-w-0 space-y-3">
  <PageHeader title="Placements is switched off for this college" />
  <p className="mt-2 text-sm text-body leading-[22px]">Placement work is not available until your college enables the Placements module.</p>
 </div>;
 const collegeId=ctx.membership!.collegeId;
 const calendarNow=new Date();
 const weekEnd=new Date(calendarNow.getTime()+7*86400000);
 // Independent reads run concurrently; Home no longer serially awaits the full
 // operations graph before requests, unread messages or the week calendar.
 const [batchResult,operationsResult,pendingRequestCount,studentStats,unreadMessages,
  crmReady,collegeRules,placementTeam,teamThreads,weekEvents,profileRows]=await Promise.all([
   listTpoBatches(ctx).catch(()=>null),getPlacementTpoOperations(ctx,collegeId).catch(()=>null),
   getPendingTpoRequestsCount(ctx).catch(()=>null),
   getTpoStudentsIntelligence(ctx,{collegeId,page:1,pageSize:1}).catch(()=>null),
   countTpoUnreadRecruiterMessages(ctx).catch(()=>null),tpoCrmTablesReady().catch(()=>false),
   getCollegePlacementRules(ctx,collegeId).catch(()=>null),
   getTpoPlacementTeam(ctx,collegeId).catch(()=>null),
   listMyTpoInternalThreads(ctx).catch(()=>null),
   listPlacementCalendarEvents(ctx,{collegeId,from:placementCalendarDayKey(calendarNow),
    to:placementCalendarDayKey(weekEnd),includeDraftDeadlines:true}).catch(()=>null),
   getDb().select({displayName:users.displayName}).from(users)
    .where(eq(users.id,ctx.user.id)).limit(1).catch(()=>[]),
 ]);
 // Core batches/operations determine the meaning of the Home dashboard.
 // A failed essential read is NOT evidence of zero drives, zero requests or
 // an empty work queue. Keep optional signals independent only after both load.
 if(!batchResult?.ready||!operationsResult){
  return <div data-testid="tpo.home" className="min-w-0 space-y-4 md:space-y-6">
   <PageHeader title="Home"/>
   <ErrorState title="Could not load Home"
    description="Placement batches or operations could not be loaded. Counts and actions have been withheld rather than shown as zero."
    action={<Link href="/tpo/home?retry=1"
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link md:min-h-9">Retry</Link>}/>
  </div>;
 }
 const batches=batchResult;
 const operations=operationsResult;
 const greeting=tpoHomeGreeting(calendarNow,profileRows[0]?.displayName);
 const pendingRequests=pendingRequestCount!==null?pendingTpoRequestsAction(pendingRequestCount):null;
 const optionalDataUnavailable=[batchResult,operationsResult,pendingRequestCount,studentStats,unreadMessages,collegeRules,placementTeam,teamThreads,weekEvents].some(value=>value===null)||!crmReady;
 const crmCounts=crmReady?await getTpoHomeCrmCounts(ctx,collegeId).catch(()=>null):null;
 const weekNext=(weekEvents?.events??[]).filter(event=>event.startsAt>=calendarNow&&
  (event.kind==="ROUND"||event.kind==="APPLICATION_DEADLINE"))
   .sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime())
   .map(event=>({startsAt:event.startsAt,title:event.companyName+" · "+event.title}));
 const firstBatch=batches.batches[0];
 const inviteCandidates=batches.ready?batches.batches.filter(batch=>!batch.invitedAt&&!batch.finishedAt):[];
 // Check each uninvited batch until an actionable cohort is found; a fully
 // registered earlier cohort must not hide a later cohort needing an invite.
 let inviteCandidate:typeof firstBatch|undefined;
 let candidateEligible:number|null=null;
 let candidateRegistered:number|null=null;
 for(let offset=0;offset<inviteCandidates.length;offset+=4){
  const candidates=inviteCandidates.slice(offset,offset+4);
  const checked=await Promise.all(candidates.map(async candidate=>{
   const [eligibility,registration]=await Promise.all([
    getTpoBatchEligibilitySummary(ctx,candidate.id).catch(()=>null),
    getTpoBatchRegistrationSummary(ctx,candidate.id).catch(()=>null),
   ]);
   return {candidate,eligible:eligibility?.summary.complete?eligibility.summary.eligible:null,
     registered:registration?.available?registration.registered:null};
  }));
  const found=checked.find(item=>item.eligible!==null&&item.registered!==null&&item.eligible>item.registered);
  if(found){inviteCandidate=found.candidate;candidateEligible=found.eligible;candidateRegistered=found.registered;break;}
 }
 const inviteReady=!!inviteCandidate;
 // TPO-home-04: the visible batch must show its own persisted eligible and
 // registered totals, even when an invitation has already been sent.
 const [shownEligibility,shownRegistrations]=firstBatch?await Promise.all([
  getTpoBatchEligibilitySummary(ctx,firstBatch.id).catch(()=>null),
  getTpoBatchRegistrationSummary(ctx,firstBatch.id).catch(()=>null),
 ]):[null,null];
 const shownEligible=shownEligibility?.summary.complete?shownEligibility.summary.eligible:null;
 const shownRegistered=shownRegistrations?.available?shownRegistrations.registered:null;
 // TPO-home-04: use the actual persisted placed-learner summary scoped to
 // the visible batch. Never substitute the all-college placed count.
 const shownPlaced=firstBatch
  ?(await getTpoStudentsIntelligence(ctx,{collegeId,batchId:firstBatch.id,
      page:1,pageSize:1}).catch(()=>null))?.summary.placed??null
  :null;
 const teamAsks=teamThreads?.status==="READY"&&teamThreads.asksReady&&!teamThreads.hasMore
  ?teamThreads.items.reduce((sum,item)=>sum+Number(item.asksForMe),0):null;
 const teamUnread=teamThreads?.status==="READY"
  ?teamThreads.items.reduce((sum,item)=>sum+Number(item.unreadCount),0):null;
 const rows=buildTpoLegacyHomeRows({
  batch:firstBatch?{name:firstBatch.name,invited:!!firstBatch.invitedAt,
   eligible:shownEligible,
   registered:shownRegistered,placed:shownPlaced}:null,
  hasUninvitedBatch:batches.batches.some(batch=>!batch.invitedAt),
  moreBatches:Math.max(0,batches.batches.length-1),
  liveDrives:operations.summary.publishedJobs,driveAttention:operations.summary.jobsNeedingAttention,
  driveNeeds:operations.workQueue.map(item=>({code:item.code,count:item.count,title:item.jobTitle})),
  driveDetail:(()=>{
   const attention=operations.workQueue.find(item=>item.count>0);
   if(!attention)return null;
   const label:Record<string,string>={
    RESULTS_AWAITING_APPLY:"results waiting",SCREENING_PENDING:"applications to review",
    OFFERS_AWAITING_RESPONSE:"offers waiting",JOINING_OUTCOME_PENDING:"joining outcomes waiting",
    DRIVE_NOT_SCHEDULED:"rounds to schedule",EVALUATION_PLAN_MISSING:"evaluation plan needed",
    DRIVE_REQUESTS:"requests",SELECTIONS_TO_VERIFY:"selections to verify",
   };
   return label[attention.code]?(attention.count+" "+label[attention.code]):attention.jobTitle;
  })(),
  driveHref:operations.workQueue.some(item=>item.code==="DRIVE_REQUESTS"&&item.count>0)
   ?"/tpo/placements?tab=requests":"/tpo/placements",
  registered:studentStats?.definitions.registrationsAvailable?studentStats.summary.placementPool:null,
  placedUnique:studentStats?.summary.placed??null,recruiterLeads:crmCounts?.leads??null,
  followUps:crmCounts?.dueFollowups??null,recruiterAccess:crmCounts?.pendingRecruiterAccess??null,
  pendingRequests:pendingRequestCount,
  messages:unreadMessages,teamAsks,teamMentions:null,
  teamUnread,
  upcoming:weekNext,calendarAvailable:weekEvents!==null,
 });
 const next=buildTpoLegacyNextUp({
  needsYou:[
   ...(inviteReady?[{type:"REGISTRATION_CLOSED",priority:0,
      title:"Invite the batch to register",count:candidateEligible!,
      link:"/tpo/batches/"+inviteCandidate!.id}]:[]),
   ...deadlineTpoHomeNeeds(operations.jobs.map(item=>item.job)),
   ...operationalHomeNeeds(operations.workQueue),
   ...((unreadMessages??0)>0?[{type:"RECRUITER_MESSAGES",priority:4,title:unreadMessages+" recruiter messages to answer",count:unreadMessages!,link:"/tpo/messages"}]:[]),
   ...(teamAsks!==null&&teamAsks>0?[{
    type:"TEAM_ASKS",priority:1,title:teamAsks+" team asks for you",
    count:teamAsks,link:"/tpo/team?filter=me",
   }]:[]),
   ...(teamUnread!==null&&teamUnread>0&&!(teamAsks!==null&&teamAsks>0)?[{
    type:"TEAM_MESSAGES",priority:4,title:"Your team has new messages",
    count:teamUnread,link:"/tpo/team",
   }]:[]),
   ...(pendingRequests?[{type:"REQUESTS",priority:1,title:pendingRequests.label,
      count:pendingRequestCount!,link:"/tpo/requests"}]:[]),
  ],
  batches:inviteReady?[{batchId:inviteCandidate!.id,name:inviteCandidate!.name,
   eligible:candidateEligible!,registered:candidateRegistered!,invitedAt:null}]:[],
  checklist:[
   {label:"Decide who is in placements",done:batches.ready&&batches.batches.length>0,link:"/tpo/batches"},
   {label:"Import academic details",done:(studentStats?.summary.activeLearners??0)>0,link:"/tpo/students"},
   {label:"Choose the placement rules",done:collegeRules?.updatedAt!=null,link:"/tpo/settings/rules"},
   {label:"Invite a batch to register",done:batches.batches.some(batch=>Boolean(batch.invitedAt)),link:"/tpo/batches"},
   {label:"Add your first recruiter",done:(crmCounts?.leads??0)>0,link:"/tpo/recruiters"},
   {label:"Pick your team",done:(placementTeam?.summary.total??0)>1,link:"/tpo/settings/team"},
  ],
 });
 return <div data-testid="tpo.home" className="min-w-0 space-y-4 md:space-y-6">
 <TpoHomeReturnRefresh/>
 <p className="text-sm font-semibold text-muted-foreground leading-[22px]">{greeting.date}</p>
 <PageHeader title={greeting.title}/>
 {optionalDataUnavailable ? <InlineNotice tone="info" message="Some Home indicators could not be loaded. Other placement information is still available; refresh to retry."/> : null}
 <div role="group" aria-label="Placement overview"
  className="grid min-w-0 grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface lg:grid-cols-4">
  {[
    {label:rows[1]?.title ?? "Drives",value:operationsResult?operations.summary.publishedJobs:"—",detail:rows[1]?.status,href:rows[1]?.href},
    {label:rows[2]?.title ?? "Students",value:studentStats?.summary.placementPool??"—",detail:rows[2]?.status,href:rows[2]?.href},
    {label:rows[4]?.title ?? "Inbox",value:pendingRequestCount!==null&&unreadMessages!==null?pendingRequestCount+unreadMessages:"—",detail:rows[4]?.status,href:rows[4]?.href},
    {label:rows[5]?.title ?? "Team",value:teamThreads?.status==="READY"?
      teamThreads.items.reduce((total,item)=>total+item.unreadCount,0):"—",detail:rows[5]?.status,href:rows[5]?.href},
  ].map((tile,index)=><Link key={tile.label} href={tile.href??"/tpo/home"}
    className={"lms-inline-link flex min-w-0 flex-col gap-1 p-3 text-body hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary-text)] sm:p-4 " +
      (index<2?"border-b border-border lg:border-b-0 ":"")+
      (index%2===0?"border-r border-border ":"")+
      (index<3?"lg:border-r ":"lg:border-r-0 ")}>
    <span className="text-xs font-semibold leading-5 text-muted-foreground">{tile.label}</span>
    <strong className="break-words text-2xl font-semibold leading-8 tabular-nums text-[var(--lms-heading)]">{tile.value}</strong>
    {tile.detail?<span className="min-w-0 break-words text-xs leading-5 text-muted-foreground">{tile.detail}</span>:null}
  </Link>)}
 </div>
 <p aria-live="polite" className="text-sm font-semibold text-body leading-[22px]">{tpoHomeNeedsLine(rows)}</p>
 <div className="grid min-w-0 gap-4 min-[992px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[992px]:items-start md:gap-6">
 <section aria-label="Next up" data-testid="home.next-up" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 min-[768px]:p-6">
  <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Next up</h2>
  {next?<div className="mt-2 space-y-2">
   <p className="break-words font-semibold">{next.title}</p>
   <p className="text-sm text-muted-foreground">{next.text}</p>
   <Link href={next.href} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-[14px] font-[650] text-[var(--lms-on-primary)] transition-colors duration-[150ms] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto motion-reduce:transition-none">{next.action}</Link>
  </div>:rows.find(row=>row.needsAttention)?<div className="mt-2 space-y-2"><p className="text-sm">{rows.find(row=>row.needsAttention)?.status}</p>
   <Link href={rows.find(row=>row.needsAttention)!.href} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-[14px] font-[650] text-[var(--lms-on-primary)] transition-colors duration-[150ms] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto motion-reduce:transition-none">Open</Link>
  </div>:<div className="mt-2 space-y-1"><p className="font-semibold">Nothing is waiting on you.</p><p className="text-sm text-muted-foreground">New requests, results and replies show up here first.</p></div>}
 </section>
 <section className="min-w-0 space-y-2" aria-label="Your placement work">
  <ul className="divide-y divide-border rounded-[var(--lms-canvas-radius)] border border-border bg-surface">{rows.map(row=><li key={row.key}>
    <Link href={row.href} data-testid={"home.row."+row.key}
     className="flex min-h-16 min-w-0 items-center gap-3 px-4 py-3 text-body hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
     <span className="min-w-0 flex-1"><strong className="block break-words text-sm text-foreground">{row.title}</strong>
      <span className="mt-1 block break-words text-xs text-muted-foreground">{row.status}</span></span>
     {row.needsAttention?<Badge aria-label="Needs you"  tone="warning" className="shrink-0">Needs you</Badge>:null}
     <span aria-hidden="true" className="shrink-0 text-link">›</span>
    </Link>
   </li>)}</ul>
 </section>
 </div>
 </div>;
}

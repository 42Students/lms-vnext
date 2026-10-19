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
import { StatTile } from "@/components/ui/stat-tile";
import { InlineNotice } from "@/components/ui/inline-notice";
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
 if(!hasTpoTooling(ctx)) return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Placement cell" title="Home" description="Your college has no TPO account on this sign-in, so placement work is run from the college placements area."/>
  <ul className="divide-y divide-border rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
   {[["Drives","/college/placements/drives"],["Calendar","/college/placements/calendar"],["Placements","/college/placements"]].map(([label,href])=><li key={href} className="p-4"><Link href={href} className="min-h-9 inline-flex items-center text-sm text-link underline">{label}</Link></li>)}
  </ul>
 </div>;
 const moduleAccess=await resolveOptionalModuleAccess(ctx);
 if(!moduleAccess.placements.enabled)return <div role="status" className="min-w-0 space-y-3">
  <PageHeader title="Placements is switched off for this college" />
  <p className="mt-2 text-sm text-body">Placement work is not available until your college enables the Placements module.</p>
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
 // TPO-home-R08: a single heavyweight analytics or batch rejection cannot
 // replace every lightweight, independently loaded Home signal with error.tsx.
 const batches=batchResult??{ready:false,batches:[]};
 const operations=operationsResult??{
  summary:{publishedJobs:0,jobsNeedingAttention:0},workQueue:[],jobs:[],
 };
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
  pendingRequests:pendingRequestCount??0,
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
 return <div data-testid="tpo.home" className="min-w-0 space-y-5">
 <TpoHomeReturnRefresh/>
 <p className="text-sm font-semibold text-muted-foreground">{greeting.date}</p>
 <PageHeader eyebrow="TPO" title={greeting.title}/>
 {optionalDataUnavailable ? <InlineNotice tone="info" message="Some Home indicators could not be loaded. Other placement information is still available; refresh to retry."/> : null}
 <div aria-label="Placement overview" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <StatTile label={rows[1]?.title ?? "Drives"} value={operationsResult?operations.summary.publishedJobs:"—"}
    detail={rows[1]?.status} href={rows[1]?.href}/>
  <StatTile label={rows[2]?.title ?? "Students"} value={studentStats?.summary.placementPool??"—"}
    detail={rows[2]?.status} href={rows[2]?.href}/>
  <StatTile label={rows[4]?.title ?? "Inbox"} value={pendingRequestCount!==null&&unreadMessages!==null?pendingRequestCount+unreadMessages:"—"}
    detail={rows[4]?.status} href={rows[4]?.href}/>
  <StatTile label={rows[5]?.title ?? "Team"} value={teamThreads?.status === "READY"
      ? teamThreads.items.reduce((total, item) => total + item.unreadCount, 0) : "—"}
    detail={rows[5]?.status} href={rows[5]?.href}/>
 </div>
 <p aria-live="polite" className="text-sm font-semibold text-body">{tpoHomeNeedsLine(rows)}</p>
 <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
 <section aria-label="Next up" data-testid="home.next-up" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
  <h2 className="text-sm font-medium text-muted-foreground">Next up</h2>
  {next?<div className="mt-2 space-y-2">
   <p className="break-words font-semibold">{next.title}</p>
   <p className="text-sm text-muted-foreground">{next.text}</p>
   <Link href={next.href} className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)]">{next.action}</Link>
  </div>:rows.find(row=>row.needsAttention)?<div className="mt-2 space-y-2"><p className="text-sm">{rows.find(row=>row.needsAttention)?.status}</p>
   <Link href={rows.find(row=>row.needsAttention)!.href} className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)]">Open</Link>
  </div>:<div className="mt-2 space-y-1"><p className="font-semibold">Nothing is waiting on you.</p><p className="text-sm text-muted-foreground">New requests, results and replies show up here first.</p></div>}
 </section>
 <section className="min-w-0 space-y-2" aria-label="Your placement work">
  <ul className="divide-y divide-border rounded-[var(--lms-canvas-radius)] border border-border bg-surface">{rows.map(row=><li key={row.key}>
    <Link href={row.href} data-testid={"home.row."+row.key}
     className="flex min-h-16 min-w-0 items-center gap-3 p-4 text-body hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
     <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary-subtle text-sm font-semibold">{row.title.slice(0,1)}</span>
     <span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">{row.title}</strong>
      <span className="block break-words text-xs text-muted-foreground">{row.status}</span></span>
     {row.needsAttention?<Badge aria-label="Needs you"  tone="warning" className="shrink-0">Needs you</Badge>:null}
     <span aria-hidden="true" className="shrink-0 text-link">›</span>
    </Link>
   </li>)}</ul>
 </section>
 </div>
 </div>;
}

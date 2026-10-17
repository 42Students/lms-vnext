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
 if(!hasTpoTooling(ctx)) return <main className="min-w-0 space-y-5">
  <PageHeader eyebrow="Placement cell" title="Home" description="Your college has no TPO account on this sign-in, so placement work is run from the college placements area."/>
  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
   {[["Drives","/college/placements/drives"],["Calendar","/college/placements/calendar"],["Placements","/college/placements"]].map(([label,href])=><li key={href} className="p-4"><Link href={href} className="min-h-10 inline-flex items-center text-sm text-primary-text underline">{label}</Link></li>)}
  </ul>
 </main>;
 const moduleAccess=await resolveOptionalModuleAccess(ctx);
 if(!moduleAccess.placements.enabled)return <main role="status" className="min-w-0 rounded-xl border border-border bg-surface p-6">
  <h1 className="text-lg font-semibold">Placements is switched off for this college</h1>
  <p className="mt-2 text-sm text-body">Placement work is not available until your college enables the Placements module.</p>
 </main>;
 const collegeId=ctx.membership!.collegeId;
 const calendarNow=new Date();
 const weekEnd=new Date(calendarNow.getTime()+7*86400000);
 // Independent reads run concurrently; Home no longer serially awaits the full
 // operations graph before requests, unread messages or the week calendar.
 const [batches,operations,pendingRequestCount,studentStats,unreadMessages,
  crmReady,collegeRules,placementTeam,teamThreads,weekEvents,profileRows]=await Promise.all([
   listTpoBatches(ctx),getPlacementTpoOperations(ctx,collegeId),
   getPendingTpoRequestsCount(ctx),
   getTpoStudentsIntelligence(ctx,{collegeId,page:1,pageSize:1}),
   countTpoUnreadRecruiterMessages(ctx),tpoCrmTablesReady(),
   getCollegePlacementRules(ctx,collegeId),
   getTpoPlacementTeam(ctx,collegeId),
   listMyTpoInternalThreads(ctx),
   listPlacementCalendarEvents(ctx,{collegeId,from:placementCalendarDayKey(calendarNow),
    to:placementCalendarDayKey(weekEnd),includeDraftDeadlines:true}).catch(()=>null),
   getDb().select({displayName:users.displayName}).from(users)
    .where(eq(users.id,ctx.user.id)).limit(1),
 ]);
 const greeting=tpoHomeGreeting(calendarNow,profileRows[0]?.displayName);
 const pendingRequests=pendingTpoRequestsAction(pendingRequestCount);
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
 for(const candidate of inviteCandidates){
  const [eligibility,registration]=await Promise.all([
   getTpoBatchEligibilitySummary(ctx,candidate.id),
   getTpoBatchRegistrationSummary(ctx,candidate.id),
  ]);
  const eligible=eligibility.summary.complete?eligibility.summary.eligible:null;
  const registered=registration.available?registration.registered:null;
  if(eligible!==null&&registered!==null&&eligible>registered){
   inviteCandidate=candidate;candidateEligible=eligible;candidateRegistered=registered;
   break;
  }
 }
 const inviteReady=!!inviteCandidate;
 const rows=buildTpoLegacyHomeRows({
  batch:firstBatch?{name:firstBatch.name,invited:!!firstBatch.invitedAt,
   eligible:firstBatch.id===inviteCandidate?.id?candidateEligible:null,
   registered:firstBatch.id===inviteCandidate?.id?candidateRegistered:null,placed:null}:null,
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
  registered:studentStats.definitions.registrationsAvailable?studentStats.summary.placementPool:null,
  placedUnique:studentStats.summary.placed,recruiterLeads:crmCounts?.leads??null,
  followUps:crmCounts?.dueFollowups??null,recruiterAccess:null,
  pendingRequests:pendingRequestCount,
  messages:unreadMessages,teamAsks:null,teamMentions:null,
  teamUnread:teamThreads.status==="READY"?teamThreads.items.reduce((sum,item)=>sum+item.unreadCount,0):null,
  upcoming:weekNext,calendarAvailable:weekEvents!==null,
 });
 const next=buildTpoLegacyNextUp({
  needsYou:[
   ...(inviteReady?[{type:"REGISTRATION_CLOSED",priority:0,
      title:"Invite the batch to register",count:candidateEligible!,
      link:"/tpo/batches/"+inviteCandidate!.id}]:[]),
   ...deadlineTpoHomeNeeds(operations.jobs.map(item=>item.job)),
   ...operationalHomeNeeds(operations.workQueue),
   ...(unreadMessages>0?[{type:"RECRUITER_MESSAGES",priority:4,title:unreadMessages+" recruiter messages to answer",count:unreadMessages,link:"/tpo/messages"}]:[]),
   ...(teamThreads.status==="READY"&&teamThreads.items.some(item=>item.unreadCount>0)?[
    {type:"TEAM_ASKS",priority:4,title:"Your team has new messages",count:teamThreads.items.reduce((sum,item)=>sum+item.unreadCount,0),link:"/tpo/team"}]:[]),
   ...(pendingRequests?[{type:"REQUESTS",priority:1,title:pendingRequests.label,
      count:pendingRequestCount,link:"/tpo/requests"}]:[]),
  ],
  batches:inviteReady?[{batchId:inviteCandidate!.id,name:inviteCandidate!.name,
   eligible:candidateEligible!,registered:candidateRegistered!,invitedAt:null}]:[],
  checklist:[
   {label:"Decide who is in placements",done:batches.ready&&batches.batches.length>0,link:"/tpo/batches"},
   {label:"Import academic details",done:studentStats.summary.activeLearners>0,link:"/tpo/students"},
   {label:"Choose the placement rules",done:collegeRules.updatedAt!==null,link:"/tpo/settings/rules"},
   {label:"Invite a batch to register",done:batches.batches.some(batch=>Boolean(batch.invitedAt)),link:"/tpo/batches"},
   {label:"Add your first recruiter",done:(crmCounts?.leads??0)>0,link:"/tpo/recruiters"},
   {label:"Pick your team",done:placementTeam.summary.total>1,link:"/tpo/settings/team"},
  ],
 });
 return <main data-testid="tpo.home" className="min-w-0 space-y-5">
 <TpoHomeReturnRefresh/>
 <p className="text-sm font-semibold text-muted-foreground">{greeting.date}</p>
 <PageHeader eyebrow="TPO" title={greeting.title}/>
 <p aria-live="polite" className="text-sm font-semibold text-body">{tpoHomeNeedsLine(rows)}</p>
 <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
 <section aria-label="Next up" data-testid="home.next-up" className="min-w-0 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-sm font-medium text-muted-foreground">Next up</h2>
  {next?<div className="mt-2 space-y-2">
   <p className="break-words font-semibold">{next.title}</p>
   <p className="text-sm text-muted-foreground">{next.text}</p>
   <Link href={next.href} className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm text-on-primary">{next.action}</Link>
  </div>:rows.find(row=>row.needsAttention)?<div className="mt-2 space-y-2"><p className="text-sm">{rows.find(row=>row.needsAttention)?.status}</p>
   <Link href={rows.find(row=>row.needsAttention)!.href} className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm text-on-primary">Open</Link>
  </div>:<div className="mt-2 space-y-1"><p className="font-semibold">Nothing is waiting on you.</p><p className="text-sm text-muted-foreground">New requests, results and replies show up here first.</p></div>}
 </section>
 <section className="min-w-0 space-y-2" aria-label="Your placement work">
  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">{rows.map(row=><li key={row.key}>
    <Link href={row.href} data-testid={"home.row."+row.key}
     className="flex min-h-16 min-w-0 items-center gap-3 p-4 text-body hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
     <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-sm font-semibold">{row.title.slice(0,1)}</span>
     <span className="min-w-0 flex-1"><strong className="block text-sm text-foreground">{row.title}</strong>
      <span className="block break-words text-xs text-muted-foreground">{row.status}</span></span>
     {row.needsAttention?<span aria-label="Needs you" className="shrink-0 rounded-full bg-warning-subtle px-2 py-1 text-xs font-semibold text-warning-text">Needs you</span>:null}
     <span aria-hidden="true" className="shrink-0 text-primary-text">›</span>
    </Link>
   </li>)}</ul>
 </section>
 </div>
 </main>;
}

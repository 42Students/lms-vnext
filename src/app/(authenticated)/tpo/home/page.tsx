import Link from "next/link";
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
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {countTpoUnreadRecruiterMessages} from "@/modules/placements/tpo-recruiter-unread-count-service";
import {listTpoLeads,listDueTpoFollowups} from "@/modules/placements/tpo-crm-service";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
export const dynamic="force-dynamic";
export default async function TpoHome(){
 const ctx=await getCurrentRequestContext();
 if(!hasTpoTooling(ctx)) return <main className="min-w-0 space-y-5">
  <PageHeader eyebrow="Placement cell" title="Home" description="Your college has no TPO account on this sign-in, so placement work is run from the college placements area."/>
  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
   {[["Drives","/college/placements/drives"],["Calendar","/college/placements/calendar"],["Placements","/college/placements"]].map(([label,href])=><li key={href} className="p-4"><Link href={href} className="min-h-10 inline-flex items-center text-sm text-primary-text underline">{label}</Link></li>)}
  </ul>
 </main>;
 const batches=await listTpoBatches(ctx);
 const operations=await getPlacementTpoOperations(ctx,ctx.membership!.collegeId);
 const pendingRequestCount=await getPendingTpoRequestsCount(ctx);
 const pendingRequests=pendingTpoRequestsAction(pendingRequestCount);
 const [studentStats,unreadMessages,crmReady]=await Promise.all([
  getTpoStudentsIntelligence(ctx,{collegeId:ctx.membership!.collegeId,page:1,pageSize:1}),
  countTpoUnreadRecruiterMessages(ctx),
  tpoCrmTablesReady(),
 ]);
 const [recruiters,dueFollowups]=crmReady?await Promise.all([
  listTpoLeads(ctx,ctx.membership!.collegeId),
  listDueTpoFollowups(ctx,ctx.membership!.collegeId),
 ]):[null,null];
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
  driveDetail:operations.workQueue.find(item=>item.count>0)?.jobTitle??null,
  driveHref:"/tpo/placements",
  registered:studentStats.definitions.registrationsAvailable?studentStats.summary.placementPool:null,
  placedUnique:studentStats.summary.placed,recruiterLeads:recruiters?.length??null,
  followUps:dueFollowups?.length??null,recruiterAccess:null,
  pendingRequests:pendingRequestCount,
  messages:unreadMessages,teamAsks:null,teamMentions:null,teamUnread:null,
  upcoming:operations.upcomingRounds.map(round=>({startsAt:round.scheduledAt,title:round.name})),
 });
 const next=buildTpoLegacyNextUp({
  needsYou:[
   ...(inviteReady?[{type:"REGISTRATION_CLOSED",priority:0,
      title:"Invite the batch to register",count:candidateEligible!,
      link:"/tpo/batches/"+inviteCandidate!.id}]:[]),
   ...deadlineTpoHomeNeeds(operations.jobs.map(item=>item.job)),
   ...operationalHomeNeeds(operations.workQueue),
   ...(unreadMessages>0?[{type:"RECRUITER_MESSAGES",priority:4,title:unreadMessages+" recruiter messages to answer",count:unreadMessages,link:"/tpo/messages"}]:[]),
   ...(pendingRequests?[{type:"REQUESTS",priority:5,title:pendingRequests.label,
      count:pendingRequestCount,link:"/tpo/requests"}]:[]),
  ],
  batches:inviteReady?[{batchId:inviteCandidate!.id,name:inviteCandidate!.name,
   eligible:candidateEligible!,registered:candidateRegistered!,invitedAt:null}]:[],
  checklist:[],
 });
 return <main className="min-w-0 space-y-5">
 <PageHeader eyebrow="TPO" title="Home" description="One next action and a quiet overview of the placement cell."/>
 <p aria-live="polite" className="text-sm font-semibold text-body">{tpoHomeNeedsLine(rows)}</p>
 <section className="min-w-0 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-sm font-medium text-muted-foreground">Next up</h2>
  {next?<div className="mt-2 space-y-2">
   <p className="break-words font-semibold">{next.title}</p>
   <p className="text-sm text-muted-foreground">{next.text}</p>
   <Link href={next.href} className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm text-on-primary">{next.action}</Link>
  </div>:rows.find(row=>row.needsAttention)?<div className="mt-2 space-y-2"><p className="text-sm">{rows.find(row=>row.needsAttention)?.status}</p>
   <Link href={rows.find(row=>row.needsAttention)!.href} className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm text-on-primary">Open</Link>
  </div>:<div className="mt-2 space-y-1"><p className="font-semibold">Nothing is waiting on you.</p><p className="text-sm text-muted-foreground">New requests, results and replies show up here first.</p></div>}
 </section>
 {pendingRequests?<section aria-label="Pending placement requests" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"><p className="text-sm font-semibold">{pendingRequests.label}</p><Link href={pendingRequests.href} className="inline-flex min-h-11 items-center text-primary-text underline">Open decision inbox</Link></section>:null}
 {!batches.ready?<p className="text-xs text-muted-foreground">Batch attention is unavailable until its lifecycle migration is registered.</p>:null}
 <section className="space-y-2"><h2 className="font-semibold">Your placement work</h2>
  <ul className="divide-y divide-border rounded-xl border border-border bg-surface">{rows.map(row=><li key={row.key} className="flex min-w-0 flex-wrap items-center justify-between gap-3 p-4">
    <div className="min-w-0 flex items-center gap-3"><span aria-hidden="true" className={row.needsAttention?"h-2.5 w-2.5 shrink-0 rounded-full bg-warning":"h-2.5 w-2.5 shrink-0 rounded-full bg-muted"}/>
    <span className="break-words text-sm font-medium">{row.title}<span className="block text-xs font-normal text-muted-foreground">{row.status}</span></span></div>
    <Link href={row.href} className="min-h-10 inline-flex items-center text-sm text-primary-text underline">Open</Link>
   </li>)}</ul>
 </section>
 </main>;
}

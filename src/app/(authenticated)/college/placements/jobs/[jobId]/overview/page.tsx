import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getPlacementJob } from "@/modules/placements/job-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCollegeDriveOverview } from "@/modules/placements/college-drive-overview-service";
import {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import {CollegeDrivePipelineOverview} from "@/components/placements/college-drive-pipeline-overview";
import {CollegeDriveDuplicateAction} from "@/components/placements/college-drive-duplicate-action";

export default async function CollegeDriveOverviewPage({ params }: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive overview"/>
    <ErrorState title="Admin not assigned to a college"
      description="Contact your administrator for a College Admin assignment before opening a placement drive."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>}/>
  </div>;
  const {jobId}=await params;
  const [jobResult,overviewResult,funnelResult,attentionResult]=await Promise.allSettled([
    getPlacementJob(context,jobId),
    getCollegeDriveOverview(context,jobId),
    getCollegeHiringFunnel(context,{jobId}),
    getCollegeDriveAttention(context,jobId),
  ]);
  for(const item of [jobResult,overviewResult,funnelResult,attentionResult]){
    if(item.status==="rejected"&&item.reason instanceof AuthorizationError)throw item.reason;
  }
  if(jobResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader title="Drive overview"/>
    <ErrorState title="Could not load this drive."
      description="Drive information could not be verified. No actions were applied."
      action={<div className="flex flex-wrap gap-3"><Link href={"/college/placements/jobs/"+encodeURIComponent(jobId)+"/overview"} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link><Link href="/college/placements/drives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to Drives</Link></div>}/>
  </div>;
  const job=jobResult.value;
  const overview=overviewResult.status==="fulfilled"?overviewResult.value:null;
  const funnel=funnelResult.status==="fulfilled"?funnelResult.value:null;
  const attention=attentionResult.status==="fulfilled"?attentionResult.value:null;
  const counts=overview?.counts??{
    applications:null,shortlisted:null,selected:null,offered:null,
  };
  const drive=overview?.drive??{
    id:job.id,title:job.title,companyName:"Company unavailable",
    seasonName:"Season unavailable",status:job.status,
    employmentType:job.employmentType,workMode:job.workMode,
    openings:job.openings,applicationDeadline:job.applicationDeadline,
    description:job.description,
    jobTypeLabel:null,companyLogoUrl:null,
  };
  const expired=drive.status==="PUBLISHED"&&drive.applicationDeadline!==null&&
    new Date(drive.applicationDeadline).getTime()<Date.now();
  const statusLabel=drive.status==="DRAFT"?"Draft":
    drive.status==="PUBLISHED"?(expired?"Expired":"Open"):
    drive.status==="CLOSED"?"Closed":
    drive.status==="CANCELLED"?"Cancelled":drive.status;
  const initials=drive.companyName.trim().split(/\s+/).slice(0,2)
   .map(part=>part.charAt(0).toUpperCase()).join("")||"CO";
  const typeLabel=(drive.jobTypeLabel?.trim()||drive.employmentType)
   .replaceAll("_"," ").toLowerCase().replace(/(^|\s)\S/g,text=>text.toUpperCase());
  const pipelineStages=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","HIRED"] as const;
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <nav aria-label="Drive breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Drives</Link>
      <span aria-hidden="true">/</span><span aria-current="page">Overview</span>
    </nav>
    <PageHeader title="Drive overview" description={drive.companyName+" · "+drive.seasonName}/>
    <section aria-label="Drive company and role" className={"min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] border-l-[3px] bg-surface p-[var(--lms-space-4)] "+(drive.status==="PUBLISHED"?"border-l-[#52c41a]":drive.status==="DRAFT"?"border-l-[#faad14]":"border-l-[#8c8c8c]")}>
      <div className="flex min-w-0 flex-wrap items-start gap-[var(--lms-space-4)]">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface-subtle text-lg font-semibold text-[var(--lms-heading)]" aria-label={drive.companyName+" company logo"}>
          {drive.companyLogoUrl?<img alt="" src={drive.companyLogoUrl} width={56} height={56} className="size-14 object-contain" />:
          <span aria-hidden="true">{initials}</span>}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="break-words text-xl font-semibold text-[var(--lms-heading)]">{drive.title}</h2>
          <p className="text-sm text-body">{drive.companyName}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge tone={expired?"warning":drive.status==="PUBLISHED"?"success":drive.status==="DRAFT"?"warning":drive.status==="CANCELLED"?"error":"neutral"}>{statusLabel}</StatusBadge>
            <StatusBadge tone="info">{typeLabel}</StatusBadge>
            <span className="text-xs text-muted-foreground">{drive.openings??"Not recorded"} openings · {drive.workMode.toLowerCase().replaceAll("_"," ")}</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/settings`}
           className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-[var(--lms-heading)] hover:bg-surface-subtle focus-visible:outline-2 md:min-h-9">
           <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 3 5 5-10 10-5 1 1-5L16 3Z"/></svg>
           Edit drive
          </Link>
          <Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/applications`}
           className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-3 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 md:min-h-9">
           <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18M3 12h18M3 19h18"/><path d="m16 8 4 4-4 4"/></svg>
           View applications
          </Link>
        </div>
      </div>
      {drive.description?.trim()?<details className="group mt-3 max-w-[90ch] text-sm leading-[22px] text-body">
       <summary className="list-none cursor-pointer focus-visible:outline-2">
        <span className="block whitespace-pre-wrap break-words [overflow-wrap:anywhere] line-clamp-3 group-open:hidden">{drive.description}</span>
        <span className="mt-2 inline-flex min-h-9 items-center font-semibold text-link underline">Show more</span>
       </summary>
       <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{drive.description}</p>
      </details>:null}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs">
        <CollegeDriveDuplicateAction jobId={jobId}/>
        <Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/settings`} className="inline-flex min-h-9 items-center font-semibold text-link underline">More drive actions</Link>
      </div>
    </section>
    <section aria-label="Drive pipeline" className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)]">
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Pipeline</h2>
      {!overview||!funnel?<Alert tone="warning">Pipeline totals are unavailable. The drive record is intact.
        <Link href={`/college/placements/jobs/${encodeURIComponent(jobId)}/overview`} className="ml-2 font-semibold text-link underline">Retry</Link>
      </Alert>:null}
      <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] sm:grid-cols-3 xl:grid-cols-6">
        {pipelineStages.map((stage,index)=>{
         const value=stage==="APPLIED"?counts.applications:
          stage==="SHORTLISTED"?funnel?.cumulativeTotals.SHORTLISTED??null:
          stage==="ASSESSMENT"?funnel?.cumulativeTotals.ASSESSMENT??null:
          stage==="INTERVIEW"?funnel?.cumulativeTotals.INTERVIEW??null:
          stage==="OFFERED"?funnel?.cumulativeTotals.OFFERED??null:
          funnel?.cumulativeTotals.HIRED??null;
         return <div key={stage} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-3">
          <p className="text-xs text-muted-foreground">{stage[0]+stage.slice(1).toLowerCase()}</p>
          <strong className={"mt-1 block text-2xl font-semibold tabular-nums "+(index===0?"text-[#0a7c88]":index===5?"text-[#3f8600]":"text-[var(--lms-heading)]")}>{value===null?"—":value.toLocaleString("en-IN")}</strong>
         </div>;
        })}
      </div>
      <p className="text-xs text-muted-foreground">Observed stage counts for this drive; transitions are never inferred from downstream offers. {counts.selected===null?"Selection count unavailable.":counts.selected+" recorded selected applicants."} {counts.offered===null?"Offer count unavailable.":counts.offered+" distinct applicants received offers."}</p>
    </section>
    {!attention?<Alert tone="info">Drive attention could not be checked. The primary drive record remains available.</Alert>:null}
    {funnel&&attention?<CollegeDrivePipelineOverview jobId={jobId} data={funnel} attention={attention}/>:null}

    <p className="text-xs text-muted-foreground leading-5">These are persisted operational counts, not a sequential funnel. No missing selection data is inferred.</p>
  </div>;
}

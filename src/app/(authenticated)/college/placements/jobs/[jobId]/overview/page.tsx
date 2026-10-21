import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getPlacementJob } from "@/modules/placements/job-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { displayDriveMetric, describeDriveMetric } from "@/modules/placements/college-drive-overview-model";
import { getCollegeDriveOverview } from "@/modules/placements/college-drive-overview-service";
import {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import {CollegeDrivePipelineOverview} from "@/components/placements/college-drive-pipeline-overview";
import {CollegeDriveDuplicateAction} from "@/components/placements/college-drive-duplicate-action";
import { Disclosure } from "@/components/ui/disclosure";

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
      action={<Link href={"/college/placements/jobs/"+encodeURIComponent(jobId)+"/overview"} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
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
  };
  const expired=drive.status==="PUBLISHED"&&drive.applicationDeadline!==null&&
    new Date(drive.applicationDeadline).getTime()<Date.now();
  const statusLabel=drive.status==="DRAFT"?"Draft":
    drive.status==="PUBLISHED"?(expired?"Expired":"Open"):
    drive.status==="CLOSED"?"Closed":
    drive.status==="CANCELLED"?"Cancelled":drive.status;
  return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title={drive.title}
      description={drive.companyName + " · " + drive.seasonName}
      actions={<div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center">
        <Link href={`/college/placements/jobs/${jobId}/applications`} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:w-auto md:min-h-9">Applications</Link>
        <Disclosure title="More actions" className="min-w-0 sm:min-w-40"><div className="flex min-w-0 flex-col items-start gap-2 pb-2">
          <Link href="/college/placements/drives" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">All drives</Link>
          <Link href={`/college/placements/jobs/${jobId}/settings`} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Edit</Link>
          <CollegeDriveDuplicateAction jobId={jobId}/>
        </div></Disclosure>
      </div>} />
    <div className="flex min-w-0 flex-wrap items-center gap-3 text-[13px] text-[var(--lms-body-text)]">
      <span className="inline-flex items-center gap-2">Status: <StatusBadge tone={expired?"warning":drive.status==="PUBLISHED"?"success":drive.status==="DRAFT"?"warning":drive.status==="CANCELLED"?"error":"neutral"}>{statusLabel}</StatusBadge></span><span>Type: {drive.employmentType}</span>
      <span>Mode: {drive.workMode}</span><span>Openings: {drive.openings ?? "Not recorded"}</span>
    </div>
    <section aria-label="Drive description" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]"><p className="max-w-[85ch] whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-[22px] text-body">{drive.description}</p></section>
    {!overview?<Alert tone="warning">Could not load pipeline metrics. The drive summary is still available; retry after reviewing the saved drive.
      <Link href={"/college/placements/jobs/"+encodeURIComponent(jobId)+"/overview"} className="ml-2 font-semibold text-link underline">Retry</Link>
    </Alert>:null}
    {!funnel?<Alert tone="warning">Could not load pipeline metrics. The hiring stage totals are unavailable, not zero.</Alert>:null}
    {!attention?<Alert tone="info">Drive attention could not be checked. The primary drive record remains available.</Alert>:null}
    <section aria-label="Drive pipeline metrics" className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] min-[768px]:grid-cols-3 min-[992px]:grid-cols-5">
      {(["applications","shortlisted","selected","offered"] as const).map(name=>
        <StatTile key={name} label={name.charAt(0).toUpperCase()+name.slice(1)}
          value={displayDriveMetric(counts[name])} detail={describeDriveMetric(name)}/>)}
      <StatTile label="Hired" value={funnel?funnel.totals.HIRED??0:"Not available"}
        detail="Applications currently at the Hired stage, not inferred joining outcomes."
        href={`/college/placements/jobs/${encodeURIComponent(jobId)}/applications?stage=HIRED`}>
        <span className="mt-2 inline-flex min-h-11 min-[768px]:min-h-9 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline">View hired candidates</span>
      </StatTile>
    </section>
    {funnel&&attention?<CollegeDrivePipelineOverview jobId={jobId} data={funnel} attention={attention}/>:null}

    <p className="text-xs text-muted-foreground leading-5">These are persisted operational counts, not a sequential funnel. No missing selection data is inferred.</p>
  </div>;
}

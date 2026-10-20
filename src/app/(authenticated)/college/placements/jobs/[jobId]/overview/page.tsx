import Link from "next/link";
import { redirect } from "next/navigation";
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
  if (!context.membership) redirect("/dashboard");
  const { jobId } = await params;
  const [{drive,counts},funnel,attention]=await Promise.all([
    getCollegeDriveOverview(context,jobId),
    getCollegeHiringFunnel(context,{jobId}),
    getCollegeDriveAttention(context),
  ]);
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
      <span className="inline-flex items-center gap-2">Status: <StatusBadge tone={drive.status==="PUBLISHED"?"success":drive.status==="DRAFT"?"warning":drive.status==="CANCELLED"?"error":"neutral"}>{drive.status}</StatusBadge></span><span>Type: {drive.employmentType}</span>
      <span>Mode: {drive.workMode}</span><span>Openings: {drive.openings ?? "Not recorded"}</span>
    </div>
    <section aria-label="Drive description" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]"><p className="max-w-[85ch] whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{drive.description}</p></section>
    <section aria-label="Drive pipeline metrics" className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] min-[768px]:grid-cols-3 min-[992px]:grid-cols-5">
      {(["applications","shortlisted","selected","offered"] as const).map(name=>
        <StatTile key={name} label={name.charAt(0).toUpperCase()+name.slice(1)}
          value={displayDriveMetric(counts[name])} detail={describeDriveMetric(name)}/>)}
      <StatTile label="Hired" value={funnel.totals.HIRED ?? 0}
        detail="Applications currently at the Hired stage, not inferred joining outcomes."
        href={`/college/placements/jobs/${encodeURIComponent(jobId)}/applications?stage=HIRED`}>
        <span className="mt-2 inline-flex min-h-11 min-[768px]:min-h-9 items-center text-[13px] font-semibold text-[var(--lms-link-text)] underline">View hired candidates</span>
      </StatTile>
    </section>
    <CollegeDrivePipelineOverview jobId={jobId} data={funnel} attention={attention}/>

    <p className="text-xs text-muted-foreground">These are persisted operational counts, not a sequential funnel. No missing selection data is inferred.</p>
  </div>;
}

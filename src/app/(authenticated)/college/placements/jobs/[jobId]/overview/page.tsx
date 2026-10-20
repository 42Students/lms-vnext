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
  return <div className="space-y-6">
    <PageHeader title={drive.title}
      description={drive.companyName + " · " + drive.seasonName}
      actions={<div className="flex flex-wrap items-center gap-3"><Link href="/college/placements/drives" className="text-link underline lms-inline-link">All drives</Link><Link href={`/college/placements/jobs/${jobId}/applications`} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 font-semibold text-link md:min-h-9 lms-inline-link">Applications</Link>
        <Link href={`/college/placements/jobs/${jobId}/settings`} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 font-semibold text-link md:min-h-9 lms-inline-link">Edit</Link>
        <CollegeDriveDuplicateAction jobId={jobId}/></div>} />
    <div className="flex flex-wrap gap-3 text-sm text-body">
      <span className="inline-flex items-center gap-2">Status: <StatusBadge tone={drive.status==="PUBLISHED"?"success":drive.status==="DRAFT"?"warning":"neutral"}>{drive.status}</StatusBadge></span><span>Type: {drive.employmentType}</span>
      <span>Mode: {drive.workMode}</span><span>Openings: {drive.openings ?? "Not recorded"}</span>
    </div>
    <p className="whitespace-pre-wrap text-body">{drive.description}</p>
    <section aria-label="Drive pipeline metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {(["applications","shortlisted","selected","offered"] as const).map(name=>
        <StatTile key={name} label={name.charAt(0).toUpperCase()+name.slice(1)}
          value={displayDriveMetric(counts[name])} detail={describeDriveMetric(name)}/>)}
      <StatTile label="Hired" value={funnel.totals.HIRED ?? 0}
        detail="Applications currently at the Hired stage, not inferred joining outcomes."
        href={`/college/placements/jobs/${encodeURIComponent(jobId)}/applications?stage=HIRED`}>
        <span className="mt-2 inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-link underline">View hired candidates</span>
      </StatTile>
    </section>
    <CollegeDrivePipelineOverview jobId={jobId} data={funnel} attention={attention}/>
    <Link href={`/college/placements/jobs/${drive.id}/shortlisted`} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9 lms-inline-link">Shortlisted</Link>
    <p className="text-xs text-muted-foreground">These are persisted operational counts, not a sequential funnel. No missing selection data is inferred.</p>
  </div>;
}

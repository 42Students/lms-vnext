import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
    <PageHeader eyebrow="College Admin · Placements" title={drive.title}
      description={drive.companyName + " · " + drive.seasonName}
      actions={<div className="flex flex-wrap items-center gap-3"><Link href="/college/placements/drives" className="text-primary-text underline">All drives</Link><Link href={`/college/placements/jobs/${jobId}/applications`} className="min-h-10 rounded border border-border px-3 py-2 font-semibold text-primary-text">Applications</Link>
        <Link href={`/college/placements/jobs/${jobId}/settings`} className="min-h-10 rounded border border-border px-3 py-2 font-semibold text-primary-text">Edit</Link>
        <CollegeDriveDuplicateAction jobId={jobId}/></div>} />
    <div className="flex flex-wrap gap-3 text-sm text-body">
      <span>Status: {drive.status}</span><span>Type: {drive.employmentType}</span>
      <span>Mode: {drive.workMode}</span><span>Openings: {drive.openings ?? "Not recorded"}</span>
    </div>
    <p className="whitespace-pre-wrap text-body">{drive.description}</p>
    <section aria-label="Drive pipeline metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(["applications","shortlisted","selected","offered"] as const).map(name=>
        <article key={name} className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold capitalize text-body">{name}</h2>
          <p className="mt-3 text-2xl font-semibold text-foreground">{displayDriveMetric(counts[name])}</p>
          <p className="mt-2 text-xs text-muted-foreground">{describeDriveMetric(name)}</p>
        </article>)}
    </section>
    <CollegeDrivePipelineOverview jobId={jobId} data={funnel} attention={attention}/>
    <Link href={`/college/placements/jobs/${drive.id}/shortlisted`} className="text-sm font-semibold text-primary-text underline">Shortlisted</Link>
    <p className="text-xs text-muted-foreground">These are persisted operational counts, not a sequential funnel. No missing selection data is inferred.</p>
  </div>;
}
